import {spawn} from 'node:child_process';
for(const script of ['scripts/verify.mjs','scripts/test-ui.mjs']){await new Promise((resolve,reject)=>{const c=spawn(process.execPath,[script],{stdio:'inherit',windowsHide:true});c.on('error',reject);c.on('exit',code=>code===0?resolve():reject(new Error(script+' falhou: '+code)));});}
