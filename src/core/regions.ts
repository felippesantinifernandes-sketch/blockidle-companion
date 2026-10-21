import data from '../catalog/regions.json';
import {autoRecipes,recipes} from '../catalog/itemCatalog';
import type {GameState,Preferences,Region} from './types';
export const regions=data as Region[];
export function currentRegion(state:GameState|null):Region|undefined {
 if(!state)return;
 if(state.area==='mina')return regions.find(r=>r.area==='mina'&&r.layer===(state.layer??'mina'));
 if(state.area==='floresta')return regions.find(r=>r.forest===(state.forest??'oak'));
 return regions.find(r=>r.id===state.area);
}
export function compactorCapacity(state:GameState|null):number|undefined {const live=(state?.character.companionCapabilities as {compactorSlots?:Record<string,number>}|undefined)?.compactorSlots;const map:Record<string,number>=live??{personal_compactor_4000:1,personal_compactor_5000:3,personal_compactor_6000:7,personal_compactor_7000:12};const n=map[String(state?.character.compactador??'')];return Number.isInteger(n)&&n>0&&n<=12?n:undefined;}
export function defaultModel(region:Region,limit=12){
 const weight=(id:string)=>Math.max(...region.drops.filter(d=>Object.hasOwn(autoRecipes.find(r=>r.id===id)?.ingredients??{},d.itemId)).map(d=>/quase sempre|rocha toda/i.test(d.frequency)?5:/^comum$/i.test(d.frequency)?4:/incomum/i.test(d.frequency)?3:/rar/i.test(d.frequency)?2:1),0);
 return {compactorIds:[...region.defaultCompactorIds].sort((a,b)=>Number(autoRecipes.some(r=>r.id===Object.keys(autoRecipes.find(r=>r.id===a)?.ingredients??{})[0]))-Number(autoRecipes.some(r=>r.id===Object.keys(autoRecipes.find(r=>r.id===b)?.ingredients??{})[0]))||weight(b)-weight(a)||a.localeCompare(b)).slice(0,limit),lapidaryIds:region.defaultLapidaryIds};
}
export function regionModel(region:Region,prefs:Preferences,limit=12){return prefs.regionModels[region.id]??defaultModel(region,limit);}
export function dropOptions(itemId:string){return {compact:autoRecipes.filter(r=>Object.hasOwn(r.ingredients,itemId)),lapidary:recipes.filter(r=>r.kind==='lapidary'&&Object.hasOwn(r.ingredients,itemId)),smelting:itemId==='raw_iron'?'iron_ingot':itemId==='raw_gold'?'gold_ingot':undefined};}
export const locationLabel=(state:GameState|null)=>currentRegion(state)?.name??state?.area??'Não disponível';
