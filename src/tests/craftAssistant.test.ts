import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {defaults} from '../db/preferences';
import {craftRecipes,craftPlan,nativeAvailable} from '../core/workbench';
import {itemLocations,bazaarCost,coverage} from '../core/locations';
const storage=craftRecipes.find(r=>r.id==='skyblock:minion_storage_small')!;
const state=()=>normalize({inventario:{birch_planks:40,spruce_planks:10},guardado:{ferramentas:{chest:1},'bau:5,0,-3':{oak_planks:30},ender:{oak_planks:5}},base:{'5,0,-3':'chest'},bauRotulo:{'5,0,-3':'madeira'}},'live');
describe('Assistente de craft',()=>{
 it('segue a regra do jogo: qualquer tábua da mochila e reservas da aba pagam',()=>{const s=state();expect(nativeAvailable(s,storage,'oak_planks')).toBe(50);expect(nativeAvailable(s,storage,'chest')).toBe(1);const plan=craftPlan(s,storage,defaults,1,false);expect(plan.materials.find(m=>m.id==='oak_planks')?.missing).toBe(14);});
 it('baús, Ender e farms não pagam, mas aparecem como lugar',()=>{const locs=itemLocations(state(),'oak_planks');expect(locs.map(l=>[l.label,l.quantity,l.pays])).toEqual([['Baú 5,0,-3 · madeira',30,false],['Baú do Ender',5,false]]);});
 it('reservas da aba entram no estado e nos lugares',()=>{const locs=itemLocations(state(),'chest');expect(locs[0]).toMatchObject({label:'Reservas da aba',pays:true});});
 it('calcula custo no Bazar e não estima sem oferta',()=>{const prices={oak_planks:{buy:2.5,sell:2},chest:{buy:null,sell:3}};expect(bazaarCost(prices,'oak_planks',4)).toBe(10);expect(bazaarCost(prices,'chest',1)).toBeUndefined();expect(bazaarCost(prices,'chest',0)).toBe(0);expect(bazaarCost(undefined,'oak_planks',1)).toBeUndefined();});
 it('mede quanto da receita já está coberto',()=>{expect(coverage([{required:64,native:50},{required:1,native:1}])).toBeCloseTo(51/65);expect(coverage([])).toBe(1);});
});
