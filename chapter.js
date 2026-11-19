const lessons = window.PBO_LESSONS;
if (!Array.isArray(lessons)) {
  throw new Error('Data materi tidak ditemukan. Jalankan npm run build terlebih dahulu.');
}

const storageKey = 'ruang-kelas-pbo2-progress-v1';
const chapterNumber = Number(document.body.dataset.chapter);
const themeToggle = document.querySelector('#theme-toggle');
const focusToggle = document.querySelector('#focus-toggle');
const toast = document.querySelector('#toast');
const sidebar = document.querySelector('#sidebar');
const sidebarBackdrop = document.querySelector('#sidebar-backdrop');
const menuToggle = document.querySelector('#menu-toggle');
const markCompleteButton = document.querySelector('#mark-complete');
const completionTitle = document.querySelector('#completion-title');
const completionDescription = document.querySelector('#completion-description');
const chapterStatus = document.querySelector('#chapter-status');
let toastTimeout;
let quizPassed = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function loadProgress() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return new Set();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.some((value) => !Number.isInteger(value))) {
      throw new Error('Format progres tidak valid.');
    }
    return new Set(parsed.filter((number) =>
      lessons.some((lesson) => lesson.chapter === number && !lesson.unavailable),
    ));
  } catch {
    showToast('Progres lokal tidak dapat dibaca. Progres baru akan dimulai.');
    return new Set();
  }
}

const completed = loadProgress();

function updateProgress() {
  const availableCount = lessons.filter((lesson) => !lesson.unavailable).length;
  const doneCount = completed.size;
  const percentage = availableCount ? Math.round((doneCount / availableCount) * 100) : 0;
  document.querySelector('#progress-label').textContent = `${percentage}%`;
  document.querySelector('#overall-progress').style.width = `${percentage}%`;
  document.querySelector('#overall-progress-track').setAttribute('aria-valuenow', String(percentage));
  document.querySelector('#completed-count').textContent = `${doneCount} dari ${availableCount} bab`;
}

function updateChapterStatus() {
  const isComplete = completed.has(chapterNumber);
  chapterStatus.textContent = isComplete ? 'Selesai' : 'Belum selesai';
  completionTitle.textContent = isComplete ? 'Bab ini sudah selesai' : 'Selesaikan bab ini';
  completionDescription.textContent = isComplete
    ? 'Progres tersimpan di browser ini. Kamu bisa melanjutkan ke bab berikutnya.'
    : 'Jawab cek pemahaman dengan benar untuk menandai bab selesai.';
  markCompleteButton.textContent = isComplete ? 'Bab selesai ✓' : 'Tandai selesai';
  markCompleteButton.disabled = isComplete || !quizPassed;
  updateProgress();
}

function saveProgress() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...completed].sort((a, b) => a - b)));
  } catch {
    showToast('Bab terjawab benar, tetapi progres tidak dapat disimpan di browser.');
  }
  updateChapterStatus();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeToggle.textContent = isDark ? '☼' : '☾';
  themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  themeToggle.title = isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
}

try {
  const savedTheme = window.localStorage.getItem('ruang-kelas-theme');
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
} catch {
  showToast('Preferensi tampilan tidak dapat dibaca dari browser.');
}

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try {
    window.localStorage.setItem('ruang-kelas-theme', theme);
  } catch {
    showToast('Tampilan berubah, tetapi preferensi tidak dapat disimpan.');
  }
});

focusToggle.addEventListener('click', () => {
  const isFocused = document.body.classList.toggle('focus-mode');
  focusToggle.setAttribute('aria-pressed', String(isFocused));
  focusToggle.innerHTML = isFocused
    ? '<span aria-hidden="true">◎</span> Keluar dari fokus'
    : '<span aria-hidden="true">◎</span> Mode fokus';
});

function setSidebarOpen(isOpen) {
  sidebar.classList.toggle('is-open', isOpen);
  sidebarBackdrop.hidden = !isOpen;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Tutup navigasi' : 'Buka navigasi');
  if (isOpen) {
    window.requestAnimationFrame(() => sidebar.querySelector('input, a[href], summary')?.focus());
  }
}

menuToggle.addEventListener('click', () => setSidebarOpen(!sidebar.classList.contains('is-open')));
sidebarBackdrop.addEventListener('click', () => {
  setSidebarOpen(false);
  menuToggle.focus();
});
sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  setSidebarOpen(false);
  const destination = new URL(link.href);
  if (destination.origin === window.location.origin
    && destination.pathname === window.location.pathname
    && destination.hash) {
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    }
  }
}));

