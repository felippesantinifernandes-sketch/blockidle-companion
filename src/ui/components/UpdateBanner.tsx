import {useEffect,useState} from 'react';
import {useStore} from '../store';
import {hasChrome} from '../../db/preferences';
import {hasNewRelease,useUpdates} from '../../update/updateState';
export function UpdateBanner(){
 const {ready,prefs}=useStore(),{release,check}=useUpdates(),[dismissed,setDismissed]=useState(''),[details,setDetails]=useState(false);
 useEffect(()=>{if(ready&&hasChrome()&&prefs.updateAlerts)void check();},[ready,prefs.updateAlerts,check]);
 if(!prefs.updateAlerts||!hasChrome()||!hasNewRelease(release,chrome.runtime.getManifest().version)||dismissed===release?.version)return null;
 return <div className="notice update-banner" role="status"><div><strong>Nova versão {release!.version} disponível</strong><p>Confira as novidades antes de preparar a atualização.</p></div><div className="button-row"><button onClick={()=>setDetails(v=>!v)}>{details?'Ocultar novidades':'Ver novidades'}</button><button className="primary" onClick={()=>void chrome.tabs.create({url:chrome.runtime.getURL('updater.html')})}>Abrir atualização</button><button onClick={()=>setDismissed(release!.version)}>Lembrar depois</button></div>{details&&<p className="release-notes">{release!.notes||'Consulte os detalhes da versão na central de atualização.'}</p>}</div>;
}
