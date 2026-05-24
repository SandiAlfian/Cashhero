# .ai/ - AI Agent Context Directory

Folder ini berisi konteks dan konfigurasi universal untuk AI agent coding assistant.

## 📁 Struktur File

### File Spesifikasi Utama
- **`architecture.md`** - Spesifikasi tech stack, struktur folder, aturan TypeScript
- **`ui-standard.md`** - Sistem desain, palet warna, tipografi, pola UI/UX
- **`execution-flow.md`** - SOP pengembangan 5 fase, panduan debugging

### File Konfigurasi
- **`project-config.json`** - Konfigurasi programatik untuk AI agents
- **`ai-agent-context.md`** - Konteks universal untuk berbagai platform
- **`new-project-template.md`** - Template setup untuk proyek baru

### File Platform-Specific
- **`.cursorrules`** - Konfigurasi untuk Cursor AI
- **`.claude-rules`** - Konfigurasi untuk Claude AI

## 🚀 Penggunaan di Proyek Ini

AI agents akan otomatis membaca file-file ini untuk:
- Memahami tech stack dan arsitektur
- Mengikuti standar UI/UX yang telah ditetapkan
- Menerapkan workflow pengembangan yang konsisten
- Memahami pola kode dan konvensi proyek

## 📦 Penggunaan untuk Proyek Baru

### Langkah 1: Copy Folder .ai/
```bash
cp -r .ai /path/to/new-project/
```

### Langkah 2: Sesuaikan Konfigurasi
Edit file-file berikut sesuai proyek baru:
1. `project-config.json` - Update nama proyek dan konfigurasi
2. `architecture.md` - Sesuaikan tech stack jika berbeda
3. `ui-standard.md` - Update palet warna dan desain
4. `ai-agent-context.md` - Update informasi proyek

### Langkah 3: Setup Proyek
Ikuti panduan di `new-project-template.md`

## 🤖 Kompatibilitas Platform

Folder `.ai/` kompatibel dengan:
- ✅ Claude AI (Anthropic)
- ✅ Cursor AI
- ✅ Windsurf
- ✅ GitHub Copilot Workspace
- ✅ Agent lain yang mendukung custom context

## 🎯 Fitur Utama

### 1. Universal Context
- Satu sumber kebenaran untuk spesifikasi proyek
- Konsisten di berbagai platform AI
- Mengurangi ambiguities dalam instruksi

### 2. Machine-Readable
- Format JSON untuk konfigurasi programatik
- Bullet points untuk efisiensi token
- Struktur yang mudah diparsing oleh AI

### 3. Reusable
- Template untuk proyek baru dengan stack serupa
- Pola yang dapat diadaptasi untuk framework lain
- Best practices yang terdokumentasi

### 4. Platform-Agnostic
- Tidak terikat pada platform tertentu
- File konfigurasi untuk platform spesifik (opsional)
- Dapat digunakan oleh berbagai AI coding assistants

## 📝 Customization

### Untuk Framework Berbeda
Update `architecture.md` dengan:
- Framework yang digunakan (React, Vue, Svelte, dll.)
- Router yang digunakan
- Konvensi komponen framework

### Untuk Desain Berbeda
Update `ui-standard.md` dengan:
- Palet warna brand
- Font dan tipografi
- Sistem desain yang berbeda

### Untuk State Management Berbeda
Update `architecture.md` dan `execution-flow.md` dengan:
- Library state management (Redux, Pinia, dll.)
- Pola state management
- Konvensi naming

## 🔧 Maintenance

### Update Berkala
- Update saat ada perubahan tech stack
- Sesuaikan saat ada perubahan desain
- Tambahkan best practices baru yang ditemukan

### Version Control
- Commit file-file .ai/ ke git
- Track perubahan untuk dokumentasi
- Revert jika diperlukan

## 📖 Referensi

- Next.js Documentation: https://nextjs.org/docs
- shadcn/ui Documentation: https://ui.shadcn.com
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Zustand Documentation: https://zustand-demo.pmnd.rs