import {readPreferences} from '../db/preferences';
import {refreshNativeState} from '../content/nativeCommands';
import {allowed,projectState} from '../inspector/sanitizer';

/** Sincronização a cada 5 minutos (A3). Só leitura: com a aba do jogo, pelo módulo dela; sem a aba, um GET /api/estado. */
export const SYNC_ALARM='blockidle.sync',LAST_KEY='blockidle.server-state.v1';
const tabFor=async()=>{const tabs=await chrome.tabs.query({url:'https://blockidle.io/play*'});return tabs.length===1?tabs[0].id:undefined;};
/** Identificador próprio da extensão para o cabeçalho x-bi-aba (10 caracteres, como o do cliente). */
async function ownTab(){const k='blockidle.aba';const v=(await chrome.storage.local.get(k))[k];if(typeof v==='string'&&/^[a-z0-9]{10}$/.test(v))return v;const id=[...crypto.getRandomValues(new Uint8Array(10))].map(b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');await chrome.storage.local.set({[k]:id});return id;}
export async function syncOnce(remember:(tabId:number,entry:{state:Record<string,unknown>;at:number;scope:string;observation?:'hud'|'response'})=>void,scopeOf:(tabId:number)=>string|undefined){
 const tab=await tabFor();
 if(tab!==undefined){const [r]=await chrome.scripting.executeScript({target:{tabId:tab},world:'MAIN',func:refreshNativeState,args:[allowed]});if(r?.result){const state=projectState(r.result);remember(tab,{state,at:Date.now(),scope:scopeOf(tab)??'',observation:'hud'});await chrome.storage.local.set({[LAST_KEY]:{state,at:Date.now(),via:'tab'}});}return;}
 const res=await fetch('https://blockidle.io/api/estado',{method:'GET',credentials:'include',headers:{'content-type':'application/json','x-bi':'1','x-bi-aba':await ownTab()}});
 if(!res.ok){await chrome.storage.local.set({[LAST_KEY+'.error']:{at:Date.now(),status:res.status}});return;}
 const body=await res.json();if(!body?.estado)return;const state=projectState(body);
 await chrome.storage.local.set({[LAST_KEY]:{state,at:Date.now(),via:'server'}});remember(-1,{state,at:Date.now(),scope:'server',observation:'response'});
}
async function schedule(){if(!chrome.alarms)return;const p=await readPreferences();let ok=false;try{ok=await chrome.permissions.contains({permissions:['alarms']});}catch{/* sem permissão */}const has=await chrome.alarms.get(SYNC_ALARM);if(!(ok&&p.backgroundSync)){if(has)await chrome.alarms.clear(SYNC_ALARM);return;}if(!has)await chrome.alarms.create(SYNC_ALARM,{delayInMinutes:1,periodInMinutes:5});}
export function initializeBackgroundSync(remember:Parameters<typeof syncOnce>[0],scopeOf:Parameters<typeof syncOnce>[1]){
 if(chrome.alarms)chrome.alarms.onAlarm.addListener(a=>{if(a.name===SYNC_ALARM)void syncOnce(remember,scopeOf).catch(()=>{});});
 void schedule();chrome.permissions.onAdded.addListener(()=>void schedule());chrome.permissions.onRemoved.addListener(()=>void schedule());
 chrome.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c['blockidle.preferences.v1'])void schedule();});
 chrome.runtime.onStartup.addListener(()=>void schedule());chrome.runtime.onInstalled.addListener(()=>void schedule());
}
