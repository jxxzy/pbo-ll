# Belajar PBO II — Pemrograman Berorientasi Objek

Situs pembelajaran statis berbahasa Indonesia untuk materi C#, OOP, ASP.NET Core MVC, Entity Framework Core, dan REST API. Materi, aset, tampilan, interaksi, dan proses build dipisahkan agar root repository tetap mudah dirawat.

## Fitur belajar

- Dashboard responsif dengan jalur belajar dan navigasi bab.
- Pencarian materi (`/`), filter progres, mode terang/gelap, dan mode fokus.
- Halaman belajar untuk seluruh Bab 1–11: tujuan, ringkasan materi, contoh kode, langkah praktikum, serta contoh penyelesaian.
- Pembahasan pre-test, post-test, esai, dan tugas dari sembilan PDF yang tersedia; Bab 6–7 memiliki latihan tambahan berjawaban.
- Kuis interaktif, navigasi antar bab, salin kode, tautan PDF, serta progres lokal yang tersimpan di browser.
- Workflow GitHub Actions untuk build dan deploy otomatis ke GitHub Pages.

## Struktur repository

```text
content/
  chapters/
    chapters.json          Metadata dan daftar materi
    chapter-N.json         Materi, praktikum, solusi, kuis, dan pembahasan soal
    template.html          Template halaman belajar
Materi/                    Modul praktikum PDF
scripts/build.mjs          Build situs statis ke dist/
.github/workflows/         Workflow GitHub Pages
app.js                     Interaksi dashboard
chapter.js                 Interaksi halaman belajar
styles.css                 Tampilan dan layout responsif
index.html                 Shell halaman utama
dist/                      Dashboard dan halaman bab hasil build, tidak disimpan di Git
```

## Build dan preview lokal

Persyaratan: Node.js 22+.

```powershell
npm ci
npm run build
python -m http.server 8000 --directory dist
```

Buka `http://localhost:8000`.

Build menghasilkan dashboard dan sebelas halaman bab di `dist/`. Bab 6 dan 7 memiliki materi penghubung orisinal karena PDF sumbernya kosong; materi tersebut diberi penanda agar tidak dikira sebagai transkripsi PDF.

## Deploy ke GitHub Pages

1. Push repository ke branch `main`.
2. Pada GitHub, buka **Settings → Pages** dan pilih **GitHub Actions** sebagai sumber deploy.
3. Workflow **Deploy learning site to GitHub Pages** akan membangun folder `dist/` dan menerbitkannya setiap ada push ke `main`.
4. URL aktif tersedia di **Settings → Pages** atau hasil workflow pada tab **Actions**.

Jalur aset relatif sehingga dapat dipublikasikan di root domain maupun URL repository GitHub Pages.

## Ketersediaan materi

Bab 1–5 dan 8–11 memiliki modul PDF yang dapat dibuka dari halaman materi. PDF Bab 6 dan 7 kosong (0 byte), sehingga build tidak menerbitkannya sebagai aset unduhan; halaman penghubung tambahan membahas exception handling/file I/O dan LINQ/async-await serta menjelaskan keterbatasan sumbernya. Seluruh PDF yang tersedia memiliki pembahasan pre-test, post-test, dan contoh penyelesaian praktikum di halaman bab.
