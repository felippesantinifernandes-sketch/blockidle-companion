import { useState, type ReactNode } from 'react';
import { items, itemName } from '../../catalog/itemCatalog';
export const number = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
export const time = (v: number) => new Date(v).toLocaleString('pt-BR');
export function Card({ title, children, action }: {
    title?: string;
    children: ReactNode;
    action?: ReactNode;
}) { return <section className="card">{title && <div className="card-heading"><h2>{title}</h2>{action}</div>}{children}</section>; }
export function Empty({ title, children }: {
    title: string;
    children?: ReactNode;
}) { return <div className="empty"><span className="empty-symbol">◇</span><h2>{title}</h2><p>{children}</p></div>; }
export const missingTextures = new Set<string>();
export function ItemIcon({ id, onMissing }: {
    id: string;
    onMissing?: (id: string) => void;
}) { const [failed, setFailed] = useState(false); const texture = items[id]?.texture; return texture && !failed ? <img className="item-icon" src={texture} alt="" loading="lazy" onError={() => { setFailed(true); missingTextures.add(id); onMissing?.(id); }}/> : <span className={'item-icon ' + (id.startsWith('ench_') ? 'enchanted' : '')} aria-hidden="true">{itemName(id).slice(0, 1)}</span>; }
export function DataTree({ value }: {
    value: unknown;
}) {
    if (value === null || value === undefined)
        return <span className="muted">Não disponível</span>;
    if (typeof value !== 'object')
        return <span>{String(value)}</span>;
    const entries = Object.entries(value);
    if (!entries.length)
        return <span className="muted">Nenhum registro disponível</span>;
    return <dl className="data-tree">{entries.slice(0, 100).map(([key, v]) => <div key={key}><dt>{key}</dt><dd>{typeof v === 'object' && v !== null ? <details><summary>Ver detalhes</summary><DataTree value={v}/></details> : String(v ?? 'Não disponível')}</dd></div>)}</dl>;
}
