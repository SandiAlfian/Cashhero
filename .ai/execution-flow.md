# SOP Alur Eksekusi

## Fase 1: Observasi & Analisis Skema
- Periksa struktur data yang ada di file store sebelum modifikasi
- Identifikasi interface dan types TypeScript yang digunakan
- Pahami props komponen dan alur data
- Cek pola yang ada di komponen serupa
- Review pendekatan manajemen state (Zustand stores)
- Petakan dependensi antara store dan komponen

## Fase 2: Setup Logic & State
- Buat/update Zustand store di src/store/ dengan interface TypeScript
- Definisikan semua tipe state secara eksplisit (tanpa implicit any)
- Implementasikan persist middleware dengan storage key unik
- Tambahkan business logic di store actions (bukan di komponen)
- Buat fungsi utilitas di src/lib/ jika diperlukan
- Test perubahan state secara independen sebelum integrasi UI

## Fase 3: Eksekusi Komponen Modular
- Buat komponen di direktori yang tepat (src/components/ atau src/components/ui/)
- Gunakan modifikasi non-destructive: edit baris spesifik, bukan rewrite file
- Ikuti pola komponen yang ada (props, struktur, imports)
- Gunakan import absolut dengan alias @
- Implementasikan dengan cn() untuk class merging
- Pertahankan komponen fokus dan single-responsibility
- Gunakan komponen shadcn/ui sebagai base, kustomisasi via variants

## Fase 4: Integrasi UI/UX Premium
- Terapkan palet warna dari CSS variables (bg-background, text-primary, dll.)
- Gunakan font Manrope dengan hierarki weight yang proper
- Implementasikan transisi halus (0.2-0.3s cubic-bezier)
- Tambahkan state hover/focus dengan efek glow
- Pastikan whitespace lega (max-w-5xl mx-auto p-4 sm:p-8)
- Terapkan efek hover card (translateY, shadow, border-color)
- Gunakan Framer Motion untuk animasi enter/exit
- Test kompatibilitas dark mode (gunakan next-themes)
- Pastikan responsivitas mobile dengan breakpoint yang proper
- Tambahkan styles print jika ada fungsi export

## Fase 5: Debugging Anti-Spaghetti
- Isolasi modul saat error terjadi (test store terpisah, lalu komponen)
- Cek browser console untuk error TypeScript
- Verifikasi persistensi state di localStorage
- Test interaksi komponen secara isolasi
- Gunakan React DevTools untuk inspeksi state
- Cek layout shift (gunakan Chrome DevTools Layout Shift)
- Verifikasi fungsi toggle dark mode
- Test navigasi mobile dan perilaku responsif
- Pastikan tidak ada memory leak (cleanup useEffect, subscriptions)
- Verifikasi fungsi export (PDF/Excel) jika applicable

## Pemulihan Error
- Error state: Cek struktur Zustand store, persist key, TypeScript types
- Error UI: Verifikasi import komponen, tipe props, nama class
- Error styling: Cek penggunaan CSS variable, validitas class Tailwind
- Error build: Jalankan check TypeScript, verifikasi imports, cek dependencies
- Error runtime: Cek browser console, test mutasi state, verifikasi operasi async