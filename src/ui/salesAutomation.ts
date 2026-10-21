import {useEffect} from 'react';
import {useStore} from './store';
import {useActions} from './actions';
import {salePlan} from '../core/sales';
let lastAttempt=0;
export function useSalesAutomation(){useEffect(()=>{const timer=setInterval(()=>{void(async()=>{
 let {state,prefs}=useStore.getState();const {patch}=useStore.getState(),actions=useActions.getState();
 if(!prefs.sales.enabled||state?.source!=='live'||Date.now()-state.capturedAt>45000||Date.now()-lastAttempt<15000||actions.busy||actions.refreshing||actions.lockedScope)return;
 await actions.refresh();({state,prefs}=useStore.getState());if(!prefs.sales.enabled||state?.source!=='live'||useActions.getState().busy||useActions.getState().lockedScope)return;
 for(const rule of prefs.sales.rules.filter(r=>r.enabled)){const plan=salePlan(state,prefs,rule);if(!plan.command)continue;lastAttempt=Date.now();const result=await actions.perform({...plan.command,automatic:true});if(!result.ok){const latest=useStore.getState().prefs;patch({sales:{...latest.sales,enabled:false}});}break;}
 })();},3000);return()=>clearInterval(timer);},[]);}
