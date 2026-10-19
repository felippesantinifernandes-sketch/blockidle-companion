import type{CraftRecipe}from'../core/workbench';
import type {NativeCommand} from '../core/types';
export interface NativeInput {command:NativeCommand;fields:string[];build:string;protectedIds:string[];goalGuard?:Record<string,any>;workbench?:CraftRecipe;recipe?:{id:string;input:string;ratio:number;kind:string}}
export interface NativeResult {ok:boolean;error?:string;uncertain?:boolean;message?:string;changed?:number;raw?:Record<string,unknown>}

/** Serialized by chrome.scripting. Keep every runtime dependency inside this function. */
export async function readNativeHud(fields:string[]) {
 const hud=(window as unknown as {__hudRef?:{estado:Record<string,unknown>}}).__hudRef;
 if(!hud?.estado||!hud.estado.inventario)return null;
 return Object.fromEntries(fields.filter(key=>key in hud.estado).map(key=>[key,hud.estado[key]]));
}

/** One bounded GET for explicit reconciliation. ABA is the live module's tab marker, not authentication. */
export async function refreshNativeState(fields:string[]) {
 const host=window as unknown as {__hudRef?:{estado:Record<string,unknown>;aplicar?:(s:Record<string,unknown>)=>void};__companionPending?:number};
 if(location.origin!=='https://blockidle.io'||document.visibilityState!=='visible'||!host.__hudRef)throw new Error('Mantenha o jogo carregado na aba ativa.');
 if(host.__companionPending)throw new Error('A requisição anterior ainda está pendente. Aguarde antes de revisar.');
 const url=location.origin+'/js/rede.js';if(!performance.getEntriesByType('resource').some(r=>r.name===url))throw new Error('Módulo da aba não identificado.');
 const network=await import(/* @vite-ignore */ url);
 if(typeof network.ABA!=='string'||!network.ABA)throw new Error('Identificador da aba ativa não encontrado no cliente.');
 const response=await fetch('/api/estado',{method:'GET',headers:{'content-type':'application/json','x-bi':'1','x-bi-aba':network.ABA},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Não foi possível confirmar o estado no servidor (HTTP '+response.status+').');
 const result=await response.json();if(!result?.estado?.inventario||typeof result.versao!=='string')throw new Error('Resposta de estado inválida.');
 host.__hudRef.aplicar?.(result.estado);
 return {versao:result.versao,estado:Object.fromEntries(fields.filter(key=>key in result.estado).map(key=>[key,result.estado[key]]))};
}

/** Calls only the already-loaded official ESM modules, in the game's own realm/session. */
export async function runNativeCommand(input:NativeInput):Promise<NativeResult> {
 type State=Record<string,any>;
 const host=window as unknown as {__hudRef?:{estado:State;aplicar?:(s:State)=>void};__companionPending?:number};
 const projection=(state:State,build:string)=>({versao:build,estado:Object.fromEntries(input.fields.filter(k=>k in state).map(k=>[k,state[k]]))});
 let sent=false,changed=0,latest:State|undefined,build=input.build;
 const deadline=Date.now()+25000;
 const timed=async<T,>(promise:Promise<T>):Promise<T>=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Tempo de resposta esgotado.')),Math.max(1,deadline-Date.now()));})]);}
  finally{if(timer!==undefined)clearTimeout(timer);}
 };
 const fail=(error:string,uncertain=sent)=>({ok:false,error,uncertain,changed,...(latest?{raw:projection(latest,build)}:{})});
 try{
  if(location.origin!=='https://blockidle.io'||document.visibilityState!=='visible')return fail('Mantenha a aba do jogo ativa.',false);
  const hud=host.__hudRef;
  if(!hud?.estado?.inventario)return fail('O cliente oficial ainda não está pronto. Recarregue a aba.',false);
  if(host.__companionPending)return fail('Há uma requisição anterior ainda pendente. Aguarde a confirmação.',false);
  const networkUrl=location.origin+'/js/rede.js',catalogUrl=location.origin+'/js/catalogo.js';
  const resources=new Set(performance.getEntriesByType('resource').map(e=>e.name));
  if(!resources.has(networkUrl)||!resources.has(catalogUrl))return fail('Os módulos oficiais já carregados não foram identificados. Nenhuma ação enviada.',false);
  const network=await timed(import(/* @vite-ignore */ networkUrl)),catalog=await timed(import(/* @vite-ignore */ catalogUrl));
  const refresh=async()=>{
   if(typeof network.ABA!=='string'||!network.ABA)throw new Error('O módulo oficial não informou a identificação da aba ativa.');
   const response=await timed(fetch('/api/estado',{method:'GET',headers:{'content-type':'application/json','x-bi':'1','x-bi-aba':network.ABA},signal:AbortSignal.timeout(Math.max(1,deadline-Date.now()))}));
   if(!response.ok)throw new Error(response.status===401?'Sessão expirada. Entre novamente pelo próprio jogo.':'Consulta de estado recusada pelo servidor (HTTP '+response.status+').');
   const r:Record<string,any>=await timed(response.json());
   if(!r?.estado||typeof r.versao!=='string')throw new Error('Resposta de estado sem versão ou inventário validável.');
   latest=r.estado;build=r.versao;hud.aplicar?.(latest!);
   if(r.versao!==input.build)throw new Error('O build mudou; ações suspensas. Atualize o adaptador antes de continuar.');
   return r.estado as State;
  };
  let before=await refresh();
  const guard=()=>{if(document.visibilityState!=='visible'||Date.now()>=deadline)throw new Error('A aba mudou ou a ação expirou.');};
  const protectedItem=(id:string)=>input.protectedIds.includes(id);
  const invoke=async(promise:Promise<any>)=>{sent=true;host.__companionPending=(host.__companionPending??0)+1;const settled=()=>{host.__companionPending=Math.max(0,(host.__companionPending??1)-1);};void promise.then(settled,settled);const r=await timed(promise);if(!r||typeof r!=='object')throw new Error('Resposta da operação inválida.');if(r.versao&&r.versao!==input.build){build=r.versao;latest=r.estado??latest;throw new Error('O build mudou durante a ação. Revise o jogo.');}if(r.erro){if(r.estado){latest=r.estado;hud.aplicar?.(r.estado);}throw new Error(String(r.erro).slice(0,240));}return r;};
  const filters=(s:State):string[]=>{if(!Array.isArray(s.autoCompactar)||s.autoCompactar.some((id:unknown)=>typeof id!=='string'))throw new Error('Formato dos filtros do compactador não reconhecido.');return s.autoCompactar;};
  if(input.command.kind==='compactor'||input.command.kind==='profile'){
   const command=input.command,active=filters(before);
   const requested=command.kind==='compactor'?[command.itemId]:command.itemIds;
   if(new Set(requested).size!==requested.length||requested.length>12)throw new Error('Modelo com filtros duplicados ou acima do limite.');
   for(const id of requested){const base=catalog.ENCANTADOS?.[id]?.base??catalog.lapidaDe?.(id);if(!base)throw new Error('O cliente atual não reconhece esta receita no compactador.');if((command.kind==='profile'||command.enabled)&&(protectedItem(id)||protectedItem(base)))throw new Error('Item ou ingrediente protegido/reservado.');}
   const target=command.kind==='profile'?[...new Set([...active,...requested])]:command.enabled?[...new Set([...active,command.itemId])]:active.filter(id=>id!==command.itemId);
   const limit=catalog.COMPACTADOR_VAGAS?.[before.compactador];
   if(!Number.isInteger(limit)||limit<=0)throw new Error('Compactador Pessoal não encontrado no estado atual.');
   if(target.length>limit)throw new Error('O modelo ultrapassa os '+limit+' filtros do compactador. Os filtros atuais foram preservados.');
   const steps=command.kind==='profile'?requested.filter(id=>!active.includes(id)).map(id=>({id,on:true})):active.includes(command.itemId)===command.enabled?[]:[{id:command.itemId,on:command.enabled}];
   for(const [index,step] of steps.entries()){if(index)await new Promise(resolve=>setTimeout(resolve,300));guard();const r=await invoke(network.autoCompactar(step.id,step.on));if(!Array.isArray(r.autoCompactar)||r.autoCompactar.includes(step.id)!==step.on)throw new Error('O servidor não confirmou o filtro solicitado.');changed++;before=await refresh();if(filters(before).includes(step.id)!==step.on)throw new Error('O filtro não coincide com o novo estado.');}
   const final=filters(before);if([...target].sort().join('|')!==[...final].sort().join('|'))throw new Error('Os filtros finais divergem do modelo confirmado.');
   return {ok:true,message:steps.length?'Filtros confirmados no jogo.':'Os filtros já estavam configurados.',changed,raw:projection(before,build)};
  }
  const quantity=(value:unknown)=>{if(value===undefined)return 0;if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new Error('Formato de quantidade não reconhecido no estado atual.');return value;};
  const inventory=(s:State,id:string)=>quantity(s.inventario?.[id]);
  const map=(s:State,key:string):State=>key==='inventory'?s.inventario??{}:key==='terminal'?Object.fromEntries([...new Set(Object.values(s.guardado??{}).flatMap(v=>Object.keys(v as object)))].map(id=>[id,Object.entries(s.guardado??{}).filter(([k])=>k.startsWith('bau:')).reduce((n,[,v])=>n+quantity((v as State)[id]),0)])):s.guardado?.[key]??{};
  const total=(s:State,id:string)=>inventory(s,id)+Object.entries(s.guardado??{}).filter(([key])=>key==='saco'||key==='ender'||/^bolsa\d+$/.test(key)||key.startsWith('bau:')||key.startsWith('fazenda:')).reduce((n,[,value])=>n+quantity((value as State)?.[id]),0);
  if(input.goalGuard){
   const expected=input.goalGuard;
   const own=(id:string)=>id==='ouro'?quantity(before.ouro):total(before,id)+[['picareta','picaretas'],['machado','machados'],['espada','armas'],['enxada','enxadas'],['vara','varas'],['arco','arcos'],['arma',''],['compactador',''],['apagador','']].filter(([slot,list])=>before[slot]===id||Array.isArray(before[list])&&before[list].includes(id)).length+Object.values(before.armadura??{}).filter(v=>v===id).length+(before.guardado?.acessorios?.[id]===true?1:quantity(before.guardado?.acessorios?.[id]));
   const current={stock:Object.fromEntries(Object.keys(expected.stock??{}).map(id=>[id,own(id)])),forge:(before.forja??[]).map((t:State)=>[t?.id??null,t?.fim??null]),queue:(before.fila??[]).map((t:State)=>[t?.tipo??null,t?.receita??t?.id??null,t?.vezes??1]),active:before.alvo&&typeof before.alvo==='object'?[before.alvo.tipo??null,before.alvo.receita??before.alvo.id??null,before.alvo.vezes??1]:[]};
   const stable=(value:any):any=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
   if(JSON.stringify(stable(current))!==JSON.stringify(stable(expected)))throw new Error('O estoque ou a fila mudou no servidor. Atualize e revise a etapa novamente.');
  }
  const withdraw=async(pulls:{storageId:string;itemId:string;quantity:number}[],initial:State)=>{let before=initial;
   for(const p of pulls){const chest=/^bau:(-?\d+),(-?\d+),(-?\d+)$/.exec(p.storageId),farm=/^fazenda:(colheita|criador|ovos|abate)$/.exec(p.storageId);let payload:State={acao:'tirar',item:p.itemId,qtd:p.quantity};if(chest){if(!catalog.ehBauIlha?.(before.base?.[p.storageId.slice(4)]))throw new Error('Baú da retirada não existe.');payload={...payload,local:'bau',x:Number(chest[1]),y:Number(chest[2]),z:Number(chest[3])};}else if(p.storageId==='ender')payload.local='ender';else if(farm)payload={...payload,local:'fazenda',id:farm[1]};else throw new Error('Origem de retirada desconhecida.');if(quantity(map(before,p.storageId)[p.itemId])<p.quantity)throw new Error('O estoque do baú mudou.');guard();const result=await invoke(network.armazem(payload)),after=result.estado;if(!after)throw new Error('Retirada sem confirmação; o craft não será enviado.');latest=after;hud.aplicar?.(after);if(inventory(after,p.itemId)-inventory(before,p.itemId)!==p.quantity||quantity(map(before,p.storageId)[p.itemId])-quantity(map(after,p.storageId)[p.itemId])!==p.quantity||total(before,p.itemId)!==total(after,p.itemId))throw new Error('Retirada parcial ou divergente. Revise o Terminal antes de craftar.');before=after;changed++;}
   return before;
  };
  if(input.command.kind==='craft'){
   const c=input.command,r=input.workbench;if(!r||r.id!==c.recipeId)throw new Error('Receita não validada.');
   if(r.kind!=='table'&&c.batches!==1)throw new Error('Esta operação nativa cria uma receita por confirmação.');
   const systemUrl=location.origin+'/js/sistemas_sb.js';let sb:State={};if(r.kind==='forge'||r.slayer){if(!resources.has(systemUrl))throw new Error('Módulo SkyBlock não identificado na aba.');sb=await timed(import(/* @vite-ignore */ systemUrl));}
   let spec:State|undefined,nativeCost:State|undefined;
   if(r.kind==='table'){spec=catalog.RECEITAS?.[r.nativeId];nativeCost=spec?.entra;if(spec?.sai?.[r.outputId]!==r.output)throw new Error('A saída da receita mudou no cliente.');}
   else if(r.kind==='skyblock'){spec=catalog.CRAFTS_SB?.[r.nativeId];nativeCost=spec?.custo;if((spec?.qtd??1)!==r.output)throw new Error('O rendimento da receita mudou.');}
   else if(r.armorSet){spec=catalog.FONTES_ARMADURA?.[r.armorSet];if(catalog.pecasDoConjunto?.(r.armorSet)?.[r.armorPiece??'']!==r.outputId||spec?.fonte!==(r.kind==='forge'?'forja':'craft'))throw new Error('Peça de armadura não corresponde à fonte atual.');nativeCost=catalog.custoPeca?.(r.armorSet,r.armorPiece);}
   else {spec=sb.FORJA_ITENS?.[r.nativeId];nativeCost=spec?.custo;}
   const canonical=(x:State)=>JSON.stringify(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
   if(!spec||!nativeCost||canonical(nativeCost)!==canonical(r.ingredients))throw new Error('Ingredientes da wiki/catálogo divergem do cliente.');
   if(JSON.stringify(spec.colecao??null)!==JSON.stringify(r.collection??null)||JSON.stringify(spec.slayer??null)!==JSON.stringify(r.slayer??null))throw new Error('Os desbloqueios da receita mudaram.');
   if((spec.consome??null)!==(r.consumes??null)||!!spec.consomeAtual!==r.consumesEquipment||(spec.depois??null)!==(r.previous??null)||(spec.requerAtual??null)!==(r.requiresCurrent??null))throw new Error('O equipamento anterior exigido ou consumido mudou no cliente.');
   for(const id of [r.outputId,...Object.keys(nativeCost),...(spec.consome?[spec.consome]:[])])if(protectedItem(id))throw new Error('Ingrediente ou saída protegido/reservado.');
   if(r.collection){const[id,level]=r.collection,n=quantity(before.colecoes?.[id]),limit=catalog.COLECAO_NIVEIS?.[level-1];if(!Number.isFinite(limit)||n<limit)throw new Error('Coleção insuficiente para esta receita.');}
   if(spec.combate&&(typeof catalog.nivelHabilidade!=='function'||catalog.nivelHabilidade(before.habilidades?.combate??0,60)?.nivel<spec.combate))throw new Error('Nível de Combate insuficiente.');
   if(r.slayer&&(typeof sb.nivelSlayer!=='function'||sb.nivelSlayer(r.slayer[0],before.slayer?.xp?.[r.slayer[0]]??0)<r.slayer[1]))throw new Error('Nível de Slayer insuficiente.');
   if(r.kind==='forge'){if(spec.hotm!==r.hotm||spec.min!==r.minutes)throw new Error('Requisitos/tempo da Forja mudaram.');if(typeof before.anas?.feitas!=='number'||typeof catalog.nivelCoracao!=='function'||catalog.nivelCoracao(before.anas.feitas)<(spec.hotm??0))throw new Error('Coração da Montanha insuficiente.');const slots=sb.vagasForja?.(before);if(!Number.isInteger(slots)||!Array.isArray(before.forja)||before.forja.length>=slots)throw new Error('A Forja não tem vaga confirmada.');}
   if(r.kind==='table'){const portable=inventory(before,'mesa_portatil')>0;if((spec.precisaMesa||spec.noSuporte||spec.estacao)&&!portable&&before.area!=='floresta')throw new Error('Vá à Floresta ou leve uma Mesa Portátil.');if(spec.precisaMesa&&!portable&&!before.mesa)throw new Error('Mesa de Trabalho necessária.');if(spec.noSuporte&&!before.suporte)throw new Error('Suporte de Poções necessário.');if(spec.estacao&&!before[spec.estacao])throw new Error('Estação necessária: '+spec.estacao);if(spec.requer&&Object.entries(spec.requer).some(([id,q])=>inventory(before,id)<Number(q)))throw new Error('Falta um item requerido, mas não consumido, na mochila.');if(spec.requerAtual&&spec.ferramenta&&before[spec.ferramenta]!==spec.requerAtual)throw new Error('Ferramenta anterior mudou.');if(spec.unica&&c.batches!==1)throw new Error('Receita única: confirme uma unidade.');}
   if(spec.depois&&spec.ferramenta&&before[spec.ferramenta]!==spec.depois)throw new Error('A ferramenta anterior não está em uso.');
   if(spec.consome&&before.espada!==spec.consome&&!(Array.isArray(before.armas)&&before.armas.includes(spec.consome)))throw new Error('Prepare a espada anterior no equipamento ou na coleção de armas antes de iniciar.');
   if(spec.consomeAtual&&protectedItem(before[spec.ferramenta]))throw new Error('O equipamento que seria consumido está protegido.');
   const eligible=(s:State,id:string)=>id==='ouro'?quantity(s.ouro):inventory(s,id)+((r.kind==='skyblock'||r.kind==='armor')?Object.entries(s.guardado??{}).filter(([key])=>key==='saco'||/^bolsa[0-8]$/.test(key)).reduce((n,[,v])=>n+quantity((v as State)[id]),0)+(s.compactador===id?1:0)+(s.apagador===id?1:0):0);
   const physical=(s:State,id:string)=>id==='ouro'?quantity(s.ouro):total(s,id)+(s.compactador===id?1:0)+(s.apagador===id?1:0);
   const requirements=Object.fromEntries(Object.entries(nativeCost).map(([id,n])=>{if(!Number.isSafeInteger(n)||n<1)throw new Error('Custo nativo inválido.');return[id,n*c.batches];}));
   if(canonical(Object.fromEntries(Object.keys(requirements).map(id=>[id,eligible(before,id)])))!==canonical(c.expectedStock))throw new Error('O estoque mudou. Confira os materiais e revise novamente.');
   const planned:State={};for(const p of c.pulls){if(!(p.itemId in requirements)||protectedItem(p.itemId))throw new Error('Retirada fora da receita revisada.');planned[p.itemId]=(planned[p.itemId]??0)+p.quantity;}
   for(const[id,n]of Object.entries(requirements))if((planned[id]??0)!==Math.max(0,n-eligible(before,id)))throw new Error('Plano de retirada não corresponde aos faltantes.');
   before=await withdraw(c.pulls,before);
   if(Object.entries(requirements).some(([id,n])=>eligible(before,id)<n))throw new Error('Os materiais não chegaram à origem aceita.');
   guard();const result=await invoke(r.kind==='table'?network.craftar(r.nativeId,c.batches):network.armazem(r.kind==='forge'?{acao:'forja',sub:'iniciar',id:r.nativeId}:{acao:r.kind==='armor'?'arm_craft':'sb_craft',id:r.nativeId}));if(!result.estado)throw new Error('Pedido sem estado de confirmação.');const after=result.estado;latest=after;hud.aplicar?.(after);
   let message:string;
   if(r.kind==='table'){const queued=(s:State)=>((s.fila??[]) as State[]).filter(f=>f.receita===r.nativeId&&!f.tipo).reduce((n,f)=>n+quantity(f.vezes??1),0);const active=JSON.stringify(after.alvo)!==JSON.stringify(before.alvo)&&after.alvo?.tipo==='craftar'&&(after.alvo?.receita===r.nativeId||after.alvo?.id===r.nativeId);const produced=physical(after,r.outputId)-physical(before,r.outputId)>=r.output*c.batches;if(!(queued(after)-queued(before)>=c.batches||active||produced))throw new Error('O estado não confirmou o craft nem sua entrada na fila.');message=produced?'Craft confirmado.':'Pedido de craft aceito na fila do jogo. Aguarde o preparo.';}
   else {for(const[id,n]of Object.entries(requirements))if(physical(before,id)-physical(after,id)!==n)throw new Error('Consumo dos materiais não confirmado. Revise os saldos.');if(r.kind==='forge'){const old=(before.forja??[]) as State[],next=(after.forja??[]) as State[];if(next.length!==old.length+1||!next.some(f=>f.id===r.outputId&&typeof f.fim==='number'&&f.fim>Date.now()-10000&&!old.some(a=>a.id===f.id&&a.fim===f.fim)))throw new Error('A nova tarefa da Forja não foi confirmada.');message='Forja iniciada. O prazo confirmado aparece na fila.';}else{const equipped=r.tool&&after[r.tool]===r.outputId;const armor=Object.values(after.armadura??{}).includes(r.outputId);const produced=physical(after,r.outputId)-physical(before,r.outputId)>=r.output;if(!equipped&&!armor&&!produced)throw new Error('A saída do craft não foi confirmada.');message='Craft confirmado: '+r.name+'.';}}
   return{ok:true,changed:c.batches,message,raw:projection(after,build)};
  }
  if(input.command.kind==='move'){
   const c=input.command;if(protectedItem(c.itemId))throw new Error('Item protegido ou reservado.');
   const metadata=catalog.ITENS?.[c.itemId];if(!metadata||metadata.armadura||metadata.ferramenta||catalog.PETS?.[c.itemId])throw new Error('Equipamento ou identidade individual sem validação para movimentação.');
   if(!Number.isSafeInteger(c.quantity)||c.quantity<1||c.quantity>1000000)throw new Error('Quantidade inválida.');
   let body:State={acao:c.direction==='deposit'?'guardar':'tirar',item:c.itemId,qtd:c.quantity};
   const chest=/^bau:(-?\d+),(-?\d+),(-?\d+)$/.exec(c.storageId),bag=/^bolsa([0-8])$/.exec(c.storageId),farm=/^fazenda:(colheita|criador|ovos|abate)$/.exec(c.storageId);
   if(chest){if(!catalog.ehBauIlha?.(before.base?.[c.storageId.slice(4)]))throw new Error('Baú não encontrado na ilha atual.');body={...body,local:'bau',x:Number(chest[1]),y:Number(chest[2]),z:Number(chest[3])};}
   else if(bag)body={...body,local:'bolsa',n:Number(bag[1])};
   else if(farm)body={...body,local:'fazenda',id:farm[1]};
   else if(['ender','saco','terminal'].includes(c.storageId)){if(c.storageId==='terminal'&&!Object.values(before.base??{}).includes('terminal'))throw new Error('Terminal nativo não encontrado na ilha.');body={...body,local:c.storageId};}
   else throw new Error('Destino sem operação conhecida.');
   const origin=c.direction==='deposit'?'inventory':c.storageId,destination=c.direction==='deposit'?c.storageId:'inventory';
   if(quantity(map(before,origin)[c.itemId])<c.quantity)throw new Error('O estoque mudou ou a origem não possui a quantidade solicitada.');
   guard();const r=await invoke(network.armazem(body));if(!r.estado)throw new Error('Movimentação sem estado de confirmação.');const after=r.estado;latest=after;hud.aplicar?.(after);
   const removed=quantity(map(before,origin)[c.itemId])-quantity(map(after,origin)[c.itemId]),added=quantity(map(after,destination)[c.itemId])-quantity(map(before,destination)[c.itemId]);
   if(removed<=0||removed!==added||removed>c.quantity||total(before,c.itemId)!==total(after,c.itemId))throw new Error('Os saldos não confirmam a movimentação. Nenhuma repetição automática será feita.');
   changed=removed;return {ok:true,changed,message:removed===c.quantity?'Movimentação confirmada.':'Movimentação parcial confirmada: '+removed+' de '+c.quantity+'.',raw:projection(after,build)};
  }
  const c=input.command,r=input.recipe;if(!r||r.id!==c.recipeId||protectedItem(r.id)||protectedItem(r.input))throw new Error('Receita ou ingredientes protegidos/indisponíveis.');
  let available:number;
  if(r.kind==='compact'){const native=catalog.ENCANTADOS?.[r.id];if(!native||native.base!==r.input||(catalog.qtdCompactar?.(r.id)??native.qtd??160)!==r.ratio)throw new Error('A receita da wiki diverge do cliente atual.');available=inventory(before,r.input);}
  else {const split=r.id.lastIndexOf('_'),gem=r.id.slice(0,split),tier=r.id.slice(split+1),index=catalog.GEMA_TIERS?.indexOf(tier);if(!catalog.GEMAS?.includes(gem)||!(index>0)||r.input!==gem+'_'+catalog.GEMA_TIERS[index-1]||r.ratio!==catalog.LAPIDAR)throw new Error('Receita de lapidação não reconhecida pelo cliente.');available=inventory(before,r.input)+quantity(before.guardado?.saco?.[r.input]);}
  const exact=c.kind==='goalTransform';let batches:number;
  if(exact){if(available!==c.expectedAvailable)throw new Error('O estoque mudou. Revise a etapa novamente.');batches=c.batches;const required=batches*r.ratio,deficit=Math.max(0,required-available);if(c.pulls.some(p=>p.itemId!==r.input||p.quantity<1)||c.pulls.reduce((n,p)=>n+p.quantity,0)!==deficit)throw new Error('Plano de transformação divergente.');if(r.kind==='lapidary'&&Math.floor(Math.max(available,required)/r.ratio)!==batches)throw new Error('A lapidação processaria materiais excedentes. Guarde-os e revise.');before=await withdraw(c.pulls,before);available=inventory(before,r.input)+(r.kind==='lapidary'?quantity(before.guardado?.saco?.[r.input]):0);if(available<required)throw new Error('Os materiais não chegaram à origem aceita.');}
  else batches=Math.floor(available/r.ratio);
  if(batches<1||(!exact&&batches!==c.expectedBatches))throw new Error('A quantidade disponível mudou. Revise a prévia antes de confirmar.');
  guard();const result=await invoke(r.kind==='compact'?network.compactar(r.id,exact?batches:'max'):network.armazem({acao:'lapidar',id:r.id}));if(!result.estado)throw new Error('Transformação sem estado de confirmação.');const after=result.estado;latest=after;hud.aplicar?.(after);
  if(total(before,r.input)-total(after,r.input)!==batches*r.ratio||total(after,r.id)-total(before,r.id)!==batches)throw new Error('Os saldos não confirmam a transformação; pode ter ocorrido coleta ou compactação simultânea. Revise o estado.');
  return {ok:true,changed:batches,message:(r.kind==='compact'?'Compactação':'Lapidação')+' confirmada: '+batches+' unidade(s).',raw:projection(after,build)};
 }catch(e){return fail(e instanceof Error?e.message:'Falha na ação manual.');}
}
