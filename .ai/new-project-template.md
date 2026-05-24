# Template Proyek Baru - Next.js + shadcn/ui + Zustand

## Setup Awal
Copy file-file berikut ke proyek baru:
- `.ai/architecture.md` - Sesuaikan dengan stack proyek
- `.ai/ui-standard.md` - Sesuaikan dengan desain proyek
- `.ai/execution-flow.md` - Gunakan sebagai workflow standar
- `.ai/project-config.json` - Update konfigurasi proyek
- `.ai/ai-agent-context.md` - Update informasi proyek

## Langkah Setup

### 1. Inisialisasi Proyek
```bash
npx create-next-app@latest my-project --typescript --tailwind --eslint
cd my-project
```

### 2. Install Dependencies
```bash
# UI Library (Gunakan dlx sebagai eksekutor skrip instan pengganti npx)
pnpm dlx shadcn@latest init

# State Management
pnpm add zustand

# Utilities
pnpm add clsx tailwind-merge class-variance-authority

# Animation (opsional)
pnpm add framer-motion

# Icons
pnpm add lucide-react
```

### 3. Setup Tailwind CSS v4 (jika menggunakan v4)
```bash
pnpm add -D tailwindcss@next @tailwindcss/postcss
```

### 4. Setup Struktur Folder
```bash
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/store
mkdir -p src/hooks
```

### 5. Setup Zustand Store
```typescript
// src/store/useExampleStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExampleState {
  data: string[]
  addData: (item: string) => void
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      data: [],
      addData: (item) => set((state) => ({ data: [...state.data, item] }))
    }),
    { name: 'my-project-storage' }
  )
)
```

### 6. Setup Utility Functions
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 7. Customization Sesuai Proyek
- Update warna di `globals.css`
- Sesuaikan palet warna di `.ai/ui-standard.md`
- Update tech stack di `.ai/architecture.md`
- Sesuaikan struktur folder sesuai kebutuhan

## Kompatibilitas Platform
File `.ai/` kompatibel dengan:
- Claude AI (Anthropic)
- Cursor AI
- Windsurf
- GitHub Copilot Workspace
- Agent lain yang mendukung custom context

## Best Practices Universal
- Gunakan TypeScript strict mode
- Ikuti pola komponen yang konsisten
- Terapkan dark mode sejak awal
- Gunakan CSS variables untuk theming
- Implementasikan responsive design
- Tambahkan proper error handling