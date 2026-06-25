"use client"

import { ShieldAlert, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  t: (k: string) => string
  mounted: boolean
  formatRelativeDate: (date: string, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  oldestUpdateDate: string
  onOpenPortfolio: () => void
}

export function WeeklyReminderBanner({
  t, mounted, formatRelativeDate, language,
  oldestUpdateDate, onOpenPortfolio,
}: Props) {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      <div className="flex gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg self-start sm:self-center">
          <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            {t('weeklyReminder')}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            {t('weeklyReminderDesc')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {t('lastUpdated')}: {mounted ? formatRelativeDate(oldestUpdateDate, language) : ""}
        </span>
        <Button
          size="sm"
          onClick={onOpenPortfolio}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg px-3 py-1.5 cursor-pointer shadow-sm"
        >
          {t('updatePortfolio')}
        </Button>
      </div>
    </div>
  )
}
