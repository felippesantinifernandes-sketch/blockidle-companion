import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {projectState} from '../inspector/sanitizer';
import {contractStatus,supportsCommandBuild,compatibility,currentBuild,requiredNetwork} from '../core/versionMonitor';
const contract={network:[...requiredNetwork,'passeio'],maps:{COMPACTADOR_VAGAS:true,APAGADOR_VAGAS:true},items:true};
const live=(versao:string,extra:Record<string,unknown>={})=>{const s=normalize({versao,inventario:{cobblestone:1},autoCompactar:[],apagar:[],autoVender:[],companionCapabilities:{contract},...extra},'live');return s;};
describe('Compatibilidade por contrato',()=>{
 it('aceita o build 0ddf20e09b para filtros e venda, não para craft',()=>{const s=live(currentBuild);expect(contractStatus(s).level).toBe('compatible');expect(supportsCommandBuild(currentBuild,'eraser',s)).toBe(true);expect(supportsCommandBuild(currentBuild,'sell',s)).toBe(true);expect(supportsCommandBuild(currentBuild,'craft',s)).toBe(false);expect(supportsCommandBuild(currentBuild,'move',s)).toBe(false);});
 it('build novo com contrato igual fica suspeito e libera só filtros',()=>{const s=live('novo123');expect(contractStatus(s).level).toBe('suspect');expect(supportsCommandBuild('novo123','autosell',s)).toBe(true);expect(supportsCommandBuild('novo123','profile',s)).toBe(true);expect(supportsCommandBuild('novo123','sell',s)).toBe(false);expect(supportsCommandBuild('novo123','eraser')).toBe(false);expect(compatibility('novo123',s)).toMatch(/contrato do jogo continua igual/);});
 it('contrato alterado deixa só leitura e explica o motivo',()=>{const s=live('novo123',{companionCapabilities:{contract:{...contract,network:['ABA'],maps:{COMPACTADOR_VAGAS:false,APAGADOR_VAGAS:true}}}});const r=contractStatus(s);expect(r.level).toBe('broken');expect(r.reasons.join(' ')).toMatch(/armazem/);expect(r.reasons.join(' ')).toMatch(/COMPACTADOR_VAGAS/);expect(supportsCommandBuild('novo123','compactor',s)).toBe(false);});
 it('campo de estado ausente quebra o contrato',()=>{const s=live('novo123');delete s.character.apagar;expect(contractStatus(s).reasons.join(' ')).toMatch(/apagar/);});
 it('estado de outra fonte não é ao vivo',()=>{expect(contractStatus(normalize({inventario:{}},'demo')).level).toBe('unknown');});
});
describe('Campos de status',()=>{
 it('preserva os campos novos e o vencimento do cookie, mas remove dados de conta',()=>{const raw=projectState({estado:{inventario:{},bits:10,gemas:3,mochilaCheia:true,offlineHoje:{usadoMs:1,tetoMs:2},autoVendido:{ouro:50},cookieAte:123,email:'a@b.c'},versao:'x'});expect(raw.cookieAte).toBe(123);expect(raw).not.toHaveProperty('email');const s=normalize(raw,'live');expect(s.character.offlineHoje).toEqual({usadoMs:1,tetoMs:2});expect(s.character.autoVendido).toEqual({ouro:50});expect(s.character.mochilaCheia).toBe(true);});
});
