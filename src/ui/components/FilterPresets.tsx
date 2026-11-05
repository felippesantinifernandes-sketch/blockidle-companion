import {useBazaar} from '../bazaar';
import {useMemo,useState} from 'react';
import {Plus,Save,ShieldCheck,Trash2,Pencil,Copy,Filter,Layers,Eraser,Coins} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {Card,ItemIcon,ItemName} from './common';
import {items,itemName,autoRecipes} from '../../catalog/itemCatalog';
import {regions,currentRegion,regionModel} from '../../core/regions';
import {commandProtection} from '../../core/transformations';
import {goalCommandBlock} from '../../core/objectives';
import {supportsCommandBuild} from '../../core/versionMonitor';
import {activeList,eligible,emptyPresets,listCapacity,listKinds,listLabels,presetDiff,presetIcon,sameSet,eraserSlotsFallback,AUTOSELL_SLOTS,type ListKind} from '../../core/nativeLists';
import type {FilterPreset,ManualCommand} from '../../core/types';

const plain=(t:string)=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const maxSlots:Record<ListKind,number>={compactor:12,eraser:Math.max(...Object.values(eraserSlotsFallback)),autosell:AUTOSELL_SLOTS};
/** Ingrediente consumido por um filtro do compactador (o que de fato chega na mochila). */
const inputOf=(id:string)=>Object.keys(autoRecipes.find(r=>r.id===id)?.ingredients??{})[0];
const commandFor=(kind:ListKind,itemIds:string[]):ManualCommand=>kind==='compactor'?{kind:'profile',itemIds,replace:true}:{kind,itemIds};

type Slot={kind:ListKind;index:number};
type Draft=Slot&{name:string;itemIds:string[]};

