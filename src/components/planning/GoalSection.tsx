"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, PiggyBank } from "lucide-react"
import { type SavingGoal } from "@/store/usePlanningStore"
import { type Language } from "@/store/useLanguageStore"
import { itemVariant, getTranslation } from "@/lib/planning"
import { GoalCard } from "./GoalCard"
import { EmptyState } from "./EmptyState"

interface Props {
  language: Language
  goals: SavingGoal[]
  onNew: () => void
  onEdit: (g: SavingGoal) => void
  mounted: boolean
}

export function GoalSection({ language, goals, onNew, onEdit, mounted }: Props) {
  return (
    <motion.div variants={itemVariant} className="flex flex-col h-full">
      <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              {getTranslation(language, 'savingGoals')}
            </CardTitle>
            <CardDescription className="text-[11px] leading-tight">
              {language === 'id'
                ? "Tentukan tujuan tabungan impian Anda dan pantau pencapaiannya."
                : "Define your dream saving goals and track their progression."}
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
        <CardContent className="pt-5 flex-1 min-h-[300px] flex flex-col justify-start">
          {mounted && goals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  language={language}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PiggyBank className="w-8 h-8 text-green-600 dark:text-green-400" />}
              title={language === 'id' ? 'Belum Ada Target Tabungan' : 'No Saving Goals Yet'}
              description={getTranslation(language, 'emptyGoals')}
              actionLabel={getTranslation(language, 'addGoal')}
              onAction={onNew}
              className="bg-green-500/[0.01]"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
