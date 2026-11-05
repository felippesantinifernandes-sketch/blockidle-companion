import type {GameState,Preferences} from './types';
import {areaName} from './areaRules';

export type NotifyKind=Exclude<keyof Preferences['notify'],'enabled'>;
export const notifyLabels:Record<NotifyKind,string>={backpackFull:'Mochila cheia',offline:'Tempo offline do dia em 80%',queueEmpty:'Fila de craft vazia',dragon:'Dragão nasce em 5 minutos',auction:'Dark Auction com lote raro',bazaar:'Ordem do Bazar com algo para resgatar',build:'Build do jogo mudou',areaRule:'Regra de área aplicada'};
export const defaultNotify=():Preferences['notify']=>({enabled:false,backpackFull:true,offline:true,queueEmpty:true,dragon:true,auction:true,bazaar:true,build:true,areaRule:true});
export interface NotifyEvent{kind:NotifyKind;title:string;message:string}
const rec=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
const offlineRatio=(s:GameState)=>{const o=rec(s.character.offlineHoje),u=o?.usadoMs,t=o?.tetoMs;return typeof u==='number'&&typeof t==='number'&&t>0?u/t:undefined;};
/** Eventos entre dois retratos do mesmo personagem. Só transições: nada repete enquanto a condição continua. */
export function stateEvents(prev:GameState|undefined,next:GameState):NotifyEvent[]{
 if(!prev)return [];
 const out:NotifyEvent[]=[];
 if(prev.character.mochilaCheia!==true&&next.character.mochilaCheia===true)out.push({kind:'backpackFull',title:'Mochila cheia',message:'O que chegar agora pode se perder. Venda, guarde no Ender ou ligue a auto-venda.'});
 const a=offlineRatio(prev),b=offlineRatio(next);if(a!==undefined&&b!==undefined&&a<0.8&&b>=0.8)out.push({kind:'offline',title:'Tempo offline acabando',message:Math.round(b*100)+'% do limite de hoje já foi usado.'});
 const qa=Array.isArray(prev.character.fila)?prev.character.fila.length:undefined,qb=Array.isArray(next.character.fila)?next.character.fila.length:undefined;
 if(qa!==undefined&&qb!==undefined&&qa>0&&qb===0)out.push({kind:'queueEmpty',title:'Fila de craft vazia',message:'Tudo o que estava na fila terminou em '+areaName(next.area)+'.'});
 if(prev.build&&next.build&&prev.build!==next.build)out.push({kind:'build',title:'O Blockidle foi atualizado',message:'Build '+prev.build+' → '+next.build+'. Confira a compatibilidade e a aba Novidades.'});
 return out;
}
const HOUR=3600000,DRAGON=3*HOUR;
/** naturalMs do dragao.js: a cada 3 h, 00h, 03h… de Brasília (UTC−3), que caem em múltiplos de 3 h desde a época. */
export const nextDragon=(now:number)=>Math.ceil((now+1)/DRAGON)*DRAGON;
/** janelaLeilao: abre aos :40 e fecha aos :55 de cada hora. */
export const nextAuction=(now:number)=>{const h=Math.floor(now/HOUR)*HOUR+40*60000;return h>now?h:h+HOUR;};
export const fallbackRareLots=['midas_sword','livro_sharpness_7'];
