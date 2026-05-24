# SOP Arsitektur

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **Bahasa**: TypeScript (strict mode aktif)
- **Styling**: Tailwind CSS v4 (dengan @import syntax, CSS variables)
- **UI Library**: shadcn/ui (base-nova style, @base-ui/react primitives)
- **State Management**: Zustand dengan persist middleware
- **Animation**: Framer Motion
- **Theming**: next-themes (system/dark/light modes)
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## 2. COMMAND EXECUTION RULES
Setiap kali AI Agent perlu menambah atau menjalankan proyek, gunakan perintah pnpm berikut:
- Instalasi dependensi baru: `pnpm add <nama-paket>`
- Instalasi devDependencies: `pnpm add -D <nama-paket>`
- Menjalankan server lokal: `pnpm dev`
- Melakukan kompilasi produksi: `pnpm build`
- Menghapus paket: `pnpm remove <nama-paket>`

## Struktur Direktori
```
src/
├── app/              # Halaman Next.js App Router
│   ├── layout.tsx    # Root layout dengan providers
│   ├── page.tsx      # Halaman home/dashboard
│   ├── globals.css   # Global styles & CSS variables
│   └── [route]/      # Halaman berbasis fitur (calendar, history, planning, dll.)
├── components/       # Komponen React
│   ├── ui/          # Komponen dasar shadcn/ui
│   └── [feature].tsx # Komponen fitur
├── lib/             # Fungsi utilitas
│   ├── utils.ts     # Helper cn() untuk merging class
│   ├── format.ts    # Format mata uang & tanggal
│   └── export.ts    # Fungsi export (PDF/Excel)
├── store/           # Manajemen state Zustand
│   └── use*.ts      # Store spesifik fitur
└── hooks/           # Custom React hooks
```

## Aturan TypeScript
- Semua tipe data wajib dideklarasikan eksplisit (interfaces/types)
- Gunakan strict mode (tanpa implicit any)
- State stores wajib memiliki typed interfaces
- Props komponen wajib dityped
- Gunakan export type untuk export type-only jika memungkinkan

## Pola Komponen
- Gunakan direktif "use client" untuk komponen interaktif
- Import dari path absolut dengan alias @ (@/components, @/lib, @/store)
- State stores menggunakan Zustand dengan persist middleware
- Gunakan utility cn() untuk conditional class merging
- Komponen menerima props language/translation untuk i18n

## Manajemen State
- Gunakan Zustand create() dengan persist middleware
- File store: pola use[Fitur]Store.ts
- Format persist key: cashhero-[fitur]
- Komunikasi antar store via getState()
- TypeScript interfaces untuk semua bentuk state

## 4. STRICT MONOREPO & LINKING SECURITY
- DILARANG menggunakan `npm` atau `yarn` di dalam direktori ini untuk menghindari konflik file lock (`pnpm-lock.yaml`).
- Pastikan semua modul internal diimpor menggunakan path alias resmi (`@/*`).