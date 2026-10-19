import {craftRecipes, craftPlan, forgeInfo, recipeRequirements, type CraftRecipe, type Pull} from './workbench';
import {recipes, itemName} from '../catalog/itemCatalog';
import {regions} from './regions';
import {isProtected, physicalQuantity} from './transformations';
import type {CraftObjective, GameState, Preferences, NativeCommand, ManualCommand} from './types';

export interface PlanningRecipe {
 id:string; outputId:string; name:string; output:number; ingredients:Record<string,number>;
 kind:CraftRecipe['kind']|'compact'|'lapidary'; source:string; craft?:CraftRecipe;
}
export function planningRecipes():PlanningRecipe[]{return [
 ...craftRecipes.map(r=>({...r,craft:r})),
 ...recipes.map(r=>({id:r.kind+':'+r.id,outputId:r.id,name:itemName(r.id),output:r.output,ingredients:r.ingredients,kind:r.kind!,source:r.source}))
];}
export interface PlanStep {
 id:string; type:'recipe'|'gather'|'wait'|'blocked'; itemId:string; quantity:number;
 recipeId?:string; batches?:number; dependencies:string[]; reasons:string[];
 source?:string; until?:number; forgeMs?:number; command?:NativeCommand;
}
export interface ObjectivePlan {
 objective:CraftObjective; recipe?:PlanningRecipe; owned:number; fulfilled:number; complete:boolean;
 steps:PlanStep[]; claims:Record<string,number>; allocations:Record<string,number>;
 missing:Record<string,number>; retained:Record<string,number>; forgeWorkMs:number; unknownForgeTime:boolean;
}
export interface GoalsPlan {goals:ObjectivePlan[];claims:Record<string,number>;retained:Record<string,number>;missing:Record<string,number>;review:string}
const count=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:0;
const add=(map:Record<string,number>,id:string,n:number)=>{if(n>0)map[id]=(map[id]??0)+n;};
export function ownedQuantity(s:GameState,id:string){
 const equipped=[['picareta','picaretas'],['machado','machados'],['espada','armas'],['enxada','enxadas'],['vara','varas'],['arco','arcos'],['arma',''],['compactador',''],['apagador','']].filter(([slot,list])=>s.character[slot]===id||Array.isArray(s.character[list])&&(s.character[list] as unknown[]).includes(id)).length;
 const armor=Object.values((s.character.armadura??{}) as object).filter(v=>v===id).length;
 const bagValue=(s.character.accessoryBag as Record<string,unknown>|undefined)?.[id],bag=bagValue===true?1:count(bagValue);
 return id==='ouro'?count(s.character.ouro):physicalQuantity(s,id)+equipped+armor+bag;
}
export function goalSnapshot(state:GameState,plan:GoalsPlan){return{
 stock:Object.fromEntries(Object.keys(plan.claims).map(id=>[id,ownedQuantity(state,id)])),
 forge:(Array.isArray(state.progress.forja)?state.progress.forja:[]).map((t:any)=>[t?.id??null,t?.fim??null]),
 queue:(Array.isArray(state.character.fila)?state.character.fila:[]).map((t:any)=>[t?.tipo??null,t?.receita??t?.id??null,t?.vezes??1]),
 active:state.character.alvo&&typeof state.character.alvo==='object'?[(state.character.alvo as any).tipo??null,(state.character.alvo as any).receita??(state.character.alvo as any).id??null,(state.character.alvo as any).vezes??1]:[],
};}
// A review fingerprint detects changed inputs; the worker always recomputes the authorized command.
export function reviewFingerprint(value:unknown){const stable=(v:any):any=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;const text=JSON.stringify(stable(value));let a=2166136261,b=3335557771;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b^text.charCodeAt(i),2246822519);}return(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
export function objectivePlan(state:GameState,prefs:Preferences,catalog=planningRecipes()):GoalsPlan {
 type Lot={quantity:number;dependencies:string[];held:boolean};
 const pool=new Map<string,Lot[]>(),byOutput=new Map<string,PlanningRecipe[]>();
 for(const r of catalog)byOutput.set(r.outputId,[...(byOutput.get(r.outputId)??[]),r]);
 const allIds=new Set([...state.storages.flatMap(s=>Object.keys(s.items)),...catalog.map(r=>r.outputId),'ouro']);
 for(const id of allIds)pool.set(id,[{quantity:ownedQuantity(state,id),dependencies:[],held:true}]);
 const pending=new Map<string,{quantity:number;until?:number;label:string}[]>();
 for(const task of Array.isArray(state.progress.forja)?state.progress.forja as any[]:[]){
  if(typeof task?.id!=='string'||!Number.isFinite(task.fim))continue;
  const r=catalog.find(r=>r.kind==='forge'&&r.outputId===task.id);if(!r)continue;
  pending.set(r.outputId,[...(pending.get(r.outputId)??[]),{quantity:r.output,until:task.fim,label:task.fim<=Date.now()?'Pronto para retirar no jogo.':'Aguardando a tarefa já iniciada na Forja.'}]);
 }
 const tableTasks=[...(Array.isArray(state.character.fila)?state.character.fila as any[]:[]),...(state.character.alvo&&typeof state.character.alvo==='object'&&(state.character.alvo as any).tipo==='craftar'?[state.character.alvo]:[])];
 for(const task of tableTasks){if(!task||typeof task!=='object')continue;const r=catalog.find(r=>r.craft?.kind==='table'&&r.craft.nativeId===(task.receita??task.id));if(!r||task.tipo&&task.tipo!=='craftar')continue;pending.set(r.outputId,[...(pending.get(r.outputId)??[]),{quantity:r.output*Math.max(1,count(task.vezes)),label:'Pedido já aceito na fila de crafts; aguarde o preparo no jogo.'}]);}
 const goals:ObjectivePlan[]=[],claims:Record<string,number>={},retained:Record<string,number>={},missing:Record<string,number>={};let nodes=0;
 for(const objective of prefs.objectives.filter(g=>g.enabled)){
  const recipe=catalog.find(r=>r.id===objective.recipeId),steps:PlanStep[]=[];
  const goal:ObjectivePlan={objective,recipe,owned:recipe?ownedQuantity(state,recipe.outputId):0,fulfilled:0,complete:false,steps,claims:{},allocations:{},missing:{},retained:{},forgeWorkMs:0,unknownForgeTime:false};
  let serial=0;
  const step=(type:PlanStep['type'],itemId:string,quantity:number,extra:Partial<PlanStep>={})=>{const row:PlanStep={id:objective.id+':'+serial++,type,itemId,quantity,dependencies:[],reasons:[],...extra};steps.push(row);return row;};
  const need=(id:string,required:number,stack:string[],force?:PlanningRecipe,root=false):{dependencies:string[];held:number}=>{
   if(!Number.isSafeInteger(required)||required<1||required>1e12||nodes++>1500||stack.length>24){const x=step('blocked',id,required,{reasons:['Plano excede o limite de tamanho ou profundidade. Reduza a quantidade.']});return{dependencies:[x.id],held:0};}
   add(goal.claims,id,required);
   if(root)add(goal.retained,id,required);
   let left=required,held=0;const dependencies:string[]=[];
   for(const lot of pool.get(id)??[]){if(!left)break;if(lot.held&&!root&&isProtected(id,prefs))continue;const take=Math.min(left,lot.quantity);lot.quantity-=take;left-=take;if(lot.held){held+=take;add(goal.allocations,id,take);}dependencies.push(...lot.dependencies);}
   if(!left)return{dependencies:[...new Set(dependencies)],held};
   const waits=pending.get(id)??[];
   for(const p of waits){if(!left)break;if(!p.quantity)continue;const take=Math.min(left,p.quantity);p.quantity-=take;left-=take;const x=step('wait',id,take,{until:p.until,reasons:[p.label]});dependencies.push(x.id);}
   if(!left)return{dependencies:[...new Set(dependencies)],held};
   if(!root&&isProtected(id,prefs)){const x=step('blocked',id,left,{reasons:['Item protegido, favorito ou reservado manualmente. Revise essa proteção antes de utilizá-lo.']});dependencies.push(x.id);return{dependencies,held};}
   const options=byOutput.get(id)??[],choice=objective.choices[id];
   const selected=force??(choice?options.find(r=>r.id===choice):undefined)??options.find(r=>!Object.keys(r.ingredients).some(item=>[...stack,id].includes(item)));
   if(stack.includes(id)){const x=step('blocked',id,left,{reasons:['Ciclo de receitas detectado. Escolha outra receita ou obtenha o item diretamente.']});dependencies.push(x.id);return{dependencies,held};}
   if(!selected){const cyclic=options.length>0;const x=step(cyclic?'blocked':'gather',id,left,{source:'https://blockidle.io/wiki/item_'+id,reasons:[cyclic?'Ciclo de receitas detectado. Escolha outra receita ou obtenha o item diretamente.':id==='ouro'?'Ouro é saldo do personagem; obtenha-o no jogo.':'Obtenha este material por coleta, drop ou loja.']});if(!cyclic)add(goal.missing,id,left);dependencies.push(x.id);return{dependencies,held};}
   const batches=Math.ceil(left/selected.output),inputs:string[]=[];const direct:Record<string,number>={};
   for(const [item,q]of Object.entries(selected.ingredients)){if(selected.kind!=='compact'&&selected.kind!=='lapidary')add(goal.retained,item,q*batches);const n=need(item,q*batches,[...stack,id]);inputs.push(...n.dependencies);direct[item]=n.held;}
   const r=selected.craft,previous=r?.previous??r?.requiresCurrent;
   const consumed=[...new Set([...(r?.consumes&&!Object.hasOwn(selected.ingredients,r.consumes)?[r.consumes]:[]),...(r?.consumesEquipment&&previous&&!Object.hasOwn(selected.ingredients,previous)?[previous]:[])])];
   for(const item of consumed){add(goal.retained,item,1);const n=need(item,1,[...stack,id]);inputs.push(...n.dependencies);}
   if(previous&&!consumed.includes(previous)&&r?.tool&&state.character[r.tool]!==previous&&ownedQuantity(state,previous)===0){const n=need(previous,1,[...stack,id]);inputs.push(...n.dependencies);}
   const x=step('recipe',id,left,{recipeId:selected.id,batches,dependencies:[...new Set(inputs)],source:selected.source});
   if(r)x.reasons.push(...recipeRequirements(state,r));
   if(r?.unique&&batches>1)x.reasons.push('Receita única: o objetivo excede uma produção.');
   const runBatches=r?Math.min(batches,r.kind==='table'&&!r.unique?64:1):Math.min(batches,1000000);
   if(!inputs.length&&!x.reasons.length){
    if(r){const preview=craftPlan(state,r,prefs,runBatches,true);x.reasons.push(...preview.pendingRequirements,...preview.blocked);if(preview.materials.some(m=>(direct[m.id]??0)<m.required))x.reasons.push('Materiais atribuídos a outra etapa ou objetivo.');if(!preview.ready)x.reasons.push('Prepare os materiais na origem aceita pela receita.');if(!x.reasons.length)x.command={kind:'craft',recipeId:r.id,batches:runBatches,pulls:preview.pulls,expectedStock:preview.expectedStock};}
    else {const input=Object.keys(selected.ingredients)[0],ratio=selected.ingredients[input],required=runBatches*ratio,ids=selected.kind==='lapidary'?['inventory','saco']:['inventory'];const available=physicalQuantity(state,input,ids),pulls:Pull[]=[];let deficit=Math.max(0,required-available);for(const s of state.storages.filter(s=>s.kind==='chest'||s.kind==='ender'||s.kind==='special'&&s.id.startsWith('fazenda:')).sort((a,b)=>a.id.localeCompare(b.id))){const q=Math.min(deficit,s.items[input]??0);if(q){pulls.push({storageId:s.id,itemId:input,quantity:q});deficit-=q;}}
     if(deficit)x.reasons.push('Prepare os materiais na mochila ou no saco aceito pela transformação.');if(pulls.length>24||pulls.some(p=>p.quantity>1000000))x.reasons.push('Retiradas acima do limite; prepare parte dos materiais no Terminal.');if((direct[input]??0)<required)x.reasons.push('Materiais atribuídos a outra etapa ou objetivo.');if(isProtected(id,prefs)||isProtected(input,prefs))x.reasons.push('Material ou saída protegido manualmente.');if(selected.kind==='lapidary'&&Math.floor(Math.max(available,required)/ratio)>runBatches)x.reasons.push('A lapidação nativa processa tudo. Guarde o excedente da mochila/saco antes desta etapa.');if(!x.reasons.length)x.command={kind:'goalTransform',recipeId:id,batches:runBatches,pulls,expectedAvailable:available};
    }
   }else if(inputs.length)x.reasons.push('Conclua as etapas anteriores e atualize o estado.');
   if(selected.kind==='forge'){const f=forgeInfo(state,r?.minutes??0);x.forgeMs=f.effectiveMs;if(f.effectiveMs===undefined)goal.unknownForgeTime=true;else goal.forgeWorkMs+=f.effectiveMs*batches;}
   const surplus=batches*selected.output-left;if(surplus>0)pool.set(id,[...(pool.get(id)??[]),{quantity:surplus,dependencies:[x.id],held:false}]);
   dependencies.push(x.id);return{dependencies:[...new Set(dependencies)],held};
  };
  if(!recipe)step('blocked','receita',objective.quantity,{reasons:['A receita deste objetivo não está mais no catálogo. Remova ou substitua o objetivo.']});
  else {const result=need(recipe.outputId,objective.quantity,[],recipe,true);goal.fulfilled=result.held;goal.complete=result.dependencies.length===0&&result.held>=objective.quantity;if(result.dependencies.some(id=>!steps.some(s=>s.id===id)))step('wait',recipe.outputId,objective.quantity-result.held,{dependencies:result.dependencies,reasons:['Aguarde a produção atribuída a um objetivo anterior na lista.']});}
  for(const[id,n]of Object.entries(goal.claims))add(claims,id,n);for(const[id,n]of Object.entries(goal.retained))add(retained,id,n);for(const[id,n]of Object.entries(goal.missing))add(missing,id,n);goals.push(goal);
 }
 const review=reviewFingerprint({objectives:prefs.objectives,protections:[prefs.favorites,prefs.protectedItems,prefs.reserves,prefs.groups,prefs.policies,prefs.preserveGoalMaterials],scope:state.scope,tab:state.tabId,build:state.build,area:state.area,stocks:state.storages.map(s=>[s.id,Object.entries(s.items).filter(([id])=>claims[id]>0).sort(([a],[b])=>a.localeCompare(b))]),goals:goals.map(g=>[g.fulfilled,g.steps]),currency:claims.ouro?state.character.ouro:undefined});
 return{goals,claims,retained,missing,review};
}
export function goalCommandBlock(command:ManualCommand,state:GameState,prefs:Preferences,plan=objectivePlan(state,prefs)){
 if(!prefs.preserveGoalMaterials||command.kind==='goalStep'||command.kind==='compactor'&&!command.enabled)return;
 if(command.kind==='compactor'||command.kind==='profile'){const ids=command.kind==='profile'?command.itemIds:[command.itemId];if(ids.some(id=>Object.keys(recipes.find(r=>r.id===id)?.ingredients??{}).some(input=>plan.retained[input]>0)))return'Este filtro consumiria materiais necessários diretamente nos objetivos. Mantenha-o desativado ou pause o objetivo.';return;}
 const recipe=command.kind==='craft'?craftRecipes.find(r=>r.id===command.recipeId):undefined;
 const ids=command.kind==='craft'?[recipe?.outputId??'',...Object.keys(recipe?.ingredients??{}),...(recipe?.consumes?[recipe.consumes]:[]),...(recipe?.consumesEquipment&&recipe.tool?[String(state.character[recipe.tool]??'')]:[])]:command.kind==='move'?[command.itemId]:[command.recipeId];
 const used=ids.flatMap(id=>[id,...Object.keys(recipes.find(r=>r.id===id)?.ingredients??{})]);
 if(used.some(id=>(plan.claims[id]??0)>0))return'Material vinculado a um objetivo. Execute a etapa em Meus objetivos ou pause o objetivo para liberar a ação.';
}
export function goalRegionAdvice(plan:GoalsPlan,regionId?:string){
 const selected=regionId?regions.filter(r=>r.id===regionId):regions;
 return selected.map(region=>({region,drops:region.drops.filter(d=>(plan.missing[d.itemId]??0)>0)})).filter(r=>r.drops.length).map(row=>({...row,drops:row.drops.filter((d,i,a)=>a.findIndex(x=>x.itemId===d.itemId)===i)}));
}
export function goalFilterAdvice(state:GameState,prefs:Preferences,regionId:string,plan=objectivePlan(state,prefs)){
 const region=regions.find(r=>r.id===regionId),active=Array.isArray(state.character.autoCompactar)?state.character.autoCompactar as string[]:[];
 const candidates=recipes.filter(r=>region?.drops.some(d=>Object.hasOwn(r.ingredients,d.itemId))&&plan.goals.some(g=>!g.complete&&(g.claims[r.id]??0)>0));
 const allowed=candidates.filter(r=>!isProtected(r.id,prefs)&&Object.keys(r.ingredients).every(id=>!isProtected(id,prefs)&&!(plan.retained[id]>0)));
 return{suggested:allowed.map(r=>r.id),held:candidates.filter(r=>!allowed.includes(r)).map(r=>r.id),conflicts:active.filter(id=>{const r=recipes.find(r=>r.id===id);return !!r&&Object.keys(r.ingredients).some(item=>plan.retained[item]>0);})};
}
