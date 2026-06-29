# Cashhero — Pahlawan Kelola Keuangan Pribadi

Aplikasi manajemen keuangan pribadi berbasis web (PWA) dengan dukungan multi-mata uang, budget planning, portfolio tracking, dan notifikasi push.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui
- **State:** Zustand v5 + localStorage
- **Backend:** Firebase Auth, Firestore, FCM
- **Bahasa:** Indonesia / English

## Persyaratan

- Node.js 20+
- pnpm (latest)
- Akun Firebase dengan Firestore & FCM diaktifkan

## Setup Lokal

```bash
# 1. Clone repository
git clone https://github.com/<user>/cashhero.git
cd cashhero

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Isi .env.local — lihat penjelasan di bawah

# 5. Jalankan development server
pnpm dev
```

## Environment Variables

| Variable                 | Wajib | Deskripsi                                                                                 |
| ------------------------ | ----- | ----------------------------------------------------------------------------------------- |
| `FCM_SERVICE_ACCOUNT`    | ✅    | Service account JSON (Firebase Admin SDK) — untuk notifikasi push server-side & Firestore |
| `CRON_SECRET`            | ✅    | Secret key untuk melindungi cron endpoint `/api/fcm/send`                                 |
| `NEXT_PUBLIC_FIREBASE_*` | ❌    | Opsional — override konfigurasi Firebase client (fallback ke built-in defaults)           |

### Mendapatkan Service Account

1. Buka [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts
2. Klik "Generate new private key"
3. Copy seluruh JSON ke dalam `FCM_SERVICE_ACCOUNT` di `.env.local` (jadikan satu baris)

### Setup Firestore

1. Firebase Console → Firestore → Create Database
2. Pilih region (recommended: `asia-southeast2`)
3. Pilih "Start in test mode" (atau atur security rules)
4. Collection `fcm_tokens` akan terbuat otomatis saat token didaftarkan

## Scripts

| Perintah         | Deskripsi                      |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Development server (Turbopack) |
| `pnpm dev:clean` | Hapus cache `.next` lalu dev   |
| `pnpm build`     | Build production               |
| `pnpm start`     | Jalankan production server     |
| `pnpm lint`      | ESLint check                   |

## Deployment

### Vercel (recommended)

```bash
pnpm add -g vercel
vercel --prod
```

Pastikan environment variables di-set di dashboard Vercel.

### Self-hosted

```bash
pnpm build
pnpm start  # Jalankan dengan process manager (PM2 / systemd)
```

Pastikan health check endpoint `/api/health` dimonitor oleh load balancer / monitoring tool.

## API Documentation

Dokumentasi lengkap API tersedia dalam format OpenAPI 3.1:

📄 [`docs/openapi.json`](docs/openapi.json)

Bisa dibuka di [Swagger Editor](https://editor.swagger.io/) atau [Stoplight](https://stoplight.io/studio).

### Endpoint Overview

| Method | Endpoint                    | Deskripsi                                        |
| ------ | --------------------------- | ------------------------------------------------ |
| GET    | `/api/health`               | Health check                                     |
| POST   | `/api/auth/verify`          | Verifikasi Firebase ID token                     |
| POST   | `/api/backup/save`          | Backup data user ke Firestore                    |
| POST   | `/api/backup/restore`       | Restore data user dari Firestore                 |
| POST   | `/api/fcm/register`         | Register/unregister FCM token                    |
| GET    | `/api/fcm/send`             | Kirim notifikasi push (cron)                     |
| GET    | `/api/fcm/test`             | Kirim test notifikasi                            |
| GET    | `/api/fcm/recurring/check`  | Cek & kirim notifikasi transaksi berulang (cron) |
| POST   | `/api/fcm/recurring/sync`   | Sync recurring rules ke Firestore                |
| POST   | `/api/fcm/recurring/state`  | Ambil rules untuk token tertentu                 |
| POST   | `/api/fcm/recurring/action` | Handle confirm/skip/reject transaksi berulang    |

## Cron Setup

Dua endpoint membutuhkan cron trigger eksternal (cron-job.org / GitHub Actions):

```
# Notifikasi pagi (07:00) & malam (19:00)
GET /api/fcm/send?type=morning&key=CRON_SECRET
GET /api/fcm/send?type=evening&key=CRON_SECRET

# Audit period end
GET /api/fcm/send?type=audit&key=CRON_SECRET

# Recurring transaction check (setiap 30 menit)
GET /api/fcm/recurring/check?key=CRON_SECRET
```
