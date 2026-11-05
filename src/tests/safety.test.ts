import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
const files=(dir:string):string[]=>readdirSync(dir).flatMap(f=>{const p=path.join(dir,f);return statSync(p).isDirectory()?(f==='tests'?[]:files(p)):/\.(ts|tsx)$/.test(f)?[p]:[];});
const source=files(path.resolve(__dirname,'..')).map(f=>[f,readFileSync(f,'utf8')] as const);
describe('Regras de segurança (A8/A13)',()=>{
 it('não chama visivel nem ilha (expandir a ilha) do cliente',()=>{for(const [f,s] of source)expect(s,f).not.toMatch(/network\.(visivel|ilha)\s*\(|\/api\/(visivel|ilha)\b/);});
 it('a visibilidade da aba só é tratada na apresentação do jogo',()=>{for(const [f,s] of source.filter(([f])=>!f.endsWith('gamePresentation.ts')))expect(s,f).not.toMatch(/defineProperty\(\s*document\s*,\s*'(hidden|visibilityState)'\s*,\s*\{[^}]*get\s*:|document\.(hidden|visibilityState)\s*=[^=]/);});
 it('não remove cabeçalhos de proteção contra iframe',()=>{for(const [f,s] of source)expect(s,f).not.toMatch(/x-frame-options|frame-ancestors/i);});
});
describe('Passeio (B8)',()=>{
 it('todo passeio ligado é desligado num finally',()=>{for(const [f,s] of source){const on=(s.match(/network\.passeio\(true\)/g)??[]).length,off=(s.match(/finally\{if\(turned\)try\{[^}]*network\.passeio\(false\)/g)??[]).length;expect(off,f).toBe(on);}});
});
