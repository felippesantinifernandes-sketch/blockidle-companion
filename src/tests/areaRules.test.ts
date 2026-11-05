import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {defaults,parseBackup} from '../db/preferences';
import {areaPlan,emptyRule,ruleIsEmpty} from '../core/areaRules';
import {commandSchema} from '../api/commands';
import {commandProtection} from '../core/transformations';
import {goalCommandBlock} from '../core/objectives';
import {supportsCommandBuild,currentBuild} from '../core/versionMonitor';
const state=(area:string,extra:Record<string,unknown>={})=>normalize({inventario:{},area,autoCompactar:['ench_cobblestone'],apagar:[],autoVender:['rotten_flesh'],autoVenderJa:false,autoVenderTudo:true,...extra},'live');
const prefs=()=>{const p=structuredClone(defaults);p.filterPresets.compactor[0]={name:'Mina',itemIds:['ench_cobblestone','ench_coal']};p.filterPresets.eraser[1]={name:'Lixo',itemIds:['cobblestone']};p.filterPresets.autosell[2]={name:'Carne',itemIds:['rotten_flesh']};p.areaRules.mina={compactor:0,eraser:1,autosell:2,autoJa:null,autoTudo:false};return p;};
describe('Regras por área',()=>{
 it('gera exatamente os pedidos que diferem do jogo',()=>{const plan=areaPlan(state('mina'),prefs());expect(plan.steps.map(s=>s.command)).toEqual([{kind:'profile',itemIds:['ench_cobblestone','ench_coal'],replace:true},{kind:'eraser',itemIds:['cobblestone']},{kind:'autosellOption',option:'autotudo',enabled:false}]);});
 it('nada a fazer em área sem regra ou já igual',()=>{expect(areaPlan(state('lago'),prefs()).steps).toEqual([]);const p=prefs();p.areaRules.mina={...emptyRule(),autosell:2};expect(areaPlan(state('mina'),p).steps).toEqual([]);});
 it('aponta quadrado vazio sem gerar pedido',()=>{const p=prefs();p.areaRules.mina={...emptyRule(),eraser:5};const plan=areaPlan(state('mina'),p);expect(plan.steps).toEqual([]);expect(plan.missing[0]).toMatch(/quadrado 6/);});
 it('regra vazia é descartada',()=>{expect(ruleIsEmpty(emptyRule())).toBe(true);expect(ruleIsEmpty({...emptyRule(),autoJa:true})).toBe(false);});
 it('backup antigo começa no modo sugerir e sem regras',()=>{const old:any=structuredClone(defaults);delete old.areaRules;delete old.areaMode;const m=parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:old}));expect(m.areaMode).toBe('suggest');expect(m.areaRules).toEqual({});});
 it('rejeita índice de quadrado inválido',()=>{const p:any=prefs();p.areaRules.mina.compactor=9;expect(()=>parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:p}))).toThrow();});
});
describe('Opções da auto-venda',()=>{
 it('valida o comando e segue as regras de build dos filtros',()=>{expect(commandSchema.safeParse({kind:'autosellOption',option:'autoja',enabled:true}).success).toBe(true);expect(commandSchema.safeParse({kind:'autosellOption',option:'vender',enabled:true}).success).toBe(false);expect(supportsCommandBuild(currentBuild,'autosellOption')).toBe(true);const s=state('mina');expect(commandProtection({kind:'autosellOption',option:'autoja',enabled:true},s,defaults)).toBeUndefined();expect(goalCommandBlock({kind:'autosellOption',option:'autoja',enabled:true},s,defaults)).toBeUndefined();});
});
describe('Guarda-roupa nas regras por área',()=>{
 it('grava o conjunto e liga a área só quando difere',()=>{const p=prefs();p.areaRules.mina={...p.areaRules.mina,autoTudo:null,wardrobe:1};const s=state('mina',{autoCompactar:['ench_cobblestone','ench_coal'],apagar:['cobblestone']});const plan=areaPlan(s,p);expect(plan.steps.map(x=>x.command)).toEqual([{kind:'wardrobeKit',slot:1,area:'mina',compactor:['ench_cobblestone','ench_coal'],eraser:['cobblestone']}]);
  const done=state('mina',{autoCompactar:['ench_cobblestone','ench_coal'],apagar:['cobblestone'],guardaComp:{1:['ench_coal','ench_cobblestone']},guardaApag:{1:['cobblestone']},guardaAuto:{mina:1}});expect(areaPlan(done,p).steps).toEqual([]);});
});
import {learn,suggestSets} from '../core/learnedDrops';
describe('Drops aprendidos e sugestão',()=>{
 it('aprende o que cresce na mesma área e ignora viagens',()=>{const store={};const a=normalize({inventario:{cobblestone:10},area:'mina'},'live'),b=normalize({inventario:{cobblestone:25,coal:3},area:'mina'},'live'),c=normalize({inventario:{cobblestone:40},area:'lago'},'live');expect(learn(a,b,store,1)).toBe(true);expect(store).toEqual({mina:{cobblestone:{n:15,last:1},coal:{n:3,last:1}}});expect(learn(b,c,store,2)).toBe(false);});
 it('sugere compactador, apagador e auto-venda respeitando proteção e limite',()=>{const s=normalize({inventario:{},area:'mina',compactador:'personal_compactor_5000',apagador:'personal_deletor_4000'},'live');const p=structuredClone(defaults);p.protectedItems=['coal'];p.valueGuard=5;const learned={mina:{cobblestone:{n:500,last:1},wheat_seeds:{n:40,last:1},coal:{n:30,last:1},rotten_flesh:{n:20,last:1}}};const sug=suggestSets('mina',s,p,learned,{rotten_flesh:{buy:9,sell:8}});expect(sug.compactor).toContain('ench_cobblestone');expect(sug.compactor).not.toContain('ench_coal');expect(sug.eraser).toContain('wheat_seeds');expect(sug.autosell).not.toContain('rotten_flesh');expect([...sug.eraser,...sug.autosell]).not.toContain('coal');expect(sug.compactor.length).toBeLessThanOrEqual(3);});
});
