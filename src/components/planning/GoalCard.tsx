"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PiggyBank } from "lucide-react"
import { Edit2 } from "lucide-react"
import { type SavingGoal } from "@/store/usePlanningStore"
import { formatCurrency } from "@/lib/format"
import { calculateGoalProgress, getTranslation } from "@/lib/planning"
import { type Language } from "@/store/useLanguageStore"
import { iconMapping, iconOptions } from "@/lib/planning"
import { ProgressBar } from "./ProgressBar"

interface Props {
  goal: SavingGoal
  language: Language
  onEdit: (g: SavingGoal) => void
}

export function GoalCard({ goal, language, onEdit }: Props) {
  const { percentage, remaining } = calculateGoalProgress(goal.collected, goal.target)

  const IconComp = iconMapping[goal.iconName] || PiggyBank
  const optionMatch = iconOptions.find(o => o.value === goal.iconName)
  const colorClass = optionMatch ? `${optionMatch.bg} ${optionMatch.text}` : 'bg-primary/10 text-primary'

  return (
    <Card className="bg-card border-border/60 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col justify-between">
      <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
        <IconComp className="w-24 h-24" />
      </div>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className={`p-2 rounded-lg border border-border/40 ${colorClass}`}>
          <IconComp className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors cursor-pointer"
            title={getTranslation(language, 'editGoal')}
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{goal.title}</h3>
          <div className="flex items-center justify-between mt-3 mb-1.5 text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[8px] uppercase font-semibold tracking-wider mb-0.5">{getTranslation(language, 'collectedLabel')}</span>
              <span className="font-bold text-foreground text-xs">{formatCurrency(goal.collected, language)}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block text-[8px] uppercase font-semibold tracking-wider mb-0.5">{getTranslation(language, 'targetLabel')}</span>
              <span className="font-bold text-muted-foreground text-xs">{formatCurrency(goal.target, language)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <ProgressBar percentage={percentage} className="h-1.5" />
          <div className="flex items-center justify-between text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
            <span>{getTranslation(language, 'remainingLabel')}</span>
            <span>{formatCurrency(remaining, language)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
