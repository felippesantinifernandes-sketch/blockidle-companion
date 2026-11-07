import type { Preferences } from '../core/types';
import { preferencesSchema } from '../api/schemas';
export const defaults: Preferences = { discardDefaultApplied:true,pinnedObjective:null,backgroundSync:false,valueGuard:null,notify:{enabled:false,backpackFull:true,offline:true,queueEmpty:true,dragon:true,auction:true,bazaar:true,build:true,areaRule:true},presenceDefaultApplied:true,areaRules:{},areaMode:'suggest',filterPresets:{compactor:Array(9).fill(null),eraser:Array(9).fill(null),autosell:Array(9).fill(null)},sales:{enabled:false,rules:[]},pageOrder:[],collapsedSections:{},gameOptions:{neutral:false,keepActive:true,preventDiscard:true}, objectives:[], preserveGoalMaterials:true, forgeNotifications:false, updateAlerts:true, theme: 'dark', navigation: 'sidebar', aliases: {}, groups: [], favorites: [], protectedItems: [], reserves: {}, profiles: [{ id: 'jungle', name: 'Crystal Hollows · Selva', area: 'mina', layers: ['cristais_selva'], itemIds: ['ench_hard_stone'], mode: 'manual', enabled: true }, { id: 'dwarven', name: 'Minas Anãs', area: 'mina', layers: ['anas'], itemIds: ['ench_mithril', 'ench_titanium'], mode: 'manual', enabled: true }], policies: [], historyEnabled: true, captureInterval: 30, wikiIntervalHours: 24, regionModels:{} };
export const hasChrome = () => typeof chrome !== 'undefined' && !!chrome.runtime?.id;
const key = 'blockidle.preferences.v1';
export async function readPreferences(): Promise<Preferences> { const value = hasChrome() ? (await chrome.storage.local.get(key))[key] : JSON.parse(localStorage.getItem(key) ?? 'null'); const parsed = preferencesSchema.safeParse(value); if (!parsed.success) return structuredClone(defaults); return applyPresenceDefault(parsed.data); }
export function applyPresenceDefault(prefs: Preferences): Preferences { let next = prefs; if (!next.presenceDefaultApplied) next = { ...next, presenceDefaultApplied: true, gameOptions: { ...next.gameOptions, keepActive: true } }; if (!next.discardDefaultApplied) next = { ...next, discardDefaultApplied: true, gameOptions: { ...next.gameOptions, preventDiscard: true } }; return next; }
export async function savePreferences(value: Preferences) {
    const valid = preferencesSchema.parse(value);
    if (hasChrome())
        await chrome.storage.local.set({ [key]: valid });
    else
        localStorage.setItem(key, JSON.stringify(valid));
}
export function parseBackup(text: string): Preferences {
    const obj = JSON.parse(text);
    if (obj.format !== 'blockidle-companion-preferences' || obj.version !== 1)
        throw new Error('Backup incompatível.');
    return preferencesSchema.parse(obj.preferences);
}
