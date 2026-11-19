// Dedicated worker: real Roslyn runtime, never evaluate JavaScript as C#.
// dotnet/runtime#114918: identify this as the hosting sidecar, not a managed pthread.
// Set before importing dotnet.js even when an onmessage handler is already attached.
self.dotnetSidecar=true;
self.onmessage=async ({data})=>{
  const progress=message=>self.postMessage({type:'progress',message});
  try{
    progress('Worker aktif; mengimpor modul .NET');
    const {initializeWasmSharpModule}=await import('./vendor/wasmsharp/initializeWasmSharpModule.js');
    progress('Modul .NET dimuat');
    const interop=await initializeWasmSharpModule({enableDiagnosticTracing:!!data.debug},{
      onConfigLoaded:()=>progress('Konfigurasi runtime .NET dimuat'),
      onDownloadResourceProgress:(loaded,total)=>{if(loaded%10===0||loaded===total)progress('Resource .NET '+loaded+'/'+total);}
    });
    progress('Roslyn siap');
    self.postMessage({type:'ready'});
    const implicit='global using System;\nglobal using System.Collections.Generic;\nglobal using System.IO;\nglobal using System.Linq;\nglobal using System.Net.Http;\nglobal using System.Threading;\nglobal using System.Threading.Tasks;\n';
    const id=interop.CreateNewCompilation(implicit+String(data.code));
    const result=JSON.parse(await interop.RunAsync(id));
    self.postMessage({type:'result',result,prefixLength:implicit.length});
  }catch(e){self.postMessage({type:'error',message:String(e?.message||e),stack:String(e?.stack||'').slice(0,2000)});}
};
