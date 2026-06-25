import { ShieldCheck, Plane, Laptop, Home as HomeIcon, PiggyBank } from "lucide-react"
import type { AutoLogFrequency } from "@/store/useAutoLogStore"
import type { Language } from "@/store/useLanguageStore"
import { translations } from "@/store/useLanguageStore"
import type { Variants } from "framer-motion"

export const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

export const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
}

export const iconMapping = {
  ShieldCheck,
  Plane,
  Laptop,
  Home: HomeIcon,
  PiggyBank
}

export const iconOptions = [
  { value: 'ShieldCheck' as const, label: 'Dana Darurat', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'Plane' as const, label: 'Liburan', bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'Laptop' as const, label: 'Gadget/Kerja', bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  { value: 'Home' as const, label: 'Rumah/DP', bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary' },
  { value: 'PiggyBank' as const, label: 'Tabungan', bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' }
]

export function getTranslation(language: Language, key: string): string {
  const dict = (translations[language] || translations['id']) as Record<string, string>
  return dict[key] || (translations['id'] as Record<string, string>)[key]
}

export function getFrequencyLabel(freq: AutoLogFrequency, language: Language): string {
  const labels: Record<AutoLogFrequency, string> = {
    daily: getTranslation(language, 'freqDaily'),
    weekly: getTranslation(language, 'freqWeekly'),
    monthly: getTranslation(language, 'freqMonthly'),
    yearly: getTranslation(language, 'freqYearly'),
  }
  return labels[freq] || freq
}

export function getTypeLabel(type: 'in' | 'out', language: Language): string {
  return type === 'in' ? getTranslation(language, 'income') : getTranslation(language, 'expense')
}

export function calculateBudgetPercentage(spent: number, limit: number): number {
  return limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0
}

export function calculateGoalProgress(collected: number, target: number): { percentage: number; remaining: number } {
  const percentage = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0
  const remaining = Math.max(target - collected, 0)
  return { percentage, remaining }
}

export function getSpentAmount(
  transactions: Array<{ type: string; category: string; amount: number }>,
  category: string
): number {
  return transactions
    .filter(t => t.type === 'out' && t.category.toLowerCase() === category.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0)
}
