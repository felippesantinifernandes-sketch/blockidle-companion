import {readPreferences} from '../db/preferences';
import {normalize} from '../core/normalizer';
import {stateEvents,nextDragon,nextAuction,fallbackRareLots,type NotifyEvent,type NotifyKind} from '../core/notifications';
import {readNativeAuction,readNativeBazaar} from '../content/gamePresentation';
import {itemName} from '../catalog/itemCatalog';
import type {GameState} from '../core/types';

const prefix='blockidle.notify.',DRAGON=prefix+'dragon',AUCTION=prefix+'auction',BAZAAR=prefix+'bazaar',seen=prefix+'seen';
const last=new Map<number,GameState>();
const canNotify=async()=>{try{return !!chrome.notifications&&await chrome.permissions.contains({permissions:['alarms','notifications']});}catch{return false;}};
async function allowed(kind:NotifyKind){const p=(await readPreferences()).notify;return p.enabled&&p[kind]&&await canNotify();}
export async function notify(e:NotifyEvent){if(!await allowed(e.kind))return;try{await chrome.notifications.create(prefix+e.kind+'.'+Date.now(),{type:'basic',iconUrl:chrome.runtime.getURL('icons/128.png'),title:e.title,message:e.message});}catch{/* o navegador recusou o aviso */}}
/** Chamado a cada retrato novo (resposta observada, leitura do HUD ou ação). */
export function observeState(tabId:number,raw:Record<string,unknown>){
 let next:GameState;try{next=normalize(raw,'live');}catch{return;}
 const prev=last.get(tabId);last.set(tabId,next);
 for(const e of stateEvents(prev,next))void notify(e);
}
const gameTabId=async()=>{try{const saved=(await chrome.storage.session.get('companionGameTab')).companionGameTab;if(Number.isInteger(saved)){const t=await chrome.tabs.get(saved).catch(()=>undefined);if(t?.url?.startsWith('https://blockidle.io/play'))return t.id;}const tabs=await chrome.tabs.query({url:'https://blockidle.io/play*'});return tabs.length===1?tabs[0].id:undefined;}catch{return undefined;}};
async function schedule(){
 if(!chrome.alarms)return;const p=(await readPreferences()).notify,ok=p.enabled&&await canNotify(),now=Date.now();
 const set=async(name:string,on:boolean,when:number,period?:number)=>{const has=await chrome.alarms.get(name);if(!on){if(has)await chrome.alarms.clear(name);return;}if(!has)await chrome.alarms.create(name,period?{when,periodInMinutes:period}:{when});};
 await set(DRAGON,ok&&p.dragon,Math.max(now+1000,nextDragon(now)-5*60000));
 await set(AUCTION,ok&&p.auction,nextAuction(now)+30000);
 await set(BAZAAR,ok&&p.bazaar,now+60000,5);
}
async function onAlarm(name:string){
 if(name===DRAGON){await chrome.alarms.clear(DRAGON);if(await allowed('dragon'))await notify({kind:'dragon',title:'Dragão em 5 minutos',message:'O Dragão do End nasce às '+new Date(nextDragon(Date.now())).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.'});await schedule();return;}
 if(name===AUCTION){await chrome.alarms.clear(AUCTION);const tab=await gameTabId();if(tab!==undefined&&await allowed('auction')){try{const [r]=await chrome.scripting.executeScript({target:{tabId:tab},world:'MAIN',func:readNativeAuction,args:[]});const d=r?.result;if(d?.ok){const rare=new Set(d.rare.length?d.rare:fallbackRareLots),hits=d.lots.filter((id:string)=>rare.has(id));if(hits.length)await notify({kind:'auction',title:'Dark Auction com lote raro',message:hits.map(itemName).join(', ')+'. O leilão fecha aos :55.'});}}catch{/* aba indisponível */}}await schedule();return;}
 if(name===BAZAAR){const tab=await gameTabId();if(tab===undefined||!await allowed('bazaar'))return;try{const [r]=await chrome.scripting.executeScript({target:{tabId:tab},world:'MAIN',func:readNativeBazaar,args:[{op:'minhas'}]});const d=r?.result as {ok:boolean;claim?:Record<string,number>}|undefined;if(!d?.ok)return;const key=JSON.stringify(Object.keys(d.claim??{}).sort()),before=(await chrome.storage.session.get(seen))[seen];await chrome.storage.session.set({[seen]:key});if(key!=='[]'&&key!==before)await notify({kind:'bazaar',title:'Bazar: algo para resgatar',message:Object.entries(d.claim??{}).map(([k,v])=>v+' '+(k==='ouro'?'de ouro':itemName(k))).join(', ')+'.'});}catch{/* aba indisponível */}}
}
export function initializeGameNotifications(){
 if(chrome.alarms)chrome.alarms.onAlarm.addListener(a=>{if(a.name.startsWith(prefix))void onAlarm(a.name);});
 chrome.notifications?.onClicked.addListener(id=>{if(id.startsWith(prefix))void chrome.tabs.create({url:chrome.runtime.getURL('index.html')});});
 void schedule();
 chrome.permissions.onAdded.addListener(()=>void schedule());chrome.permissions.onRemoved.addListener(()=>void schedule());
 chrome.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c['blockidle.preferences.v1'])void schedule();});
 chrome.runtime.onStartup.addListener(()=>void schedule());chrome.runtime.onInstalled.addListener(()=>void schedule());
 chrome.runtime.onMessage.addListener((msg,sender)=>{if(sender.id!==chrome.runtime.id||!sender.url?.startsWith(chrome.runtime.getURL(''))||msg?.type!=='COMPANION_NOTIFY_AREA')return;if(typeof msg.message==='string')void notify({kind:'areaRule',title:'Regra de área aplicada',message:msg.message.slice(0,200)});});
}
