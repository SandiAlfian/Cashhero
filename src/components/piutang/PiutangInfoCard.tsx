"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore, JENIS_OPTIONS } from "@/store/useTrackedOutflowsStore"
import { formatCurrency, formatInputVal, getTranslation, CURRENCY_SYMBOLS } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"
import { JenisBadge } from "@/components/piutang/JenisBadge"
import { Card, CardContent } from "@/components/ui/card"
import type { TrackedOutflow } from "@/store/useTrackedOutflowsStore"

export interface PiutangInfoCardHandle {
  triggerSave: () => void
}

interface Props {
  item: TrackedOutflow
  isEditing: boolean
  onSaved: () => void
  onSettleConfirm: () => void
}

export const PiutangInfoCard = React.forwardRef<PiutangInfoCardHandle, Props>(
  function PiutangInfoCard({ item, isEditing, onSaved, onSettleConfirm }, ref) {
    const language = useLanguageStore((s) => s.language)
    const activeCurrency = useSettingsStore((s) => s.currency)
    const updateItem = useTrackedOutflowsStore((s) => s.updateItem)
    const t = (key: string) => getTranslation(language, key)
    const isId = language === 'id'

    const [editJenis, setEditJenis] = React.useState('')
    const [editPerson, setEditPerson] = React.useState('')
    const [editAmount, setEditAmount] = React.useState('')
    const [editDate, setEditDate] = React.useState('')
    const [editDueDate, setEditDueDate] = React.useState('')
    const [editNote, setEditNote] = React.useState('')

    React.useEffect(() => {
      if (isEditing) {
        setEditJenis(item.jenis)
        setEditPerson(item.personName)
        setEditAmount(formatInputVal(String(item.amount)))
        setEditDate(item.date)
        setEditDueDate(item.dueDate)
        setEditNote(item.note)
      }
    }, [isEditing, item.jenis, item.personName, item.amount, item.date, item.dueDate, item.note])

    const pct = item.amount > 0 ? ((item.amount - item.remainingAmount) / item.amount) * 100 : 0
    const isActive = item.status === 'active'

    const handleSaveEdit = React.useCallback(() => {
      const parsed = parseNum(editAmount)
      if (!editPerson.trim() || parsed <= 0) return
      const oldRepaymentsTotal = item.repayments.reduce((s, r) => s + r.amount, 0)
      const newRemaining = Math.max(0, parsed - oldRepaymentsTotal)
      updateItem(item.id, {
        jenis: editJenis,
        personName: editPerson.trim(),
        amount: parsed,
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? 'settled' : 'active',
        date: editDate,
        dueDate: editDueDate,
        note: editNote.trim(),
      })
      onSaved()
    }, [editJenis, editPerson, editAmount, editDate, editDueDate, editNote, item, updateItem, onSaved])

    React.useImperativeHandle(ref, () => ({
      triggerSave: handleSaveEdit,
    }), [handleSaveEdit])

    return (
      <Card className="bg-card border-border shadow-sm mb-4">
        <CardContent className="p-5">
          {!isEditing ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <JenisBadge jenis={item.jenis} language={language} />
                {!isActive && (
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('fullyPaid')}
                  </span>
                )}
              </div>

              <h1 className="text-lg font-bold text-foreground">{item.personName}</h1>
              {item.note && <p className="text-xs text-muted-foreground/70 mt-1">{item.note}</p>}

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('outflowAmount')}</span>
                  <p className="text-sm font-bold text-card-foreground font-number mt-0.5">
                    {formatCurrency(item.amount, language as 'id' | 'en')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('remaining')}</span>
                  <p className={`text-sm font-bold font-number mt-0.5 ${isActive ? 'text-primary' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(item.remainingAmount, language as 'id' | 'en')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('outflowDate')}</span>
                  <p className="text-xs font-semibold text-card-foreground mt-0.5">
                    {new Date(item.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('outflowDueDate')}</span>
                  <p className="text-xs font-semibold text-card-foreground mt-0.5">
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{pct.toFixed(0)}% {isId ? 'terbayar' : 'paid'}</span>
                  <span className="font-bold font-number">
                    {formatCurrency(item.amount - item.remainingAmount, language as 'id' | 'en')}
                  </span>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-2 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${!isActive ? 'bg-green-500' : 'bg-primary/60'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {isActive && (
                <button onClick={onSettleConfirm}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('markAsPaid')}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{t('outflowJenis')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[JENIS_OPTIONS, editJenis].flat().filter((v, i, a) => a.indexOf(v) === i).map((j) => (
                    <button key={j} type="button" onClick={() => setEditJenis(j)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${editJenis === j ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{t('outflowPerson')}</label>
                <input type="text" value={editPerson} onChange={(e) => setEditPerson(e.target.value)}
                  className="w-full px-2.5 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>
              <div className="grid gap-1.5">
                <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{t('outflowAmount')}</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                    {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
                  </span>
                  <input type="text" inputMode="numeric" value={editAmount} onChange={(e) => setEditAmount(formatInputVal(e.target.value))}
                    placeholder="0"
                    className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{t('outflowDate')}</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{t('outflowDueDate')}</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{t('outflowNote')}</label>
                <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-2.5 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

function parseNum(val: string): number {
  return Number(val.replace(/\./g, ''))
}
