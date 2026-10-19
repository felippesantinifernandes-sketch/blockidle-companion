import {create} from 'zustand';
import {hasChrome} from '../db/preferences';
import {checkRelease,newer,type Release} from './packageManager';
const key='blockidle.update-check.v1';let pending:Promise<Release|undefined>|undefined;
export async function latestRelease(force=false):Promise<Release|undefined>{
 if(pending)return pending;
 pending=(async()=>{if(hasChrome()&&!force){const cached=(await chrome.storage.local.get(key))[key];if(cached&&typeof cached.at==='number'&&Date.now()-cached.at<6*3600000)return cached.release??undefined;}
 const release=await checkRelease();if(hasChrome())await chrome.storage.local.set({[key]:{at:Date.now(),release:release??null}});return release;
 })();try{return await pending;}finally{pending=undefined;}
}
export const useUpdates=create<{release?:Release;error?:string;check:()=>Promise<void>}>(set=>({check:async()=>{try{set({release:await latestRelease(),error:undefined});}catch{set({error:'Não foi possível verificar novas versões agora.'});}}}));
export const hasNewRelease=(release:Release|undefined,current:string)=>{try{return !!release&&newer(release.version,current);}catch{return false;}};
