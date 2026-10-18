import workbenchData from'./workbench.json';
import regionData from './regions.json';
import { catalogMeta, items, recipes } from './itemCatalog';
export async function catalogFingerprint() { const content = JSON.stringify({ items, recipes, regions:regionData,workbench:workbenchData }); const bytes = new TextEncoder().encode(content), hash = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''); }
export interface WikiCheck {
    checkedAt: number;
    sourceDate?: string;
    changed: boolean;
    error?: string;
}
export async function checkWiki(): Promise<WikiCheck> {
    const result: WikiCheck = { checkedAt: Date.now(), changed: false };
    try {
        const response = await fetch('https://blockidle.io/wiki/itens', { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (!response.ok)
            throw new Error('HTTP ' + response.status);
        const html = await response.text();
        const date = /Wiki gerada[\s\S]{0,150}?(\d{4}-\d{2}-\d{2})/.exec(html)?.[1];
        if (!date)
            throw new Error('Data-base da wiki não identificada.');
        result.sourceDate = date;
        result.changed = date !== catalogMeta.wikiSourceDate;
    }
    catch (e) {
        result.error = e instanceof Error ? e.message : 'Falha de consulta';
    }
    return result;
}
