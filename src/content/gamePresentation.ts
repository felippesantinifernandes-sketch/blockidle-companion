/** Local presentation only; no network calls or item operations. Serialized into MAIN. */
export function applyGamePresentation(options:{neutral:boolean;keepActive:boolean}){
 if(location.origin!=='https://blockidle.io')return;
 const host=window as any,key='__companionPresentation';
 if(!host[key]&&!options.neutral&&!options.keepActive)return;
 const value=host[key]??(host[key]={hidden:Object.getOwnPropertyDescriptor(document,'hidden'),visibility:Object.getOwnPropertyDescriptor(document,'visibilityState'),title:document.title,links:new Map<HTMLLinkElement,string>(),neutral:false,keepActive:false});
 if(value.keepActive!==options.keepActive){
  if(options.keepActive){Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});}
  else{if(value.hidden)Object.defineProperty(document,'hidden',value.hidden);else delete(document as any).hidden;if(value.visibility)Object.defineProperty(document,'visibilityState',value.visibility);else delete(document as any).visibilityState;}
  value.keepActive=options.keepActive;document.dispatchEvent(new Event('visibilitychange'));
 }
 const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#334155"/><path d="M9 10h14v3H9zm0 6h14v3H9zm0 6h9v3H9z" fill="#cbd5e1"/></svg>');
 const paint=()=>{if(!value.neutral||!document.head)return;if(document.title!=='Painel de atividades')document.title='Painel de atividades';for(const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')){if(link.id==='companion-neutral-icon')continue;if(!value.links.has(link))value.links.set(link,link.getAttribute('href')??'');if(link.href!==icon)link.href=icon;}if(!document.getElementById('companion-neutral-icon')){const link=document.createElement('link');link.id='companion-neutral-icon';link.rel='icon';link.href=icon;document.head.append(link);}};
 value.neutral=options.neutral;
 if(options.neutral){paint();if(!value.observer){value.observer=new MutationObserver(paint);value.observer.observe(document.head??document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','rel']});}}
 else{value.observer?.disconnect();value.observer=undefined;for(const[link,href]of value.links){if(link.isConnected)link.setAttribute('href',href);}value.links.clear();document.getElementById('companion-neutral-icon')?.remove();if(document.title==='Painel de atividades')document.title=value.title;}
}
/** Use only modules the actual client already loaded. Never import remote code into extension pages. */
export async function readNativeRanking(category:string){
 try{
 const valid=['media','sb','ouro','mineracao','lenhador','cultivo','combate','pesca','encantamento','alquimia','carpintaria','domesticacao','social','slayer_revenant','slayer_tarantula','slayer_enderman'];
 if(!valid.includes(category)||!(window as any).__hudRef?.estado)throw Error('Abra o jogo conectado antes de consultar o ranking.');
 const url=location.origin+'/js/rede.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw Error('Cliente do jogo não identificado.');
 const network=await import(/* @vite-ignore */ url);let timer:ReturnType<typeof setTimeout>|undefined;const result=await Promise.race([network.ranking(category),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('O ranking demorou a responder. Tente atualizar novamente.')),15000);})]).finally(()=>clearTimeout(timer));
 if(result?.erro)throw Error(String(result.erro).slice(0,160));if(!Array.isArray(result?.ranking))throw Error('O servidor não retornou o ranking.');
 return {ok:true as const,rows:result.ranking.slice(0,100).filter((r:any)=>typeof r.nick==='string'&&typeof r.valor==='number'&&Number.isFinite(r.valor)&&r.valor>=0).map((r:any)=>({nick:r.nick.slice(0,40),value:r.valor,rank:['ouro','diamante','netherite'].includes(r.rank)?r.rank:undefined}))};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha na consulta ao ranking.'};}
}
