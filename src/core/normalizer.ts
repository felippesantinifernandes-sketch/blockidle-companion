import { chestSlots, bagTypes } from '../catalog/storageTypes';
import type { GameState, Storage, StorageKind } from './types';
import { quantitySchema } from '../api/schemas';
import { projectState } from '../inspector/sanitizer';
export const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function itemMap(v: unknown, warnings: string[], label: string): Record<string, number> {
    const out: Record<string, number> = Object.create(null);
    if (v === undefined)
        return out;
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
        warnings.push(label + ': formato não reconhecido; estoque omitido.');
        return out;
    }
    for (const [id, q] of Object.entries(v)) {
        if (['__proto__', 'constructor', 'prototype'].includes(id))
            continue;
        const parsed = quantitySchema.safeParse(q);
        if (parsed.success) {
            if (parsed.data > 0)
                out[id] = parsed.data;
        }
        else
            warnings.push(label + '/' + id + ': quantidade não reconhecida; omitida.');
    }
    return out;
}
const coord = (s: string): [
    number,
    number,
    number
] | undefined => { const m = /^(-?\d+),(-?\d+),(-?\d+)$/.exec(s); return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : undefined; };
export function normalize(input: unknown, source: GameState['source'] = 'import'): GameState {
    const raw = projectState(input), warnings: string[] = [], storages: Storage[] = [], chestTypes = new Map<string, string>();
    storages.push({ id: 'inventory', kind: 'inventory', originalName: 'Mochila', items: itemMap(raw.inventario, warnings, 'inventario'), ...(typeof raw.slotsMochila === 'number' && Number.isInteger(raw.slotsMochila) && raw.slotsMochila > 0 ? { capacity: { totalSlots: raw.slotsMochila } } : {}) });
    const guarded = record(raw.guardado), chests = new Set<string>();
    // Only explicitly recognized chest block IDs. Never infer a chest from any base coordinate.
    const addBlock = (key: string, value: unknown) => {
        const block = record(value);
        const type = typeof value === 'string' ? value : block.tipo ?? block.t ?? block.id ?? block.type;
        const xyz = coord(key) ?? (typeof block.x === 'number' && typeof block.y === 'number' && typeof block.z === 'number' ? [block.x, block.y, block.z] as [
            number,
            number,
            number
        ] : undefined);
        if (xyz && Object.hasOwn(chestSlots, String(type))) {
            const id = 'bau:' + xyz.join(',');
            chests.add(id);
            chestTypes.set(id, String(type));
        }
    };
    if (Array.isArray(raw.base))
        raw.base.forEach(v => addBlock('', v));
    else
        Object.entries(record(raw.base)).forEach(([k, v]) => addBlock(k, v));
    Object.keys(guarded).filter(k => /^bau:-?\d+,-?\d+,-?\d+$/.test(k)).forEach(k => chests.add(k));
    const labels = record(raw.bauRotulo), golems = raw.bausGolem;
    for (const id of chests) {
        const xyz = coord(id.slice(4));
        storages.push({ id, kind: 'chest', originalName: 'Baú', items: itemMap(guarded[id], warnings, id), ...(chestTypes.has(id) ? { capacity: { totalSlots: chestSlots[chestTypes.get(id)!] } } : {}), metadata: { coordinates: xyz, gameLabel: typeof labels[id.slice(4)] === 'string' ? String(labels[id.slice(4)]) : undefined, linkedToGolem: Array.isArray(golems) ? golems.includes(id.slice(4)) : record(golems)[id.slice(4)] === true } });
    }
    const bags = Array.isArray(raw.bolsas) ? raw.bolsas : [];
    const bagIds = new Set([...Object.keys(guarded).filter(id => /^bolsa\d+$/.test(id)), ...bags.flatMap((tier, i) => typeof tier === 'number' && bagTypes[tier] ? ['bolsa' + i] : [])]);
    for (const id of bagIds) {
        const n = Number(id.slice(5)), tier = bags[n], meta = typeof tier === 'number' ? bagTypes[tier] : undefined;
        storages.push({ id, kind: 'bag', originalName: (meta?.name ?? 'Bolsa') + ' ' + (n + 1), items: itemMap(guarded[id], warnings, id), ...(meta ? { capacity: { totalSlots: meta.slots } } : {}) });
    }
    for (const [id, content] of Object.entries(guarded)) {
        if (chests.has(id) || bagIds.has(id))
            continue;
        const kind: StorageKind = id === 'saco' ? 'sack' : id === 'ender' ? 'ender' : id.startsWith('fazenda:') ? 'special' : 'special';
        if (!['saco', 'ender'].includes(id) && !id.startsWith('fazenda:')) {
            if(id!=='acessorios')warnings.push(id + ': armazenamento não elegível ou não reconhecido; omitido dos totais.');
            continue;
        }
        storages.push({ id, kind, originalName: kind === 'ender' ? 'Baú do Ender' : kind === 'sack' ? 'Sacos (conteúdo compartilhado)' : 'Baú da fazenda', items: itemMap(content, warnings, id) });
    }
    const accessoryBag=record(guarded.acessorios);
    if (raw.base !== undefined && !chests.size)
        warnings.push('Nenhum baú físico reconhecido em base; formato precisa de validação com captura real.');
    const character = Object.fromEntries(['apagador','mesa','suporte','ferraria','portal','fila','alvo','rank','recomb','poderMagico','armas','picaretas','machados','enxadas','varas','pilhaNivel','pocaoNivel','enderTotal','enderFileiras','nivel', 'xp', 'hp', 'hpMax', 'mana', 'ouro', 'espada', 'machado', 'enxada', 'vara', 'atributos', 'picareta', 'broca', 'armadura', 'pet', 'petXp', 'petRar', 'compactador', 'autoCompactar'].filter(k => raw[k] !== undefined).map(k => [k, raw[k]]));
    const progress = Object.fromEntries(['skyblock','slayer','anas', 'forja', 'minions', 'habilidades', 'colecoes', 'progressos'].filter(k => raw[k] !== undefined).map(k => [k, raw[k]]));
    return { build: typeof raw.versao === 'string' ? raw.versao : undefined, area: typeof raw.area === 'string' ? raw.area : undefined, layer: typeof raw.camada === 'string' || typeof raw.camada === 'number' ? String(raw.camada) : undefined, storages, character:{...character,accessoryBag,accessoryBagKnown:Object.hasOwn(guarded,'acessorios')}, progress, warnings: [...new Set(warnings)].slice(0, 100), forest:typeof raw.bosque==='string'?raw.bosque:undefined,terminalAvailable:Object.values(record(raw.base)).includes('terminal'),capturedAt: Date.now(), source, scope: crypto.randomUUID() };
}
