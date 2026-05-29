"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Check if already installed / running in standalone mode
    const standaloneMode = window.matchMedia("(display-mode: standalone)").matches 
      || ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
    setIsStandalone(standaloneMode)

    if (standaloneMode) return

    // 2. Check if user already dismissed it
    const hasDismissed = localStorage.getItem("cashhero-pwa-dismissed") === "true"
    if (hasDismissed) return

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosSafari = /iphone|ipad|ipod/.test(userAgent) && !/crios|fxios|opr\//.test(userAgent)
    setIsIOS(iosSafari)

    // 4. Capture beforeinstallprompt for Chrome / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // 5. Show PWA install suggestion toast after 3 seconds on first load
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show elegant alert/instructions for iOS Safari
      alert(
        "Untuk memasang Cashhero di iPhone/iPad Anda:\n\n" +
        "1. Klik tombol 'Bagikan' (Share) di menu bawah Safari.\n" +
        "2. Gulir ke bawah lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).\n" +
        "3. Klik 'Tambah' (Add) di pojok kanan atas."
      )
      handleDismiss()
      return
    }

    if (!deferredPrompt) {
      // Show generic instructions for other browsers when native deferredPrompt is not available
      alert(
        "Untuk memasang Cashhero di perangkat Anda:\n\n" +
        "1. Klik tombol menu (titik tiga atau bagikan) di browser Anda.\n" +
        "2. Pilih 'Instal Cashhero', 'Pasang Aplikasi', atau 'Tambahkan ke Layar Utama'.\n" +
        "3. Konfirmasi pemasangan."
      )
      handleDismiss()
      return
    }

    // Trigger native browser install prompt
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA install prompt choice: ${outcome}`)
    
    // Clear prompt and dismiss
    setDeferredPrompt(null)
    handleDismiss()
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("cashhero-pwa-dismissed", "true")
  }

  if (isStandalone || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="fixed bottom-6 left-6 right-6 md:left-8 md:right-auto z-[9999] md:max-w-md bg-card/95 dark:bg-zinc-950/95 backdrop-blur-md border border-border/80 p-4.5 rounded-2xl shadow-2xl flex flex-col gap-3.5 no-print"
      >
        {/* Header with Close */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Pasang Aplikasi Cashhero</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
                Unduh ke Layar Utama Anda untuk akses offline instan & performa kilat.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
            title="Tutup & Jangan Tampilkan Lagi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 text-[11px] font-extrabold uppercase py-2 px-3 rounded-xl transition-all shadow-md cursor-pointer text-center select-none active:scale-[0.98]"
          >
            Pasang Sekarang
          </button>
          <button
            onClick={handleDismiss}
            className="bg-muted hover:bg-muted/80 text-foreground border border-border/40 text-[10px] font-bold uppercase py-2 px-3 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98]"
          >
            Nanti Saja
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
