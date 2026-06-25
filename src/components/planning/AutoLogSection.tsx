"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, RefreshCw } from "lucide-react"
import { type AutoLogRule } from "@/store/useAutoLogStore"
import { type Language } from "@/store/useLanguageStore"
import { itemVariant, getTranslation } from "@/lib/planning"
import { AutoLogRuleCard } from "./AutoLogRuleCard"
import { EmptyState } from "./EmptyState"

interface Props {
  language: Language
  rules: AutoLogRule[]
  onNew: () => void
  onEdit: (rule: AutoLogRule) => void
  onToggleActive: (id: string) => void
  onToast: (msg: string) => void
  mounted: boolean
}

export function AutoLogSection({ language, rules, onNew, onEdit, onToggleActive, onToast, mounted }: Props) {
  return (
    <motion.div variants={itemVariant} className="w-full">
      <Card className="bg-card border-border shadow-sm overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              {getTranslation(language, 'autoLog')}
            </CardTitle>
            <CardDescription className="text-[11px] leading-tight">
              {getTranslation(language, 'autoLogSubtitle')}
            </CardDescription>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getTranslation(language, 'addRule')}</span>
          </button>
        </CardHeader>
        <CardContent className="pt-5 flex-1 min-h-[300px] flex flex-col justify-start gap-4">
          {mounted && rules.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {rules.map((rule) => (
                <AutoLogRuleCard
                  key={rule.id}
                  rule={rule}
                  language={language}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onToast={onToast}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<RefreshCw className="w-8 h-8 text-primary" />}
              title={getTranslation(language, 'autoLog')}
              description={getTranslation(language, 'emptyAutoLog')}
              actionLabel={getTranslation(language, 'addRule')}
              onAction={onNew}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
