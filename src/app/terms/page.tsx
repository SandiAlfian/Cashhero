import { ScrollText, CheckCircle2, AlertTriangle, UserCheck, Ban, RefreshCw } from "lucide-react"
import { LanguageToggle } from "@/components/LanguageToggle"

const SECTIONS_ID = [
  {
    icon: ScrollText,
    title: "Penerimaan Ketentuan",
    content: "Dengan menggunakan aplikasi Cashhero, Anda menyetujui ketentuan ini. Jika Anda tidak setuju, jangan gunakan aplikasi ini."
  },
  {
    icon: CheckCircle2,
    title: "Penggunaan yang Diizinkan",
    content: "Anda setuju menggunakan aplikasi hanya untuk pencatatan keuangan pribadi. Dilarang menyalahgunakan layanan untuk aktivitas ilegal, merusak sistem, atau melanggar hukum yang berlaku."
  },
  {
    icon: AlertTriangle,
    title: "Tanggung Jawab Pengguna",
    content: "Anda bertanggung jawab menjaga kerahasiaan akun Google Anda. Semua aktivitas yang terjadi melalui akun Anda adalah tanggung jawab Anda. Cadangkan data secara berkala — kami tidak bertanggung jawab atas kehilangan data akibat penghapusan akun Google, reset peramban, atau force reinstall."
  },
  {
    icon: UserCheck,
    title: "Privasi & Data",
    content: "Lihat Kebijakan Privasi kami untuk informasi detail tentang bagaimana data Anda dikelola. Data Anda tidak dibagikan dengan pihak ketiga."
  },
  {
    icon: Ban,
    title: "Pembatasan Layanan",
    content: "Kami berhak menghentikan atau membatasi akses jika ditemukan penyalahgunaan. Aplikasi disediakan 'apa adanya' tanpa jaminan ketersediaan terus-menerus."
  },
  {
    icon: RefreshCw,
    title: "Perubahan Ketentuan",
    content: "Ketentuan ini dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui ketentuan yang diperbarui."
  },
]

const SECTIONS_EN = [
  {
    icon: ScrollText,
    title: "Acceptance of Terms",
    content: "By using Cashhero, you agree to these terms. If you do not agree, do not use this application."
  },
  {
    icon: CheckCircle2,
    title: "Permitted Use",
    content: "You agree to use the application solely for personal financial tracking. Misuse of the service for illegal activities, system damage, or violating applicable laws is prohibited."
  },
  {
    icon: AlertTriangle,
    title: "User Responsibility",
    content: "You are responsible for maintaining the confidentiality of your Google account. All activities that occur through your account are your responsibility. Back up your data regularly — we are not liable for data loss due to Google account deletion, browser reset, or force reinstall."
  },
  {
    icon: UserCheck,
    title: "Privacy & Data",
    content: "See our Privacy Policy for detailed information on how your data is managed. Your data is not shared with third parties."
  },
  {
    icon: Ban,
    title: "Service Limitations",
    content: "We reserve the right to terminate or restrict access if misuse is found. The application is provided 'as is' without guarantees of continuous availability."
  },
  {
    icon: RefreshCw,
    title: "Changes to Terms",
    content: "These terms may be updated from time to time. Continued use after changes means you accept the updated terms."
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Terms &amp; Conditions</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Syarat &amp; Ketentuan</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="space-y-6" lang="id">
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Terakhir diperbarui: 26 Juni 2026. Dengan menggunakan Cashhero, Anda terikat oleh syarat dan ketentuan ini.
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
            Last updated: June 26, 2026. By using Cashhero, you are bound by these terms and conditions.
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
