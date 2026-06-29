# RULES: PWA + FCM Notification System

## ANALISA (jalankan sebelum eksekusi)

1. Baca struktur file proyek yang ada
2. Identifikasi file yang sudah ada terkait notifikasi: `firebase-messaging-sw.js`, konfigurasi FCM, manifest PWA
3. Jangan buat file baru jika fitur sudah ada — modifikasi file yang ada
4. Laporkan:
   - Arsitektur saat ini
   - Alur notifikasi (foreground / background)
   - Titik kegagalan yang mungkin
   - File yang terpengaruh
   - Perubahan yang diperlukan
   - Langkah verifikasi

## EKSEKUSI

- Foreground: gunakan `messaging.onMessage()`
- Background: gunakan `firebase-messaging-sw.js` → `self.registration.showNotification()`
- Service worker wajib di `/public/firebase-messaging-sw.js`
- Urutan FCM: `requestPermission()` → `getToken()` → simpan token → listen
- Firebase hanya diinisialisasi sekali; token hanya di-generate sekali
- Semua kode browser wajib di `"use client"` — tidak boleh jalan di server
- Manifest wajib memiliki: `name`, `short_name`, `icons`, `start_url`, `display: standalone`, `scope`
- Payload gunakan `notification` + `webpush.fcm_options.link`; hindari `data-only`

## DEFINISI SELESAI

- [ ] Foreground berfungsi
- [ ] Background berfungsi
- [ ] Service worker aktif
- [ ] Token & permission lifecycle benar
- [ ] Payload kompatibel Web Push
- [ ] Tidak ada listener atau service worker duplikat
