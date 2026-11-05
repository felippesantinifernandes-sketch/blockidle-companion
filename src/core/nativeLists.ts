import {items,autoRecipes} from '../catalog/itemCatalog';
import {salePrice} from './sales';
import {compactorCapacity} from './regions';
import type {FilterPreset,GameState,Preferences} from './types';

/** As três listas da janela "Configurações da mochila" do jogo (mochilacfg.js, 31/10/2026). */
export type ListKind='compactor'|'eraser'|'autosell';
export const listKinds:ListKind[]=['compactor','eraser','autosell'];
export const PRESET_SLOTS=9;
export const AUTOSELL_SLOTS=7;
/** Fallback para APAGADOR_VAGAS quando o catálogo conectado não informa as vagas. */
export const eraserSlotsFallback:Record<string,number>={personal_deletor_4000:3,personal_deletor_5000:7,personal_deletor_6000:10,personal_deletor_7000:13};
export const listLabels:Record<ListKind,{name:string;verb:string;description:string}>={
 compactor:{name:'Compactador',verb:'compactar',description:'A cada 160 itens, o jogo cria a versão encantada. Gemas: a cada 80, a próxima lapidação.'},
 eraser:{name:'Apagador',verb:'apagar',description:'O jogo descarta os itens marcados ao chegar. Eles ainda contam para a coleção. O que já está na mochila não é apagado.'},
 autosell:{name:'Auto-venda',verb:'vender',description:'Vende pelo preço do NPC só o que chega quando a mochila está cheia. Com a opção do jogo “Vender os marcados assim que chegam”, vende na hora. O que já está na mochila fica.'},
};
const strings=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string')?v as string[]:undefined;
/** Lista ativa no jogo, ou undefined quando o estado não informa um formato válido. */
export function activeList(state:GameState|null|undefined,kind:ListKind):string[]|undefined{
 const c=state?.character;if(!c)return;
 return strings(kind==='compactor'?c.autoCompactar:kind==='eraser'?c.apagar:c.autoVender);
}
export function eraserCapacity(state:GameState|null|undefined):number|undefined{
 const live=(state?.character.companionCapabilities as {eraserSlots?:Record<string,number>}|undefined)?.eraserSlots;
 const n=(live??eraserSlotsFallback)[String(state?.character.apagador??'')];
 return Number.isInteger(n)&&n>0&&n<=20?n:undefined;
}
export function listCapacity(state:GameState|null|undefined,kind:ListKind):number|undefined{
 return kind==='compactor'?compactorCapacity(state??null):kind==='eraser'?eraserCapacity(state):AUTOSELL_SLOTS;
}
/** Regras espelhadas do cliente (o servidor confere novamente). */
export function eligible(kind:ListKind,id:string,state?:GameState|null):boolean{
 const item=items[id];if(!item)return false;
 if(kind==='compactor')return autoRecipes.some(r=>r.id===id);
 if(kind==='eraser')return !['Pet','Encantado','Sem catálogo'].includes(item.category)&&!['epico','lendario','mitico'].includes(item.rarity)&&!['booster_cookie','vale_gemas'].includes(id)&&!/^personal_(deletor|compactor)_/.test(id);
 return salePrice(state,id)>0&&!(item.category==='Armadura'&&['lendario','mitico'].includes(item.rarity))&&!['Pet','Poção','Sem catálogo'].includes(item.category)&&!id.endsWith('_bed')&&!/rod|flint_and_steel|crafting_table|mesa_portatil|furnace|hopper|bow$|booster_cookie|vale_gemas/.test(id);
}
export const emptyPresets=():Preferences['filterPresets']=>({compactor:Array(PRESET_SLOTS).fill(null),eraser:Array(PRESET_SLOTS).fill(null),autosell:Array(PRESET_SLOTS).fill(null)});
export const sameSet=(a:string[],b:string[])=>a.length===b.length&&[...a].sort().join('|')===[...b].sort().join('|');
export function presetDiff(preset:FilterPreset,active:string[]|undefined){
 const now=active??[];return {add:preset.itemIds.filter(id=>!now.includes(id)),remove:now.filter(id=>!preset.itemIds.includes(id))};
}
/** Ícone que representa o item no quadrado: no compactador, mostra o ingrediente consumido. */
export const presetIcon=(kind:ListKind,preset:FilterPreset)=>{const id=preset.itemIds[0];if(!id)return;if(kind!=='compactor')return id;return Object.keys(autoRecipes.find(r=>r.id===id)?.ingredients??{})[0]??id;};
