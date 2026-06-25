"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Button } from "@/components/ui/button"
import { Plus, Search, Check } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { formatCurrency, formatInputVal, CURRENCY_SYMBOLS, getTranslation } from "@/lib/format"
import type { Language } from "@/store/useLanguageStore"

interface Props {
  selectedDate: Date
  activeMonthName: string
  formatCurrency: (amount: number, lang: Language) => string
  onTriggerToast: (msg: string) => void
}

export function QuickEntryForm({ selectedDate, activeMonthName, onTriggerToast }: Props) {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((s) => s.currency)
  const exchangeRates = useSettingsStore((s) => s.exchangeRates)
  const transactions = useTransactionStore((s) => s.transactions)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const budgets = usePlanningStore((s) => s.budgets)
  const goals = usePlanningStore((s) => s.goals)
  const updateGoal = usePlanningStore((s) => s.updateGoal)
  const t = (key: string) => getTranslation(language, key)

  const [activeTab, setActiveTab] = React.useState<'in' | 'out' | 'saving'>('out')
  const [amount, setAmount] = React.useState('')
  const [displayAmount, setDisplayAmount] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [note, setNote] = React.useState('')
  const [selectedGoalId, setSelectedGoalId] = React.useState('')
  const [deductCash, setDeductCash] = React.useState(true)
  const [goalSearchQuery, setGoalSearchQuery] = React.useState('')
  const [showGoalDropdown, setShowGoalDropdown] = React.useState(false)
  const [categoryFocus, setCategoryFocus] = React.useState(false)

  const categoryPlaceholder = React.useMemo(() => {
    if (activeTab === 'in') {
      return language === 'id' ? 'Gaji, Bonus, Dividen, dll' : 'Salary, Bonus, Dividend, etc.'
    }
    return language === 'id' ? 'Makanan, Transport, Belanja, dll' : 'Food, Transport, Shopping, etc.'
  }, [activeTab, language])

  const notePlaceholder = React.useMemo(() => {
    if (activeTab === 'in') {
      return language === 'id' ? 'Gaji bulanan, bonus proyek, dll' : 'Monthly salary, project bonus, etc.'
    }
    if (activeTab === 'saving') {
      return language === 'id' ? 'Tabungan bulanan, dana darurat, dll' : 'Monthly savings, emergency fund, etc.'
    }
    return language === 'id' ? 'Makan siang, bensin, token listrik, dll' : 'Lunch, gasoline, electricity token, etc.'
  }, [activeTab, language])

  const filteredCategories = React.useMemo(() => {
    const query = category.trim().toLowerCase()
    if (query.length < 1) return []

    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))

    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(query))

    const combinedMap = new Map<string, 'budget' | 'history'>()
    historyCats.forEach((cat) => combinedMap.set(cat, 'history'))
    budgetCats.forEach((cat) => combinedMap.set(cat, 'budget'))

    return Array.from(combinedMap.entries()).map(([name, source]) => ({
      name,
      source
    })).slice(0, 5)
  }, [category, budgets, transactions])

  const filteredGoals = React.useMemo(() => {
    const query = goalSearchQuery.trim().toLowerCase()
    if (!query) return goals
    return goals.filter((g) => g.title.toLowerCase().includes(query))
  }, [goals, goalSearchQuery])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "")
    setAmount(rawVal)
    if (rawVal === "") {
      setDisplayAmount("")
      return
    }
    setDisplayAmount(formatInputVal(rawVal))
  }

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || !note) return

    const txDate = new Date(selectedDate)
    txDate.setHours(12, 0, 0, 0)
    const dateStr = txDate.toISOString()

    const rate = exchangeRates[activeCurrency] || 1
    const amountInIdr = Number(amount) * rate

    if (activeTab === 'saving') {
      if (!selectedGoalId) return
      const goal = goals.find((g) => g.id === selectedGoalId)
      if (!goal) return

      updateGoal(goal.id, goal.title, goal.target, goal.collected + amountInIdr, goal.iconName)
      addTransaction({
        type: deductCash ? 'out' : 'in',
        amount: amountInIdr,
        category: 'Tabungan',
        note: note.trim(),
        date: dateStr
      })
      onTriggerToast(t('toastTxAdded'))
    } else {
      if (!category) return
      addTransaction({
        type: activeTab,
        amount: amountInIdr,
        category: category.trim(),
        note: note.trim(),
        date: dateStr
      })
      onTriggerToast(t('toastTxAdded'))
    }

    setAmount('')
    setDisplayAmount('')
    setCategory('')
    setNote('')
    setSelectedGoalId('')
    setGoalSearchQuery('')
    setShowGoalDropdown(false)
  }

  return (
    <Card className="bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-xl">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Plus className="w-4.5 h-4.5 text-primary" />
          {t('addTransactionDate')} {selectedDate.getDate()} {activeMonthName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">

          <div className="grid grid-cols-3 bg-muted/40 p-1 rounded-lg border border-border/30">
            <button
              type="button"
              onClick={() => {
                setActiveTab('out')
                setCategory('')
              }}
              className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                activeTab === 'out'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'id' ? 'Keluar' : 'Expense'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('in')
                setCategory('')
              }}
              className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                activeTab === 'in'
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'id' ? 'Masuk' : 'Income'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('saving')
                setCategory('Tabungan')
              }}
              className={`py-1.5 text-xs font-extrabold rounded-md transition-all duration-300 ${
                activeTab === 'saving'
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'id' ? 'Tabungan' : 'Savings'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="calendarNominalInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {t('amountLabel').replace('(Rp)', `(${activeCurrency})`)}
            </label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3 text-muted-foreground/60 font-semibold text-sm select-none">
                {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
              </span>
              <CurrencyInput
                id="calendarNominalInput"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-8 pr-3 bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-bold text-sm text-foreground tracking-wide h-10 rounded-lg w-full placeholder-muted-foreground/45"
                required
              />
            </div>
          </div>

          {activeTab !== 'saving' ? (
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="calendarCategoryInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                {t('categoryLabel')}
              </label>
              <Input
                id="calendarCategoryInput"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onFocus={() => setCategoryFocus(true)}
                onBlur={() => setTimeout(() => setCategoryFocus(false), 200)}
                placeholder={categoryPlaceholder}
                className="px-3 py-2 text-sm text-foreground bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg placeholder-muted-foreground/45"
                required
              />

              {categoryFocus && filteredCategories.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border/40 rounded-lg shadow-2xl p-1 z-35 backdrop-blur-md">
                  {filteredCategories.map((item) => (
                    <div
                      key={item.name}
                      onMouseDown={() => setCategory(item.name)}
                      className="px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/40 cursor-pointer rounded-md flex items-center justify-between"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/80 uppercase font-bold tracking-wider">
                        {item.source === 'budget' ? t('budgetSuggestion') : t('historySuggestion')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="calendarGoalSearchInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                {t('selectSavingGoal')}
              </label>
              {goals.length > 0 ? (
                <div className="relative">
                  <Input
                    id="calendarGoalSearchInput"
                    placeholder={language === 'id' ? 'Cari target tabungan...' : 'Search saving goal...'}
                    value={goalSearchQuery}
                    onChange={(e) => {
                      setGoalSearchQuery(e.target.value)
                      setShowGoalDropdown(true)
                    }}
                    onFocus={() => setShowGoalDropdown(true)}
                    onBlur={() => setTimeout(() => setShowGoalDropdown(false), 200)}
                    className="pl-8 pr-8 py-2 text-sm bg-muted/20 border-border/40 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Search className="w-4 h-4 text-muted-foreground/60 absolute left-2.5 top-1/2 -translate-y-1/2" />

                  {selectedGoalId && (
                    <Check className="w-4.5 h-4.5 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2 font-bold" />
                  )}

                  {showGoalDropdown && filteredGoals.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border/40 rounded-lg shadow-2xl p-1 z-35 backdrop-blur-md max-h-[160px] overflow-y-auto">
                      {filteredGoals.map((goal) => (
                        <div
                          key={goal.id}
                          onMouseDown={() => {
                            setSelectedGoalId(goal.id)
                            setGoalSearchQuery(goal.title)
                            setNote(t('savingNoteTemplate').replace('[Nama Target]', goal.title).replace('[Goal Name]', goal.title))
                          }}
                          className={`px-2.5 py-1.5 text-xs rounded-md cursor-pointer flex items-center justify-between ${
                            selectedGoalId === goal.id
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <span className="truncate">🎯 {goal.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatCurrency(goal.collected, language)} / {formatCurrency(goal.target, language)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showGoalDropdown && filteredGoals.length === 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 border border-border p-3 text-center text-xs text-muted-foreground rounded-lg z-35 select-none">
                      {language === 'id' ? 'Tidak ada target tabungan yang cocok' : 'No matching saving goals'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary">{t('noSavingGoalsWarning')}</p>
                </div>
              )}

              {goals.length > 0 && (
                <div className="flex items-start gap-2.5 mt-2 bg-muted/10 p-2 rounded-lg border border-border/30">
                  <input
                    id="calendarDeductCashInput"
                    type="checkbox"
                    checked={deductCash}
                    onChange={(e) => setDeductCash(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5 cursor-pointer" onClick={() => setDeductCash(!deductCash)}>
                    <span className="text-[11px] font-bold text-foreground leading-none">{t('deductFromCash')}</span>
                    <span className="text-[9px] text-muted-foreground leading-normal">{t('deductHelp')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="calendarNoteInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {t('noteLabel')}
            </label>
            <Input
              id="calendarNoteInput"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={notePlaceholder}
              className="px-3 py-2 text-sm text-foreground bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg placeholder-muted-foreground/45"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!amount || !note || (activeTab !== 'saving' && !category) || (activeTab === 'saving' && !selectedGoalId)}
            className="w-full mt-2 h-9 text-xs font-extrabold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 transition-all duration-300"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
