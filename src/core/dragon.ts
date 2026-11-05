import {skillLevel} from './workbench';
import type {GameState} from './types';

/** Regras do Entrar sozinho (dragaoui.js/dragao.js, 04/11/2026). O servidor confere de novo na hora. */
export const SEALS:Record<string,number>={selo_convocacao:1,selo_convocacao_encantado:2,nucleo_selecao_draconica:3};
export const DRAGON_EVERY=3*3600000,DRAGON_GAP=20*60000,DRAGON_FIGHT=15*60000;
export interface DragonInfo{phase?:string;at?:number;type?:string;forced?:boolean;eyes?:number}
export interface DragonCheck{ok:boolean;label:string;fix?:string}
export interface DragonReadiness{next:number;source:'natural'|'luta'|'invocado';checks:DragonCheck[];willJoin:boolean;blockers:DragonCheck[]}
const rec=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
/** Próximo nascimento natural: múltiplo de 3 h, e pelo menos 20 min depois de uma luta (folgaMs). */
export function nextNatural(now:number,lastFightEnd?:number){const base=Math.max(now,(lastFightEnd??0)+DRAGON_GAP);return Math.ceil(base/DRAGON_EVERY)*DRAGON_EVERY;}
export function sealLevel(state:GameState){const bag=rec(state.character.accessoryBag);return Object.keys(SEALS).reduce((g,id)=>(bag[id]??0)>0?Math.max(g,SEALS[id]):g,0);}
/** O Steve vai entrar sozinho no próximo Dragão? Lista cada condição com o que fazer quando falha. */
export function dragonReadiness(state:GameState,now=Date.now(),info?:DragonInfo):DragonReadiness{
 const d=rec(state.character.dragao),slayer=rec(state.progress.slayer),area=state.area;
 const fighting=info?.phase==='luta';
 const next=fighting&&info?.at?info.at:info?.at&&info.at>now?info.at:nextNatural(now);
 const source=fighting?'luta':info?.forced?'invocado':'natural';
 const seal=sealLevel(state),combat=skillLevel(state,'combate');
 const checks:DragonCheck[]=[
  {ok:d.auto===true,label:'“Entrar sozinho” ligado',fix:'Ligue o interruptor abaixo ou no Altar do Dragão.'},
  {ok:seal>=1,label:seal?'Selo de Convocação nível '+seal:'Selo de Convocação na bolsa de acessórios',fix:'Faça um Selo de Convocação no The End e guarde-o na bolsa de acessórios.'},
  {ok:source!=='invocado'||seal>=2,label:'Dragão invocado pede o Selo Encantado',fix:'Só o Selo de Convocação Encantado (ou o Núcleo) entra no Dragão invocado.'},
  {ok:state.character.portal===undefined||!!state.character.portal,label:'Portal do End liberado',fix:'Construa o portal do End.'},
  {ok:combat>=12,label:'Combate 12 ou mais (atual '+combat+')',fix:'Suba Combate até o nível 12.'},
  {ok:area!=='vazio'&&area!=='catacumba',label:'Fora da Câmara do Vazio e das Catacumbas',fix:'Saia dessa área antes do Dragão nascer.'},
  {ok:state.character.passeio!==true,label:'Fora de passeio (Lobby, ilha, Forja)',fix:'Volte da ilha, do Lobby ou da Forja.'},
  {ok:!slayer.missao,label:'Sem missão de Slayer em andamento',fix:'Termine ou cancele a missão de Slayer (na Masmorra ela segura o Steve).'},
  {ok:area!=='ruinas',label:'Fora da Invasão (Ruínas)',fix:'A Invasão também segura o Steve.'},
  {ok:!fighting||!info?.at||info.at-now>60000,label:'Mais de 1 minuto de luta restante',fix:'No último minuto a viagem não vale.'},
 ];
 const blockers=checks.filter(c=>!c.ok);
 return {next,source,checks,willJoin:!blockers.length,blockers};
}
