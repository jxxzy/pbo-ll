# Praktikum Bab 9 — EF Core dan SQLite

Aplikasi MVC ini menyimpan barang di `gudang.db`, yang dibuat otomatis saat aplikasi pertama kali dijalankan. Untuk berlatih migration, pasang `Microsoft.EntityFrameworkCore.Design`, instal `dotnet-ef`, lalu jalankan `dotnet ef migrations add InitialCreate` dan `dotnet ef database update`.

```powershell
dotnet run --project PraktikumBab09.csproj
```

Buka URL yang ditampilkan untuk melihat daftar dan menambah barang.
