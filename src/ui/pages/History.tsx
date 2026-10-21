import{craftRecipes}from'../../core/workbench';
import {readActionLog} from '../../api/manual';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { addSnapshot, listSnapshots, clearSnapshots } from '../../db/snapshots';
import type { Snapshot } from '../../core/types';
import { itemName } from '../../catalog/itemCatalog';
import { downloadJson } from '../../inspector/diagnostics';
import { Card, Empty, number, time } from '../components/common';
export function History() {
    const { state, setError } = useStore(), [snapshots, setSnapshots] = useState<Snapshot[]>([]), [selected, setSelected] = useState(''), [confirm, setConfirm] = useState(false);
    const load = () => listSnapshots().then(setSnapshots).catch(() => setError('Falha ao ler histórico local.'));
    useEffect(() => { void load(); }, []);
    const [actions,setActions]=useState<Awaited<ReturnType<typeof readActionLog>>>([]);
    useEffect(()=>{void readActionLog().then(setActions).catch(()=>setError('Falha ao ler as ações locais.'));},[]);
    const current = snapshots.find(s => s.id === selected) ?? snapshots[0];
    const older = current ? snapshots.find(s => s.at < current.at && s.source === current.source && !!current.scope && s.scope === current.scope) : undefined;
    return <><Card title="Ações no jogo"><p className="muted">Últimas 100 ações do painel, incluindo vendas automáticas. Resultados sem confirmação ficam identificados; nenhuma transação é repetida automaticamente.</p>{actions.map((a,i)=><div className="row" key={i}><div><strong>{a.command.kind==='sell'?(a.command.automatic?'Venda automática':'Venda manual'):a.command.kind==='compactor'?'Filtro do compactador':a.command.kind==='profile'?'Modelo de filtros':a.command.kind==='move'?'Movimentação':a.command.kind==='craft'?'Craft / Forja':a.command.kind==='goalStep'?'Etapa de objetivo':'Transformação'}</strong><small>{time(a.at)} · {'itemId' in a.command?itemName(a.command.itemId):'recipeId' in a.command?(craftRecipes.find(r=>r.id===('recipeId' in a.command?a.command.recipeId:''))?.name??itemName(a.command.recipeId)):'Etapa de objetivo'}</small>{a.command.kind==='sell'&&a.status==='confirmed'&&a.changed!==undefined&&<small>{number(a.changed)} unidade(s) com venda confirmada</small>}{a.error&&<small>{a.error}</small>}</div><span className="badge">{a.status==='confirmed'?'Confirmada':a.status==='uncertain'?'Revisar resultado':'Não executada'}</span></div>)}{!actions.length&&<p className="muted">Nenhuma ação registrada neste navegador.</p>}</Card><div className="toolbar"><button className="primary" disabled={!state} onClick={async () => {
            try {
                await addSnapshot(state!);
                await load();
            }
            catch {
                setError('Falha ao salvar snapshot.');
            }
        }}>Salvar snapshot</button><button disabled={!snapshots.length} onClick={() => downloadJson('blockidle-historico.json', snapshots)}>Exportar histórico</button><button onClick={() => setConfirm(true)}>Limpar histórico</button></div>{confirm && <Card title="Apagar histórico local?"><p>Esta ação remove os snapshots armazenados neste navegador.</p><div className="button-row"><button onClick={() => setConfirm(false)}>Cancelar</button><button onClick={async () => {
                try {
                    await clearSnapshots();
                    setConfirm(false);
                    await load();
                }
                catch {
                    setError('Falha ao limpar histórico.');
                }
            }}>Apagar snapshots</button></div></Card>}{!snapshots.length ? <Empty title="Sua evolução começa com um registro">Snapshots guardam totais sanitizados. Demonstração, importação e jogo ficam identificados.</Empty> : <Card title="Snapshots locais"><select aria-label="Selecionar snapshot" value={current?.id} onChange={e => setSelected(e.target.value)}>{snapshots.map(s => <option key={s.id} value={s.id}>{time(s.at)} · {s.source}</option>)}</select><p className="muted">Máximo de 200 snapshots. Comparações usam registros da mesma sessão e mostram variação de estoque; não representam rendimento ou vendas.</p>{[...new Set([...Object.keys(current?.totals ?? {}), ...Object.keys(older?.totals ?? {})])].map(id => { const q = current?.totals[id] ?? 0; return <div className="row" key={id}><strong>{itemName(id)}</strong><span>{number(q)}</span>{older && <span className="badge">Δ {number(q - (older.totals[id] ?? 0))}</span>}</div>; })}</Card>}</>;
}
