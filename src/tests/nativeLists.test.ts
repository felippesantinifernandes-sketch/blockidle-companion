import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {defaults,parseBackup} from '../db/preferences';
import {commandSchema} from '../api/commands';
import {commandProtection} from '../core/transformations';
import {goalCommandBlock} from '../core/objectives';
import {supportsCommandBuild,operationsBuild} from '../core/versionMonitor';
import {activeList,eligible,listCapacity,presetDiff,sameSet,AUTOSELL_SLOTS} from '../core/nativeLists';
const state=()=>normalize({inventario:{cobblestone:300,diamond_sword:1},apagador:'personal_deletor_5000',compactador:'personal_compactor_5000',apagar:['cobblestone'],autoVender:['rotten_flesh'],autoVenderTudo:false,autoCompactar:['ench_cobblestone']},'demo');
describe('Listas nativas da mochila',()=>{
 it('lê as três listas e as vagas do estado',()=>{const s=state();expect(activeList(s,'eraser')).toEqual(['cobblestone']);expect(activeList(s,'autosell')).toEqual(['rotten_flesh']);expect(activeList(s,'compactor')).toEqual(['ench_cobblestone']);expect(listCapacity(s,'eraser')).toBe(7);expect(listCapacity(s,'compactor')).toBe(3);expect(listCapacity(s,'autosell')).toBe(AUTOSELL_SLOTS);});
 it('vagas do apagador vêm do catálogo conectado quando disponível',()=>{const s=state();s.character.companionCapabilities={eraserSlots:{personal_deletor_5000:9}};expect(listCapacity(s,'eraser')).toBe(9);s.character.apagador=undefined;expect(listCapacity(s,'eraser')).toBeUndefined();});
 it('lista em formato inesperado fica indisponível',()=>{const s=state();s.character.apagar='cobblestone';expect(activeList(s,'eraser')).toBeUndefined();});
 it('espelha as regras do cliente para apagar e vender',()=>{expect(eligible('eraser','cobblestone')).toBe(true);expect(eligible('eraser','ench_cobblestone')).toBe(false);expect(eligible('eraser','booster_cookie')).toBe(false);expect(eligible('eraser','personal_deletor_4000')).toBe(false);expect(eligible('autosell','cobblestone')).toBe(true);expect(eligible('autosell','fishing_rod')).toBe(false);expect(eligible('compactor','ench_cobblestone')).toBe(true);expect(eligible('compactor','cobblestone')).toBe(false);});
 it('compara conjuntos sem depender da ordem',()=>{expect(sameSet(['a','b'],['b','a'])).toBe(true);expect(presetDiff({name:'x',itemIds:['a','b']},['b','c'])).toEqual({add:['a'],remove:['c']});});
});
describe('Comandos do apagador e da auto-venda',()=>{
 it('valida limite e duplicados',()=>{expect(commandSchema.safeParse({kind:'eraser',itemIds:['cobblestone']}).success).toBe(true);expect(commandSchema.safeParse({kind:'eraser',itemIds:[]}).success).toBe(true);expect(commandSchema.safeParse({kind:'autosell',itemIds:['a','a']}).success).toBe(false);expect(commandSchema.safeParse({kind:'autosell',itemIds:['a','b','c','d','e','f','g','h']}).success).toBe(false);});
 it('bloqueia itens protegidos e materiais de objetivos',()=>{const s=state(),p=structuredClone(defaults);p.protectedItems=['cobblestone'];expect(commandProtection({kind:'eraser',itemIds:['cobblestone']},s,p)).toMatch(/protegido/);expect(commandProtection({kind:'autosell',itemIds:['rotten_flesh']},s,p)).toBeUndefined();expect(goalCommandBlock({kind:'eraser',itemIds:[]},s,defaults)).toBeUndefined();});
 it('segue o mesmo controle de build das demais ações',()=>{expect(supportsCommandBuild(operationsBuild,'eraser')).toBe(true);expect(supportsCommandBuild(operationsBuild,'autosell')).toBe(true);expect(supportsCommandBuild('desconhecido','eraser')).toBe(false);});
});
describe('Conjuntos salvos',()=>{
 it('backup antigo recebe nove quadrados vazios por lista',()=>{const old:any=structuredClone(defaults);delete old.filterPresets;const m=parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:old}));expect(m.filterPresets.eraser).toHaveLength(9);expect(m.filterPresets.compactor.every(v=>v===null)).toBe(true);});
 it('preserva conjuntos e rejeita quantidade errada de quadrados',()=>{const p=structuredClone(defaults);p.filterPresets.autosell[2]={name:'Mina',itemIds:['cobblestone']};expect(parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:p})).filterPresets.autosell[2]).toEqual({name:'Mina',itemIds:['cobblestone']});(p.filterPresets as any).eraser=[null];expect(()=>parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:p}))).toThrow();});
});
