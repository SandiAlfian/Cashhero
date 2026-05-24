"use client"

import * as React from "react"
import { useSettingsStore } from "@/store/useSettingsStore"
import { SidebarNav } from "./SidebarNav"
import { LanguageToggle } from "./LanguageToggle"
import { ThemeToggle } from "./ThemeToggle"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function DesktopSidebar() {
  const [mounted, setMounted] = React.useState(false)
  const isSidebarCollapsed = useSettingsStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <aside className="hidden md:flex w-66 shrink-0 bg-sidebar flex-col p-6 border-r border-sidebar-border relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="font-bold text-xl text-primary tracking-tight">Cashhero</div>
          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <SidebarNav />
      </aside>
    )
  }

  return (
    <aside
      className={`hidden md:flex shrink-0 bg-sidebar flex-col border-r border-sidebar-border relative z-10 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-24 p-4 items-center" : "w-66 p-6"
      }`}
    >
      <div className={`flex items-center w-full mb-8 ${isSidebarCollapsed ? "justify-center flex-col gap-4" : "justify-between"}`}>
        {!isSidebarCollapsed ? (
          <div className="font-bold text-xl text-primary tracking-tight whitespace-nowrap overflow-hidden">
            Cashhero
          </div>
        ) : (
          <div className="font-bold text-2xl text-primary tracking-tight">
            C
          </div>
        )}
        <div className={`flex items-center gap-1.5 shrink-0 ${isSidebarCollapsed ? "flex-col" : ""}`}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <SidebarNav isCollapsed={isSidebarCollapsed} />

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
