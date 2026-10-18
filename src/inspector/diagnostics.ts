import type { GameState } from '../core/types';
import { catalogMeta } from '../catalog/itemCatalog';
import { sanitize } from './sanitizer';
import { compatibility } from '../core/versionMonitor';
export function diagnostics(state: GameState | null) { return sanitize({ extensionVersion: '0.3.0', readOnly: false, manualOnly:true, createdAt: new Date().toISOString(), catalog: catalogMeta, compatibility: compatibility(state?.build), state: state ? { build: state.build, source: state.source, capturedAt: state.capturedAt, area: state.area, layer: state.layer, forest:state.forest,terminalAvailable:state.terminalAvailable,observation:state.observation,character:state.character,progress:state.progress,storages: state.storages, warnings: state.warnings } : null }); }
export function downloadJson(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
