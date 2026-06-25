"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, ArrowDown, ArrowUp } from "lucide-react"

interface Props {
  t: (k: string) => string
  mounted: boolean
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  balance: number
  totalIn: number
  totalOut: number
  periodSubLabel: string
}

export function SummaryCards({ t, mounted, formatCurrency, language, balance, totalIn, totalOut, periodSubLabel }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('cashBalance')}
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {mounted ? formatCurrency(balance, language) : formatCurrency(0, language)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('currentTotal')}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('income')}
          </CardTitle>
          <div className="p-2 bg-green-500/10 rounded-full">
            <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {mounted ? formatCurrency(totalIn, language) : formatCurrency(0, language)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('expense')}
          </CardTitle>
          <div className="p-2 bg-destructive/10 rounded-full">
            <ArrowUp className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {mounted ? formatCurrency(totalOut, language) : formatCurrency(0, language)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{periodSubLabel}</p>
        </CardContent>
      </Card>
    </div>
  )
}
