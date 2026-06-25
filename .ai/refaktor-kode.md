# SOP Refaktor Kode — Next.js App Router (Non-Destruktif)

## Prinsip Dasar
- **Zero UI/UX change**: Output visual, interaksi pengguna, dan alur proses aplikasi TIDAK BOLEH berubah
- **Incremental refactor**: Satu modul per siklus, jangan rewrite keseluruhan aplikasi
- **Test after each move**: Setiap ekstraksi function/komponen harus diverifikasi dengan build
- **Preserve imports & exports**: Jangan ubah nama fungsi/komponen yang sudah di-import tempat lain
- **Minimize "use client"**: Tambahkan `'use client'` hanya jika benar-benar butuh state, event handler, atau Browser API — jangan jadikan default

## Fase 1: Identifikasi God Code
- Hitung LOC per file — jika >300 baris, curigai sebagai god component
- Hitung jumlah responsibilities dalam 1 file (data fetching, rendering, kalkulasi, state management, validasi, export, dll.)
- Hitung jumlah `useState` dalam 1 komponen — jika >5, curigai perlu dipecah
- Hitung jumlah `useEffect` dalam 1 komponen — jika >3, curigai ada logic yang belum diekstrak ke hook
- Cari duplikasi kode: format currency, format tanggal, filter logic, class Tailwind yang sama di banyak tempat
- Identifikasi business logic yang terbenam di JSX (kalkulasi di `.map()`, format inline, kondisi panjang di JSX)
- Identifikasi komponen Server yang seharusnya bisa fetch data langsung tanpa `useEffect`
- Identifikasi komponen yang menggunakan `'use client'` padahal tidak ada state atau event handler
- Periksa apakah ada 0 custom hooks atau 0 lib files untuk modul tersebut — indikasi logic tidak terekstrak
- Periksa apakah ada fetch data di Client Component yang bisa dipindah ke Server Component

## Fase 2: Ekstraksi Business Logic ke Pure Functions
- Buat file baru di `src/lib/[modul].ts` untuk semua fungsi murni (tanpa React, tanpa side effect)
- Pindahkan kalkulasi statistik/finansial dari `useMemo` ke pure function yang bisa di-test
- Pindahkan date math, filtering, grouping, sorting ke function exports
- Pindahkan formatting berulang (Intl.NumberFormat, date formatter) ke 1 fungsi shared
- Pindahkan chart coordinate math ke fungsi terpisah
- Pindahkan magic strings, magic numbers, array definitions ke konstanta di file yang sama atau `src/lib/constants.ts`
- Standarisasi: semua fungsi menerima input plain data → return plain data (tidak akses store langsung)
- Gunakan `as const` untuk semua definisi konstanta
- Jangan duplikasi konstanta — import dari 1 source of truth
- File di `src/lib/` tidak boleh mengimport dari React, Next.js, atau library UI apapun

## Fase 3: Ekstraksi Server Layer
- Pindahkan semua query database ke `src/server/db/[modul].ts`
- Pindahkan semua Server Actions ke `src/server/actions/[modul].ts` dan tandai dengan `'use server'`
- Tandai file di `src/server/` dengan `import 'server-only'` untuk mencegah import dari Client Component
- Fungsi di `src/server/db/` harus memanggil pure functions dari `src/lib/` untuk transformasi data — tidak boleh ada transformasi inline di dalam query
- Jangan pernah import langsung dari `src/server/` di Client Component — gunakan Server Action sebagai jembatan

## Fase 4: Ekstraksi Custom Hooks
- Buat file baru di `src/hooks/use[Fungsi].ts`
- Hook menerima parameter dari komponen, return data + state yang sudah diproses
- Hook menggunakan pure functions dari `src/lib/` untuk transformasi data
- Hook mengandung `useMemo`/`useEffect` untuk optimasi React
- Hook TIDAK boleh mengandung JSX, TIDAK boleh import komponen React
- Hook TIDAK boleh mengakses store langsung — terima data sebagai parameter
- Hook hanya boleh diimport oleh Client Components

## Fase 5: Ekstraksi Komponen Presentasional
- Buat komponen kecil (<100 baris) dengan 1 tanggung jawab
- Komponen presentasional hanya menerima props dan render — tanpa logic bisnis dan tanpa fetch data
- Pisahkan chart SVG menjadi komponen reusable di `src/components/charts/`
- Pisahkan tabel menjadi komponen sendiri
- Pisahkan modal/dialog menjadi komponen sendiri
- Jika hanya sebagian kecil komponen yang interaktif, ekstrak hanya bagian itu sebagai Client Component — beri suffix `.client.tsx`
- Server Component boleh menerima Client Component sebagai `children` — manfaatkan pola ini untuk meminimalkan `'use client'`
- Gunakan `React.memo` untuk komponen chart atau tabel yang berat dan sering render ulang

## Fase 6: Verifikasi & Testing
- Jalankan `npx tsc --noEmit` — harus 0 error baru
- Jalankan `npx next lint` — harus 0 error baru
- Jalankan `npx next build` — harus sukses dengan ukuran bundle tidak membengkak
- Bandingkan First Load JS per route sebelum dan sesudah refaktor — tidak boleh naik signifikan
- Test manual: semua halaman yang di-refaktor harus berfungsi identik (scroll, klik, hover, input, submit)
- Test loading state dan error state masih muncul dengan benar
- Test dark mode: tidak ada perubahan warna atau layout
- Test mobile: layout responsif tetap sama
- Test export: PDF/Excel/fungsi export lain tetap berfungsi
- Pastikan tidak ada import yang broken (cek error build)
- Pastikan tidak ada fitur yang hilang (tooltip, animasi, interaksi, validasi)

## Catatan Penting
- Jangan pernah refaktor lebih dari 1 modul dalam 1 siklus
- Jangan pernah mengubah skema data (interface, type state, props komponen) tanpa analisis dependensi
- Jangan pernah menggabungkan refaktor dengan penambahan fitur baru
- Jangan pernah menggunakan `useEffect` untuk fetch data — gunakan Server Component atau SWR/TanStack Query
- Jangan pernah menggunakan `useState` untuk data yang lebih tepat disimpan di URL — gunakan `useSearchParams`
- Jangan pernah menggunakan `any` saat refaktor untuk mempercepat — gunakan `unknown` atau definisikan tipe yang benar
- Jika menemukan bug saat refaktor, catat lokasinya dan laporkan — jangan perbaiki di tengah refaktor
- Jika ragu dampak suatu perubahan, buat branch terpisah untuk eksperimen
- Prioritas: lib (pure functions) → server layer → hooks → komponen presentasional → halaman (orchestrator)
