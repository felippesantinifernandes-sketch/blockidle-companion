import { hasChrome } from '../db/preferences';
import { normalize } from '../core/normalizer';
import type { GameState } from '../core/types';
export async function readActiveState(): Promise<GameState> {
    if (!hasChrome())
        throw new Error('Instale a extensão para conectar à aba do jogo, ou importe um JSON de estado.');
    const result = await chrome.runtime.sendMessage({ type: 'COMPANION_READ_ACTIVE' });
    if (!result?.ok)
        throw new Error(result?.error ?? 'Não foi possível consultar a aba.');
    const state = normalize(result.state, 'live');
    state.capturedAt = result.at;
    state.tabId = result.tabId;
    state.observation=result.observation;
    state.scope = result.scope;
    return state;
}
export function executeMutation(): never { throw new Error('Operação genérica indisponível. Use apenas as ações manuais validadas do painel.'); }
