"use client"

import * as React from "react"
import { Plus, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Button } from "@/components/ui/button"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { formatCurrency } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

export function QuickEntryModal() {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'in' | 'out' | 'saving'>('out')
  const [amount, setAmount] = React.useState('')
  const [displayAmount, setDisplayAmount] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [note, setNote] = React.useState('')
  const [selectedGoalId, setSelectedGoalId] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const [deductCash, setDeductCash] = React.useState(true)
  const [goalSearchQuery, setGoalSearchQuery] = React.useState('')
  const [showGoalDropdown, setShowGoalDropdown] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  const transactions = useTransactionStore((state) => state.transactions)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const budgets = usePlanningStore((state) => state.budgets)
  const goals = usePlanningStore((state) => state.goals)
  const updateGoal = usePlanningStore((state) => state.updateGoal)
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((state) => state.currency)
  const exchangeRates = useSettingsStore((state) => state.exchangeRates)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  // Dynamic contextual placeholders per tab active
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

  // Filter unique categories dynamically based on query (max 5 suggestions)
  // Combines active budget categories and transaction history
  const filteredCategories = React.useMemo(() => {
    const query = category.trim().toLowerCase()
    if (query.length < 1) return []

    // 1. Get categories from active budgets
    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))
    
    // 2. Get categories from transaction history (excluding initial balance seed)
    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(query))

    // Create unique combined list with source identification
    const combinedMap = new Map<string, 'budget' | 'history'>()
    
    // Add history categories first
    historyCats.forEach((cat) => {
      combinedMap.set(cat, 'history')
    })
    
    // Add budget categories (prioritizing / overwriting source to 'budget' if present in both)
    budgetCats.forEach((cat) => {
      combinedMap.set(cat, 'budget')
    })

    return Array.from(combinedMap.entries()).map(([name, source]) => ({
      name,
      source
    })).slice(0, 5)
  }, [transactions, budgets, category])

  // Filter saving goals dynamically based on search query
  const filteredGoals = React.useMemo(() => {
    const query = goalSearchQuery.trim().toLowerCase()
    if (!query) return goals
    return goals.filter((g) => g.title.toLowerCase().includes(query))
  }, [goals, goalSearchQuery])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "") // Keep only numbers
    setAmount(rawVal)

    if (rawVal === "") {
      setDisplayAmount("")
      return
    }

    // Format with strict dots thousands separators
    const formatted = new Intl.NumberFormat("id-ID").format(Number(rawVal))
    setDisplayAmount(formatted)
  }

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || !note) return

    const rate = exchangeRates[activeCurrency] || 1
    const amountInIdr = Number(amount) * rate

    if (activeTab === 'saving') {
      if (!selectedGoalId) return
      const goal = goals.find((g) => g.id === selectedGoalId)
      if (!goal) return

      // 1. Akumulasi pencapaian target tabungan di Perencanaan (stored in IDR)
      updateGoal(goal.id, goal.title, goal.target, goal.collected + amountInIdr, goal.iconName)

      // 2. Catat transaksi di Riwayat Transaksi dengan Kategori 'Tabungan' (tidak mempengaruhi saldo tunai)
      addTransaction({
        type: deductCash ? 'out' : 'in',
        amount: amountInIdr,
        category: 'Tabungan',
        note: note.trim(),
      })
      triggerToast(
        language === 'id' 
          ? `Berhasil menambah tabungan ${formatCurrency(amountInIdr, language)} ke "${goal.title}"!`
          : `Successfully added ${formatCurrency(amountInIdr, language)} savings to "${goal.title}"!`
      )
    } else {
      if (!category) return
      addTransaction({
        type: activeTab,
        amount: amountInIdr,
        category: category.trim(),
        note: note.trim(),
      })
      triggerToast(
        activeTab === 'in'
          ? (language === 'id' ? `Pemasukan ${formatCurrency(amountInIdr, language)} berhasil dicatat!` : `Income of ${formatCurrency(amountInIdr, language)} successfully recorded!`)
          : (language === 'id' ? `Pengeluaran ${formatCurrency(amountInIdr, language)} berhasil dicatat!` : `Expense of ${formatCurrency(amountInIdr, language)} successfully recorded!`)
      )
    }

    setOpen(false)
    // Reset form
    setAmount('')
    setDisplayAmount('')
    setCategory('')
    setNote('')
    setSelectedGoalId('')
    setActiveTab('out')
    setDeductCash(true)
    setGoalSearchQuery('')
    setShowGoalDropdown(false)
  }

  const handleClose = () => {
    setOpen(false)
    // Reset form
    setAmount('')
    setDisplayAmount('')
    setCategory('')
    setNote('')
    setSelectedGoalId('')
    setActiveTab('out')
    setDeductCash(true)
    setGoalSearchQuery('')
    setShowGoalDropdown(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
      <DialogTrigger 
        render={
          <motion.button
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(12);
              }
            }}
            className="fixed bottom-20 md:bottom-6 right-6 md:right-8 z-40 flex items-center justify-center bg-gradient-to-r from-primary to-rose-700 hover:from-primary/95 hover:to-rose-600 text-white rounded-full font-bold shadow-[0_6px_22px_rgba(129,11,56,0.4)] hover:shadow-[0_8px_28px_rgba(129,11,56,0.5)] cursor-pointer select-none overflow-hidden h-12 transition-all duration-300 border border-primary/20 dark:border-rose-500/20"
            style={{
              width: isHovered ? "auto" : "48px",
              paddingLeft: isHovered ? "16px" : "12px",
              paddingRight: isHovered ? "16px" : "12px",
            }}
          >
            <Plus className="w-5 h-5 shrink-0" />
            <AnimatePresence initial={false}>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="text-xs font-bold tracking-wide whitespace-nowrap overflow-hidden text-white"
                >
                  {t('quickEntry')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        } 
      />
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-xl font-bold tracking-tight">{t('addNewTransaction')}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {t('modalDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-2">
          {/* Segmented Control for Pemasukan / Pengeluaran / Tabungan */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border relative overflow-hidden h-11">
            <button
              type="button"
              onClick={() => {
                setActiveTab('out')
                setCategory('')
                setNote('')
                setSelectedGoalId('')
                setGoalSearchQuery('')
              }}
              className={`flex-1 text-center text-xs font-bold rounded-md relative z-10 transition-colors duration-300 cursor-pointer ${
                activeTab === 'out' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'out' && (
                <motion.span
                  layoutId="activeModalType"
                  className="absolute inset-0 bg-primary rounded-md z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 tracking-wide">{t('expense')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('in')
                setCategory('')
                setNote('')
                setSelectedGoalId('')
                setGoalSearchQuery('')
              }}
              className={`flex-1 text-center text-xs font-bold rounded-md relative z-10 transition-colors duration-300 cursor-pointer ${
                activeTab === 'in' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'in' && (
                <motion.span
                  layoutId="activeModalType"
                  className="absolute inset-0 bg-primary rounded-md z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 tracking-wide">{t('income')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('saving')
                setCategory('Tabungan')
                setNote('')
                setSelectedGoalId('')
                setGoalSearchQuery('')
              }}
              className={`flex-1 text-center text-xs font-bold rounded-md relative z-10 transition-colors duration-300 cursor-pointer ${
                activeTab === 'saving' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'saving' && (
                <motion.span
                  layoutId="activeModalType"
                  className="absolute inset-0 bg-primary rounded-md z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 tracking-wide">{t('savings')}</span>
            </button>
          </div>

          {/* Amount Field (Rp prefix inside, dot formatting) */}
          <div className="grid gap-1.5 w-full">
            <label htmlFor="amount" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{t('amountLabel')}</label>
            <div className="relative flex items-center w-full">
              <span className="absolute left-4 text-muted-foreground/60 font-semibold text-base select-none">
                {
                  {
                    IDR: 'Rp',
                    USD: '$',
                    EUR: '€',
                    SGD: 'S$',
                    JPY: '¥'
                  }[useSettingsStore((state) => state.currency)] || 'Rp'
                }
              </span>
              <CurrencyInput
                id="amount"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="pl-11 pr-4 bg-muted/30 border-border focus-visible:ring-primary font-bold text-lg text-foreground tracking-wide h-12 rounded-lg w-full"
              />
            </div>
          </div>

          {/* Category Input Field OR Saving Goal Select Field */}
          {activeTab !== 'saving' ? (
            /* Category Field with combined autocompletes */
            <div className="grid gap-1.5 relative w-full">
              <label htmlFor="category" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{t('categoryLabel')}</label>
              <div className="relative w-full">
                <Input
                  id="category"
                  placeholder={categoryPlaceholder}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoComplete="off"
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-11 rounded-lg text-sm w-full"
                />
              </div>
              
              {/* Floating Dropdown Suggestion ala Select2 */}
              <AnimatePresence>
                {mounted && isFocused && category.trim().length >= 1 && filteredCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md overflow-hidden flex flex-col py-1"
                  >
                    {filteredCategories.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault() // prevent input blur before onClick
                        }}
                        onClick={() => {
                          setCategory(item.name)
                          setIsFocused(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-medium text-foreground flex items-center justify-between group"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border border-border/50 uppercase tracking-wider font-semibold transition-colors duration-150 ${
                          item.source === 'budget' 
                            ? 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:text-primary-foreground group-hover:bg-primary' 
                            : 'text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                        }`}>
                          {item.source === 'budget' ? t('budgetSuggestion') : t('historySuggestion')}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Searchable Saving Goal Field specifically for Saving Tab */
            <div className="grid gap-4 w-full">
              <div className="grid gap-1.5 relative w-full">
                <label htmlFor="savingGoalSearchInput" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  {t('selectSavingGoal')}
                </label>
                {goals.length > 0 ? (
                  <div className="relative w-full">
                    <Input
                      id="savingGoalSearchInput"
                      type="text"
                      placeholder={language === 'id' ? 'Cari target tabungan...' : 'Search saving goal...'}
                      value={goalSearchQuery}
                      onChange={(e) => {
                        setGoalSearchQuery(e.target.value)
                        setShowGoalDropdown(true)
                      }}
                      onFocus={() => {
                        setShowGoalDropdown(true)
                        setGoalSearchQuery('')
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowGoalDropdown(false)
                          const selectedGoal = goals.find((g) => g.id === selectedGoalId)
                          if (selectedGoal) {
                            setGoalSearchQuery(selectedGoal.title)
                          } else {
                            setGoalSearchQuery('')
                          }
                        }, 200)
                      }}
                      autoComplete="off"
                      className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-11 rounded-lg text-sm w-full pr-10 font-semibold cursor-pointer"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 text-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6"/></svg>
                    </div>

                    <AnimatePresence>
                      {showGoalDropdown && filteredGoals.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md overflow-hidden flex flex-col py-1"
                        >
                          {filteredGoals.map((goal) => {
                            const isSelected = goal.id === selectedGoalId
                            const remaining = Math.max(0, goal.target - goal.collected)
                            return (
                              <button
                                key={goal.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault() // prevent input blur before onClick
                                }}
                                onClick={() => {
                                  setSelectedGoalId(goal.id)
                                  setGoalSearchQuery(goal.title)
                                  const noteTemplate = t('savingNoteTemplate')
                                    .replace('[Nama Target]', goal.title)
                                    .replace('[Goal Name]', goal.title)
                                  setNote(noteTemplate)
                                  setShowGoalDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer font-medium flex items-center justify-between group ${
                                  isSelected 
                                    ? 'bg-primary/20 text-primary font-bold' 
                                    : 'hover:bg-primary/10 hover:text-primary text-foreground'
                                }`}
                              >
                                <span className="group-hover:translate-x-0.5 transition-transform duration-150">{goal.title}</span>
                                <span className="text-[10px] text-muted-foreground transition-colors duration-150">
                                  {language === 'id' ? 'Sisa' : 'Remaining'} {formatCurrency(remaining, language)}
                                </span>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                      {showGoalDropdown && filteredGoals.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute z-50 left-0 right-0 top-full mt-1.5 p-4 rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md flex items-center justify-center text-xs text-muted-foreground"
                        >
                          {language === 'id' ? 'Tidak ada target tabungan yang cocok' : 'No matching saving goals'}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-3.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground transition-all">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1.5">
                      <p className="font-semibold text-foreground">{t('noSavingGoalsWarning')}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false)
                          window.location.href = '/planning'
                        }}
                        className="self-start text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'id' ? '+ Buat Target Sekarang' : '+ Create Goal Now'}</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {goals.length > 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-muted/30">
                  <input
                    id="quickDeductCashToggle"
                    type="checkbox"
                    checked={deductCash}
                    onChange={(e) => setDeductCash(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div className="grid gap-0.5 cursor-pointer select-none" onClick={() => setDeductCash(!deductCash)}>
                    <label htmlFor="quickDeductCashToggle" className="text-xs font-bold text-foreground cursor-pointer">
                      {t('deductFromCash')}
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      {language === 'id'
                        ? "Mengurangi saldo tunai aktif Anda untuk disalurkan ke tabungan ini."
                        : "Deduct your active cash balance to allocate to this savings goal."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note Field (Textarea) */}
          <div className="grid gap-1.5 w-full">
            <label htmlFor="note" className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">{t('noteLabel')}</label>
            <textarea
              id="note"
              placeholder={notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none w-full min-h-[96px] p-3 rounded-lg text-sm transition-all shadow-sm focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-sm font-semibold rounded-lg px-4 py-2"
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={
              activeTab === 'saving' 
                ? !amount || !selectedGoalId || !note 
                : !amount || !category || !note
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm text-sm font-semibold rounded-lg px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('save')}
          </Button>
        </div>
      </DialogContent>

      {/* Premium Toast System */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 md:right-8 z-[10001] flex items-center gap-3 bg-foreground text-background dark:bg-card dark:text-foreground px-4 py-3 rounded-xl shadow-2xl border border-border/80 max-w-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 font-bold" />
            </div>
            <span className="text-xs font-bold leading-normal">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
