"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CloudDownload, FileText, RefreshCw, Target, TrendingUp, Wallet, BarChart3, ShieldAlert, Clock, AlertTriangle } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useAuthStore } from "@/store/useAuthStore"

interface BackupData {
  backedUpAt: string | null
  transactions: unknown[]
  settings: Record<string, unknown> | null
  budgets: unknown[]
  goals: unknown[]
  autoLogRules: unknown[]
  trackedOutflows: unknown[]
  portfolioAssets: unknown[]
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

interface RestoreDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onApplyData: (data: BackupData) => void
}

export function RestoreDetailModal({ open, onOpenChange, loading, onApplyData }: RestoreDetailModalProps) {
  const { language } = useLanguageStore()
  const [backupData, setBackupData] = React.useState<BackupData | null>(null)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const idToken = useAuthStore((s) => s.idToken)

  React.useEffect(() => {
    if (!open) {
      setBackupData(null)
      setFetchError(null)
      return
    }
    ;(async () => {
      setFetchError(null)
      try {
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        })
        if (!res.ok) throw new Error('Fetch failed')
        const json = await res.json()
        if (json.exists && json.data) {
          setBackupData(json.data)
        } else {
          setFetchError(language === 'id' ? 'Belum ada cadangan di cloud.' : 'No backup found in cloud.')
        }
      } catch {
        setFetchError(language === 'id' ? 'Gagal memuat data cadangan.' : 'Failed to load backup data.')
      }
    })()
  }, [open, idToken, language])

  const dataRows: DataRow[] = React.useMemo(() => {
    if (!backupData) return []
    return [
      { icon: FileText, labelKey: 'transactions', count: backupData.transactions?.length ?? 0 },
      { icon: BarChart3, labelKey: 'budgets', count: backupData.budgets?.length ?? 0 },
      { icon: Target, labelKey: 'goals', count: backupData.goals?.length ?? 0 },
      { icon: RefreshCw, labelKey: 'autoLogRules', count: backupData.autoLogRules?.length ?? 0 },
      { icon: Wallet, labelKey: 'trackedOutflows', count: backupData.trackedOutflows?.length ?? 0 },
      { icon: TrendingUp, labelKey: 'portfolioAssets', count: backupData.portfolioAssets?.length ?? 0 },
    ]
  }, [backupData])

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

  const tStr = (idStr: string, enStr: string) => language === 'id' ? idStr : enStr

  const handleConfirm = () => {
    if (!backupData) return
    onApplyData(backupData)
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
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    {tStr('Pulihkan dari Cloud', 'Restore from Cloud')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {tStr(
                      'Data lokal Anda akan ditimpa dengan cadangan cloud. Tindakan ini tidak dapat dibatalkan.',
                      'Your local data will be overwritten with cloud backup. This cannot be undone.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pb-4 max-h-[320px] overflow-y-auto">
              {fetchError ? (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[11px] font-bold text-rose-500">{fetchError}</span>
                </div>
              ) : !backupData ? (
                <div className="flex items-center justify-center py-6">
                  <svg className="animate-spin w-5 h-5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                    {tStr('RINCIAN DATA CLOUD', 'CLOUD DATA DETAILS')}
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

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                    <Clock className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/70">
                      {tStr('Dicadangkan', 'Backed up')}: {formatSyncTime(backupData.backedUpAt) ?? '-'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                      {tStr(
                        'Semua data lokal Anda saat ini akan diganti dengan data dari cloud. Pastikan Anda telah mencadangkan data lokal terlebih dahulu.',
                        'All current local data will be replaced with cloud data. Make sure you have backed up your local data first.'
                      )}
                    </p>
                  </div>

                  {(!backupData.trackedOutflows || backupData.trackedOutflows.length === 0) && (!backupData.transactions || backupData.transactions.length > 0) && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
                      <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-relaxed">
                        {tStr(
                          'Backup ini belum memiliki data Piutang/Kasbon. Jika ada transaksi piutang lama di riwayat, sistem akan otomatis memindahkannya saat restore.',
                          'This backup has no Receivables/Loans data. If old receivable transactions exist in history, they will be auto-migrated during restore.'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full bg-muted/40 hover:bg-muted/70 border border-border text-foreground py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-center select-none disabled:opacity-50"
              >
                {tStr('Batal', 'Cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !backupData || !!fetchError}
                className="w-full bg-amber-500 text-white hover:bg-amber-600 py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 select-none disabled:opacity-55"
              >
                {loading ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <CloudDownload className="w-3.5 h-3.5" />
                )}
                {loading
                  ? tStr('Memulihkan...', 'Restoring...')
                  : tStr('Pulihkan Sekarang', 'Restore Now')
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
