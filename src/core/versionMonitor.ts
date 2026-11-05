import type {GameState} from './types';
export const observedBuild = 'ef3c8efa9f';
export const operationsBuild = '6b899075fb';
/** Build lido em 04/11/2026: rede.js, catalogo.js, mochilacfg.js e armazem.js conferidos contra as chamadas do adaptador. */
export const currentBuild = '0ddf20e09b';
const filterKinds=['compactor','profile','eraser','autosell','autosellOption'];
/** Ações revisadas por build. Crafts, movimentações e transformações seguem restritos ao build original. */
/** Bazar: formatos lidos de lojas.js/armazem.js no build 0ddf20e09b. */
export const bazaarKinds=['bazaarNow','bazaarOrder','bazaarCancel','bazaarClaim'];
export const verifiedBuilds:Record<string,'all'|string[]>={[observedBuild]:'all',[operationsBuild]:[...filterKinds,'sell'],[currentBuild]:[...filterKinds,'sell',...bazaarKinds,'move','enderBackpack','terminalStash']};
/** Funções de rede.js e constantes de catalogo.js que o adaptador usa. */
export const requiredNetwork=['ABA','estado','armazem','autoCompactar','vender','compactar','craftar'];
export const requiredState=['autoCompactar','apagar','autoVender'];
export interface Contract{network:string[];maps:Record<string,boolean>;items:boolean}
export type CompatLevel='compatible'|'suspect'|'broken'|'unknown';
export function contractStatus(state:GameState|null|undefined):{level:CompatLevel;reasons:string[]}{
 if(!state||state.source!=='live')return {level:'unknown',reasons:['Sem conexão ao vivo com o jogo.']};
 const reasons:string[]=[];
 const c=(state.character.companionCapabilities as {contract?:Contract}|undefined)?.contract;
 if(!c)reasons.push('O cliente não informou os módulos do jogo.');
 else{
  const missing=requiredNetwork.filter(n=>!c.network.includes(n));if(missing.length)reasons.push('Funções ausentes em rede.js: '+missing.join(', ')+'.');
  for(const [name,ok] of Object.entries(c.maps))if(!ok)reasons.push(name+' não é mais um mapa {aparelho: vagas}.');
  if(!c.items)reasons.push('Catálogo ITENS não encontrado.');
 }
 const absent=requiredState.filter(k=>!Array.isArray(state.character[k]));if(absent.length)reasons.push('Campos de estado ausentes ou em outro formato: '+absent.join(', ')+'.');
 if(!state.build)reasons.push('O servidor não informou o build.');
 if(reasons.length)return {level:'broken',reasons};
 return {level:Object.hasOwn(verifiedBuilds,state.build!)?'compatible':'suspect',reasons:[]};
}
/**
 * Compatível: ações revisadas para o build. Suspeito (build novo, contrato ok): só filtros, que o adaptador
 * confere contra a lista devolvida pelo servidor. Quebrado ou desconhecido: só leitura.
 */
export function supportsCommandBuild(build:string|undefined,kind:string,state?:GameState|null){
 const allowed=build&&Object.hasOwn(verifiedBuilds,build)?verifiedBuilds[build]:undefined;
 if(allowed)return allowed==='all'||allowed.includes(kind);
 return !!state&&state.build===build&&contractStatus(state).level==='suspect'&&filterKinds.includes(kind);
}
export const compatibility = (build?: string, state?:GameState|null) => {
 if(!build)return 'Build não disponível; compatibilidade não confirmada.';
 if(build===observedBuild)return 'Build anterior validado para as ações do adaptador.';
 if(build===operationsBuild||build===currentBuild)return 'Filtros (compactador, apagador, auto-venda) e vendas por excedente revisados para este build. Crafts e movimentações aguardam validação.';
 const status=state?contractStatus(state):undefined;
 if(status?.level==='suspect')return 'Build novo ('+build+'), mas o contrato do jogo continua igual: leitura liberada e só os filtros podem ser aplicados, sempre com confirmação. Demais ações suspensas.';
 if(status?.level==='broken')return 'Build novo ('+build+') com contrato alterado: só leitura. '+status.reasons.join(' ');
 return 'Nova versão do Blockidle identificada. Ações suspensas até validar o adaptador.';
};
