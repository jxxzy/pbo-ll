import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const read=p=>readFile(p,'utf8');
const exists=async p=>(await stat(p)).isFile();
test('all 11 built chapters have valid metadata, projects and PDFs',async()=>{
  const meta=JSON.parse(await read('content/chapters/chapters.json'));
  const labs=JSON.parse(await read('dist/playground/manifest.json'));
  assert.deepEqual(meta.map(x=>x.chapter),Array.from({length:11},(_,i)=>i+1));
  assert.deepEqual(labs.map(x=>x.chapter),meta.map(x=>x.chapter));
  for(const lab of labs){
    assert.ok(lab.files.includes('Program.cs'));
    assert.ok(lab.files.some(x=>x.endsWith('.csproj')));
    const dir='dist/praktikum/bab-'+String(lab.chapter).padStart(2,'0');
    for(const file of lab.files){assert.ok(!file.includes('..'));assert.ok(!/\.db(?:-|$)/.test(file));assert.ok(await exists(path.join(dir,file)));}
    const html=await read('dist/bab-'+lab.chapter+'/index.html');
    assert.match(html,/playground\/\?bab=/);assert.doesNotMatch(html,/\{\{[A-Z_]+\}\}/);
    const chapter=JSON.parse(await read('content/chapters/chapter-'+lab.chapter+'.json'));
    assert.ok(chapter.practice.steps.length>0);assert.ok(chapter.assessments.pretest.essay.length>0);assert.ok(chapter.assessments.posttest.essay.length>0);
    const pdf=await readFile('dist/'+meta.find(x=>x.chapter===lab.chapter).file);
    assert.equal(pdf.subarray(0,4).toString(),'%PDF');
  }
});
test('native Bab 11 dashboard and health assets are present',async()=>{
  assert.ok(await exists('dist/praktikum/bab-11/wwwroot/index.html'));
  const src=await read('praktikum/bab-11/Program.cs');
  assert.match(src,/MapOpenApi/);assert.match(src,/UseSwaggerUI/);assert.match(src,/MapGet\("\/health"/);
});
