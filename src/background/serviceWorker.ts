import{initializeForgeNotifications,syncForgeNotifications,restoreForgeNotifications}from'./forgeNotifications';
import {objectivePlan,goalCommandBlock,goalSnapshot} from '../core/objectives';
import type {NativeCommand} from '../core/types';
import{craftRecipes}from'../core/workbench';
import {allowed,projectState,sanitize} from '../inspector/sanitizer';
import {readNativeHud,runNativeCommand,refreshNativeState} from '../content/nativeCommands';
import {commandSchema} from '../api/commands';
import {readPreferences} from '../db/preferences';
import {normalize} from '../core/normalizer';
import {commandProtection} from '../core/transformations';
import {recipes} from '../catalog/itemCatalog';
import {observedBuild} from '../core/versionMonitor';
const cache=new Map<number,{state:Record<string,unknown>;at:number;scope:string;observation?:'hud'|'response'}>();
initializeForgeNotifications();
const remember=(id:number,entry:{state:Record<string,unknown>;at:number;scope:string;observation?:'hud'|'response'})=>{cache.set(id,entry);void syncForgeNotifications(id,normalize(entry.state,'live'));};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes['blockidle.preferences.v1']){void restoreForgeNotifications();for(const[id,entry]of cache)void syncForgeNotifications(id,normalize(entry.state,'live'));}});
const busy=new Set<number>(),uncertain=new Set<number>(),requests=new Set<string>();
const pendingKey=(id:number)=>'blockidle.pending.'+id;
const pending=async(id:number,scope:string)=>(await chrome.storage.session.get(pendingKey(id)))[pendingKey(id)]?.scope===scope;
const markPending=(id:number,scope:string)=>chrome.storage.session.set({[pendingKey(id)]:{scope,at:Date.now()}});
const clearPending=(id:number)=>chrome.storage.session.remove(pendingKey(id));
const game=(url?:string)=>{try{return new URL(url??'').origin==='https://blockidle.io';}catch{return false;}};
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});
chrome.tabs.onRemoved.addListener(id=>{cache.delete(id);busy.delete(id);uncertain.delete(id);void clearPending(id);});
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.url||change.status==='loading'){cache.delete(id);uncertain.delete(id);}});
async function active(){const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(!tab?.id||!game(tab.url))throw new Error('Abra a aba do Blockidle nesta janela para conectar.');return tab.id;}
async function read(tabId:number){let entry=cache.get(tabId);if(!entry){const result=await chrome.tabs.sendMessage(tabId,{type:'COMPANION_CACHED_STATE'});if(!result?.ok)throw new Error(result?.error??'Aguardando estado. Recarregue a aba do jogo.');entry={state:projectState(result.state),at:result.at,scope:String(result.scope??'')};}
 try{const [result]=await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:readNativeHud,args:[allowed]});if(result?.result){const raw=projectState(result.result);if(raw.versao===undefined&&entry.state.versao!==undefined)raw.versao=entry.state.versao;entry={...entry,state:raw,at:Date.now(),observation:'hud'};}}
 catch{/* Existing response cache remains usable for reading if HUD is unavailable. */}
 remember(tabId,entry);return entry;
}
async function log(command:unknown,result:{ok:boolean;uncertain?:boolean;error?:string;changed?:number}){try{const key='blockidle.actions.v1',all=(await chrome.storage.local.get(key))[key];await chrome.storage.local.set({[key]:[...(Array.isArray(all)?all:[]),sanitize({at:Date.now(),command,status:result.ok?'confirmed':result.uncertain?'uncertain':'rejected',changed:result.changed,error:result.error})].slice(-100)});}catch{/* Logging failure never repeats a transaction. */}}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 if(sender.id!==chrome.runtime.id)return;
 if(msg?.type==='COMPANION_OBSERVED'&&sender.tab?.id!==undefined&&game(sender.url)){try{remember(sender.tab.id,{state:projectState(msg.state),at:msg.at,scope:String(msg.scope??''),observation:'response'});reply({ok:true});}catch{reply({ok:false});}return;}
 if(!sender.url?.startsWith(chrome.runtime.getURL(''))||!['COMPANION_READ_ACTIVE','COMPANION_MANUAL','COMPANION_RECONCILE'].includes(msg?.type))return;
 void(async()=>{let tabId:number|undefined,locked=false;try{
  tabId=await active();const entry=await read(tabId);
  if(msg.type==='COMPANION_READ_ACTIVE'){reply({ok:true,...entry,tabId});return;}
  if(msg.tabId!==tabId||msg.scope!==entry.scope)throw new Error('A aba ou a sessão mudou. Reconecte antes de agir.');
  if(msg.type==='COMPANION_RECONCILE'){if(busy.has(tabId))throw new Error('Aguarde a operação terminar.');const [fresh]=await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:refreshNativeState,args:[allowed]});if(!fresh?.result)throw new Error('Não foi possível confirmar o estado no servidor.');const next={state:projectState(fresh.result),at:Date.now(),scope:entry.scope,observation:'hud' as const};remember(tabId,next);uncertain.delete(tabId);await clearPending(tabId);reply({ok:true,...next,tabId});return;}
  if(busy.has(tabId))throw new Error('Já existe uma ação em andamento nesta aba.');
  if(uncertain.has(tabId)||await pending(tabId,entry.scope)){reply({ok:false,uncertain:true,error:'O resultado anterior precisa de revisão. Use Revisar estado antes de continuar.'});return;}
  if(typeof msg.requestId!=='string'||!/^[-a-f0-9]{36}$/.test(msg.requestId)||requests.has(msg.requestId))throw new Error('Comando duplicado ou identificador inválido. Nenhuma repetição será feita.');
  const requested=commandSchema.parse(msg.command);let command:NativeCommand;const state=normalize(entry.state,'live'); state.scope=entry.scope;state.tabId=tabId;
  const prefs=await readPreferences();const goals=objectivePlan(state,prefs);
  if(requested.kind==='goalStep'){if(requested.review!==goals.review)throw new Error('O estoque, a fila ou os objetivos mudaram. Atualize e revise a etapa novamente.');const step=goals.goals.find(g=>g.objective.id===requested.goalId)?.steps.find(s=>s.id===requested.stepId);if(!step?.command||step.reasons.length)throw new Error('Esta etapa ainda não está liberada no planejamento atual.');command=step.command;}else{const block=goalCommandBlock(requested,state,prefs,goals);if(block)throw new Error(block);command=requested;}
  if(state.build!==observedBuild)throw new Error('Ações no jogo suspensas: build atual não validado para este adaptador.');
  const blocked=command.kind==='goalTransform'?undefined:commandProtection(command,state,prefs);if(blocked)throw new Error(blocked);
  const workbench=command.kind==='craft'?craftRecipes.find(r=>r.id===command.recipeId):undefined;if(command.kind==='craft'&&!workbench)throw new Error('Receita da bancada não validada.');
  const recipe=(command.kind==='transform'||command.kind==='goalTransform')?recipes.find(r=>r.id===command.recipeId):undefined;
  if((command.kind==='transform'||command.kind==='goalTransform')&&!recipe)throw new Error('Receita não encontrada no catálogo validado.');
  const recipeIds=command.kind==='compactor'?[command.itemId]:command.kind==='profile'?command.itemIds:[];
  if(recipeIds.some(id=>!recipes.some(r=>r.id===id&&(r.compactable||r.kind==='lapidary'))))throw new Error('O item não possui receita de Compactador Pessoal.');
  const protectedIds=[...new Set([...prefs.favorites,...prefs.protectedItems,...Object.entries(prefs.reserves).filter(([,q])=>q>0).map(([id])=>id),...prefs.policies.filter(p=>p.enabled&&(p.action==='protect'||p.minimumReserve>0)).map(p=>p.itemId),...prefs.groups.flatMap(g=>g.protectedItemIds),...(requested.kind!=='goalStep'&&requested.kind!=='compactor'&&requested.kind!=='profile'&&prefs.preserveGoalMaterials?Object.keys(goals.claims):[])])];
  if(await active()!==tabId)throw new Error('A aba ativa mudou antes da execução.');
  requests.add(msg.requestId);if(requests.size>200)requests.delete(requests.values().next().value!);busy.add(tabId);locked=true;await markPending(tabId,entry.scope);
  const [execution]=await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:runNativeCommand,args:[{command,fields:allowed,build:observedBuild,protectedIds,...(requested.kind==='goalStep'?{goalGuard:goalSnapshot(state,goals)}:{}),...(workbench?{workbench}:{}),...(recipe?{recipe:{id:recipe.id,input:Object.keys(recipe.ingredients)[0],ratio:Object.values(recipe.ingredients)[0],kind:recipe.kind??'compact'}}:{})}]});
  const result=execution?.result;if(!result)throw new Error('A ação não devolveu um resultado. Revise o jogo antes de continuar.');
  if(result.raw)remember(tabId,{state:projectState(result.raw),at:Date.now(),scope:entry.scope,observation:'hud'});
  if(result.uncertain)uncertain.add(tabId);else await clearPending(tabId);await log(requested,result);
  const after=cache.get(tabId);reply({...result,raw:undefined,...(after?{state:after.state,at:after.at,scope:after.scope,tabId}:{}),requestId:msg.requestId});
 }catch(e){if(locked&&tabId!==undefined)uncertain.add(tabId);const error=e instanceof Error?e.message:'Não foi possível concluir a ação.';if(locked)await log(msg.command,{ok:false,uncertain:true,error});reply({ok:false,error,uncertain:locked});}
 finally{if(locked&&tabId!==undefined)busy.delete(tabId);}})();return true;
});
