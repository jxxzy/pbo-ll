import { mkdtemp, rm, mkdir, cp, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist','playground','vendor');
const temp=await mkdtemp(path.join(tmpdir(),'pbo-vendor-'));
const packages=[
  ['@wasmsharp/core@0.10.2','wasmsharp',null],
  ['sql.js@1.13.0','sqljs',['dist/sql-wasm.js','dist/sql-wasm.wasm']],
  ['monaco-editor@0.52.2','monaco',['min/vs']],
  ['jszip@3.10.1','jszip',['dist/jszip.min.js']]
];
try{
  for(const [spec,name,selected] of packages){
    const work=path.join(temp,name);await mkdir(work);
    if(!process.env.npm_execpath)throw Error('Use npm run assets');
    const packed=JSON.parse(execFileSync(process.execPath,[process.env.npm_execpath,'pack',spec,'--ignore-scripts','--json','--pack-destination',work],{encoding:'utf8',maxBuffer:32*1024*1024}))[0];
    execFileSync('tar',['-xzf',path.join(work,packed.filename),'-C',work]);
    const source=path.join(work,'package'), out=path.join(dest,name);await mkdir(out,{recursive:true});
    if(!selected)await cp(source,out,{recursive:true});else{
      for(const sub of selected){const target=name==='sqljs'?path.join(out,path.basename(sub)):path.join(out,sub);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(source,sub),target,{recursive:true});}
      for(const file of await readdir(source))if(/^(license|licence|thirdparty|notice)/i.test(file)&&(await stat(path.join(source,file))).isFile())await cp(path.join(source,file),path.join(out,file));
    }
    if(name==='wasmsharp'){
      // WasmBundlerFriendlyBootConfig output imports binary assets for Vite.
      // Static Pages does not transform these imports. Resolve each asset URL
      // explicitly, preserving the runtime's own loading and hash metadata.
      const loader=path.join(out,'dotnet.js');
      const original=await readFile(loader,'utf8');
      let count=0;
      const normalized=original.replace(/^import (\w+) from ["'](\.\/[^"'\r\n]+\.(?:wasm|dll|dat|pdb|blat))["'];[^\S\r\n]*\r?$/gm,(_,binding,asset)=>{
        count++;
        return 'const '+binding+' = new URL('+JSON.stringify(asset)+', import.meta.url).href;';
      });
      if(!count)throw Error('Expected bundler-style binary imports in pinned WasmSharp loader.');
      if(/^import\s+.*\.(?:wasm|dll|dat|pdb|blat)["'];/m.test(normalized))throw Error('Unresolved binary module import');
      await writeFile(loader,normalized,'utf8');
      const init=path.join(out,'initializeWasmSharpModule.js');
      const initSource=await readFile(init,'utf8');
      const patched=initSource.replace('disableIntegrityCheck: true,','disableIntegrityCheck: true,\n        maxParallelDownloads: 1,');
      if(patched===initSource)throw Error('Pinned loader config changed; review runtime initialization.');
      await writeFile(init,patched,'utf8');
      console.log('Normalized '+count+' WasmSharp binary asset imports for static browsers');
      const files=await readdir(out);console.log('WasmSharp root module files:',files.filter(f=>/\.m?js$|\.json$/.test(f)).join(', '));
      for(const file of ['initializeWasmSharpModule.js','dotnet.js']){if(!files.includes(file))throw Error('Missing runtime file: '+file);}
    }
    console.log('Bundled '+spec);
  }
}finally{await rm(temp,{recursive:true,force:true});}
