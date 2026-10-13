export const STATIONS = ['Large MK 1','Large MK 2','Small MK 1','Small MK 2'];
export const CATEGORIES = ['beverages','snacks','fruit_pantry'];
export const STATUSES = ['not_checked','full','needs_restock','out_of_stock'];
export const REFILLS = ['not_needed','pending','completed','unavailable'];
export function workDate(now = new Date()) { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function validDate(d:string) {return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d+'T12:00:00Z')) && new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;}
export function refillFor(status:string, refill:string) {return ['not_checked','full'].includes(status) ? 'not_needed' : refill==='not_needed' ? 'pending' : refill;}
