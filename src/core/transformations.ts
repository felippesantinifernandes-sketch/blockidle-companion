import{craftRecipes}from'./workbench';
import {recipes,items} from '../catalog/itemCatalog';
import type {GameState,ManualCommand,Preferences,Recipe} from './types';
export function physicalQuantity(state:GameState,id:string,storageIds?:string[]){return state.storages.filter(s=>!storageIds||storageIds.includes(s.id)).reduce((n,s)=>n+(s.items[id]??0),0);}
export function transformAvailability(state:GameState,recipe:Recipe,prefs:Preferences){
 const eligible=recipe.kind==='lapidary'?['inventory','saco']:['inventory'];
 const materials=Object.entries(recipe.ingredients).map(([id,perBatch])=>({id,perBatch,quantity:physicalQuantity(state,id,eligible),stored:physicalQuantity(state,id)-physicalQuantity(state,id,eligible)}));
 const protectedId=materials.find(m=>isProtected(m.id,prefs))?.id;
 const max=Math.max(0,Math.min(...materials.map(m=>Math.floor(m.quantity/m.perBatch))));
 return {materials,batches:max,eligible,blocked:protectedId?'Material protegido ou reservado: '+(items[protectedId]?.name??protectedId):isProtected(recipe.id,prefs)?'O item de saída está protegido ou reservado.':undefined};
}
export function isProtected(id:string,prefs:Preferences){return prefs.favorites.includes(id)||prefs.protectedItems.includes(id)||(prefs.reserves[id]??0)>0||prefs.policies.some(p=>p.enabled&&p.itemId===id&&(p.action==='protect'||p.minimumReserve>0))||prefs.groups.some(g=>g.protectedItemIds.includes(id));}
export function commandProtection(command:ManualCommand,state:GameState,prefs:Preferences):string|undefined {
 if(command.kind==='goalStep')return;
 if(command.kind==='craft'){const r=craftRecipes.find(r=>r.id===command.recipeId);if(!r)return'Receita não encontrada.';const ids=[r.outputId,...Object.keys(r.ingredients),...(r.consumes?[r.consumes]:[]),...(r.consumesEquipment&&r.tool?[String(state.character[r.tool]??'')]:[])];if(ids.some(id=>isProtected(id,prefs)))return'Ingrediente, saída ou equipamento protegido/reservado.';return;}
 const ids=command.kind==='compactor'?[command.itemId]:command.kind==='profile'?command.itemIds:command.kind==='transform'?[command.recipeId]:[command.itemId];
 if(command.kind==='compactor'&&!command.enabled)return;
 for(const id of ids){const recipe=recipes.find(r=>r.id===id);const consumed=command.kind==='move'?[id]:[id,...Object.keys(recipe?.ingredients??{})];if(consumed.some(id=>isProtected(id,prefs)))return 'Ação bloqueada: item protegido, favorito ou reservado.';}
 if(command.kind==='move'){
  const item=items[command.itemId];if(!item||['Arma','Armadura','Ferramenta','Pet','Acessório','Sem catálogo'].includes(item.category))return 'Equipamento ou identidade individual sem validação para movimentação.';
  if(JSON.stringify(state.character).includes('"'+command.itemId+'"'))return 'O item está equipado ou usado por um equipamento.';
 }
}
