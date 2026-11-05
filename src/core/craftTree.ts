import {ownedQuantity,type PlanningRecipe} from './objectives';
import type {GameState} from './types';

export interface TreeNode{id:string;need:number;have:number;missing:number;recipe?:PlanningRecipe;batches?:number;children:TreeNode[];status:'ok'|'craft'|'gather'|'cycle'}
export interface CraftTree{root:TreeNode;gather:Record<string,number>;crafts:{recipe:PlanningRecipe;batches:number}[];progress:number}
const MAX_DEPTH=8;
/** Receita preferida para um item: a primeira que não é da Forja (mais rápida), senão a primeira. */
const pick=(list:PlanningRecipe[]|undefined)=>list?.find(r=>r.kind!=='forge')??list?.[0];
/**
 * Árvore do que falta para ter `quantity` do item final. O estoque é consumido uma vez só entre os ramos
 * (o mesmo material não conta duas vezes) e o que falta de um item craftável vira sub-crafts.
 */
export function craftTree(state:GameState|null,recipe:PlanningRecipe,quantity:number,catalog:PlanningRecipe[]):CraftTree{
 const byOutput=new Map<string,PlanningRecipe[]>();for(const r of catalog)byOutput.set(r.outputId,[...(byOutput.get(r.outputId)??[]),r]);
 const pool=new Map<string,number>(),owned=(id:string)=>{if(!pool.has(id))pool.set(id,state?ownedQuantity(state,id):0);return pool.get(id)!;};
 const gather:Record<string,number>={},crafts:{recipe:PlanningRecipe;batches:number}[]=[];
 const expand=(id:string,need:number,path:string[],forced?:PlanningRecipe):TreeNode=>{
  const available=owned(id),take=Math.min(available,need);pool.set(id,available-take);
  const missing=need-take,node:TreeNode={id,need,have:take,missing,children:[],status:missing?'gather':'ok'};
  if(!missing)return node;
  const r=forced??pick(byOutput.get(id));
  if(r&&path.includes(id)){node.status='cycle';gather[id]=(gather[id]??0)+missing;return node;}
  if(!r||path.length>=MAX_DEPTH||id==='ouro'){gather[id]=(gather[id]??0)+missing;return node;}
  const batches=Math.ceil(missing/r.output);node.recipe=r;node.batches=batches;node.status='craft';
  node.children=Object.entries(r.ingredients).map(([ing,q])=>expand(ing,q*batches,[...path,id]));
  crafts.push({recipe:r,batches});return node;
 };
 const root=expand(recipe.outputId,quantity,[],recipe);
 // progresso: fração das folhas (materiais básicos) já cobertas, contando também o que já existe pronto
 const leaves=(n:TreeNode):{have:number;need:number}[]=>n.children.length?[{have:n.have,need:n.have},...n.children.flatMap(leaves)]:[{have:n.have,need:n.need}];
 const L=leaves(root),need=L.reduce((s,l)=>s+l.need,0),have=L.reduce((s,l)=>s+l.have,0);
 return {root,gather,crafts,progress:need?have/need:1};
}
