import {mkdir,writeFile} from 'node:fs/promises';
const dir='../../work/research-v030';await mkdir(dir,{recursive:true});
const urls=[...['armaduras_sb','catalogo','sistemas_sb','mochilacfg','armazem','forjaui','acessoriosui'].map(n=>['https://blockidle.io/js/'+n+'.js',n+'.js']),...['craft','crafts_sb','forja','colecoes','acessorios','coracao'].map(n=>['https://blockidle.io/wiki/'+n,'wiki-'+n+'.html'])];
for(let i=0;i<urls.length;i+=3)await Promise.all(urls.slice(i,i+3).map(async([url,name])=>{try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status);await writeFile(dir+'/'+name,await r.text());console.log(name+' OK');}catch(e){console.log(name+' FALHOU '+e.message);}}));
