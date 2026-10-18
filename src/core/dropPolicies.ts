import { items } from '../catalog/itemCatalog';
import type { DropPolicy, Preferences } from './types';
export function previewDrop(policy: DropPolicy, quantity: number, prefs: Preferences) {
    if (!policy.enabled)
        return { quantity: 0, reason: 'Política desativada' };
    if (policy.action === 'protect' || prefs.policies.some(p => p.enabled && p.itemId === policy.itemId && p.action === 'protect') || !items[policy.itemId] || ['Arma', 'Armadura', 'Pet', 'Acessório', 'Ferramenta', 'Sem catálogo'].includes(items[policy.itemId].category) || prefs.protectedItems.includes(policy.itemId) || prefs.favorites.includes(policy.itemId))
        return { quantity: 0, reason: 'Item protegido ou favorito' };
    const reserve = Math.max(policy.minimumReserve, prefs.reserves[policy.itemId] ?? 0);
    return { quantity: Math.max(0, quantity - reserve), reason: policy.action === 'sell' ? 'Venda requer homologação e confirmação no jogo.' : 'Simulação local; nenhuma alteração enviada.' };
}
