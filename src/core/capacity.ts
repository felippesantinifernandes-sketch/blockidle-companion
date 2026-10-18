import type { Item, Storage } from './types';
export function capacity(storage: Storage, catalog: Record<string, Item>) {
    if (storage.kind === 'sack' || storage.kind === 'inventory' || !storage.capacity)
        return undefined;
    const total = storage.capacity.totalSlots;
    let used = 0;
    for (const [id, q] of Object.entries(storage.items)) {
        if (catalog[id]?.slotExempt)
            continue;
        const stack = catalog[id]?.stackSize;
        if (!stack || stack < 1 || !Number.isInteger(stack))
            return undefined;
        used += Math.ceil(q / stack);
    }
    return { totalSlots: total, usedSlots: used, freeSlots: Math.max(0, total - used) };
}
export function roomFor(storage: Storage, itemId: string, catalog: Record<string, Item>) {
    if (catalog[itemId]?.slotExempt)
        return undefined;
    const c = capacity(storage, catalog), stack = catalog[itemId]?.stackSize;
    if (!c || !stack)
        return undefined;
    const q = storage.items[itemId] ?? 0, partial = q % stack ? stack - q % stack : 0;
    return c.freeSlots * stack + partial;
}
