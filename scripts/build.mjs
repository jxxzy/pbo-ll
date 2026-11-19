import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const contentRoot = path.join(root, 'content', 'chapters');
const practiceRoot = path.join(root, 'praktikum');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCode(title, lines) {
  return `<div class="code-block"><div class="code-block-top"><span>${escapeHtml(title)}</span><button class="copy-code" type="button" data-copy-code>Salin kode</button></div><pre><code>${escapeHtml(lines.join('\n'))}</code></pre></div>`;
}

function renderSection(section, index, chapter) {
  const motion = 31 + (((chapter - 1) * 4 + index) % 20);
  const bullets = section.bullets?.length
    ? `<ul class="lesson-bullets">${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';
  const code = section.code?.length ? renderCode(section.codeTitle, section.code) : '';
  const note = section.note ? `<p class="lesson-note">${escapeHtml(section.note)}</p>` : '';

  return `<section class="lesson-section motion-item" data-motion="${motion}" id="topik-${index + 1}"><p class="eyebrow">${String(index + 1).padStart(2, '0')} · MATERI</p><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p>${bullets}${code}${note}</section>`;
}

function renderSolution(solutions = []) {
  if (!solutions.length) return '';
  return `<details class="solution-details" id="solusi-praktikum"><summary>Lihat contoh penyelesaian praktikum</summary><div class="solution-content">${solutions.map((solution) => `<section><h3>${escapeHtml(solution.title)}</h3><p>${escapeHtml(solution.explanation)}</p>${renderCode(solution.codeTitle, solution.code)}</section>`).join('')}</div></details>`;
}

function renderAssessment(name, assessment) {
  if (!assessment) return '';
  const multipleChoice = assessment.multipleChoice?.length
    ? `<div class="assessment-group"><h3>Pilihan ganda</h3>${assessment.multipleChoice.map((item, index) => `<article class="answer-card"><h4>${index + 1}. ${escapeHtml(item.question)}</h4><p class="answer-key"><strong>Jawaban:</strong> ${escapeHtml(item.answer)}</p><p>${escapeHtml(item.explanation)}</p></article>`).join('')}</div>`
    : '';
  const essays = assessment.essay?.length
    ? `<div class="assessment-group"><h3>Esai dan tugas tertulis</h3>${assessment.essay.map((item, index) => `<article class="answer-card"><h4>${index + 1}. ${escapeHtml(item.question)}</h4><p><strong>Contoh jawaban:</strong> ${escapeHtml(item.answer)}</p></article>`).join('')}</div>`
    : '';
  const count = (assessment.multipleChoice?.length || 0) + (assessment.essay?.length || 0);
  return `<details class="assessment-details"><summary>${escapeHtml(name)} · ${count} pembahasan</summary><div class="assessment-content">${multipleChoice}${essays}</div></details>`;
}

function renderAssessments(assessments = {}, isSupplementary = false) {
  const pretest = renderAssessment(
    isSupplementary ? 'Latihan konsep' : 'Pre-test / tugas pendahuluan',
    assessments.pretest,
  );
  const posttest = renderAssessment(
    isSupplementary ? 'Evaluasi konsep' : 'Post-test / laporan praktikum',
    assessments.posttest,
  );
  if (!pretest && !posttest) return '';
  const heading = isSupplementary ? 'Latihan mandiri, lengkap dengan jawaban' : 'Soal modul, sudah dibahas';
  const introduction = isSupplementary
    ? 'Bab ini disusun sebagai materi penghubung karena PDF sumber kosong; latihan berikut merupakan evaluasi tambahan, bukan soal dari PDF.'
    : 'Buka bagian soal untuk melihat jawaban dan alasan singkatnya. Jawaban esai adalah contoh; susun dengan bahasamu sendiri.';
  return `<section class="assessment-section" id="pembahasan-soal"><p class="eyebrow">KUNCI DAN PEMBAHASAN</p><h2>${heading}</h2><p class="assessment-intro">${introduction}</p>${pretest}${posttest}</section>`;
}

function renderSidebar(lessons, currentChapter) {
  const groups = [
    { title: 'Fondasi OOP', subtitle: 'Bab 1–5 · C#', chapters: [1, 2, 3, 4, 5] },
    { title: 'C# Lanjutan', subtitle: 'Bab 6–7 · Desain dan kualitas kode', chapters: [6, 7] },
    { title: 'Aplikasi web', subtitle: 'Bab 8–11 · ASP.NET', chapters: [8, 9, 10, 11] },
  ];

  return `<a class="sidebar-link" href="../index.html#peta-belajar"><span aria-hidden="true">⌘</span> Peta belajar</a>${groups.map((group, groupIndex) => {
    const links = group.chapters.map((chapterNumber) => {
      const lesson = lessons.find((item) => item.chapter === chapterNumber);
      if (lesson.unavailable) {
        return `<a class="chapter-unavailable" href="../index.html#lesson-${chapterNumber}"><span>${String(chapterNumber).padStart(2, '0')}</span> Bab ${chapterNumber} · belum tersedia</a>`;
      }
      const active = lesson.chapter === currentChapter ? ' aria-current="page"' : '';
      return `<a${active} href="../bab-${lesson.chapter}/"><span>${String(lesson.chapter).padStart(2, '0')}</span> ${escapeHtml(lesson.title)}</a>`;
    }).join('');
    return `<details class="chapter-group"${group.chapters.includes(currentChapter) ? ' open' : ''}><summary><span class="summary-index">${String(groupIndex + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(group.title)}</strong><small>${escapeHtml(group.subtitle)}</small></span><span class="summary-arrow">⌄</span></summary>${links}</details>`;
  }).join('')}<a class="sidebar-link" href="../index.html#materi"><span aria-hidden="true">▤</span> Semua materi</a>`;
}

function renderPracticeSteps(steps) {
  return steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
}

function renderQuizOptions(options) {
  return options.map((option, index) => `<label class="quiz-option"><input type="radio" name="answer" value="${index}"><span>${escapeHtml(option)}</span></label>`).join('');
}

function replaceTemplate(template, values) {
  return Object.entries(values).reduce(
    (page, [key, value]) => page.replaceAll(`{{${key}}}`, () => value),
    template,
  );
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of ['index.html', 'app.js', 'chapter.js', 'motion.js', 'styles.css', 'favicon.svg', '.nojekyll']) {
  await cp(path.join(root, file), path.join(output, file));
}

await cp(path.join(root, 'content'), path.join(output, 'content'), {
  recursive: true,
  filter: (sourcePath) => path.resolve(sourcePath) !== path.join(contentRoot, 'template.html'),
});
await cp(path.join(root, 'Materi'), path.join(output, 'Materi'), { recursive: true });
await cp(practiceRoot, path.join(output, 'praktikum'), {
  recursive: true,
  filter: (sourcePath) => {
    const relativePath = path.relative(practiceRoot, sourcePath);
    const segments = relativePath.split(path.sep);
    const fileName = path.basename(sourcePath);
    return !segments.some((segment) => segment === 'bin' || segment === 'obj')
      && !/\.db(?:-wal|-shm|-journal)?$/i.test(fileName)
      && fileName !== 'data_barang.txt';
  },
});
const emptyPdfs = [];
for (const file of await readdir(path.join(output, 'Materi'))) {
  const filePath = path.join(output, 'Materi', file);
  const fileStats = await stat(filePath);
  if (file.toLowerCase().endsWith('.pdf') && fileStats.isFile() && fileStats.size === 0) {
    await rm(filePath);
    emptyPdfs.push(file);
  }
}

const lessons = JSON.parse(await readFile(path.join(contentRoot, 'chapters.json'), 'utf8'));
const template = await readFile(path.join(contentRoot, 'template.html'), 'utf8');

async function listPracticeFiles(directory, relativeDirectory = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listPracticeFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath.split(path.sep).join('/'));
    }
  }
  return files;
}

for (const lesson of lessons) {
  if (lesson.unavailable) continue;

  const chapterId = String(lesson.chapter).padStart(2, '0');
  const practiceDirectory = path.join(output, 'praktikum', `bab-${chapterId}`);
  const files = await listPracticeFiles(practiceDirectory);
  const fileLinks = files
    .map((file) => `<li><a href="${encodeURI(file)}" download>${escapeHtml(file)}</a></li>`)
    .join('');
  const page = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>File Praktikum Bab ${chapterId} · ${escapeHtml(lesson.title)}</title>
  <style>
    body{max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui,sans-serif;color:#172222}
    h1{line-height:1.25}a{color:#087f68}li{margin:8px 0}
    .back{display:inline-block;margin-bottom:16px}
  </style>
</head>
<body>
  <a class="back" href="../../bab-${lesson.chapter}/">← Kembali ke materi Bab ${chapterId}</a>
  <h1>File Praktikum Bab ${chapterId}</h1>
  <p>${escapeHtml(lesson.title)} · Unduh semua file berikut ke satu folder, lalu ikuti petunjuk di README.md.</p>
  <p><a href="../../playground/?bab=${lesson.chapter}">▶ Buka Interactive Coding Playground</a></p>\n  <ul>${fileLinks}</ul>
</body>
</html>`;
  await writeFile(path.join(practiceDirectory, 'index.html'), page, 'utf8');
}

