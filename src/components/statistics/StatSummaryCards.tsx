"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react"
import { formatCurrency, getTranslation } from "@/lib/format"
import type { Language } from "@/store/useLanguageStore"

interface Props {
  totalIn: number
  totalOut: number
  netFlow: number
  periodSubLabel: string
  language: Language
  mounted: boolean
}

export default function StatSummaryCards({ totalIn, totalOut, netFlow, periodSubLabel, language, mounted }: Props) {
  const t = (key: string) => getTranslation(language, key)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('income')}</CardTitle>
          <div className="p-2 bg-green-500/10 rounded-full"><ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{mounted ? formatCurrency(totalIn, language) : "Rp 0"}</div>
          <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('expense')}</CardTitle>
          <div className="p-2 bg-destructive/10 rounded-full"><ArrowUp className="h-4 w-4 text-destructive" /></div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{mounted ? formatCurrency(totalOut, language) : "Rp 0"}</div>
          <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'id' ? 'Selisih Arus Kas' : 'Net Flow'}</CardTitle>
          <div className={`p-2 rounded-full ${netFlow >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
            <TrendingUp className={`h-4 w-4 ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{mounted ? (netFlow >= 0 ? "+" : "") + formatCurrency(netFlow, language) : "Rp 0"}</div>
          <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}