export function FilterPresets(){
 const {state,prefs,patch}=useStore(),{busy,perform,lockedScope}=useActions();
 const presets=prefs.filterPresets??emptyPresets();
 const [selected,setSelected]=useState<Slot|null>(null),[draft,setDraft]=useState<Draft|null>(null),[confirm,setConfirm]=useState(false);
 const locked=!!lockedScope&&lockedScope===state?.scope;
 const savePreset=(kind:ListKind,index:number,value:FilterPreset|null)=>{const next={...presets,[kind]:presets[kind].map((p,i)=>i===index?value:p)};patch({filterPresets:next});};
 const open=(slot:Slot)=>{const p=presets[slot.kind][slot.index];setConfirm(false);if(p){setDraft(null);setSelected(slot);}else{setSelected(null);setDraft({...slot,name:listLabels[slot.kind].name+' '+(slot.index+1),itemIds:[]});}};
 return <Card icon={<Filter size={16}/>} title="Conjuntos de filtros" action={<span className="badge">3 listas · 9 conjuntos cada</span>}>
  <p className="muted">Cada quadrado guarda um conjunto pronto para uma lista da janela “Configurações da mochila” do jogo. Clique num quadrado vazio para criar; clique num preenchido para revisar e aplicar. O quadrado com borda verde é o que está ativo no jogo agora.</p>
  <div className="preset-columns">{listKinds.map(kind=>{const active=activeList(state,kind),limit=listCapacity(state,kind);return <section className="preset-column" key={kind} aria-label={'Conjuntos: '+listLabels[kind].name}>
   <header><strong className="preset-col-title">{kind==='compactor'?<Layers size={15}/>:kind==='eraser'?<Eraser size={15}/>:<Coins size={15}/>}{listLabels[kind].name}</strong><span className="badge">{active?active.length:'?'} / {limit??'?'} no jogo</span></header>
   <div className="preset-active" aria-label={'Ativos no jogo: '+listLabels[kind].name}>{active?.length?active.map(id=><span key={id} title={itemName(id)}><ItemIcon id={kind==='compactor'?inputOf(id)??id:id}/></span>):<small className="muted">{active?'Lista vazia no jogo.':state?.source==='live'?'O jogo não informou esta lista.':'Conecte ao jogo para ver.'}</small>}</div>
   {kind==='autosell'&&<AutosellOptions/>}
   <div className="preset-grid">{presets[kind].map((p,index)=>{const icon=p&&presetIcon(kind,p),isActive=!!p&&!!active&&sameSet(p.itemIds,active),isSelected=(selected?.kind===kind&&selected.index===index)||(draft?.kind===kind&&draft.index===index);
    return <button key={index} className={'preset-square'+(p?'':' preset-empty')+(isActive?' active':'')+(isSelected?' selected':'')} aria-pressed={isSelected} aria-label={p?p.name+' · '+p.itemIds.length+' itens'+(isActive?' · ativo no jogo':''):'Novo conjunto de '+listLabels[kind].name+' no quadrado '+(index+1)} title={p?p.name+'\n'+p.itemIds.map(itemName).join(', '):'Criar conjunto'} onClick={()=>open({kind,index})}>
     {p?<>{icon?<ItemIcon id={icon}/>:<span className="item-icon">∅</span>}<span className="preset-name">{p.name}</span><span className="preset-count">{p.itemIds.length}</span></>:<Plus size={16}/>}
    </button>;})}</div>
  </section>;})}</div>
  {draft&&<PresetEditor draft={draft} onChange={setDraft} onCancel={()=>setDraft(null)} onSave={()=>{savePreset(draft.kind,draft.index,{name:draft.name.trim()||listLabels[draft.kind].name,itemIds:draft.itemIds});setDraft(null);setSelected({kind:draft.kind,index:draft.index});}}/>}
  {!draft&&selected&&(()=>{const {kind,index}=selected,p=presets[kind][index];if(!p)return null;
   const active=activeList(state,kind),limit=listCapacity(state,kind),diff=presetDiff(p,active),command=commandFor(kind,p.itemIds);
   const live=state?.source==='live'&&supportsCommandBuild(state.build,command.kind,state)&&!!active&&!!limit;
   const blocked=state?commandProtection(command,state,prefs)??goalCommandBlock(command,state,prefs):undefined;
   const invalid=p.itemIds.filter(id=>!eligible(kind,id,state));
   const prices=useBazaar.getState().prices,pricey=kind!=='compactor'&&prefs.valueGuard!==null&&prices?p.itemIds.filter(id=>Math.max(prices[id]?.sell??0,prices[id]?.buy??0)>prefs.valueGuard!):[];
   const over=!!limit&&p.itemIds.length>limit;
   const reason=!state||state.source!=='live'?'Conecte ao jogo para aplicar.':!supportsCommandBuild(state.build,command.kind,state)?'Build atual do jogo não validado para esta ação.':!active?'O jogo não informou esta lista. Recarregue a aba.':!limit?(kind==='eraser'?'Guarde um Apagador Pessoal na janela da mochila.':'Guarde um Compactador Pessoal na janela da mochila.'):over?'O conjunto tem '+p.itemIds.length+' itens, mas há '+limit+' vagas.':invalid.length?'Não aceitos nesta lista: '+invalid.map(itemName).join(', ')+'.':pricey.length?'Acima do seu limite de valor no Bazar: '+pricey.map(itemName).join(', ')+'.':blocked;
   const same=!!active&&sameSet(p.itemIds,active);
   return <div className="preset-detail">
    <div className="preset-detail-head"><div><h3>{p.name}</h3><small className="muted">{listLabels[kind].name} · quadrado {index+1} · {p.itemIds.length} itens{same?' · ativo no jogo':''}</small></div>
     <div className="button-row"><button onClick={()=>{setSelected(null);setDraft({kind,index,name:p.name,itemIds:[...p.itemIds]});}}><Pencil size={14}/>Editar</button><button onClick={()=>{const free=presets[kind].findIndex(v=>!v);if(free>=0){savePreset(kind,free,{name:(p.name+' (cópia)').slice(0,40),itemIds:[...p.itemIds]});setSelected({kind,index:free});}}} disabled={!presets[kind].some(v=>!v)}><Copy size={14}/>Duplicar</button><button onClick={()=>{savePreset(kind,index,null);setSelected(null);}}><Trash2 size={14}/>Esvaziar quadrado</button></div></div>
    <p className="muted">{listLabels[kind].description}</p>
    <div className="preset-items">{p.itemIds.length?p.itemIds.map(id=><span className="preset-item" key={id}><ItemIcon id={kind==='compactor'?inputOf(id)??id:id}/><ItemName id={id}/></span>):<span className="muted">Conjunto vazio: aplicar limpa a lista no jogo.</span>}</div>
    {active&&!same&&<p className="muted">{diff.add.length?'Entra: '+diff.add.map(itemName).join(', ')+'. ':''}{diff.remove.length?'Sai: '+diff.remove.map(itemName).join(', ')+'.':''}</p>}
    {kind==='eraser'&&<p className="notice warning-text">O apagador descarta de forma definitiva os itens marcados que chegarem depois de salvo. Confira a lista antes de aplicar.</p>}
    {kind==='autosell'&&state?.character.autoVenderTudo===true&&<p className="notice warning-text">A opção do jogo “Vender também qualquer outro item que não couber” está ligada: com a mochila cheia, itens fora desta lista (inclusive armaduras) também são vendidos. Desligue-a na janela da mochila para vender só os marcados.</p>}
    {reason&&<p className="notice">{reason}</p>}
    <div className="button-row"><button className="primary" disabled={!live||busy||locked||!!reason||same} onClick={()=>setConfirm(true)}><ShieldCheck size={15}/>{same?'Já ativo no jogo':'Aplicar no jogo'}</button></div>
    {confirm&&<div className="confirmation"><h3>Confirmar {listLabels[kind].name.toLowerCase()}</h3><p>A lista do jogo ficará exatamente: {p.itemIds.length?p.itemIds.map(itemName).join(', '):'vazia'}.</p>{diff.remove.length>0&&<p>Saem da lista atual: {diff.remove.map(itemName).join(', ')}.</p>}<p className="muted">Cada resposta é conferida com o estado do servidor; o processo para no primeiro resultado sem confirmação.</p><div className="button-row"><button onClick={()=>setConfirm(false)}>Cancelar</button><button className="primary" disabled={busy||locked} onClick={async()=>{await perform(command);setConfirm(false);}}>Confirmar aplicação</button></div></div>}
   </div>;})()}
 </Card>;
}

