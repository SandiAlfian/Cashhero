# Changelog

## [0.1.0] - 2026-06-29

### Added

- Inisialisasi project Cashhero
- Dashboard manajemen keuangan pribadi
- Pencatatan transaksi (pemasukan/pengeluaran)
- Portfolio tracking multi-mata uang
- Budget planning & saving goals
- Piutang / receivables tracking
- Statistik & financial health score
- Kalender transaksi
- Notifikasi push (FCM) dengan cron scheduling
- Transaksi berulang (recurring rules) dengan konfirmasi notifikasi
- Backup & restore ke Firestore
- PWA support (service worker, manifest)
- Dark/light/system theme
- Bilingual (id/en)
- Security PIN / biometric screen lock

### Security

- HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Rate limiting pada seluruh API routes
- Health check endpoint (`/api/health`)
- Input validation dengan Zod pada semua API POST routes
- Structured logging dengan `logger` utility (tidak hanya console.error)

### Fixed

- Empty catch blocks pada recurring notification handler — error sekarang tercatat
- Type error `fcm_options` → `fcmOptions` pada FCM send route (build failure)

### Changed

- `sharp` dipindahkan ke production dependencies
- README diperbarui dengan dokumentasi setup lengkap
- `console.error` diganti dengan structured logger di seluruh API routes & firebase-admin

### Added

- Middleware rate limiting (60 req/min default, 10 req/min auth)
- Error boundary (`error.tsx` + `global-error.tsx`)
- CI workflow (GitHub Actions — lint + build on push/PR)
- Testing framework (Vitest) dengan 36 unit test (validation + format + dashboard)
- Prettier config + Husky + lint-staged (pre-commit hooks)
- PM2 ecosystem config (`ecosystem.config.js`)
- Sentry error monitoring (client + server + edge)
- OpenAPI 3.1 documentation (`docs/openapi.json`)
