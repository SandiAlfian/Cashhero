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
  Handshake,
  Settings
} from "lucide-react"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"
import { LogoIcon } from "./LogoIcon"

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-30 transition-all duration-300 no-print">
      <div className="flex items-center gap-2.5 select-none">
        <LogoIcon className="w-8 h-8 shrink-0" size={32} />
        <span className="font-bold text-base tracking-tight text-foreground">
          Cash<span className="text-primary">Hero</span>
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <LanguageToggle />
        <ThemeToggle />
        <div className="w-px h-5 bg-border/50 mx-0.5" />
        <Link
          href="/settings"
          className="p-2.5 hover:bg-muted rounded-xl transition-all duration-300 active:scale-95"
          aria-label="Settings"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 25 }}
            whileTap={{ scale: 0.85, rotate: 180 }}
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
          >
            <Settings className="w-5 h-5 text-muted-foreground/70 hover:text-foreground transition-colors duration-300" />
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
      label: language === 'id' ? 'Rencana' : 'Planning',
      icon: PiggyBank,
    },
    {
      href: "/calendar",
      label: language === 'id' ? 'Kalender' : 'Calendar',
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
    {
      href: "/piutang",
      label: language === 'id' ? 'Piutang' : 'Receivables',
      icon: Handshake,
    },
  ]

  if (!mounted) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/80 backdrop-blur-lg border-t border-border/80 px-2 py-2.5 pb-safe grid grid-cols-6 justify-items-center items-center no-print shadow-[0_-4px_16px_rgba(0,0,0,0.05)] transition-all duration-300">
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 relative py-1 w-full max-w-[72px] rounded-xl transition-all duration-200"
          >
            {isActive && (
              <motion.span
                layoutId="activeMobileTabIndicator"
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl z-0"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className={`w-5.5 h-5.5 relative z-10 transition-all duration-300 ${isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground/80 hover:text-foreground"
                }`}
            />
            <span
              className={`text-[8px] font-bold tracking-wider relative z-10 uppercase transition-colors duration-300 ${isActive
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