function PresetEditor({draft,onChange,onCancel,onSave}:{draft:Draft;onChange:(d:Draft)=>void;onCancel:()=>void;onSave:()=>void}){
 const {state,prefs}=useStore();
 const here=currentRegion(state);
 const [source,setSource]=useState<string>(state?'inventory':here?.id??'all'),[query,setQuery]=useState('');
 const {kind}=draft,limit=listCapacity(state,kind)??maxSlots[kind],full=draft.itemIds.length>=limit;
 const active=activeList(state,kind);
 const candidates=useMemo(()=>{
  const region=regions.find(r=>r.id===source),inventory=state?.storages.find(s=>s.id==='inventory')?.items??{};
  const pool=kind==='compactor'?autoRecipes.map(r=>r.id):Object.keys(items);
  const from=(id:string)=>{const base=kind==='compactor'?inputOf(id)??id:id;return source==='all'||(source==='inventory'?(inventory[base]??0)>0:!!region?.drops.some(d=>d.itemId===base));};
  const q=plain(query.trim());
  return [...new Set(pool)].filter(id=>eligible(kind,id,state)&&from(id)&&(!q||plain(itemName(id)).includes(q)||id.includes(q))).sort((a,b)=>itemName(a).localeCompare(itemName(b),'pt-BR')).slice(0,240);
 },[kind,source,query,state]);
 const toggle=(id:string)=>onChange({...draft,itemIds:draft.itemIds.includes(id)?draft.itemIds.filter(v=>v!==id):full?draft.itemIds:[...draft.itemIds,id]});
 const regionTemplate=kind==='compactor'&&here?regionModel(here,prefs,limit).compactorIds:undefined;
 return <div className="preset-detail preset-editor">
  <div className="preset-detail-head"><div><h3>{listLabels[kind].name} · quadrado {draft.index+1}</h3><small className="muted">{draft.itemIds.length} / {limit} itens{listCapacity(state,kind)?'':' (vagas não confirmadas pelo jogo)'}</small></div>
   <div className="button-row">{active&&<button onClick={()=>onChange({...draft,itemIds:active.slice(0,limit)})}>Copiar do jogo</button>}{regionTemplate&&<button onClick={()=>onChange({...draft,name:here!.name.slice(0,40),itemIds:regionTemplate})}>Modelo de {here!.name}</button>}<button onClick={()=>onChange({...draft,itemIds:[]})} disabled={!draft.itemIds.length}>Limpar</button></div></div>
  <label>Nome<input maxLength={40} value={draft.name} onChange={e=>onChange({...draft,name:e.target.value})}/></label>
  <div className="preset-items" aria-label="Itens do conjunto">{draft.itemIds.length?draft.itemIds.map(id=><button key={id} className="preset-item chosen" title="Clique para tirar" onClick={()=>toggle(id)}><ItemIcon id={kind==='compactor'?inputOf(id)??id:id}/>{itemName(id)} ×</button>):<span className="muted">Escolha itens abaixo.</span>}</div>
  <div className="toolbar"><select aria-label="Origem dos itens" value={source} onChange={e=>setSource(e.target.value)}><option value="inventory">Na mochila agora</option>{here&&<option value={here.id}>Drops de {here.name} (local atual)</option>}<option value="all">Todos os itens aceitos</option><optgroup label="Drops por região">{regions.filter(r=>r.id!==here?.id).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</optgroup></select><input aria-label="Buscar item" placeholder="Buscar item…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
  <div className="preset-picker">{candidates.map(id=>{const on=draft.itemIds.includes(id);return <button key={id} className={'preset-pick'+(on?' selected':'')} aria-pressed={on} disabled={!on&&full} title={itemName(id)+(kind==='compactor'?' ← '+itemName(inputOf(id)??id):'')} onClick={()=>toggle(id)}><ItemIcon id={kind==='compactor'?inputOf(id)??id:id}/><span>{itemName(id)}</span></button>;})}{!candidates.length&&<p className="muted">Nenhum item aceito nesta origem.</p>}</div>
  {full&&<small className="muted">Limite de {limit} itens atingido. Tire um item para escolher outro.</small>}
  <div className="button-row"><button onClick={onCancel}>Cancelar</button><button className="primary" onClick={onSave}><Save size={14}/>Salvar no quadrado</button></div>
 </div>;
}

function AutosellOptions(){
 const state=useStore(s=>s.state),{busy,perform,lockedScope}=useActions();
 const live=state?.source==='live'&&supportsCommandBuild(state.build,'autosellOption',state),locked=!!lockedScope&&lockedScope===state?.scope;
 const sold=(state?.character.autoVendido as {ouro?:unknown}|undefined)?.ouro;
 const row=(option:'autoja'|'autotudo',field:'autoVenderJa'|'autoVenderTudo',label:string)=>{const value=state?.character[field];return <label className="checkbox-label"><input type="checkbox" checked={value===true} disabled={!live||busy||locked||typeof value!=='boolean'} onChange={e=>void perform({kind:'autosellOption',option,enabled:e.target.checked})}/>{label}</label>;};
 return <div className="autosell-options">{row('autoja','autoVenderJa','Vender os marcados assim que chegam')}{row('autotudo','autoVenderTudo','Vender também qualquer outro item que não couber')}{typeof sold==='number'&&<small className="muted">Total vendido pela auto-venda: {Math.floor(sold).toLocaleString('pt-BR')} de ouro</small>}</div>;
}
