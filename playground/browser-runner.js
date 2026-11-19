// Each run uses a fresh dedicated worker, so Stop terminates the entire runtime.
self.onmessage=async ({data})=>{
  try{
    const {initializeWasmSharpModule}=await import('./vendor/wasmsharp/initializeWasmSharpModule.js');
    const interop=await initializeWasmSharpModule(undefined,undefined);
    self.postMessage({type:'ready'});
    const implicit='global using System;\nglobal using System.Collections.Generic;\nglobal using System.IO;\nglobal using System.Linq;\nglobal using System.Net.Http;\nglobal using System.Threading;\nglobal using System.Threading.Tasks;\n';
    const id=interop.CreateNewCompilation(implicit+String(data.code));
    const result=JSON.parse(await interop.RunAsync(id));
    self.postMessage({type:'result',result,prefixLength:implicit.length});
  }catch(e){self.postMessage({type:'error',message:String(e?.message||e)});}
};