"use client"

import * as React from "react"
import { PieChart } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { DONUT_RADIUS, DONUT_STROKE_WIDTH, type DonutDataPoint } from "@/lib/statistics"

interface Props {
  donutData: DonutDataPoint[]
  totalSpent: number
  activeDonutIndex: number | null
  setActiveDonutIndex: (v: number | null) => void
  language: string
  mounted: boolean
}

export function DonutChart({ donutData, totalSpent, activeDonutIndex, setActiveDonutIndex, language, mounted }: Props) {
  if (totalSpent === 0 || donutData.length === 0) {
    return (
      <div className="h-[320px] w-full rounded-md border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
        <div className="p-3 bg-primary/10 rounded-full">
          <PieChart className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div>
          <p className="text-foreground font-bold text-sm">
            {language === 'id' ? 'Belum Ada Pengeluaran' : 'No Expenses Yet'}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
            {language === 'id'
              ? "Setiap pengeluaran Anda akan otomatis dianalisis dan dikelompokkan secara visual di sini."
              : "All your expense transactions will be automatically analyzed and categorized visually here."}
          </p>
        </div>
      </div>
    )
  }

  const circumference = 2 * Math.PI * DONUT_RADIUS
  let currentOffset = 0

  return (
    <>
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center select-none">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90 overflow-visible">
          {donutData.map((d, i) => {
            const isHovered = activeDonutIndex === i
            const dashArray = `${(d.percentage / 100) * circumference} ${circumference}`
            const offset = circumference - currentOffset
            currentOffset += (d.percentage / 100) * circumference
            return (
              <circle
                key={i}
                cx="60" cy="60" r={DONUT_RADIUS}
                fill="transparent" stroke={d.color}
                strokeWidth={isHovered ? DONUT_STROKE_WIDTH + 3 : DONUT_STROKE_WIDTH}
                strokeDasharray={dashArray} strokeDashoffset={offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                style={{ transformOrigin: "60px 60px" }}
                onMouseEnter={() => setActiveDonutIndex(i)}
                onMouseLeave={() => setActiveDonutIndex(null)}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
          {activeDonutIndex !== null && activeDonutIndex < donutData.length ? (
            <>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider line-clamp-1">
                {language === 'id' ? donutData[activeDonutIndex].category : donutData[activeDonutIndex].categoryEn}
              </span>
              <span className="text-sm font-extrabold text-primary mt-0.5">{donutData[activeDonutIndex].percentage}%</span>
              <span className="text-[10px] font-bold text-foreground mt-0.5">
                {formatCurrency(donutData[activeDonutIndex].amount, language as 'id' | 'en')}
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                {language === 'id' ? 'Total Pengeluaran' : 'Total Expense'}
              </span>
              <span className="text-sm font-extrabold text-foreground mt-0.5">
                {mounted ? formatCurrency(totalSpent, language as 'id' | 'en') : "Rp 0"}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="w-full space-y-2 text-xs pt-2 border-t border-border/40">
        {donutData.map((d, i) => {
          const label = language === 'id' ? d.category : d.categoryEn
          const isHovered = activeDonutIndex === i
          return (
            <div
              key={i}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-150 ${isHovered ? 'bg-primary/5 scale-[1.01]' : ''}`}
              onMouseEnter={() => setActiveDonutIndex(i)}
              onMouseLeave={() => setActiveDonutIndex(null)}
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className={`font-semibold text-foreground ${isHovered ? 'text-primary' : ''}`}>{label}</span>
              </div>
              <div className="flex items-center gap-3 font-bold text-foreground">
                <span>{d.percentage}%</span>
                <span className="text-muted-foreground font-semibold text-[11px]">
                  {mounted ? formatCurrency(d.amount, language as 'id' | 'en') : "Rp 0"}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
