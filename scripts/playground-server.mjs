import http from 'node:http';
import { readFile, stat, mkdir, mkdtemp, writeFile, rm, chmod } from 'node:fs/promises';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const origin='http://127.0.0.1:8787', image='pbo2-lab:net10';
const exec=promisify(execFile);
const manifest=JSON.parse(await readFile(path.join(root,'playground/manifest.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg'};
let active=null, preparing=false;
const empty={running:false,ready:false,state:'Siap',output:''};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
async function docker(args,timeout=5000){return exec('docker',args,{timeout,maxBuffer:65536,windowsHide:true});}
async function body(req){
  if(req.headers['content-type']!=='application/json')throw Error('Content-Type harus application/json');
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>512*1024)throw Error('Request terlalu besar (maksimal 512 KB)');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function output(job,chunk){job.output=(job.output+chunk.toString()).slice(-64000);}
function snapshot(){if(!active)return empty;const {running,ready,state,output,url}=active;return {running,ready,state,output,url};}
async function remove(job){try{await docker(['rm','-f',job.name],10000);}catch{}}
async function stop(job,reason){
  if(!job?.running)return;job.state=reason;job.stopping=true;job.ready=false;
  await remove(job);
  if(job.child&&!job.child.killed)job.child.kill();
}
async function start(data){
  if(preparing||active?.running)throw Error('Hentikan eksekusi sebelumnya dahulu.');
  preparing=true;
  let folder,job;
  try{
    const lab=manifest.find(l=>l.chapter===data.chapter);
    if(!lab||!data.files||typeof data.files!=='object'||Array.isArray(data.files))throw Error('Project tidak valid');
    const names=Object.keys(data.files);
    if(names.length!==lab.files.length||names.some(n=>!lab.files.includes(n)||typeof data.files[n]!=='string'))throw Error('Daftar file harus sama dengan project asli.');
    // File names are allowlisted by the build manifest; project file edits are not executed.
    const project=lab.files.find(n=>n.endsWith('.csproj'));
    if(!project||data.files[project]!==await readFile(path.join(root,'praktikum','bab-'+String(lab.chapter).padStart(2,'0'),project),'utf8'))throw Error('File csproj harus tetap asli agar paket dapat dipulihkan dari cache.');
    await docker(['image','inspect',image]);
    folder=await mkdtemp(path.join(tmpdir(),'pbo-lab-'));await chmod(folder,0o755);
    for(const file of names){
      const target=path.resolve(folder,file);
      if(!target.startsWith(folder+path.sep))throw Error('Path tidak valid');
      await mkdir(path.dirname(target),{recursive:true,mode:0o755});await writeFile(target,data.files[file],{mode:0o644});
    }
    const web=lab.chapter>=8;
    job={name:'pbo-lab-'+randomUUID(),chapter:lab.chapter,folder,running:true,ready:false,state:'Compile / run…',output:'',url:null,stopping:false};
    active=job;
    const args=['run','--rm','--name',job.name,'--memory','1536m','--cpus','2','--pids-limit','256','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--tmpfs','/tmp:rw,exec,size=256m,mode=1777','--tmpfs','/work:rw,exec,size=512m,mode=1777','--mount','type=bind,source='+folder+',target=/input,readonly','-i'];
    if(web)args.push('-p','127.0.0.1::8080');else args.push('--network','none');
    args.push(image,'sh','-c','cp -R /input/. /work/ && dotnet restore "$1" --ignore-failed-sources -p:NuGetAudit=false && dotnet run --project "$1" --no-restore --no-launch-profile '+(web?'--urls http://0.0.0.0:8080':''),'lab',project);
    const child=spawn('docker',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});job.child=child;
    job.timer=setTimeout(()=>{void stop(job,'Batas waktu tercapai');},web?10*60*1000:60*1000);
    child.stdout.on('data',c=>output(job,c));child.stderr.on('data',c=>output(job,c));
    child.stdin.on('error',()=>{});child.stdin.end(typeof data.stdin==='string'?data.stdin.slice(0,8192)+'\n':'');
    child.on('error',e=>output(job,e.message));
    child.on('close',async code=>{
      clearTimeout(job.timer);job.ready=false;
      if(!job.stopping)job.state='Exit code '+code;
      await remove(job);await rm(folder,{recursive:true,force:true}).catch(()=>{});job.running=false;
    });
    if(web)void (async()=>{
      while(job.running&&!job.stopping&&!job.ready){
        try{
          const {stdout}=await docker(['port',job.name,'8080/tcp']);
          const match=stdout.match(/127\.0\.0\.1:(\d+)/);
          if(match){const url='http://127.0.0.1:'+match[1];const health=await fetch(url+(lab.chapter===11?'/health': lab.chapter===8?'/Barang':'/'),{signal:AbortSignal.timeout(1000),redirect:'manual'});if(!health.ok)throw Error('App not ready');if(job.running&&!job.stopping){job.url=url+(lab.chapter===8?'/Barang':'/');job.ready=true;job.state='Server berjalan';}}
        }catch{}
        await new Promise(r=>setTimeout(r,750));
      }
    })();
  }catch(e){if(folder&&!job)await rm(folder,{recursive:true,force:true});throw e;}
  finally{preparing=false;}
}
async function api(data){
  if(!active?.running||!active.ready||active.chapter!==11)throw Error('Jalankan Bab 11 dahulu.');
  if(!['GET','POST','PUT','DELETE'].includes(data.method)||typeof data.path!=='string'||!/^\/api\/barangapi(?:\/[0-9]+)?$/i.test(data.path))throw Error('Method/path tidak diizinkan untuk praktikum ini.');
  const headers={};let payload;
  if(['POST','PUT'].includes(data.method)){if(typeof data.body!=='string'||data.body.length>16000)throw Error('JSON body tidak valid');JSON.parse(data.body);payload=data.body;headers['Content-Type']='application/json';}
  const response=await fetch(new URL(data.path,active.url),{method:data.method,headers,body:payload,redirect:'manual',signal:AbortSignal.timeout(5000)});
  const reader=response.body?.getReader();let out='',count=0;const decoder=new TextDecoder();
  if(reader)try{while(true){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>65536){await reader.cancel();out+='\n[Output dipotong]';break;}out+=decoder.decode(value,{stream:true});}out+=decoder.decode();}finally{reader.releaseLock();}
  return {status:response.status,body:out};
}
const server=http.createServer(async(req,res)=>{
  // Local-only, reject cross-origin requests and DNS rebinding.
  if(req.headers.host!=='127.0.0.1:8787'||(req.headers.origin&&req.headers.origin!==origin)){send(res,403,{error:'Runner hanya untuk origin lokal'});return;}
  try{
    const url=new URL(req.url,origin);
    if(url.pathname.startsWith('/lab-api/')){
      if(req.method==='GET'&&url.pathname==='/lab-api/health'){let available=false;try{await docker(['image','inspect',image]);available=true;}catch{}send(res,200,{available});return;}
      if(req.method==='GET'&&url.pathname==='/lab-api/status'){send(res,200,snapshot());return;}
      if(req.method!=='POST'||req.headers.origin!==origin){send(res,403,{error:'POST same-origin diperlukan'});return;}
      const data=await body(req);
      if(url.pathname==='/lab-api/run'){await start(data);send(res,200,{ok:true});return;}
      if(url.pathname==='/lab-api/stop'){await stop(active,'Dihentikan');send(res,200,{ok:true});return;}
      if(url.pathname==='/lab-api/api'){send(res,200,await api(data));return;}
      send(res,404,{error:'Endpoint tidak ditemukan'});return;
    }
    if(!['GET','HEAD'].includes(req.method)){send(res,405,{error:'Method tidak diizinkan'});return;}
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(file!==root&&!file.startsWith(root+path.sep)){send(res,403,{error:'Path tidak valid'});return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const content=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:content);
  }catch(e){send(res,e.code==='ENOENT'?404:400,{error:e.message});}
});
server.listen(8787,'127.0.0.1',()=>console.log('PBO II Interactive Playground: '+origin+'/playground/'));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await stop(active,'Runner berhenti');process.exit(0);});
