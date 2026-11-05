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
export type BazaarRead={op:'resumo'}|{op:'item';id:string}|{op:'historico';id:string}|{op:'previa';lado:'c'|'v';id:string;qtd:number}|{op:'minhas'};
/** Leituras do Bazar (só GET) pelo módulo já carregado na aba. Sem compra, venda ou ordem. Serializado em MAIN: tudo fica aqui dentro. */
export async function readNativeBazaar(req:BazaarRead){
 try{
  if(!(window as any).__hudRef?.estado)throw Error('Abra o jogo conectado antes de consultar o Bazar.');
  const url=location.origin+'/js/rede.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw Error('Cliente do jogo não identificado.');
  const network=await import(/* @vite-ignore */ url);
  const id=(v:unknown)=>typeof v==='string'&&/^[a-z0-9_]{1,100}$/.test(v)?v:undefined;
  const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
  const pos=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0?v:null;
  const call=(name:string,...args:unknown[])=>{if(typeof network[name]!=='function')throw Error('Contrato do Bazar não reconhecido ('+name+').');let timer:ReturnType<typeof setTimeout>|undefined;return Promise.race([network[name](...args),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('O Bazar demorou a responder.')),15000);})]).finally(()=>clearTimeout(timer));};
  const check=(r:any)=>{if(r?.erro)throw Error(String(r.erro).slice(0,160));if(!r||typeof r!=='object')throw Error('Resposta do Bazar inválida.');return r;};
  const levels=(v:unknown)=>Array.isArray(v)?v.slice(0,40).map((l:any)=>({price:num(l?.preco),qtd:num(l?.qtd),orders:num(l?.ordens)})):[];
  if(req.op==='resumo'){
   const r=check(await call('bazarResumo')),resumo=r.resumo;if(!resumo||typeof resumo!=='object')throw Error('O servidor não retornou os preços do Bazar.');
   const prices=Object.fromEntries(Object.entries(resumo).filter(([k])=>id(k)).slice(0,5000).map(([k,v]:[string,any])=>[k,{buy:pos(v?.venda),sell:pos(v?.compra),volume:num(v?.volume)}]));
   let categories:{name:string;items:string[]}[]=[],tax:number|null=null,maxOrders:number|null=null;
   try{const c=await import(/* @vite-ignore */ location.origin+'/js/catalogo.js');if(Array.isArray(c.BAZAR_CATEGORIAS))categories=c.BAZAR_CATEGORIAS.slice(0,60).map((x:any)=>({name:String(x?.nome??x?.id??'').slice(0,40),items:Array.isArray(x?.itens)?x.itens.filter(id).slice(0,500):[]}));tax=num(c.BAZAR_TAXA);maxOrders=num(c.BAZAR_MAX_ORDENS);}catch{/* sem categorias */}
   return {ok:true as const,prices,categories,tax,maxOrders};
  }
  if(req.op==='item'){const r=check(await call('bazarItem',req.id));return {ok:true as const,item:req.id,asks:levels(r.vendas),bids:levels(r.compras),trades:Array.isArray(r.negocios)?r.negocios.slice(0,30).map((t:any)=>({qtd:num(t?.qtd),price:num(t?.preco),at:num(t?.em)})):[]};}
  if(req.op==='historico'){const r=check(await call('bazarHistorico',req.id,'24h'));return {ok:true as const,item:req.id,bands:Array.isArray(r.faixas)?r.faixas.slice(0,48).map((f:any)=>({from:num(f?.de),avg:num(f?.medio),volume:num(f?.vol),min:num(f?.min),max:num(f?.max)})):[]};}
  if(req.op==='previa'){const r=check(await call('bazarPrevia',req.lado,req.id,Math.max(1,Math.floor(req.qtd))));return {ok:true as const,preview:{side:req.lado,item:req.id,qtd:num(r.qtd),missing:num(r.falta),total:num(r.total),avg:num(r.medio),best:num(r.melhor),worst:num(r.pior),net:num(r.liquido),tax:num(r.taxa)}};}
  const r=check(await call('bazarMinhas'));
  const orders=Array.isArray(r.ordens)?r.ordens.slice(0,40).flatMap((o:any)=>id(o?.item)&&Number.isInteger(o?.id)?[{id:o.id,side:o.lado==='v'?'v':'c',item:o.item,qtd:num(o.qtd),remaining:num(o.restante),price:num(o.preco)}]:[]):[];
  const claim=r.aReceber&&typeof r.aReceber==='object'?Object.fromEntries(Object.entries(r.aReceber).filter(([k,v])=>(k==='ouro'||id(k))&&typeof v==='number'&&v>0).slice(0,200)):{};
  return {ok:true as const,orders,claim};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha na consulta ao Bazar.'};}
}
