import {accessoryOverview} from './accessories';
import {objectivePlan} from './objectives';
import {craftRecipes} from './workbench';
import type {GameState,Preferences} from './types';

export function accessoryRecommendations(state:GameState,prefs:Preferences){
 const before=accessoryOverview(state);
 return before.rows.filter(a=>!a.active).map(a=>{
  const recipe=craftRecipes.find(r=>r.outputId===a.id);
  const plan=recipe?objectivePlan(state,{...prefs,objectives:[...prefs.objectives,{id:'recommend:'+a.id,recipeId:recipe.id,quantity:1,enabled:true,choices:{}}]}).goals.at(-1):undefined;
  const after=structuredClone(state),inv=after.storages.find(s=>s.kind==='inventory');
  if(!inv)return;
  if(!a.owned&&plan)for(const step of plan.steps.filter(s=>s.type==='recipe')){
   const r=craftRecipes.find(r=>r.id===step.recipeId);if(!r)continue;
   for(const[id,n]of Object.entries(r.ingredients)){
    const cost=n*(step.batches??1),inInv=inv.items[id]??0;inv.items[id]=Math.max(0,inInv-cost);
    const stored=state.storages.filter(s=>s.kind!=='inventory').reduce((q,s)=>q+(s.items[id]??0),0);
    if(cost>inInv+stored&&(after.character.accessoryBag as Record<string,unknown>|undefined)?.[id])delete(after.character.accessoryBag as Record<string,unknown>)[id];
   }
  }
  inv.items[a.id]=(inv.items[a.id]??0)+1;
  const gain=accessoryOverview(after).power-before.power;
  const missing=plan?.missing??{},reasons=[...new Set(plan?.steps.flatMap(s=>s.type==='blocked'||s.type==='recipe'&&!s.dependencies.length?s.reasons:[])??[])];
  return{...a,gain,recipeId:recipe?.id,activate:a.owned,missing,missingTypes:Object.keys(missing).length,ready:!a.owned&&!!plan&&plan.steps.some(s=>!!s.command)&&!plan.steps.some(s=>s.type==='gather'||s.type==='wait'||s.type==='blocked'||s.reasons.length),reasons};
 }).filter((a):a is NonNullable<typeof a>=>!!a&&a.gain>0).sort((a,b)=>Number(b.activate)-Number(a.activate)||Number(b.ready)-Number(a.ready)||Number(!!b.recipeId)-Number(!!a.recipeId)||a.missingTypes-b.missingTypes||b.gain-a.gain||a.name.localeCompare(b.name,'pt-BR'));
}
