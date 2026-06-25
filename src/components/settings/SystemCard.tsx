"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sliders, Moon, Sun, Laptop, Languages, ArrowRight, Bell, Download, Database, AlertCircle, Trash2, Upload, X, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useTheme } from "next-themes"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { localT, itemVariants } from "@/lib/settings"

interface SystemCardProps {
  triggerToast: (msg: string) => void
}

export function SystemCard({ triggerToast }: SystemCardProps) {
  const { language, setLanguage } = useLanguageStore()
  const { theme, setTheme } = useTheme()
  const isNotificationEnabled = useSettingsStore((state) => state.isNotificationEnabled)
  const setNotificationEnabled = useSettingsStore((state) => state.setNotificationEnabled)
  const resetAllData = useSettingsStore((state) => state.resetAllData)

  const {
    isBackgroundPushEnabled,
    loading: isPushLoading,
    error: pushError,
    registerPush,
    unregisterPush,
  } = usePushNotifications()

  const [mounted, setMounted] = React.useState(false)
  const [showResetModal, setShowResetModal] = React.useState(false)
  const [showImportModal, setShowImportModal] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
    prompt(): Promise<void>
  }

  const [pwaPrompt, setPwaPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [isAlreadyInstalled, setIsAlreadyInstalled] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const checkIsInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
      setIsAlreadyInstalled(isStandalone)
    }

    checkIsInstalled()

    let checks = 0
    const promptCheckInterval = setInterval(() => {
      const globalWindow = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent }
      if (globalWindow.deferredPwaPrompt) {
        setPwaPrompt(globalWindow.deferredPwaPrompt)
        setIsAlreadyInstalled(false)
        clearInterval(promptCheckInterval)
      }
      checks++
      if (checks >= 10) clearInterval(promptCheckInterval)
    }, 500)

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault()
      setPwaPrompt(e as BeforeInstallPromptEvent)
      const gw = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent }
      gw.deferredPwaPrompt = e as BeforeInstallPromptEvent
      setIsAlreadyInstalled(false)
    }

    const handleAppInstalled = () => {
      setIsAlreadyInstalled(true)
      setPwaPrompt(null)
      const gw = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent | null }
      gw.deferredPwaPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforePrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      clearInterval(promptCheckInterval)
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallPWA = async () => {
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
    if (isIOS) {
      alert(
        "Untuk memasang Cashhero di iPhone/iPad Anda:\n\n1. Klik tombol 'Bagikan' (Share) di Safari.\n2. Pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).\n3. Klik 'Tambah' (Add) di kanan atas."
      )
      return
    }

    let globalPrompt: BeforeInstallPromptEvent | null = null
    if (typeof window !== 'undefined') {
      const gw = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent | null }
      if (gw.deferredPwaPrompt) {
        globalPrompt = gw.deferredPwaPrompt
      }
    }

    const activePrompt = pwaPrompt || globalPrompt

    if (!activePrompt) {
      alert(
        language === 'id'
          ? "Aplikasi sudah terpasang atau browser Anda tidak mendukung instalasi otomatis secara langsung. Silakan cari menu 'Instal' di pojok kanan atas browser Anda."
          : "Application is already installed or your browser does not support direct installation. Please look for the 'Install' option in your browser menu."
      )
      return
    }

    activePrompt.prompt()
    const { outcome } = await activePrompt.userChoice
    if (outcome === 'accepted') {
      setPwaPrompt(null)
      if (typeof window !== 'undefined') {
        const gw = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent | null }
        gw.deferredPwaPrompt = null
      }
      setIsAlreadyInstalled(true)
    }
  }

  const t = React.useCallback((key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }, [mounted, language])

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    const label = newTheme === "dark"
      ? (language === 'id' ? 'Mode Gelap' : 'Dark Mode')
      : newTheme === "light"
        ? (language === 'id' ? 'Mode Terang' : 'Light Mode')
        : (language === 'id' ? 'Tema Sistem' : 'System Theme')
    triggerToast(`${language === 'id' ? 'Tema diubah ke ' : 'Theme changed to '} ${label}`)
  }

  const handleLanguageChange = () => {
    const nextLang = language === "id" ? "en" : "id"
    setLanguage(nextLang)
    setTimeout(() => {
      triggerToast(nextLang === "id" ? "Bahasa diubah ke Bahasa Indonesia" : "Language changed to English")
    }, 100)
  }

  const handleExportJSON = () => {
    if (typeof window === 'undefined') return
    const data: Record<string, string | null> = {
      "cashhero-transactions": localStorage.getItem("cashhero-transactions"),
      "cashhero-portfolio-dynamic-v2": localStorage.getItem("cashhero-portfolio-dynamic-v2"),
      "cashhero-planning-persistent": localStorage.getItem("cashhero-planning-persistent"),
      "cashhero-language": localStorage.getItem("cashhero-language"),
      "cashhero-settings": localStorage.getItem("cashhero-settings")
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
    const downloadAnchor = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    downloadAnchor.setAttribute("href", jsonString)
    downloadAnchor.setAttribute("download", `cashhero_backup_${timestamp}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    triggerToast(t("exportSuccess"))
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const executeImport = () => {
    if (!selectedFile) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const validKeys = [
          "cashhero-transactions",
          "cashhero-portfolio-dynamic-v2",
          "cashhero-planning-persistent",
          "cashhero-language",
          "cashhero-settings"
        ]
        const hasValidKey = validKeys.some(key => key in parsed)
        if (!hasValidKey) {
          triggerToast(t("importError"))
          return
        }
        validKeys.forEach(key => {
          if (parsed[key]) {
            localStorage.setItem(key, typeof parsed[key] === 'string' ? parsed[key] : JSON.stringify(parsed[key]))
          }
        })
        triggerToast(t("importSuccess"))
        setShowImportModal(false)
        setSelectedFile(null)
        setTimeout(() => { window.location.reload() }, 1500)
      } catch {
        triggerToast(t("importError"))
      }
    }
    reader.readAsText(selectedFile)
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/25 backdrop-blur-md border border-border/40 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:border-primary/20 h-full flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              {language === 'id' ? 'Sistem & Sinkronisasi' : 'System & Sync'}
            </CardTitle>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
              {language === 'id' ? 'Sinkron' : 'Synced'}
            </span>
          </div>
          <CardDescription className="text-xs">
            {language === 'id' ? 'Atur performa visual sistem dan ekspor backup basis data.' : 'Adjust system visual performance and database exports.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Theme Switch Card */}
            <div className="p-3.5 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cursor-pointer group/theme flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                  {language === 'id' ? 'Gaya Tema Visual' : 'Visual Theme Style'}
                </span>
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(['light', 'dark', 'system'] as const).map((themeOpt) => (
                  <button
                    key={themeOpt}
                    onClick={() => handleThemeChange(themeOpt)}
                    className={`text-[9px] font-bold py-1 px-1.5 rounded-md border text-center transition-all ${theme === themeOpt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
                    }`}
                  >
                    {themeOpt === 'light' ? 'Light' : themeOpt === 'dark' ? 'Dark' : 'Sistem'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bahasa Switch Card */}
            <div
              onClick={handleLanguageChange}
              className="p-3.5 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-primary/20 transition-all duration-200 cursor-pointer group/lang flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                  {language === 'id' ? 'Bahasa' : 'Language'}
                </span>
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover/lang:scale-105 transition-transform">
                  <Languages className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <h5 className="text-xs font-black text-foreground uppercase flex items-center gap-1">
                  {language === 'id' ? 'Bahasa Indonesia' : 'English (US)'}
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover/lang:translate-x-1 transition-transform" />
                </h5>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {language === 'id' ? 'Sentuh untuk ubah ke English' : 'Tap to change to Indonesian'}
                </p>
              </div>
            </div>

            {/* Unified Smart App Notifications Card */}
            <div className="col-span-1 sm:col-span-2 p-4 rounded-xl border border-border/20 bg-muted/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-2 font-semibold">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    {language === 'id' ? 'Notifikasi Pengingat Pintar' : 'Smart Reminder Notifications'}
                  </h5>
                  <p className="text-[10px] text-muted-foreground leading-normal max-w-[85%] font-medium">
                    {language === 'id'
                      ? 'Aktifkan peringatan otomatis secara real-time ke perangkat Anda.'
                      : 'Enable real-time automatic reminders to your device.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(isNotificationEnabled || isBackgroundPushEnabled) && (
                    <button
                      type="button"
                      title={language === 'id' ? 'Kirim Notifikasi Uji Coba' : 'Send Test Notification'}
                      onClick={() => {
                        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
                        triggerToast(
                          language === 'id'
                            ? "Memproses notifikasi uji coba... Mohon tunggu."
                            : "Processing test notification... Please wait."
                        )
                        fetch('/api/fcm/test').then(async (res) => {
                          const data = await res.json()
                          if (data.ok) {
                            triggerToast(
                              language === 'id'
                                ? 'Notifikasi uji coba berhasil dikirim! Cek perangkat Anda.'
                                : 'Test notification sent successfully! Check your device.'
                            )
                          } else {
                            triggerToast(
                              language === 'id'
                                ? `Gagal: ${data.error || 'unknown error'}`
                                : `Failed: ${data.error || 'unknown error'}`
                            )
                          }
                        }).catch((e) => {
                          triggerToast(
                            language === 'id' ? `Gagal: ${e.message}` : `Failed: ${e.message}`
                          )
                        })
                        setTimeout(() => {
                          navigator.serviceWorker.ready.then((registration) => {
                            registration.active?.postMessage({
                              type: 'SHOW_LOCAL_NOTIFICATION',
                              payload: {
                                title: language === 'id' ? 'Uji Coba Notifikasi Cashhero 🔔' : 'Cashhero Test Notification 🔔',
                                options: {
                                  body: language === 'id'
                                    ? 'Sistem notifikasi pengingat finansial Cashhero aktif dan berjalan dengan lancar!'
                                    : 'Cashhero financial reminder notification system is active and running smoothly!',
                                  vibrate: [200, 100, 200]
                                }
                              }
                            })
                          })
                        }, 5000)
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:text-blue-600 transition-all border border-blue-500/20 active:scale-90 cursor-pointer shadow-sm relative group shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:rotate-12">
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      </svg>
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
                    </button>
                  )}

                  <div
                    onClick={async () => {
                      if (isPushLoading) return
                      const isCurrentlyEnabled = isNotificationEnabled || isBackgroundPushEnabled

                      if (!isCurrentlyEnabled) {
                        if (typeof window !== 'undefined' && 'Notification' in window) {
                          const permission = await Notification.requestPermission()
                          if (permission === 'granted') {
                            const token = await registerPush()
                            if (token) {
                              setNotificationEnabled(true)
                              triggerToast(
                                language === 'id'
                                  ? 'Notifikasi pengingat pintar berhasil diaktifkan!'
                                  : 'Smart reminder notifications successfully enabled!'
                              )
                            } else {
                              triggerToast(
                                language === 'id'
                                  ? `Gagal mendaftarkan notifikasi: ${pushError || 'Silakan cek console browser (F12) untuk detail.'}`
                                  : `Failed to register notifications: ${pushError || 'Check browser console (F12) for details.'}`
                              )
                            }
                          } else {
                            triggerToast(
                              language === 'id'
                                ? 'Izin notifikasi ditolak oleh browser.'
                                : 'Notification permission denied by browser.'
                            )
                          }
                        } else {
                          triggerToast(
                            language === 'id'
                              ? 'Browser Anda tidak mendukung notifikasi push.'
                              : 'Your browser does not support push notifications.'
                          )
                        }
                      } else {
                        setNotificationEnabled(false)
                        await unregisterPush()
                        triggerToast(
                          language === 'id'
                            ? 'Notifikasi pengingat pintar dinonaktifkan.'
                            : 'Smart reminder notifications disabled.'
                        )
                      }
                    }}
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center shrink-0 ${
                      (isNotificationEnabled || isBackgroundPushEnabled) ? "bg-blue-500" : "bg-muted-foreground/30"
                    } ${isPushLoading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <motion.div
                      layout
                      className="w-4 h-4 bg-white rounded-full shadow-md"
                      animate={{ x: (isNotificationEnabled || isBackgroundPushEnabled) ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
              </div>

              {pushError && (
                <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-[10px] font-semibold text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{pushError}</span>
                </div>
              )}
            </div>

            {/* PWA Manual Installer Card */}
            <div
              onClick={isAlreadyInstalled ? undefined : handleInstallPWA}
              className={`col-span-1 sm:col-span-2 p-3.5 rounded-xl border border-border/30 bg-muted/10 transition-all duration-200 flex items-center justify-between gap-4 ${
                isAlreadyInstalled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-muted/20 hover:border-primary/20 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isAlreadyInstalled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}>
                  <Download className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">
                    {language === 'id' ? 'Pasang Aplikasi Cashhero' : 'Install Cashhero App'}
                  </h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isAlreadyInstalled
                      ? (language === 'id'
                        ? 'Aplikasi telah berhasil terpasang di perangkat Anda.'
                        : 'Application is successfully installed on your device.')
                      : (language === 'id'
                        ? 'Akses cepat langsung dari layar utama dan dapat dibuka secara offline.'
                        : 'Quick access directly from your home screen and fully offline compatible.')}
                  </p>
                </div>
              </div>
              <div className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg shrink-0 select-none transition-all ${
                isAlreadyInstalled
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 cursor-pointer active:scale-95"
              }`}>
                {isAlreadyInstalled
                  ? (language === 'id' ? 'SUDAH TERINSTAL' : 'INSTALLED')
                  : (language === 'id' ? 'PASANG' : 'INSTALL')}
              </div>
            </div>
          </div>

          {/* Data & Database Controls (Export, Import, Reset) */}
          <div className="border-t border-border/30 pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-primary animate-pulse" />
                {t("dbSettings")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                onClick={handleExportJSON}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/40 hover:border-primary/30 bg-muted/10 hover:bg-muted/20 transition-all text-center gap-1.5 cursor-pointer text-foreground active:scale-95"
                title={t("exportDesc")}
              >
                <Download className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold">{t("exportTitle")}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setShowImportModal(true)
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-border/40 hover:border-primary/30 bg-muted/10 hover:bg-muted/20 transition-all text-center gap-1.5 cursor-pointer text-foreground active:scale-95"
                title={t("importDesc")}
              >
                <Upload className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold">{t("importTitle")}</span>
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 transition-all text-center gap-1.5 cursor-pointer text-red-500 active:scale-95"
                title={t("resetDesc")}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold">{language === 'id' ? 'Reset Data' : 'Reset App'}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative bg-card text-card-foreground border border-red-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-black text-red-500 tracking-tight">{t("resetTitle")}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t("resetWarning")}</p>
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1.5 my-2">
                    {[
                      language === 'id' ? 'Semua riwayat transaksi akan dihapus selamanya' : 'All transaction history will be permanently deleted',
                      language === 'id' ? 'Nilai modal dan alokasi portofolio investasi dikosongkan' : 'Investment portfolios and capital will be emptied',
                      language === 'id' ? 'Semua target tabungan & anggaran dihapus' : 'All saving goals & budget constraints removed',
                      language === 'id' ? 'Kredensial keamanan (PIN & sidik jari) dihilangkan' : 'Security credentials (PIN & biometrics) removed',
                    ].map((bullet, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-red-500/90 font-semibold leading-normal">
                        <span className="block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="w-full bg-muted/40 hover:bg-muted/70 border border-border text-foreground py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none"
                >{t("cancel")}</button>
                <button
                  onClick={() => { setShowResetModal(false); resetAllData() }}
                  className="w-full bg-red-500 text-white hover:bg-red-600 py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 select-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("confirmReset")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportModal(false)}
              className="absolute inset-0 bg-background/80 dark:bg-zinc-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative bg-card text-card-foreground border border-border/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <button
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/40 hover:bg-muted/70 flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground leading-tight">{t("importTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'id' ? 'Pulihkan data dari file ekspor JSON sebelumnya.' : 'Restore ledger data from a previously exported JSON file.'}
                  </p>
                </div>
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-muted/5 hover:bg-muted/15 flex flex-col items-center justify-center gap-3 group/dropzone my-4 relative"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-muted-foreground group-hover/dropzone:text-primary group-hover/dropzone:scale-105 transition-all" />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground max-w-[280px] truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-500 font-extrabold uppercase flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      FILE TERPILIH
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-semibold max-w-[280px] leading-relaxed">{t("dropBackup")}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="w-full bg-muted/40 hover:bg-muted/70 border border-border text-foreground py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none"
                >{t("cancel")}</button>
                <button
                  onClick={executeImport}
                  disabled={!selectedFile}
                  className="w-full bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent text-white hover:bg-emerald-600 py-2 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 select-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("importBtn")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
