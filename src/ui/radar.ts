import {create} from 'zustand';
import {hasChrome} from '../db/preferences';
import {buildSnapshot,compareSnapshots,datedComments,moduleImports,sha256,shortHash,type CatalogKeys,type RadarReport,type RadarSnapshot} from '../core/radar';
const KEY='blockidle.radar.v1';
interface Stored{snapshot?:RadarSnapshot;report?:RadarReport;discord?:string;priority?:string}
const read=async():Promise<Stored>=>{try{if(hasChrome())return (await chrome.storage.local.get(KEY))[KEY]??{};return JSON.parse(localStorage.getItem(KEY)??'{}');}catch{return {};}};
const write=async(v:Stored)=>{if(hasChrome())await chrome.storage.local.set({[KEY]:v});else localStorage.setItem(KEY,JSON.stringify(v));};
/** Segue os imports a partir de /js/main.js, em lotes de 4 com pausa, só lendo o texto (nada é executado). */
export async function crawl(fetchText:(path:string)=>Promise<string>,onProgress?:(n:number)=>void){
 const files:Record<string,string>={},queue=['main.js'],seen=new Set(queue);
 while(queue.length){const batch=queue.splice(0,4);const texts=await Promise.all(batch.map(f=>fetchText(f).catch(()=>'')));
  batch.forEach((f,i)=>{if(!texts[i])return;files[f]=texts[i];for(const dep of moduleImports(texts[i],f))if(!seen.has(dep)&&seen.size<250){seen.add(dep);queue.push(dep);}});
  onProgress?.(Object.keys(files).length);if(queue.length)await new Promise(r=>setTimeout(r,500));}
 return files;
}
interface Radar extends Stored{running:boolean;progress:number;error?:string;loaded:boolean;load:()=>Promise<void>;run:(build:string|undefined)=>Promise<void>;setText:(v:{discord?:string;priority?:string})=>void}
export const useRadar=create<Radar>((set,get)=>({running:false,progress:0,loaded:false,
 load:async()=>{if(get().loaded)return;set({...(await read()),loaded:true});},
 setText:v=>{set(v);const {snapshot,report,discord,priority}={...get(),...v};void write({snapshot,report,discord,priority});},
 run:async build=>{if(get().running)return;set({running:true,progress:0,error:undefined});try{
  await get().load();
  const files=await crawl(async f=>{const r=await fetch('https://blockidle.io/js/'+f,{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error(String(r.status));return r.text();},n=>set({progress:n}));
  if(!files['main.js'])throw Error('Não foi possível baixar /js/main.js.');
  const hashes:Record<string,string>={},comments:Record<string,string[]>={};
  for(const [f,t] of Object.entries(files)){hashes[f]=await sha256(t);comments[f]=await Promise.all(datedComments(t).map(shortHash));}
  let catalog:CatalogKeys|undefined;try{if(hasChrome()){const r=await chrome.runtime.sendMessage({type:'COMPANION_CATALOG_KEYS'});if(r?.ok)catalog=r.catalog;}}catch{/* sem aba do jogo: compara só os arquivos */}
  const next=buildSnapshot(build??'desconhecido',files,hashes,comments,catalog),prev=get().snapshot;
  const report=prev?await compareSnapshots(prev,next,files):undefined;
  const changed=!!report&&(report.changedFiles.length||report.addedFiles.length||report.removedFiles.length||report.from!==report.to);
  const stored={snapshot:next,report:changed?report:get().report,discord:get().discord,priority:get().priority};await write(stored);set({...stored});
 }catch(e){set({error:e instanceof Error?e.message:'Falha no radar.'});}finally{set({running:false});}}
}));
