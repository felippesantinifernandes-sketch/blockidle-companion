import {reviewFingerprint} from './objectives';
import type {GameState} from './types';
export interface ForgeAlert {key:string;tabId:number;itemId:string;finish:number;delivered:boolean;deliveredAt?:number;error?:string}
export function forgeAlertTasks(state:GameState,tabId:number):ForgeAlert[]{
 const occurrences=new Map<string,number>();
 return (Array.isArray(state.progress.forja)?state.progress.forja:[]).flatMap((task:any)=>{
  if(!task||typeof task.id!=='string'||!/^[a-z0-9_]{1,100}$/.test(task.id)||!Number.isSafeInteger(task.fim)||task.fim<1)return[];
  const identity=task.id+':'+task.fim,index=occurrences.get(identity)??0;occurrences.set(identity,index+1);
  return[{key:reviewFingerprint([tabId,identity,index]),tabId,itemId:task.id,finish:task.fim,delivered:false}];
 });
}
export function mergeForgeAlerts(old:ForgeAlert[],incoming:ForgeAlert[],tabId:number,now=Date.now()){
 const current=new Set(incoming.map(t=>t.key));
 const kept=old.filter(t=>t.finish>now-7*86400000&&(t.tabId!==tabId||current.has(t.key)||t.delivered));
 return [...kept,...incoming.filter(t=>!kept.some(k=>k.key===t.key))].slice(-200);
}
