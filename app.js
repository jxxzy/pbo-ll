const lessons = window.PBO_LESSONS;
if (!Array.isArray(lessons)) {
  throw new Error('Data materi tidak ditemukan. Jalankan npm run build terlebih dahulu.');
}

const storageKey = 'ruang-kelas-pbo2-progress-v1';
const moduleList = document.querySelector('#module-list');
const searchInput = document.querySelector('#search-input');
const statusFilter = document.querySelector('#status-filter');
const emptyState = document.querySelector('#empty-state');
const moduleCount = document.querySelector('#module-count');
const toast = document.querySelector('#toast');
const sidebar = document.querySelector('#sidebar');
const sidebarBackdrop = document.querySelector('#sidebar-backdrop');
const menuToggle = document.querySelector('#menu-toggle');
const themeToggle = document.querySelector('#theme-toggle');
const focusToggle = document.querySelector('#focus-toggle');
let toastTimeout;

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
    return new Set(parsed.filter((chapter) => lessons.some((lesson) => lesson.chapter === chapter && !lesson.unavailable)));
  } catch {
    showToast('Progres lokal tidak dapat dibaca. Progres baru akan dimulai.');
    return new Set();
  }
}

const completed = loadProgress();

function updateOverview() {
  const availableCount = lessons.filter((lesson) => !lesson.unavailable).length;
  const doneCount = completed.size;
  const percentage = availableCount ? Math.round((doneCount / availableCount) * 100) : 0;
  document.querySelector('#progress-label').textContent = `${percentage}%`;
  document.querySelector('#overall-progress').style.width = `${percentage}%`;
  document.querySelector('#completed-count').textContent = `${doneCount} dari ${availableCount} bab`;
  document.querySelector('.sidebar-progress .progress-track').setAttribute('aria-valuenow', String(percentage));
  document.querySelector('#progress-label-card').textContent = `${percentage}%`;
  document.querySelector('#overall-progress-card').style.width = `${percentage}%`;
  document.querySelector('#completed-count-card').textContent = `${doneCount} dari ${availableCount} bab`;
}

function renderLessons() {
  const query = searchInput.value.trim().toLocaleLowerCase('id');
  const filter = statusFilter.value;
  const visible = lessons.filter((lesson) => {
    const isComplete = completed.has(lesson.chapter);
    const matchesStatus = filter === 'all' || (filter === 'complete' ? isComplete : !isComplete);
    const searchable = `${lesson.chapter} ${lesson.title} ${lesson.category} ${lesson.summary} ${lesson.topics.join(' ')}`.toLocaleLowerCase('id');
    return matchesStatus && searchable.includes(query);
  });

  moduleList.replaceChildren(...visible.map(createLessonCard));
  window.registerMotionItems(moduleList);
  moduleCount.textContent = `${visible.length} dari ${lessons.length} bab`;
  emptyState.hidden = visible.length > 0;
  updateOverview();
}

function createLessonCard(lesson) {
  const isComplete = completed.has(lesson.chapter);
  const card = document.createElement(lesson.unavailable ? 'article' : 'a');
  card.id = `lesson-${lesson.chapter}`;
  card.className = `module-card${isComplete ? ' is-complete' : ''}${lesson.unavailable ? ' is-unavailable' : ''}`;
  card.classList.add('motion-item');
  card.dataset.motion = String(19 + lesson.chapter).padStart(2, '0');
  card.style.setProperty('--motion-delay', `${((lesson.chapter - 1) % 4) * 55}ms`);
  if (!lesson.unavailable) {
    card.href = `bab-${lesson.chapter}/`;
    card.setAttribute('aria-label', `Buka detail Bab ${lesson.chapter}: ${lesson.title}`);
  }

  const marker = document.createElement('span');
  marker.className = 'module-marker';
  marker.textContent = isComplete ? '✓' : String(lesson.chapter).padStart(2, '0');
  marker.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  copy.className = 'module-copy';
  const kicker = document.createElement('div');
  kicker.className = 'module-kicker';
  kicker.append(`BAB ${String(lesson.chapter).padStart(2, '0')}`);
  const tag = document.createElement('span');
  tag.className = `module-tag${lesson.category === 'ASP.NET Core' ? ' web' : ''}`;
  tag.textContent = lesson.category;
  kicker.append(tag);
  if (lesson.sourceMissing) {
    const sourceTag = document.createElement('span');
    sourceTag.className = 'module-tag supplement';
    sourceTag.textContent = 'Materi tambahan · PDF kosong';
    kicker.append(sourceTag);
  }

  const title = document.createElement('h3');
  title.className = 'module-title';
  title.textContent = lesson.title;
  const summary = document.createElement('p');
  summary.className = 'module-summary';
  summary.textContent = lesson.summary;
  copy.append(kicker, title, summary);

  const action = document.createElement('div');
  action.className = 'module-action';
  const time = document.createElement('span');
  time.className = 'module-time';
  time.textContent = lesson.unavailable ? 'Segera hadir' : `${lesson.durationHours || 4} jam`;
  action.append(time);
  if (!lesson.unavailable) {
    const open = document.createElement('span');
    open.className = 'module-open';
    open.textContent = '↗';
    open.setAttribute('aria-hidden', 'true');
    action.append(open);
  }

  card.append(marker, copy, action);
  return card;
}

searchInput.addEventListener('input', renderLessons);
statusFilter.addEventListener('change', renderLessons);
function continueLearning() {
  const nextLesson = lessons.find((lesson) => !lesson.unavailable && !completed.has(lesson.chapter));
  if (nextLesson) {
    window.location.href = `bab-${nextLesson.chapter}/`;
  } else {
    showToast('Hebat! Semua materi yang tersedia sudah selesai.');
  }
}

document.querySelectorAll('[data-continue]').forEach((button) => button.addEventListener('click', continueLearning));
document.querySelector('#continue-button').addEventListener('click', continueLearning);

function setSidebarOpen(isOpen) {
  sidebar.classList.toggle('is-open', isOpen);
  sidebarBackdrop.hidden = !isOpen;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Tutup navigasi' : 'Buka navigasi');
}

menuToggle.addEventListener('click', () => setSidebarOpen(!sidebar.classList.contains('is-open')));
sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));
sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setSidebarOpen(false)));

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
  focusToggle.innerHTML = isFocused ? '<span aria-hidden="true">◎</span> Keluar dari fokus' : '<span aria-hidden="true">◎</span> Mode fokus';
});
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderLessons();
