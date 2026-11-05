import {z} from 'zod';
const item=z.string().regex(/^[a-z0-9_]+$/).max(100);
const pull=z.object({storageId:z.string().regex(/^(?:ender|bau:-?\d+,-?\d+,-?\d+|fazenda:(?:colheita|criador|ovos|abate))$/),itemId:item,quantity:z.number().int().min(1).max(1000000)}).strict();
export const commandSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('sell'),itemId:item,quantity:z.number().int().min(1).max(1000000),keep:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),expectedInventory:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),unitPrice:z.number().finite().positive(),pulls:z.array(pull).max(1),automatic:z.boolean()}).strict(),
 z.object({kind:z.literal('goalStep'),goalId:z.string().min(1).max(100),stepId:z.string().min(1).max(240),review:z.string().regex(/^[a-f0-9]{16}$/)}).strict(),
 z.object({kind:z.literal('craft'),recipeId:z.string().regex(/^(table|skyblock|armor|forge):[a-z0-9_]+$/),batches:z.number().int().min(1).max(64),pulls:z.array(pull).max(24),expectedStock:z.record(z.number().int().nonnegative())}).strict(),
 z.object({kind:z.literal('compactor'),itemId:item,enabled:z.boolean()}).strict(),
 z.object({kind:z.literal('profile'),itemIds:z.array(item).max(12),replace:z.boolean().optional()}).strict(),
 z.object({kind:z.literal('eraser'),itemIds:z.array(item).max(20).refine(v=>new Set(v).size===v.length,'Itens duplicados')}).strict(),
 z.object({kind:z.literal('autosell'),itemIds:z.array(item).max(7).refine(v=>new Set(v).size===v.length,'Itens duplicados')}).strict(),
 z.object({kind:z.literal('autosellOption'),option:z.enum(['autoja','autotudo']),enabled:z.boolean()}).strict(),
 z.object({kind:z.literal('bazaarNow'),side:z.enum(['c','v']),itemId:item,quantity:z.number().int().min(1).max(71680),maxPrice:z.number().finite().positive().max(1e12).optional()}).strict(),
 z.object({kind:z.literal('bazaarOrder'),side:z.enum(['c','v']),itemId:item,quantity:z.number().int().min(1).max(71680),price:z.number().finite().positive().max(1e12)}).strict(),
 z.object({kind:z.literal('bazaarCancel'),orderId:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}).strict(),
 z.object({kind:z.literal('bazaarClaim')}).strict(),
 z.object({kind:z.literal('wardrobeKit'),slot:z.number().int().min(0).max(19),area:z.string().regex(/^[a-z_]{1,40}$/),compactor:z.array(item).max(12).optional(),eraser:z.array(item).max(20).optional()}).strict(),
 z.object({kind:z.literal('dragonAuto'),enabled:z.boolean()}).strict(),
 z.object({kind:z.literal('enderBackpack')}).strict(),
 z.object({kind:z.literal('terminalStash')}).strict(),
 z.object({kind:z.literal('move'),direction:z.enum(['deposit','withdraw']),storageId:z.string().regex(/^(?:terminal|saco|ender|bolsa[0-8]|bau:-?\d+,-?\d+,-?\d+|fazenda:(?:colheita|criador|ovos|abate))$/).max(100),itemId:item,quantity:z.number().int().min(1).max(1000000)}).strict(),
 z.object({kind:z.literal('transform'),recipeId:item,expectedBatches:z.number().int().min(1).max(1000000)}).strict()
]).refine(c=>c.kind!=='profile'||c.itemIds.length>0||c.replace===true,'Limpar filtros exige substituição explícita.');
