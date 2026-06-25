"use client"

import { formatCurrency } from "@/lib/format"
import { CheckCircle, Target, AlertTriangle } from "lucide-react"
import type { CategoryMonthData } from "@/lib/statistics"

interface Props {
  data: CategoryMonthData[]
  language: string
  t: (k: string) => string
}

export function VarianceDataTable({ data, language, t }: Props) {
  if (data.length === 0) return null
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <table className="w-full min-w-[500px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('category')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('periodBudget')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('periodActual')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('netVariance')}</th>
            <th className="text-right py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('usage')}</th>
            <th className="text-center py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              <td className="py-2.5 px-3 font-bold text-foreground">{d.category}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.periodBudget, language as 'id' | 'en')}</td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{formatCurrency(d.periodActual, language as 'id' | 'en')}</td>
              <td className={`py-2.5 px-3 text-right font-number font-bold ${d.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {d.variance >= 0 ? '+' : ''}{formatCurrency(d.variance, language as 'id' | 'en')}
              </td>
              <td className="py-2.5 px-3 text-right font-number font-semibold text-foreground">{`${d.usagePercent.toFixed(1)}%`}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  d.status === 'optimal' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  d.status === 'frugal' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  d.status === 'overbudget' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {d.status === 'optimal' && <CheckCircle className="w-2.5 h-2.5" />}
                  {d.status === 'frugal' && <Target className="w-2.5 h-2.5" />}
                  {d.status === 'overbudget' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {d.status === 'critical' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {t(d.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
