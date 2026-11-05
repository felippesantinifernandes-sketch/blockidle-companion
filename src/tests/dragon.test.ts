import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {dragonReadiness,nextNatural,sealLevel} from '../core/dragon';
const ok={inventario:{},area:'mina',portal:true,dragao:{auto:true},habilidades:{combate:999999999},guardado:{acessorios:{selo_convocacao:1}}};
describe('Dragão: vai entrar sozinho?',()=>{
 it('tudo certo entra',()=>{const s=normalize(ok,'live');expect(sealLevel(s)).toBe(1);const r=dragonReadiness(s,0);expect(r.blockers).toEqual([]);expect(r.willJoin).toBe(true);});
 it('missão de Slayer na Masmorra segura o Steve',()=>{const s=normalize({...ok,area:'masmorra',slayer:{missao:{id:'revenant'}}},'live');const r=dragonReadiness(s,0);expect(r.willJoin).toBe(false);expect(r.blockers.map(b=>b.label)).toEqual(['Sem missão de Slayer em andamento']);});
 it('Catacumbas, passeio, sem Selo e sem opção ligada aparecem com o que fazer',()=>{const s=normalize({...ok,area:'catacumba',passeio:true,dragao:{auto:false},guardado:{}},'live');const labels=dragonReadiness(s,0).blockers.map(b=>b.label);expect(labels).toContain('Fora da Câmara do Vazio e das Catacumbas');expect(labels).toContain('Fora de passeio (Lobby, ilha, Forja)');expect(labels).toContain('“Entrar sozinho” ligado');expect(labels).toContain('Selo de Convocação na bolsa de acessórios');});
 it('invocado pede o Selo Encantado',()=>{const s=normalize(ok,'live');expect(dragonReadiness(s,0,{at:1000,forced:true}).blockers.map(b=>b.label)).toEqual(['Dragão invocado pede o Selo Encantado']);});
 it('próximo natural respeita a folga de 20 min',()=>{const h3=3*3600000;expect(nextNatural(h3-60000)).toBe(h3);expect(nextNatural(h3-60000,h3-10*60000)).toBe(2*h3);});
});
