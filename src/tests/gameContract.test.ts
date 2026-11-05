import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import contract from './fixtures/contract-0ddf20e09b.json';
const read=(f:string)=>readFileSync(path.resolve(__dirname,'..',f),'utf8');
const adapter=['content/nativeCommands.ts','content/gamePresentation.ts'].map(read).join('\n');
const used=(re:RegExp)=>[...new Set([...adapter.matchAll(re)].map(m=>m[1]))].sort();
describe('Contrato do build 0ddf20e09b (A13)',()=>{
 it('toda função de rede.js usada pelo adaptador existe no cliente',()=>{const fns=used(/network\.([A-Za-z_]+)/g);expect(fns.length).toBeGreaterThan(8);for(const f of fns)expect(contract.exports,f).toContain(f);});
 it('toda acao enviada ao /api/armazem existe no cliente',()=>{const acts=used(/acao:'([a-z_]+)'/g).filter(a=>a!=='guardar');expect(acts.length).toBeGreaterThan(3);for(const a of acts)expect(contract.actions,a).toContain(a);});
 it('ações montadas por variável também existem',()=>{for(const a of ['autoja','autotudo','terminal_juntar','ender_mochila','sb_craft','arm_craft','por','tirar','guarda','apagar_salvar','autovender','lapidar'])expect(contract.actions,a).toContain(a);});
 it('rotas do Bazar usadas existem',()=>{for(const r of ['agora','ordem','cancelar','resgatar'])expect(contract.bazaarRoutes,r).toContain(r);});
 it('“guardar” só é usado no build antigo ef3c8efa9f',()=>{expect(contract.actions).not.toContain('guardar');expect(adapter).toMatch(/input\.build==='ef3c8efa9f'\?'guardar':'por'/);});
});
