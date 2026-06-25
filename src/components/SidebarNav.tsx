"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutDashboard, History, PiggyBank, TrendingUp, Calendar, Handshake } from "lucide-react"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import * as React from "react"

export function SidebarNav({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  const { language } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  const navItems = [
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
      href: "/statistics",
      label: t('statistics'),
      icon: TrendingUp,
    },
    {
      href: "/piutang",
      label: t('piutang'),
      icon: Handshake,
    },
    {
      href: "/calendar",
      label: t('calendar'),
      icon: Calendar,
    },
    {
      href: "/history",
      label: t('history'),
      icon: History,
    },
  ]

  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 gap-2">
        <nav className="flex flex-col gap-2 flex-1">
          <div className={`${isCollapsed ? 'w-12 h-12 mx-auto' : 'h-12'} bg-muted/20 animate-pulse rounded-xl`} />
          <div className={`${isCollapsed ? 'w-12 h-12 mx-auto' : 'h-12'} bg-muted/20 animate-pulse rounded-xl`} />
        </nav>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 relative z-10">
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center relative transition-all duration-300 font-medium ${
                isCollapsed 
                  ? "w-12 h-12 justify-center mx-auto rounded-xl" 
                  : "py-3 px-4 gap-3 rounded-lg w-full"
              } ${
                isActive
                  ? "text-primary-foreground scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeSidebarIndicator"
                  className={`absolute inset-0 bg-primary z-0 shadow-[0_4px_12px_rgba(129,11,56,0.3)] dark:shadow-[0_4px_16px_rgba(157,21,72,0.4)] ${
                    isCollapsed ? "rounded-xl" : "rounded-lg"
                  }`}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors duration-300 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              {!isCollapsed && <span className="relative z-10 text-sm tracking-wide">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
