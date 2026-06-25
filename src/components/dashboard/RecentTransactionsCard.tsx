"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { Transaction } from "@/store/useTransactionStore"

interface Props {
  t: (k: string) => string
  mounted: boolean
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  formatRelativeDate: (date: string, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  recentTransactions: Transaction[]
}

export function RecentTransactionsCard({
  t, mounted, formatCurrency, formatRelativeDate, language,
  recentTransactions,
}: Props) {
  return (
    <Card className="md:col-span-3 bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground">{t('recentTransactions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentTransactions.length > 0 ? recentTransactions.map((item) => {
            const noteDisplay = item.note === 'Modal awal' ? t('initialNote') : item.note
            const categoryDisplay = item.category === 'Saldo Awal' ? t('initialBalance') : item.category

            return (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${item.type === 'in' ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-destructive/10 group-hover:bg-destructive/20'}`}>
                    {item.type === 'in' ? (
                      <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none text-card-foreground">{noteDisplay}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {categoryDisplay} &bull; {mounted ? formatRelativeDate(item.date, language) : ""}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold text-sm ${item.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-card-foreground'}`}>
                  {item.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(item.amount, language) : formatCurrency(0, language)}
                </div>
              </div>
            )
          }) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noTransactions')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
