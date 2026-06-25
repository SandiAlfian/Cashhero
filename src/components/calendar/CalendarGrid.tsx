"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { CalendarCell, DailySummary } from "@/lib/calendar"

import type { Language } from "@/store/useLanguageStore"

interface CalendarGridProps {
  gridCells: CalendarCell[]
  dailySummaryMap: Record<string, DailySummary>
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  currentMonth: number
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
  weekDays: string[]
  formatCurrency: (amount: number, lang: Language) => string
  language: Language
}

export function CalendarGrid({
  gridCells,
  dailySummaryMap,
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  setCurrentYear,
  weekDays,
  formatCurrency,
  language
}: CalendarGridProps) {
  return (
    <Card className="xl:col-span-8 bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-2xl">
      <CardContent className="p-0">

        {/* Kalender Grid Header (Mon-Sun) */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-muted/20 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground select-none">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`py-3 ${idx >= 5 ? "bg-muted/10 text-primary/80 font-black dark:text-pink-400" : ""}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Kalender Cells Grid */}
        <div className="grid grid-cols-7 bg-transparent divide-x divide-y divide-border/20">
          {gridCells.map((cell, idx) => {
            const cellY = cell.date.getFullYear()
            const cellM = cell.date.getMonth()
            const cellD = cell.date.getDate()

            const key = `${cellY}-${String(cellM + 1).padStart(2, '0')}-${String(cellD).padStart(2, '0')}`
            const stats = dailySummaryMap[key]

            const today = new Date()
            const isToday = cellY === today.getFullYear() && cellM === today.getMonth() && cellD === today.getDate()

            const isSelected = cellY === selectedDate.getFullYear() && cellM === selectedDate.getMonth() && cellD === selectedDate.getDate()

            const isWeekend = idx % 7 === 5 || idx % 7 === 6

            return (
              <div
                key={cell.key}
                onClick={() => {
                  setSelectedDate(cell.date)
                  if (cellM !== currentMonth) {
                    setCurrentMonth(cellM)
                    setCurrentYear(cellY)
                  }
                }}
                className={`min-h-[90px] md:min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground/35 bg-black/5 dark:bg-white/[0.01]"
                } ${
                  isWeekend && cell.isCurrentMonth ? "bg-primary/[0.01] dark:bg-pink-500/[0.01]" : ""
                } ${
                  isSelected
                    ? "bg-primary/5 border-2 border-primary shadow-[0_0_24px_rgba(157,21,72,0.15)] ring-1 ring-primary z-20"
                    : "hover:bg-muted/30"
                }`}
              >

                {isToday && (
                  <div className="absolute inset-0.5 border border-amber-500/40 dark:border-amber-400/50 rounded-lg animate-pulse z-0 pointer-events-none" />
                )}

                <div className="flex items-center justify-between select-none z-10">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-between leading-none p-1 ${
                    isToday
                      ? "bg-amber-500 text-white font-black shadow-md dark:bg-amber-500"
                      : isWeekend && cell.isCurrentMonth
                        ? "text-primary dark:text-pink-400 font-extrabold"
                        : ""
                  }`}>
                    {cellD}
                  </span>

                  {stats && stats.txCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-muted/40 border border-border/50 text-muted-foreground leading-none">
                      {stats.txCount}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 mt-auto z-10 w-full overflow-hidden select-none">
                  {stats && stats.income > 0 && cell.isCurrentMonth && (
                    <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 leading-none tracking-tighter truncate md:block hidden">
                      +{formatCurrency(stats.income, language)}
                    </span>
                  )}
                  {stats && stats.expense > 0 && cell.isCurrentMonth && (
                    <span className="text-[9px] font-bold text-primary dark:text-pink-500 leading-none tracking-tighter truncate md:block hidden">
                      -{formatCurrency(stats.expense, language)}
                    </span>
                  )}

                  <div className="flex gap-1 justify-center md:hidden mt-1">
                    {stats && stats.income > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                    {stats && stats.expense > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
