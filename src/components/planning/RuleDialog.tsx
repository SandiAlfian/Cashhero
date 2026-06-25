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
import { RefreshCw, ChevronDown, Trash2 } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useAutoLogStore, type AutoLogRule, type AutoLogFrequency } from "@/store/useAutoLogStore"
import { formatInputVal, parseNum, CURRENCY_SYMBOLS } from "@/lib/format"
import { getTranslation, getFrequencyLabel, getTypeLabel } from "@/lib/planning"
import { useRuleCategorySuggestions } from "@/hooks/useRuleCategorySuggestions"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRule?: AutoLogRule | null
  onToast?: (msg: string) => void
}

export function RuleDialog({ open, onOpenChange, editRule, onToast }: Props) {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((s) => s.currency)
  const { budgets } = usePlanningStore()
  const transactions = useTransactionStore((s) => s.transactions)
  const { rules, ruleCategories, addRule, updateRule, deleteRule } = useAutoLogStore()

  const [ruleTitleInput, setRuleTitleInput] = React.useState("")
  const [ruleAmountInput, setRuleAmountInput] = React.useState("")
  const [ruleTypeInput, setRuleTypeInput] = React.useState<'in' | 'out'>('out')
  const [ruleCategoryInput, setRuleCategoryInput] = React.useState("")
  const [ruleNoteInput, setRuleNoteInput] = React.useState("")
  const [ruleFrequencyInput, setRuleFrequencyInput] = React.useState<AutoLogFrequency>('monthly')
  const [ruleStartDateInput, setRuleStartDateInput] = React.useState("")
  const [ruleIsActiveInput, setRuleIsActiveInput] = React.useState(true)
  const [showFrequencyDropdown, setShowFrequencyDropdown] = React.useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false)
  const [showRuleCategorySuggestions, setShowRuleCategorySuggestions] = React.useState(false)

  const isEditing = !!editRule

  React.useEffect(() => {
    if (!open) return
    if (editRule) {
      const state = useSettingsStore.getState()
      const rate = state.exchangeRates[state.currency] || 1
      setRuleTitleInput(editRule.title)
      setRuleAmountInput(new Intl.NumberFormat("id-ID").format(Math.round(editRule.amount / rate)))
      setRuleTypeInput(editRule.type)
      setRuleCategoryInput(editRule.category)
      setRuleNoteInput(editRule.note)
      setRuleFrequencyInput(editRule.frequency)
      setRuleStartDateInput(editRule.startDate.split('T')[0])
      setRuleIsActiveInput(editRule.isActive)
    } else {
      setRuleTitleInput("")
      setRuleAmountInput("")
      setRuleTypeInput('out')
      setRuleCategoryInput("")
      setRuleNoteInput("")
      setRuleFrequencyInput('monthly')
      setRuleStartDateInput(new Date().toISOString().split('T')[0])
      setRuleIsActiveInput(true)
    }
    setShowFrequencyDropdown(false)
    setShowTypeDropdown(false)
    setShowRuleCategorySuggestions(false)
  }, [open, editRule])

  const filteredRuleCategorySuggestions = useRuleCategorySuggestions(
    ruleCategoryInput, transactions, budgets, rules, ruleCategories
  )

  const handleSave = () => {
    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1
    const amount = parseNum(ruleAmountInput) * rate
    if (!ruleTitleInput.trim() || amount <= 0 || !ruleCategoryInput.trim() || !ruleStartDateInput) return

    const startD = new Date(ruleStartDateInput)
    startD.setHours(12, 0, 0, 0)
    const startDateISO = startD.toISOString()

    const ruleData = {
      title: ruleTitleInput.trim(),
      amount,
      type: ruleTypeInput,
      category: ruleCategoryInput.trim(),
      note: ruleNoteInput.trim(),
      frequency: ruleFrequencyInput,
      startDate: startDateISO,
      isActive: ruleIsActiveInput
    }

    if (editRule) {
      updateRule(editRule.id, ruleData)
    } else {
      addRule(ruleData)
    }
    onToast?.(getTranslation(language, 'toastRuleAdded'))
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (editRule && confirm(getTranslation(language, 'deleteRuleConfirm'))) {
      deleteRule(editRule.id)
      onToast?.(getTranslation(language, 'toastRuleDeleted'))
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary dark:text-rose-400" />
            {isEditing ? getTranslation(language, 'editRule') : getTranslation(language, 'addRule')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {getTranslation(language, 'autoLogSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 relative">
          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleTitle')}</label>
            <Input
              placeholder={getTranslation(language, 'ruleTitlePlaceholder')}
              value={ruleTitleInput}
              onChange={(e) => setRuleTitleInput(e.target.value)}
              className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5 relative">
              <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleType')}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown)
                    setShowFrequencyDropdown(false)
                    setShowRuleCategorySuggestions(false)
                  }}
                  className="flex items-center justify-between w-full px-3 h-10 border border-input bg-muted/40 rounded-lg text-sm text-foreground focus-visible:ring-primary focus-visible:ring-1 select-none cursor-pointer"
                >
                  <span>{getTypeLabel(ruleTypeInput, language)}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-11 left-0 right-0 z-50 bg-background border border-border shadow-xl rounded-lg p-1 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                    {(['in', 'out'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setRuleTypeInput(type)
                          setShowTypeDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                          ruleTypeInput === type
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {getTypeLabel(type, language)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{getTranslation(language, 'ruleAmount').replace('(Rp)', `(${activeCurrency})`)}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                  {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
                </span>
                <CurrencyInput
                  value={ruleAmountInput}
                  onChange={(e) => setRuleAmountInput(formatInputVal(e.target.value))}
                  placeholder="0"
                  className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5 relative">
              <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleFrequency')}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowFrequencyDropdown(!showFrequencyDropdown)
                    setShowTypeDropdown(false)
                    setShowRuleCategorySuggestions(false)
                  }}
                  className="flex items-center justify-between w-full px-3 h-10 border border-input bg-muted/40 rounded-lg text-sm text-foreground focus-visible:ring-primary focus-visible:ring-1 select-none cursor-pointer"
                >
                  <span>{getFrequencyLabel(ruleFrequencyInput, language)}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showFrequencyDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFrequencyDropdown && (
                  <div className="absolute top-11 left-0 right-0 z-50 bg-background border border-border shadow-xl rounded-lg p-1 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as AutoLogFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => {
                          setRuleFrequencyInput(freq)
                          setShowFrequencyDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                          ruleFrequencyInput === freq
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {getFrequencyLabel(freq, language)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleStartDate')}</label>
              <input
                type="date"
                value={ruleStartDateInput}
                onChange={(e) => setRuleStartDateInput(e.target.value)}
                className="h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-3 py-1 text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
            </div>
          </div>

          <div className="grid gap-1.5 relative">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleCategory')}</label>
            <div className="relative">
              <Input
                placeholder={language === 'id' ? 'Contoh: Gaji, Internet, Investasi' : 'e.g. Salary, Internet, Investment'}
                value={ruleCategoryInput}
                onChange={(e) => {
                  setRuleCategoryInput(e.target.value)
                  setShowRuleCategorySuggestions(true)
                }}
                onFocus={() => {
                  setShowRuleCategorySuggestions(true)
                  setShowTypeDropdown(false)
                  setShowFrequencyDropdown(false)
                }}
                onBlur={() => setTimeout(() => setShowRuleCategorySuggestions(false), 200)}
                className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium w-full"
              />
              {showRuleCategorySuggestions && filteredRuleCategorySuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md overflow-hidden flex flex-col py-1">
                  {filteredRuleCategorySuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault() }}
                      onClick={() => {
                        setRuleCategoryInput(item.name)
                        setShowRuleCategorySuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-medium text-foreground flex items-center justify-between group rounded-md"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150 font-bold">{item.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border border-border/50 uppercase tracking-wider font-bold transition-colors duration-150 ${
                        item.source === 'budget'
                          ? 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:text-primary'
                          : 'text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                      }`}>
                        {item.source === 'budget' ? getTranslation(language, 'budgetSuggestion') : getTranslation(language, 'historySuggestion')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{getTranslation(language, 'ruleNote')}</label>
            <Input
              placeholder={language === 'id' ? 'Catatan tambahan (opsional)' : 'Additional notes (optional)'}
              value={ruleNoteInput}
              onChange={(e) => setRuleNoteInput(e.target.value)}
              className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
            />
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
              <span>{getTranslation(language, 'deleteRule')}</span>
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
              disabled={!ruleTitleInput.trim() || parseNum(ruleAmountInput) <= 0 || !ruleCategoryInput.trim() || !ruleStartDateInput}
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
