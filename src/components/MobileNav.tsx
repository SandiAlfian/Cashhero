"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  PiggyBank, 
  TrendingUp, 
  Calendar, 
  History, 
  Settings 
} from "lucide-react"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between px-6 py-4 bg-sidebar border-b border-sidebar-border sticky top-0 z-30 transition-colors duration-300 no-print">
      <div className="font-bold text-xl text-primary tracking-tight">Cashhero</div>
      <div className="flex items-center gap-2 shrink-0">
        <LanguageToggle />
        <ThemeToggle />
        <Link 
          href="/settings" 
          className="p-2 hover:bg-primary/10 dark:hover:bg-rose-950/20 rounded-lg transition-all duration-300 relative overflow-hidden"
        >
          <motion.div
            whileHover={{ scale: 1.15, rotate: 25 }}
            whileTap={{ scale: 0.85, rotate: 180 }}
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
            className="flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-primary/70 hover:text-primary dark:text-rose-400/80 dark:hover:text-rose-300 transition-colors" />
          </motion.div>
        </Link>
      </div>
    </header>
  )
}

export function MobileBottomBar() {
  const pathname = usePathname()
  const { language } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    // Sistem Haptic Premium: Getaran instan berlatensi nol dengan touchstart
    // Menggunakan cooldown/debounce untuk mencegah getaran ganda saat event click menyusul
    let lastVibrateTime = 0
    const triggerHaptic = () => {
      const now = Date.now()
      if (now - lastVibrateTime > 150) {
        if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
          // Getaran haptic 12ms yang sangat halus, pendek, dan memuaskan ala aplikasi native premium
          window.navigator.vibrate(12)
        }
        lastVibrateTime = now
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const interactiveEl = target.closest('button, a, [role="button"]')
      if (interactiveEl) {
        triggerHaptic()
      }
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactiveEl = target.closest('button, a, [role="button"]')
      if (interactiveEl) {
        triggerHaptic()
      }
    }

    // Mendengarkan touchstart dengan opsi { passive: true } untuk performa gulir halaman yang mulus
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("click", handleGlobalClick)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("click", handleGlobalClick)
    }
  }, [])

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  const items = [
    {
      href: "/",
      label: t('dashboard'),
      icon: LayoutDashboard,
    },
    {
      href: "/planning",
      label: t('planning'),
      icon: PiggyBank,
    },
    {
      href: "/calendar",
      label: t('calendar'),
      icon: Calendar,
    },
    {
      href: "/statistics",
      label: t('statistics'),
      icon: TrendingUp,
    },
    {
      href: "/history",
      label: language === 'id' ? 'Riwayat' : 'History',
      icon: History,
    },
  ]

  if (!mounted) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/80 backdrop-blur-lg border-t border-border/80 px-2 py-2.5 pb-safe flex items-center justify-around no-print shadow-[0_-4px_16px_rgba(0,0,0,0.05)] transition-all duration-300">
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 relative py-1 px-3.5 rounded-xl transition-all duration-200"
          >
            {isActive && (
              <motion.span
                layoutId="activeMobileTabIndicator"
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl z-0"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon 
              className={`w-5.5 h-5.5 relative z-10 transition-all duration-300 ${
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground/80 hover:text-foreground"
              }`} 
            />
            <span 
              className={`text-[9px] font-bold tracking-wider relative z-10 uppercase transition-colors duration-300 ${
                isActive 
                  ? "text-primary font-extrabold" 
                  : "text-muted-foreground/80"
              }`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
