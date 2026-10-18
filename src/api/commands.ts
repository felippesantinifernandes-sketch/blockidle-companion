import {z} from 'zod';
const item=z.string().regex(/^[a-z0-9_]+$/).max(100);
const pull=z.object({storageId:z.string().regex(/^(?:ender|bau:-?\d+,-?\d+,-?\d+|fazenda:(?:colheita|criador|ovos|abate))$/),itemId:item,quantity:z.number().int().min(1).max(1000000)}).strict();
export const commandSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('craft'),recipeId:z.string().regex(/^(table|skyblock|armor|forge):[a-z0-9_]+$/),batches:z.number().int().min(1).max(64),pulls:z.array(pull).max(24),expectedStock:z.record(z.number().int().nonnegative())}).strict(),
 z.object({kind:z.literal('compactor'),itemId:item,enabled:z.boolean()}).strict(),
 z.object({kind:z.literal('profile'),itemIds:z.array(item).min(1).max(12)}).strict(),
 z.object({kind:z.literal('move'),direction:z.enum(['deposit','withdraw']),storageId:z.string().regex(/^(?:terminal|saco|ender|bolsa[0-8]|bau:-?\d+,-?\d+,-?\d+|fazenda:(?:colheita|criador|ovos|abate))$/).max(100),itemId:item,quantity:z.number().int().min(1).max(1000000)}).strict(),
 z.object({kind:z.literal('transform'),recipeId:item,expectedBatches:z.number().int().min(1).max(1000000)}).strict()
]);
