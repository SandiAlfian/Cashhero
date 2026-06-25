"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Target } from "lucide-react"
import { type BudgetLimit } from "@/store/usePlanningStore"
import { type Language } from "@/store/useLanguageStore"
import { itemVariant, getTranslation } from "@/lib/planning"
import { BudgetItem } from "./BudgetItem"
import { EmptyState } from "./EmptyState"

interface Props {
  language: Language
  budgets: BudgetLimit[]
  transactions: Array<{ type: string; category: string; amount: number }>
  onNew: () => void
  onEdit: (b: BudgetLimit) => void
  mounted: boolean
}

export function BudgetSection({ language, budgets, transactions, onNew, onEdit, mounted }: Props) {
  return (
    <motion.div variants={itemVariant} className="flex flex-col h-full">
      <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {getTranslation(language, 'budgetLimit')}
            </CardTitle>
            <CardDescription className="text-[11px] leading-tight max-w-[200px]">
              {language === 'id'
                ? "Batas pengeluaran bulanan per kategori."
                : "Monthly budget limits for categories."}
            </CardDescription>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Tambah' : 'Add'}</span>
          </button>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 flex-1 min-h-[300px] flex flex-col justify-start">
          {mounted && budgets.length > 0 ? (
            budgets.map((b) => (
              <BudgetItem
                key={b.id}
                budget={b}
                language={language}
                transactions={transactions}
                onEdit={onEdit}
              />
            ))
          ) : (
            <EmptyState
              icon={<Target className="w-8 h-8 text-primary" />}
              title={language === 'id' ? 'Belum Ada Batas Anggaran' : 'No Budget Limits Yet'}
              description={getTranslation(language, 'emptyBudgets')}
              actionLabel={getTranslation(language, 'addBudget')}
              onAction={onNew}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
