"use client"

import { Edit2 } from "lucide-react"
import { type AutoLogRule } from "@/store/useAutoLogStore"
import { formatCurrency } from "@/lib/format"
import { getFrequencyLabel, getTypeLabel, getTranslation } from "@/lib/planning"
import { type Language } from "@/store/useLanguageStore"

interface Props {
  rule: AutoLogRule
  language: Language
  onEdit: (rule: AutoLogRule) => void
  onToggleActive: (id: string) => void
  onToast: (msg: string) => void
}

export function AutoLogRuleCard({ rule, language, onEdit, onToggleActive, onToast }: Props) {
  return (
    <div className="p-3.5 rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:bg-muted/10 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
            rule.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
          }`}>
            {rule.type === 'in' ? '+' : '-'} {getTypeLabel(rule.type, language)}
          </span>
          <span className="font-bold text-foreground text-xs truncate">{rule.title}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onEdit(rule)}
            className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors cursor-pointer"
            title={getTranslation(language, 'editRule')}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onToggleActive(rule.id)
              onToast(getTranslation(language, 'toastSaved'))
            }}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative flex items-center shrink-0 cursor-pointer ${
              rule.isActive ? 'bg-emerald-500' : 'bg-muted border border-border'
            }`}
            title={rule.isActive ? getTranslation(language, 'ruleActive') : getTranslation(language, 'ruleInactive')}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                rule.isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-baseline justify-between select-none">
        <span className={`text-sm font-black ${rule.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
          {rule.type === 'in' ? '+' : '-'}{formatCurrency(rule.amount, language)}
        </span>
        <span className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase bg-muted/60 border border-border/40 px-2 py-0.5 rounded">
          {getFrequencyLabel(rule.frequency, language)}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-semibold border-t border-border/20 pt-2">
        <div className="flex justify-between items-center">
          <span>{getTranslation(language, 'category')}: <strong className="text-foreground/90">{rule.category}</strong></span>
          <span>{getTranslation(language, 'ruleStartDate')}: <strong className="text-foreground/90">{new Date(rule.startDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</strong></span>
        </div>
        {rule.note && (
          <div className="text-[9px] italic text-muted-foreground/80 leading-tight">
            &apos;{rule.note}&apos;
          </div>
        )}
      </div>
    </div>
  )
}
