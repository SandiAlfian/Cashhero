"use client"

import * as React from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { SidebarNav } from "./SidebarNav"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LogoIcon } from "./LogoIcon"

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
      <aside className="hidden md:flex w-66 shrink-0 bg-sidebar flex-col p-6 border-r border-sidebar-border relative z-10">
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
        <div className="flex-1">
          <SidebarNav />
        </div>

        {/* Footer Utilities */}
        <div className="pt-4 border-t border-sidebar-border/50 flex items-center justify-between gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`hidden md:flex shrink-0 bg-sidebar flex-col border-r border-sidebar-border relative z-10 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-20 p-4 items-center" : "w-66 p-6"
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
      <div className="flex-1 w-full">
        <SidebarNav isCollapsed={isSidebarCollapsed} />
      </div>

      {/* 3. UTILITY FOOTER SECTION */}
      <div 
        className={`w-full pt-4 border-t border-sidebar-border/40 flex ${
          isSidebarCollapsed 
            ? "flex-col items-center gap-3.5" 
            : "items-center justify-between gap-2"
        }`}
      >
        <LanguageToggle />
        <ThemeToggle />
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
