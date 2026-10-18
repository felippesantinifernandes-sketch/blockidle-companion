import{Accessories}from'../components/Accessories';
import {locationLabel} from '../../core/regions';
import { capacity } from '../../core/capacity';
import { items } from '../../catalog/itemCatalog';
import { ArrowRight, Box, Layers, MapPin, Package } from 'lucide-react';
import { useStore } from '../store';
import { inventoryIndex } from '../../core/inventoryIndex';
import { compatibility } from '../../core/versionMonitor';
import { itemName } from '../../catalog/itemCatalog';
import { Card, Empty, number, DataTree, time } from '../components/common';
export function Dashboard({ navigate }: {
    navigate: (section: string) => void;
}) {
    const { state, prefs } = useStore();
    if (!state)
        return <Empty title="Sua ilha, em perspectiva">Conecte o jogo para acompanhar recursos, localizar itens e planejar seus próximos passos.</Empty>;
    const index = inventoryIndex(state, prefs), chests = state.storages.filter(s => s.kind === 'chest'), empty = chests.filter(s => !Object.keys(s.items).length);
    return <><div className="hero"><div><span className="eyebrow">SUA CENTRAL DE RECURSOS</span><h2>Mais clareza.<br /><span>Mais espaço para evoluir.</span></h2><p>Todos os recursos identificados, reunidos em um só lugar.</p><button className="primary" onClick={() => navigate('Terminal')}>Explorar terminal <ArrowRight size={16}/></button></div><div className="hero-block" aria-hidden="true"><Layers size={72} strokeWidth={1}/><span>COMPANION / 01</span></div></div><div className="stat-grid">{[[Package, 'Unidades físicas', number(index.reduce((sum, e) => sum + e.total, 0))], [Layers, 'Tipos de itens', number(index.length)], [Box, 'Baús identificados', number(chests.length)], [MapPin, 'Localização', locationLabel(state)]].map(([Icon, label, value]) => { const I = Icon as typeof Package; return <div className="stat-card" key={String(label)}><I size={19}/><small>{String(label)}</small><strong>{String(value)}</strong></div>; })}</div><div className="two-columns"><Card title="Seus principais recursos" action={<button className="text-button" onClick={() => navigate('Terminal')}>Ver todos →</button>}>{index.slice(0, 5).map(e => <div className="row" key={e.id}><div><strong>{e.name}</strong><small>{e.locations.length} local(is)</small></div><b>{number(e.total)}</b></div>)}</Card><Card title="Visão dos armazenamentos"><div className="row"><span>Baús vazios preservados</span><b>{empty.length}</b></div><div className="row"><span>Grupos locais</span><b>{prefs.groups.length}</b></div><div className="row"><span>Itens protegidos</span><b>{prefs.protectedItems.length}</b></div><div className="row"><span>Capacidades calculadas</span><span className="badge">{state.storages.filter(s => capacity(s, items)).length} / {state.storages.length}</span></div><p className="muted">O Companion usa apenas quantidades físicas reconhecidas. Coleções e progressos são exibidos separadamente.</p></Card></div><Card title="Compatibilidade e diagnóstico"><p>{compatibility(state.build)}</p><p className="muted">Último estado: {time(state.capturedAt)} · {state.source === 'demo' ? 'Demonstração' : state.source === 'import' ? 'JSON importado' : 'Aba do jogo'}</p>{state.warnings.map((w, i) => <p className="warning-text" key={i}>{w}</p>)}</Card></>;
}
export function Character() {
    const state = useStore(s => s.state);
    if (!state)
        return <Empty title="Personagem não conectado"/>;
    return <><Card title="Estatísticas do personagem">{['nivel', 'xp', 'hp', 'hpMax', 'mana', 'ouro'].map(key => <div className="row" key={key}><strong>{key}</strong><DataTree value={state.character[key]}/></div>)}</Card><Card title="Equipamentos e pet">{['espada', 'machado', 'enxada', 'vara', 'picareta', 'broca', 'armadura', 'pet', 'petXp', 'petRar', 'compactador', 'autoCompactar'].map(key => <div className="row" key={key}><strong>{key}</strong><div>{typeof state.character[key] === 'string' ? itemName(String(state.character[key])) : <DataTree value={state.character[key]}/>}</div></div>)}</Card><Card title="Atributos disponíveis"><DataTree value={state.character.atributos}/></Card><Accessories/></>;
}
export function Progress() {
    const state = useStore(s => s.state);
    if (!state)
        return <Empty title="Progressão não conectada"/>;
    return <><p className="notice">Valores disponíveis no estado são exibidos como recebidos, sem estimar níveis ou recompensas ausentes.</p>{['habilidades', 'anas', 'colecoes', 'forja', 'minions', 'progressos'].map(key => <Card title={key} key={key}><DataTree value={state.progress[key]}/></Card>)}</>;
}
