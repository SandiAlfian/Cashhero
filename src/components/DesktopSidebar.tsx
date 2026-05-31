"use client"

import * as React from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { SidebarNav } from "./SidebarNav"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { LogoIcon } from "./LogoIcon"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useLanguageStore, translations } from "@/store/useLanguageStore"

function SettingsFooterLink({ isCollapsed }: { isCollapsed: boolean }) {
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

  const isSettingsActive = pathname === "/settings"

  if (!mounted) {
    return (
      <div className="w-full">
        <div className={`${isCollapsed ? 'w-12 h-12 mx-auto' : 'h-12'} bg-muted/20 animate-pulse rounded-xl`} />
      </div>
    )
  }

  return (
    <Link
      href="/settings"
      title={isCollapsed ? t('settings') : undefined}
      className={`flex items-center relative transition-all duration-300 font-medium ${
        isCollapsed 
          ? "w-12 h-12 justify-center mx-auto rounded-xl" 
          : "py-3 px-4 gap-3 w-full rounded-lg"
      } ${
        isSettingsActive
          ? "text-primary-foreground scale-[1.02]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`}
    >
      {isSettingsActive && (
        <motion.span
          layoutId="activeSidebarSettingsIndicator"
          className={`absolute inset-0 bg-primary z-0 shadow-[0_4px_12px_rgba(129,11,56,0.3)] dark:shadow-[0_4px_16px_rgba(157,21,72,0.4)] ${
            isCollapsed ? "rounded-xl" : "rounded-lg"
          }`}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        />
      )}
      <Settings className={`w-5 h-5 relative z-10 transition-colors duration-300 ${isSettingsActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
      {!isCollapsed && <span className="relative z-10 text-sm tracking-wide">{t('settings')}</span>}
    </Link>
  )
}

export function DesktopSidebar() {
  const [mounted, setMounted] = React.useState(false)
  const isSidebarCollapsed = useSettingsStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Component-scoped font face definition to ensure Adumu font is always rendered in sidebar
  const fontStyle = (
    <style>{`
      @font-face {
        font-family: 'Adumu';
        src: url('/fonts/Adumu.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `}</style>
  )

  if (!mounted) {
    return (
      <aside className="hidden md:flex w-64 shrink-0 bg-sidebar flex-col p-6 border-r border-sidebar-border relative z-10">
        {fontStyle}
        {/* Clean, dedicated brand header */}
        <div className="flex items-center gap-2.5 mb-8 pb-4 border-b border-sidebar-border/50">
          <LogoIcon className="w-8 h-8 shrink-0" size={32} />
          <span className="font-extrabold text-xl tracking-tight select-none">
            <span className="text-[#2D2B33] dark:text-[#F3EBE1]">Cash</span>
            <span className="text-primary font-black">Hero</span>
          </span>
        </div>
        
        {/* Navigation Area */}
        <div className="flex-1 w-full overflow-visible">
          <SidebarNav />
        </div>
        
        {/* Settings Footer Section */}
        <div className="w-full pt-4 border-t border-sidebar-border/40 mt-auto">
          <SettingsFooterLink isCollapsed={false} />
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`hidden md:flex shrink-0 bg-sidebar flex-col border-r border-sidebar-border relative z-10 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-20 p-4 items-center" : "w-64 p-6"
      }`}
    >
      {fontStyle}
      
      {/* 1. BRAND HEADER SECTION */}
      <div 
        className={`flex items-center w-full mb-8 pb-4 border-b border-sidebar-border/40 ${
          isSidebarCollapsed ? "justify-center" : "justify-start gap-2.5"
        }`}
      >
        {!isSidebarCollapsed ? (
          <>
            <LogoIcon className="w-8 h-8 shrink-0 transition-transform duration-300 hover:scale-105" size={32} />
            <span className="font-extrabold text-xl tracking-tight select-none">
              <span className="text-[#2D2B33] dark:text-[#F3EBE1]">Cash</span>
              <span className="text-primary font-black">Hero</span>
            </span>
          </>
        ) : (
          <LogoIcon className="w-9 h-9 shrink-0 hover:scale-110 transition-transform duration-300" size={36} />
        )}
      </div>

      {/* 2. NAVIGATION MAIN AREA */}
      <div className="flex-1 w-full overflow-visible">
        <SidebarNav isCollapsed={isSidebarCollapsed} />
      </div>

      {/* 3. SETTINGS FOOTER SECTION */}
      <div className="w-full pt-4 border-t border-sidebar-border/40 mt-auto">
        <SettingsFooterLink isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Collapse/Expand Toggle Handle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 bg-primary text-primary-foreground p-1 rounded-full shadow-md hover:scale-110 transition-all z-20 cursor-pointer"
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
