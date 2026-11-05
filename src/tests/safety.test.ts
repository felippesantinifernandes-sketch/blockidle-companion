import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
const files=(dir:string):string[]=>readdirSync(dir).flatMap(f=>{const p=path.join(dir,f);return statSync(p).isDirectory()?(f==='tests'?[]:files(p)):/\.(ts|tsx)$/.test(f)?[p]:[];});
const source=files(path.resolve(__dirname,'..')).map(f=>[f,readFileSync(f,'utf8')] as const);
describe('Regras de segurança (A8/A13)',()=>{
 it('não chama visivel, ilha nem passeio do cliente',()=>{for(const [f,s] of source)expect(s,f).not.toMatch(/network\.(visivel|ilha|passeio)\s*\(|\/api\/(visivel|ilha|passeio)\b/);});
 it('não sobrescreve a visibilidade da aba',()=>{for(const [f,s] of source)expect(s,f).not.toMatch(/defineProperty\(\s*document\s*,\s*'(hidden|visibilityState)'\s*,\s*\{[^}]*get\s*:|document\.(hidden|visibilityState)\s*=[^=]/);});
 it('não remove cabeçalhos de proteção contra iframe',()=>{for(const [f,s] of source)expect(s,f).not.toMatch(/x-frame-options|frame-ancestors/i);});
});
