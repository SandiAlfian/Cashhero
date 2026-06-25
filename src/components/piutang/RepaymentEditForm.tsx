"use client"

import * as React from "react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { formatInputVal, parseNum, getTranslation, CURRENCY_SYMBOLS } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"

interface Props {
  repayment: { id: string; amount: number; date: string; note: string }
  onSave: (updates: { amount?: number; date?: string; note?: string }) => void
  onDelete: () => void
  onCancel: () => void
}

export function RepaymentEditForm({ repayment, onSave, onDelete, onCancel }: Props) {
  const language = useLanguageStore((s) => s.language)
  const activeCurrency = useSettingsStore((s) => s.currency)
  const t = (key: string) => getTranslation(language, key)

  const [amount, setAmount] = React.useState(formatInputVal(String(repayment.amount)))
  const [date, setDate] = React.useState(repayment.date)
  const [note, setNote] = React.useState(repayment.note)

  return (
    <div className="bg-muted/20 border border-border/40 rounded-lg p-3 space-y-2 my-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="font-semibold text-[9px] uppercase tracking-wider text-muted-foreground/80">{t('paymentAmount')}</label>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-muted-foreground/60 font-semibold text-xs select-none">
              {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
            </span>
            <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatInputVal(e.target.value))}
              placeholder="0"
              className="pl-7 pr-2 bg-background border border-border rounded-lg text-xs font-bold text-foreground tracking-wide h-8 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder-muted-foreground/45" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">{t('paymentDate')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
      </div>
      <div>
        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">{t('paymentNote')}</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onDelete}
          className="px-2 py-1 text-destructive text-[9px] font-bold hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
        >
          {t('deleteOutflow')}
        </button>
        <button onClick={onCancel}
          className="px-2.5 py-1 bg-muted/40 text-muted-foreground rounded-lg text-[9px] font-bold hover:text-foreground transition-all cursor-pointer"
        >
          {t('cancel')}
        </button>
        <button onClick={() => onSave({ amount: parseNum(amount), date, note })}
          className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[9px] font-bold transition-all cursor-pointer active:scale-95"
        >
          {t('save')}
        </button>
      </div>
    </div>
  )
}
