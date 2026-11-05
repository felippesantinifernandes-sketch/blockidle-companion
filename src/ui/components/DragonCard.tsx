import {useEffect,useState} from 'react';
import {CheckCircle2,XCircle,Flame,RefreshCw} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {hasChrome} from '../../db/preferences';
import {dragonReadiness,type DragonInfo} from '../../core/dragon';
import {supportsCommandBuild} from '../../core/versionMonitor';
import {ago} from './StatusBar';
/** Vai ter Dragão e o Steve vai entrar sozinho? Lê o Dragão pela aba do jogo e confere cada regra do Entrar sozinho. */
export function DragonCard({now}:{now:number}){
 const state=useStore(s=>s.state),{busy,perform,lockedScope}=useActions();
 const [info,setInfo]=useState<DragonInfo>(),[eyes,setEyes]=useState<{mine?:number;have?:number}>({}),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const load=async()=>{if(!hasChrome()||state?.source!=='live')return;setLoading(true);setError('');try{const r=await chrome.runtime.sendMessage({type:'COMPANION_DRAGON'});if(!r?.ok)throw Error(r?.error??'Dragão indisponível.');setInfo(r.info);setEyes({mine:r.myEyes,have:r.haveEyes});}catch(e){setError(e instanceof Error?e.message:'Dragão indisponível.');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[state?.source]);// eslint-disable-line react-hooks/exhaustive-deps
 if(!state)return <article className="event-card dragon-card"><small><Flame size={12}/> Dragão do End</small><p className="muted">Conecte ao jogo para conferir se o Steve vai entrar.</p></article>;
 const r=dragonReadiness(state,now,info),auto=(state.character.dragao as {auto?:unknown}|undefined)?.auto;
 const can=state.source==='live'&&supportsCommandBuild(state.build,'dragonAuto',state)&&!busy&&!(lockedScope&&lockedScope===state.scope);
 return <article className={'event-card dragon-card '+(r.willJoin?'ready':'blocked')}>
  <small><Flame size={12}/> Dragão do End{info?.type?' · '+info.type:''}</small>
  <strong>{r.source==='luta'?'Luta em andamento':'Nasce em '+ago(r.next-now)}</strong>
  <span className="muted">{r.source==='invocado'?'invocado no altar':'nascimento natural'} · {new Date(r.next).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}{info?.eyes!==undefined?' · '+info.eyes+'/8 olhos no altar':''}{eyes.have!==undefined?' · você tem '+eyes.have+' olho(s)':''}</span>
  <div className={'dragon-verdict '+(r.willJoin?'ok':'bad')}>{r.willJoin?<><CheckCircle2 size={16}/>O Steve vai entrar sozinho</>:<><XCircle size={16}/>O Steve não vai entrar sozinho</>}</div>
  <ul className="checklist">{r.checks.map(c=><li key={c.label} className={c.ok?'ok':'bad'}>{c.ok?<CheckCircle2 size={14}/>:<XCircle size={14}/>}<span>{c.label}{!c.ok&&c.fix&&<small>{c.fix}</small>}</span></li>)}</ul>
  <div className="button-row"><label className="checkbox-label"><input type="checkbox" aria-label="Entrar sozinho na luta do Dragão" checked={auto===true} disabled={!can} onChange={e=>void perform({kind:'dragonAuto',enabled:e.target.checked})}/>Entrar sozinho</label><button className="text-button" disabled={loading||state.source!=='live'} onClick={()=>void load()}><RefreshCw size={13}/>{loading?'Lendo…':'Atualizar'}</button></div>
  {error&&<small className="warning-text">{error}</small>}
  <small className="muted">O jogo só leva o Steve com o jogo aberto, uma vez por luta. O servidor confere tudo de novo na hora.</small>
 </article>;
}
