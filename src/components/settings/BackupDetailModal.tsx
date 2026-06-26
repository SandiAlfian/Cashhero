"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CloudUpload, FileText, RefreshCw, Target, TrendingUp, Wallet, BarChart3, Clock, Shield, ExternalLink } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { usePlanningStore } from "@/store/usePlanningStore"
import { useAutoLogStore } from "@/store/useAutoLogStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import { usePortfolioStore } from "@/store/usePortfolioStore"
import { useAuthStore } from "@/store/useAuthStore"

interface BackupDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
}

interface DataRow {
  icon: typeof FileText
  labelKey: string
  count: number
}

const LABEL_MAP: Record<string, [string, string]> = {
  transactions: ['Transaksi', 'Transactions'],
  budgets: ['Anggaran', 'Budgets'],
  goals: ['Target', 'Goals'],
  autoLogRules: ['Aturan Otomatis', 'Auto-Log Rules'],
  trackedOutflows: ['Piutang / Kasbon', 'Receivables / Loans'],
  portfolioAssets: ['Portofolio', 'Portfolio'],
}

export function BackupDetailModal({ open, onOpenChange, onConfirm, loading }: BackupDetailModalProps) {
  const { language } = useLanguageStore()
  const transactions = useTransactionStore((s) => s.transactions)
  const budgets = usePlanningStore((s) => s.budgets)
  const goals = usePlanningStore((s) => s.goals)
  const autoLogRules = useAutoLogStore((s) => s.rules)
  const trackedOutflows = useTrackedOutflowsStore((s) => s.items)
  const portfolioAssets = usePortfolioStore((s) => s.assets)
  const lastSyncAt = useAuthStore((s) => s.lastSyncAt)
  const backupConsentAt = useAuthStore((s) => s.backupConsentAt)
  const setBackupConsent = useAuthStore((s) => s.setBackupConsent)
  const [consented, setConsented] = React.useState(!!backupConsentAt)

  const dataRows: DataRow[] = React.useMemo(() => [
    { icon: FileText, labelKey: 'transactions', count: transactions.length },
    { icon: BarChart3, labelKey: 'budgets', count: budgets.length },
    { icon: Target, labelKey: 'goals', count: goals.length },
    { icon: RefreshCw, labelKey: 'autoLogRules', count: autoLogRules.length },
    { icon: Wallet, labelKey: 'trackedOutflows', count: trackedOutflows.length },
    { icon: TrendingUp, labelKey: 'portfolioAssets', count: portfolioAssets.length },
  ], [transactions.length, budgets.length, goals.length, autoLogRules.length, trackedOutflows.length, portfolioAssets.length])

  const totalItems = dataRows.reduce((sum, r) => sum + r.count, 0)

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const t = (labelKey: string) => {
    const pair = LABEL_MAP[labelKey]
    return pair ? pair[language === 'id' ? 0 : 1] : labelKey
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!loading) onOpenChange(false) }}
            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative bg-card text-card-foreground border border-border/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    {language === 'id' ? 'Cadangkan ke Cloud' : 'Backup to Cloud'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {language === 'id'
                      ? `Total ${totalItems} item data akan dicadangkan`
                      : `Total ${totalItems} data items will be backed up`}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Summary */}
            <div className="p-6 pb-4 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 mb-3">
                {language === 'id' ? 'RINCIAN DATA' : 'DATA DETAILS'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {dataRows.map((row) => (
                  <div
                    key={row.labelKey}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/10 border border-border/5"
                  >
                    <row.icon className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground truncate">{t(row.labelKey)}</span>
                      <span className="text-[11px] font-extrabold text-foreground ml-2 tabular-nums">{row.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {dataRows.every(r => r.count === 0) && (
                <p className="text-[11px] text-muted-foreground/60 text-center py-3 italic">
                  {language === 'id' ? 'Belum ada data untuk dicadangkan' : 'No data to back up yet'}
                </p>
              )}

              {lastSyncAt && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                  <Clock className="w-3 h-3 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground/70">
                    {language === 'id' ? 'Terakhir cadang' : 'Last backup'}: {formatSyncTime(lastSyncAt)}
                  </span>
                </div>
              )}
            </div>

            {/* Privacy & Encryption Notice */}
            <div className="px-6 pb-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-muted/10 border border-border/10 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    {language === 'id'
                      ? 'Data Anda dienkripsi end-to-end (TLS 1.3) saat dikirim dan terenkripsi (AES-256) saat disimpan di cloud Google Cloud Firestore. Hanya akun Google Anda yang memiliki akses ke data Anda.'
                      : 'Your data is encrypted in transit (TLS 1.3) and at rest (AES-256) in Google Cloud Firestore. We cannot read your data — only your Google account has access.'}
                  </p>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => {
                      setConsented(e.target.checked)
                      if (e.target.checked) setBackupConsent()
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-border/60 text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    {language === 'id' ? (
                      <>Saya menyetujui{' '}
                        <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-semibold inline-flex items-center gap-0.5">
                          Kebijakan Privasi <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {' & '}
                        <a href="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-semibold inline-flex items-center gap-0.5">
                          Syarat & Ketentuan <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </>
                    ) : (
                      <>I agree to the{' '}
                        <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-semibold inline-flex items-center gap-0.5">
                          Privacy Policy <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {' & '}
                        <a href="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-semibold inline-flex items-center gap-0.5">
                          Terms & Conditions <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </>
                    )}
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full bg-muted/40 hover:bg-muted/70 border border-border text-foreground py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none disabled:opacity-50"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setBackupConsent()
                  onConfirm()
                }}
                disabled={loading || totalItems === 0 || !consented}
                className="w-full bg-blue-500 text-white hover:bg-blue-500/90 py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 select-none disabled:opacity-55"
              >
                {loading ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                {loading
                  ? (language === 'id' ? 'Mencadangkan...' : 'Backing up...')
                  : (language === 'id' ? 'Cadangkan Sekarang' : 'Backup Now')
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
