import {useMemo,useState} from 'react';
import {Target,Pin,PinOff,ChevronDown,ChevronRight,CheckCircle2,Hammer,PackageSearch,Coins,Plus,Trash2} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {useBazaar} from '../bazaar';
import {ItemIcon,ItemName,number} from './common';
import {planningRecipes,type PlanningRecipe} from '../../core/objectives';
import {craftTree,type TreeNode} from '../../core/craftTree';
import {itemLocations,bazaarCost} from '../../core/locations';
import {itemName} from '../../catalog/itemCatalog';

const plain=(t:string)=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function Node({node,depth,onOpen}:{node:TreeNode;depth:number;onOpen:(id:string)=>void}){
 const [open,setOpen]=useState(depth<2),has=node.children.length>0;
 return <li className={'tree-node '+node.status}>
  <div className="tree-row">
   {has?<button className="icon-button tree-toggle" aria-label={(open?'Recolher ':'Expandir ')+itemName(node.id)} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>:<span className="tree-toggle"/>}
   <ItemIcon id={node.id}/>
   <span className="tree-name"><ItemName id={node.id}/>{node.recipe&&<button className="text-button" onClick={()=>onOpen(node.recipe!.id)}><Hammer size={12}/>craftar {number(node.batches!)}×</button>}</span>
   <span className="tree-qty">{node.status==='ok'?<CheckCircle2 size={14}/>:null}{number(node.have)} / {number(node.need)}</span>
  </div>
  {has&&open&&<ul>{node.children.map(c=><Node key={c.id} node={c} depth={depth+1} onOpen={onOpen}/>)}</ul>}
 </li>;
}
/** Objetivo fixado no topo da guia Crafts: o que falta, em árvore, até os materiais básicos. */
export function PinnedGoal({onOpen}:{onOpen:(recipeId:string)=>void}){
 const {state,prefs,patch}=useStore(),{notify}=useActions(),bazaar=useBazaar(),catalog=useMemo(planningRecipes,[]);
 const [query,setQuery]=useState(''),[pick,setPick]=useState<PlanningRecipe>(),[qty,setQty]=useState(1),[adding,setAdding]=useState(false);
 const goal=prefs.objectives.find(g=>g.id===prefs.pinnedObjective)??undefined,recipe=goal?catalog.find(r=>r.id===goal.recipeId):undefined;
 const tree=useMemo(()=>recipe&&goal?craftTree(state,recipe,goal.quantity,catalog):undefined,[state,recipe,goal,catalog]);
 const matches=query.trim()?catalog.filter(r=>plain(r.name+' '+r.outputId).includes(plain(query.trim()))).slice(0,8):[];
 const add=()=>{if(!pick)return;const id=crypto.randomUUID();patch({objectives:[...prefs.objectives,{id,recipeId:pick.id,quantity:Math.max(1,qty),enabled:true,choices:{}}],pinnedObjective:id});setAdding(false);setQuery('');setPick(undefined);setQty(1);notify('Objetivo fixado no topo.');};
 const form=<div className="pinned-add"><div className="pinned-search"><input aria-label="Buscar item para o objetivo" placeholder="Qual item você quer fazer?" value={pick?pick.name:query} onChange={e=>{setPick(undefined);setQuery(e.target.value);}}/>{!pick&&matches.length>0&&<ul className="pinned-suggest" role="listbox">{matches.map(r=><li key={r.id}><button role="option" aria-selected={false} onClick={()=>{setPick(r);setQty(r.output);}}><ItemIcon id={r.outputId}/><ItemName id={r.outputId}/><small>{r.kind}</small></button></li>)}</ul>}</div><label>Quantidade<input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1,Math.floor(Number(e.target.value)||1)))}/></label><button className="primary" disabled={!pick||prefs.objectives.length>=50} onClick={add}><Pin size={14}/>Adicionar e fixar</button>{goal&&<button onClick={()=>setAdding(false)}>Cancelar</button>}</div>;
 if(!goal||!recipe||!tree)return <section className="pinned-goal empty-goal" aria-label="Objetivo fixado"><div className="pinned-head"><Target size={22}/><div><h2>Fixe um objetivo</h2><p className="muted">Escolha um item e veja aqui no topo tudo o que falta, inclusive os crafts intermediários.</p></div></div>{form}</section>;
 const owned=tree.root.have,need=goal.quantity,pct=Math.round(tree.progress*100),gather=Object.entries(tree.gather).sort((a,b)=>b[1]-a[1]);
 const costs=gather.map(([id,n])=>{const elsewhere=itemLocations(state,id).filter(l=>!l.pays).reduce((t,l)=>t+l.quantity,0);return {id,n,elsewhere,buy:bazaarCost(bazaar.prices,id,Math.max(0,n-elsewhere))};});
 const total=costs.every(c=>c.buy!==undefined)?costs.reduce((t,c)=>t+(c.buy??0),0):undefined;
 return <section className={'pinned-goal'+(tree.root.status==='ok'?' done':'')} aria-label="Objetivo fixado">
  <div className="pinned-head"><span className="pinned-icon"><ItemIcon id={recipe.outputId}/></span><div className="pinned-title"><small><Target size={12}/> Objetivo fixado</small><h2><ItemName id={recipe.outputId}/></h2><span className="muted">{tree.root.status==='ok'?'Concluído: você já tem '+number(owned)+'.':'Tem '+number(owned)+' de '+number(need)+' · '+tree.crafts.length+' craft(s) · '+gather.length+' material(is) para coletar'}</span></div>
   <div className="pinned-actions">{prefs.objectives.length>1&&<select aria-label="Trocar objetivo fixado" value={goal.id} onChange={e=>patch({pinnedObjective:e.target.value})}>{prefs.objectives.map(g=><option key={g.id} value={g.id}>{itemName(catalog.find(r=>r.id===g.recipeId)?.outputId??g.recipeId)} × {g.quantity}</option>)}</select>}<button onClick={()=>setAdding(!adding)}><Plus size={14}/>Novo</button><button aria-label="Desafixar objetivo" onClick={()=>patch({pinnedObjective:null})}><PinOff size={14}/></button><button aria-label="Remover objetivo" onClick={()=>patch({objectives:prefs.objectives.filter(g=>g.id!==goal.id),pinnedObjective:null})}><Trash2 size={14}/></button></div></div>
  <div className="pinned-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progresso do objetivo"><span style={{width:pct+'%'}}/></div>
  {adding&&form}
  {tree.root.status!=='ok'&&<div className="pinned-body">
   <div><h3><Hammer size={14}/> Ordem para craftar</h3>{tree.crafts.length?<ol className="pinned-steps">{tree.crafts.map(({recipe:r,batches},i)=><li key={r.id+i}><button className="pinned-step" onClick={()=>onOpen(r.id)}><ItemIcon id={r.outputId}/><span><ItemName id={r.outputId}/><small>{number(batches)}× · rende {number(batches*r.output)}</small></span></button></li>)}</ol>:<p className="muted">Nada para craftar ainda: falta material.</p>}</div>
   <div><h3><PackageSearch size={14}/> Para coletar ou comprar</h3>{costs.length?<ul className="pinned-gather">{costs.map(c=><li key={c.id}><ItemIcon id={c.id}/><span><ItemName id={c.id}/><small>{c.elsewhere?number(Math.min(c.elsewhere,c.n))+' guardado em baús/Ender/farm · ':''}{bazaar.prices?(c.buy===undefined?'sem oferta no Bazar':c.buy?'Bazar ≈ '+number(Math.ceil(c.buy)):'não precisa comprar'):''}</small></span><b>{number(c.n)}</b></li>)}</ul>:<p className="muted">Nenhum material básico faltando.</p>}
    <div className="button-row"><button onClick={()=>void bazaar.load()} disabled={bazaar.loading}><Coins size={14}/>{bazaar.loading?'Consultando…':bazaar.at?'Atualizar preços':'Ver custo no Bazar'}</button>{total!==undefined&&costs.length>0&&<span className="muted">Comprar tudo ≈ {number(Math.ceil(total))} de ouro</span>}</div>{bazaar.error&&<small className="warning-text">{bazaar.error}</small>}</div>
  </div>}
  <details className="pinned-tree" open={tree.root.status!=='ok'}><summary>Árvore completa</summary><ul className="tree"><Node node={tree.root} depth={0} onOpen={onOpen}/></ul></details>
 </section>;
}
