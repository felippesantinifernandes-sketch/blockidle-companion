import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
class Boundary extends React.Component<{
    children: React.ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <main className="empty"><h1>Não foi possível exibir o painel</h1><p>Reabra o Companion. Seus grupos e preferências continuam salvos localmente.</p><button onClick={() => location.reload()}>Reabrir painel</button></main> : this.props.children; }
}
createRoot(document.getElementById('root')!).render(<Boundary><App /></Boundary>);
