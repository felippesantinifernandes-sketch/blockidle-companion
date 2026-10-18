import type { CompactorProfile, GameState } from './types';
import { recipes } from '../catalog/itemCatalog';
export function suggestedProfiles(state: GameState, profiles: CompactorProfile[]) { return profiles.filter(p => p.enabled && p.mode === 'suggest' && p.area === state.area && (!p.layers.length || p.layers.includes(state.layer ?? ''))); }
export function validateProfile(profile: CompactorProfile) { return profile.itemIds.every(id => recipes.some(r => r.id === id && r.compactable)); }
