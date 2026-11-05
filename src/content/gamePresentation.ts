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
/** Leitura do Dark Auction (GET /api/leilao) pela aba. Devolve só os itens dos lotes e quais o jogo marca como raros. */
export async function readNativeAuction(){
 try{
  const url=location.origin+'/js/rede.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw Error('Cliente do jogo não identificado.');
  const network=await import(/* @vite-ignore */ url);if(typeof network.leilao!=='function')throw Error('Contrato do leilão não reconhecido.');
  const r=await network.leilao();if(r?.erro)throw Error(String(r.erro).slice(0,160));
  let rare:string[]=[];try{const sys=await import(/* @vite-ignore */ location.origin+'/js/sistemas_sb.js');if(Array.isArray(sys.RAROS_LEILAO))rare=sys.RAROS_LEILAO.filter((x:unknown)=>typeof x==='string');}catch{/* usa a lista padrão */}
  const lots=Array.isArray(r?.lotes)?r.lotes.slice(0,20).flatMap((l:any)=>typeof l?.item==='string'&&/^[a-z0-9_]{1,100}$/.test(l.item)?[l.item]:[]):[];
  return {ok:true as const,round:typeof r?.rodada==='number'?r.rodada:null,lots,rare};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha na consulta ao leilão.'};}
}
/** Chaves do catálogo e do estado para o radar de mudanças. Só ids e valores pequenos de constantes. */
export async function readNativeCatalogKeys(){
 try{
  const url=location.origin+'/js/catalogo.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw Error('Cliente do jogo não identificado.');
  const c=await import(/* @vite-ignore */ url),ids=(v:unknown)=>v&&typeof v==='object'?Object.keys(v as object).filter(k=>/^[a-z0-9_]{1,100}$/.test(k)).sort().slice(0,6000):[];
  const constants:Record<string,string>={};
  for(const k of Object.keys(c).filter(k=>/^[A-Z][A-Z0-9_]*$/.test(k)&&(/VAGAS|^BAZAR_|GUARDA_ROUPA|^LAPIDAR$|^MOCHILA_SLOTS$|^PILHA_/.test(k)))){const v=c[k];if(v instanceof Set)continue;try{const t=JSON.stringify(v);if(t&&t.length<=400)constants[k]=t;}catch{/* ignora */}}
  const bazaar=c.BAZAR_ITENS instanceof Set?[...c.BAZAR_ITENS].filter((x:unknown)=>typeof x==='string').sort():[];
  const estado=(window as any).__hudRef?.estado;
  return {ok:true as const,catalog:{items:ids(c.ITENS),recipes:ids(c.RECEITAS),bazaarItems:bazaar,constants,stateKeys:estado&&typeof estado==='object'?Object.keys(estado).filter(k=>/^[A-Za-z_][\w]{0,40}$/.test(k)).sort():[]}};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha ao ler o catálogo.'};}
}
/** Calendário do jogo (sistemas_sb.js): janela atual ou próxima de cada evento. Só leitura de módulo já carregado. */
export async function readNativeEvents(){
 try{
  const url=location.origin+'/js/sistemas_sb.js';
  const sys=await import(/* @vite-ignore */ url);if(!sys.EVENTOS_SB||typeof sys.janelaEvento!=='function')throw Error('Calendário do jogo não reconhecido.');
  const now=Date.now(),events=Object.entries(sys.EVENTOS_SB).slice(0,30).flatMap(([id,e]:[string,any])=>{try{const w=sys.janelaEvento(id,now);return w&&typeof w.ini==='number'?[{id,name:String(e?.nome??id).slice(0,60),desc:String(e?.desc??'').slice(0,240),start:w.ini,end:w.fim,active:!!w.ativo}]:[];}catch{return [];}});
  return {ok:true as const,events};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha ao ler o calendário.'};}
}
/** Estado do Dragão (GET /api/dragao): fase, horário, tipo, se foi invocado e olhos no altar. Só leitura. */
export async function readNativeDragon(){
 try{
  const url=location.origin+'/js/rede.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw Error('Cliente do jogo não identificado.');
  const network=await import(/* @vite-ignore */ url);if(typeof network.dragao!=='function')throw Error('Contrato do Dragão não reconhecido.');
  const r=await network.dragao();if(r?.erro)throw Error(String(r.erro).slice(0,160));
  const d=r?.dragao&&typeof r.dragao==='object'?r.dragao:{},num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:undefined;
  return {ok:true as const,info:{phase:typeof d.fase==='string'?d.fase.slice(0,20):undefined,at:num(d.quando)??num(d.nasce)??num(d.proximo),type:typeof d.tipo==='string'?d.tipo.slice(0,30):undefined,forced:d.forcado===true,eyes:num(d.olhos)??(Array.isArray(d.olhos)?d.olhos.length:undefined)},myEyes:num(r.meusOlhos),haveEyes:num(r.olhosTenho)};
 }catch(error){return {ok:false as const,error:error instanceof Error?error.message.slice(0,240):'Falha ao ler o Dragão.'};}
}
