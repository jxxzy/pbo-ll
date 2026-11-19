'use strict';
const $=id=>document.getElementById(id), form=$('item-form'), route='/api/barangapi';
let editing=null, pending=0;
function notice(message){$('notice').textContent=message;}
function setBusy(on){pending+=on?1:-1;for(const b of document.querySelectorAll('button[type=submit],#send,#refresh'))b.disabled=pending>0;}
async function request(method,path,data){
  if(!/^\/api\/barangapi(?:\/\d+)?(?:\?[^#]*)?$/.test(path)&&!(method==='GET'&&path==='/health'))throw Error('Gunakan route API inventaris atau /health.');
  const start=performance.now(), opts={method,cache:'no-store',signal:AbortSignal.timeout(15000)};
  if(data!==undefined){opts.headers={'Content-Type':'application/json'};opts.body=typeof data==='string'?data:JSON.stringify(data);}
  const res=await fetch(path,opts), raw=await res.text(), time=Math.round(performance.now()-start);
  let value=raw;try{value=JSON.parse(raw);}catch{}
  $('response-status').textContent=res.status+' '+res.statusText+' · '+time+' ms';
  $('response').textContent=typeof value==='string'?value:JSON.stringify(value,null,2);
  $('latency').textContent=time+' ms';
  const li=document.createElement('li');li.textContent=method+' '+path+' → '+res.status+' · '+time+' ms';$('history').prepend(li);while($('history').children.length>30)$('history').lastChild.remove();
  return {ok:res.ok,status:res.status,value};
}
function cancel(){editing=null;form.reset();$('save').textContent='Tambah barang';$('cancel').hidden=true;}
function makeButton(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b;}
async function refresh(){
  const q=new URLSearchParams({search:$('search').value,sort:$('sort').value});
  const res=await request('GET',route+'?'+q);
  if(!res.ok||!Array.isArray(res.value))throw Error('Gagal memuat daftar: '+res.status);
  const rows=res.value;$('count').textContent=String(rows.length);$('rows').replaceChildren();
  for(const row of rows){const tr=document.createElement('tr');for(const key of ['id','kodeBarang','namaBarang','jumlahStok','kategori']){const td=document.createElement('td');td.textContent=String(row[key]??'');tr.append(td);}
    const actions=document.createElement('td');actions.append(makeButton('Edit',()=>{editing=row.id;for(const k of ['kodeBarang','namaBarang','jumlahStok','kategori'])form.elements[k].value=row[k];$('save').textContent='Simpan perubahan';$('cancel').hidden=false;form.elements.kodeBarang.focus();}),makeButton('Hapus',async()=>{if(!confirm('Hapus '+row.namaBarang+'?'))return;await execute(async()=>{const result=await request('DELETE',route+'/'+row.id);if(!result.ok)throw Error('Hapus gagal: '+result.status);if(editing===row.id)cancel();await refresh();notice('Barang dihapus (204).');});}));tr.append(actions);$('rows').append(tr);}
}
async function execute(fn){setBusy(true);try{await fn();}catch(e){notice(e.message);$('response-status').textContent='Error: '+e.message;}finally{setBusy(false);}}
form.onsubmit=e=>{e.preventDefault();void execute(async()=>{const body=Object.fromEntries(new FormData(form));body.jumlahStok=Number(body.jumlahStok);const result=await request(editing===null?'POST':'PUT',editing===null?route:route+'/'+editing,body);if(!result.ok)throw Error('Request ditolak: '+result.status);cancel();notice('Tersimpan: HTTP '+result.status);await refresh();});};
$('cancel').onclick=cancel;$('refresh').onclick=()=>execute(refresh);$('sort').onchange=()=>execute(refresh);
$('send').onclick=()=>execute(async()=>{const method=$('method').value;const data=['POST','PUT'].includes(method)?$('body').value:undefined;if(data!==undefined)JSON.parse(data);await request(method,$('path').value,data);});
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('response').textContent);notice('Respons disalin.');}catch{notice('Clipboard tidak tersedia.');}};
$('clear').onclick=()=>$('history').replaceChildren();
$('theme').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('pbo-native-theme',next);}catch{}};
try{const t=localStorage.getItem('pbo-native-theme');if(['light','dark'].includes(t))document.documentElement.dataset.theme=t;}catch{}
void execute(async()=>{const h=await request('GET','/health');$('health').textContent=h.ok?'Healthy':'Unavailable';await refresh();});
