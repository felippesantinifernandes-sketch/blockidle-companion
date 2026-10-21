import data from '../catalog/salePrices.json';
import {items} from '../catalog/itemCatalog';
import {isProtected} from './transformations';
import {goalCommandBlock} from './objectives';
import type {GameState,Preferences,SaleRule,SaleCommand} from './types';
export const salePriceSource=data.source;
export const salePrices=data.prices as Record<string,number>;
export const salePrice=(state:GameState|null|undefined,id:string)=>{const live=(state?.character.companionCapabilities as {salePrices?:Record<string,number>}|undefined)?.salePrices;return live?live[id]??0:salePrices[id]??0;};
export const saleEligible=(id:string,state?:GameState|null)=>!!items[id]&&['Material','Encantado','Gema','Pesca'].includes(items[id].category)&&Number.isFinite(salePrice(state,id))&&salePrice(state,id)>0&&!/rod|flint_and_steel|crafting_table|mesa_portatil|furnace|hopper|bow$|booster_cookie|vale_gemas|_bed$/.test(id);
export function salePlan(state:GameState|null,prefs:Preferences,rule:SaleRule){
 const inventory=state?.storages.find(s=>s.id==='inventory')?.items[rule.itemId]??0;
 const stored=state?.storages.filter(s=>s.kind==='chest'||s.id==='fazenda:colheita').reduce((n,s)=>n+(s.items[rule.itemId]??0),0)??0;
 let reason=!saleEligible(rule.itemId,state)?'Preço de venda ou categoria não validado.':isProtected(rule.itemId,prefs)?'Item protegido, favorito ou reservado.':undefined;
 const keep=rule.keep,available=Math.max(0,inventory-keep),pulls:SaleCommand['pulls']=[];
 let quantity=Math.min(available,1000000);
 if(!quantity&&rule.includeStored&&inventory>=keep&&state){
  const source=state.storages.find(s=>(s.kind==='chest'||s.id==='fazenda:colheita')&&(s.items[rule.itemId]??0)>0);
  if(source){quantity=Math.min(source.items[rule.itemId],64);pulls.push({storageId:source.id,itemId:rule.itemId,quantity});}
 }
 if(rule.includeStored&&stored>0&&inventory<keep&&!quantity)reason??='A mochila ainda não atingiu a reserva. Retire a reserva antes de vender dos baús.';
 const command:SaleCommand={kind:'sell',itemId:rule.itemId,quantity,keep,expectedInventory:inventory,unitPrice:salePrice(state,rule.itemId),pulls,automatic:false};
 if(state)reason??=goalCommandBlock(command,state,prefs);
 return{inventory,stored,keep,excess:Math.max(0,inventory+(rule.includeStored?stored:0)-keep),quantity,value:quantity*command.unitPrice,reason,command:quantity>0&&!reason?command:undefined};
}
