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
  if (savedTheme === 'light' || savedTheme === 'dark') applyTheme(savedTheme);
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
