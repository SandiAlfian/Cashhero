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
import { Target, AlertTriangle, Trash2 } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { usePlanningStore, type BudgetLimit } from "@/store/usePlanningStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { formatInputVal, parseNum, CURRENCY_SYMBOLS } from "@/lib/format"
import { getTranslation } from "@/lib/planning"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editBudget?: BudgetLimit | null
}

export function BudgetDialog({ open, onOpenChange, editBudget }: Props) {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((s) => s.currency)
  const { budgets, addBudget, updateBudget, deleteBudget } = usePlanningStore()
  const transactions = useTransactionStore((s) => s.transactions)

  const [budgetCategoryInput, setBudgetCategoryInput] = React.useState("")
  const [budgetLimitInput, setBudgetLimitInput] = React.useState("")
  const [showBudgetSuggestions, setShowBudgetSuggestions] = React.useState(false)

  const isEditing = !!editBudget

  React.useEffect(() => {
    if (!open) return
    if (editBudget) {
      const state = useSettingsStore.getState()
      const rate = state.exchangeRates[state.currency] || 1
      setBudgetCategoryInput(editBudget.category)
      setBudgetLimitInput(new Intl.NumberFormat("id-ID").format(Math.round(editBudget.limit / rate)))
    } else {
      setBudgetCategoryInput("")
      setBudgetLimitInput("")
    }
    setShowBudgetSuggestions(false)
  }, [open, editBudget])

  const suggestions = React.useMemo(() => {
    const cats = transactions.map(t => t.category).filter((cat): cat is string => !!cat && cat !== 'Saldo Awal')
    return Array.from(new Set(cats))
  }, [transactions])

  const filteredSuggestions = React.useMemo(() => {
    if (!budgetCategoryInput || budgetCategoryInput.length < 1) return []
    return suggestions.filter(cat =>
      cat.toLowerCase().includes(budgetCategoryInput.toLowerCase()) &&
      cat.toLowerCase() !== budgetCategoryInput.toLowerCase()
    )
  }, [budgetCategoryInput, suggestions])

  const isDuplicate = React.useMemo(() => {
    const trimmed = budgetCategoryInput.trim().toLowerCase()
    if (!trimmed) return false
    return budgets.some(b => {
      if (editBudget && b.id === editBudget.id) return false
      return b.category.toLowerCase() === trimmed
    })
  }, [budgetCategoryInput, budgets, editBudget])

  const handleSave = () => {
    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1
    const limit = parseNum(budgetLimitInput) * rate
    if (!budgetCategoryInput.trim() || limit <= 0 || isDuplicate) return
    if (editBudget) {
      updateBudget(editBudget.id, budgetCategoryInput.trim(), limit)
    } else {
      addBudget(budgetCategoryInput.trim(), limit)
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (editBudget && confirm(getTranslation(language, 'deleteBudgetConfirm'))) {
      deleteBudget(editBudget.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-primary dark:text-rose-400" />
            {isEditing ? getTranslation(language, 'editBudget') : getTranslation(language, 'newBudget')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {language === 'id'
              ? "Atur anggaran pengeluaran bulanan Anda secara disiplin."
              : "Configure your monthly budget limit for healthy discipline."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 relative">
          <div className="grid gap-1.5 relative">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'budgetCategory')}</label>
            <div className="relative">
              <Input
                placeholder={language === 'id' ? 'Contoh: Makanan, Belanja, Hiburan' : 'e.g. Food, Shopping, Entertainment'}
                value={budgetCategoryInput}
                onChange={(e) => {
                  setBudgetCategoryInput(e.target.value)
                  setShowBudgetSuggestions(true)
                }}
                onFocus={() => setShowBudgetSuggestions(true)}
                onBlur={() => setTimeout(() => setShowBudgetSuggestions(false), 200)}
                className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium w-full"
              />
              {showBudgetSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-background border border-border shadow-xl rounded-lg max-h-[160px] overflow-y-auto overflow-x-hidden p-1 backdrop-blur-md">
                  {filteredSuggestions.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setBudgetCategoryInput(cat)
                        setShowBudgetSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground rounded-md transition-colors duration-100"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isDuplicate && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-primary animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{getTranslation(language, 'budgetCategoryExists')}</span>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{getTranslation(language, 'budgetAmount').replace('(Rp)', `(${activeCurrency})`)}</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
              </span>
              <CurrencyInput
                value={budgetLimitInput}
                onChange={(e) => setBudgetLimitInput(formatInputVal(e.target.value))}
                placeholder="0"
                className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45"
              />
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
              <span>{getTranslation(language, 'deleteBudget')}</span>
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
              disabled={!budgetCategoryInput.trim() || parseNum(budgetLimitInput) <= 0 || isDuplicate}
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
