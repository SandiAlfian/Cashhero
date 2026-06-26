import { Shield, Lock, Eye, Server, Database, FileText } from "lucide-react"
import { LanguageToggle } from "@/components/LanguageToggle"

const SECTIONS_ID = [
  {
    icon: Shield,
    title: "Pengantar",
    content: "Cashhero menghormati privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat menggunakan aplikasi pencatat keuangan pribadi kami."
  },
  {
    icon: Database,
    title: "Data yang Dikumpulkan",
    content: "Kami hanya mengumpulkan data yang Anda masukkan secara sukarela: transaksi keuangan, anggaran, target tabungan, aturan pencatatan otomatis, piutang/kasbon, dan aset portofolio. Kami tidak mengumpulkan data lokasi, kontak, galeri, atau data sensitif lainnya di luar konteks aplikasi."
  },
  {
    icon: Lock,
    title: "Penyimpanan & Enkripsi",
    content: "Data Anda disimpan secara lokal di peramban Anda (localStorage) dan dapat dicadangkan ke cloud melalui akun Google Anda. Semua data yang dikirim ke server diamankan dengan enkripsi TLS/SSL (HTTPS). Data di penyimpanan cloud (Firestore Google Cloud) dienkripsi saat diam (AES-256) dan saat transit (TLS 1.3). Kami menggunakan Firebase Authentication untuk verifikasi identitas — kata sandi Anda tidak pernah disimpan di server kami."
  },
  {
    icon: Eye,
    title: "Penggunaan Data",
    content: "Data Anda hanya digunakan untuk keperluan aplikasi: menampilkan laporan keuangan, grafik pengeluaran, pengingat transaksi berulang, dan cadangan cloud. Kami tidak menjual, menyewakan, atau membagikan data Anda kepada pihak ketiga mana pun. Data tidak digunakan untuk iklan, profiling, atau analitik eksternal."
  },
  {
    icon: Server,
    title: "Layanan Pihak Ketiga",
    content: "Aplikasi menggunakan layanan Firebase (Google) untuk autentikasi, database cloud (Firestore), dan notifikasi push (FCM). Layanan ini tunduk pada kebijakan privasi Google. Aplikasi tidak mengirim data ke pihak ketiga lainnya."
  },
  {
    icon: FileText,
    title: "Hak Pengguna",
    content: "Anda berhak mengakses, memperbaiki, atau menghapus data Anda kapan saja. Data lokal dapat dihapus melalui pengaturan aplikasi (Reset All Data). Data cloud dapat dihapus dengan memutuskan akun Google atau menghubungi kami. Cadangan cloud dapat dipulihkan kapan saja selama akun Google Anda masih terhubung."
  },
]

const SECTIONS_EN = [
  {
    icon: Shield,
    title: "Introduction",
    content: "Cashhero respects your privacy. This policy explains how we collect, use, store, and protect your personal data when using our personal finance tracking application."
  },
  {
    icon: Database,
    title: "Data Collected",
    content: "We only collect data you voluntarily enter: financial transactions, budgets, savings goals, auto-log rules, receivables/loans, and portfolio assets. We do not collect location data, contacts, gallery, or other sensitive data outside the app context."
  },
  {
    icon: Lock,
    title: "Storage & Encryption",
    content: "Your data is stored locally in your browser (localStorage) and can be backed up to the cloud via your Google account. All data sent to servers is secured with TLS/SSL encryption (HTTPS). Cloud storage data (Google Cloud Firestore) is encrypted at rest (AES-256) and in transit (TLS 1.3). We use Firebase Authentication for identity verification — your password is never stored on our servers."
  },
  {
    icon: Eye,
    title: "Data Usage",
    content: "Your data is only used for app functionality: displaying financial reports, expense charts, recurring transaction reminders, and cloud backup. We do not sell, rent, or share your data with any third party. Data is not used for advertising, profiling, or external analytics."
  },
  {
    icon: Server,
    title: "Third-Party Services",
    content: "The app uses Firebase services (Google) for authentication, cloud database (Firestore), and push notifications (FCM). These services are subject to Google's privacy policy. The app does not send data to any other third parties."
  },
  {
    icon: FileText,
    title: "User Rights",
    content: "You have the right to access, correct, or delete your data at any time. Local data can be deleted via app settings (Reset All Data). Cloud data can be deleted by disconnecting your Google account or contacting us. Cloud backups can be restored anytime as long as your Google account remains connected."
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Kebijakan Privasi</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="space-y-6" lang="id">
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Terakhir diperbarui: 26 Juni 2026. Dengan menggunakan Cashhero, Anda menyetujui pengumpulan dan penggunaan data sesuai dengan kebijakan ini.
          </p>
          {SECTIONS_ID.map((s) => (
            <div key={s.title} className="p-5 rounded-xl bg-card border border-border/40 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm font-extrabold text-foreground">{s.title}</h2>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{s.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-6" lang="en">
          <h2 className="text-lg font-extrabold text-foreground border-b border-border/20 pb-2">English Version</h2>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Last updated: June 26, 2026. By using Cashhero, you agree to the collection and use of data in accordance with this policy.
          </p>
          {SECTIONS_EN.map((s) => (
            <div key={s.title} className="p-5 rounded-xl bg-card border border-border/40 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-sm font-extrabold text-foreground">{s.title}</h2>
                  <p className="text-[13px] text-muted-foreground/80 leading-relaxed">{s.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
