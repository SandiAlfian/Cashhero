"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore, type BudgetLimit, type SavingGoal } from "@/store/usePlanningStore"
import { useAutoLogStore, type AutoLogRule, type AutoLogFrequency } from "@/store/useAutoLogStore"
import { Check } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { useSettingsStore } from "@/store/useSettingsStore"
import { motion, Variants, AnimatePresence } from "framer-motion"
import { 
  PiggyBank, 
  ShieldCheck, 
  Plane, 
  Laptop, 
  Home as HomeIcon, 
  AlertTriangle, 
  Target,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronDown,
  Calendar
} from "lucide-react"

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
}

const iconMapping = {
  ShieldCheck: ShieldCheck,
  Plane: Plane,
  Laptop: Laptop,
  Home: HomeIcon,
  PiggyBank: PiggyBank
}

const iconOptions: { value: SavingGoal['iconName']; label: string; bg: string; text: string }[] = [
  { value: 'ShieldCheck', label: 'Dana Darurat', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'Plane', label: 'Liburan', bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'Laptop', label: 'Gadget/Kerja', bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  { value: 'Home', label: 'Rumah/DP', bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary' },
  { value: 'PiggyBank', label: 'Tabungan', bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' }
]

export default function PlanningPage() {
  const { language } = useLanguageStore()
  const activeCurrency = useSettingsStore((state) => state.currency)
  const transactions = useTransactionStore((state) => state.transactions)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const {
    budgets,
    goals,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal
  } = usePlanningStore()

  const [mounted, setMounted] = React.useState(false)

  // Dialog state
  const [budgetOpen, setBudgetOpen] = React.useState(false)
  const [goalOpen, setGoalOpen] = React.useState(false)

  // Edit / Add state toggles
  const [isAddingBudget, setIsAddingBudget] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<BudgetLimit | null>(null)
  const [isAddingGoal, setIsAddingGoal] = React.useState(false)
  const [editingGoal, setEditingGoal] = React.useState<SavingGoal | null>(null)

  // Form inputs
  const [budgetCategoryInput, setBudgetCategoryInput] = React.useState("")
  const [budgetLimitInput, setBudgetLimitInput] = React.useState("")
  const [showBudgetSuggestions, setShowBudgetSuggestions] = React.useState(false)

  const [goalTitleInput, setGoalTitleInput] = React.useState("")
  const [goalTargetInput, setGoalTargetInput] = React.useState("")
  const [goalCollectedInput, setGoalCollectedInput] = React.useState("")
  const [goalIconInput, setGoalIconInput] = React.useState<SavingGoal['iconName']>('PiggyBank')
  const [deductCash, setDeductCash] = React.useState(true)

  // Toast state
  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  // AutoLog store
  const { rules, ruleCategories, addRule, updateRule, deleteRule, toggleRuleActive } = useAutoLogStore()

  // AutoLog Dialog state
  const [ruleOpen, setRuleOpen] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<AutoLogRule | null>(null)
  
  // AutoLog Form inputs
  const [ruleTitleInput, setRuleTitleInput] = React.useState("")
  const [ruleAmountInput, setRuleAmountInput] = React.useState("")
  const [ruleTypeInput, setRuleTypeInput] = React.useState<'in' | 'out'>('out')
  const [ruleCategoryInput, setRuleCategoryInput] = React.useState("")
  const [ruleNoteInput, setRuleNoteInput] = React.useState("")
  const [ruleFrequencyInput, setRuleFrequencyInput] = React.useState<AutoLogFrequency>('monthly')
  const [ruleStartDateInput, setRuleStartDateInput] = React.useState("")
  const [ruleIsActiveInput, setRuleIsActiveInput] = React.useState(true)

  // Custom Dropdown UI State
  const [showFrequencyDropdown, setShowFrequencyDropdown] = React.useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false)
  const [showRuleCategorySuggestions, setShowRuleCategorySuggestions] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const t = (key: keyof typeof translations['id']) => {
    if (!mounted) return translations['id'][key]
    return translations[language]?.[key] || translations['id'][key]
  }

  // Suggestion autocomplete from actual user transactions
  const suggestions = React.useMemo(() => {
    const cats = transactions
      .map(t => t.category)
      .filter((cat): cat is string => !!cat && cat !== 'Saldo Awal')
    return Array.from(new Set(cats))
  }, [transactions])

  const filteredSuggestions = React.useMemo(() => {
    if (!budgetCategoryInput || budgetCategoryInput.length < 1) return []
    return suggestions.filter(cat => 
      cat.toLowerCase().includes(budgetCategoryInput.toLowerCase()) &&
      cat.toLowerCase() !== budgetCategoryInput.toLowerCase()
    )
  }, [budgetCategoryInput, suggestions])

  const filteredRuleCategorySuggestions = React.useMemo(() => {
    const query = ruleCategoryInput.trim().toLowerCase()
    if (query.length < 1) return []

    // 1. Get categories from active budgets
    const budgetCats = budgets
      .map((b) => b.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))
    
    // 2. Get categories from transaction history (excluding initial balance seed)
    const historyCats = transactions
      .map((t) => t.category.trim())
      .filter((cat) => cat && cat.toLowerCase() !== "saldo awal" && cat.toLowerCase().includes(query))

    // 3. Get categories from existing recurring transaction rules
    const ruleCats = rules
      .map((r) => r.category.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))

    // 4. Get categories from historically saved rule categories in store
    const persistentRuleCats = (ruleCategories || [])
      .map((cat) => cat.trim())
      .filter((cat) => cat && cat.toLowerCase().includes(query))

    // Create unique combined list with source identification
    const combinedMap = new Map<string, 'budget' | 'history'>()
    
    // Add persistent rule categories first
    persistentRuleCats.forEach((cat) => {
      combinedMap.set(cat, 'history')
    })

    // Add rule categories (lowest priority, overridden by history/budget)
    ruleCats.forEach((cat) => {
      combinedMap.set(cat, 'history')
    })

    // Add history categories
    historyCats.forEach((cat) => {
      combinedMap.set(cat, 'history')
    })
    
    // Add budget categories (highest priority)
    budgetCats.forEach((cat) => {
      combinedMap.set(cat, 'budget')
    })

    return Array.from(combinedMap.entries()).map(([name, source]) => ({
      name,
      source
    })).slice(0, 5)
  }, [transactions, budgets, rules, ruleCategories, ruleCategoryInput])

  const isBudgetCategoryDuplicate = React.useMemo(() => {
    const trimmed = budgetCategoryInput.trim().toLowerCase()
    if (!trimmed) return false
    return budgets.some(b => {
      if (editingBudget && b.id === editingBudget.id) return false
      return b.category.toLowerCase() === trimmed
    })
  }, [budgetCategoryInput, budgets, editingBudget])

  // Get dynamic spent amount from transactions
  const getSpentAmount = (category: string) => {
    return transactions
      .filter(t => t.type === 'out' && t.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Formatting helpers
  const formatInputVal = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (!clean) return ""
    return new Intl.NumberFormat("id-ID").format(Number(clean))
  }

  const parseNum = (str: string) => Number(str.replace(/\D/g, "")) || 0

  // Budget CRUD Actions
  const handleOpenNewBudget = () => {
    setBudgetCategoryInput("")
    setBudgetLimitInput("")
    setEditingBudget(null)
    setIsAddingBudget(true)
    setBudgetOpen(true)
  }

  const handleOpenEditBudget = (b: BudgetLimit) => {
    setBudgetCategoryInput(b.category)
    setBudgetLimitInput(new Intl.NumberFormat("id-ID").format(b.limit))
    setEditingBudget(b)
    setIsAddingBudget(false)
    setBudgetOpen(true)
  }

  const handleSaveBudget = () => {
    const limit = parseNum(budgetLimitInput)
    if (!budgetCategoryInput.trim() || limit <= 0 || isBudgetCategoryDuplicate) return

    if (editingBudget) {
      updateBudget(editingBudget.id, budgetCategoryInput.trim(), limit)
    } else if (isAddingBudget) {
      addBudget(budgetCategoryInput.trim(), limit)
    }
    setBudgetOpen(false)
  }

  const handleDeleteBudget = (id: string) => {
    if (confirm(t('deleteBudgetConfirm'))) {
      deleteBudget(id)
      setBudgetOpen(false)
    }
  }

  // Goal CRUD Actions
  const handleOpenNewGoal = () => {
    setGoalTitleInput("")
    setGoalTargetInput("")
    setGoalCollectedInput("")
    setGoalIconInput('PiggyBank')
    setEditingGoal(null)
    setIsAddingGoal(true)
    setDeductCash(true)
    setGoalOpen(true)
  }

  const handleOpenEditGoal = (g: SavingGoal) => {
    setGoalTitleInput(g.title)
    setGoalTargetInput(new Intl.NumberFormat("id-ID").format(g.target))
    setGoalCollectedInput(new Intl.NumberFormat("id-ID").format(g.collected))
    setGoalIconInput(g.iconName)
    setEditingGoal(g)
    setIsAddingGoal(false)
    setDeductCash(true)
    setGoalOpen(true)
  }

  const handleSaveGoal = () => {
    const target = parseNum(goalTargetInput)
    const collected = parseNum(goalCollectedInput)
    if (!goalTitleInput.trim() || target <= 0) return

    if (editingGoal) {
      updateGoal(editingGoal.id, goalTitleInput.trim(), target, collected, goalIconInput)
      triggerToast(
        language === 'id'
          ? `Target tabungan "${goalTitleInput.trim()}" berhasil diperbarui!`
          : `Saving goal "${goalTitleInput.trim()}" successfully updated!`
      )
    } else if (isAddingGoal) {
      addGoal(goalTitleInput.trim(), target, collected, goalIconInput)
      triggerToast(
        language === 'id'
          ? `Target tabungan "${goalTitleInput.trim()}" berhasil dibuat!`
          : `Saving goal "${goalTitleInput.trim()}" successfully created!`
      )
      
      // Jika user memasukkan nominal awal tabungan, catat sebagai transaksi berkategori 'Tabungan' (tidak mempengaruhi saldo tunai)
      if (collected > 0) {
        const noteTemplate = t('savingNoteTemplate')
        const note = noteTemplate
          .replace('[Nama Target]', goalTitleInput.trim())
          .replace('[Goal Name]', goalTitleInput.trim())
        
        addTransaction({
          amount: collected,
          type: deductCash ? 'out' : 'in',
          category: 'Tabungan',
          note: note
        })
      }
    }
    setGoalOpen(false)
  }

  const handleDeleteGoal = (id: string) => {
    if (confirm(t('deleteGoalConfirm'))) {
      deleteGoal(id)
      triggerToast(
        language === 'id'
          ? `Target tabungan berhasil dihapus!`
          : `Saving goal successfully deleted!`
      )
      setGoalOpen(false)
    }
  }

  const getFrequencyLabel = (freq: AutoLogFrequency) => {
    switch (freq) {
      case 'daily': return t('freqDaily')
      case 'weekly': return t('freqWeekly')
      case 'monthly': return t('freqMonthly')
      case 'yearly': return t('freqYearly')
      default: return freq
    }
  }

  const getTypeLabel = (type: 'in' | 'out') => {
    return type === 'in' ? t('income') : t('expense')
  }

  const handleOpenNewRule = () => {
    setRuleTitleInput("")
    setRuleAmountInput("")
    setRuleTypeInput('out')
    setRuleCategoryInput("")
    setRuleNoteInput("")
    setRuleFrequencyInput('monthly')
    
    const todayStr = new Date().toISOString().split('T')[0]
    setRuleStartDateInput(todayStr)
    setRuleIsActiveInput(true)
    setEditingRule(null)
    setRuleOpen(true)
  }

  const handleOpenEditRule = (rule: AutoLogRule) => {
    setRuleTitleInput(rule.title)
    setRuleAmountInput(new Intl.NumberFormat("id-ID").format(rule.amount))
    setRuleTypeInput(rule.type)
    setRuleCategoryInput(rule.category)
    setRuleNoteInput(rule.note)
    setRuleFrequencyInput(rule.frequency)
    setRuleStartDateInput(rule.startDate.split('T')[0])
    setRuleIsActiveInput(rule.isActive)
    setEditingRule(rule)
    setRuleOpen(true)
  }

  const handleSaveRule = () => {
    const amount = parseNum(ruleAmountInput)
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

    if (editingRule) {
      updateRule(editingRule.id, ruleData)
      triggerToast(t('toastRuleAdded'))
    } else {
      addRule(ruleData)
      triggerToast(t('toastRuleAdded'))
    }
    setRuleOpen(false)
  }

  const handleDeleteRule = (id: string) => {
    if (confirm(t('deleteRuleConfirm'))) {
      deleteRule(id)
      triggerToast(t('toastRuleDeleted'))
      setRuleOpen(false)
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-8 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Title Block */}
      <motion.div variants={itemVariant} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">{t('planning')}</h1>
          <p className="text-muted-foreground">{t('planningSubtitle')}</p>
        </div>
      </motion.div>

      {/* Symmetrical Top Grid (Batas Anggaran & Target Tabungan dengan Lebar & Tinggi Sama) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        
        {/* Batas Anggaran per Kategori */}
        <motion.div variants={itemVariant} className="flex flex-col h-full">
          <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('budgetLimit')}
                </CardTitle>
                <CardDescription className="text-[11px] leading-tight max-w-[200px]">
                  {language === 'id' 
                    ? "Batas pengeluaran bulanan per kategori." 
                    : "Monthly budget limits for categories."}
                </CardDescription>
              </div>
              <button
                onClick={handleOpenNewBudget}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'id' ? "Tambah" : "Add"}</span>
              </button>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 flex-1 min-h-[300px] flex flex-col justify-start">
              {mounted && budgets.length > 0 ? (
                budgets.map((b) => {
                  const spent = getSpentAmount(b.category)
                  const percentage = b.limit > 0 ? Math.min(Math.round((spent / b.limit) * 100), 100) : 0
                  const isCritical = percentage >= 80

                  return (
                    <div 
                      key={b.id} 
                      className="group relative p-3 rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:bg-muted/10"
                    >
                      {/* Edit Button floating */}
                      <button
                        onClick={() => handleOpenEditBudget(b)}
                        className="absolute right-3 top-3 p-1.5 bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer duration-200"
                        title={t('editBudget')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-2 pr-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap pr-4">
                            {b.category}
                            {isCritical && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                CRITICAL
                              </span>
                            )}
                          </span>
                          <span className={`text-xs font-bold shrink-0 ${isCritical ? 'text-primary' : 'text-muted-foreground'}`}>
                            {percentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-muted/70 relative overflow-hidden border border-border/20">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical ? "bg-primary shadow-[0_0_8px_rgba(129,11,56,0.3)]" : "bg-green-500"
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                          <span>{t('activeLabel')}: {formatCurrency(spent, language)}</span>
                          <span>{t('targetLabel')}: {formatCurrency(b.limit, language)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-2xl bg-primary/[0.01]">
                  <div className="p-4 bg-primary/5 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {language === 'id' ? "Belum Ada Batas Anggaran" : "No Budget Limits Yet"}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-normal mb-5">
                    {t('emptyBudgets')}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenNewBudget}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg px-4 py-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('addBudget')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Target Tabungan / Saving Goals */}
        <motion.div variants={itemVariant} className="flex flex-col h-full">
          <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  {t('savingGoals')}
                </CardTitle>
                <CardDescription className="text-[11px] leading-tight">
                  {language === 'id' 
                    ? "Tentukan tujuan tabungan impian Anda dan pantau pencapaiannya." 
                    : "Define your dream saving goals and track their progression."}
                </CardDescription>
              </div>
              <button
                onClick={handleOpenNewGoal}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'id' ? "Tambah" : "Add"}</span>
              </button>
            </CardHeader>
            <CardContent className="pt-5 flex-1 min-h-[300px] flex flex-col justify-start">
              {mounted && goals.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {goals.map((g) => {
                    const pct = g.target > 0 ? Math.min(Math.round((g.collected / g.target) * 100), 100) : 0
                    const remaining = Math.max(g.target - g.collected, 0)
                    
                    const IconComp = iconMapping[g.iconName] || PiggyBank
                    const optionMatch = iconOptions.find(o => o.value === g.iconName)
                    const colorClass = optionMatch ? `${optionMatch.bg} ${optionMatch.text}` : 'bg-primary/10 text-primary'

                    return (
                      <Card 
                        key={g.id} 
                        className="bg-card border-border/60 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                          <IconComp className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                          <div className={`p-2 rounded-lg border border-border/40 ${colorClass}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditGoal(g)}
                              className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded transition-colors cursor-pointer"
                              title={t('editGoal')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                              {pct}%
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{g.title}</h3>
                            
                            <div className="flex items-center justify-between mt-3 mb-1.5 text-[11px]">
                              <div>
                                <span className="text-muted-foreground block text-[8px] uppercase font-semibold tracking-wider mb-0.5">{t('collectedLabel')}</span>
                                <span className="font-bold text-foreground text-xs">{formatCurrency(g.collected, language)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground block text-[8px] uppercase font-semibold tracking-wider mb-0.5">{t('targetLabel')}</span>
                                <span className="font-bold text-muted-foreground text-xs">{formatCurrency(g.target, language)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mt-2">
                            {/* Progress Bar */}
                            <div className="w-full h-1.5 rounded-full bg-muted/70 relative overflow-hidden border border-border/20">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                              <span>{t('remainingLabel')}</span>
                              <span>{formatCurrency(remaining, language)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-2xl bg-green-500/[0.01]">
                  <div className="p-4 bg-green-500/5 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <PiggyBank className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {language === 'id' ? "Belum Ada Target Tabungan" : "No Saving Goals Yet"}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[240px] leading-normal mb-5">
                    {t('emptyGoals')}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenNewGoal}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg px-4 py-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('addGoal')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Symmetrical Bottom Row (Transaksi Berulang - Lebar Penuh) */}
      <motion.div variants={itemVariant} className="w-full">
        <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {t('autoLog')}
              </CardTitle>
              <CardDescription className="text-[11px] leading-tight">
                {t('autoLogSubtitle')}
              </CardDescription>
            </div>
            <button
              onClick={handleOpenNewRule}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addRule')}</span>
            </button>
          </CardHeader>
          <CardContent className="pt-5 flex-1 min-h-[300px] flex flex-col justify-start gap-4">
            {mounted && rules.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="p-3.5 rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:bg-muted/10 flex flex-col gap-2.5 relative group"
                  >
                    {/* Top row: Title, Type Badge, and edit button */}
                    <div className="flex items-center justify-between pr-8">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          rule.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                        }`}>
                          {rule.type === 'in' ? '+' : '-'} {rule.type === 'in' ? t('income') : t('expense')}
                        </span>
                        <span className="font-bold text-foreground text-xs truncate">{rule.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Active / Inactive switch */}
                        <button
                          onClick={() => {
                            toggleRuleActive(rule.id)
                            triggerToast(t('toastSaved'))
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative flex items-center shrink-0 cursor-pointer ${
                            rule.isActive ? 'bg-emerald-500' : 'bg-muted border border-border'
                          }`}
                          title={rule.isActive ? t('ruleActive') : t('ruleInactive')}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              rule.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Middle row: Amount and Frequency */}
                    <div className="flex items-baseline justify-between select-none">
                      <span className={`text-sm font-black ${rule.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
                        {rule.type === 'in' ? '+' : '-'}{formatCurrency(rule.amount, language)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase bg-muted/60 border border-border/40 px-2 py-0.5 rounded">
                        {getFrequencyLabel(rule.frequency)}
                      </span>
                    </div>

                    {/* Bottom details: Category, note, start date */}
                    <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-semibold border-t border-border/20 pt-2">
                      <div className="flex justify-between items-center">
                        <span>{t('category')}: <strong className="text-foreground/90">{rule.category}</strong></span>
                        <span>{t('ruleStartDate')}: <strong className="text-foreground/90">{new Date(rule.startDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</strong></span>
                      </div>
                      {rule.note && (
                        <div className="text-[9px] italic text-muted-foreground/80 leading-tight">
                          "{rule.note}"
                        </div>
                      )}
                    </div>

                    {/* Edit Button floating */}
                    <button
                      onClick={() => handleOpenEditRule(rule)}
                      className="absolute right-3 top-3.5 p-1.5 bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer duration-200"
                      title={t('editRule')}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-2xl bg-primary/[0.01]">
                <div className="p-4 bg-primary/5 rounded-2xl mb-4 transition-transform hover:scale-105">
                  <RefreshCw className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  {t('autoLog')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[240px] leading-normal mb-5">
                  {t('emptyAutoLog')}
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenNewRule}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs rounded-lg px-4 py-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('addRule')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* DIALOG 1: BUDGET CRUD MODAL */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-primary dark:text-rose-400" />
              {editingBudget ? t('editBudget') : t('newBudget')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {language === 'id' 
                ? "Atur anggaran pengeluaran bulanan Anda secara disiplin." 
                : "Configure your monthly budget limit for healthy discipline."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 relative">
            {/* Category selection & Suggestion autocomplete */}
            <div className="grid gap-1.5 relative">
              <label className="font-semibold text-xs text-muted-foreground">{t('budgetCategory')}</label>
              <div className="relative">
                <Input 
                  placeholder={language === 'id' ? "Contoh: Makanan, Belanja, Hiburan" : "e.g. Food, Shopping, Entertainment"}
                  value={budgetCategoryInput}
                  onChange={(e) => {
                    setBudgetCategoryInput(e.target.value)
                    setShowBudgetSuggestions(true)
                  }}
                  onFocus={() => setShowBudgetSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBudgetSuggestions(false), 200)}
                  className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium w-full"
                />
                
                {/* Autocomplete select2-like list */}
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

              {isBudgetCategoryDuplicate && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-primary animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('budgetCategoryExists')}</span>
                </div>
              )}
            </div>

            {/* Budget Limit Amount */}
            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{t('budgetAmount')}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">
                  {
                    {
                      IDR: 'Rp',
                      USD: '$',
                      EUR: '€',
                      SGD: 'S$',
                      JPY: '¥'
                    }[activeCurrency] || 'Rp'
                  }
                </span>
                <input 
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(formatInputVal(e.target.value))}
                  className="pl-8 h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 mt-6 border-t border-border/40 pt-4">
            {editingBudget ? (
              <button
                type="button"
                onClick={() => handleDeleteBudget(editingBudget.id)}
                className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('deleteBudget')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setBudgetOpen(false)} 
                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                type="button"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSaveBudget} 
                disabled={!budgetCategoryInput.trim() || parseNum(budgetLimitInput) <= 0 || isBudgetCategoryDuplicate}
                className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: SAVING GOAL CRUD MODAL */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary dark:text-rose-400" />
              {editingGoal ? t('editGoal') : t('newGoal')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {language === 'id' 
                ? "Tentukan sasaran dana tabungan dan track perkembangannya." 
                : "Set a savings target and visualize your compound gains."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Goal Title */}
            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{t('goalTitle')}</label>
              <Input 
                placeholder={language === 'id' ? "Contoh: Dana Darurat, Liburan Jepang, Laptop Baru" : "e.g. Emergency Fund, Japan Trip"}
                value={goalTitleInput}
                onChange={(e) => setGoalTitleInput(e.target.value)}
                className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
              />
            </div>

             {/* Target & Collected Inputs */}
             <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-1.5">
                 <label className="font-semibold text-xs text-muted-foreground">{t('goalTarget')}</label>
                 <div className="relative flex items-center">
                   <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">Rp</span>
                   <input 
                     value={goalTargetInput}
                     onChange={(e) => setGoalTargetInput(formatInputVal(e.target.value))}
                     className="pl-8 h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
                   />
                 </div>
               </div>
 
               <div className="grid gap-1.5">
                 <label className="font-semibold text-xs text-muted-foreground">{t('goalCollected')}</label>
                 <div className="relative flex items-center">
                   <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">Rp</span>
                   <input 
                     value={goalCollectedInput}
                     onChange={(e) => setGoalCollectedInput(formatInputVal(e.target.value))}
                     disabled={!isAddingGoal}
                     className="pl-8 h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
                   />
                 </div>
               </div>
             </div>

             {/* Deduct from Cash Balance Checkbox (only when adding) */}
             {isAddingGoal && (
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
                     {t('deductFromCash')}
                   </label>
                   <p className="text-[10px] text-muted-foreground">
                     {language === 'id' 
                       ? "Kurangi saldo tunai aktif Anda untuk nominal awal tabungan ini." 
                       : "Deduct your active cash balance for this savings initial amount."}
                   </p>
                 </div>
               </div>
             )}

            {/* Icon mapping options */}
            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{t('goalIcon')}</label>
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
            {editingGoal ? (
              <button
                type="button"
                onClick={() => handleDeleteGoal(editingGoal.id)}
                className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('deleteGoal')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setGoalOpen(false)} 
                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                type="button"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSaveGoal} 
                disabled={!goalTitleInput.trim() || parseNum(goalTargetInput) <= 0}
                className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: AUTOLOG RULE CRUD MODAL */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary dark:text-rose-400" />
              {editingRule ? t('editRule') : t('addRule')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {t('autoLogSubtitle')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 relative">
            
            {/* Rule Name (Title) */}
            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{t('ruleTitle')}</label>
              <Input 
                placeholder={t('ruleTitlePlaceholder')}
                value={ruleTitleInput}
                onChange={(e) => setRuleTitleInput(e.target.value)}
                className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
              />
            </div>

            {/* Type & Nominal Row */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Custom Type Dropdown */}
              <div className="grid gap-1.5 relative">
                <label className="font-semibold text-xs text-muted-foreground">{t('ruleType')}</label>
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
                    <span>{getTypeLabel(ruleTypeInput)}</span>
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
                          {getTypeLabel(type)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rule Amount */}
              <div className="grid gap-1.5">
                <label className="font-semibold text-xs text-muted-foreground">{t('ruleAmount')}</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">Rp</span>
                  <input 
                    value={ruleAmountInput}
                    onChange={(e) => setRuleAmountInput(formatInputVal(e.target.value))}
                    className="pl-8 h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  />
                </div>
              </div>

            </div>

            {/* Frequency & Start Date Row */}
            <div className="grid grid-cols-2 gap-4">

              {/* Custom Frequency Dropdown */}
              <div className="grid gap-1.5 relative">
                <label className="font-semibold text-xs text-muted-foreground">{t('ruleFrequency')}</label>
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
                    <span>{getFrequencyLabel(ruleFrequencyInput)}</span>
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
                          {getFrequencyLabel(freq)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div className="grid gap-1.5">
                <label className="font-semibold text-xs text-muted-foreground">{t('ruleStartDate')}</label>
                <input 
                  type="date"
                  value={ruleStartDateInput}
                  onChange={(e) => setRuleStartDateInput(e.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-muted/40 px-3 py-1 text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
              </div>

            </div>

            {/* Category selection & Suggestion autocomplete */}
            <div className="grid gap-1.5 relative">
              <label className="font-semibold text-xs text-muted-foreground">{t('ruleCategory')}</label>
              <div className="relative">
                <Input 
                  placeholder={language === 'id' ? "Contoh: Gaji, Internet, Investasi" : "e.g. Salary, Internet, Investment"}
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
                
                {/* Autocomplete suggestions list */}
                {showRuleCategorySuggestions && filteredRuleCategorySuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur-md overflow-hidden flex flex-col py-1">
                    {filteredRuleCategorySuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault() // prevent input blur before onClick
                        }}
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
                          {item.source === 'budget' ? t('budgetSuggestion') : t('historySuggestion')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Note Input */}
            <div className="grid gap-1.5">
              <label className="font-semibold text-xs text-muted-foreground">{t('ruleNote')}</label>
              <Input 
                placeholder={language === 'id' ? "Catatan tambahan (opsional)" : "Additional notes (optional)"}
                value={ruleNoteInput}
                onChange={(e) => setRuleNoteInput(e.target.value)}
                className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
              />
            </div>

          </div>

          <div className="flex justify-between items-center gap-3 mt-6 border-t border-border/40 pt-4">
            {editingRule ? (
              <button
                type="button"
                onClick={() => handleDeleteRule(editingRule.id)}
                className="flex items-center gap-1 text-xs font-bold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('deleteRule')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setRuleOpen(false)} 
                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
                type="button"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSaveRule} 
                disabled={!ruleTitleInput.trim() || parseNum(ruleAmountInput) <= 0 || !ruleCategoryInput.trim() || !ruleStartDateInput}
                className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </motion.div>
  )
}
