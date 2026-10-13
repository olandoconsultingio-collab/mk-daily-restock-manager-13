import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { STATIONS,CATEGORIES,STATUSES,REFILLS,workDate,validDate,refillFor } from '../../../lib/domain';
export const dynamic = 'force-dynamic';
const json=(x:any,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
async function auth(request:Request,write=false) {
 if(!await getChatGPTUser()) return json({error:'Sign in to access your restock manager.'},401);
 if(write && request.headers.get('origin')!==new URL(request.url).origin) return json({error:'Invalid request origin.'},403);
 if(!env.DB) return json({error:'Database is not connected.'},503);
}
async function snapshot(date:string){
 const db=env.DB!; const {results}=await db.prepare('SELECT * FROM products WHERE active=1').all<any>();
 const queries=[db.prepare('INSERT OR IGNORE INTO workdays(date,created_at) VALUES (?,?)').bind(date,new Date().toISOString())];
 for(const p of results) for(const s of JSON.parse(p.stations)) queries.push(db.prepare('INSERT OR IGNORE INTO inspections(id,date,station,product,name,category) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),date,s,p.id,p.name,p.category));
 await db.batch(queries);
}
export async function GET(request:Request){
 const denied=await auth(request); if(denied)return denied;
 try {const today=workDate(),date=new URL(request.url).searchParams.get('date')||today;
 if(!validDate(date)||date>today)return json({error:'Choose today or an earlier date.'},400);
 if(date===today)await snapshot(date);
 const db=env.DB!;
 const [p,i,s,d]=await Promise.all([db.prepare('SELECT * FROM products ORDER BY active DESC,name COLLATE NOCASE').all(),db.prepare('SELECT * FROM inspections WHERE date=? ORDER BY station,category,name COLLATE NOCASE').bind(date).all(),db.prepare('SELECT * FROM shortages WHERE resolved_at IS NULL ORDER BY date').all(),db.prepare('SELECT w.date,COUNT(i.id) total,SUM(CASE WHEN i.status<>\'not_checked\' THEN 1 ELSE 0 END) checked,SUM(CASE WHEN i.refill=\'completed\' THEN 1 ELSE 0 END) completed FROM workdays w LEFT JOIN inspections i ON i.date=w.date GROUP BY w.date ORDER BY w.date DESC LIMIT 90').all()]);
 return json({today,date,products:p.results.map((x:any)=>({...x,stations:JSON.parse(x.stations)})),inspections:i.results,shortages:s.results,history:d.results});
 }catch(e){console.error(e);return json({error:'Unable to load records. Please try again.'},500);}
}
export async function POST(request:Request){
 const denied=await auth(request,true);if(denied)return denied;
 try{ const b:any=await request.json(),db=env.DB!,now=new Date().toISOString();
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid request body.'},400);
 if(b.action==='product'){
 const name=String(b.name||'').trim(),stations=b.stations;
 if(!name||name.length>100||!CATEGORIES.includes(b.category)||!Array.isArray(stations)||!stations.length||stations.some((x:string)=>!STATIONS.includes(x))||new Set(stations).size!==stations.length)return json({error:'Enter a product name, category and at least one station.'},400);
 const existing=await db.prepare('SELECT id FROM products WHERE lower(name)=lower(?) AND id<>?').bind(name,b.id||'').first();if(existing)return json({error:'A product with this name already exists.'},409);
 if(b.id){const p=await db.prepare('SELECT id FROM products WHERE id=?').bind(b.id).first();if(!p)return json({error:'Product not found.'},404);await db.prepare('UPDATE products SET name=?,category=?,stations=? WHERE id=?').bind(name,b.category,JSON.stringify(stations),b.id).run();}
 else await db.prepare('INSERT INTO products(id,name,category,stations) VALUES (?,?,?,?)').bind(crypto.randomUUID(),name,b.category,JSON.stringify(stations)).run();
 }else if(b.action==='archive'){
 if(![0,1].includes(b.active))return json({error:'Invalid product state.'},400);await db.prepare('UPDATE products SET active=? WHERE id=?').bind(b.active,b.id).run();
 }else if(b.action==='inspect'){
 const i=await db.prepare('SELECT * FROM inspections WHERE id=?').bind(b.id).first<any>();if(!i)return json({error:'Inspection not found.'},404);
 if(i.date!==workDate())return json({error:'Past inspections are read-only.'},409);
 const status=b.status??i.status,refill=b.refill??i.refill,note=String(b.note??i.note).trim();
 if(!STATUSES.includes(status)||!REFILLS.includes(refill)||note.length>500)return json({error:'Invalid inspection update.'},400);
 const state=refillFor(status,refill);
 const q=[db.prepare('UPDATE inspections SET status=?,refill=?,note=?,updated_at=? WHERE id=?').bind(status,state,note,now,i.id)];
 if(state==='unavailable')q.push(db.prepare('INSERT INTO shortages(id,inspection,date,name,station,note,resolved_at) VALUES (?,?,?,?,?,?,NULL) ON CONFLICT(inspection) DO UPDATE SET note=excluded.note,resolved_at=NULL').bind(crypto.randomUUID(),i.id,i.date,i.name,i.station,note));
 if(state==='completed'||status==='full')q.push(db.prepare('UPDATE shortages SET resolved_at=? WHERE inspection=? AND resolved_at IS NULL').bind(now,i.id));
 await db.batch(q);
 }else if(b.action==='resolve')await db.prepare('UPDATE shortages SET resolved_at=? WHERE id=?').bind(now,b.id).run();
 else return json({error:'Unknown action.'},400);
 return json({ok:true});
 }catch(e){console.error(e);return json({error:'Unable to save. Your previous records are unchanged; please retry.'},500);}
}
