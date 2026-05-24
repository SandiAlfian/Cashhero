# SOP Standar UI/UX

## Palet Warna (CSS Variables)
### Mode Terang
- **primary**: #810B38 (burgundy tua - aksen utama)
- **primary-foreground**: #FDFCFB
- **background**: #FDFCFB (putih hangat)
- **foreground**: #2D2B33
- **card**: #FFFFFF (putih murni)
- **card-foreground**: #2D2B33
- **secondary**: #F3EBE1 (krem/cream)
- **secondary-foreground**: #810B38
- **muted**: #F3EBE1
- **muted-foreground**: #767380
- **accent**: #810B38
- **accent-foreground**: #FDFCFB
- **border**: #E8DFD5
- **input**: #E8DFD5
- **ring**: #810B38
- **sidebar-bg**: #FFFFFF
- **sidebar-border**: #E8DFD5

### Mode Gelap
- **primary**: #9D1548 (burgundy lebih terang)
- **primary-foreground**: #FDFCFB
- **background**: #1C1B20
- **foreground**: #FDFCFB
- **card**: #27252C
- **card-foreground**: #FDFCFB
- **secondary**: #37353E
- **secondary-foreground**: #FDFCFB
- **muted**: #37353E
- **muted-foreground**: #A19DAB
- **border**: #3F3C47
- **input**: #3F3C47
- **ring**: #9D1548
- **sidebar-bg**: #151419
- **sidebar-border**: #2C2A33

## Tipografi
- **Font Utama**: Manrope (weights: 300, 400, 500, 600, 700, 800)
- **Font Sekunder**: Geist Sans, Geist Mono
- **Variabel Font**: --font-manrope
- **Tampilan Angka**: Tabular figures aktif (font-feature-settings: "tnum" on, "lnum" on)
- **Hierarki**:
  - Heading: font-bold (600-700)
  - Body: font-normal (400)
  - Label sekunder: text-muted-foreground
  - Angka/mata uang: Manrope dengan tabular figures

## Aturan Layout Global
- **Container**: max-w-5xl mx-auto w-full p-4 sm:p-8
- **Konten Utama**: flex-1 overflow-y-auto pb-24 md:pb-8
- **Whitespace**: Padding/margin lega, tidak ada elemen yang menempel di tepi
- **Sidebar**: Komponen DesktopSidebar, lebar proporsional
- **Mobile**: MobileHeader (atas) + MobileBottomBar (navigasi bawah)
- **Responsiveness**: Mobile-first dengan breakpoint md:

## Border Radius
- **Radius Dasar**: 0.5rem (8px)
- **Skala Radius**: sm (4px), md (6px), lg (8px), xl (12px)
- **Diterapkan via**: CSS variable --radius

## Aturan Komponen
- **Elemen Form**: DILARANG menggunakan <select> native - gunakan komponen Select shadcn/ui
- **Interaksi**: Semua elemen interaktif wajib memiliki transisi halus
- **Animation**: Gunakan Framer Motion untuk animasi kompleks, CSS transitions untuk hover/focus sederhana
- **Button States**: State hover/active/focus dengan feedback visual yang proper

## Transisi & Efek
- **Durasi**: 0.2s - 0.3s untuk sebagian besar interaksi
- **Easing**: cubic-bezier(0.16, 1, 0.3, 1) (rasa premium)
- **Hover Effects**: Transform translateY(-2px) pada card, scale(0.96) pada tombol active
- **Focus Rings**: Ring 3px dengan warna primary pada opacity 15% (terang), 25% (gelap)
- **Card Hover**: Perubahan warna border + shadow lift yang halus

## Scrollbar Kustom
- **Lebar**: 6px
- **Track**: Transparan
- **Thumb**: rgba(129, 11, 56, 0.15) → rgba(129, 11, 56, 0.3) pada hover
- **Border Radius**: 99px (fully rounded)

## Styles Print
- Sembunyikan: aside, tombol, input, select, elemen interaktif
- Konten utama: overflow visible, padding 0, max-width 100%
- Background: putih, text: hitam
- Border: #d1d5db (abu-abu terang), tanpa shadow

## Utilitas
- **Class Merging**: Gunakan cn() dari @/lib/utils
- **Conditional Classes**: Gunakan pola clsx + tailwind-merge
- **Hide Scrollbar**: Utility class .scrollbar-none
- **Tipografi Angka**: Class .font-number untuk tabular figures