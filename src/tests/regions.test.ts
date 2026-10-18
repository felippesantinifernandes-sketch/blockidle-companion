import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {regions,currentRegion,defaultModel,dropOptions,compactorCapacity} from '../core/regions';
import {normalize} from '../core/normalizer';
import {defaults,parseBackup} from '../db/preferences';
import {recipes,items} from '../catalog/itemCatalog';
import {transformAvailability,commandProtection} from '../core/transformations';
import {parseStateInput} from '../core/importState';
import {commandSchema} from '../api/commands';
const prefs=()=>structuredClone(defaults);
describe('Regiões e precisão das fontes',()=>{
 it('ignora uma camada antiga quando o jogador está no End',()=>{const state=normalize({inventario:{},area:'end',camada:'cristais_selva'});expect(currentRegion(state)?.id).toBe('end');});
 it('não atribui uma mina a uma área sem modelo confirmado',()=>{expect(currentRegion(normalize({inventario:{},area:'catacumba',camada:'cristais_selva'}))).toBeUndefined();expect(currentRegion(normalize({inventario:{},area:'ilha'}))).toBeUndefined();});
 it('identifica área e camada conjuntamente',()=>{expect(currentRegion(normalize({inventario:{},area:'mina',camada:'cristais_selva'}))?.id).toBe('mina:cristais_selva');});
 it('distingue os seis bosques',()=>{for(const forest of ['oak','birch','spruce','dark_oak','acacia','jungle'])expect(currentRegion(normalize({inventario:{},area:'floresta',bosque:forest}))?.forest).toBe(forest);});
 it('modelos respeitam o limite e priorizam a Pedra Dura da Selva',()=>{const r=regions.find(r=>r.id==='mina:cristais_selva')!;expect(defaultModel(r,1).compactorIds).toEqual(['ench_hard_stone']);expect(defaultModel(r).lapidaryIds).toEqual(expect.arrayContaining(['ruby_flawed','amethyst_flawed']));});
 it('todos os drops listados são IDs existentes e têm fonte',()=>{expect(regions.length).toBe(39);for(const r of regions)for(const drop of r.drops){expect(items[drop.itemId]).toBeDefined();expect(drop.source).toMatch(/^https:\/\/blockidle.io\//);}});
 it('aceita lapidação automática de gemas conforme o cliente e exclui cristais',()=>{expect(dropOptions('ruby_rough').compact[0].id).toBe('ruby_flawed');expect(dropOptions('ruby_rough').lapidary[0].id).toBe('ruby_flawed');expect(dropOptions('amethyst_crystal').compact).toEqual([]);});
 it('exige compactador guardado no slot, sem considerar os soltos na mochila',()=>{expect(compactorCapacity(normalize({inventario:{},compactador:'personal_compactor_5000'}))).toBe(3);expect(compactorCapacity(normalize({inventario:{personal_compactor_6000:1}}))).toBeUndefined();});
 it('ferro bruto exige fundição; não inventa uma receita direta',()=>{expect(dropOptions('raw_iron').compact).toHaveLength(0);expect(dropOptions('raw_iron').smelting).toBe('iron_ingot');});
 it('mantém exceções 80, 40 e 144; Perfeita não é lapidação',()=>{expect(recipes.find(r=>r.id==='absolute_ender_pearl')?.ingredients).toEqual({ench_ender_pearl:80});expect(recipes.find(r=>r.id==='ench_wet_sponge')?.ingredients).toEqual({ench_sponge:40});expect(recipes.find(r=>r.id==='super_ench_egg')?.ingredients).toEqual({ench_egg:144});expect(recipes.some(r=>r.kind==='lapidary'&&r.id.endsWith('perfect'))).toBe(false);});
 it('marca a lacuna da wiki para Cobre e Vazio',()=>{expect(regions.find(r=>r.id==='mina:anas_cobre')?.coverage).toBe('client-only');expect(regions.find(r=>r.id==='vazio')?.coverage).toBe('partial');});
});
describe('Origens elegíveis e proteções das ações',()=>{
 it('compactação manual considera somente a mochila',()=>{const state=normalize({inventario:{diamond:320},guardado:{saco:{diamond:1600},bolsa0:{diamond:1600}}});const a=transformAvailability(state,recipes.find(r=>r.id==='ench_diamond')!,prefs());expect(a.batches).toBe(2);expect(a.materials[0].stored).toBe(3200);});
 it('lapidação soma mochila e saco sem usar gemas em baús/bolsas',()=>{const state=normalize({inventario:{ruby_rough:40},guardado:{saco:{ruby_rough:120},bolsa0:{ruby_rough:800},'bau:1,0,0':{ruby_rough:800}}});expect(transformAvailability(state,recipes.find(r=>r.id==='ruby_flawed')!,prefs()).batches).toBe(2);});
 it('reserva bloqueia a ação nativa que processa tudo',()=>{const p=prefs();p.reserves.ruby_rough=1;const s=normalize({inventario:{ruby_rough:160}});expect(transformAvailability(s,recipes.find(r=>r.id==='ruby_flawed')!,p).blocked).toBeTruthy();expect(commandProtection({kind:'transform',recipeId:'ruby_flawed',expectedBatches:2},s,p)).toBeTruthy();});
 it('pode desligar filtro de um ingrediente protegido',()=>{const p=prefs();p.reserves.hard_stone=1;const s=normalize({inventario:{hard_stone:160}});expect(commandProtection({kind:'compactor',itemId:'ench_hard_stone',enabled:true},s,p)).toBeTruthy();expect(commandProtection({kind:'compactor',itemId:'ench_hard_stone',enabled:false},s,p)).toBeUndefined();});
 it('recusa venda, descarte, campos extras e quantidades inseguras',()=>{for(const cmd of [{kind:'sell',itemId:'diamond'},{kind:'move',direction:'withdraw',storageId:'pets',itemId:'diamond',quantity:1},{kind:'move',direction:'withdraw',storageId:'ender',itemId:'diamond',quantity:1.5},{kind:'compactor',itemId:'ench_diamond',enabled:true,url:'/api/vender'}])expect(commandSchema.safeParse(cmd).success).toBe(false);});
 it('migra um backup anterior preservando grupos e tema',()=>{const old:any=prefs();delete old.regionModels;old.theme='light';const restored=parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:old}));expect(restored.theme).toBe('light');expect(restored.regionModels).toEqual({});});
});
describe('Diagnósticos importados',()=>{
 it('trata diagnóstico como consulta offline e preserva baús vazios',()=>{const s=parseStateInput({report:{state:{build:'ef3c8efa9f',area:'end',layer:'cristais_selva',capturedAt:123,source:'live',storages:[{id:'inventory',kind:'inventory',originalName:'Mochila',items:{diamond:7}},{id:'bau:1,0,0',kind:'chest',originalName:'Baú',items:{},metadata:{gameLabel:null}}]}}});expect(s.source).toBe('import');expect(s.tabId).toBeUndefined();expect(s.storages[1].items).toEqual({});expect(currentRegion(s)?.id).toBe('end');});
 it.skipIf(!process.env.BLOCKIDLE_DIAGNOSTIC)('importa o diagnóstico anexado sem inferir filtros ausentes',()=>{const s=parseStateInput(JSON.parse(readFileSync(process.env.BLOCKIDLE_DIAGNOSTIC!,'utf8')));expect(s.source).toBe('import');expect(s.tabId).toBeUndefined();expect(s.storages.length).toBeGreaterThan(0);expect(s.scope).toBeTruthy();});
});
