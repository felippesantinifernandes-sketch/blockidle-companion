import {projectState} from '../inspector/sanitizer';
const scope=crypto.randomUUID();
let cached:Record<string,unknown>|undefined,at=0,pending:ReturnType<typeof setTimeout>|undefined;
window.addEventListener('message',event=>{
 if(event.source!==window||event.origin!==location.origin||event.data?.channel!=='BLOCKIDLE_COMPANION_STATE_V1')return;
 try{cached=projectState(event.data.state);at=Date.now();if(pending!==undefined)return;
 pending=setTimeout(()=>{pending=undefined;void chrome.runtime.sendMessage({type:'COMPANION_OBSERVED',state:cached,at,scope}).catch(()=>{});},250);
 }catch{/* Only recognized state data crosses the bridge. */}
});
chrome.runtime.onMessage.addListener((msg,_sender,reply)=>{if(msg?.type==='COMPANION_CACHED_STATE')reply(cached?{ok:true,state:cached,at,scope}:{ok:false,error:'Aguardando o jogo receber /api/estado. Atualize a página do jogo depois de instalar a extensão.'});});
