'use strict';
const $ = id => document.getElementById(id);
let labs=[], current=null, sources={}, originals={}, activeFile='', connected=false, busy=false, loading=false, job=null, generation=0;
let browserAvailable=false, browserWorker=null, browserTimer=null;
let webAvailable=false, webLab=null;
const canBrowser=()=>browserAvailable&&current?.chapter<=7;
const canWebLab=()=>webAvailable&&current?.chapter>=8;
function closeWebLab(){
  if(webLab){webLab.dispose();webLab=null;}
  $('web-lab').hidden=true;
}
const key = chapter => 'pbo2-playground-v1:'+chapter;
const local = location.origin === 'http://127.0.0.1:8787';
const endpoint = path => '/lab-api/'+path;
async function request(path, data) {
  const res=await fetch(endpoint(path),data===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await res.json();
  if(!res.ok) throw Error(result.error||'HTTP '+res.status);
  return result;
}
function controls(){
  $('run').disabled=(!connected&&!canBrowser()&&!canWebLab())||busy||loading||!current;
  $('stdin-label').hidden=!current||current.chapter>7||(!connected&&canBrowser());
  $('run').title=connected?'Jalankan dengan Docker lokal':canBrowser()?'Jalankan C# melalui WebAssembly':canWebLab()?'Buka praktikum browser (bukan kompilasi ASP.NET)':'Runner tidak tersedia';
  $('stop').disabled=!webLab&&((!connected&&!browserWorker)||!busy);
  $('chapter').disabled=busy||loading||!labs.length;
  for(const id of ['reset','copy','download','editor']) $(id).disabled=loading||!activeFile;
  $('send').disabled=!(current?.chapter===11&&(webLab||(job?.ready&&job?.running)));
  $('run').textContent=!connected&&current?.chapter>=8?'▶ Buka Lab Web':'▶ Run';
  $('web-notice').hidden=!current||current.chapter<8||connected;
}
function persist(){try{localStorage.setItem(key(current.chapter),JSON.stringify(sources));}catch(e){$('state').textContent='Penyimpanan browser tidak tersedia';}}
function showFile(file){
  activeFile=file; $('filename').textContent=file; $('mode').textContent=file.split('.').pop();
  $('editor').value=sources[file];
  for(const b of $('files').children) b.setAttribute('aria-current',String(b.dataset.file===file));
  controls();
}
async function load(chapter){
  closeWebLab(); loading=true; controls(); $('preview').hidden=true; job=null; $('output').textContent='Belum ada eksekusi.'; $('response').textContent='Jalankan Bab 11 terlebih dahulu.';
  try{
    const next=labs.find(x=>x.chapter===chapter); if(!next) throw Error('Bab tidak ditemukan');
    const id=String(chapter).padStart(2,'0');
    const pairs=await Promise.all(next.files.map(async file=>{
      const r=await fetch('../praktikum/bab-'+id+'/'+file.split('/').map(encodeURIComponent).join('/'));
      if(!r.ok) throw Error('Gagal membuka '+file);
      return [file,await r.text()];
    }));
    originals=Object.fromEntries(pairs); sources={...originals}; current=next;
    try{const saved=JSON.parse(localStorage.getItem(key(chapter))||'{}');for(const file of next.files)if(typeof saved[file]==='string') sources[file]=saved[file];}catch{}
    $('files').replaceChildren();
    for(const file of next.files){const b=document.createElement('button');b.type='button';b.textContent=file;b.dataset.file=file;b.onclick=()=>showFile(file);$('files').append(b);}
    $('lesson').href='../bab-'+chapter+'/'; $('api').hidden=chapter!==11; $('stdin-label').hidden=chapter>7;
    $('chapter').value=String(chapter);history.replaceState(null,'','?bab='+chapter);
    showFile('Program.cs');
    $('state').textContent=connected?'Siap • Docker lokal':canBrowser()?'Siap • Compiler browser (WASM)':canWebLab()?'Siap • Lab web interaktif (SQLite WASM)':'Runner belum tersedia';
  }catch(e){current=null;activeFile='';$('files').replaceChildren();$('editor').value='';$('output').textContent=e.message;}
  finally{loading=false;controls();}
}
$('editor').addEventListener('input',()=>{if(activeFile){sources[activeFile]=$('editor').value;persist();}});
$('editor').addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const ed=e.target;ed.setRangeText('    ',ed.selectionStart,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'));}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(!$('run').disabled)$('run').click();}});
$('chapter').onchange=()=>load(Number($('chapter').value));
$('reset').onclick=()=>{if(confirm('Kembalikan seluruh file bab ini ke source asli?')){sources={...originals};persist();showFile(activeFile);}};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(sources[activeFile]);$('state').textContent='Disalin';}catch{$('editor').select();$('state').textContent='Pilih Ctrl+C untuk menyalin';}};
$('download').onclick=()=>{const u=URL.createObjectURL(new Blob([sources[activeFile]],{type:'text/plain'}));const a=document.createElement('a');a.href=u;a.download=activeFile.split('/').pop();a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
async function poll(g){
  if(g!==generation)return;
  try{
    job=await request('status');
    if(g!==generation)return;
    $('output').textContent=job.output||'Menunggu output compiler…';
    $('state').textContent=job.state;
    busy=job.running;
    if(job.ready&&job.running){$('preview').href=job.url;$('preview').hidden=false;}else $('preview').hidden=true;
    controls();if(busy)setTimeout(()=>poll(g),600);
  }catch(e){$('state').textContent='Koneksi runner terputus: '+e.message;busy=false;job=null;controls();}
}
function endBrowser(state,output){
  clearTimeout(browserTimer);browserWorker?.terminate();browserWorker=null;
  busy=false;$('state').textContent=state;
  if(output!==undefined)$('output').textContent=output;
  controls();
}
function runBrowser(){
  busy=true;$('preview').hidden=true;$('state').textContent='Memuat compiler WebAssembly…';
  $('output').textContent='Unduhan runtime pertama mungkin membutuhkan waktu.';
  try{
    browserWorker=new Worker(new URL('./browser-runner.js',location.href),{type:'module'});
    const worker=browserWorker;
    browserTimer=setTimeout(()=>endBrowser('Timeout','Compiler tidak siap dalam 180 detik.'),180000);
    worker.onmessage=({data})=>{
      if(browserWorker!==worker)return;
      if(data.type==='ready'){
        clearTimeout(browserTimer);browserTimer=setTimeout(()=>endBrowser('Timeout','Eksekusi dihentikan setelah 30 detik.'),30000);
        $('state').textContent='Compile / run (WASM)…';return;
      }
      if(data.type==='result'){
        const result=data.result;
        const diagnostics=(result.diagnostics||[]).map(d=>d.id+' '+d.severity+': '+d.message).join('\n');
        endBrowser(result.success?'Eksekusi selesai (WASM)':'Kompilasi gagal',[result.stdOut,result.stdErr,diagnostics].filter(Boolean).join('\n')||'(Tidak ada output)');
      }else if(data.type==='error')endBrowser('Eksekusi gagal',data.message);
    };
    worker.onerror=e=>endBrowser('Compiler gagal dimuat',e.message||'Buka ulang halaman dan periksa jaringan.');
    worker.postMessage({code:sources['Program.cs']});controls();
  }catch(e){endBrowser('Compiler tidak tersedia',e.message);}
}
$('run').onclick=async()=>{
  if(!connected&&canBrowser()){runBrowser();return;}
  if(!connected&&canWebLab()){
    closeWebLab();busy=true;controls();
    try{webLab=await window.PBOBrowserLab.open(current.chapter,$('web-lab'));$('state').textContent='Lab web aktif (bukan ASP.NET runtime)';$('output').textContent='Lab browser aktif. SQLite berjalan nyata di WebAssembly; source C# tidak dikompilasi pada Bab 8–11. Untuk menjalankan perubahan C# asli gunakan Codespaces atau runner lokal.';}catch(e){$('output').textContent=e.message;$('state').textContent='Lab web gagal';}finally{busy=false;controls();}return;
  }
  busy=true;const g=++generation;controls();$('preview').hidden=true;$('output').textContent='Mengirim source ke Docker…';
  try{await request('run',{chapter:current.chapter,files:sources,stdin:$('stdin').value});await poll(g);}
  catch(e){busy=false;$('state').textContent='Gagal';$('output').textContent=e.message;controls();}
};
$('stop').onclick=async()=>{if(webLab){closeWebLab();$('state').textContent='Lab web ditutup';$('response').textContent='Buka lab lagi untuk memulai.';controls();return;}if(browserWorker){endBrowser('Dihentikan','Eksekusi browser dihentikan.');return;}try{await request('stop',{});}catch(e){$('state').textContent=e.message;}};
$('send').onclick=async()=>{try{const method=$('method').value;const payload={method,path:$('endpoint').value,body:['POST','PUT'].includes(method)?$('body').value:undefined};
  const result=webLab?webLab.request(payload):await request('api',payload);
  $('response').textContent=(webLab?'Respons lab (bukan HTTP server) ':'HTTP ')+result.status+'\n'+result.body;}catch(e){$('response').textContent=e.message;}};
(async()=>{
  try{const r=await fetch('manifest.json');if(!r.ok)throw Error('Manifest belum dibangun. Jalankan npm run build.');labs=await r.json();
    for(const lab of labs){const o=document.createElement('option');o.value=lab.chapter;o.textContent='Bab '+lab.chapter+' — '+lab.title;$('chapter').append(o);}
    if(local){try{const health=await request('health');connected=health.available;$('connection').textContent=connected?'Runner lokal terhubung • Docker siap':'Runner lokal aktif, tetapi image Docker belum tersedia';}catch(e){$('connection').textContent='Runner lokal tidak tersedia: '+e.message;}}
    if(!connected){
      try{
        const asset=await fetch('./vendor/wasmsharp/index.js',{method:'HEAD',cache:'no-store'});
        browserAvailable=asset.ok&&!(asset.headers.get('content-type')||'').includes('text/html')&&typeof Worker!=='undefined'&&typeof WebAssembly!=='undefined';
      }catch{}
      webAvailable=typeof window.initSqlJs==='function'&&!!window.PBOBrowserLab;
      $('connection').textContent='Mode online: '+(browserAvailable?'Bab 1–7 compiler C# WASM. ':'Compiler C# belum tersedia. ')+(webAvailable?'Bab 8–11 lab web interaktif SQLite WASM. ':'Lab web belum tersedia. ')+'Eksekusi ASP.NET asli melalui Codespaces atau runner lokal.';
    }
    $('setup').open=!connected&&!browserAvailable;
    const selection=Number(new URLSearchParams(location.search).get('bab'));await load(labs.some(l=>l.chapter===selection)?selection:labs[0].chapter);
  }catch(e){$('connection').textContent=e.message;controls();}
})();