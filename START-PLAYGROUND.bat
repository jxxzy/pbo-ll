@echo off
setlocal
cd /d "%~dp0" || exit /b 1
title PBO II Interactive Coding Playground
echo ==================================================
echo PBO II - Interactive Coding Playground
echo ==================================================
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js 22+ belum terinstal atau belum masuk PATH.
  goto :failed
)
node -e "if(Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo ERROR: Gunakan Node.js versi 22 atau lebih baru.
  goto :failed
)
where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm tidak ditemukan.
  goto :failed
)
where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Instal Docker Desktop terlebih dahulu.
  goto :failed
)
docker info --format "{{.OSType}}" >nul 2>&1
if errorlevel 1 (
  echo ERROR: Jalankan Docker Desktop dan pastikan engine siap.
  goto :failed
)
docker info --format "{{.OSType}}" | findstr /x /i "linux" >nul
if errorlevel 1 (
  echo ERROR: Ubah Docker Desktop ke Linux containers.
  goto :failed
)
echo [1/3] Menyiapkan dependensi website...
call npm ci
if errorlevel 1 goto :failed
echo [2/3] Menyiapkan image .NET 10...
docker build -f runner/Dockerfile -t pbo2-lab:net10 .
if errorlevel 1 goto :failed
echo [3/3] Menjalankan website...
echo Buka http://127.0.0.1:8787/playground/
echo Biarkan jendela ini terbuka. Tekan Ctrl+C untuk berhenti.
call npm run playground
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo Gagal menjalankan playground. Periksa pesan di atas.
pause
exit /b 1
