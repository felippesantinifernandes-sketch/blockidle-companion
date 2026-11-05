import {create} from 'zustand';
import {hasChrome} from '../db/preferences';
import type {BazaarPrice} from '../core/locations';
export interface BazaarLevel{price:number|null;qtd:number|null;orders:number|null}
export interface BazaarBook{item:string;asks:BazaarLevel[];bids:BazaarLevel[];trades:{qtd:number|null;price:number|null;at:number|null}[];at:number}
export interface BazaarBand{from:number|null;avg:number|null;volume:number|null;min:number|null;max:number|null}
export interface BazaarPreview{side:'c'|'v';item:string;qtd:number|null;missing:number|null;total:number|null;avg:number|null;best:number|null;worst:number|null;net:number|null;tax:number|null}
export interface BazaarOrder{id:number;side:'c'|'v';item:string;qtd:number|null;remaining:number|null;price:number|null}
const unavailable=' O Bazar abre no Lobby ou com Booster Cookie ativo.';
let last=0;
/** No máximo uma consulta por segundo saindo do painel. */
export async function bazaarRead<T=any>(request:Record<string,unknown>):Promise<T>{
 if(!hasChrome())throw Error('O Bazar requer a extensão conectada à aba do jogo.');
 const wait=last+1000-Date.now();last=Math.max(Date.now(),last+1000);if(wait>0)await new Promise(r=>setTimeout(r,wait));
 const r=await chrome.runtime.sendMessage({type:'COMPANION_BAZAAR',request});if(!r?.ok)throw Error((r?.error??'Bazar indisponível.')+unavailable);return r as T;
}
interface Bazaar{prices?:Record<string,BazaarPrice&{volume?:number|null}>;categories:{name:string;items:string[]}[];tax?:number|null;maxOrders?:number|null;at?:number;error?:string;loading:boolean;load:()=>Promise<void>}
export const useBazaar=create<Bazaar>((set,get)=>({categories:[],loading:false,load:async()=>{if(get().loading)return;set({loading:true,error:undefined});try{const r=await bazaarRead<{prices:Bazaar['prices'];categories:Bazaar['categories'];tax:number|null;maxOrders:number|null;at:number}>({op:'resumo'});set({prices:r.prices,categories:r.categories??[],tax:r.tax,maxOrders:r.maxOrders,at:r.at});}catch(e){set({error:e instanceof Error?e.message:'Bazar indisponível.'});}finally{set({loading:false});}}}));
