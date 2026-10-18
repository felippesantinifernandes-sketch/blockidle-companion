import {z} from 'zod';
import {normalize} from './normalizer';
import {sanitize} from '../inspector/sanitizer';
import {quantitySchema} from '../api/schemas';
import type {GameState} from './types';
const diagnostic=z.object({build:z.string().optional(),area:z.string().optional(),layer:z.string().optional(),forest:z.string().optional(),terminalAvailable:z.boolean().optional(),capturedAt:z.number().finite(),character:z.record(z.unknown()).default({}),progress:z.record(z.unknown()).default({}),warnings:z.array(z.string()).default([]),storages:z.array(z.object({id:z.string().max(100),kind:z.enum(['inventory','chest','bag','sack','ender','special']),originalName:z.string().max(100),items:z.record(quantitySchema),capacity:z.object({totalSlots:z.number().int().positive(),usedSlots:z.number().int().nonnegative().optional(),freeSlots:z.number().int().nonnegative().optional()}).optional(),metadata:z.object({coordinates:z.tuple([z.number(),z.number(),z.number()]).optional(),gameLabel:z.string().nullable().optional(),linkedToGolem:z.boolean().optional()}).optional()})).max(3000)});
export function parseStateInput(input:unknown):GameState {
 const report=(input as {report?:{state?:unknown}})?.report?.state;
 if(!report)return normalize(input,'import');
 const value=diagnostic.parse(sanitize(report));
 const storages=value.storages.map(s=>({...s,metadata:s.metadata?{...s.metadata,gameLabel:s.metadata.gameLabel??undefined}:undefined}));
 return {...value,storages,source:'import',scope:crypto.randomUUID(),warnings:[...value.warnings,'Diagnóstico importado para consulta. Configurações ausentes não são inferidas; conecte o jogo para agir.']};
}
