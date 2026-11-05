/** Radar de mudanças (B10): compara os módulos públicos do cliente entre dois builds. Guarda só hashes e conjuntos pequenos. */
export interface CatalogKeys{items:string[];recipes:string[];bazaarItems:string[];constants:Record<string,string>;stateKeys:string[]}
export interface RadarSnapshot{build:string;at:number;hashes:Record<string,string>;comments:Record<string,string[]>;actions:string[];exports:string[];catalog?:CatalogKeys}
export interface RadarReport{from:string;to:string;at:number;changedFiles:string[];addedFiles:string[];removedFiles:string[];newActions:string[];removedActions:string[];newExports:string[];removedExports:string[];newItems:string[];removedItems:string[];newRecipes:string[];newBazaarItems:string[];constants:string[];newStateKeys:string[];removedStateKeys:string[];comments:{file:string;text:string}[]}

/** Imports relativos de um módulo, resolvidos a partir da pasta /js/. */
export function moduleImports(source:string,file:string):string[]{
 const dir=file.includes('/')?file.slice(0,file.lastIndexOf('/')+1):'',out=new Set<string>();
 for(const m of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+\.js)['"]/g)){
  const parts=(dir+m[1]).split('/'),stack:string[]=[];for(const p of parts){if(p==='.'||p==='')continue;if(p==='..')stack.pop();else stack.push(p);}
  out.add(stack.join('/'));
 }
 return [...out].sort();
}
/** Comentários datados (DD/MM …) que os desenvolvedores deixam em cada mudança. */
export function datedComments(source:string):string[]{
 const out=new Set<string>();
 for(const m of source.matchAll(/\/\/([^\n]*\(\d{2}\/\d{2}[^\n]*)|\/\*([\s\S]*?\(\d{2}\/\d{2}[\s\S]*?)\*\//g)){const t=(m[1]??m[2]).replace(/\s+/g,' ').trim();if(t)out.add(t.slice(0,280));}
 return [...out];
}
export const actionNames=(source:string)=>[...new Set([...source.matchAll(/acao\s*:\s*['"]([a-z_]+)['"]/g)].map(m=>m[1]))].sort();
export const exportNames=(source:string)=>[...new Set([...source.matchAll(/export\s+(?:async\s+)?(?:const|function|let|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]))].sort();
export async function sha256(text:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
/** Hash curto de um comentário, para guardar o conjunto sem o texto. */
export const shortHash=async(t:string)=>(await sha256(t)).slice(0,16);

export function buildSnapshot(build:string,files:Record<string,string>,hashes:Record<string,string>,commentHashes:Record<string,string[]>,catalog?:CatalogKeys):RadarSnapshot{
 const all=Object.entries(files);
 return {build,at:Date.now(),hashes,comments:commentHashes,actions:[...new Set(all.flatMap(([,s])=>actionNames(s)))].sort(),exports:files['rede.js']?exportNames(files['rede.js']):[],...(catalog?{catalog}:{})};
}
const diff=(a:string[]=[],b:string[]=[])=>{const A=new Set(a),B=new Set(b);return {added:b.filter(x=>!A.has(x)),removed:a.filter(x=>!B.has(x))};};
export async function compareSnapshots(prev:RadarSnapshot,next:RadarSnapshot,files:Record<string,string>):Promise<RadarReport>{
 const names=diff(Object.keys(prev.hashes),Object.keys(next.hashes));
 const changed=Object.keys(next.hashes).filter(f=>prev.hashes[f]&&prev.hashes[f]!==next.hashes[f]).sort();
 const comments:{file:string;text:string}[]=[];
 for(const f of [...changed,...names.added]){const old=new Set(prev.comments[f]??[]);for(const t of datedComments(files[f]??''))if(!old.has(await shortHash(t)))comments.push({file:f,text:t});}
 const acts=diff(prev.actions,next.actions),exps=diff(prev.exports,next.exports),pc=prev.catalog,nc=next.catalog;
 const items=diff(pc?.items,nc?.items),recipes=diff(pc?.recipes,nc?.recipes),bazaar=diff(pc?.bazaarItems,nc?.bazaarItems),keys=diff(pc?.stateKeys,nc?.stateKeys);
 const constants=pc&&nc?Object.keys({...pc.constants,...nc.constants}).filter(k=>pc.constants[k]!==nc.constants[k]).map(k=>k+': '+(pc.constants[k]??'—')+' → '+(nc.constants[k]??'—')):[];
 return {from:prev.build,to:next.build,at:next.at,changedFiles:changed,addedFiles:names.added,removedFiles:names.removed,newActions:acts.added,removedActions:acts.removed,newExports:exps.added,removedExports:exps.removed,newItems:pc?items.added:[],removedItems:pc?items.removed:[],newRecipes:pc?recipes.added:[],newBazaarItems:pc?bazaar.added:[],constants,newStateKeys:pc?keys.added:[],removedStateKeys:pc?keys.removed:[],comments:comments.slice(0,200)};
}
const list=(v:string[],max=60)=>v.length?v.slice(0,max).join(', ')+(v.length>max?' (+'+(v.length-max)+')':''):'nenhum';
/** Modelo de B10 preenchido. */
export function updatePrompt(r:RadarReport,discord:string,priority:string){
 return `Atualize a extensão Blockidle Companion para o build ${r.to} (antes ${r.from}).

Mudanças detectadas no jogo (geradas pelo radar):
- Arquivos alterados: ${list([...r.changedFiles,...r.addedFiles.map(f=>f+' (novo)'),...r.removedFiles.map(f=>f+' (removido)')])}
- Ações novas: ${list(r.newActions)} | removidas: ${list(r.removedActions)}
- Funções novas em rede.js: ${list(r.newExports)} | removidas: ${list(r.removedExports)}
- Campos de estado novos: ${list(r.newStateKeys)} | removidos: ${list(r.removedStateKeys)}
- Itens/receitas novos: ${list([...r.newItems,...r.newRecipes.map(x=>'receita '+x),...r.newBazaarItems.map(x=>'Bazar '+x)])}
- Constantes alteradas: ${list(r.constants,30)}
- Comentários datados novos:
${r.comments.length?r.comments.slice(0,80).map(c=>'  - ['+c.file+'] '+c.text).join('\n'):'  - nenhum'}
- Anúncio colado do Discord: ${discord.trim()||'nenhum'}

Tarefas:
1. Releia os arquivos alterados em https://blockidle.io/js/ (o fonte é público e legível) e confirme o formato de cada ação nova antes de usar.
2. Ajuste tipos, schema e migrações para os campos novos. Não apague preferências salvas do usuário.
3. Rode os testes de contrato (B11) e corrija o que falhar. Se uma ação mudou de formato, desative só a escrita dela e mantenha a leitura.
4. Atualize o CHANGELOG da extensão e o hash/compatibilidade.
5. Não aplique nada em conta real; use respostas simuladas.
Prioridade: ${priority.trim()||'manter tudo funcionando no build novo'}`;
}
