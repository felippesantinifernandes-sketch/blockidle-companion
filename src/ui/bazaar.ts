import {create} from 'zustand';
import {hasChrome} from '../db/preferences';
import type {BazaarPrice} from '../core/locations';
interface Bazaar{prices?:Record<string,BazaarPrice>;at?:number;error?:string;loading:boolean;load:()=>Promise<void>}
/** Um GET /api/bazar por clique; o resultado vale para toda a sessão do painel. */
export const useBazaar=create<Bazaar>((set,get)=>({loading:false,load:async()=>{if(get().loading)return;if(!hasChrome()){set({error:'O Bazar requer a extensão conectada à aba do jogo.'});return;}set({loading:true,error:undefined});try{const r=await chrome.runtime.sendMessage({type:'COMPANION_BAZAAR'});if(!r?.ok)throw Error(r?.error??'Bazar indisponível.');set({prices:r.prices,at:r.at});}catch(e){set({error:(e instanceof Error?e.message:'Bazar indisponível.')+' O Bazar abre no Lobby ou com Booster Cookie ativo.'});}finally{set({loading:false});}}}));
