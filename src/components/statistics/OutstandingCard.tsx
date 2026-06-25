"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Handshake } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"

export function OutstandingCard({ language, t }: { language: string; t: (k: string) => string }) {
  const items = useTrackedOutflowsStore((s) => s.items)
  const activeItems = items.filter((i) => i.status === 'active')
  if (activeItems.length === 0) return null

  const total = activeItems.reduce((sum, i) => sum + i.remainingAmount, 0)
  const byJenis = new Map<string, number>()
  for (const i of activeItems) {
    byJenis.set(i.jenis, (byJenis.get(i.jenis) || 0) + i.remainingAmount)
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
          <Handshake className="w-5 h-5 text-primary" />
          {t('piutang')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('totalOutstanding')}</span>
            <p className="text-xl font-extrabold text-card-foreground font-number">
              {formatCurrency(total, language as 'id' | 'en')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(byJenis.entries()).map(([jenis, amount]) => (
              <span key={jenis} className="inline-flex items-center gap-1 px-2 py-1 bg-muted/40 rounded-lg text-[10px] font-bold text-muted-foreground">
                {jenis}: {formatCurrency(amount, language as 'id' | 'en')}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
