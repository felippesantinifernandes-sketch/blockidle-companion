import { create } from 'zustand';
import type { GameState, Preferences } from '../core/types';
import { defaults, readPreferences, savePreferences } from '../db/preferences';
interface Store {
    state: GameState | null;
    prefs: Preferences;
    ready: boolean;
    error: string;
    setState: (state: GameState | null) => void;
    patch: (patch: Partial<Preferences>) => void;
    initialize: () => Promise<void>;
    setError: (text: string) => void;
}
let saveQueue = Promise.resolve();
export const useStore = create<Store>((set, get) => ({ state: null, prefs: structuredClone(defaults), ready: false, error: '', setState: state => set({ state }), setError: error => set({ error }), patch: patch => { const prefs = { ...get().prefs, ...patch }; set({ prefs }); saveQueue = saveQueue.then(() => savePreferences(prefs)).catch(() => set({ error: 'Não foi possível salvar as preferências. Exporte um backup antes de fechar.' })); }, initialize: async () => {
        try {
            set({ prefs: await readPreferences(), ready: true });
        }
        catch {
            set({ ready: true, error: 'Preferências indisponíveis; usando os valores iniciais.' });
        }
    } }));
