import {chromium} from 'playwright';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.resolve('../../work/qa-v040');await mkdir(out,{recursive:true});
const ext=path.join(out,'notification-extension'),profile=path.join(out,'notification-profile-'+Date.now());await cp('dist',ext,{recursive:true});
// The OS permission prompt is not automated. This fixture pregrants the two optional APIs.
const manifest=JSON.parse(await readFile(path.join(ext,'manifest.json'),'utf8'));manifest.permissions.push(...manifest.optional_permissions);delete manifest.optional_permissions;await writeFile(path.join(ext,'manifest.json'),JSON.stringify(manifest));
const launch=()=>chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+ext,'--load-extension='+ext],viewport:{width:1200,height:900}});
const state={inventario:{},forja:[],anas:{feitas:30,perks:{forja:20}},guardado:{}};
const until=async(label,read,predicate,timeout=40000)=>{const end=Date.now()+timeout;let value;while(Date.now()<end){value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,200));}throw Error(label+': '+JSON.stringify(value));};
const checks=[],record=s=>{checks.push(s);console.log('OK '+s);};let ctx=await launch(),page,posts=0;
try{
 await ctx.route('https://blockidle.io/**',async route=>{if(route.request().method()==='POST'){posts++;throw Error('Este teste não pode executar operações no jogo.');}const u=new URL(route.request().url());return u.pathname==='/api/estado'?route.fulfill({json:{versao:'ef3c8efa9f',estado:state}}):route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><h1>Fila fictícia</h1><script>fetch('/api/estado').then(r=>r.json()).then(r=>{window.__hudRef={estado:r.estado,aplicar(s){this.estado=s}};window.__ready=true;});</script></body></html>`});});
 await ctx.route('https://api.github.com/**',r=>r.fulfill({status:404,json:{}}));
 let worker=ctx.serviceWorkers()[0]??await ctx.waitForEvent('serviceworker'),id=new URL(worker.url()).host;
 const game=await ctx.newPage();await game.goto('https://blockidle.io/play');await game.waitForFunction(()=>window.__ready);
 page=await ctx.newPage();await page.goto('chrome-extension://'+id+'/index.html');await game.bringToFront();await page.getByRole('button',{name:/^(Conectar jogo|Atualizar leitura)$/}).click();await page.getByText('Aba conectada',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Crafts',exact:true}).click();await page.getByRole('tab',{name:'Forja',exact:true}).click();await page.getByLabel('Avisar quando a forja terminar',{exact:true}).check();
 await until('preferência de aviso',()=>worker.evaluate(async()=>(await chrome.storage.local.get('blockidle.preferences.v1'))['blockidle.preferences.v1']),p=>p?.forgeNotifications);
 assert.equal(await worker.evaluate(()=>chrome.permissions.contains({permissions:['alarms','notifications']})),true);record('Controle da forja ativa a preferência com APIs pré-autorizadas no manifesto de teste');
 const sync=async()=>{await game.evaluate(s=>window.__hudRef.aplicar(s),state);await page.getByRole('button',{name:/^(Conectar jogo|Atualizar leitura)$/}).click();};
 state.forja=[{id:'refined_mithril',fim:Date.now()+15000}];await sync();
 await until('alarme pendente',()=>worker.evaluate(()=>chrome.alarms.getAll()),a=>a.some(x=>x.name.startsWith('blockidle.forge.')));
 const alarms=await worker.evaluate(()=>chrome.alarms.getAll());assert.equal(alarms.length,1);assert.equal(alarms[0].scheduledTime,state.forja[0].fim);record('Chrome agenda um alarme real com o prazo recebido da forja');
 await until('entrega do aviso',()=>worker.evaluate(async()=>(await chrome.storage.local.get('blockidle.forge-alerts.v1'))['blockidle.forge-alerts.v1']),a=>a?.some(r=>r.delivered));
 const readDelivered=()=>worker.evaluate(async()=>(await chrome.storage.local.get('blockidle.forge-alerts.v1'))['blockidle.forge-alerts.v1']);const initialDelivery=(await readDelivered()).find(r=>r.delivered);assert(initialDelivery.deliveredAt>=state.forja[0].fim);assert.equal(initialDelivery.error,undefined);record('Alarme dispara e a API de notificações aceita o aviso, sem coletar itens');
 await sync();await sync();const delivered=await readDelivered();assert.equal(delivered.filter(r=>r.delivered).length,1);assert.equal(delivered.find(r=>r.delivered).deliveredAt,initialDelivery.deliveredAt);record('Leituras repetidas não duplicam um aviso já entregue');
 state.forja=[{id:'refined_titanium',fim:Date.now()+300000}];await sync();await until('um alarme',()=>worker.evaluate(()=>chrome.alarms.getAll()),a=>a.length===1);state.forja=[];await sync();await until('nenhum alarme',()=>worker.evaluate(()=>chrome.alarms.getAll()),a=>a.length===0);record('Uma fila atualizada cancela o alarme de uma tarefa removida');
 state.forja=[{id:'golden_plate',fim:Date.now()+300000}];await sync();await until('um alarme',()=>worker.evaluate(()=>chrome.alarms.getAll()),a=>a.length===1);await page.getByLabel('Avisar quando a forja terminar',{exact:true}).uncheck();await until('nenhum alarme',()=>worker.evaluate(()=>chrome.alarms.getAll()),a=>a.length===0);record('Desativar os avisos limpa os alarmes pendentes');
 await page.getByLabel('Avisar quando a forja terminar',{exact:true}).check();state.forja=[{id:'refined_mithril',fim:Date.now()+20000}];await sync();await until('prazo pendente salvo',()=>worker.evaluate(async()=>(await chrome.storage.local.get('blockidle.forge-alerts.v1'))['blockidle.forge-alerts.v1']),a=>a?.some(r=>r.finish<Date.now()+22000&&!r.delivered));
 await ctx.close();ctx=await launch();worker=ctx.serviceWorkers()[0]??await ctx.waitForEvent('serviceworker');id=new URL(worker.url()).host;page=await ctx.newPage();await ctx.route('https://api.github.com/**',r=>r.fulfill({status:404,json:{}}));await page.goto('chrome-extension://'+id+'/updater.html');
 await until('entrega após reinício',()=>worker.evaluate(async()=>(await chrome.storage.local.get('blockidle.forge-alerts.v1'))['blockidle.forge-alerts.v1']),a=>a?.some(r=>r.finish<Date.now()+22000&&r.finish>Date.now()-30000&&r.delivered));record('Prazo salvo é restaurado e avisado depois de reiniciar o navegador de teste');
 assert.equal(posts,0);record('Avisos de forja funcionam sem qualquer requisição POST ao jogo');
 await writeFile(path.join(out,'forge-alerts-results.json'),JSON.stringify({passed:true,checks,permissionPrompt:'Não automatizado; APIs pré-autorizadas no manifesto de teste.',notificationVisibility:'Retorno da API conferido; exibição visual pelo Windows não observada.'},null,2));console.log(checks.length+' verificações de avisos da forja aprovadas.');
}catch(e){if(page&&!page.isClosed())await writeFile(path.join(out,'forge-alerts-failure.txt'),await page.locator('body').innerText()).catch(()=>{});throw e;}finally{await ctx.close();}
