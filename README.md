# Belajar PBO II — Pemrograman Berorientasi Objek

Situs pembelajaran statis berbahasa Indonesia untuk materi C#, OOP, ASP.NET Core MVC, Entity Framework Core, dan REST API. Materi, aset, tampilan, interaksi, dan proses build dipisahkan agar root repository tetap mudah dirawat.

## Fitur belajar

- Dashboard responsif dengan jalur belajar dan navigasi bab.
- Navbar responsif dengan shortcut, penanda section aktif, dan indikator progres scroll.
- 30 animasi masuk bertahap yang menghormati preferensi reduced motion perangkat.
- Pencarian materi (`/`), filter progres, mode terang/gelap, dan mode fokus.
- Halaman belajar untuk seluruh Bab 1–11: tujuan, ringkasan materi, contoh kode, langkah praktikum, serta contoh penyelesaian.
- File project praktikum C# dan ASP.NET Core yang dapat diunduh terpisah pada setiap halaman bab (`praktikum/bab-01/` sampai `praktikum/bab-11/`).
- Pembahasan pre-test, post-test, esai, dan tugas dari seluruh 11 PDF.
- Kuis interaktif, navigasi antar bab, salin kode, tautan PDF, serta progres lokal yang tersimpan di browser.
- Workflow GitHub Actions untuk build dan deploy otomatis ke GitHub Pages.

## Struktur repository

```text
content/
  chapters/
    chapters.json          Metadata dan daftar materi
    chapter-N.json         Materi, praktikum, solusi, kuis, dan pembahasan soal
    template.html          Template halaman belajar
praktikum/
  bab-N/                   Source project praktikum yang dapat diunduh
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

Persyaratan: Node.js 22+ untuk membangun situs dan .NET 10 SDK untuk menjalankan project praktikum.

```powershell
npm ci
npm run build
python -m http.server 8000 --directory dist
```

Buka `http://localhost:8000`.

Build menghasilkan dashboard dan sebelas halaman bab di `dist/`, termasuk seluruh modul PDF Bab 1–11.

## Menjalankan file praktikum

Setiap halaman bab memiliki tautan **Unduh file praktikum**. Unduh file dalam satu folder dan jalankan petunjuk pada `README.md` di folder tersebut. Praktikum Bab 1–7 adalah console app; Bab 8–10 adalah aplikasi MVC; Bab 11 adalah REST API. Semua project menargetkan .NET 10 LTS. Bab 9–11 memulihkan EF Core/SQLite saat pertama kali dijalankan.

Contoh menjalankan project:

```powershell
dotnet run --project praktikum/bab-01/PraktikumBab01.csproj
dotnet run --project praktikum/bab-08/PraktikumBab08.csproj
```

## Deploy ke GitHub Pages

1. Push repository ke branch `main`.
2. Pada GitHub, buka **Settings → Pages** dan pilih **GitHub Actions** sebagai sumber deploy.
3. Workflow **Deploy learning site to GitHub Pages** akan membangun folder `dist/` dan menerbitkannya setiap ada push ke `main`.
4. URL aktif tersedia di **Settings → Pages** atau hasil workflow pada tab **Actions**.

Jalur aset relatif sehingga dapat dipublikasikan di root domain maupun URL repository GitHub Pages.

## Ketersediaan materi

Seluruh PDF Bab 1–11 dapat dibuka dari halaman materi. Bab 6 membahas exception handling dan File I/O; Bab 7 membahas SOLID, Factory Pattern, dan refactoring. Soal pada setiap modul dibahas, termasuk jawaban esai post-test Bab 7.
