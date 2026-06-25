"use client"

import { AlertTriangle, Edit2 } from "lucide-react"
import { type BudgetLimit } from "@/store/usePlanningStore"
import { formatCurrency } from "@/lib/format"
import { calculateBudgetPercentage, getSpentAmount, getTranslation } from "@/lib/planning"
import { type Language } from "@/store/useLanguageStore"
import { ProgressBar } from "./ProgressBar"

interface Props {
  budget: BudgetLimit
  language: Language
  transactions: Array<{ type: string; category: string; amount: number }>
  onEdit: (b: BudgetLimit) => void
}

export function BudgetItem({ budget, language, transactions, onEdit }: Props) {
  const spent = getSpentAmount(transactions, budget.category)
  const percentage = calculateBudgetPercentage(spent, budget.limit)
  const isCritical = percentage >= 80

  return (
    <div className="p-3 rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:bg-muted/10">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
            {budget.category}
            {isCritical && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-0.5 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" />
                CRITICAL
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEdit(budget)}
              className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors cursor-pointer"
              title={getTranslation(language, 'editBudget')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <span className={`text-xs font-bold ${isCritical ? 'text-primary' : 'text-muted-foreground'}`}>
              {percentage}%
            </span>
          </div>
        </div>

        <ProgressBar percentage={percentage} isCritical={isCritical} />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
          <span>{getTranslation(language, 'activeLabel')}: {formatCurrency(spent, language)}</span>
          <span>{getTranslation(language, 'targetLabel')}: {formatCurrency(budget.limit, language)}</span>
        </div>
      </div>
    </div>
  )
}
