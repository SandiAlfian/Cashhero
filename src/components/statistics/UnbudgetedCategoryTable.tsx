"use client"

import { formatCurrency } from "@/lib/format"
import type { UnbudgetedCategoryData } from "@/lib/statistics"

interface Props {
  data: UnbudgetedCategoryData[]
  language: string
  t: (k: string) => string
}

export function UnbudgetedCategoryTable({ data, language, t }: Props) {
  if (data.length === 0) return null
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <table className="w-full min-w-[400px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('category')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('transactionFrequency')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('avgPerTx')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('amount')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 font-bold text-foreground">{d.category}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{d.txCount}x</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.avgPerTransaction, language as 'id' | 'en')}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.totalSpent, language as 'id' | 'en')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
