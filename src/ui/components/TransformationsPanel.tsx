import {useMemo,useState} from 'react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {recipes,itemName} from '../../catalog/itemCatalog';
import {currentRegion,regionModel} from '../../core/regions';
import {transformAvailability} from '../../core/transformations';
import {observedBuild} from '../../core/versionMonitor';
import {Card,ItemIcon,number} from './common';
export function TransformationsPanel({inputFilter='',onLocate}:{inputFilter?:string;onLocate?:(id:string)=>void}){
 const {state,prefs}=useStore(),{busy,perform,lockedScope}=useActions();
 const [kind,setKind]=useState('all'),[showAll,setShowAll]=useState(false),[query,setQuery]=useState(''),[pending,setPending]=useState('');
 const region=currentRegion(state),model=region?regionModel(region,prefs):undefined;
 const relevant=new Set([...(model?.compactorIds??[]),...(model?.lapidaryIds??[])]);
 const rows=useMemo(()=>state?recipes.map(recipe=>({recipe,available:transformAvailability(state,recipe,prefs)})):[],[state,prefs]);
 const visible=rows.filter(({recipe:r,available:a})=>(kind==='all'||r.kind===kind)&&(!inputFilter||Object.hasOwn(r.ingredients,inputFilter)||r.id===inputFilter)&&(showAll||inputFilter||a.batches>0||relevant.has(r.id))&&itemName(r.id).toLowerCase().includes(query.toLowerCase()));
 const selected=rows.find(v=>v.recipe.id===pending),live=state?.source==='live'&&state.build===observedBuild,locked=!!lockedScope&&lockedScope===state?.scope;
 if(!state)return null;
 return <Card title="Compactar e lapidar no terminal" action={<span className="badge">{recipes.length} receitas rastreáveis</span>}><p className="muted">Compactação manual usa a mochila. Lapidação usa mochila + saco de gemas. Materiais em baús ou bolsas precisam ser retirados para uma origem aceita antes de transformar. A gema Perfeita é da Forja.</p>
  <div className="toolbar"><select aria-label="Tipo de transformação" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Compactação e lapidação</option><option value="compact">Compactação</option><option value="lapidary">Lapidação</option></select><input aria-label="Buscar transformação" placeholder="Buscar receita…" value={query} onChange={e=>setQuery(e.target.value)}/><label className="checkbox-label"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>Mostrar todo o catálogo</label></div>
  {inputFilter&&<p className="notice">Receitas relacionadas a {itemName(inputFilter)}.</p>}
  <div className="transformation-list">{visible.map(({recipe:r,available:a})=><article className="transformation" key={r.id}><ItemIcon id={r.id}/><div><strong>{itemName(r.id)}</strong><small>{r.kind==='lapidary'?'Lapidação':'Compactação'} · {Object.entries(r.ingredients).map(([id,q])=>number(q)+' '+itemName(id)).join(' + ')} → 1</small><small>{a.materials.map(m=>number(m.quantity)+' acessíveis · '+number(m.stored)+' em outros locais').join(', ')}</small>{a.blocked&&<small className="warning-text">{a.blocked}</small>}<a href={r.source} target="_blank" rel="noreferrer">Receita oficial · {r.sourceDate}</a></div><div className="transform-buttons"><b>{number(a.batches)} possíveis</b><button disabled={!a.batches||!!a.blocked||busy||locked} onClick={()=>setPending(r.id)}>Revisar {r.kind==='lapidary'?'lapidação':'compactação'}</button>{onLocate&&a.materials.map(m=><button className="text-button" key={m.id} onClick={()=>onLocate(m.id)}>Localizar {itemName(m.id)}</button>)}</div></article>)}{!visible.length&&<p className="muted">Nenhuma transformação disponível neste filtro. Consulte o catálogo completo ou retire materiais dos armazenamentos.</p>}</div>
  {selected&&<div className="confirmation"><h3>Revisar transformação</h3><p>Produzir {number(selected.available.batches)} {itemName(selected.recipe.id)} consumindo {selected.available.materials.map(m=>number(m.perBatch*selected.available.batches)+' '+itemName(m.id)).join(' + ')}.</p><p className="muted">A ação nativa processa todas as receitas disponíveis desta etapa. A extensão confere o estoque imediatamente antes e valida os saldos após a resposta. Etapas seguintes exigem nova revisão.</p>{!live&&<p className="warning-text">Prévia offline. Conecte ao jogo para executar.</p>}<div className="button-row"><button onClick={()=>setPending('')}>Cancelar transformação</button><button className="primary" disabled={!live||busy||locked||!!selected.available.blocked||selected.available.batches<1} onClick={async()=>{await perform({kind:'transform',recipeId:selected.recipe.id,expectedBatches:selected.available.batches});setPending('');}}>Confirmar transformação no jogo</button></div></div>}
 </Card>;
}
