# Bab 9 — EF Core dan SQLite Migration

`dotnet run --project PraktikumBab09.csproj` menjalankan migrasi awal otomatis ke gudang-migrations.db. Database lama gudang.db dari versi EnsureCreated tidak disentuh. Untuk latihan perubahan skema, instal dotnet-ef 10.0.15, ubah model, buat migration baru dengan dotnet ef migrations add NamaPerubahan, lalu dotnet ef database update. Jangan menghapus database lama tanpa backup. Gunakan Lab__DatabasePath untuk memilih database latihan baru.
