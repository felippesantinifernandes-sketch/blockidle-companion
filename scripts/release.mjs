import {spawn} from 'node:child_process';
import {copyFile} from 'node:fs/promises';
const run=args=>new Promise((resolve,reject)=>{const c=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});c.on('error',reject);c.on('exit',code=>code===0?resolve():reject(new Error(args.join(' ')+' falhou: '+code)));});
await run(['scripts/verify.mjs']);await copyFile('RESULTADO-DOS-TESTES.md','dist/RESULTADO-DOS-TESTES.md');await run(['scripts/test-ui.mjs']);await run(['scripts/test-native.mjs']);await run(['scripts/test-workbench.mjs']);await run(['scripts/test-updater.mjs']);await run(['scripts/test-objectives.mjs']);await run(['scripts/test-forge-alerts.mjs']);await run(['scripts/package.mjs']);await run(['scripts/make-release.mjs']);
