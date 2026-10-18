import {useState} from 'react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {itemName,items} from '../../catalog/itemCatalog';
import {commandProtection,physicalQuantity} from '../../core/transformations';
import {roomFor} from '../../core/capacity';
import {observedBuild} from '../../core/versionMonitor';
import {Card,number} from './common';
export interface MoveDraft {itemId:string;direction:'deposit'|'withdraw';storageId:string}
export function MovePanel({draft,onClose}:{draft:MoveDraft;onClose:()=>void}){
 const {state,prefs}=useStore(),{busy,perform,lockedScope}=useActions();
 const [storageId,setStorageId]=useState(draft.storageId),[quantity,setQuantity]=useState(1);
 if(!state)return null;
 const candidates=state.storages.filter(s=>s.kind!=='inventory'&&(/^(ender|saco|bolsa[0-8])$/.test(s.id)||s.kind==='chest'||/^fazenda:(colheita|criador|ovos|abate)$/.test(s.id)));
 const label=(id:string)=>id==='terminal'?'Terminal nativo · todos os baús':(prefs.aliases[id]||state.storages.find(s=>s.id===id)?.originalName||id)+' · '+id;
 const source=draft.direction==='deposit'?'inventory':storageId,destination=draft.direction==='deposit'?storageId:'inventory';
 const available=source==='terminal'?state.storages.filter(s=>s.kind==='chest').reduce((n,s)=>n+(s.items[draft.itemId]??0),0):physicalQuantity(state,draft.itemId,[source]);
 const command={kind:'move' as const,direction:draft.direction,storageId,itemId:draft.itemId,quantity},blocked=commandProtection(command,state,prefs);
 const dest=state.storages.find(s=>s.id===destination),capacity=dest?roomFor(dest,draft.itemId,items):undefined;
 const live=state.source==='live'&&state.build===observedBuild,locked=!!lockedScope&&lockedScope===state.scope;
 return <Card title={(draft.direction==='deposit'?'Depositar · ':'Retirar · ')+itemName(draft.itemId)} action={<button onClick={onClose}>Fechar movimentação</button>}>
 <div className="form-grid"><label>{draft.direction==='deposit'?'Destino':'Origem'}<select aria-label="Armazenamento da movimentação" value={storageId} onChange={e=>setStorageId(e.target.value)}>{state.terminalAvailable&&<option value="terminal">Terminal nativo · todos os baús</option>}{candidates.map(s=><option key={s.id} value={s.id}>{label(s.id)}</option>)}</select></label><label>Quantidade<input aria-label="Quantidade para movimentar" type="number" min={1} max={Math.min(available,1000000)} step={1} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(1000000,Math.floor(Number(e.target.value)||1))))}/></label></div>
 <p>{label(source)} → {label(destination)} · {number(available)} disponíveis na origem.</p><p className="muted">{capacity!==undefined?'Espaço calculado no destino: '+number(capacity)+' unidades.':'A capacidade será validada pelo servidor.'} O servidor confirma acesso, limites e quantidade efetiva. Uma movimentação parcial será identificada.</p>
 {blocked&&<p className="warning-text">{blocked}</p>}{!live&&<p className="notice">Consulta offline: nenhuma movimentação será enviada.</p>}
 <div className="button-row"><button onClick={onClose}>Cancelar</button><button className="primary" disabled={!live||busy||locked||!!blocked||quantity>available||available<1||!storageId} onClick={async()=>{await perform(command);onClose();}}>Confirmar movimentação no jogo</button></div>
 </Card>;
}
