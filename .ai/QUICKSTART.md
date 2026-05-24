# Quick Start Guide - AI Context

## Untuk Penggunaan di Proyek Ini

### Sebagai Developer
Folder `.ai/` berisi spesifikasi proyek Anda. AI agents akan:
- Membaca spesifikasi otomatis
- Mengikuti standar kode yang telah ditetapkan
- Menerapkan pola UI/UX yang konsisten

### Sebagai AI Agent
Baca file dalam urutan berikut:
1. `README.md` - Gambaran umum
2. `project-config.json` - Konfigurasi cepat
3. `architecture.md` - Tech stack & struktur
4. `ui-standard.md` - Sistem desain
5. `execution-flow.md` - Workflow pengembangan

## Untuk Proyek Baru

### Copy Template
```bash
# Copy seluruh folder .ai/
cp -r /path/to/Cashhero/.ai /path/to/new-project/.ai
```

### Minimal Customization
Edit file-file berikut:
1. `project-config.json`
   ```json
   {
     "projectName": "Nama Proyek Baru",
     "techStack": { ... }
   }
   ```

2. `ai-agent-context.md`
   ```markdown
   ## Project Information
   - **Name**: Nama Proyek Baru
   ```

3. `ai-metadata.json`
   ```json
   {
     "project": "Nama Proyek Baru"
   }
   ```

### Setup Proyek
Ikuti panduan lengkap di `new-project-template.md`

## Platform-Specific Setup

### Cursor AI
File `.cursorrules` akan otomatis dikenali

### Claude AI
File `.claude-rules` akan otomatis dikenali

### Windsurf
Baca seluruh folder `.ai/` sebagai konteks

### GitHub Copilot
Referensi file `.ai/` dalam comments jika perlu

## Struktur Folder yang Dihasilkan

```
.ai/
├── README.md                    # Dokumentasi lengkap
├── QUICKSTART.md               # File ini
├── .ai-metadata.json          # Metadata untuk discovery
├── project-config.json        # Konfigurasi programatik
├── ai-agent-context.md       # Konteks universal
├── new-project-template.md   # Template proyek baru
├── architecture.md           # Spesifikasi arsitektur
├── ui-standard.md            # Standar UI/UX
├── execution-flow.md        # SOP pengembangan
├── .cursorrules             # Rules untuk Cursor
├── .claude-rules            # Rules untuk Claude
└── .gitkeep                 # Git ignore rules
```

## Update Berkala

### Ketika Tech Stack Berubah
Update `architecture.md` dan `project-config.json`

### Ketika Desain Berubah
Update `ui-standard.md` dan CSS variables

### Ketika Workflow Baru Ditemukan
Update `execution-flow.md` dengan best practices baru

## Support

Jika mengalami masalah:
1. Cek `README.md` untuk dokumentasi lengkap
2. Verifikasi struktur file dengan `ls -la .ai/`
3. Pastikan semua file dalam format yang benar
4. Cek kompatibilitas platform AI yang digunakan