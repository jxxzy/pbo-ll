# Praktikum Bab 11 — REST API Inventaris

API menggunakan SQLite dan menyediakan GET, POST, PUT, dan DELETE. Data POST/PUT divalidasi melalui DTO `BarangInput`.

```powershell
dotnet run --project PraktikumBab11.csproj
```

Uji `GET /api/barangapi`, `GET /api/barangapi/1`, `POST /api/barangapi`, `PUT /api/barangapi/1`, dan `DELETE /api/barangapi/1`. Gunakan JSON dengan `Content-Type: application/json`.

## REST API Studio

Buka URL root port 5011 untuk dashboard CRUD dan API tester asli; Swagger UI tersedia di /swagger/index.html, OpenAPI di /openapi/v1.json dan health di /health. GET daftar dapat menggunakan search, sort=id|nama|stok, page dan pageSize. Jalankan server di terminal terpisah; Ctrl+C menghentikan server. HTTPS mati secara default karena proxy Codespaces menangani TLS; set Lab__RedirectHttps=true hanya pada lingkungan HTTPS yang terkonfigurasi. Port Codespaces harus tetap private.
