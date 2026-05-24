# Aturan Debug Deployment Universal

## Ringkasan
Prosedur debugging profesional untuk error deployment di semua platform dan framework. Aturan ini berlaku untuk proyek web apapun terlepas dari tech stack yang digunakan.

## Prinsip Utama

### 1. Selalu Tes Lokal Terlebih Dahulu
Jangan pernah deploy tanpa build lokal yang sukses.
```bash
# Jalankan perintah build proyek Anda
npm run build
# atau
yarn build
# atau
pnpm run build
```

### 2. Ikuti Alur Kerja Debug yang Sistematis
1. Reproduksi error secara lokal
2. Periksa log build secara sistematis
3. Identifikasi penyebab utama
4. Terapkan perbaikan minimal
5. Verifikasi dan deploy secara bertahap

### 3. Dokumentasikan Semuanya
- Catat pesan error
- Dokumentasikan solusi
- Bagikan dengan tim
- Update dokumentasi proyek

## Checklist Pra-Deployment Universal

### Verifikasi Build
- [ ] Build lokal selesai dengan sukses
- [ ] Tidak ada error kompilasi (warning dapat diterima)
- [ ] Semua tes lulus
- [ ] Linter lulus (atau pelanggaran terdokumentasi)
- [ ] Environment variables tervalidasi
- [ ] Dependencies terkunci

### Kualitas Kode
- [ ] Tidak ada console.log di kode produksi
- [ ] Tidak ada credentials yang hardcoded
- [ ] Kode yang tidak digunakan telah dihapus
- [ ] Types dideklarasikan dengan benar (jika menggunakan TypeScript)
- [ ] Error handling diimplementasikan

## Error Build Umum (Framework Agnostik)

### 1. Masalah Resolusi Module
**Pola Error:** `Module not found`, `Cannot resolve import`

**Solusi Universal:**
- Periksa apakah path import benar
- Verifikasi file ada di lokasi yang ditentukan
- Periksa dependencies di package.json
- Hapus node_modules dan reinstall
- Verifikasi konfigurasi build tool (webpack, vite, dll)

### 2. Environment Variables Hilang
**Pola Error:** `undefined`, `process.env.X not defined`

**Solusi Universal:**
- Tambahkan variabel ke pengaturan platform
- Gunakan `.env.local` untuk development
- Jangan pernah commit file `.env`
- Validasi saat runtime:

```javascript
// Validasi environment universal
const requiredEnvVars = ['API_URL', 'DATABASE_URL']
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})
```

### 3. Masalah Dependencies
**Pola Error:** `Cannot find module`, `Version mismatch`

**Solusi Universal:**
- Hapus node_modules dan package-lock.json
- Reinstall dependencies: `npm install` / `yarn` / `pnpm install`
- Periksa kompatibilitas versi Node.js
- Verifikasi peer dependencies terpenuhi
- Gunakan versi dependencies yang terkunci

### 4. Masalah Memory/Timeout
**Pola Error:** `JavaScript heap out of memory`, `Build timeout`

**Solusi Universal:**
```bash
# Tingkatkan memory Node
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Atau di package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' [your-build-command]"
}
```

### 5. Error Type (Proyek TypeScript)
**Pola Error:** Type mismatch, implicit any, missing types

**Solusi Universal:**
- Aktifkan strict mode di tsconfig.json
- Tambahkan deklarasi type yang eksplisit
- Gunakan package `@types` untuk libraries
- Perbaiki implicit any types
- Jalankan `tsc --noEmit` sebelum build

## Pertimbangan Spesifik Platform

### Platform Hosting Modern Apapun (Vercel, Netlify, AWS, dll)

#### Esensial Konfigurasi Build
- Pastikan perintah build yang benar di pengaturan platform
- Set versi Node.js yang sesuai
- Konfigurasi directory output dengan benar
- Tambahkan environment variables yang dibutuhkan
- Periksa file konfigurasi spesifik platform

