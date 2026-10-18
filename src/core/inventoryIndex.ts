import type { GameState, Preferences, InventoryEntry } from './types';
import { items } from '../catalog/itemCatalog';
export const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function inventoryIndex(state: GameState, prefs: Preferences): InventoryEntry[] {
    const map = new Map<string, InventoryEntry>();
    for (const storage of state.storages)
        for (const [id, quantity] of Object.entries(storage.items)) {
            const meta = items[id];
            const entry = map.get(id) ?? { id, name: meta?.name ?? id, category: meta?.category ?? 'Sem catálogo', rarity: meta?.rarity ?? 'Não disponível', total: 0, locations: [], searchText: '' };
            entry.total += quantity;
            entry.locations.push({ storage, quantity });
            map.set(id, entry);
        }
    return [...map.values()].map(e => ({ ...e, searchText: fold([e.id, e.name, items[e.id]?.originalName, e.category, e.rarity, prefs.reserves[e.id] ? 'reservado' : '', ...e.locations.flatMap(l => [l.storage.id, l.storage.originalName, prefs.aliases[l.storage.id], l.storage.metadata?.gameLabel, ...prefs.groups.filter(g => g.storageIds.includes(l.storage.id)).map(g => g.name)])].join(' ')) })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'));
}
