import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'MK Daily Restock Manager',description:'Inspect four MK stations, organize refills and track storage shortages.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
