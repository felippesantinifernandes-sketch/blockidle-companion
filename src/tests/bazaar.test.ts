import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {defaults} from '../db/preferences';
import {commandSchema} from '../api/commands';
import {commandProtection} from '../core/transformations';
import {goalCommandBlock} from '../core/objectives';
import {supportsCommandBuild,currentBuild,operationsBuild} from '../core/versionMonitor';
import {flipMargin} from '../ui/pages/Bazaar';
const s=normalize({inventario:{diamond:10}},'live');
describe('Bazar',()=>{
 it('valida comandos e limites do Bazar',()=>{expect(commandSchema.safeParse({kind:'bazaarNow',side:'c',itemId:'diamond',quantity:10,maxPrice:9}).success).toBe(true);expect(commandSchema.safeParse({kind:'bazaarNow',side:'c',itemId:'diamond',quantity:71681}).success).toBe(false);expect(commandSchema.safeParse({kind:'bazaarOrder',side:'v',itemId:'diamond',quantity:1,price:0}).success).toBe(false);expect(commandSchema.safeParse({kind:'bazaarCancel',orderId:3}).success).toBe(true);expect(commandSchema.safeParse({kind:'bazaarClaim'}).success).toBe(true);});
 it('bloqueia vender item protegido, mas permite comprar',()=>{const p=structuredClone(defaults);p.protectedItems=['diamond'];expect(commandProtection({kind:'bazaarNow',side:'v',itemId:'diamond',quantity:1},s,p)).toMatch(/protegido/);expect(commandProtection({kind:'bazaarOrder',side:'c',itemId:'diamond',quantity:1,price:2},s,p)).toBeUndefined();expect(goalCommandBlock({kind:'bazaarClaim'},s,defaults)).toBeUndefined();});
 it('liberado só no build revisado',()=>{expect(supportsCommandBuild(currentBuild,'bazaarNow')).toBe(true);expect(supportsCommandBuild(operationsBuild,'bazaarNow')).toBe(false);});
 it('calcula a margem de revenda com a taxa',()=>{expect(flipMargin(100,120,0.05)).toEqual({net:14,ratio:0.14});expect(flipMargin(null,120,0.05)).toBeUndefined();});
});
