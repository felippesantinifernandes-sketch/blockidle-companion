import{useNavigation}from'./navigation';
import{useActions,LocalRefresh}from'./actions';
import {parseStateInput} from '../core/importState';
import {ActionStatus} from './actions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowUpRight, Blocks, Boxes, ChevronRight, Download, FlaskConical, History as HistoryIcon, LayoutDashboard, Menu, Package, Pickaxe, RefreshCw, Settings as SettingsIcon, ShieldCheck, Sparkles, UserRound, Workflow, X } from 'lucide-react';
import { useStore } from './store';
import { hasChrome } from '../db/preferences';
import { normalize } from '../core/normalizer';
import { readActiveState } from '../api/client';
import { demoState } from '../tests/demo';
import { addSnapshot } from '../db/snapshots';
import { checkWiki } from '../catalog/wikiCatalog';
import { Dashboard, Character, Progress } from './pages/Dashboard';
import { Terminal } from './pages/Terminal';
import { Groups } from './pages/Groups';
import { Crafts } from './pages/Crafts';
import { Automations } from './pages/Automations';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { time } from './components/common';
const pages = [['Visão Geral', LayoutDashboard, 'Um olhar completo para sua ilha.'], ['Terminal', Package, 'Encontre cada recurso. Planeje o próximo destino.'], ['Grupos', Boxes, 'Organize seus armazenamentos do seu jeito.'], ['Automações', Workflow, 'Perfis e políticas para planejar com segurança.'], ['Personagem', UserRound, 'Equipamentos, atributos e companheiros.'], ['Progressão', Activity, 'Acompanhe o que você já conquistou.'], ['Crafts', Pickaxe, 'Transforme seu estoque no próximo objetivo.'], ['Histórico', HistoryIcon, 'Registros locais da sua evolução.'], ['Configurações', SettingsIcon, 'Um Companion do seu jeito.']] as const;
export function App() {
    const { state, prefs, ready, error, initialize, setState, setError } = useStore(), [busy, setBusy] = useState(false), [status, setStatus] = useState('Aguardando conexão'), [mobile, setMobile] = useState(false);
    const file = useRef<HTMLInputElement>(null), lastSnapshot = useRef(0), mode = useRef('none'), connecting = useRef(false);
    const {page,go:setPage}=useNavigation();
    const descriptor = pages.find(p => p[0] === page);
    mode.current = state?.source ?? 'none';
    useEffect(() => { void initialize(); }, [initialize]);
    useEffect(() => { document.documentElement.dataset.theme = prefs.theme; }, [prefs.theme]);
    const connect = useCallback(async (manual = false) => {
        if (connecting.current || useActions.getState().busy)
            return;
        connecting.current = true;
        if (manual)
            setBusy(true);
        try {
            const next = await readActiveState();
            if(!useActions.getState().busy && next.capturedAt>=(useStore.getState().state?.capturedAt??0))setState(next);
            setStatus('Conectado à aba ativa');
            if (manual)
                setError('');
        }
        catch (e) {
            if (mode.current === 'live')
                setState(null);
            setStatus(e instanceof Error ? e.message : 'Aguardando estado');
            if (manual)
                setError(e instanceof Error ? e.message : 'Falha de conexão');
        }
        finally {
            connecting.current = false;
            if (manual)
                setBusy(false);
        }
    }, [setState, setError]);
    useEffect(() => {
        if (!ready || !hasChrome())
            return;
        void connect();
        const timer = setInterval(() => {
            if (mode.current !== 'demo' && mode.current !== 'import')
                void connect();
        }, prefs.captureInterval * 1000);
        const activated = () => {
            if (mode.current === 'live')
                setState(null);
            if (mode.current !== 'demo' && mode.current !== 'import')
                void connect();
        };
        const updated = (_id: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            if (tab.active && (change.url || change.status === 'loading'))
                activated();
        };
        chrome.tabs.onActivated.addListener(activated);
        chrome.tabs.onUpdated.addListener(updated);
        return () => { clearInterval(timer); chrome.tabs.onActivated.removeListener(activated); chrome.tabs.onUpdated.removeListener(updated); };
    }, [ready, prefs.captureInterval, connect, setState]);
    useEffect(() => {
        if (!ready || !hasChrome())
            return;
        const run = () => {
            let last = 0;
            try {
                last = JSON.parse(localStorage.getItem('blockidle.wiki-check') ?? 'null')?.checkedAt ?? 0;
            }
            catch { }
            if (Date.now() - last > prefs.wikiIntervalHours * 3600000)
                void checkWiki().then(result => localStorage.setItem('blockidle.wiki-check', JSON.stringify(result)));
        };
        run();
        const timer = setInterval(run, 3600000);
        return () => clearInterval(timer);
    }, [ready, prefs.wikiIntervalHours]);
    useEffect(() => {
        if (!prefs.historyEnabled || !state || state.source === 'demo' || Date.now() - lastSnapshot.current < 60000)
            return;
        lastSnapshot.current = Date.now();
        void addSnapshot(state).catch(() => setError('Histórico indisponível. Os dados atuais continuam no painel.'));
    }, [state, prefs.historyEnabled, setError]);
    const navigate = (p: string) => { setPage(p); setMobile(false);void useActions.getState().refresh(); };
    const content = useMemo(() => {
        switch (page) {
            case 'Terminal': return <Terminal />;
            case 'Grupos': return <Groups />;
            case 'Automações': return <Automations />;
            case 'Personagem': return <Character />;
            case 'Progressão': return <Progress />;
            case 'Crafts': return <Crafts />;
            case 'Histórico': return <History />;
            case 'Configurações': return <Settings />;
            default: return <Dashboard navigate={navigate}/>;
        }
    }, [page]);
    if (!ready)
        return <div className="loading">Carregando Companion…</div>;
    return <div className={'app nav-' + prefs.navigation + (mobile ? ' mobile-open' : '')}><aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('Visão Geral'); }}><span className="brand-icon"><Blocks size={23}/></span><span>BLOCKIDLE<small>COMPANION</small></span></a><span className="sidebar-label">SEU ESPAÇO DE JOGO</span><nav aria-label="Navegação principal">{pages.map(([label, Icon]) => <button key={label} title={label} aria-label={label} aria-current={page === label ? 'page' : undefined} className={page === label ? 'current' : ''} onClick={() => navigate(label)}><Icon size={18}/><span>{label}</span>{page === label && <ChevronRight size={13} className="nav-chevron"/>}</button>)}</nav><div className="sidebar-bottom"><span className="mode"><ShieldCheck size={16}/>Ações manuais</span><p>Feito para acompanhar<br />o seu próximo passo.</p><small>v0.3.0 · Chrome / Edge</small></div></aside><main><header className="topbar"><div className="breadcrumb"><button className="mobile-toggle icon-button" aria-label="Abrir navegação" onClick={() => setMobile(!mobile)}><Menu size={19}/></button><span>Companion</span><ChevronRight size={13}/><b>{page}</b></div><span className={'connection ' + (state?.source === 'live' ? 'online' : '')}><i />{state?.source === 'live' ? 'Aba conectada' : state?.source === 'demo' ? 'Demonstração' : state?.source === 'import' ? 'Arquivo importado' : 'Desconectado'}</span></header><div className="workspace" onClickCapture={()=>{setTimeout(()=>void useActions.getState().refresh(),0);}}><div className="page-heading"><div><span className="eyebrow">BLOCKIDLE COMPANION</span><h1>{page}</h1><p>{descriptor?.[2]}</p></div><div className="button-row"><button onClick={() => file.current?.click()}><Download size={15}/>Importar JSON</button><button className="primary" disabled={busy} onClick={() => void connect(true)}><RefreshCw size={15} className={busy ? 'spin' : ''}/>{busy ? 'Conectando…' : state?.source === 'live' ? 'Atualizar leitura' : 'Conectar jogo'}</button></div></div>
 {error && <div className="error-banner" role="alert"><span>{error}</span><button className="icon-button" aria-label="Fechar erro" onClick={() => setError('')}><X size={16}/></button></div>}
 {state?.source === 'demo' && <div className="demo-banner"><FlaskConical size={17}/><span>Dados fictícios para explorar a interface. Nenhuma conexão com a sua conta.</span><button onClick={() => { setState(null); setStatus('Demonstração encerrada'); }}>Sair da demonstração</button></div>}
 {state?.source === 'live' && Date.now() - state.capturedAt > 120000 && <div className="notice">Este retrato tem mais de 2 minutos. Volte à aba do jogo e aguarde uma nova resposta de estado para atualizar os dados.</div>}
 {state?.source === 'import' && <div className="notice">Estado importado: este arquivo não recebe atualizações da aba. Use “Conectar jogo” para voltar aos dados ao vivo.</div>}
 {!state && <div className="connect-banner"><div><Sparkles size={23}/><div><strong>Bem-vindo ao seu Companion</strong><p>Abra o Blockidle nesta janela, conecte e aguarde a próxima atualização do jogo.</p></div></div><button onClick={() => { setState(normalize(demoState, 'demo')); setStatus('Explorando demonstração'); setError(''); }}>Explorar demonstração <ArrowUpRight size={16}/></button></div>}
 <ActionStatus/>{content}<LocalRefresh/><footer><span><ShieldCheck size={13}/>Consulta e ações supervisionadas</span><span>{state ? 'Capturado em ' + time(state.capturedAt) : status}</span></footer></div></main><input ref={file} type="file" hidden accept=".json,application/json" onChange={async (e) => {
            try {
                const f = e.target.files?.[0];
                if (!f)
                    return;
                if (f.size > 8000000)
                    throw new Error('O arquivo deve ter até 8 MB.');
                const next = parseStateInput(JSON.parse(await f.text()));
                setState(next);
                setStatus('Estado importado');
                setError('');
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'JSON inválido.');
            }
            finally {
                e.target.value = '';
            }
        }}/></div>;
}