for (const lesson of lessons) {
  if (lesson.unavailable) continue;

  if (lesson.file) {
    const pdfPath = path.join(root, ...lesson.file.split('/'));
    const pdfStats = await stat(pdfPath);
    if (pdfStats.size === 0) {
      throw new Error(`Bab ${lesson.chapter} references an empty PDF: ${lesson.file}`);
    }
  } else if (!lesson.sourceMissing) {
    throw new Error(`Bab ${lesson.chapter} has no PDF and is not marked as supplementary content.`);
  }

  const lessonContent = JSON.parse(await readFile(path.join(contentRoot, `chapter-${lesson.chapter}.json`), 'utf8'));
  const assessments = lessonContent.assessments;
  const hasCompleteAssessments = ['pretest', 'posttest'].every((name) =>
    Array.isArray(assessments?.[name]?.multipleChoice)
    && Array.isArray(assessments?.[name]?.essay)
    && (assessments[name].multipleChoice.length + assessments[name].essay.length) > 0,
  );
  const hasCompleteSolutions = Array.isArray(lessonContent.practice?.solutions)
    && lessonContent.practice.solutions.length > 0
    && lessonContent.practice.solutions.every((solution) =>
      typeof solution.title === 'string'
      && typeof solution.codeTitle === 'string'
      && Array.isArray(solution.code),
    );
  const quiz = lessonContent.quiz;
  const hasValidQuiz = typeof quiz?.question === 'string'
    && typeof quiz.explanation === 'string'
    && Array.isArray(quiz.options)
    && quiz.options.length > 1
    && quiz.options.every((option) => typeof option === 'string')
    && Number.isInteger(quiz.answer)
    && quiz.answer >= 0
    && quiz.answer < quiz.options.length;
  if (!Array.isArray(lessonContent.sections)
    || lessonContent.sections.length === 0
    || !Array.isArray(lessonContent.objectives)
    || lessonContent.objectives.length === 0
    || !hasCompleteSolutions
    || !hasCompleteAssessments
    || !hasValidQuiz) {
    throw new Error(`Bab ${lesson.chapter} is missing lesson content, worked solutions, or assessments.`);
  }

  const availableLessons = lessons.filter((item) => !item.unavailable);
  const position = availableLessons.findIndex((item) => item.chapter === lesson.chapter);
  const previous = availableLessons[position - 1];
  const next = availableLessons[position + 1];
  const previousLink = previous
    ? `<a class="pagination-link previous" href="../bab-${previous.chapter}/"><span>← Bab sebelumnya</span><strong>${escapeHtml(previous.title)}</strong></a>`
    : `<a class="pagination-link previous" href="../index.html#materi"><span>← Kembali</span><strong>Semua materi</strong></a>`;
  const nextLink = next
    ? `<a class="pagination-link next" href="../bab-${next.chapter}/"><span>Bab berikutnya →</span><strong>${escapeHtml(next.title)}</strong></a>`
    : `<a class="pagination-link next" href="../index.html#materi"><span>Selesai</span><strong>Kembali ke dashboard ↑</strong></a>`;
  const sectionList = lessonContent.sections
    .map((section, index) => renderSection(section, index, lesson.chapter))
    .join('');
  const toc = lessonContent.sections.map((section, index) => `<a href="#topik-${index + 1}">${escapeHtml(section.title)}</a>`).join('');
  const pdfHeroLink = lesson.file
    ? `<a class="button button-outline" href="../${escapeHtml(lesson.file)}" target="_blank" rel="noopener">Buka modul PDF <span aria-hidden="true">↗</span></a>`
    : '<span class="button button-outline pdf-unavailable">PDF sumber tidak tersedia</span>';
  const pdfSidebarLink = lesson.file
    ? `<a class="pdf-link" href="../${escapeHtml(lesson.file)}" target="_blank" rel="noopener">Unduh modul PDF ↗</a>`
    : `<p class="pdf-unavailable-note">PDF sumber Bab ${lesson.chapter} kosong. Halaman ini adalah materi penghubung tambahan.</p>`;
  const sourceNotice = lesson.sourceMissing
    ? `<p class="source-notice">Materi penghubung orisinal: PDF sumber Bab ${lesson.chapter} kosong. Isi berikut bukan transkripsi dari PDF.</p>`
    : '';
  const page = replaceTemplate(template, {
    CHAPTER: String(lesson.chapter).padStart(2, '0'),
    DURATION_HOURS: String(lesson.durationHours || 4),
    CATEGORY: escapeHtml(lesson.category),
    TITLE: escapeHtml(lesson.title),
    SUMMARY: escapeHtml(lesson.summary),
    INTRODUCTION: escapeHtml(lessonContent.introduction),
    SOURCE_NOTICE: sourceNotice,
    SIDEBAR_NAV: renderSidebar(lessons, lesson.chapter),
    OBJECTIVES: lessonContent.objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join(''),
    LESSON_SECTIONS: sectionList,
    PRACTICE_TITLE: escapeHtml(lessonContent.practice.title),
    PRACTICE_STEPS: renderPracticeSteps(lessonContent.practice.steps),
    DELIVERABLE: escapeHtml(lessonContent.practice.deliverable),
    PRACTICE_DOWNLOAD_LINK: `<a class="button button-primary" href="../praktikum/bab-${String(lesson.chapter).padStart(2, '0')}/">Unduh file praktikum Bab ${String(lesson.chapter).padStart(2, '0')} <span aria-hidden="true">↓</span></a>`,
    PRACTICE_SOLUTION: renderSolution(lessonContent.practice.solutions),
    ASSESSMENT_SOLUTIONS: renderAssessments(lessonContent.assessments, lesson.sourceMissing),
    ANSWER: String(quiz.answer),
    EXPLANATION: escapeHtml(quiz.explanation),
    QUESTION: escapeHtml(quiz.question),
    QUIZ_OPTIONS: renderQuizOptions(quiz.options),
    TOC_ITEMS: `${toc}<a href="#praktikum">Langkah praktikum</a><a href="#solusi-praktikum">Contoh penyelesaian</a><a href="#pembahasan-soal">Pembahasan soal</a><a href="#cek-pemahaman">Cek pemahaman</a>`,
    PDF_HERO_LINK: pdfHeroLink,
    PDF_SIDEBAR_LINK: pdfSidebarLink,
    PREVIOUS_LINK: previousLink,
    NEXT_LINK: nextLink,
  });
  if (/\{\{[A-Z_]+\}\}/.test(page)) {
    throw new Error(`Unresolved template placeholder found in Bab ${lesson.chapter}.`);
  }

  const pageDirectory = path.join(output, `bab-${lesson.chapter}`);
  await mkdir(pageDirectory, { recursive: true });
  await writeFile(path.join(pageDirectory, 'index.html'), page, 'utf8');
}

