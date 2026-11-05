import {describe,it,expect} from 'vitest';
import {normalize} from '../core/normalizer';
import {defaults,parseBackup} from '../db/preferences';
import {stateEvents,nextDragon,nextAuction} from '../core/notifications';
const st=(o:Record<string,unknown>)=>normalize({inventario:{},versao:'a',...o},'live');
describe('Notificações',()=>{
 it('dispara só nas transições',()=>{const a=st({mochilaCheia:false,offlineHoje:{usadoMs:70,tetoMs:100},fila:[{}]}),b=st({mochilaCheia:true,offlineHoje:{usadoMs:85,tetoMs:100},fila:[],versao:'b'});expect(stateEvents(a,b).map(e=>e.kind)).toEqual(['backpackFull','offline','queueEmpty','build']);expect(stateEvents(b,b)).toEqual([]);expect(stateEvents(undefined,b)).toEqual([]);});
 it('horários do Dragão (a cada 3 h de Brasília) e do leilão (:40)',()=>{const t=Date.UTC(2026,10,5,4,10);expect(new Date(nextDragon(t)).toISOString()).toBe('2026-11-05T06:00:00.000Z');expect(new Date(nextDragon(Date.UTC(2026,10,5,6,0))).toISOString()).toBe('2026-11-05T09:00:00.000Z');expect(new Date(nextAuction(t)).toISOString()).toBe('2026-11-05T04:40:00.000Z');expect(new Date(nextAuction(Date.UTC(2026,10,5,4,45))).toISOString()).toBe('2026-11-05T05:40:00.000Z');});
 it('backup antigo recebe notificações desligadas com todos os tipos marcados',()=>{const old:any=structuredClone(defaults);delete old.notify;const m=parseBackup(JSON.stringify({format:'blockidle-companion-preferences',version:1,preferences:old}));expect(m.notify.enabled).toBe(false);expect(m.notify.dragon).toBe(true);});
});
