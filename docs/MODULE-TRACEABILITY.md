# Source module traceability — PBO II

Source PDFs were extracted from the published repository artifact. Eleven PDFs have 124 pages and machine-readable text. The table maps numbered practice sections to the teaching projects. The source PDFs remain unchanged. The project uses .NET 10, rather than the older SDK versions in several modules. PDF visual comparison and every essay/explanation have not been independently reviewed.

| Bab | PDF pages | Practice section starts | Runtime evidence and methodological adaptation |
|---|---:|---:|---|
| 1 | 12 | 5 | Class, field, object, constructors, status and array present; interactive input and physical Models separation still need matching. |
| 2 | 9 | 4 | Getter/setter and negative stock rejection; native code throws instead of silently ignoring invalid inputs. |
| 3 | 7 | 3 | Inheritance, base, virtual/override, array; extra BarangMakanan example. |
| 4 | 7 | 3 | Abstract item, chemical and food, interface check; DateOnly used instead of DateTime contract. |
| 5 | 11 | 5 | List, dictionary, predicate and generic search; implicit usings change the old missing-using question. |
| 6 | 13 | 5 | FormatException, stock and duplicate-code exceptions, temporary file read/write. |
| 7 | 13 | 5 | Factory, validation helper, printer interface; physical file separation and input service still needed. |
| 8 | 13 | 6 | MVC, routing, Home, Barang View, shared layout. |
| 9 | 12 | 4 | SQLite entity/context, initial migration, create/read. Older database left intact. |
| 10 | 16 | 4 | ViewModel, server validation, CRUD; client validation and proper folder separation still need matching. |
| 11 | 11 | 4 | Five REST operations and JSON; DELETE uses HTTP 204 rather than original 200, API DTO prevents overposting. Added Swagger and native API studio. |

Original MCQ counts, verified by parsing PDF text: (pre/post) 1 5/5, 2 2/1, 3 2/1, 4 2/1, 5 8/8, 6 8/8, 7 8/0, 8 4/2, 9 4/2, 10 4/2, 11 3/2. Total 82. Bab 7 post-test is essay-only. Preserve PDF wording and answer keys; contextual notes are included where framework assumptions changed.

- Kompatibilitas browser: Bab 3–4 memakai `DateTime`, sesuai kontrak modul Bab 4, karena runtime WebAssembly yang dipangkas tidak menyediakan konstruktor `DateOnly(year, month, day)` lengkap. Format tanggal menggunakan `ToString` eksplisit.
