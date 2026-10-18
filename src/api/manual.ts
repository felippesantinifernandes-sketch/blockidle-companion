import {z} from 'zod';
import {commandSchema} from './commands';
import type {CommandResult,GameState,ManualCommand} from '../core/types';
import {hasChrome} from '../db/preferences';
import {normalize} from '../core/normalizer';
export function resultState(result:any):GameState|undefined {if(!result?.state)return;const state=normalize(result.state,'live');state.capturedAt=result.at??Date.now();state.scope=result.scope;state.tabId=result.tabId;state.observation='hud';return state;}
export async function sendManual(command:ManualCommand,state:GameState):Promise<CommandResult>{
 if(!hasChrome()||state.source!=='live'||state.tabId===undefined||!state.scope)return {ok:false,error:'Ações no jogo exigem conexão ao vivo com a aba ativa.'};
 try{const raw=await chrome.runtime.sendMessage({type:'COMPANION_MANUAL',tabId:state.tabId,scope:state.scope,requestId:crypto.randomUUID(),command});return {...raw,state:resultState(raw)};}
 catch{return {ok:false,uncertain:true,error:'O canal foi interrompido. O resultado pode ser desconhecido; revise o estado antes de agir novamente.'};}
}
export async function reconcile(state:GameState){const raw=await chrome.runtime.sendMessage({type:'COMPANION_RECONCILE',tabId:state.tabId,scope:state.scope});if(!raw?.ok)throw new Error(raw?.error??'Falha na revisão do estado.');return resultState(raw)!;}
export async function readActionLog():Promise<{at:number;command:ManualCommand;status:string;changed?:number;error?:string}[]>{if(!hasChrome())return [];const all=(await chrome.storage.local.get('blockidle.actions.v1'))['blockidle.actions.v1'];const schema=z.object({at:z.number().finite(),command:commandSchema,status:z.enum(['confirmed','rejected','uncertain']),changed:z.number().int().nonnegative().optional(),error:z.string().optional()});return Array.isArray(all)?all.slice(-100).flatMap(value=>{const parsed=schema.safeParse(value);return parsed.success?[parsed.data]:[];}).reverse():[];}
