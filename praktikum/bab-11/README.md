# Praktikum Bab 11 — REST API Inventaris

API menggunakan SQLite dan menyediakan GET, POST, PUT, dan DELETE. Data POST/PUT divalidasi melalui DTO `BarangInput`.

```powershell
dotnet run --project PraktikumBab11.csproj
```

Uji `GET /api/barangapi`, `GET /api/barangapi/1`, `POST /api/barangapi`, `PUT /api/barangapi/1`, dan `DELETE /api/barangapi/1`. Gunakan JSON dengan `Content-Type: application/json`.
