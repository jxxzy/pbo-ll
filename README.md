# Belajar PBO II — Pemrograman Berorientasi Objek

Situs pembelajaran statis berbahasa Indonesia untuk materi C#, OOP, ASP.NET Core MVC, Entity Framework Core, dan REST API. Materi, aset, tampilan, interaksi, dan proses build dipisahkan agar root repository tetap mudah dirawat.

## Fitur belajar

- Dashboard responsif dengan jalur belajar dan navigasi bab.
- Navbar responsif dengan shortcut, penanda section aktif, dan indikator progres scroll.
- 80 animasi masuk bertahap yang menghormati preferensi reduced motion perangkat.
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

## Interactive Coding Playground (Bab 1–11)

### Windows: jalankan dengan satu klik

Setelah menginstal Node.js 22+ dan Docker Desktop (Linux containers), buka Docker Desktop hingga engine siap. Klik dua kali `START-PLAYGROUND.bat` di root repository atau jalankan dari terminal. Launcher memeriksa versi Node.js, npm, dan Docker, membangun image .NET 10 menggunakan cache Docker bila tersedia, menginstal dependensi, lalu menjalankan server dan menampilkan alamat playground. Buka http://127.0.0.1:8787/playground/; pertahankan jendela terminal selama menggunakan playground. Tekan Ctrl+C untuk berhenti. Launcher tidak mengubah branch atau melakukan git pull otomatis.

### Cara manual

Buka [Playground GitHub Pages](https://jxxzy.github.io/pbo-ll/playground/) untuk membaca, mengedit, menyimpan draft lokal, menyalin dan mengunduh source asli. GitHub Pages dapat menjalankan C# console Bab 1–7 di browser melalui Roslyn/WebAssembly (WasmSharp 0.10.2 yang dikemas saat deploy). Runtime dimuat dalam dedicated Web Worker yang dihentikan saat Stop atau timeout; file sementara Bab 6 mengikuti filesystem virtual browser. Mode ini belum mendukung stdin, custom csproj, atau server ASP.NET Core. Jangan menjalankan source yang tidak dipercaya. Untuk seluruh fitur dan Bab 8–11 gunakan runner lokal (Node.js 22+, Git, Docker Desktop atau Docker Engine dengan Linux containers):

```powershell
git clone https://github.com/jxxzy/pbo-ll.git
cd pbo-ll
docker build -f runner/Dockerfile -t pbo2-lab:net10 .
npm run playground
```

Buka http://127.0.0.1:8787/playground/ (gunakan alamat ini, bukan localhost). Image menyiapkan cache paket .NET 10/EF Core. Pilih Bab 1–7, edit C#, masukkan stdin bila perlu dan Run; terminal menunjukkan output asli. Bab 8–10 membuka MVC melalui link preview; Bab 11 menyediakan pengujian GET/POST/PUT/DELETE. File SQLite terisolasi per container dan dihapus ketika dihentikan; unduh perubahan source sebelum menghapus storage browser. File csproj harus asli untuk eksekusi. Tidak ada compiler online publik.

Runner hanya bind ke 127.0.0.1; jangan publish port 8787 atau meneruskan melalui tunnel. Docker membatasi CPU, RAM, proses, waktu dan akses file; console tidak memiliki jaringan, web menggunakan jaringan Docker biasa (dapat mengakses jaringan keluar). Ini alat latihan lokal untuk kode tepercaya, bukan sandbox multi-tenant atau layanan publik. Timeout console 60 detik, web 10 menit. Stop sebelum mengganti bab. Jika runner gagal, cek Docker Desktop dan build image ulang setelah update project.

Compiler browser: [WasmSharp](https://github.com/JakeYallop/WasmSharp), Apache-2.0. Build statis biasa tanpa paket runtime tetap menyediakan editor; GitHub Actions mengemas versi runtime yang dipin.

### Semua bab melalui browser

GitHub Pages: Bab 1–7 menggunakan compiler Roslyn/WASM; Bab 8–11 menyediakan latihan versi browser dengan SQLite WebAssembly (sql.js 1.13.0), alur MVC, Create/Read, CRUD, dan pengujian respons API. Data bersifat sementara, dapat diunduh sebagai file SQLite. **Mode Bab 8–11 tidak mengompilasi source C# atau menjalankan server HTTP sungguhan.** Perubahan source editor tidak memengaruhi lab browser.

Untuk menjalankan project asli Bab 1–11 tanpa instalasi lokal, buka [GitHub Codespaces](https://github.com/codespaces/new?hide_repo_select=true&repo=1463545184&ref=main). Konfigurasi devcontainer menyiapkan .NET 10 dan Node.js 22. Dari terminal:

```bash
bash scripts/run-cloud-lab.sh 8
```

Ganti angka 8 dengan bab yang diminta. Gunakan tab Ports untuk membuka port 5008–5011; Bab 11 memiliki route /api/barangapi. Pertahankan port private dan hentikan Codespace setelah belajar. GitHub login, kuota dan ketersediaan Codespaces diperlukan. Ini menjalankan source ASP.NET asli di lingkungan cloud pribadi, bukan layanan compiler publik. Source dapat diedit di VS Code browser sebelum run.

### Learning Studio V2 — editor dan native API

`npm run assets` membundel runtime browser dan Monaco/JSZip ke dist. `npm run playground` menjalankan build, assets dan runner lokal. Editor memiliki fallback textarea jika Monaco tidak tersedia, syntax highlighting, line numbers, ZIP import/export (daftar file harus sama), snapshot tunggal, catatan, tema, fullscreen dan export output. Formatter hanya aktif untuk bahasa yang Monaco dukung; bukan C# language server penuh. SQLite lab Bab 9–11 menyimpan data lokal bila kuota mencukupi.

Codespaces: `bash scripts/start-cloud-studio.sh` menjalankan empat server asli Bab 8–11 sekaligus. Buka port 5008–5011 secara private. Bab 11 mempunyai dashboard asli di root, Swagger UI, OpenAPI dan health. Nama Codespace bisa diisi pada Playground untuk membuat link ke port privat. Perubahan C# di website tidak otomatis diterapkan ke Codespace; edit source di VS Code browser atau import project ZIP secara manual. Ini bukan compiler publik.
