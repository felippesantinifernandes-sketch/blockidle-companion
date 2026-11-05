import {useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {Card,time} from '../components/common';
import {hasChrome} from '../../db/preferences';
import {nextDragon,nextAuction} from '../../core/notifications';
import {ago} from '../components/StatusBar';
interface GameEvent{id:string;name:string;desc:string;start:number;end:number;active:boolean}
const HOUR=3600000;
/** Leilão aberto entre :40 e :55 de cada hora (janelaLeilao). */
export function auctionWindow(now:number){const h=Math.floor(now/HOUR)*HOUR,open=h+40*60000,close=h+55*60000;return now>=open&&now<close?{open:true,until:close}:{open:false,until:nextAuction(now)};}
export function Events(){
 const [now,setNow]=useState(Date.now()),[events,setEvents]=useState<GameEvent[]>(),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
 const load=async()=>{if(!hasChrome()){setError('O calendário requer a extensão conectada à aba do jogo.');return;}setLoading(true);setError('');try{const r=await chrome.runtime.sendMessage({type:'COMPANION_EVENTS'});if(!r?.ok)throw Error(r?.error??'Calendário indisponível.');setEvents((r.events as GameEvent[]).sort((a,b)=>Number(b.active)-Number(a.active)||a.start-b.start));}catch(e){setError(e instanceof Error?e.message:'Calendário indisponível.');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const dragon=nextDragon(now),auction=auctionWindow(now);
 return <>
  <Card title="Próximos eventos">
   <div className="event-grid">
    <article className="event-card"><small>Dragão do End</small><strong>em {ago(dragon-now)}</strong><span className="muted">nasce às {new Date(dragon).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} (a cada 3 h)</span></article>
    <article className={'event-card'+(auction.open?' live':'')}><small>Dark Auction</small><strong>{auction.open?'aberto · fecha em '+ago(auction.until-now):'abre em '+ago(auction.until-now)}</strong><span className="muted">toda hora, de :40 a :55</span></article>
    {events?.map(e=><article key={e.id} className={'event-card'+(e.active?' live':'')} title={e.desc}><small>{e.name}</small><strong>{e.active?'agora · termina em '+ago(e.end-now):'começa em '+ago(e.start-now)}</strong><span className="muted">{time(e.start)} → {time(e.end)}</span></article>)}
   </div>
   {error&&<p className="notice warning-text">{error}</p>}
   <div className="button-row"><button onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/>{loading?'Lendo calendário…':'Atualizar calendário do jogo'}</button></div>
   <p className="muted">Horários do Dragão e do leilão vêm das regras do jogo. Zoológico, Mining Fiesta, Festa da Pesca e outros vêm do calendário do próprio cliente. Ative os avisos em Configurações.</p>
  </Card>
 </>;
}
