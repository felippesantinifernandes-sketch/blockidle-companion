import {forgeAlertTasks,mergeForgeAlerts,type ForgeAlert} from '../core/forgeAlerts';
import {readPreferences} from '../db/preferences';
import type {GameState} from '../core/types';
import {itemName} from '../catalog/itemCatalog';
const key='blockidle.forge-alerts.v1',prefix='blockidle.forge.';
let queue=Promise.resolve(),listening=false,clickListening=false;
const serialized=(fn:()=>Promise<void>)=>{queue=queue.then(fn).catch(()=>{});return queue;};
const canNotify=async()=>{try{return await chrome.permissions.contains({permissions:['alarms','notifications']});}catch{return false;}};
const read=async():Promise<ForgeAlert[]>=>{const value=(await chrome.storage.local.get(key))[key];return Array.isArray(value)?value:[];};
async function reconcileAlarms(rows:ForgeAlert[]){
 if(!chrome.alarms)return;
 const pending=rows.filter(r=>!r.delivered&&!r.error),names=new Set(pending.map(r=>prefix+r.key));
 for(const alarm of await chrome.alarms.getAll())if(alarm.name.startsWith(prefix)&&!names.has(alarm.name))await chrome.alarms.clear(alarm.name);
 for(const row of pending){const name=prefix+row.key,existing=await chrome.alarms.get(name);if(!existing)await chrome.alarms.create(name,{when:Math.max(Date.now()+1000,row.finish)});}
}
export function restoreForgeNotifications(){return serialized(async()=>{
 const prefs=await readPreferences();if(!await canNotify()||!prefs.forgeNotifications){if(chrome.alarms)for(const alarm of await chrome.alarms.getAll())if(alarm.name.startsWith(prefix))await chrome.alarms.clear(alarm.name);return;}
 attachAlarmListener();await reconcileAlarms(await read());
});}
export function syncForgeNotifications(tabId:number,state:GameState){return serialized(async()=>{
 if(!(await readPreferences()).forgeNotifications||!await canNotify())return;
 attachAlarmListener();const rows=mergeForgeAlerts(await read(),forgeAlertTasks(state,tabId),tabId);
 await chrome.storage.local.set({[key]:rows});await reconcileAlarms(rows);
});}
function attachAlarmListener(){
 if(!clickListening&&chrome.notifications){clickListening=true;chrome.notifications.onClicked.addListener(id=>{if(id.startsWith(prefix))void chrome.tabs.create({url:chrome.runtime.getURL('index.html#forja')});});}
 if(listening||!chrome.alarms)return;listening=true;
 chrome.alarms.onAlarm.addListener(alarm=>{if(!alarm.name.startsWith(prefix))return;void serialized(async()=>{
  if(!(await readPreferences()).forgeNotifications||!await canNotify())return;
  const rows=await read(),row=rows.find(r=>prefix+r.key===alarm.name);if(!row||row.delivered)return;
  if(row.finish>Date.now()){await chrome.alarms.create(alarm.name,{when:row.finish});return;}
  try{await chrome.notifications.create(alarm.name,{type:'basic',iconUrl:chrome.runtime.getURL('icons/128.png'),title:'Prazo da Forja atingido',message:itemName(row.itemId)+': confira no jogo se a preparação está pronta para retirar.'});row.delivered=true;row.deliveredAt=Date.now();delete row.error;}catch{row.error='O navegador não conseguiu exibir o aviso. Confira a fila no jogo.';}
  await chrome.storage.local.set({[key]:rows});
 });});
}
export function initializeForgeNotifications(){
 attachAlarmListener();void restoreForgeNotifications();
 chrome.permissions.onAdded.addListener(()=>void restoreForgeNotifications());
 chrome.permissions.onRemoved.addListener(()=>void restoreForgeNotifications());
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes['blockidle.preferences.v1'])void restoreForgeNotifications();});
 chrome.runtime.onStartup.addListener(()=>void restoreForgeNotifications());
 chrome.runtime.onInstalled.addListener(()=>void restoreForgeNotifications());
}
