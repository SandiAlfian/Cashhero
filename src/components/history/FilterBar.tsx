"use client"

import * as React from "react"
import { Filter, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { HistoryFilter } from "@/lib/history"

interface FilterBarProps {
  filter: HistoryFilter
  setFilter: (f: HistoryFilter) => void
  startDate: string
  setStartDate: (d: string) => void
  endDate: string
  setEndDate: (d: string) => void
  language: string
  t: (key: string) => string
}

export function FilterBar({ filter, setFilter, startDate, setStartDate, endDate, setEndDate, t }: FilterBarProps) {
  const [isMobileFilterDropdownOpen, setIsMobileFilterDropdownOpen] = React.useState(false)

  return (
    <div className="relative z-10 flex flex-col gap-4 bg-card border border-border p-4 rounded-xl shadow-sm no-print">
      {/* TAMPILAN DESKTOP (Horizontal Buttons & Inline Date) */}
      <div className="hidden md:flex flex-row items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none w-full max-w-full py-1">
        <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1 uppercase tracking-wider shrink-0 select-none">
          <Filter className="w-3.5 h-3.5" />
          {t('filterPeriod')}:
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {(['daily', 'weekly', 'monthly', 'quarterly', 'customPeriod'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                filter === p
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent hover:border-border"
              }`}
            >
              {t(p)}
            </button>
          ))}
        </div>

        {filter === 'customPeriod' && (
          <div className="flex flex-row items-center gap-3 shrink-0 animate-in fade-in slide-in-from-left-1 duration-200 border-l border-border/60 dark:border-zinc-700/60 pl-3.5 ml-2 font-number">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted/30 dark:bg-zinc-800/30 border border-border dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary shrink-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAMPILAN MOBILE (Dropdown & Bottom Row Date) */}
      <div className="flex md:hidden flex-col gap-3.5 w-full">
        <div className="flex items-center justify-between gap-3 w-full relative">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider select-none">
            <Filter className="w-4 h-4" />
            {t('filterPeriod')}
          </span>

          {/* Interactive Custom Dropdown */}
          <div className="relative flex-1 max-w-[200px]">
            <button
              onClick={() => setIsMobileFilterDropdownOpen(!isMobileFilterDropdownOpen)}
              className="w-full px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>{t(filter)}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMobileFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMobileFilterDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[180px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                >
                  {(['daily', 'weekly', 'monthly', 'quarterly', 'customPeriod'] as const).map((p) => {
                    const isActive = filter === p
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setFilter(p)
                          setIsMobileFilterDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        <span>{t(p)}</span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {filter === 'customPeriod' && (
          <div className="flex flex-row items-center justify-between gap-3 w-full animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/20 border border-border/60 dark:border-zinc-700/60 p-3 rounded-xl font-number">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('startDate')}:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">{t('endDate')}:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border border-border dark:border-zinc-700/80 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