await writeFile(
  path.join(output, 'content', 'chapters', 'chapters.js'),
  `window.PBO_LESSONS = ${JSON.stringify(lessons)};\n`,
  'utf8',
);

const skippedPdfs = emptyPdfs.length
  ? ` Skipped empty source PDF(s): ${emptyPdfs.join(', ')}.`
  : '';
console.log(`Built dashboard and ${lessons.filter((lesson) => !lesson.unavailable).length} lesson pages in dist.${skippedPdfs}`);

 // Interactive lab: reuse the copied, filtered original project files.
await cp(path.join(root, 'playground'), path.join(output, 'playground'), { recursive: true });
const labs = [];
for (const lesson of lessons.filter(item => !item.unavailable)) {
  const id = String(lesson.chapter).padStart(2, '0');
  const directory = path.join(output, 'praktikum', 'bab-' + id);
  const files = (await listPracticeFiles(directory)).filter(file => file !== 'index.html').sort();
  if (!files.some(file => file.endsWith('.csproj')) || !files.includes('Program.cs')) {
    throw new Error('Incomplete playground project: ' + id);
  }
  labs.push({ chapter: lesson.chapter, title: lesson.title, files });
}
await writeFile(path.join(output, 'playground', 'manifest.json'), JSON.stringify(labs), 'utf8');
console.log('Built interactive playground for ' + labs.length + ' projects.');
