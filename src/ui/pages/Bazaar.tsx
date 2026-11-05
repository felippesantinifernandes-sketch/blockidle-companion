import {useMemo,useState} from 'react';
import {RefreshCw,ShoppingCart,Coins,X,Store,ClipboardList} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {Card,ItemIcon,ItemName,number,time} from '../components/common';
import {bazaarRead,useBazaar,type BazaarBand,type BazaarBook,type BazaarOrder,type BazaarPreview} from '../bazaar';
import {itemName,items} from '../../catalog/itemCatalog';
import {itemLocations} from '../../core/locations';
import {supportsCommandBuild} from '../../core/versionMonitor';
import {commandProtection} from '../../core/transformations';
import {goalCommandBlock} from '../../core/objectives';
import type {ManualCommand} from '../../core/types';

const plain=(t:string)=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const gold=(v:number|null|undefined,digits=1)=>v===null||v===undefined?'—':v.toLocaleString('pt-BR',{maximumFractionDigits:digits});
/** Margem de revenda: comprar pela maior ordem de compra e vender pelo menor preço pedido, descontada a taxa. */
export function flipMargin(buyOrder:number|null,sellAsk:number|null,tax:number){if(!buyOrder||!sellAsk)return undefined;const net=sellAsk*(1-tax)-buyOrder;return {net,ratio:net/buyOrder};}

export function Bazaar(){
 const {state}=useStore(),bazaar=useBazaar();
 const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[sort,setSort]=useState<'name'|'margin'|'volume'>('name'),[limit,setLimit]=useState(80),[selected,setSelected]=useState<string|null>(null);
 const tax=bazaar.tax??0.05;
 const rows=useMemo(()=>{
  const prices=bazaar.prices??{},cat=bazaar.categories.find(c=>c.name===category),q=plain(query.trim());
  const ids=Object.keys(prices).filter(id=>(category==='all'||cat?.items.includes(id))&&(!q||plain(itemName(id)+' '+id).includes(q)));
  const margin=(id:string)=>flipMargin(prices[id].sell,prices[id].buy,tax)?.ratio??-Infinity;
  return ids.sort((a,b)=>sort==='margin'?margin(b)-margin(a):sort==='volume'?(prices[b].volume??0)-(prices[a].volume??0):itemName(a).localeCompare(itemName(b),'pt-BR'));
 },[bazaar.prices,bazaar.categories,category,query,sort,tax]);
 return <>
  <Card icon={<Store size={16}/>} title="Bazar" action={<button onClick={()=>void bazaar.load()} disabled={bazaar.loading}><RefreshCw size={14}/>{bazaar.loading?'Consultando…':bazaar.at?'Atualizar':'Carregar preços'}</button>}>
   <p className="muted">Preços lidos do servidor pela aba do jogo, no máximo uma consulta por segundo. “Comprar agora” é o menor preço pedido; “Vender agora” é a maior ordem de compra. A margem desconta a taxa de {gold(tax*100,2)}% (a taxa real da sua conta aparece na prévia de venda). Toda compra, venda ou ordem pede confirmação.</p>
   {bazaar.error&&<p className="notice warning-text">{bazaar.error}</p>}
   {bazaar.at&&<><div className="toolbar"><input aria-label="Buscar no Bazar" placeholder="Buscar item…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(80);}}/><select aria-label="Categoria do Bazar" value={category} onChange={e=>{setCategory(e.target.value);setLimit(80);}}><option value="all">Todas as categorias</option>{bazaar.categories.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select><select aria-label="Ordenar Bazar" value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="name">Nome</option><option value="margin">Maior margem de revenda</option><option value="volume">Maior volume</option></select></div>
   <p className="muted">{rows.length} itens · atualizado em {time(bazaar.at)}</p>
   <div className="bazaar-table" role="table" aria-label="Preços do Bazar"><div className="bazaar-row head" role="row"><span role="columnheader">Item</span><span role="columnheader">Comprar agora</span><span role="columnheader">Vender agora</span><span role="columnheader">Margem</span><span role="columnheader">Volume</span><span role="columnheader">Você tem</span></div>
    {rows.slice(0,limit).map(id=>{const p=bazaar.prices![id],m=flipMargin(p.sell,p.buy,tax),have=itemLocations(state,id).reduce((n,l)=>n+l.quantity,0);return <button className={'bazaar-row'+(selected===id?' selected':'')} role="row" key={id} onClick={()=>setSelected(id)}><span role="cell" className="bazaar-item"><ItemIcon id={id}/><ItemName id={id}/></span><span role="cell">{gold(p.buy)}</span><span role="cell">{gold(p.sell)}</span><span role="cell" className={m&&m.net>0?'positive':undefined}>{m?gold(m.ratio*100,1)+'%':'—'}</span><span role="cell">{p.volume!=null?number(p.volume):'—'}</span><span role="cell">{have?number(have):'—'}</span></button>;})}
   </div>{rows.length>limit&&<button onClick={()=>setLimit(limit+80)}>Mostrar mais</button>}</>}
  </Card>
  {selected&&<BazaarItem id={selected} onClose={()=>setSelected(null)}/>}
  <MyOrders/>
  {!state&&<p className="muted">Conecte ao jogo para consultar o Bazar.</p>}
 </>;
}

