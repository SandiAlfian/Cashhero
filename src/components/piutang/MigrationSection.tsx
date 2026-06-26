"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ChevronDown, ArrowRight, CheckCircle, Database } from "lucide-react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useTrackedOutflowsStore } from "@/store/useTrackedOutflowsStore"
import { useTransactionStore } from "@/store/useTransactionStore"
import { formatCurrency, getTranslation } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import type { Transaction } from "@/store/useTransactionStore"

export function MigrationSection() {
  const language = useLanguageStore((s) => s.language)
  const isId = language === 'id'
  const [open, setOpen] = React.useState(false)
  const [deleteOrig, setDeleteOrig] = React.useState(false)
  const transactions = useTransactionStore((s) => s.transactions)
  const deleteTx = useTransactionStore((s) => s.deleteTransaction)
  const addItem = useTrackedOutflowsStore((s) => s.addItem)

  const t = (key: string) => getTranslation(language, key)

  const piutangTx = React.useMemo(() => {
    return transactions.filter(
      (tx) => tx.type === 'out' && tx.category.toLowerCase().includes('piutang')
    )
  }, [transactions])

  const alreadyMigrated = React.useMemo(() => {
    const tracked = useTrackedOutflowsStore.getState().items
    const trackedDates = new Set(tracked.map((i) => i.date))
    const trackedPersons = new Set(tracked.map((i) => i.personName.toLowerCase()))
    return new Set(
      piutangTx
        .filter((tx) => trackedDates.has(tx.date.slice(0, 10)) && trackedPersons.has((tx.note || '').toLowerCase()))
        .map((tx) => tx.id)
    )
  }, [piutangTx])

  const handleMigrate = (tx: Transaction) => {
    addItem({
      jenis: 'piutang',
      personName: tx.note || tx.category,
      amount: tx.amount,
      date: tx.date.slice(0, 10),
      dueDate: '',
      note: `${tx.category}${tx.note && tx.note !== tx.category ? ` — ${tx.note}` : ''}`,
    })
    if (deleteOrig) {
      deleteTx(tx.id)
    }
  }

  if (piutangTx.length === 0) return null

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardContent className="p-4">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{t('migrationTitle')}</span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full">{piutangTx.length}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
            <p className="text-[10px] text-muted-foreground/60 mt-2 mb-3">{t('migrationDesc')}</p>
            <label className="flex items-center gap-2 px-2 py-2 mb-3 bg-muted/20 rounded-lg cursor-pointer">
              <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${deleteOrig ? 'bg-primary' : 'bg-muted/60'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${deleteOrig ? 'translate-x-4' : 'translate-x-0.5'}`} />
                <input type="checkbox" checked={deleteOrig} onChange={() => setDeleteOrig(!deleteOrig)} className="sr-only" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-foreground">
                  {isId ? 'Hapus transaksi pengeluaran asli' : 'Delete original expense transaction'}
                </span>
                <p className="text-[9px] text-muted-foreground/60">
                  {isId ? 'Saldo akan kembali bertambah karena piutang bukan pengeluaran riil' : 'Balance will be restored since receivable is not a real expense'}
                </p>
              </div>
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-none">
              {piutangTx.map((tx) => {
                const isDone = alreadyMigrated.has(tx.id)
                return (
                  <div key={tx.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg text-xs ${
                      isDone ? 'bg-green-500/5 opacity-50' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{tx.note || tx.category}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.category} · {new Date(tx.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="font-bold font-number text-foreground shrink-0">
                      {formatCurrency(tx.amount, language as 'id' | 'en')}
                    </span>
                    <button
                      onClick={() => handleMigrate(tx)}
                      disabled={isDone}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isDone
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 cursor-default'
                          : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'
                      }`}
                    >
                      {isDone ? <CheckCircle className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