document.addEventListener('keydown', (event) => {
  if (!sidebar.classList.contains('is-open') || !window.matchMedia('(max-width: 780px)').matches) return;
  if (event.key === 'Escape') {
    setSidebarOpen(false);
    menuToggle.focus();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary')]
    .filter((element) => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const quizBox = document.querySelector('#quiz-box');
const quizFeedback = document.querySelector('#quiz-feedback');
document.querySelector('#quiz-submit').addEventListener('click', () => {
  const selected = quizBox.querySelector('input[name="answer"]:checked');
  if (!selected) {
    quizFeedback.textContent = 'Pilih satu jawaban terlebih dahulu.';
    quizFeedback.className = 'quiz-feedback is-error';
    return;
  }

  if (Number(selected.value) === Number(quizBox.dataset.answer)) {
    quizPassed = true;
    quizFeedback.textContent = `Tepat. ${quizBox.dataset.explanation}`;
    quizFeedback.className = 'quiz-feedback is-correct';
    markCompleteButton.disabled = completed.has(chapterNumber);
  } else {
    quizPassed = false;
    quizFeedback.textContent = 'Belum tepat. Coba baca kembali materi, lalu pilih jawaban lain.';
    quizFeedback.className = 'quiz-feedback is-error';
    markCompleteButton.disabled = true;
  }
});

markCompleteButton.addEventListener('click', () => {
  completed.add(chapterNumber);
  saveProgress();
  showToast('Progres bab berhasil disimpan.');
});

document.querySelectorAll('[data-copy-code]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.closest('.code-block').querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(code);
      showToast('Kode berhasil disalin.');
    } catch {
      showToast('Clipboard tidak tersedia. Pilih dan salin kode secara manual.');
    }
  });
});

updateChapterStatus();

function updatePracticeEvidence(){
  const target=document.querySelector('#practice-evidence');if(!target)return;
  try{const record=JSON.parse(localStorage.getItem('pbo-practice-v2:'+chapterNumber)||'null');if(record)target.textContent=record.mode+' · '+new Date(record.at).toLocaleString('id-ID');}catch{}
}
updatePracticeEvidence();window.addEventListener('storage',updatePracticeEvidence);window.addEventListener('focus',updatePracticeEvidence);

async function initRecall(){
  const root=document.querySelector('#recall-tests');if(!root)return;
  const make=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e;};
  try{
    const response=await fetch('../content/chapters/chapter-'+chapterNumber+'.json');if(!response.ok)throw Error('Soal belum tersedia');
    const data=await response.json();
    for(const [key,label] of [['pretest','Pre-test'],['posttest','Post-test']]){
      const items=[...(data.assessments[key].multipleChoice||[]),...(data.assessments[key].essay||[])];
      if(!items.length)continue;
      const section=make('section');section.className='recall-box';
      const heading=make('h3',label),status=make('p',''),question=make('p',''),answer=make('textarea'),solution=make('p','');
      answer.rows=3;answer.setAttribute('aria-label','Jawaban '+label);answer.placeholder='Tulis jawabanmu sebelum melihat kunci';
      solution.hidden=true;
      const actions=make('div');actions.className='recall-actions';
      const reveal=make('button','Lihat kunci'),correct=make('button','Jawaban saya tepat'),retry=make('button','Perlu belajar lagi'),reset=make('button','Ulangi latihan');
      for(const b of [reveal,correct,retry,reset]){b.type='button';b.className='button button-outline';actions.append(b);}
      let index=0,score=0,history=[];
      const store='pbo-recall:'+chapterNumber+':'+key;
      try{const saved=JSON.parse(localStorage.getItem(store)||'null');if(saved&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=items.length&&Number.isInteger(saved.score)&&saved.score>=0&&saved.score<=saved.index){index=saved.index;score=saved.score;history=Array.isArray(saved.history)?saved.history:[];}}catch{}
      function save(){try{localStorage.setItem(store,JSON.stringify({index,score,history}));}catch{}}
      function render(){
        status.textContent=index+' / '+items.length+' soal dijawab · '+score+' dinilai tepat';
        const done=index>=items.length;question.textContent=done?'Sesi selesai. Ulangi jika ingin berlatih lagi.':items[index].question;
        answer.value='';answer.hidden=done;solution.hidden=true;solution.textContent='';
        reveal.disabled=done;correct.disabled=true;retry.disabled=true;
      }
      reveal.onclick=()=>{if(index>=items.length)return;if(!answer.value.trim()){status.textContent='Tulis jawabanmu sebelum melihat kunci.';return;}solution.textContent='Kunci: '+items[index].answer+(items[index].explanation?' — '+items[index].explanation:'');solution.hidden=false;correct.disabled=false;retry.disabled=false;reveal.disabled=true;};
      function next(ok){if(index>=items.length||solution.hidden)return;history.push({question:items[index].question,answer:answer.value,correct:ok});if(ok)score++;index++;save();render();}
      correct.onclick=()=>next(true);retry.onclick=()=>next(false);reset.onclick=()=>{if(confirm('Ulangi '+label+'?')){index=0;score=0;history=[];save();render();}};
      section.append(heading,status,question,answer,solution,actions);root.append(section);render();
    }
  }catch(e){root.textContent='Gagal memuat latihan: '+e.message;}
}
void initRecall();

