import type {GameState,Storage} from './types';

/** Lugares que pagam o craft do SkyBlock/armaduras (temPraCraft). Baús da ilha, farms e Ender precisam ser retirados antes. */
export const paysCraft=(s:Storage)=>s.kind==='inventory'||s.id==='saco'||s.kind==='bag'||s.id==='ferramentas';
export function storageLabel(s:Storage){
 if(s.kind==='inventory')return 'Mochila';
 if(s.kind==='chest'){const c=s.metadata?.coordinates,label=s.metadata?.gameLabel;return 'Baú '+(c?c.join(','):s.id.slice(4))+(label?' · '+label:'');}
 if(s.id.startsWith('fazenda:'))return 'Farm · '+s.id.slice(8);
 return s.originalName;
}
export interface Location{storageId:string;label:string;quantity:number;pays:boolean}
/** Todos os lugares que têm o item, do maior para o menor. */
export function itemLocations(state:GameState|null|undefined,id:string):Location[]{
 return (state?.storages??[]).flatMap(s=>{const q=s.items[id]??0;return q>0?[{storageId:s.id,label:storageLabel(s),quantity:q,pays:paysCraft(s)}]:[];}).sort((a,b)=>b.quantity-a.quantity);
}
export interface BazaarPrice{buy:number|null;sell:number|null}
/** Custo estimado de comprar já pelo menor preço pedido. A prévia do jogo pode ser maior se o livro for raso. */
export function bazaarCost(prices:Record<string,BazaarPrice>|undefined,id:string,quantity:number):number|undefined{
 const p=prices?.[id]?.buy;return quantity>0&&p?p*quantity:quantity>0?undefined:0;
}
/** Parte dos materiais já coberta (0 a 1), contando quantidades, para o filtro “falta pouco”. */
export function coverage(materials:{required:number;native:number}[]){
 const need=materials.reduce((n,m)=>n+m.required,0);if(!need)return 1;
 return materials.reduce((n,m)=>n+Math.min(m.native,m.required),0)/need;
}
