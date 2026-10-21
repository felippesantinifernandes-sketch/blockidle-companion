import {describe,it,expect} from 'vitest';import {normalize} from '../core/normalizer';import {accessoryOverview} from '../core/accessories';import {filterAccessories,defaultAccessoryFilters,accessoryEffectIds} from '../core/accessoryFilters';
const rows=(items:Record<string,number>={},stored:Record<string,number>={})=>accessoryOverview(normalize({inventario:items,guardado:{'bau:1,0,0':stored}})).rows;
const select=(items:Record<string,number>={},mode='remaining',stored:Record<string,number>={})=>filterAccessories(rows(items,stored),'','all',{...defaultAccessoryFilters,family:'speed',progression:mode}).map(a=>a.id);
describe('Filtros de atributos e evolução',()=>{
 it('sem posse mostra todos os tiers da família',()=>expect(select()).toEqual(['speed_talisman','speed_ring','speed_artifact']));
 it('tier 2 adquirido mostra apenas tier 3, mesmo consumindo o tier 1',()=>expect(select({speed_ring:1})).toEqual(['speed_artifact']));
 it('família completa não pede versões antigas consumidas',()=>expect(select({speed_artifact:1})).toEqual([]));
 it('considera o maior tier guardado no terminal',()=>expect(select({},'remaining',{speed_ring:1})).toEqual(['speed_artifact']));
 it('próximo tier não é o maior quando ainda há intermediários',()=>expect(select({},'next')).toEqual(['speed_talisman']));
 it('maior tier é o destino final inclusive quando já adquirido',()=>expect(select({speed_artifact:1},'highest')).toEqual(['speed_artifact']));
 it('filtra força e defesa em conjunto',()=>{const r=filterAccessories(rows(),'','all',{...defaultAccessoryFilters,effects:['strength','defense'],effectMatch:'all'});expect(r.map(a=>a.id)).toContain('gravity_talisman');expect(r.map(a=>a.id)).not.toContain('power_ring');});
 it('não confunde cura com bônus de vida nem defesa com redução de dano',()=>{const all=rows();expect(accessoryEffectIds(all.find(a=>a.id==='devour_ring')!)).not.toContain('health');expect(accessoryEffectIds(all.find(a=>a.id==='zombie_talisman')!)).not.toContain('defense');});
 it('engastes não prometem atributos sem gemas',()=>{const tags=accessoryEffectIds(rows().find(a=>a.id==='ring_of_power')!);expect(tags).toContain('sockets');expect(tags).not.toContain('health');});
 it('distingue mineração de movimento',()=>expect(filterAccessories(rows(),'','all',{...defaultAccessoryFilters,effects:['miningSpeed']}).some(a=>a.id==='speed_ring')).toBe(false));
 it('busca sem acentos e combina status, raridade e família',()=>expect(filterAccessories(rows(),'forca','missing',{...defaultAccessoryFilters,family:'forca',rarity:'raro'}).map(a=>a.id)).toEqual(['power_ring']));
});