#### Langkah Debug Universal untuk Platform Apapun
1. Akses log build platform
2. Verifikasi pengaturan build sesuai dengan lokal
3. Periksa environment variables sudah di-set
4. Review deployment terakhir
5. Tes di environment preview platform

### Deployments Docker/Kubernetes

#### Masalah Build Container
**Solusi Umum:**
- Gunakan multi-stage builds untuk mengurangi ukuran image
- Copy file dependencies terlebih dahulu untuk caching yang lebih baik
- Gunakan versi base image yang spesifik
- Pastikan permission file yang benar
- Periksa batasan resource

#### Masalah Runtime
- Verifikasi networking container
- Periksa volume mounts
- Monitor penggunaan resource
- Review log container
- Tes secara lokal dengan konfigurasi yang sama

### Deployments Server Traditional (AWS EC2, DigitalOcean, dll)

#### Setup Server
- Pastikan versi Node.js yang benar terinstall
- Konfigurasi process manager (PM2, systemd)
- Setup reverse proxy (Nginx, Apache)
- Konfigurasi sertifikat SSL
- Setup monitoring dan logging

#### Masalah Umum
- Konflik port
- Error permission
- System dependencies yang hilang
- Firewall memblokir port
- Resource sistem yang tidak mencukupi

## Alur Kerja Debug Universal

### Langkah 1: Reproduksi Secara Lokal
```bash
# Pendekatan clean slate
rm -rf node_modules dist build .next
rm package-lock.json yarn.lock pnpm-lock.yaml
# Install dependencies
npm install  # atau yarn/pnpm install
# Build
npm run build
```

### Langkah 2: Periksa Log Secara Sistematis
- Output build lokal
- Log build platform
- Log error runtime
- Console browser (untuk frontend)
- Log server (untuk backend)

### Langkah 3: Isolasi Masalah
- Tes komponen/modul spesifik
- Comment out perubahan terbaru
- Binary search melalui commits
- Revert ke versi terakhir yang berfungsi
- Tes dalam isolasi

### Langkah 4: Terapkan Perbaikan Minimal
- Buat perubahan sekecil mungkin
- Tes secara lokal segera
- Jangan perbaiki masalah yang tidak terkait
- Dokumentasikan perubahan
- Commit dengan pesan yang jelas

### Langkah 5: Verifikasi Deployment
- Deploy ke staging/preview terlebih dahulu
- Jalankan smoke tests
- Monitor tingkat error
- Periksa fungsionalitas kunci
- Kemudian deploy ke production

## Verifikasi Pasca-Deployment

### Pengecekan Kritis Universal
- [ ] Build selesai tanpa error
- [ ] Aplikasi berjalan dengan sukses
- [ ] Tidak ada error runtime di log
- [ ] Perjalanan pengguna kunci berfungsi
- [ ] Koneksi API/database berfungsi
- [ ] Environment variables terload
- [ ] Assets loading dengan benar
- [ ] Authentication/authorization berfungsi

### Monitoring Performa (Proyek Apapun)
- Waktu load halaman < 3 detik
- Time to Interactive < 5 detik
- Tidak ada error console
- Responsive design berfungsi di mobile
- Standar aksesibilitas terpenuhi

## Best Practices Universal

### 1. Deployment Bertahap
- Selalu deploy ke staging/preview terlebih dahulu
- Jalankan tes otomatis
- Monitor untuk error
- Dapatkan persetujuan tim untuk production
- Deploy selama periode traffic rendah jika memungkinkan

### 2. Strategi Rollback
- Simpan versi yang berfungsi sebelumnya
- Gunakan feature flags untuk perubahan berisiko
- Siapkan script rollback database
- Dokumentasikan prosedur rollback
- Tes proses rollback secara berkala

### 3. Monitoring & Observability
- Setup error tracking (Sentry, Rollbar, dll)
- Implementasikan monitoring performa
- Konfigurasi monitoring uptime
- Setup alerting untuk masalah kritis
- Monitor channel feedback pengguna

