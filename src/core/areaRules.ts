import {activeList,listKinds,sameSet,type ListKind} from './nativeLists';
import type {AreaRule,GameState,ManualCommand,Preferences} from './types';

/** AREAS de catalogo.js (04/11/2026). A ilha não é área: é passeio. */
export const gameAreas:[string,string][]=[['floresta','Floresta'],['mina','Mina'],['fazenda','Fazenda'],['celeiro','Celeiro'],['masmorra','Masmorra'],['ruinas','Ruínas'],['end','The End'],['ninho','Ninho do Dragão'],['tumba','Tumba Ardente'],['brasa','Coração da Tumba'],['vazio','Câmara do Vazio'],['catacumba','Catacumbas'],['lago','Lago'],['lava','Lago de Lava'],['nether','Nether']];
export const areaName=(id:string|undefined)=>gameAreas.find(([a])=>a===id)?.[1]??id??'?';
export const emptyRule=():AreaRule=>({compactor:null,eraser:null,autosell:null,autoJa:null,autoTudo:null});
export const ruleIsEmpty=(r:AreaRule|undefined)=>!r||(listKinds.every(k=>r[k]===null)&&r.autoJa===null&&r.autoTudo===null);
export interface AreaStep{label:string;command:ManualCommand}
/** Pedidos necessários para deixar o jogo igual à regra da área atual. Só o que difere entra. */
export function areaPlan(state:GameState|null|undefined,prefs:Preferences):{area?:string;steps:AreaStep[];missing:string[]}{
 const area=state?.area,rule=area?prefs.areaRules[area]:undefined;if(!state||!area||ruleIsEmpty(rule))return {area,steps:[],missing:[]};
 const steps:AreaStep[]=[],missing:string[]=[];
 for(const kind of listKinds){const index=rule![kind];if(index===null)continue;const preset=prefs.filterPresets[kind][index];
  if(!preset){missing.push(labels[kind]+' (quadrado '+(index+1)+' vazio)');continue;}
  const active=activeList(state,kind);if(active&&sameSet(active,preset.itemIds))continue;
  steps.push({label:labels[kind]+': '+preset.name,command:kind==='compactor'?{kind:'profile',itemIds:preset.itemIds,replace:true}:{kind,itemIds:preset.itemIds}});}
 for(const [key,option,label] of [['autoJa','autoja','Vender ao chegar'],['autoTudo','autotudo','Vender tudo que não couber']] as const){const want=rule![key];if(want===null)continue;const field=key==='autoJa'?'autoVenderJa':'autoVenderTudo';if(state.character[field]===want)continue;steps.push({label:label+': '+(want?'ligar':'desligar'),command:{kind:'autosellOption',option,enabled:want}});}
 return {area,steps,missing};
}
const labels:Record<ListKind,string>={compactor:'Compactador',eraser:'Apagador',autosell:'Auto-venda'};
