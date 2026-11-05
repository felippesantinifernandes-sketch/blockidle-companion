import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {craftTree} from '../core/craftTree';
import type {PlanningRecipe} from '../core/objectives';
const r=(id:string,out:string,output:number,ingredients:Record<string,number>,kind:PlanningRecipe['kind']='table'):PlanningRecipe=>({id,outputId:out,name:out,output,ingredients,kind,source:''});
const catalog=[r('table:pick','pick',1,{plank:3,stick:2}),r('table:plank','plank',4,{log:1}),r('table:stick','stick',4,{plank:2}),r('table:loop','a',1,{b:1}),r('table:loop2','b',1,{a:1})];
describe('Árvore de craft do objetivo',()=>{
 it('expande sub-crafts sem contar o estoque duas vezes',()=>{const s=normalize({inventario:{plank:3,log:0}},'live');const t=craftTree(s,catalog[0],1,catalog);
  // 3 tábuas vão para a picareta; os gravetos precisam de 2 tábuas novas → 1 tora
  const stick=t.root.children.find(c=>c.id==='stick')!;expect(t.root.children.find(c=>c.id==='plank')).toMatchObject({have:3,missing:0,status:'ok'});expect(stick).toMatchObject({missing:2,status:'craft',batches:1});expect(stick.children[0]).toMatchObject({id:'plank',need:2,have:0,status:'craft'});expect(t.gather).toEqual({log:1});expect(t.crafts.map(c=>c.recipe.outputId)).toEqual(['plank','stick','pick']);});
 it('objetivo já cumprido não pede nada',()=>{const s=normalize({inventario:{pick:2}},'live');const t=craftTree(s,catalog[0],2,catalog);expect(t.root.status).toBe('ok');expect(t.gather).toEqual({});expect(t.progress).toBe(1);});
 it('para em receitas circulares',()=>{const t=craftTree(normalize({inventario:{}},'live'),catalog[3],1,catalog);expect(t.root.children[0].children[0].status).toBe('cycle');expect(t.gather).toEqual({a:1});});
});
import {defaults,parseBackup} from '../db/preferences';
describe('Objetivo fixado',()=>{it('backup antigo começa sem objetivo fixado e preserva o fixado',()=>{const old:any=structuredClone(defaults);delete old.pinnedObjective;expect(parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:old})).pinnedObjective).toBeNull();const p=structuredClone(defaults);p.pinnedObjective='abc';expect(parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:p})).pinnedObjective).toBe('abc');});});
