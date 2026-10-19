import {useMemo} from 'react';
import {accessoryRecommendations} from '../../core/accessoryRecommendations';
import {itemName} from '../../catalog/itemCatalog';
import {useStore} from '../store';
import {useActions} from '../actions';
import {useNavigation} from '../navigation';
import {Card,ItemIcon,number} from './common';

export function AccessoryRecommendations(){
 const {state,prefs,patch}=useStore(),rows=useMemo(()=>state?accessoryRecommendations(state,prefs):[],[state,prefs]);
 if(!state)return null;
 return <Card title="Próximos acessórios para evoluir"><p>Ordenados por ativação de itens em posse, materiais disponíveis, fontes de craft e ganho efetivo de Poder Mágico. O ganho desconta a versão que já vale na família e considera recombobulação. Não é uma comparação de preços de mercado.</p>{!state.character.accessoryBagKnown&&<p className="notice">Bolsa não informada: os ganhos são estimativas sobre os dados disponíveis.</p>}<div className="recommendations">{rows.slice(0,10).map(a=><article key={a.id} className="recommendation"><ItemIcon id={a.id}/><div><strong>{a.name} · +{number(a.gain)} MP efetivos</strong><p>{a.activate?'Você já possui: coloque na mochila ou bolsa pelo jogo.':a.ready?'Materiais e requisitos conhecidos disponíveis.':!a.recipeId?'Fonte especial: consulte a wiki para drop, loja ou evento.':'Há etapas, materiais ou desbloqueios pendentes.'}</p>{Object.keys(a.missing).length>0&&<small>Faltantes: {Object.entries(a.missing).slice(0,4).map(([id,q])=>number(q)+' '+itemName(id)).join(', ')}{Object.keys(a.missing).length>4?'…':''}</small>}{a.reasons.slice(0,2).map((r,i)=><p className="muted" key={i}>{r}</p>)}</div><div className="button-row"><a href={a.source} target="_blank" rel="noreferrer">Wiki</a>{a.recipeId&&!a.activate&&<><button onClick={()=>useNavigation.getState().openCraft(a.recipeId!)}>Receita</button><button disabled={prefs.objectives.length>=50||prefs.objectives.some(g=>g.enabled&&g.recipeId===a.recipeId)} onClick={()=>{patch({objectives:[...prefs.objectives,{id:crypto.randomUUID(),recipeId:a.recipeId!,quantity:1,enabled:true,choices:{}}]});useActions.getState().notify('Acessório adicionado aos objetivos.');useNavigation.getState().openObjectives();}}>Planejar acessório</button></>}</div></article>)}</div>{!rows.length&&<p className="muted">Não há ganho adicional confirmado no catálogo e no estado disponíveis.</p>}<p className="muted">O Poder Mágico informado pelo servidor continua sendo a referência. Espaço e movimentação da bolsa são conferidos no próprio jogo.</p></Card>;
}
