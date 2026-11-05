import {useEffect,useState} from 'react';
import {Copy,Radar as RadarIcon} from 'lucide-react';
import {useStore} from '../store';
import {useActions} from '../actions';
import {Card,time} from '../components/common';
import {useRadar} from '../radar';
import {updatePrompt,type RadarReport} from '../../core/radar';
import {itemName} from '../../catalog/itemCatalog';
const Line=({label,items,map=(x:string)=>x}:{label:string;items:string[];map?:(x:string)=>string})=>items.length?<p><strong>{label}:</strong> {items.slice(0,80).map(map).join(', ')}{items.length>80?' (+'+(items.length-80)+')':''}</p>:null;
export function News(){
 const state=useStore(s=>s.state),radar=useRadar(),{notify}=useActions(),[copied,setCopied]=useState(false);
 useEffect(()=>{void radar.load();},[]);// eslint-disable-line react-hooks/exhaustive-deps
 const build=state?.source==='live'?state.build:undefined;
 useEffect(()=>{if(radar.loaded&&build&&radar.snapshot&&radar.snapshot.build!==build&&!radar.running)void radar.run(build);},[radar.loaded,build,radar.snapshot?.build]);// eslint-disable-line react-hooks/exhaustive-deps
 const r:RadarReport|undefined=radar.report;
 const copy=async()=>{if(!r)return;try{await navigator.clipboard.writeText(updatePrompt(r,radar.discord??'',radar.priority??''));setCopied(true);notify('Prompt copiado.');}catch{notify('Não foi possível copiar.',false);}};
 return <>
  <Card title="Radar de mudanças" action={<button onClick={()=>void radar.run(build)} disabled={radar.running}><RadarIcon size={14}/>{radar.running?'Lendo módulos… '+radar.progress:'Verificar agora'}</button>}>
   <p className="muted">O Blockidle não publica changelog. O radar segue os imports de /js/main.js, guarda o hash de cada módulo e, quando o build muda, compara: arquivos, ações, funções de rede.js, itens, receitas, constantes, campos de estado e os comentários datados (DD/MM) que os desenvolvedores deixam. Roda sozinho quando o painel vê um build novo.</p>
   {radar.error&&<p className="notice warning-text">{radar.error}</p>}
   <p className="muted">{radar.snapshot?'Base: build '+radar.snapshot.build+' · '+Object.keys(radar.snapshot.hashes).length+' módulos · '+time(radar.snapshot.at)+(radar.snapshot.catalog?'':' · sem catálogo (abra o jogo para incluir itens e receitas)'):'Nenhuma base ainda. Clique em Verificar agora com o jogo aberto.'}</p>
  </Card>
  {r?<Card title={'Novidades · '+r.from+' → '+r.to}>
   <p className="muted">Detectado em {time(r.at)}</p>
   <Line label="Arquivos alterados" items={r.changedFiles}/><Line label="Arquivos novos" items={r.addedFiles}/><Line label="Arquivos removidos" items={r.removedFiles}/>
   <Line label="Ações novas" items={r.newActions}/><Line label="Ações removidas" items={r.removedActions}/>
   <Line label="Funções novas em rede.js" items={r.newExports}/><Line label="Funções removidas" items={r.removedExports}/>
   <Line label="Itens novos" items={r.newItems} map={itemName}/><Line label="Itens removidos" items={r.removedItems} map={itemName}/><Line label="Receitas novas" items={r.newRecipes}/><Line label="Novos no Bazar" items={r.newBazaarItems} map={itemName}/>
   <Line label="Campos de estado novos" items={r.newStateKeys}/><Line label="Campos removidos" items={r.removedStateKeys}/><Line label="Constantes" items={r.constants}/>
   {r.comments.length>0&&<details open><summary>Comentários datados novos ({r.comments.length})</summary><ul className="radar-comments">{r.comments.map((c,i)=><li key={i}><code>{c.file}</code> {c.text}</li>)}</ul></details>}
   {!r.changedFiles.length&&!r.addedFiles.length&&!r.removedFiles.length&&<p>Nenhum módulo mudou de conteúdo.</p>}
  </Card>:<Card title="Novidades"><p className="muted">Ainda não há comparação. Ela aparece quando o build muda depois da primeira verificação.</p></Card>}
  <Card title="Prompt de atualização">
   <label>Anúncio do Discord (opcional)<textarea rows={4} value={radar.discord??''} onChange={e=>radar.setText({discord:e.target.value})} placeholder="Cole aqui o anúncio da atualização…"/></label>
   <label>Prioridade<input value={radar.priority??''} onChange={e=>radar.setText({priority:e.target.value})} placeholder="Ex.: manter filtros e craft funcionando"/></label>
   <div className="button-row"><button className="primary" disabled={!r} onClick={()=>void copy()}><Copy size={14}/>{copied?'Copiado':'Copiar prompt de atualização'}</button></div>
   {r&&<details><summary>Ver prompt</summary><pre className="radar-prompt">{updatePrompt(r,radar.discord??'',radar.priority??'')}</pre></details>}
  </Card>
 </>;
}