function Chart({bands}:{bands:BazaarBand[]}){
 const pts=bands.filter(b=>b.avg!==null);if(pts.length<2)return <p className="muted">Sem negócios suficientes nas últimas 24 h para o gráfico.</p>;
 const min=Math.min(...pts.map(b=>b.min??b.avg!)),max=Math.max(...pts.map(b=>b.max??b.avg!)),span=max-min||1,w=320,h=90;
 const x=(i:number)=>i/(bands.length-1)*w,y=(v:number)=>h-6-(v-min)/span*(h-12);
 const line=bands.map((b,i)=>b.avg===null?null:[x(i),y(b.avg)] as const).filter((p):p is readonly [number,number]=>!!p).map(([a,b],i)=>(i?'L':'M')+a.toFixed(1)+' '+b.toFixed(1)).join(' ');
 return <figure className="bazaar-chart"><svg viewBox={'0 0 '+w+' '+h} role="img" aria-label={'Preço médio por hora nas últimas 24 h, de '+gold(min)+' a '+gold(max)}><path d={line} fill="none" stroke="currentColor" strokeWidth="2"/></svg><figcaption className="muted">24 h · mín. {gold(min)} · máx. {gold(max)}</figcaption></figure>;
}
function BazaarItem({id,onClose}:{id:string;onClose:()=>void}){
 const {state,prefs}=useStore(),{busy,perform,lockedScope}=useActions();
 const [book,setBook]=useState<BazaarBook>(),[bands,setBands]=useState<BazaarBand[]>(),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [qtd,setQtd]=useState(1),[price,setPrice]=useState(0),[preview,setPreview]=useState<BazaarPreview>(),[pending,setPending]=useState<ManualCommand>();
 const load=async()=>{setLoading(true);setError('');try{setBook({...(await bazaarRead<BazaarBook>({op:'item',id})),at:Date.now()});setBands((await bazaarRead<{bands:BazaarBand[]}>({op:'historico',id})).bands);}catch(e){setError(e instanceof Error?e.message:'Falha no Bazar.');}finally{setLoading(false);}};
 const ask=async(lado:'c'|'v')=>{setError('');setPending(undefined);try{const r=await bazaarRead<{preview:BazaarPreview}>({op:'previa',lado,id,qtd});setPreview(r.preview);const cmd:ManualCommand={kind:'bazaarNow',side:lado,itemId:id,quantity:qtd,...(lado==='c'&&r.preview.worst?{maxPrice:r.preview.worst}:{})};setPending(cmd);}catch(e){setError(e instanceof Error?e.message:'Falha na prévia.');}};
 const order=(side:'c'|'v')=>{setPreview(undefined);setPending({kind:'bazaarOrder',side,itemId:id,quantity:qtd,price});};
 const live=state?.source==='live',locked=!!lockedScope&&lockedScope===state?.scope;
 const blocked=pending&&state?(!supportsCommandBuild(state.build,pending.kind,state)?'Build atual do jogo não validado para o Bazar.':commandProtection(pending,state,prefs)??goalCommandBlock(pending,state,prefs)):undefined;
 const have=state?.storages.find(s=>s.kind==='inventory')?.items[id]??0;
 return <Card title={'Bazar · '+itemName(id)} action={<button className="icon-button" aria-label="Fechar item do Bazar" onClick={onClose}><X size={16}/></button>}>
  <div className="button-row"><button onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/>{loading?'Consultando…':book?'Atualizar livro e gráfico':'Ver livro de ofertas e gráfico'}</button>{items[id]?.source&&<a href={items[id].source} target="_blank" rel="noreferrer">Item na wiki</a>}</div>
  {error&&<p className="notice warning-text">{error}</p>}
  {bands&&<Chart bands={bands}/>}
  {book&&<div className="bazaar-book"><div><h3>Pedidos de venda (você compra)</h3>{book.asks.slice(0,8).map((l,i)=><p key={i}><b>{gold(l.price)}</b> · {number(l.qtd??0)} un. · {l.orders??'?'} ordens</p>)}{!book.asks.length&&<p className="muted">Ninguém vendendo.</p>}</div><div><h3>Ordens de compra (você vende)</h3>{book.bids.slice(0,8).map((l,i)=><p key={i}><b>{gold(l.price)}</b> · {number(l.qtd??0)} un. · {l.orders??'?'} ordens</p>)}{!book.bids.length&&<p className="muted">Ninguém comprando.</p>}</div></div>}
  <h3>Negociar</h3>
  <div className="toolbar"><label>Quantidade<input type="number" min={1} max={71680} value={qtd} onChange={e=>{setQtd(Math.max(1,Math.min(71680,Math.floor(Number(e.target.value)||1))));setPending(undefined);setPreview(undefined);}}/></label><label>Preço por unidade (ordem)<input type="number" min={0} step="0.1" value={price||''} onChange={e=>{setPrice(Math.max(0,Number(e.target.value)||0));setPending(undefined);}}/></label><small className="muted">Na mochila: {number(have)}</small></div>
  <div className="button-row"><button disabled={!live} onClick={()=>void ask('c')}><ShoppingCart size={14}/>Prévia: comprar agora</button><button disabled={!live} onClick={()=>void ask('v')}><Coins size={14}/>Prévia: vender agora</button><button disabled={!live||!price} onClick={()=>order('c')}>Criar ordem de compra</button><button disabled={!live||!price} onClick={()=>order('v')}>Criar ordem de venda</button></div>
  {preview&&<div className="notice"><strong>{preview.side==='c'?'Comprar':'Vender'} {number(preview.qtd??qtd)} agora: total {gold(preview.total)} de ouro</strong><p>Médio {gold(preview.avg,2)} · melhor {gold(preview.best,2)} · pior {gold(preview.worst,2)}{preview.side==='v'&&<> · taxa {gold((preview.tax??0)*100,2)}% · você recebe {gold(preview.net)}</>}</p>{(preview.missing??0)>0&&<p className="warning-text">O livro não tem quantidade suficiente: faltam {number(preview.missing!)} unidades.</p>}</div>}
  {pending&&<div className="confirmation"><h3>Confirmar no Bazar</h3><p>{pending.kind==='bazaarNow'?(pending.side==='c'?'Comprar ':'Vender ')+number(pending.quantity)+' × '+itemName(id)+' agora'+(preview?' por cerca de '+gold(preview.side==='v'?preview.net:preview.total)+' de ouro':'')+(pending.maxPrice?' (até '+gold(pending.maxPrice,2)+' por unidade)':'')+'.':pending.kind==='bazaarOrder'?'Ordem de '+(pending.side==='c'?'compra':'venda')+': '+number(pending.quantity)+' × '+itemName(id)+' a '+gold(pending.price,2)+' (total '+gold(pending.price*pending.quantity)+').':''}</p>{blocked&&<p className="warning-text">{blocked}</p>}<div className="button-row"><button onClick={()=>setPending(undefined)}>Cancelar</button><button className="primary" disabled={busy||locked||!!blocked} onClick={async()=>{const r=await perform(pending);if(r.ok){setPending(undefined);setPreview(undefined);}}}>Confirmar</button></div></div>}
 </Card>;
}
function MyOrders(){
 const {state}=useStore(),{busy,perform,lockedScope}=useActions();
 const [orders,setOrders]=useState<BazaarOrder[]>(),[claim,setClaim]=useState<Record<string,number>>({}),[error,setError]=useState(''),[confirm,setConfirm]=useState<ManualCommand>();
 const load=async()=>{setError('');try{const r=await bazaarRead<{orders:BazaarOrder[];claim:Record<string,number>}>({op:'minhas'});setOrders(r.orders);setClaim(r.claim);}catch(e){setError(e instanceof Error?e.message:'Falha no Bazar.');}};
 const live=state?.source==='live'&&supportsCommandBuild(state.build,'bazaarClaim',state),locked=!!lockedScope&&lockedScope===state?.scope;
 const run=async(c:ManualCommand)=>{const r=await perform(c);setConfirm(undefined);if(r.ok)await load();};
 return <Card icon={<ClipboardList size={16}/>} title="Minhas ordens no Bazar" action={<button onClick={()=>void load()}><RefreshCw size={14}/>{orders?'Atualizar':'Carregar'}</button>}>
  {error&&<p className="notice warning-text">{error}</p>}
  {orders&&<>{Object.keys(claim).length>0&&<div className="notice"><strong>Para resgatar: {Object.entries(claim).map(([k,v])=>number(v)+' '+(k==='ouro'?'de ouro':itemName(k))).join(', ')}</strong><div className="button-row"><button className="primary" disabled={!live||busy||locked} onClick={()=>setConfirm({kind:'bazaarClaim'})}>Resgatar</button></div></div>}
   {orders.map(o=><div className="row" key={o.id}><div><strong>{o.side==='c'?'Compra':'Venda'} · {itemName(o.item)}</strong><small>{number(o.remaining??0)} de {number(o.qtd??0)} restantes · {gold(o.price,2)} por unidade</small></div><button disabled={!live||busy||locked} onClick={()=>setConfirm({kind:'bazaarCancel',orderId:o.id})}>Cancelar ordem</button></div>)}
   {!orders.length&&!Object.keys(claim).length&&<p className="muted">Nenhuma ordem aberta e nada para resgatar.</p>}</>}
  {confirm&&<div className="confirmation"><h3>{confirm.kind==='bazaarClaim'?'Resgatar do Bazar':'Cancelar ordem'}</h3><p>{confirm.kind==='bazaarClaim'?'O que chegou vai para a mochila e a carteira. Com a mochila cheia, parte pode ficar para depois.':'O que ainda não foi negociado volta para você.'}</p><div className="button-row"><button onClick={()=>setConfirm(undefined)}>Voltar</button><button className="primary" disabled={busy||locked} onClick={()=>void run(confirm)}>Confirmar</button></div></div>}
 </Card>;
}
