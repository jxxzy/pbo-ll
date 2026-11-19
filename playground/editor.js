'use strict';
(()=>{
  const textarea=document.getElementById('editor'), host=document.getElementById('monaco-editor');
  if(typeof window.require!=='function')return;
  let editor, model, currentKey='', changing=false, pending;
  const models=new Map();
  const language=file=>({cs:'csharp',cshtml:'html',html:'html',css:'css',js:'javascript',json:'json',md:'markdown',csproj:'xml'})[file.split('.').pop()]||'plaintext';
  function show(file,code,chapter){
    pending={file,code,chapter};if(!editor)return;
    const key=chapter+'/'+file;changing=true;
    try{
      if(!models.has(key))models.set(key,monaco.editor.createModel(code,language(file),monaco.Uri.parse('inmemory://pbo/'+key)));
      model=models.get(key);
      if(model.getValue()!==code)model.setValue(code);
      if(currentKey!==key){editor.setModel(model);currentKey=key;}
    }finally{changing=false;}
  }
  window.PBOEditor={
    show,
    setReadOnly:readOnly=>editor?.updateOptions({readOnly}),
    setFont:fontSize=>{textarea.style.fontSize=fontSize+'px';editor?.updateOptions({fontSize});},
    theme:theme=>editor&&monaco.editor.setTheme(theme==='light'?'vs':'vs-dark'),
    format:async()=>{if(!editor)return;const action=editor.getAction('editor.action.formatDocument');if(action?.isSupported())await action.run();else document.getElementById('state').textContent='Formatter untuk bahasa ini belum tersedia.';},
    diagnostics:(file,diagnostics,chapter,prefix=0)=>{
      const m=models.get(chapter+'/'+file);if(!m)return;
      const markers=diagnostics.map(d=>{const start=m.getPositionAt(Math.max(0,(d.location?.start||0)-prefix)),end=m.getPositionAt(Math.max(0,(d.location?.end??d.location?.start??0)-prefix));return {startLineNumber:start.lineNumber,startColumn:start.column,endLineNumber:end.lineNumber,endColumn:Math.max(start.lineNumber===end.lineNumber?start.column+1:1,end.column),message:d.id+': '+d.message,severity:d.severity==='Error'?monaco.MarkerSeverity.Error:monaco.MarkerSeverity.Warning};});
      monaco.editor.setModelMarkers(m,'pbo-roslyn',markers);
    }
  };
  window.require.config({paths:{vs:new URL('vendor/monaco/min/vs',location.href).href}});
  window.require(['vs/editor/editor.main'],()=>{
    editor=monaco.editor.create(host,{model:null,theme:document.documentElement.dataset.theme==='light'?'vs':'vs-dark',automaticLayout:true,minimap:{enabled:false},fontSize:14,tabSize:4,wordWrap:'off',scrollBeyondLastLine:false,ariaLabel:'Editor source code PBO II'});
    editor.onDidChangeModelContent(()=>{if(changing||!model)return;textarea.value=model.getValue();textarea.dispatchEvent(new Event('input'));});
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>{const run=document.getElementById('run');if(!run.disabled)run.click();});
    host.hidden=false;textarea.hidden=true;document.getElementById('editor-format').disabled=false;if(pending)show(pending.file,pending.code,pending.chapter);editor.layout();window.dispatchEvent(new Event('pbo:editor-ready'));
  },()=>{textarea.hidden=false;host.hidden=true;});
})();
