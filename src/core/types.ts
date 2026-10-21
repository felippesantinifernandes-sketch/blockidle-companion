export type StorageKind = 'inventory' | 'chest' | 'bag' | 'sack' | 'ender' | 'special';
export interface Item {
    id: string;
    name: string;
    originalName?: string;
    category: string;
    rarity: string;
    texture?: string;
    stackSize?: number;
    slotExempt?: boolean;
    source?: string;
}
export interface Storage {
    id: string;
    kind: StorageKind;
    originalName: string;
    items: Record<string, number>;
    capacity?: {
        totalSlots: number;
        usedSlots?: number;
        freeSlots?: number;
    };
    metadata?: {
        coordinates?: [
            number,
            number,
            number
        ];
        gameLabel?: string;
        linkedToGolem?: boolean;
    };
}
export interface StorageGroup {
    id: string;
    name: string;
    description: string;
    storageIds: string[];
    acceptedItemIds: string[];
    acceptedCategories: string[];
    learnFromExistingItems: boolean;
    priorityStorageIds: string[];
    protectedItemIds: string[];
    onFull: 'stop' | 'notify' | 'ask';
}
export interface CompactorProfile {
    id: string;
    name: string;
    area: string;
    layers: string[];
    itemIds: string[];
    mode: 'manual' | 'suggest';
    enabled: boolean;
}
export interface DropPolicy {
    itemId: string;
    action: 'keep' | 'protect' | 'store' | 'sell' | 'notify';
    minimumReserve: number;
    targetGroupId?: string;
    enabled: boolean;
}
export interface Preferences {
    gameOptions: {neutral:boolean;keepActive:boolean;preventDiscard:boolean};
    objectives: CraftObjective[];
    preserveGoalMaterials: boolean;
    forgeNotifications: boolean;
    updateAlerts: boolean;
    theme: 'dark' | 'light' | 'system';
    navigation: 'sidebar' | 'tabs' | 'compact';
    aliases: Record<string, string>;
    groups: StorageGroup[];
    favorites: string[];
    protectedItems: string[];
    reserves: Record<string, number>;
    profiles: CompactorProfile[];
    policies: DropPolicy[];
    historyEnabled: boolean;
    captureInterval: number;
    wikiIntervalHours: number;
    regionModels: Record<string, { compactorIds: string[]; lapidaryIds: string[] }>;
}
export interface GameState {
    build?: string;
    area?: string;
    layer?: string;
    forest?: string;
    terminalAvailable?: boolean;
    observation?: 'hud' | 'response';
    storages: Storage[];
    character: Record<string, unknown>;
    progress: Record<string, unknown>;
    warnings: string[];
    capturedAt: number;
    source: 'live' | 'import' | 'demo';
    tabId?: number;
    scope?: string;
}
export interface InventoryEntry {
    id: string;
    name: string;
    category: string;
    rarity: string;
    total: number;
    locations: {
        storage: Storage;
        quantity: number;
    }[];
    searchText: string;
}
export interface Recipe {
    id: string;
    name: string;
    output: number;
    ingredients: Record<string, number>;
    source: string;
    compactable: boolean;
    kind?: 'compact' | 'lapidary';
    eligibleStorages?: StorageKind[];
    sourceDate?: string;
}
export interface RegionDrop { itemId: string; condition: string; frequency: string; source: string }
export interface Region { id: string; name: string; area: string; layer?: string; forest?: string; floor?: number; activity?: string; source: string; sourceDate?: string; collectedAt: string; coverage: string; drops: RegionDrop[]; defaultCompactorIds: string[]; defaultLapidaryIds: string[] }
export type CraftCommand={kind:'craft';recipeId:string;batches:number;pulls:{storageId:string;itemId:string;quantity:number}[];expectedStock:Record<string,number>};
export interface CraftObjective {id:string;recipeId:string;quantity:number;enabled:boolean;choices:Record<string,string>}
export type GoalStepCommand={kind:'goalStep';goalId:string;stepId:string;review:string};
export type ManualCommand = GoalStepCommand|CraftCommand| {kind:'compactor';itemId:string;enabled:boolean}|{kind:'profile';itemIds:string[]}|{kind:'move';direction:'deposit'|'withdraw';storageId:string;itemId:string;quantity:number}|{kind:'transform';recipeId:string;expectedBatches:number};
export type GoalTransformCommand={kind:'goalTransform';recipeId:string;batches:number;pulls:{storageId:string;itemId:string;quantity:number}[];expectedAvailable:number};
export type NativeCommand=Exclude<ManualCommand,GoalStepCommand>|GoalTransformCommand;
export interface CommandResult {ok:boolean;error?:string;uncertain?:boolean;message?:string;state?:GameState;changed?:number;requestId?:string}
export interface Snapshot {
    id: string;
    scope?: string;
    at: number;
    source: GameState['source'];
    build?: string;
    area?: string;
    totals: Record<string, number>;
}
export interface PlanRow {
    itemId: string;
    quantity: number;
    source: string;
    destination?: string;
    status: 'blocked' | 'preview';
    reason: string;
    capacity?: number;
}
