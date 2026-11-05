import {useEffect,useRef,useState} from 'react';
import {suggestSets,type LearnedDrops} from '../../core/learnedDrops';
import {objectivePlan} from '../../core/objectives';
import {useBazaar} from '../bazaar';
import {itemName} from '../../catalog/itemCatalog';
import {hasChrome} from '../../db/preferences';
import {create} from 'zustand';
import {MapPin,Play,X} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {Card} from './common';
import {areaName,areaPlan,emptyRule,gameAreas,ruleIsEmpty,type AreaStep} from '../../core/areaRules';
import {listKinds,listLabels} from '../../core/nativeLists';
import {supportsCommandBuild} from '../../core/versionMonitor';
import type {AreaRule} from '../../core/types';

const STEP_GAP_MS=1000;
interface Run{running:boolean;dismissed?:string;note?:string;set:(v:Partial<Run>)=>void}
const useRun=create<Run>(set=>({running:false,set:v=>set(v)}));
const fingerprint=(area:string|undefined,steps:AreaStep[])=>area+'|'+JSON.stringify(steps.map(s=>s.command));

/** Aplica os passos um por vez, no máximo um pedido de ação por segundo, parando no primeiro erro. */
async function runSteps(steps:AreaStep[]){
 const run=useRun.getState();if(run.running)return;run.set({running:true,note:undefined});
 try{for(const [i,step] of steps.entries()){if(i)await new Promise(r=>setTimeout(r,STEP_GAP_MS));const result=await useActions.getState().perform(step.command);if(!result.ok){useRun.getState().set({note:'Parou em “'+step.label+'”: '+(result.error??'sem confirmação')});return;}}
  useRun.getState().set({note:'Regra da área aplicada.'});try{if(typeof chrome!=='undefined'&&chrome.runtime?.id)void chrome.runtime.sendMessage({type:'COMPANION_NOTIFY_AREA',message:steps.map(s=>s.label).join(' · ')});}catch{/* sem extensão */}}
 finally{useRun.getState().set({running:false});}
}
/** Observa a troca de área. No modo automático, aplica a regra; no modo sugerir, o aviso aparece sozinho. */
export function useAreaRules(){
 const state=useStore(s=>s.state),prefs=useStore(s=>s.prefs),previous=useRef<string|undefined>(undefined);
 useEffect(()=>{
  if(state?.source!=='live')return;
  const area=state.area,before=previous.current;previous.current=area;
  if(before===undefined||before===area||prefs.areaMode!=='auto')return;
  const {steps}=areaPlan(state,prefs),actions=useActions.getState();
  if(!steps.length||actions.busy||(actions.lockedScope&&actions.lockedScope===state.scope))return;
  if(steps.some(s=>!supportsCommandBuild(state.build,s.command.kind,state)))return;
  void runSteps(steps);
 },[state,prefs]);
}
export function AreaRuleBanner(){
 const state=useStore(s=>s.state),prefs=useStore(s=>s.prefs),{busy}=useActions(),{running,dismissed,note,set}=useRun();
 if(state?.source!=='live')return note?<div className="notice">{note}</div>:null;
 const {area,steps,missing}=areaPlan(state,prefs),key=fingerprint(area,steps);
 const blocked=steps.some(s=>!supportsCommandBuild(state.build,s.command.kind,state));
 if(!steps.length||dismissed===key)return note?<div className="notice area-banner"><span>{note}</span><button className="icon-button" aria-label="Fechar aviso" onClick={()=>set({note:undefined})}><X size={14}/></button></div>:null;
 return <div className="notice area-banner" role="status"><MapPin size={16}/><div><strong>Regra de {areaName(area)}</strong><span>{steps.map(s=>s.label).join(' · ')}</span>{missing.length>0&&<small className="warning-text">Sem conjunto: {missing.join(', ')}</small>}{blocked&&<small className="warning-text">Build atual não validado para estas ações.</small>}</div>
  <div className="button-row"><button className="primary" disabled={busy||running||blocked} onClick={()=>void runSteps(steps)}><Play size={14}/>{running?'Aplicando…':'Aplicar regra'}</button><button onClick={()=>set({dismissed:key})}>Agora não</button></div></div>;
}
const triState=(v:boolean|null)=>v===null?'':v?'on':'off';
export function AreaRulesCard(){
 const {state,prefs,patch}=useStore(),current=state?.area,bazaar=useBazaar();
 const [learned,setLearned]=useState<LearnedDrops>({}),[suggest,setSuggest]=useState<string|null>(null);
 useEffect(()=>{if(!hasChrome())return;void chrome.storage.local.get('blockidle.drops.v1').then(r=>setLearned(r['blockidle.drops.v1']??{}));},[suggest]);
 const wardrobeSlots=Math.max(4,...Object.keys(state?.character.guardaComp&&typeof state.character.guardaComp==='object'?state.character.guardaComp as object:{}).map(k=>Number(k)+1).filter(Number.isFinite));
 const update=(area:string,change:Partial<AreaRule>)=>{const next={...(prefs.areaRules[area]??emptyRule()),...change};const rules={...prefs.areaRules};if(ruleIsEmpty(next))delete rules[area];else rules[area]=next;patch({areaRules:rules});};
 return <Card icon={<MapPin size={16}/>} title="Regras por área">
  <p className="muted">Escolha, para cada área, qual quadrado da grade vale em cada lista. Ao chegar na área, a extensão sugere aplicar o que estiver diferente no jogo. No modo automático, aplica sozinha com o painel aberto, um pedido por vez, e para no primeiro erro. “—” deixa a lista como está. Com um conjunto do guarda-roupa, a extensão grava as listas do Compactador e do Apagador nele e liga a troca automática do jogo nesta área: daí em diante o próprio jogo troca, mesmo com a extensão fechada (a Auto-venda não faz parte do conjunto).</p>
  <div className="toolbar"><label className="checkbox-label">Modo<select aria-label="Modo das regras por área" value={prefs.areaMode} onChange={e=>patch({areaMode:e.target.value as 'suggest'|'auto'})}><option value="suggest">Sugerir (pede confirmação)</option><option value="auto">Automático ao mudar de área</option></select></label><label>Nunca apagar/vender acima de (ouro no Bazar)<input type="number" min={0} aria-label="Limite de valor no Bazar" placeholder="sem limite" value={prefs.valueGuard??''} onChange={e=>patch({valueGuard:e.target.value===''?null:Math.max(0,Number(e.target.value)||0)})}/></label>{prefs.areaMode==='auto'&&<small className="warning-text">O apagador descarta itens de forma definitiva. Revise os conjuntos ligados às áreas.</small>}</div>
  {suggest&&(()=>{const sug=suggestSets(suggest,state,prefs,learned,bazaar.prices,state?objectivePlan(state,prefs).claims:{});const kinds=[['compactor','Compactador',sug.compactor],['eraser','Apagador',sug.eraser],['autosell','Auto-venda',sug.autosell]] as const;
   const create=()=>{const presets={...prefs.filterPresets},rule={...(prefs.areaRules[suggest]??emptyRule())};for(const [k,,ids] of kinds){if(!ids.length)continue;const free=presets[k].findIndex(p=>!p);if(free<0)continue;presets[k]=presets[k].map((p,i)=>i===free?{name:areaName(suggest).slice(0,40),itemIds:[...ids]}:p);rule[k]=free;}patch({filterPresets:presets,areaRules:{...prefs.areaRules,[suggest]:rule}});setSuggest(null);};
   return <div className="preset-detail"><div className="preset-detail-head"><div><h3>Sugestão para {areaName(suggest)}</h3><small className="muted">{sug.seen.length} itens vistos jogando nesta área · mais os drops publicados na wiki{bazaar.prices?'':' · consulte o Bazar para aplicar o limite de valor'}</small></div><button onClick={()=>setSuggest(null)}>Fechar</button></div>
    {kinds.map(([k,label,ids])=><p key={k}><strong>{label}:</strong> {ids.length?ids.map(itemName).join(', '):'nada sugerido'}</p>)}
    <p className="muted">Itens com versão encantada vão para o Compactador; sementes e itens comuns baratos para o Apagador; o resto vendável para a Auto-venda. Protegidos, de objetivos e acima do limite ficam de fora. Revise antes de usar: o Apagador descarta para sempre.</p>
    <div className="button-row"><button className="primary" disabled={kinds.every(([,,ids])=>!ids.length)} onClick={create}>Criar conjuntos e ligar nesta área</button></div></div>;})()}
  <div className="area-rules" role="table" aria-label="Regras por área">
   <div className="area-rule head" role="row"><span role="columnheader">Área</span>{listKinds.map(k=><span role="columnheader" key={k}>{listLabels[k].name}</span>)}<span role="columnheader">Vender ao chegar</span><span role="columnheader">Vender tudo</span><span role="columnheader">Guarda-roupa</span></div>
   {gameAreas.map(([id,name])=>{const rule=prefs.areaRules[id]??emptyRule();return <div className={'area-rule'+(id===current?' current':'')} role="row" key={id}>
    <span role="cell"><strong>{name}</strong>{id===current&&<small className="badge">aqui</small>}<button className="text-button" aria-label={'Sugerir pelos drops: '+name} onClick={()=>setSuggest(id)}>Sugerir{learned[id]?' ('+Object.keys(learned[id]).length+')':''}</button></span>
    {listKinds.map(k=><span role="cell" key={k}><select aria-label={listLabels[k].name+' em '+name} value={rule[k]??''} onChange={e=>update(id,{[k]:e.target.value===''?null:Number(e.target.value)})}><option value="">—</option>{prefs.filterPresets[k].map((p,i)=><option key={i} value={i} disabled={!p}>{i+1} · {p?.name??'vazio'}</option>)}</select></span>)}
    {(['autoJa','autoTudo'] as const).map(key=><span role="cell" key={key}><select aria-label={(key==='autoJa'?'Vender ao chegar':'Vender tudo')+' em '+name} value={triState(rule[key])} onChange={e=>update(id,{[key]:e.target.value===''?null:e.target.value==='on'})}><option value="">—</option><option value="on">Ligar</option><option value="off">Desligar</option></select></span>)}
    <span role="cell"><select aria-label={'Conjunto do guarda-roupa em '+name} value={rule.wardrobe??''} onChange={e=>update(id,{wardrobe:e.target.value===''?null:Number(e.target.value)})}><option value="">—</option>{Array.from({length:wardrobeSlots},(_,i)=><option key={i} value={i}>Conjunto {i+1}</option>)}</select></span>
   </div>;})}
  </div>
 </Card>;
}
