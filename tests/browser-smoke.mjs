import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const host='http://127.0.0.1:8765';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
let browser;
try{
  for(let i=0;i<50;i++){try{if((await fetch(host)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const expected=['Karton','Validasi berhasil','Biskuit','Risiko:','Dictionary:','Kode barang sudah digunakan','Pemindai Barcode'];
  for(let chapter=1;chapter<=11;chapter++){
    await page.goto(host+'/bab-'+chapter+'/',{waitUntil:'domcontentloaded'});
    await page.locator('a[href*="playground/?bab="]').first().waitFor();
  }
  await page.goto(host+'/playground/?bab=1');
  await page.locator('#run:enabled').waitFor({timeout:30000});
  await page.locator('#monaco-editor .monaco-editor').waitFor({timeout:30000});
  for(let chapter=1;chapter<=7;chapter++){
    await page.selectOption('#chapter',String(chapter));
    await page.locator('#run:enabled').waitFor({timeout:30000});
    await page.click('#run');
    await page.locator('#run:enabled').waitFor({timeout:240000});
    const state=await page.locator('#state').textContent(), output=await page.locator('#output').textContent();
    assert.match(state,/Eksekusi selesai/,'Bab '+chapter+': '+output);
    assert.ok(output.includes(expected[chapter-1]),'Bab '+chapter+': '+output);
    console.log('PASS browser C# Bab '+chapter);
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
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'Mobile horizontal overflow');
  console.log('PASS mobile smoke');
}finally{await browser?.close();server.kill();}
