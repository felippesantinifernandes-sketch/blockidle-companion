import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await build({entryPoints:{background:'src/background/serviceWorker.ts',contentBridge:'src/content/contentBridge.ts',gameAdapter:'src/content/gameAdapter.ts'},outdir:'dist',bundle:true,format:'iife',platform:'browser',target:'chrome116',minify:true,legalComments:'none'});
await copyFile('manifest.json','dist/manifest.json');
await mkdir('dist/icons',{recursive:true});for(const size of [16,32,128])await copyFile('public/icons/'+size+'.png','dist/icons/'+size+'.png');
await copyFile('INSTALACAO.md','dist/LEIA-ME.md');
await mkdir('dist/licenses',{recursive:true});
for(const name of ['react','react-dom','zustand','zod','lucide-react','tailwindcss','fflate']){for(const file of ['LICENSE','LICENSE.md','LICENSE.txt']){try{await copyFile('node_modules/'+name+'/'+file,'dist/licenses/'+name+'.txt');break;}catch{}}}
await copyFile('THIRD_PARTY_NOTICES.md','dist/THIRD_PARTY_NOTICES.md');
console.log('Manifest V3 compilado em dist/.');
