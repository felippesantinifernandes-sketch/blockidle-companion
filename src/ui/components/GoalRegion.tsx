import {useMemo,useState} from 'react';
import {objectivePlan,goalFilterAdvice,goalRegionAdvice} from '../../core/objectives';
import {compactorCapacity} from '../../core/regions';
import {itemName} from '../../catalog/itemCatalog';
import {observedBuild} from '../../core/versionMonitor';
import {useStore} from '../store';
import {useActions} from '../actions';
import {number} from './common';

export function GoalRegion({regionId}:{regionId:string}){
 const {state,prefs}=useStore(),actions=useActions(),[confirm,setConfirm]=useState<'apply'|'disable'>();
 const plan=useMemo(()=>state?objectivePlan(state,prefs):undefined,[state,prefs]);
 if(!state||!plan||!plan.goals.length)return null;
 const advice=goalFilterAdvice(state,prefs,regionId,plan),drops=goalRegionAdvice(plan,regionId)[0]?.drops??[];
 const active=Array.isArray(state.character.autoCompactar)?state.character.autoCompactar as string[]:undefined,limit=compactorCapacity(state);
 const apply=advice.suggested.filter(id=>!active?.includes(id)).slice(0,Math.max(0,(limit??0)-(active?.length??0)));
 const live=state.source==='live'&&state.build===observedBuild&&!!active&&!!limit&&!actions.busy&&actions.lockedScope!==state.scope;
 return <section className="goal-region"><h3>Esta região e seus objetivos</h3>{drops.length?drops.map(d=><p key={d.itemId}><strong>{itemName(d.itemId)}</strong>: faltam {number(plan.missing[d.itemId])} · {d.condition}</p>):<p className="muted">Nenhum faltante básico foi associado aos drops publicados desta região.</p>}{advice.held.length>0&&<p className="notice">Mantenha sem automatizar: {advice.held.map(itemName).join(', ')}. Esses filtros consumiriam materiais necessários diretamente nas receitas.</p>}{advice.suggested.length>0&&<p>Sugestões para produzir componentes dos objetivos: {advice.suggested.map(itemName).join(', ')}.</p>}{advice.conflicts.length>0&&<p role="alert" className="warning-text">Filtros já ativos podem consumir materiais dos objetivos: {advice.conflicts.map(itemName).join(', ')}. A proteção local não os desliga sozinha.</p>}<div className="button-row">{apply.length>0&&<button disabled={!live} onClick={()=>setConfirm('apply')}>Revisar filtros sugeridos</button>}{advice.conflicts.length>0&&<button disabled={!live} onClick={()=>setConfirm('disable')}>Revisar filtros conflitantes</button>}</div>{confirm&&<div className="confirmation"><h3>{confirm==='apply'?'Aplicar sugestões':'Desativar filtros conflitantes'}</h3><p>{(confirm==='apply'?apply:advice.conflicts).map(itemName).join(', ')}</p><p className="muted">As respostas serão conferidas uma a uma. O processo para se houver falha.</p><div className="button-row"><button onClick={()=>setConfirm(undefined)}>Cancelar</button><button className="primary" disabled={!live} onClick={async()=>{if(confirm==='apply')await actions.perform({kind:'profile',itemIds:apply});else for(const id of advice.conflicts){const r=await actions.perform({kind:'compactor',itemId:id,enabled:false});if(!r.ok)break;}setConfirm(undefined);}}>Confirmar alteração de filtros</button></div></div>}</section>;
}
