import {autoRecipes,items} from '../catalog/itemCatalog';
import {regions} from './regions';
import {eligible,listCapacity,AUTOSELL_SLOTS} from './nativeLists';
import {isProtected} from './transformations';
import {craftRecipes} from './workbench';
import {salePrice} from './sales';
import type {GameState,Preferences} from './types';

/** area → item → {n: quantidade vista, last: horário} */
export type LearnedDrops=Record<string,Record<string,{n:number;last:number}>>;
const totals=(s:GameState)=>{const t:Record<string,number>={};for(const st of s.storages)for(const [id,q] of Object.entries(st.items))t[id]=(t[id]??0)+q;return t;};
/** Itens que cresceram entre dois retratos na mesma área (sem viagem no meio). Fila de craft e compras também crescem, por isso é “visto”, não “drop confirmado”. */
export function learn(prev:GameState|undefined,next:GameState,store:LearnedDrops,now=Date.now()):boolean{
 if(!prev||!next.area||prev.area!==next.area)return false;
 const a=totals(prev),b=totals(next);let changed=false;
 for(const [id,q] of Object.entries(b)){const gain=q-(a[id]??0);if(gain<=0||!items[id])continue;const area=store[next.area]??(store[next.area]={});const row=area[id]??(area[id]={n:0,last:0});row.n+=gain;row.last=now;changed=true;}
 const area=store[next.area];if(area&&Object.keys(area).length>300){for(const [id] of Object.entries(area).sort((x,y)=>x[1].last-y[1].last).slice(0,Object.keys(area).length-300))delete area[id];}
 return changed;
}
/** Drops publicados na wiki para a área do jogo (regions.json usa ids parecidos: catacumbas/catacumba). */
export const catalogDrops=(area:string)=>[...new Set(regions.filter(r=>r.area===area||r.area===area+'s'||r.id===area).flatMap(r=>r.drops.map(d=>d.itemId)))];
export interface Suggestion{compactor:string[];eraser:string[];autosell:string[];seen:string[]}
const seed=(id:string)=>/seeds?$|_seed$|sementes/.test(id);
/** Vai para a fornalha (minério bruto, carne, peixe, batata): nunca sugerir apagar ou vender. */
const furnace=(id:string)=>/^raw_|^(beef|porkchop|mutton|chicken|rabbit|cod|salmon|potato|arrow)$/.test(id)||['Armadura','Arma','Ferramenta','Acessório','Pet','Minion','Livro'].includes(items[id]?.category??'');
let usedCache:Set<string>|undefined;
/** Ingredientes de qualquer receita conhecida (compactação, lapidação, mesa, SkyBlock, armaduras, forja). */
const usedSomewhere=()=>usedCache??=new Set([...autoRecipes,...craftRecipes].flatMap(r=>Object.keys(r.ingredients)));
/**
 * Sugestão padrão (A4): o que tem versão encantada vai para o Compactador; sementes e itens comuns baratos que não entram em
 * nenhuma receita para o Apagador; o resto vendável que também não é ingrediente para a Auto-venda. Nunca sugere item protegido, de objetivo ou acima do limite de valor no Bazar.
 */
export function suggestSets(area:string,state:GameState|null,prefs:Preferences,learned:LearnedDrops,prices?:Record<string,{buy:number|null;sell:number|null}>,claims:Record<string,number>={}):Suggestion{
 const seen=Object.entries(learned[area]??{}).sort((a,b)=>b[1].n-a[1].n).map(([id])=>id);
 const pool=[...new Set([...seen,...catalogDrops(area)])].filter(id=>!isProtected(id,prefs)&&!(claims[id]>0));
 const valuable=(id:string)=>prefs.valueGuard!==null&&((prices?.[id]?.sell??0)>prefs.valueGuard||(prices?.[id]?.buy??0)>prefs.valueGuard);
 const compactor=autoRecipes.filter(r=>Object.keys(r.ingredients).some(i=>pool.includes(i))).map(r=>r.id).filter((v,i,a)=>a.indexOf(v)===i).slice(0,listCapacity(state,'compactor')??12);
 const compactedInputs=new Set(compactor.flatMap(id=>Object.keys(autoRecipes.find(r=>r.id===id)?.ingredients??{})));
 const used=usedSomewhere();
 const eraser=pool.filter(id=>!compactedInputs.has(id)&&!furnace(id)&&eligible('eraser',id,state)&&!valuable(id)&&(seed(id)||items[id]?.rarity==='comum'&&!used.has(id)&&salePrice(state,id)<=1&&(prices?.[id]?.sell??0)<=1)).slice(0,listCapacity(state,'eraser')??3);
 const usedOrCompactable=(id:string)=>used.has(id)&&!compactedInputs.has(id);
 const autosell=pool.filter(id=>!compactedInputs.has(id)&&!furnace(id)&&!eraser.includes(id)&&!usedOrCompactable(id)&&eligible('autosell',id,state)&&!valuable(id)).slice(0,AUTOSELL_SLOTS);
 return {compactor,eraser,autosell,seen};
}
