import type { GameState, Snapshot } from '../core/types';
const open = () => new Promise<IDBDatabase>((resolve, reject) => { const req = indexedDB.open('blockidle-companion', 1); req.onupgradeneeded = () => req.result.createObjectStore('snapshots', { keyPath: 'id' }); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
export async function listSnapshots(): Promise<Snapshot[]> {
    const db = await open();
    try {
        return await new Promise((resolve, reject) => { const tx = db.transaction('snapshots'), req = tx.objectStore('snapshots').getAll(); req.onsuccess = () => resolve((req.result as Snapshot[]).sort((a, b) => b.at - a.at)); req.onerror = () => reject(req.error); });
    }
    finally {
        db.close();
    }
}
export async function addSnapshot(state: GameState) {
    const totals: Record<string, number> = Object.create(null);
    for (const s of state.storages)
        for (const [id, q] of Object.entries(s.items))
            totals[id] = (totals[id] ?? 0) + q;
    const snapshot: Snapshot = { id: crypto.randomUUID(), scope: state.scope, at: state.capturedAt, source: state.source, build: state.build, area: state.area, totals };
    const existing = await listSnapshots();
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'), store = tx.objectStore('snapshots'); store.put(snapshot); existing.slice(199).forEach(s => store.delete(s.id)); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    }
    finally {
        db.close();
    }
}
export async function clearSnapshots() {
    const db = await open();
    try {
        await new Promise<void>((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    }
    finally {
        db.close();
    }
}
