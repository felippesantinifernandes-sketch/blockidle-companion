import { describe, it, expect } from 'vitest';
import { normalize, itemMap } from '../core/normalizer';
import { projectState, sanitize } from '../inspector/sanitizer';
import { inventoryIndex } from '../core/inventoryIndex';
import { capacity, roomFor } from '../core/capacity';
import { simulate } from '../core/batchPlanner';
import { previewDrop } from '../core/dropPolicies';
import { defaults, parseBackup } from '../db/preferences';
import { executeMutation } from '../api/client';
import { items, recipes } from '../catalog/itemCatalog';
import { compatibility } from '../core/versionMonitor';
import { demoState } from './demo';
import type { Item, Storage, StorageGroup } from '../core/types';
const prefs = () => structuredClone(defaults);
const catalog: Record<string, Item> = { diamond: { id: 'diamond', name: 'Diamante', category: 'Material', rarity: 'Comum', stackSize: 64 }, sword: { id: 'sword', name: 'Espada', category: 'Arma', rarity: 'Raro', stackSize: 1 } };
const group = (id = 'g'): StorageGroup => ({ id, name: id, description: '', storageIds: ['bau:1,0,0'], acceptedItemIds: ['diamond'], acceptedCategories: [], learnFromExistingItems: false, priorityStorageIds: ['bau:1,0,0'], protectedItemIds: [], onFull: 'stop' });
const planState = () => normalize({ inventario: { diamond: 90 }, base: { '1,0,0': 'chest' }, guardado: { 'bau:1,0,0': { diamond: 60 } } });
describe('Normalização física', () => {
    it('mantém baú vazio e separa terminal', () => { const s = normalize(demoState); expect(s.storages.filter(s => s.kind === 'chest')).toHaveLength(3); expect(s.storages.find(s => s.id === 'bau:7,0,-3')?.items).toEqual({}); expect(s.storages.some(s => s.id === 'bau:8,0,-3')).toBe(false); });
    it('descobre baús melhorados e capacidade real', () => { const s = normalize({ inventario: {}, base: { '1,0,0': 'chest_netherite' } }); expect(s.storages[1].capacity?.totalSlots).toBe(135); });
    it('usa coordenadas nativas para rótulo e Golem', () => { const s = normalize(demoState).storages.find(s => s.id === 'bau:5,0,-3'); expect(s?.metadata?.gameLabel).toBe('hard_stone'); expect(s?.metadata?.linkedToGolem).toBe(true); });
    it('une base e guardado sem duplicar', () => { const s = normalize(demoState); expect(s.storages.filter(s => s.id === 'bau:5,0,-3')).toHaveLength(1); });
    it('não soma coleções ou campos históricos', () => { const s = normalize({ inventario: { diamond: 2 }, colecoes: { diamond: 99999 }, guardado: { banco: { diamond: 100 }, perdidos: { diamond: 400 } } }); expect(inventoryIndex(s, prefs())[0].total).toBe(2); });
    it('soma saco compartilhado somente uma vez', () => { const s = normalize({ inventario: { diamond: 2 }, guardado: { saco: { diamond: 5 } }, sacos: { mineracao: 2 }, sacosN: { mineracao: 10 } }); expect(inventoryIndex(s, prefs())[0].total).toBe(7); expect(s.storages[1].kind).toBe('sack'); });
    it('reconhece bolsa0 e preserva bolsas vazias', () => { const s = normalize({ inventario: {}, bolsas: [0, 2], guardado: { bolsa0: { diamond: 4 } } }); expect(s.storages.find(s => s.id === 'bolsa0')?.kind).toBe('bag'); expect(s.storages.find(s => s.id === 'bolsa1')?.capacity?.totalSlots).toBe(27); });
    it('tolera campo inválido sem perder os demais', () => { const s = normalize({ inventario: { diamond: 4, coal: -1, iron_ingot: '3' }, guardado: [], atributos: { mana: 100 } }); expect(s.storages[0].items).toEqual({ diamond: 4 }); expect(s.warnings.length).toBe(2); expect(s.character.atributos).toEqual({ mana: 100 }); });
    it('recusa quantidades fracionárias e infinitas', () => { const warnings: string[] = []; expect(itemMap({ a: 1.2, b: Infinity, c: 0, d: 4 }, warnings, 'x')).toEqual({ d: 4 }); expect(warnings).toHaveLength(2); });
    it('extrai estado e versão do envelope real', () => { const s = normalize({ versao: 'new-build', estado: { inventario: { diamond: 1 } } }); expect(s.build).toBe('new-build'); });
    it('rejeita arquivos que não sejam estado', () => { expect(() => normalize({ token: 'secret' })).toThrow(); expect(() => normalize([])).toThrow(); });
});
describe('Busca local e capacidades', () => {
    it('encontra coordenada, apelido, categoria e reserva', () => { const p = prefs(); p.aliases['bau:5,0,-3'] = 'Mineração especial'; p.reserves.hard_stone = 10; const e = inventoryIndex(normalize(demoState), p).find(e => e.id === 'hard_stone')!; expect(e.searchText).toContain('mineracao especial'); expect(e.searchText).toContain('5,0,-3'); expect(e.searchText).toContain('reservado'); });
    it('usa tamanho individual da pilha', () => { const s: Storage = { id: 'x', kind: 'chest', originalName: 'Baú', items: { diamond: 65, sword: 2 }, capacity: { totalSlots: 5 } }; expect(capacity(s, catalog)).toEqual({ totalSlots: 5, usedSlots: 4, freeSlots: 1 }); expect(roomFor(s, 'diamond', catalog)).toBe(127); });
    it('não estima capacidade sem metadados ou em sacos', () => { expect(capacity({ id: 's', kind: 'sack', originalName: 'Saco', items: { diamond: 3 }, capacity: { totalSlots: 9 } }, catalog)).toBeUndefined(); expect(capacity({ id: 'c', kind: 'chest', originalName: 'Baú', items: { unknown: 3 }, capacity: { totalSlots: 9 } }, catalog)).toBeUndefined(); });
});
describe('Planejamento e proteções', () => {
    it('planeja sem alterar o estado original', () => { const state = planState(), p = prefs(); p.groups = [group()]; expect(simulate(state, p, ['diamond'], catalog)[0].status).toBe('preview'); expect(state.storages[1].items.diamond).toBe(60); });
    it.each(['protectedItems', 'favorites'] as const)('bloqueia %s', key => { const p = prefs(); p.groups = [group()]; p[key] = ['diamond']; expect(simulate(planState(), p, ['diamond'], catalog)[0].status).toBe('blocked'); });
    it('bloqueia reservas de craft', () => { const p = prefs(); p.groups = [group()]; p.reserves.diamond = 1; expect(simulate(planState(), p, ['diamond'], catalog)[0].status).toBe('blocked'); });
    it('detecta conflito entre grupos', () => { const p = prefs(); p.groups = [group('a'), group('b')]; expect(simulate(planState(), p, ['diamond'], catalog)[0].reason).toContain('Conflito'); });
    it('não inventa capacidade', () => { const p = prefs(); p.groups = [group()]; const s = planState(); s.storages[1].capacity = undefined; expect(simulate(s, p, ['diamond'], catalog)[0].reason).toContain('Capacidade desconhecida'); });
    it('divide quantidades e reporta o excedente', () => { const p = prefs(); p.groups = [group()]; const s = planState(); s.storages[1].capacity = { totalSlots: 1 }; const rows = simulate(s, p, ['diamond'], catalog); expect(rows[0].quantity).toBe(4); expect(rows[1].quantity).toBe(86); expect(rows[1].status).toBe('blocked'); });
    it('bloqueia operações genéricas sem qualquer rede', () => expect(() => executeMutation()).toThrow('genérica'));
    it('preserva reserva na prévia de drops', () => { const p = prefs(); p.reserves.diamond = 80; expect(previewDrop({ itemId: 'diamond', action: 'sell', minimumReserve: 10, enabled: true }, 100, p).quantity).toBe(20); });
});
describe('Privacidade, catálogo e backup', () => {
    it('remove autenticação e mensagens recursivamente', () => { const clean = projectState({ inventario: { diamond: 1 }, token: 'secret', chat: ['private'], atributos: { mana: 5, sessionId: 'secret', email: 'a@b.com' } }); expect(JSON.stringify(clean)).not.toContain('secret'); expect(clean.atributos).toEqual({ mana: 5 }); });
    it('remove chaves de protótipo e credenciais em valores', () => {
        const clean = sanitize(JSON.parse('{"__proto__":{"polluted":true},"nested":{"auth":"secret"},"x":"Bearer abc"}'));
        expect(JSON.stringify(clean)).not.toContain('secret');
        expect(({} as {
            polluted?: boolean;
        }).polluted).toBeUndefined();
        expect((clean as Record<string, unknown>).x).toBe('[removido]');
    });
    it('restaura backup com esquema validado', () => expect(parseBackup(JSON.stringify({ format: 'blockidle-companion-preferences', version: 1, preferences: prefs() }))).toEqual(prefs()));
    it('rejeita backup inválido e limite negativo', () => { const p = prefs(); p.reserves.diamond = -1; expect(() => parseBackup(JSON.stringify({ format: 'blockidle-companion-preferences', version: 1, preferences: p }))).toThrow(); });
    it('tem URLs reais e somente receitas verificadas', () => { expect(Object.keys(items).length).toBeGreaterThan(600); expect(recipes.filter(r=>r.compactable)).toHaveLength(84); expect(recipes.filter(r=>r.kind==='lapidary')).toHaveLength(18); expect(recipes.every(r => r.source.startsWith('https://blockidle.io/wiki/'))).toBe(true); expect(recipes.filter(r=>r.compactable).some(r => r.id.includes('ruby'))).toBe(false); });
    it('sinaliza build diferente e build ausente', () => { expect(compatibility('new')).toContain('Nova versão'); expect(compatibility()).toContain('não confirmada'); });
});
describe('Regressões de privacidade e metadados', () => {
    it('preserva biscoitos do jogo e remove cookie de autenticação', () => { const state = projectState({ inventario: { cookie: 10, ench_cookie: 2, booster_cookie: 1 }, atributos: { cookie: 'SESSION_SECRET' } }); expect(state.inventario).toEqual({ cookie: 10, ench_cookie: 2, booster_cookie: 1 }); expect(JSON.stringify(state)).not.toContain('SESSION_SECRET'); });
    it('ignora slots dos itens com vaga própria confirmada', () => { const c = { ...catalog, booster_cookie: { id: 'booster_cookie', name: 'Cookie', category: 'Material', rarity: 'Raro', slotExempt: true } }; expect(capacity({ id: 'x', kind: 'chest', originalName: 'Baú', items: { booster_cookie: 1, diamond: 64 }, capacity: { totalSlots: 2 } }, c)?.usedSlots).toBe(1); });
    it('respeita política explícita de proteção na organização', () => { const p = prefs(); p.groups = [group()]; p.policies = [{ itemId: 'diamond', action: 'protect', minimumReserve: 0, enabled: true }]; expect(simulate(planState(), p, ['diamond'], catalog)[0].status).toBe('blocked'); });
});
