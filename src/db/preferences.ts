import type { Preferences } from '../core/types';
import { preferencesSchema } from '../api/schemas';
export const defaults: Preferences = { theme: 'dark', navigation: 'sidebar', aliases: {}, groups: [], favorites: [], protectedItems: [], reserves: {}, profiles: [{ id: 'jungle', name: 'Crystal Hollows · Selva', area: 'mina', layers: ['cristais_selva'], itemIds: ['ench_hard_stone'], mode: 'manual', enabled: true }, { id: 'dwarven', name: 'Minas Anãs', area: 'mina', layers: ['anas'], itemIds: ['ench_mithril', 'ench_titanium'], mode: 'manual', enabled: true }], policies: [], historyEnabled: true, captureInterval: 30, wikiIntervalHours: 24, regionModels:{} };
export const hasChrome = () => typeof chrome !== 'undefined' && !!chrome.runtime?.id;
const key = 'blockidle.preferences.v1';
export async function readPreferences(): Promise<Preferences> { const value = hasChrome() ? (await chrome.storage.local.get(key))[key] : JSON.parse(localStorage.getItem(key) ?? 'null'); const parsed = preferencesSchema.safeParse(value); return parsed.success ? parsed.data : structuredClone(defaults); }
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
