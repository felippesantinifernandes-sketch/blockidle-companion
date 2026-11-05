import {useEffect,useState} from 'react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {hasChrome} from '../../db/preferences';
import {notifyLabels,type NotifyKind} from '../../core/notifications';
export function NotificationSettings(){
 const {prefs,patch}=useStore(),[granted,setGranted]=useState(false);
 useEffect(()=>{if(!hasChrome())return;void chrome.permissions.contains({permissions:['alarms','notifications']}).then(setGranted);},[]);
 const enable=async(on:boolean)=>{if(on&&hasChrome()&&!granted){const ok=await chrome.permissions.request({permissions:['alarms','notifications']});setGranted(ok);if(!ok){useActions.getState().notify('Permissão de notificações não concedida.',false);return;}}patch({notify:{...prefs.notify,enabled:on}});};
 const sync=async(on:boolean)=>{if(on&&hasChrome()){const ok=await chrome.permissions.request({permissions:['alarms']});if(!ok){useActions.getState().notify('Permissão de alarmes não concedida.',false);return;}}patch({backgroundSync:on});};
 return <div className="notify-settings"><label className="checkbox-label"><input type="checkbox" aria-label="Sincronizar em segundo plano" checked={prefs.backgroundSync} disabled={!hasChrome()} onChange={e=>void sync(e.target.checked)}/>Sincronizar a cada 5 minutos com o painel fechado (só leitura)</label><label className="checkbox-label"><input type="checkbox" aria-label="Ativar notificações do jogo" checked={prefs.notify.enabled&&granted} disabled={!hasChrome()} onChange={e=>void enable(e.target.checked)}/>Notificações do jogo</label>
  <div className="notify-list">{(Object.keys(notifyLabels) as NotifyKind[]).map(k=><label key={k} className="checkbox-label"><input type="checkbox" checked={prefs.notify[k]} disabled={!prefs.notify.enabled} onChange={e=>patch({notify:{...prefs.notify,[k]:e.target.checked}})}/>{notifyLabels[k]}</label>)}</div>
  <p className="muted">Avisos de estado chegam com a aba do jogo aberta (a extensão lê as respostas que o próprio jogo recebe). Dragão é por horário. Leilão e Bazar fazem uma leitura pela aba aos :40 e a cada 5 minutos.</p></div>;
}
