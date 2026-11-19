import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const host='http://127.0.0.1:8765';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
let browser;
try{
  for(let i=0;i<50;i++){try{if((await fetch(host)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({headless:true,...(process.env.PBO_CHROME?{executablePath:process.env.PBO_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER',m.type(),m.text());});
  page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
  page.on('requestfailed',req=>console.log('REQUEST FAILED',req.url(),req.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)console.log('HTTP ERROR',r.status(),r.url());});
  const expected=['Karton','Validasi berhasil','Biskuit','Risiko:','Dictionary:','Kode barang sudah digunakan','Pemindai Barcode'];
  for(let chapter=1;chapter<=11;chapter++){
    await page.goto(host+'/bab-'+chapter+'/',{waitUntil:'domcontentloaded'});
    await page.locator('a[href*="playground/?bab="]').first().waitFor();
  }
  await page.goto(host+'/');
  await page.locator('#academy-chapters details').first().waitFor();
  assert.equal(await page.locator('#academy-chapters details').count(),11);
  await page.fill('#cx-name','TesObjek');await page.click('#cx-create');assert.match(await page.locator('#cx-object').textContent(),/TesObjek/);
  await page.fill('#cx-new-stock','-1');await page.click('#cx-update');assert.match(await page.locator('#cx-enc').textContent(),/ArgumentException/);
  await page.selectOption('#academy-bookmark-chapter','11');await page.click('#academy-bookmark-add');assert.match(await page.locator('#academy-bookmarks').textContent(),/Bab 11/);
  await page.selectOption('#academy-note-chapter','11');await page.fill('#academy-note','CI note');await page.click('#academy-note-save');assert.equal(await page.evaluate(()=>localStorage.getItem('pbo-notes-v2:11')),'CI note');
  assert.equal(await page.locator('#academy-scores tr').count(),11);
  await page.click('#academy-start');await page.click('#academy-pause');assert.match(await page.locator('#academy-timer-status').textContent(),/Dijeda/);
  await page.goto(host+'/bab-11/');await page.locator('#academy-bookmark-this').waitFor();assert.match(await page.locator('#academy-bookmark-this').textContent(),/tersimpan/);
  console.log('PASS academy navigation, concept lab, bookmarks, notes, assessment and timer');
  await page.goto(host+'/playground/?bab=1&debug=1');
  await page.locator('#run:enabled').waitFor({timeout:30000});
  await page.locator('#monaco-editor .monaco-editor').waitFor({timeout:30000});
  const failures=[];
  for(let chapter=1;chapter<=7;chapter++){
    try{
    await page.selectOption('#chapter',String(chapter));
    await page.locator('#run:enabled').waitFor({timeout:30000});
    await page.click('#run');
    // Fail promptly and print the actual accumulated boot-stage diagnostics.
    try{await page.locator('#run:enabled').waitFor({timeout:90000});}catch(e){console.error('Compiler startup trace:',await page.locator('#output').textContent());throw e;}
    const state=await page.locator('#state').textContent(), output=await page.locator('#output').textContent();
    assert.match(state,/Eksekusi selesai/,'Bab '+chapter+': '+output);
    assert.ok(output.includes(expected[chapter-1]),'Bab '+chapter+': '+output);
    if(chapter===6)assert.ok(output.includes('BRG002\tLabel\t75'),'Bab 6: file read/write not demonstrated');
    console.log('PASS browser C# Bab '+chapter);
    }catch(e){failures.push('Bab '+chapter+': '+e.message);console.error('FAIL browser C#',chapter,e.message);await page.goto(host+'/playground/?bab='+chapter);await page.locator('#run:enabled').waitFor({timeout:30000});}
  }
  for(let chapter=8;chapter<=11;chapter++){
    await page.selectOption('#chapter',String(chapter));
    await page.locator('#run:enabled').waitFor();
    await page.click('#run');await page.locator('#web-lab table').waitFor({timeout:30000});
    if(chapter===8)assert.match(await page.locator('#web-lab').textContent(),/Box Kardus/);
    if(chapter===9||chapter===10){
      for(const [name,value] of Object.entries({kodeBarang:'CI001',namaBarang:'BrowserCI',jumlahStok:'5',kategori:'Testing'}))await page.locator('#web-lab input[name="'+name+'"]').fill(value);
      await page.locator('#web-lab button[type=submit]').click();assert.match(await page.locator('#web-lab tbody').textContent(),/BrowserCI/);
    }
    if(chapter===11){
      await page.selectOption('#method','POST');
      await page.fill('#body',JSON.stringify({kodeBarang:'CI001',namaBarang:'BrowserAPI',jumlahStok:3,kategori:'Testing'}));
      await page.click('#send');assert.match(await page.locator('#response').textContent(),/201/);
      await page.selectOption('#method','GET');await page.click('#send');assert.match(await page.locator('#response').textContent(),/BrowserAPI/);
      await page.selectOption('#method','PUT');await page.fill('#endpoint','/api/barangapi/1');await page.fill('#body',JSON.stringify({kodeBarang:'CI001',namaBarang:'BrowserEdit',jumlahStok:4,kategori:'Testing'}));await page.click('#send');assert.match(await page.locator('#response').textContent(),/204/);
      await page.selectOption('#method','DELETE');await page.click('#send');assert.match(await page.locator('#response').textContent(),/204/);
    }
    console.log('PASS browser SQLite Bab '+chapter);
  }
  await page.setViewportSize({width:390,height:844});await page.reload();
  await page.locator('#run:enabled').waitFor();
  const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:window.innerWidth,elements:[...document.querySelectorAll('body *')].filter(el=>!el.closest('.monaco-editor,.table-scroll')&&el.getBoundingClientRect().right>window.innerWidth+2).slice(0,12).map(el=>({tag:el.tagName,id:el.id,cls:String(el.className).slice(0,80),width:Math.round(el.getBoundingClientRect().width)}))}));
  assert.ok(overflow.width<=overflow.viewport+2,'Mobile horizontal overflow: '+JSON.stringify(overflow));
  console.log('PASS mobile smoke');
  assert.equal(failures.length,0,failures.join('\n'));
}finally{await browser?.close();server.kill();}
