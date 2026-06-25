"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ClipboardList } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore, type BudgetLimit, type SavingGoal } from "@/store/usePlanningStore"
import { useAutoLogStore, type AutoLogRule } from "@/store/useAutoLogStore"
import { container, itemVariant, getTranslation } from "@/lib/planning"
import { BudgetSection } from "@/components/planning/BudgetSection"
import { GoalSection } from "@/components/planning/GoalSection"
import { AutoLogSection } from "@/components/planning/AutoLogSection"
import { BudgetDialog } from "@/components/planning/BudgetDialog"
import { GoalDialog } from "@/components/planning/GoalDialog"
import { RuleDialog } from "@/components/planning/RuleDialog"
import { ToastNotification } from "@/components/planning/ToastNotification"

export default function PlanningPage() {
  const { language } = useLanguageStore()
  const transactions = useTransactionStore((state) => state.transactions)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const { budgets, goals } = usePlanningStore()
  const { rules, toggleRuleActive } = useAutoLogStore()

  const [mounted, setMounted] = React.useState(false)

  const [budgetOpen, setBudgetOpen] = React.useState(false)
  const [goalOpen, setGoalOpen] = React.useState(false)
  const [ruleOpen, setRuleOpen] = React.useState(false)

  const [budgetToEdit, setBudgetToEdit] = React.useState<BudgetLimit | null>(null)
  const [goalToEdit, setGoalToEdit] = React.useState<SavingGoal | null>(null)
  const [ruleToEdit, setRuleToEdit] = React.useState<AutoLogRule | null>(null)

  const [showToast, setShowToast] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState('')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const handleOpenNewBudget = () => { setBudgetToEdit(null); setBudgetOpen(true) }
  const handleOpenEditBudget = (b: BudgetLimit) => { setBudgetToEdit(b); setBudgetOpen(true) }
  const handleOpenNewGoal = () => { setGoalToEdit(null); setGoalOpen(true) }
  const handleOpenEditGoal = (g: SavingGoal) => { setGoalToEdit(g); setGoalOpen(true) }
  const handleOpenNewRule = () => { setRuleToEdit(null); setRuleOpen(true) }
  const handleOpenEditRule = (rule: AutoLogRule) => { setRuleToEdit(rule); setRuleOpen(true) }

  const handleGoalCreated = (collected: number, title: string, deductCash: boolean) => {
    const noteTemplate = getTranslation(language, 'savingNoteTemplate')
    const note = noteTemplate
      .replace('[Nama Target]', title)
      .replace('[Goal Name]', title)
    addTransaction({
      amount: collected,
      type: deductCash ? 'out' : 'in',
      category: 'Tabungan',
      note: note
    })
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{getTranslation(language, 'planning')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{getTranslation(language, 'planningSubtitle')}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <BudgetSection
          language={language}
          budgets={budgets}
          transactions={transactions}
          onNew={handleOpenNewBudget}
          onEdit={handleOpenEditBudget}
          mounted={mounted}
        />

        <GoalSection
          language={language}
          goals={goals}
          onNew={handleOpenNewGoal}
          onEdit={handleOpenEditGoal}
          mounted={mounted}
        />
      </div>

      <AutoLogSection
        language={language}
        rules={rules}
        onNew={handleOpenNewRule}
        onEdit={handleOpenEditRule}
        onToggleActive={toggleRuleActive}
        onToast={triggerToast}
        mounted={mounted}
      />

      <BudgetDialog open={budgetOpen} onOpenChange={setBudgetOpen} editBudget={budgetToEdit} />

      <GoalDialog open={goalOpen} onOpenChange={setGoalOpen} editGoal={goalToEdit} onToast={triggerToast} onGoalCreated={handleGoalCreated} />

      <RuleDialog open={ruleOpen} onOpenChange={setRuleOpen} editRule={ruleToEdit} onToast={triggerToast} />

      <ToastNotification show={showToast} message={toastMessage} />
    </motion.div>
  )
}
