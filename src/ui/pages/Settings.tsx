import{ForgeNotificationSettings}from'../components/ForgeNotificationSettings';
import{Updater}from'../../update/Updater';
import { missingTextures } from '../components/common';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { parseBackup, hasChrome } from '../../db/preferences';
import { catalogMeta } from '../../catalog/itemCatalog';
import { catalogFingerprint, checkWiki, type WikiCheck } from '../../catalog/wikiCatalog';
import { compatibility, observedBuild } from '../../core/versionMonitor';
import { diagnostics, downloadJson } from '../../inspector/diagnostics';
import { Card, time } from '../components/common';
export function Settings() {
    const { state, prefs, patch, setError } = useStore(), file = useRef<HTMLInputElement>(null), [fingerprint, setFingerprint] = useState(''), [check, setCheck] = useState<WikiCheck | null>(null), [busy, setBusy] = useState(false);
    useEffect(() => {
        void catalogFingerprint().then(setFingerprint);
        try {
            setCheck(JSON.parse(localStorage.getItem('blockidle.wiki-check') ?? 'null'));
        }
        catch { }
    }, []);
    const verify = async () => { setBusy(true); const next = await checkWiki(); setCheck(next); localStorage.setItem('blockidle.wiki-check', JSON.stringify(next)); setBusy(false); };
    return <><Updater/><Card title="Aparência e navegação"><div className="form-grid"><label>Tema<select aria-label="Tema" value={prefs.theme} onChange={e => patch({ theme: e.target.value as typeof prefs.theme })}><option value="dark">Escuro</option><option value="light">Claro</option><option value="system">Seguir o sistema</option></select></label><label>Navegação<select aria-label="Navegação" value={prefs.navigation} onChange={e => patch({ navigation: e.target.value as typeof prefs.navigation })}><option value="sidebar">Menu lateral</option><option value="tabs">Abas horizontais</option><option value="compact">Compacta</option></select></label><label>Leitura do cache local (segundos)<input type="number" min={15} max={600} value={prefs.captureInterval} onChange={e => patch({ captureInterval: Math.max(15, Math.min(600, Math.round(Number(e.target.value) || 30))) })}/></label><label>Verificar data da wiki a cada (horas)<input type="number" min={6} max={720} value={prefs.wikiIntervalHours} onChange={e => patch({ wikiIntervalHours: Math.max(6, Math.min(720, Math.round(Number(e.target.value) || 24))) })}/></label><label className="checkbox-label"><input type="checkbox" checked={prefs.historyEnabled} onChange={e => patch({ historyEnabled: e.target.checked })}/>Snapshots automáticos durante uso do painel</label></div><p className="muted">A leitura do cache não faz requisições ao jogo. O observador acompanha apenas respostas recebidas pela aba ativa.</p></Card>
 <Card title="Compatibilidade"><dl className="data-tree"><div><dt>Extensão</dt><dd>0.4.0 · {hasChrome() ? 'Instalada' : 'Prévia no navegador'}</dd></div><div><dt>Build no documento</dt><dd>{observedBuild}</dd></div><div><dt>Build detectado</dt><dd>{state?.build ?? 'Não disponível'}</dd></div><div><dt>Wiki gerada em</dt><dd>{catalogMeta.wikiSourceDate}</dd></div><div><dt>Catálogo coletado em</dt><dd>{catalogMeta.wikiCollectedAt}</dd></div><div><dt>Versão do catálogo</dt><dd>{catalogMeta.catalogVersion}</dd></div></dl><p>{compatibility(state?.build)}</p><p className="muted">{catalogMeta.validationStatus}</p><details><summary>Impressão digital do catálogo</summary><code className="fingerprint">{fingerprint}</code></details><div className="button-row"><button disabled={busy} onClick={() => void verify()}>{busy ? 'Consultando…' : 'Verificar data da wiki'}</button><a href="https://blockidle.io/wiki/" target="_blank" rel="noreferrer">Abrir wiki</a></div>{check && <p className={check.error || check.changed ? 'warning-text' : 'muted'}>{time(check.checkedAt)} · {check.error ?? (check.changed ? 'Há uma nova data-base. Revise o catálogo antes de atualizar.' : 'A data-base da wiki coincide com o catálogo. O conteúdo completo ainda não foi comparado.')}</p>}<p className="muted">Esta versão verifica a data publicada. Atualização e comparação completa de itens e receitas exigem nova coleta validada.</p></Card>
 <Card title="Avisos e objetivos"><ForgeNotificationSettings/><label className="checkbox-label"><input type="checkbox" aria-label="Avisar novas versões ao abrir" checked={prefs.updateAlerts} onChange={e=>patch({updateAlerts:e.target.checked})}/>Avisar novas versões ao abrir o painel</label><label className="checkbox-label"><input type="checkbox" checked={prefs.preserveGoalMaterials} onChange={e=>patch({preserveGoalMaterials:e.target.checked})}/>Preservar materiais dos objetivos nas ações do painel</label></Card><Card title="Backup e Inspector"><p className="muted">Grupos, apelidos, perfis e preferências ficam neste navegador. O backup não inclui autenticação nem snapshots.</p><div className="button-row"><button onClick={() => downloadJson('blockidle-backup.json', { format: 'blockidle-companion-preferences', version: 1, preferences: prefs })}>Exportar backup</button><button onClick={() => file.current?.click()}>Restaurar backup</button><button onClick={() => downloadJson('blockidle-diagnostico.json', { report: diagnostics(state), missingTextures: [...missingTextures] })}>Exportar diagnóstico</button></div><input ref={file} type="file" accept=".json,application/json" hidden onChange={async (e) => {
            try {
                const f = e.target.files?.[0];
                if (!f)
                    return;
                if (f.size > 2000000)
                    throw new Error('Backup maior que 2 MB.');
                patch(parseBackup(await f.text()));
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Backup inválido.');
            }
            finally {
                e.target.value = '';
            }
        }}/><p className="notice">Ações manuais: filtros do compactador, depósito/retirada e transformações confirmadas. Vendas, descarte e organização automática continuam desativados. O jogo usa blockidle.io; o atualizador consulta apenas o repositório público do Companion no GitHub.</p></Card></>;
}
