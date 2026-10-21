import {applyGamePresentation,readNativeRanking} from '../content/gamePresentation';import {readPreferences} from '../db/preferences';
const origin='https://blockidle.io',extension=()=>chrome.runtime.getURL('');
const isGame=(url?:string)=>{try{return new URL(url??'').origin===origin;}catch{return false;}};
export async function gameTab(readOnly=false){
 const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
 if(tab?.id&&isGame(tab.url)){await chrome.storage.session.set({companionGameTab:tab.id});return tab.id;}
 if(!tab?.url?.startsWith(extension()))throw Error('Abra o jogo ou a página própria do Companion para conectar.');
 const saved=(await chrome.storage.session.get('companionGameTab')).companionGameTab;
 let chosen:chrome.tabs.Tab|undefined;if(Number.isInteger(saved))chosen=await chrome.tabs.get(saved).catch(()=>undefined);
 if(!chosen?.id||!isGame(chosen.url)){const candidates=await chrome.tabs.query({url:origin+'/play*'});if(candidates.length!==1)throw Error('Selecione a aba do jogo na tela Jogo.');chosen=candidates[0];}
 if(!chosen.id)throw Error('Aba do jogo indisponível.');
 if(!readOnly){await chrome.windows.update(chosen.windowId,{focused:true});await chrome.tabs.update(chosen.id,{active:true});}
 return chosen.id;
}
const discardKey=(id:number)=>'companionOriginalDiscard.'+id;
async function apply(tab:chrome.tabs.Tab){if(!tab.id||!isGame(tab.url))return;const {gameOptions}=await readPreferences(),key=discardKey(tab.id),saved=(await chrome.storage.session.get(key))[key];if(gameOptions.preventDiscard){if(typeof saved!=='boolean')await chrome.storage.session.set({[key]:tab.autoDiscardable!==false});await chrome.tabs.update(tab.id,{autoDiscardable:false});}else if(typeof saved==='boolean'){await chrome.tabs.update(tab.id,{autoDiscardable:saved});await chrome.storage.session.remove(key);}await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:applyGamePresentation,args:[gameOptions]});}
async function applyAll(){const tabs=await chrome.tabs.query({url:origin+'/*'});await Promise.allSettled(tabs.map(apply));const {gameOptions}=await readPreferences();if(gameOptions.neutral){const canvas=new OffscreenCanvas(32,32),ctx=canvas.getContext('2d')!;ctx.fillStyle='#334155';ctx.fillRect(0,0,32,32);ctx.fillStyle='#cbd5e1';ctx.fillRect(8,9,16,3);ctx.fillRect(8,16,16,3);ctx.fillRect(8,23,10,3);await chrome.action.setIcon({imageData:ctx.getImageData(0,0,32,32)});await chrome.action.setTitle({title:'Painel de atividades'});}else{await chrome.action.setIcon({path:{16:'icons/16.png',32:'icons/32.png',128:'icons/128.png'}});await chrome.action.setTitle({title:'Abrir Blockidle Companion'});}}
let presentationQueue=Promise.resolve();
const schedulePresentation=(tab?:chrome.tabs.Tab)=>{presentationQueue=presentationQueue.then(()=>tab?apply(tab):applyAll()).catch(()=>{});};
export function initializeGameFeatures(){
 schedulePresentation();
 chrome.storage.onChanged.addListener((changes,area)=>{const value=changes['blockidle.preferences.v1'];if(area==='local'&&value&&JSON.stringify(value.oldValue?.gameOptions)!==JSON.stringify(value.newValue?.gameOptions))schedulePresentation();});
 chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete'&&isGame(tab.url))schedulePresentation({...tab,id});});
 chrome.tabs.onRemoved.addListener(id=>{void chrome.storage.session.remove(discardKey(id));});
 chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(sender.id!==chrome.runtime.id||!sender.url?.startsWith(extension())||!['COMPANION_GAME_TABS','COMPANION_SELECT_GAME','COMPANION_OPEN_GAME','COMPANION_RANKING'].includes(msg?.type))return;
  void(async()=>{try{
   if(msg.type==='COMPANION_GAME_TABS'){const tabs=await chrome.tabs.query({url:origin+'/play*'});reply({ok:true,tabs:tabs.map(t=>({id:t.id,windowId:t.windowId,active:t.active,discarded:t.discarded}))});return;}
   if(msg.type==='COMPANION_SELECT_GAME'){if(!Number.isInteger(msg.tabId))throw Error('Selecione uma aba válida.');const tab=await chrome.tabs.get(msg.tabId);if(!isGame(tab.url))throw Error('Essa aba não é do Blockidle.');await chrome.storage.session.set({companionGameTab:msg.tabId});reply({ok:true});return;}
   if(msg.type==='COMPANION_OPEN_GAME'){const tabs=await chrome.tabs.query({url:origin+'/play*'});let tab=tabs[0];if(tabs.length>1)throw Error('Há mais de uma aba aberta. Selecione qual usar.');if(!tab){const win=await chrome.windows.create({url:origin+'/play',type:'popup',width:1100,height:800});tab=win.tabs?.[0]!;}else{await chrome.windows.update(tab.windowId,{focused:true});await chrome.tabs.update(tab.id!,{active:true});}if(!tab?.id)throw Error('Não foi possível abrir o jogo.');await chrome.storage.session.set({companionGameTab:tab.id});reply({ok:true,tabId:tab.id});return;}
   const tabId=await gameTab(true);const [result]=await chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:readNativeRanking,args:[String(msg.category)]});const data=result?.result;if(!data?.ok)throw Error(data?.error??'Não foi possível consultar o ranking nessa aba.');reply({ok:true,rows:data.rows,at:Date.now()});
  }catch(error){reply({ok:false,error:error instanceof Error?error.message:'Não foi possível concluir.'});}})();return true;
 });
}