async function initScoredTests(){
  const root=document.querySelector('#scored-tests');if(!root)return;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  try{
    const response=await fetch('../content/chapters/assessment-bank.json');
    if(!response.ok){root.textContent='Bank pilihan ganda PDF belum tersedia pada build ini; gunakan latihan recall.';return;}
    const bank=await response.json();
    for(const [phase,label] of [['pretest','Pre-test pilihan ganda'],['posttest','Post-test pilihan ganda']]){
      const questions=bank[String(chapterNumber)]?.[phase]||[];
      if(!questions.length)continue;
      const section=make('section');section.className='recall-box';
      const form=make('form'),title=make('h3',label+' • '+questions.length+' soal');
      const feedback=make('p','');feedback.setAttribute('role','status');
      const group=[];
      const resultKey='pbo-mcq-v1:'+chapterNumber+':'+phase;
      let saved=null;try{saved=JSON.parse(localStorage.getItem(resultKey)||'null');}catch{}
      if(saved&&Number.isInteger(saved.score)&&saved.total===questions.length)feedback.textContent='Nilai sebelumnya: '+saved.score+'/'+saved.total+' (latihan lokal).';
      questions.forEach((q,i)=>{
        const fieldset=make('fieldset');const legend=make('legend',(i+1)+'. '+q.question);fieldset.append(legend);
        const order=q.options.map((_,j)=>j);
        for(let k=order.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[order[k],order[j]]=[order[j],order[k]];}
        for(const index of order){const option=make('label');option.className='scored-option';const radio=make('input');radio.type='radio';radio.name=phase+'-'+i;radio.value=String(index);radio.required=true;option.append(radio,make('span',q.options[index]));fieldset.append(option);}
        const explanation=make('p');explanation.hidden=true;explanation.className='scored-explanation';fieldset.append(explanation);form.append(fieldset);group.push({fieldset,explanation,q});
      });
      const submit=make('button','Periksa semua jawaban');submit.type='submit';submit.className='button button-primary';
      const reset=make('button','Ulangi');reset.type='button';reset.className='button button-outline';
      reset.onclick=()=>{form.reset();group.forEach(({explanation})=>{explanation.hidden=true;});feedback.textContent='Jawab semua soal terlebih dahulu.';};
      form.onsubmit=e=>{
        e.preventDefault();let score=0;
        for(const {fieldset,explanation,q} of group){
          const choice=fieldset.querySelector('input:checked');const correct=choice&&Number(choice.value)===q.answer;if(correct)score++;
          explanation.hidden=false;explanation.textContent=(correct?'Benar. ':'Belum tepat. ')+'Kunci modul: '+q.options[q.answer]+(q.note?' '+q.note:'');
        }
        feedback.textContent='Skor: '+score+'/'+questions.length+' ('+Math.round(score/questions.length*100)+'%). Simulasi latihan, bukan nilai resmi.';
        try{localStorage.setItem(resultKey,JSON.stringify({score,total:questions.length,at:new Date().toISOString()}));}catch{}
      };
      form.append(submit,reset);section.append(title,form,feedback);root.append(section);
    }
  }catch(e){root.textContent='Bank soal tidak dapat dimuat: '+e.message;}
}
void initScoredTests();
