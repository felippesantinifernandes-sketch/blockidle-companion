import{describe,it,expect}from'vitest';import{zipSync,strToU8}from'fflate';import{inspectPackage,newer,installPackage,verifyTarget,type Directory,type Package}from'../update/packageManager';
const current={name:'Blockidle Companion',version:'0.3.0'},manifest={...current,version:'0.3.1',manifest_version:3,permissions:['storage','sidePanel','activeTab','scripting'],host_permissions:['https://blockidle.io/*'],background:{service_worker:'background.js'},side_panel:{default_path:'index.html'}};
const base=()=>({'manifest.json':strToU8(JSON.stringify(manifest)),'background.js':strToU8('new background'),'index.html':strToU8('<html/>'),'contentBridge.js':strToU8('bridge'),'gameAdapter.js':strToU8('adapter')});
function memory(initial:Record<string,Uint8Array>,failPath?:string){
 const files=new Map(Object.entries(initial));let failed=false;
 function directory(prefix=''):Directory{
  return{name:'extension',getDirectoryHandle:async name=>directory(prefix+name+'/'),
   getFileHandle:async(name,options)=>{
    const path=prefix+name;
    if(!files.has(path)){if(!options?.create)throw Object.assign(new Error('missing'),{name:'NotFoundError'});files.set(path,new Uint8Array());}
    return{getFile:async()=>({text:async()=>new TextDecoder().decode(files.get(path)),arrayBuffer:async()=>files.get(path)!.slice().buffer}),
     createWritable:async()=>{let pending:Uint8Array;return{
      write:async(bytes:Uint8Array)=>{if(path===failPath&&!failed){failed=true;throw new Error('disk failure');}pending=bytes.slice();},
      close:async()=>{files.set(path,pending);},abort:async()=>{}
     };}
    };
   },
   removeEntry:async name=>{files.delete(prefix+name);}
  };
 }
 return{root:directory(),files};
}
describe('Atualizador de arquivos da extensão',()=>{
 it('compara versões numericamente e recusa formatos inválidos',()=>{expect(newer('0.10.0','0.3.0')).toBe(true);expect(newer('0.3.0','0.3.0')).toBe(false);expect(()=>newer('v0.4.0','0.3.0')).toThrow();});
 it('valida ZIP, manifesto, integridade e nova versão',async()=>{const p=await inspectPackage(zipSync(base()),current);expect(p.version).toBe('0.3.1');expect(p.hash).toMatch(/^[a-f0-9]{64}$/);});
 it('recusa SHA divergente antes de qualquer gravação',async()=>{await expect(inspectPackage(zipSync(base()),current,'0'.repeat(64))).rejects.toThrow('SHA-256');});
 it('recusa travessia de diretórios e caminhos absolutos',async()=>{for(const name of ['../secret.txt','/secret.txt','assets/../../secret.txt'])await expect(inspectPackage(zipSync({...base(),[name]:strToU8('bad')}),current)).rejects.toThrow();});
 it('recusa corrupção de CRC',async()=>{const bytes=zipSync(base());let at=0;const view=new DataView(bytes.buffer);for(;at<bytes.length-4;at++)if(view.getUint32(at,true)===0x02014b50)break;bytes[at+16]^=1;await expect(inspectPackage(bytes,current)).rejects.toThrow('corrompido');});
 it('não instala código-fonte como extensão nem novas permissões',async()=>{const b=base();delete(b as any)['background.js'];await expect(inspectPackage(zipSync(b),current)).rejects.toThrow('obrigatório');await expect(inspectPackage(zipSync({...base(),'manifest.json':strToU8(JSON.stringify({...manifest,permissions:['cookies']}))}),current)).rejects.toThrow('permissões');});
 it('recusa domínio extra e chave de identidade diferente',async()=>{await expect(inspectPackage(zipSync({...base(),'manifest.json':strToU8(JSON.stringify({...manifest,host_permissions:['https://example.org/*']}))}),current)).rejects.toThrow('domínio');await expect(inspectPackage(zipSync({...base(),'manifest.json':strToU8(JSON.stringify({...manifest,key:'changed'}))}),current)).rejects.toThrow('mesma extensão');});
 it('aceita somente alarmes e notificações opcionais previstos na atualização',async()=>{const valid={...manifest,optional_permissions:['alarms','notifications']};await expect(inspectPackage(zipSync({...base(),'manifest.json':strToU8(JSON.stringify(valid))}),current)).resolves.toMatchObject({version:manifest.version});await expect(inspectPackage(zipSync({...base(),'manifest.json':strToU8(JSON.stringify({...manifest,optional_permissions:['cookies']}))}),current)).rejects.toThrow('opcionais');});
 it('confere pasta instalada pelo manifesto e pelo arquivo atual',async()=>{const m=memory({'manifest.json':strToU8(JSON.stringify(current)),'background.js':strToU8('old')});await expect(verifyTarget(m.root,current,strToU8('old'))).resolves.toBeUndefined();await expect(verifyTarget(m.root,current,strToU8('other'))).rejects.toThrow('corresponde');});
 it('grava manifesto por último e preserva arquivos locais de preferências',async()=>{const original={'manifest.json':strToU8(JSON.stringify(current)),'background.js':strToU8('old'),'preferences.txt':strToU8('preserved')},m=memory(original),p=await inspectPackage(zipSync({...base(),'assets/new.js':strToU8('asset')}),current),order:string[]=[];const wrapper={...m.root,getFileHandle:async(name:string,options?:{create?:boolean})=>{const handle=await m.root.getFileHandle(name,options);return{...handle,createWritable:async()=>{order.push(name);return handle.createWritable();}};}};await installPackage(wrapper,p);expect(order.at(-1)).toBe('manifest.json');expect(new TextDecoder().decode(m.files.get('preferences.txt'))).toBe('preserved');});
 it('restaura arquivos anteriores se uma gravação falhar',async()=>{const old=strToU8('old'),m=memory({'manifest.json':strToU8(JSON.stringify(current)),'background.js':old},'index.html'),p=await inspectPackage(zipSync(base()),current);await expect(installPackage(m.root,p)).rejects.toThrow('restaurados');expect(m.files.get('background.js')).toEqual(old);expect(m.files.has('index.html')).toBe(false);expect(JSON.parse(new TextDecoder().decode(m.files.get('manifest.json'))).version).toBe('0.3.0');});
});
