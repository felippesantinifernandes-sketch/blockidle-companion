import {spawn} from 'node:child_process';
const run=args=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(args.join(' ')+' falhou: '+code)));});
await run(['node_modules/typescript/bin/tsc','--noEmit']);
await run(['node_modules/vitest/vitest.mjs','run','--maxWorkers=1']);
await run(['node_modules/vite/bin/vite.js','build']);
await run(['scripts/build-extension.mjs']);
