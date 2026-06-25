"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Coins, Calendar as CalendarIcon } from "lucide-react"
import type { MtdStats } from "@/lib/calendar"

import type { Language } from "@/store/useLanguageStore"

interface MtdStatCardsProps {
  mtdStats: MtdStats
  language: Language
  t: (key: string) => string
  formatCurrency: (amount: number, lang: Language) => string
}

export function MtdStatCards({ mtdStats, language, t, formatCurrency }: MtdStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Pemasukan */}
      <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-emerald-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('income')}</span>
            <span className="text-lg font-black text-emerald-500 tracking-tight mt-1">
              {formatCurrency(mtdStats.income, language)}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
            <ArrowUp className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Pengeluaran */}
      <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-primary/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('expense')}</span>
            <span className="text-lg font-black text-primary tracking-tight mt-1">
              {formatCurrency(mtdStats.expense, language)}
            </span>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl">
            <ArrowDown className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Selisih Bersih */}
      <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-blue-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              {language === 'id' ? 'Saldo Bersih' : 'Net Balance'}
            </span>
            <span className={`text-lg font-black tracking-tight mt-1 ${mtdStats.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
              {mtdStats.net < 0 ? "-" : ""}{formatCurrency(Math.abs(mtdStats.net), language)}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${mtdStats.net >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"}`}>
            <Coins className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Hari Aktif */}
      <Card className="bg-card/30 backdrop-blur-md border-border/40 hover:border-amber-500/20 hover:bg-card/50 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl transition-all duration-300 group-hover:scale-155" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{t('activeDays')}</span>
            <span className="text-lg font-black text-amber-500 tracking-tight mt-1">
              {mtdStats.activeDays} {language === 'id' ? 'Hari' : 'Days'}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-900/30 text-amber-500 dark:text-amber-400 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
