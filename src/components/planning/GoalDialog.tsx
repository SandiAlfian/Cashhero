"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Button } from "@/components/ui/button"
import { PiggyBank, Trash2 } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { usePlanningStore, type SavingGoal } from "@/store/usePlanningStore"
import { formatInputVal, parseNum, CURRENCY_SYMBOLS } from "@/lib/format"
import { iconMapping, iconOptions, getTranslation } from "@/lib/planning"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editGoal?: SavingGoal | null
  onToast?: (msg: string) => void
  onGoalCreated?: (collected: number, title: string, deductCash: boolean) => void
}

export function GoalDialog({ open, onOpenChange, editGoal, onToast, onGoalCreated }: Props) {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((s) => s.currency)
  const { addGoal, updateGoal, deleteGoal } = usePlanningStore()

  const [goalTitleInput, setGoalTitleInput] = React.useState("")
  const [goalTargetInput, setGoalTargetInput] = React.useState("")
  const [goalCollectedInput, setGoalCollectedInput] = React.useState("")
  const [goalIconInput, setGoalIconInput] = React.useState<SavingGoal['iconName']>('PiggyBank')
  const [deductCash, setDeductCash] = React.useState(true)

  const isEditing = !!editGoal

  React.useEffect(() => {
    if (!open) return
    if (editGoal) {
      const state = useSettingsStore.getState()
      const rate = state.exchangeRates[state.currency] || 1
      setGoalTitleInput(editGoal.title)
      setGoalTargetInput(new Intl.NumberFormat("id-ID").format(Math.round(editGoal.target / rate)))
      setGoalCollectedInput(new Intl.NumberFormat("id-ID").format(Math.round(editGoal.collected / rate)))
      setGoalIconInput(editGoal.iconName)
      setDeductCash(true)
    } else {
      setGoalTitleInput("")
      setGoalTargetInput("")
      setGoalCollectedInput("")
      setGoalIconInput('PiggyBank')
      setDeductCash(true)
    }
  }, [open, editGoal])

  const handleSave = () => {
    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1
    const target = parseNum(goalTargetInput) * rate
    const collected = parseNum(goalCollectedInput) * rate
    if (!goalTitleInput.trim() || target <= 0) return

    if (editGoal) {
      updateGoal(editGoal.id, goalTitleInput.trim(), target, collected, goalIconInput)
      const msg = language === 'id'
        ? `Target tabungan "${goalTitleInput.trim()}" berhasil diperbarui!`
        : `Saving goal "${goalTitleInput.trim()}" successfully updated!`
      onToast?.(msg)
    } else {
      addGoal(goalTitleInput.trim(), target, collected, goalIconInput)
      const msg = language === 'id'
        ? `Target tabungan "${goalTitleInput.trim()}" berhasil dibuat!`
        : `Saving goal "${goalTitleInput.trim()}" successfully created!`
      onToast?.(msg)
      if (collected > 0) {
        onGoalCreated?.(collected, goalTitleInput.trim(), deductCash)
      }
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (editGoal && confirm(getTranslation(language, 'deleteGoalConfirm'))) {
      deleteGoal(editGoal.id)
      const msg = language === 'id'
        ? `Target tabungan berhasil dihapus!`
        : `Saving goal successfully deleted!`
      onToast?.(msg)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-primary dark:text-rose-400" />
            {isEditing ? getTranslation(language, 'editGoal') : getTranslation(language, 'newGoal')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {language === 'id'
              ? "Tentukan sasaran dana tabungan dan track perkembangannya."
              : "Set a savings target and visualize your compound gains."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'goalTitle')}</label>
            <Input
              placeholder={language === 'id' ? 'Contoh: Dana Darurat, Liburan Jepang, Laptop Baru' : 'e.g. Emergency Fund, Japan Trip'}
              value={goalTitleInput}
              onChange={(e) => setGoalTitleInput(e.target.value)}
              className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{getTranslation(language, 'goalTarget').replace('(Rp)', `(${activeCurrency})`)}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                  {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
                </span>
                <CurrencyInput
                  value={goalTargetInput}
                  onChange={(e) => setGoalTargetInput(formatInputVal(e.target.value))}
                  placeholder="0"
                  className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{getTranslation(language, 'goalCollected').replace('(Rp)', `(${activeCurrency})`)}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                  {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
                </span>
                <CurrencyInput
                  value={goalCollectedInput}
                  onChange={(e) => setGoalCollectedInput(formatInputVal(e.target.value))}
                  placeholder="0"
                  disabled={isEditing}
                  className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45 disabled:bg-input/30 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-muted/30">
              <input
                id="deductCashGoalToggle"
                type="checkbox"
                checked={deductCash}
                onChange={(e) => setDeductCash(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <div className="grid gap-0.5 cursor-pointer select-none" onClick={() => setDeductCash(!deductCash)}>
                <label htmlFor="deductCashGoalToggle" className="text-xs font-bold text-foreground cursor-pointer">
                  {getTranslation(language, 'deductFromCash')}
                </label>
                <p className="text-[10px] text-muted-foreground">
                  {language === 'id'
                    ? "Kurangi saldo tunai aktif Anda untuk nominal awal tabungan ini."
                    : "Deduct your active cash balance for this savings initial amount."}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'goalIcon')}</label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((opt) => {
                const Icon = iconMapping[opt.value]
                const isSelected = goalIconInput === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGoalIconInput(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm scale-105'
                        : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                    title={opt.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 border-t border-border/40 pt-4">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'deleteGoal')}</span>
            </button>
          ) : <div />}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
              type="button"
            >
              {getTranslation(language, 'cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!goalTitleInput.trim() || parseNum(goalTargetInput) <= 0}
              className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {getTranslation(language, 'saveChanges')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
