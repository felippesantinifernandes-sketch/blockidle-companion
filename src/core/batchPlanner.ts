import type { GameState, Preferences, PlanRow, Item, StorageGroup } from './types';
import { items as defaultItems } from '../catalog/itemCatalog';
import { roomFor } from './capacity';
export function simulate(state: GameState, prefs: Preferences, selected: string[], catalog: Record<string, Item> = defaultItems): PlanRow[] {
    const stores = structuredClone(state.storages), inventory = stores.find(s => s.kind === 'inventory');
    if (!inventory)
        return [];
    const accepts = (g: StorageGroup, id: string) => g.acceptedItemIds.includes(id) || g.acceptedCategories.includes(catalog[id]?.category ?? '') || (g.learnFromExistingItems && g.storageIds.some(sid => (stores.find(s => s.id === sid)?.items[id] ?? 0) > 0));
    return selected.slice(0, 100).flatMap(id => {
        const quantity = inventory.items[id] ?? 0;
        if (!quantity)
            return [];
        const base = { itemId: id, quantity, source: 'inventory', status: 'blocked' as const };
        const policy = prefs.policies.find(p => p.enabled && p.itemId === id);
        const equipped = Object.values(state.character).some(v => v === id || v && typeof v === 'object' && Object.values(v).includes(id));
        if (policy?.action === 'protect' || (policy?.minimumReserve ?? 0) > 0 || prefs.protectedItems.includes(id) || prefs.favorites.includes(id) || (prefs.reserves[id] ?? 0) > 0 || equipped || !catalog[id] || catalog[id].category === 'Sem catálogo' || ['Arma', 'Armadura', 'Pet', 'Acessório', 'Ferramenta'].includes(catalog[id].category))
            return [{ ...base, reason: 'Item protegido, reservado, equipado ou identidade não validada.' }];
        const groups = prefs.groups.filter(g => accepts(g, id));
        if (groups.length !== 1)
            return [{ ...base, reason: groups.length ? 'Conflito: mais de um grupo aceita este item.' : 'Nenhum grupo aceita este item.' }];
        const group = groups[0];
        if (group.protectedItemIds.includes(id))
            return [{ ...base, reason: 'Protegido pelo grupo.' }];
        const candidates = stores.filter(s => s.kind !== 'inventory' && group.storageIds.includes(s.id)).sort((a, b) => Number(!!b.items[id]) - Number(!!a.items[id]) || (group.priorityStorageIds.indexOf(a.id) < 0 ? 999 : group.priorityStorageIds.indexOf(a.id)) - (group.priorityStorageIds.indexOf(b.id) < 0 ? 999 : group.priorityStorageIds.indexOf(b.id)));
        if (!candidates.length)
            return [{ ...base, reason: 'Grupo sem armazenamentos vinculados.' }];
        const rows: PlanRow[] = [];
        let remaining = quantity, unknown = false;
        for (const dest of candidates) {
            const room = roomFor(dest, id, catalog);
            if (room === undefined) {
                unknown = true;
                continue;
            }
            if (room <= 0)
                continue;
            const take = Math.min(room, remaining);
            dest.items[id] = (dest.items[id] ?? 0) + take;
            rows.push({ ...base, quantity: take, destination: dest.id, status: 'preview', capacity: room, reason: 'Prévia local; execução indisponível nesta versão.' });
            remaining -= take;
            if (!remaining)
                break;
        }
        if (remaining)
            rows.push({ ...base, quantity: remaining, reason: unknown ? 'Capacidade desconhecida: nenhum destino seguro confirmado.' : 'O grupo ' + group.name + ' está sem armazenamento disponível. Verifique os baús vinculados, libere espaço ou adicione outro destino.' });
        return rows;
    });
}
