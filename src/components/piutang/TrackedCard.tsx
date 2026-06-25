"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { JenisBadge } from "./JenisBadge"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useRouter } from "next/navigation"
import type { TrackedOutflow } from "@/store/useTrackedOutflowsStore"

export function TrackedCard({ item }: { item: TrackedOutflow }) {
  const language = useLanguageStore((s) => s.language)
  const router = useRouter()

  const isId = language === 'id'
  const pct = item.amount > 0 ? ((item.amount - item.remainingAmount) / item.amount) * 100 : 0

  return (
    <Card
      className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      onClick={() => router.push(`/piutang/${item.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <JenisBadge jenis={item.jenis} language={language} />
              {item.status === 'settled' && (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {isId ? 'Lunas' : 'Paid'}
                </span>
              )}
            </div>
            <h3 className="font-bold text-foreground text-sm truncate">{item.personName}</h3>
            {item.note && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{item.note}</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-card-foreground font-number">
              {formatCurrency(item.remainingAmount, language as 'id' | 'en')}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isId ? 'dari' : 'of'} {formatCurrency(item.amount, language as 'id' | 'en')}
            </div>
          </div>
        </div>
        <div className="mt-2.5 w-full bg-muted/40 rounded-full h-1.5 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${item.status === 'settled' ? 'bg-green-500' : 'bg-primary/60'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-muted-foreground/60">
            {new Date(item.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
            {item.dueDate && ` · ${isId ? 'jatuh' : 'due'} ${new Date(item.dueDate).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}`}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground font-number">
            {pct.toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
