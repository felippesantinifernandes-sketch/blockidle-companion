import {useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {number} from './common';
import {contractStatus} from '../../core/versionMonitor';
import {locationLabel} from '../../core/regions';
import {activeList,listCapacity} from '../../core/nativeLists';
import {itemName} from '../../catalog/itemCatalog';
import type {GameState} from '../../core/types';
import {normalize} from '../../core/normalizer';
import {nextDragon,nextAuction} from '../../core/notifications';
import {dragonReadiness} from '../../core/dragon';
import {hasChrome} from '../../db/preferences';

export const SYNC_MINUTES=5;
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:undefined;
const rec=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
export const ago=(ms:number)=>ms<60000?Math.max(0,Math.round(ms/1000))+' s':ms<3600000?Math.round(ms/60000)+' min':Math.round(ms/3600000)+' h';
const hours=(ms:number)=>(ms/3600000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' h';
const until=(at:number|undefined,now:number)=>at===undefined?undefined:at>now?'vence em '+ago(at-now):'vencido';
/** Resumo do estado para a barra de status. Campos ausentes ficam undefined. */
export function statusSummary(state:GameState,now=Date.now()){
 const c=state.character,inventory=state.storages.find(s=>s.id==='inventory'),alvo=rec(c.alvo),fila=Array.isArray(c.fila)?c.fila:undefined;
 const offline=rec(c.offlineHoje),used=num(offline?.usadoMs),cap=num(offline?.tetoMs),rank=rec(c.rank);
 const types=inventory?Object.values(inventory.items).filter(n=>n>0).length:undefined,slots=num(c.slotsMochila);
 return {
  area:locationLabel(state),
  task:typeof alvo?.rotulo==='string'?alvo.rotulo:undefined,queue:fila?.length,
  gold:num(c.ouro),bits:num(c.bits),gems:num(c.gemas),
  backpack:types!==undefined?types+(slots?' / '+slots:''):undefined,full:c.mochilaCheia===true,
  offline:used!==undefined&&cap?{used,cap,ratio:Math.min(1,used/cap)}:undefined,
  sold:num(rec(c.autoVendido)?.ouro),
  cookie:until(num(c.cookieAte),now),rank:until(num(rank?.ate),now),
 };
}
export function StatusBar(){
 const state=useStore(s=>s.state),{lastSync,syncError,refreshing,busy,sync}=useActions();
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(t);},[]);
 const live=state?.source==='live';
 useEffect(()=>{if(!live)return;const t=setInterval(()=>void useActions.getState().sync(),SYNC_MINUTES*60000);return()=>clearInterval(t);},[live]);
 const [offline,setOffline]=useState<{state:GameState;at:number;via:string}>();
 useEffect(()=>{if(state||!hasChrome())return;void chrome.storage.local.get('blockidle.server-state.v1').then(r=>{const v=r['blockidle.server-state.v1'];if(v?.state)try{setOffline({state:normalize(v.state,'import'),at:v.at,via:v.via});}catch{/* retrato inválido */}});},[state]);
 if(!state){if(!offline)return null;const o=statusSummary(offline.state,now);return <section className="status-bar" aria-label="Último retrato do jogo"><div className="status-chip status-off"><strong>{offline.state.build??'build ?'}</strong><span>Sem aba conectada</span></div><div className="status-item"><small>Área</small><strong>{o.area}</strong></div>{o.gold!==undefined&&<div className="status-item"><small>Ouro</small><strong className="status-gold">{number(Math.floor(o.gold))}</strong></div>}{o.backpack!==undefined&&<div className="status-item"><small>Mochila</small><strong>{o.backpack}{o.full?' · cheia':''}</strong></div>}{o.offline&&<div className="status-item"><small>Offline hoje</small><strong>{hours(o.offline.used)} / {hours(o.offline.cap)}</strong></div>}<div className="status-item status-sync"><small>Último retrato</small><strong>há {ago(now-offline.at)}</strong><span className="muted">{offline.via==='server'?'lido do servidor em segundo plano':'lido pela aba do jogo'}</span></div></section>;}
 const s=statusSummary(state,now),compat=contractStatus(state);
 const level=state.source!=='live'?'off':compat.level==='compatible'?'ok':compat.level==='suspect'?'warn':'bad';
 const compatLabel=state.source!=='live'?(state.source==='demo'?'Demonstração':'Importado'):compat.level==='compatible'?'Compatível':compat.level==='suspect'?'Build novo · só filtros':'Só leitura';
 const sell=activeList(state,'autosell'),erase=activeList(state,'eraser'),comp=activeList(state,'compactor');
 const lists=[['Compactador',comp,listCapacity(state,'compactor')],['Apagador',erase,listCapacity(state,'eraser')],['Auto-venda',sell,listCapacity(state,'autosell')]] as const;
 return <section className="status-bar" aria-label="Status do jogo">
  <div className={'status-chip status-'+level} title={compat.reasons.join(' ')||undefined}><strong>{state.build??'build ?'}</strong><span>{compatLabel}</span></div>
  <div className="status-item"><small>Área</small><strong>{s.area}</strong>{s.task&&<span className="muted">{s.task}{s.queue?' · fila '+s.queue:''}</span>}</div>
  {s.gold!==undefined&&<div className="status-item"><small>Ouro</small><strong className="status-gold">{number(Math.floor(s.gold))}</strong></div>}
  {s.bits!==undefined&&<div className="status-item"><small>Bits</small><strong>{number(s.bits)}</strong></div>}
  {s.gems!==undefined&&<div className="status-item"><small>Gemas</small><strong>{number(s.gems)}</strong></div>}
  {s.backpack!==undefined&&<div className="status-item"><small>Mochila</small><strong className={s.full?'warning-text':undefined}>{s.backpack}{s.full?' · cheia':''}</strong></div>}
  {s.offline&&<div className="status-item status-offline"><small>Offline hoje</small><strong>{hours(s.offline.used)} / {hours(s.offline.cap)}</strong><span className="status-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.offline.ratio*100)} aria-label="Tempo offline usado hoje"><span style={{width:(s.offline.ratio*100)+'%'}} className={s.offline.ratio>=0.8?'high':undefined}/></span></div>}
  <div className="status-item"><small>Filtros</small><strong>{lists.map(([name,list,cap])=><span key={name} title={name+': '+(list?.map(itemName).join(', ')||'vazio')}>{name.slice(0,4)} {list?list.length:'?'}/{cap??'?'} </span>)}</strong>{s.sold!==undefined&&<span className="muted">Auto-venda vendeu {number(Math.floor(s.sold))} de ouro</span>}</div>
  {(s.cookie||s.rank)&&<div className="status-item"><small>Cookie · Rank</small><strong>{s.cookie??'—'} · {s.rank??'—'}</strong></div>}
  <div className="status-item"><small>Eventos</small><strong>Dragão {ago(nextDragon(now)-now)}{state.source==='live'&&(()=>{const r=dragonReadiness(state,now);return <span className={r.willJoin?'positive':'warning-text'} title={r.willJoin?'O Steve vai entrar sozinho':r.blockers.map(b=>b.label).join(' · ')}> · {r.willJoin?'entra':'não entra'}</span>;})()}</strong><span className="muted">{(()=>{const m=new Date(now).getUTCMinutes();return m>=40&&m<55?'Leilão aberto até :55':'Leilão em '+ago(nextAuction(now)-now);})()}</span></div>
  <div className="status-item status-sync"><small>Sincronização</small><strong>{lastSync?'há '+ago(now-lastSync):'leitura da aba há '+ago(now-state.capturedAt)}</strong>{syncError&&<span className="warning-text">{syncError}</span>}{live&&<button className="text-button" disabled={busy||refreshing} onClick={()=>void sync()}><RefreshCw size={13}/>{refreshing?'Atualizando…':'Atualizar agora'}</button>}</div>
 </section>;
}
