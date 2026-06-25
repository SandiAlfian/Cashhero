"use client"

import { TrendingUp, ShieldCheck, Activity, Target } from "lucide-react"
import { AuditGauge } from "@/components/charts/AuditGauge"
import type { AuditResult, AuditSuggestion } from "@/lib/statistics"

interface Props {
  audit: AuditResult
  language: string
  t: (k: string) => string
  suggestions: AuditSuggestion[]
}

export function AuditScorecard({ audit, language, t, suggestions }: Props) {
  const getHealthLabel = () => {
    if (audit.score >= 80) return t('healthExcellent')
    if (audit.score >= 60) return t('healthGood')
    if (audit.score >= 40) return t('healthFair')
    if (audit.score >= 20) return t('healthPoor')
    return t('healthCritical')
  }
  const getHealthColor = () => {
    if (audit.score >= 80) return 'text-green-600 dark:text-green-400'
    if (audit.score >= 60) return 'text-amber-500 dark:text-amber-400'
    if (audit.score >= 40) return 'text-orange-500 dark:text-orange-400'
    return 'text-destructive'
  }
  const getAuditComment = () => {
    const lang = language as 'id' | 'en'
    const weakPoints: string[] = []
    if (audit.savingsRateScore < 20) weakPoints.push(lang === 'id' ? 'rasio tabungan rendah' : 'low savings rate')
    if (audit.budgetComplianceScore < 17) weakPoints.push(lang === 'id' ? 'kepatuhan anggaran perlu ditingkatkan' : 'budget compliance needs improvement')
    if (audit.volatilityScore < 12) weakPoints.push(lang === 'id' ? 'arus kas fluktuatif' : 'unstable cash flow')
    if (weakPoints.length > 0) {
      const list = weakPoints.join(lang === 'id' ? ', ' : ', ')
      if (audit.score >= 60) return lang === 'id' ? `Kondisi cukup baik tetapi ${list}. Fokus perbaiki area ini untuk skor lebih optimal.` : `Fairly good condition but ${list}. Focus on these areas for a better score.`
      if (audit.score >= 40) return lang === 'id' ? `Perlu perhatian: ${list}. Buat rencana aksi bertahap untuk setiap area.` : `Needs attention: ${list}. Create a gradual action plan for each area.`
      if (audit.score >= 20) return lang === 'id' ? `Kondisi mengkhawatirkan: ${list}. Segera evaluasi pengeluaran dan buat prioritas pemulihan keuangan.` : `Concerning: ${list}. Immediately review expenses and set financial recovery priorities.`
      return lang === 'id' ? `Kritis: ${list}. Diperlukan restrukturisasi keuangan segera.` : `Critical: ${list}. Immediate financial restructuring needed.`
    }
    if (audit.score >= 80) return lang === 'id' ? 'Kinerja keuangan sangat baik di semua aspek. Pertahankan disiplin ini dan eksplorasi peluang investasi jangka panjang.' : 'Excellent financial performance across all aspects. Maintain this discipline and explore long-term investment opportunities.'
    if (audit.score >= 60) return lang === 'id' ? 'Kondisi keuangan cukup baik dengan keseimbangan yang stabil. Tingkatkan sedikit lagi untuk capai skor optimal.' : 'Fairly good financial condition with stable balance. Improve slightly to reach optimal score.'
    return lang === 'id' ? 'Evaluasi ulang strategi keuangan secara menyeluruh. Pertimbangkan konsultasi dengan perencana keuangan.' : 'Thoroughly re-evaluate your financial strategy. Consider consulting a financial planner.'
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <AuditGauge score={audit.score} />
        <span className={`text-sm font-bold ${getHealthColor()}`}>{getHealthLabel()}</span>
        {audit.dataQuality < 1 && (
          <span className="text-[8px] text-muted-foreground/60 italic mt-0.5">
            {(language as 'id' | 'en') === 'id' ? `*skor berdasarkan ${(audit.dataQuality * 100).toFixed(0)}% data periode` : `*score based on ${(audit.dataQuality * 100).toFixed(0)}% period data`}
          </span>
        )}
        {!audit.hasBudgets && (
          <span className="text-[8px] text-amber-500/70 italic">
            {(language as 'id' | 'en') === 'id' ? '*tidak ada anggaran — kepatuhan dinilai netral' : '*no budgets set — compliance scored neutral'}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><TrendingUp className="w-3 h-3 text-primary" />{t('savingsRate')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{audit.savingsRate.toFixed(1)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, audit.savingsRate * 4))}%`, background: 'linear-gradient(90deg, #10B981, #059669)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.savingsRateScore}/40</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('savingsRateDesc')}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><ShieldCheck className="w-3 h-3 text-blue-500" />{t('budgetCompliance')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{(audit.complianceRate * 100).toFixed(0)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${audit.complianceRate * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #2563EB)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.budgetComplianceScore}/35</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('budgetComplianceDesc')}</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 border border-border/40 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1"><Activity className="w-3 h-3 text-purple-500" />{t('cashFlowVolatility')}</div>
            <span className="text-lg font-extrabold text-foreground font-number">{(audit.volatility * 100).toFixed(1)}%</span>
            <div className="mt-1.5 w-full bg-muted/40 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (1 - audit.volatility) * 100))}%`, background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)' }} /></div>
            <span className="text-[9px] text-muted-foreground mt-1 block">{audit.volatilityScore}/25</span>
            <p className="text-[9px] text-muted-foreground/70 leading-relaxed mt-1.5 border-t border-border/30 pt-1.5">{t('cashFlowVolatilityDesc')}</p>
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-primary" /><h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('auditorReviewTitle')}</h4></div>
          <p className="text-xs text-muted-foreground leading-relaxed">{getAuditComment()}</p>
        </div>
        {suggestions.length > 0 && (
          <div className="bg-card border border-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /><h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{language === 'id' ? 'Rekomendasi' : 'Recommendations'}</h4></div>
            <ul className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <s.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${s.color}`} />
                  <span className="leading-relaxed">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