### 4. Dokumentasi
- Dokumentasikan prosedur deployment
- Pertahankan changelog
- Catat masalah yang diketahui dan solusinya
- Bagikan pelajaran yang dipelajari dengan tim
- Pertahankan runbooks yang terupdate

### 5. Keamanan
- Jangan pernah commit secrets/credentials
- Rotasi API keys secara berkala
- Gunakan environment variables untuk config
- Implementasikan authentication yang benar
- Pertahankan dependencies yang terupdate

## Prosedur Darurat

### Kegagalan Build
1. Periksa commits terakhir untuk perubahan yang merusak
2. Verifikasi dependencies tidak berubah secara tak terduga
3. Periksa konfigurasi environment variables
4. Revert ke commit terakhir yang diketahui baik jika diperlukan
5. Hubungi support platform jika masalah platform

### Error Runtime (Kritis)
1. Periksa log error segera
2. Evaluasi dampak dan urgensi pengguna
3. Jika masalah kritis, rollback segera
4. Investigasi di environment staging
5. Deploy perbaikan ketika siap dan diuji

### Degradasi Performa
1. Periksa dashboard monitoring
2. Identifikasi bottleneck spesifik
3. Scale resource jika diperlukan
4. Optimalkan query kode/database
5. Monitor erat setelah perubahan

### Insiden Keamanan
1. Identifikasi ruang lingkup dan dampak
2. Rotasi credentials yang dikompromikan
3. Patch kerentanan segera
4. Komunikasikan dengan stakeholders
5. Dokumentasikan dan review langkah pencegahan

## Troubleshooting Referensi Cepat

### Build Tidak Mulai
```bash
# Coba ini secara berurutan:
1. Clear cache: rm -rf node_modules/.cache
2. Reinstall: rm -rf node_modules && npm install
3. Update Node: Periksa kompatibilitas versi
4. Periksa disk space
5. Coba network yang berbeda (masalah proxy)
```

### Berfungsi Lokal, Gagal di Production
```bash
# Periksa ini:
1. Perbedaan environment variables
2. Ketidakcocokan versi Node.js
3. Konfigurasi spesifik platform
4. String koneksi database
5. URL endpoint API
```

### Error Intermittent
```bash
# Investigasi:
1. Race conditions dalam kode
2. Resource exhaustion
3. Network timeouts
4. Reliability API pihak ketiga
5. Memory leaks
```

## Tips Cepat Spesifik Framework

### React/Next.js
- Periksa unescaped entities dalam JSX
- Verifikasi API routes di-export dengan benar
- Periksa konfigurasi rendering static/dynamic
- Review konfigurasi middleware

### Vue/Nuxt.js
- Periksa imports komponen
- Verifikasi konfigurasi Nuxt
- Review middleware server
- Periksa registrasi plugin

### Angular
- Periksa lazy-loaded modules
- Verifikasi pengaturan kompilasi AoT
- Review dependency injection
- Periksa konfigurasi routing

### Node.js/Express
- Periksa urutan middleware
- Verifikasi error handling async/await
- Review koneksi pooling database
- Periksa penggunaan process.env

### Static Sites (Hugo, Jekyll, dll)
- Periksa sintaks template
- Verifikasi konfigurasi base URL
- Review path assets
- Periksa kompatibilitas plugin

---

## Mengadaptasi Panduan Ini

### Untuk Proyek Baru
1. Copy file ini ke `.ai/debug-rules.md` atau similar
2. Customise bagian spesifik framework
3. Tambahkan perintah spesifik proyek
4. Update dengan info kontak tim
5. Integrasikan dengan dokumentasi yang ada

### Update Berkala
- Review secara triwulan
- Tambahkan pelajaran yang dipelajari dari insiden
- Update dengan fitur platform baru
- Hapus informasi yang sudah usang
- Bagikan perbaikan dengan tim

---

**Terakhir Diperbarui:** 2025-05-25  
**Versi:** 2.0.0 (Edisi Universal)  
**Lisensi:** Dapat digunakan kembali di semua proyek
