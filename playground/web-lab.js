'use strict';
// Browser teaching implementation, intentionally separate from the original ASP.NET code.
window.PBOBrowserLab=(()=>{
  let engine;
  const sql=()=>engine??=(window.initSqlJs({locateFile:f=>new URL('vendor/sqljs/'+f,location.href).href}).catch(e=>{engine=null;throw e;}));
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
  async function open(chapter,root){
    const SQL=await sql();const db=new SQL.Database();
    db.run('CREATE TABLE Barang (id INTEGER PRIMARY KEY AUTOINCREMENT, kodeBarang TEXT NOT NULL, namaBarang TEXT NOT NULL, jumlahStok INTEGER NOT NULL CHECK(jumlahStok>=0), kategori TEXT NOT NULL)');
    if(chapter===8){db.run("INSERT INTO Barang(kodeBarang,namaBarang,jumlahStok,kategori) VALUES('BRG001','Box Kardus',120,''),('BRG002','Label',75,'')");}
    const columns='id,kodeBarang,namaBarang,jumlahStok,kategori';
    const query=(statement,args=[])=>{const stmt=db.prepare(statement);try{stmt.bind(args);const rows=[];while(stmt.step())rows.push(stmt.getAsObject());return rows;}finally{stmt.free();}};
    const get=id=>query('SELECT '+columns+' FROM Barang WHERE id=?',[id])[0];
    const all=()=>query('SELECT '+columns+' FROM Barang ORDER BY id');
    const normalize=v=>{
      if(!v||typeof v!=='object')throw Error('Body harus object JSON.');
      const code=v.kodeBarang,name=v.namaBarang,category=v.kategori??'',stock=v.jumlahStok;
      if(typeof code!=='string'||!code.trim()||code.length>30)throw Error('Kode barang wajib, maksimum 30 karakter.');
      if(typeof name!=='string'||!name.trim()||name.length>100)throw Error('Nama barang wajib, maksimum 100 karakter.');
      if(!Number.isInteger(stock)||stock<0||stock>2147483647)throw Error('Stok harus bilangan bulat 0–2147483647.');
      if(typeof category!=='string'||category.length>60||(chapter===11&&!category.trim()))throw Error('Kategori tidak valid (maksimum 60 karakter).');
      return [code,name,stock,category];
    };
    const insert=v=>{db.run('INSERT INTO Barang(kodeBarang,namaBarang,jumlahStok,kategori) VALUES(?,?,?,?)',normalize(v));return get(query('SELECT last_insert_rowid() AS id')[0].id);};
    const update=(id,v)=>db.run('UPDATE Barang SET kodeBarang=?,namaBarang=?,jumlahStok=?,kategori=? WHERE id=?',[...normalize(v),id]);
    const remove=id=>db.run('DELETE FROM Barang WHERE id=?',[id]);
    root.replaceChildren();root.hidden=false;
    root.append(el('h2',['','','','','','','','','MVC — MODEL / VIEW / CONTROLLER','EF CORE — LATIHAN CREATE / READ','CRUD — VALIDASI DAN DATABASE','REST API — LAB DATABASE'][chapter]),el('p','Mode browser: SQLite WebAssembly yang nyata, tetapi alur ASP.NET dan respons API diimplementasikan ulang di JavaScript. Data sementara hilang saat lab ditutup.'));
    const message=el('p','Database siap.');message.className='lab-message';message.setAttribute('role','status');root.append(message);
    const trace=el('pre','');root.append(trace);
    let editId=null, fields={};
    const form=el('form');form.className='lab-fields';
    if(chapter===9||chapter===10){
      for(const [key,label,max] of [['kodeBarang','Kode Barang',30],['namaBarang','Nama Barang',100],['jumlahStok','Jumlah Stok',null],['kategori','Kategori',60]]){
        const l=el('label',label), input=el('input');input.name=key;
        if(max)input.maxLength=max;else{input.type='number';input.min='0';input.max='2147483647';input.step='1';}
        input.required=key!=='kategori';fields[key]=input;l.append(input);form.append(l);
      }
      const save=el('button','Tambah barang');save.type='submit';form.append(save);
      const cancel=button('Batal edit',()=>{editId=null;form.reset();save.textContent='Tambah barang';});form.append(cancel);
      form.onsubmit=e=>{e.preventDefault();try{const v={kodeBarang:fields.kodeBarang.value,namaBarang:fields.namaBarang.value,jumlahStok:Number(fields.jumlahStok.value),kategori:fields.kategori.value};if(editId===null){insert(v);trace.textContent='INSERT INTO Barang (...) VALUES (...);';}else{update(editId,v);trace.textContent='UPDATE Barang SET ... WHERE id = '+editId+';';}editId=null;form.reset();save.textContent='Tambah barang';message.textContent='Data tersimpan di SQLite.';render();}catch(e){message.textContent=e.message;}};
      root.append(form);
    }
    const tableWrap=el('div');tableWrap.className='table-scroll';root.append(tableWrap);
    function render(){
      const table=el('table'),head=el('thead'),hr=el('tr');for(const h of ['ID','Kode','Nama','Stok','Kategori',...(chapter===10?['Aksi']:[])])hr.append(el('th',h));head.append(hr);table.append(head);
      const tbody=el('tbody');for(const row of all()){const tr=el('tr');for(const k of columns.split(','))tr.append(el('td',String(row[k])));
        if(chapter===10){const td=el('td');td.append(button('Edit',()=>{editId=row.id;for(const k of Object.keys(fields))fields[k].value=row[k];form.querySelector('[type=submit]').textContent='Simpan perubahan';fields.kodeBarang.focus();}),button('Hapus',()=>{if(confirm('Hapus '+row.namaBarang+'?')){remove(row.id);if(editId===row.id){editId=null;form.reset();form.querySelector('[type=submit]').textContent='Tambah barang';}trace.textContent='DELETE FROM Barang WHERE id = '+row.id+';';message.textContent='Barang dihapus.';render();}}));tr.append(td);}tbody.append(tr);}
      table.append(tbody);tableWrap.replaceChildren(table);
    }
    if(chapter===8){trace.textContent='GET /Barang → Controller memilih Model → View menampilkan tabel (alur pembelajaran).';root.append(button('Muat ulang daftar',()=>{render();message.textContent='View diperbarui dari model.';}));}
    else trace.textContent='SELECT '+columns+' FROM Barang ORDER BY id;';
    if(chapter===11)root.append(el('p','Gunakan panel REST API di bawah untuk GET, POST, PUT, dan DELETE.'));
    root.append(button('Unduh database SQLite',()=>{const url=URL.createObjectURL(new Blob([db.export()],{type:'application/x-sqlite3'}));const a=el('a');a.href=url;a.download='bab-'+chapter+'.db';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
    render();
    function request({method,path,body}){
      const result=(status,value)=>({status,body:value===undefined?'':JSON.stringify(value,null,2)});
      const m=/^\/api\/barangapi(?:\/([0-9]+))?$/i.exec(path);
      if(chapter!==11||!m)return result(404,{error:'Route tidak ditemukan'});
      const id=m[1]===undefined?null:Number(m[1]);
      trace.textContent=method+' '+path+' → operasi SQLite lokal';
      try{
        if(method==='GET')return id===null?result(200,all()):get(id)?result(200,get(id)):result(404,{error:'Barang tidak ditemukan'});
        if(method==='POST'&&id===null){const v=insert(JSON.parse(body));render();return result(201,v);}
        if(method==='PUT'&&id!==null){const v=JSON.parse(body);normalize(v);if(!get(id))return result(404,{error:'Barang tidak ditemukan'});update(id,v);render();return result(204);}
        if(method==='DELETE'&&id!==null){if(!get(id))return result(404,{error:'Barang tidak ditemukan'});remove(id);render();return result(204);}
        return result(405,{error:'Method tidak didukung untuk route ini'});
      }catch(e){return result(400,{error:e.message});}
    }
    return {request,dispose:()=>{db.close();root.replaceChildren();root.hidden=true;}};
  }
  return {open};
})();