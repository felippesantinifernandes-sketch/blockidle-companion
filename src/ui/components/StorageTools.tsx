import {useState} from 'react';
import {Boxes} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {Card,number} from './common';
import {items} from '../../catalog/itemCatalog';
import {storageLabel} from '../../core/locations';
import {supportsCommandBuild} from '../../core/versionMonitor';
import {commandProtection} from '../../core/transformations';
import type {GameState,ManualCommand,Storage} from '../../core/types';
/** Vagas ocupadas: cada item ocupa ceil(qtd / pilha) vagas, como na conta do Terminal do jogo. */
export function usedSlots(s:Storage){return Object.entries(s.items).reduce((n,[id,q])=>n+(q>0?Math.ceil(q/(items[id]?.stackSize||64)):0),0);}
export function chestOccupancy(state:GameState){return state.storages.filter(s=>s.kind==='chest'&&s.capacity?.totalSlots).map(s=>({id:s.id,label:storageLabel(s),used:usedSlots(s),total:s.capacity!.totalSlots})).sort((a,b)=>b.used/b.total-a.used/a.total);}
export function StorageTools(){
 const {state,prefs}=useStore(),{busy,perform,lockedScope}=useActions(),[confirm,setConfirm]=useState<ManualCommand>();
 if(!state)return null;
 const locked=!!lockedScope&&lockedScope===state.scope,occupancy=chestOccupancy(state);
 const total=occupancy.reduce((n,c)=>n+c.total,0),used=occupancy.reduce((n,c)=>n+c.used,0);
 const can=(k:ManualCommand)=>state.source==='live'&&supportsCommandBuild(state.build,k.kind,state);
 const blocked=confirm?commandProtection(confirm,state,prefs):undefined;
 return <Card icon={<Boxes size={16}/>} title="Ações rápidas e lotação">
  <div className="button-row"><button disabled={!can({kind:'enderBackpack'})||busy||locked} onClick={()=>setConfirm({kind:'enderBackpack'})}>Guardar mochila no Ender</button><button disabled={!can({kind:'terminalStash'})||busy||locked||!state.terminalAvailable} onClick={()=>setConfirm({kind:'terminalStash'})}>Juntar nos baús</button></div>
  <p className="muted">Ender funciona de qualquer área. “Juntar nos baús” guarda da mochila o que já existe em algum baú da ilha e usa o passeio (o Steve para durante a operação).</p>
  {confirm&&<div className="confirmation"><h3>{confirm.kind==='enderBackpack'?'Guardar a mochila no Ender':'Juntar nos baús'}</h3><p>{confirm.kind==='enderBackpack'?'O jogo move para o Baú do Ender o que couber da mochila.':'O jogo move da mochila os itens que já têm um baú na ilha.'}</p>{blocked&&<p className="warning-text">{blocked}</p>}<div className="button-row"><button onClick={()=>setConfirm(undefined)}>Cancelar</button><button className="primary" disabled={busy||locked||!!blocked} onClick={async()=>{await perform(confirm);setConfirm(undefined);}}>Confirmar</button></div></div>}
  {occupancy.length>0&&<><h3>Baús da ilha · {number(used)} / {number(total)} vagas</h3><div className="occupancy">{occupancy.slice(0,30).map(c=><div key={c.id} className="occupancy-row"><span>{c.label}</span><span className="status-meter" role="meter" aria-label={'Lotação de '+c.label} aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.used}><span style={{width:Math.min(100,c.used/c.total*100)+'%'}} className={c.used/c.total>=0.9?'high':undefined}/></span><small>{c.used}/{c.total}</small></div>)}</div></>}
 </Card>;
}
