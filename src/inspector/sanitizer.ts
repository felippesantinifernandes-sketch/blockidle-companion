const sensitive = /cookie|token|auth|sess|login|senha|password|email|chat|mensage|message|private|privad|account|conta|user(id)?|jogador|amigo|clan|guild|nick|nome|skin|uuid/i;
const gameCookieItems = new Set(['cookie', 'ench_cookie', 'booster_cookie']);
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
export function sanitize(value: unknown, depth = 0): unknown {
    if (depth > 12)
        return '[limite]';
    if (typeof value === 'string')
        return /@|bearer\s|eyJ[a-zA-Z0-9_-]+\./i.test(value) ? '[removido]' : value.slice(0, 160);
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : null;
    if (typeof value === 'boolean' || value === null)
        return value;
    if (Array.isArray(value))
        return value.slice(0, 20000).map(v => sanitize(v, depth + 1));
    if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).filter(([k, v]) => !forbidden.has(k) && (!sensitive.test(k) || (gameCookieItems.has(k) && typeof v === 'number' && Number.isSafeInteger(v) && v >= 0))).slice(0, 20000).map(([k, v]) => [k, sanitize(v, depth + 1)]));
    return null;
}
export const allowed = ['skyblock','apagador','mesa','suporte','ferraria','portal','fila','alvo','rank','recomb','poderMagico','armas','picaretas','machados','enxadas','varas','bosque','slayer','pilhaNivel','pocaoNivel','enderTotal','enderFileiras','nivel', 'xp', 'hp', 'hpMax', 'mana', 'ouro', 'espada', 'machado', 'enxada', 'vara', 'versao', 'inventario', 'guardado', 'base', 'bauRotulo', 'bausGolem', 'bolsas', 'sacos', 'sacosN', 'slotsMochila', 'compactador', 'autoCompactar', 'autoVender', 'guardaAuto', 'area', 'camada', 'deposito', 'picareta', 'broca', 'armadura', 'pet', 'petXp', 'petRar', 'anas', 'forja', 'minions', 'habilidades', 'colecoes', 'atributos', 'progressos'];
export function projectState(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error('O estado deve ser um objeto JSON.');
    const obj = input as Record<string, unknown>;
    const inner = obj.estado && typeof obj.estado === 'object' ? obj.estado as Record<string, unknown> : obj;
    if (!['inventario', 'guardado', 'base', 'habilidades', 'atributos'].some(k => k in inner))
        throw new Error('JSON sem campos de estado reconhecidos.');
    const selected = Object.fromEntries(allowed.filter(k => k in inner).map(k => [k, inner[k]]));
    if (obj.versao !== undefined && selected.versao === undefined)
        selected.versao = obj.versao;
    return sanitize(selected) as Record<string, unknown>;
}
