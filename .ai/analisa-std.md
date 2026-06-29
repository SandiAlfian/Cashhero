# RULES: Industry Standard Audit — Production Readiness

## ANALISA (jalankan sebelum eksekusi)

1. Baca seluruh struktur proyek yang ada
2. Identifikasi stack, framework, dan pola arsitektur yang digunakan
3. Jangan rekomendasikan perubahan jika standar sudah terpenuhi — catat sebagai "PASS"
4. Laporkan:
   - Skor kesiapan per kategori (PASS / WARNING / FAIL)
   - Temuan kritis yang memblokir deploy
   - Temuan non-kritis yang disarankan diperbaiki
   - File yang terpengaruh
   - Perubahan yang diperlukan
   - Langkah verifikasi

## EKSEKUSI

### Arsitektur & Struktur Kode

- Separation of concerns diterapkan (controller / service / model / view tidak bercampur logika)
- Tidak ada hardcoded credential, URL, atau konfigurasi environment di source code
- Environment variable menggunakan `.env` dan tidak di-commit ke repository
- Tidak ada dead code, fungsi unused, atau file orphan di production build
- Dependency tidak mengandung package yang sudah deprecated atau unmaintained

### Keamanan (Security)

- Semua input user divalidasi dan di-sanitasi di sisi server
- Tidak ada SQL injection, XSS, atau CSRF vulnerability
- Autentikasi menggunakan token-based (JWT / session) dengan expiry yang wajar
- Password tidak disimpan plaintext — wajib di-hash (bcrypt / argon2)
- HTTP header keamanan aktif: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`
- Rate limiting diterapkan pada endpoint publik dan endpoint autentikasi
- CORS dikonfigurasi spesifik — tidak menggunakan wildcard `*` di production
- Dependency audit bersih: tidak ada CVE severity high/critical (`npm audit` / `composer audit`)

### Performa & Beban

- Response time API endpoint utama ≤ 500ms pada kondisi normal
- Query database menggunakan index pada kolom yang sering di-filter atau di-join
- Tidak ada N+1 query problem
- Asset statis menggunakan caching header yang tepat (`Cache-Control`, `ETag`)
- Payload response tidak mengirim field yang tidak dibutuhkan client
- Tidak ada blocking operation di main thread / event loop

### Keandalan (Reliability)

- Semua operasi async menggunakan error handling yang eksplisit — tidak ada unhandled promise rejection
- Endpoint kritis memiliki fallback atau graceful degradation
- Log error ditulis ke sistem logging — tidak hanya `console.log`
- Tidak ada proses yang crash tanpa recovery (gunakan process manager: PM2 / systemd)
- Database connection menggunakan connection pool dengan batas yang terdefinisi

### Skalabilitas

- Aplikasi bersifat stateless — session tidak disimpan di memory lokal server
- File upload tidak disimpan di server lokal — gunakan object storage (S3 / GCS / R2)
- Job berat (email, export, notifikasi massal) diproses via queue — tidak di request cycle
- Konfigurasi dapat diubah via environment tanpa rebuild

### Pengujian & Kualitas

- Fungsi bisnis kritis memiliki unit test
- Endpoint API memiliki integration test minimal untuk happy path dan edge case
- Tidak ada test yang di-skip permanen tanpa alasan terdokumentasi
- Linting dan formatter berjalan bersih tanpa error

### Deployment & Operasional

- CI/CD pipeline aktif — tidak ada deploy manual ke production
- Build production tidak menyertakan devDependencies atau source map yang terekspos
- Health check endpoint tersedia (`/health` atau `/ping`)
- Rollback strategy terdefinisi
- Backup database terjadwal dan pernah diuji restore-nya
- Monitoring dan alerting aktif untuk error rate dan downtime

### Dokumentasi

- README mencakup: cara setup lokal, environment variable yang dibutuhkan, cara deploy
- Endpoint API terdokumentasi (Postman collection / OpenAPI / komentar inline)
- Perubahan breaking change dicatat di CHANGELOG

## DEFINISI SIAP DEPLOY

- [ ] Tidak ada temuan FAIL di kategori Keamanan
- [ ] Tidak ada temuan FAIL di kategori Arsitektur
- [ ] Performa endpoint utama dalam batas wajar
- [ ] Error handling eksplisit di seluruh alur kritis
- [ ] Environment variable tidak bocor ke client atau repository
- [ ] CI/CD aktif dan build production bersih
- [ ] Health check endpoint tersedia
- [ ] Tidak ada dependency dengan CVE high/critical
