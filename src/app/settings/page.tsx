"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Info, Check } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { getTranslation } from "@/lib/format"
import { containerVariants, itemVariants } from "@/lib/settings"
import { ProfileCard } from "@/components/settings/ProfileCard"
import { FinancialPreferencesCard } from "@/components/settings/FinancialPreferencesCard"
import { SecurityCard } from "@/components/settings/SecurityCard"
import { SystemCard } from "@/components/settings/SystemCard"

export default function SettingsPage() {
  const { language } = useLanguageStore()

  const [mounted, setMounted] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = React.useCallback((key: string) => getTranslation(language, key), [language])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/20 animate-pulse rounded-lg w-1/4" />
        <div className="h-4 bg-muted/20 animate-pulse rounded-lg w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <div className="h-64 bg-muted/10 animate-pulse rounded-xl" />
          <div className="h-64 bg-muted/10 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-16 relative"
    >
      {/* Title Header Section */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t('settingsSubtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCard triggerToast={triggerToast} />
        <FinancialPreferencesCard triggerToast={triggerToast} />
        <SecurityCard triggerToast={triggerToast} />
        <SystemCard triggerToast={triggerToast} />
      </div>

      {/* Dynamic Information Banner & App Version */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 max-w-full"
      >
        {/* Privacy Information */}
        <div className="p-4 bg-muted/15 border border-border/30 rounded-xl flex items-start gap-3 text-xs text-muted-foreground shadow-sm font-semibold">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5 animate-pulse" />
          <div className="flex flex-col gap-0.5">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-foreground">
              {language === 'id' ? 'INFORMASI PRIVASI' : 'PRIVACY INFO'}
            </p>
            <p className="text-[11px] leading-relaxed">
              {language === 'id'
                ? "Data Anda disimpan aman di peramban (localStorage). Cadangan cloud bersifat opsional — hanya terkirim jika Anda menghubungkan akun Google dan melakukan pencadangan secara manual. Data cadangan dienkripsi TLS 1.3 (pengiriman) & AES-256 (penyimpanan). Lihat Kebijakan Privasi untuk detail lengkap."
                : "Your data is stored securely in your browser (localStorage). Cloud backup is optional — only sent when you connect your Google account and manually back up. Backed-up data is encrypted with TLS 1.3 (transit) & AES-256 (storage). See Privacy Policy for full details."}
            </p>
          </div>
        </div>

        {/* App Version Info */}
        <div className="p-4 bg-muted/15 border border-border/30 rounded-xl flex items-start gap-3 text-xs text-muted-foreground shadow-sm font-semibold">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-foreground">
              {language === 'id' ? 'TENTANG APLIKASI' : 'ABOUT APP'}
            </p>
            <div className="flex flex-col gap-1 text-[11px] leading-none">
              <div className="flex justify-between border-b border-border/10 pb-1.5">
                <span>{language === 'id' ? 'Versi' : 'Version'}</span>
                <span className="font-bold text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1.5 mt-0.5">
                <span>{language === 'id' ? 'Pengembang' : 'Developer'}</span>
                <span className="font-bold text-foreground">Sandyal</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span>Hak Cipta / Copyright</span>
                <span className="font-bold text-foreground">&copy; CashHero</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Toast System */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 md:right-8 z-[10001] flex items-center gap-3 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3 rounded-xl shadow-2xl border border-border/80 max-w-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <span className="text-xs font-bold leading-normal">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
