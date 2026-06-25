"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Coins, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import type { Transaction } from "@/store/useTransactionStore"

import type { Language } from "@/store/useLanguageStore"

interface SelectedDateTransactionsProps {
  selectedDateTransactions: Transaction[]
  selectedDate: Date
  formatCurrency: (amount: number, lang: Language) => string
  language: Language
  t: (key: string) => string
  onDeleteTransaction: (id: string) => void
  onTriggerToast: (msg: string) => void
}

export function SelectedDateTransactions({
  selectedDateTransactions,
  selectedDate,
  formatCurrency,
  language,
  t,
  onDeleteTransaction,
  onTriggerToast
}: SelectedDateTransactionsProps) {
  return (
    <Card className="bg-card/25 backdrop-blur-lg border-border/40 overflow-hidden shadow-xl">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <CalendarIcon className="w-4 h-4 text-primary" />
          {formatDate(selectedDate.toISOString(), language).split(" pukul")[0]}
        </CardTitle>
        <CardDescription className="text-xs">
          {language === 'id' ? 'Daftar transaksi tercatat di tanggal terpilih.' : 'List of transactions on the selected date.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">

        <AnimatePresence mode="popLayout">
          {selectedDateTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="p-3 bg-muted/10 border border-border/30 text-muted-foreground rounded-2xl mb-3">
                <Coins className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground max-w-[200px]">
                {t('noTransactionsDate')}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 pr-1">
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-3">
                {selectedDateTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30 hover:border-border/60 transition-all duration-200 group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 max-w-[70%]">
                      <span className="text-xs font-bold text-foreground truncate">
                        {tx.category === 'Tabungan' ? `💰 ${tx.category}` : tx.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate italic">
                        {tx.note}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`text-xs font-extrabold ${tx.type === 'in' ? "text-emerald-500" : "text-primary"}`}>
                        {tx.type === 'in' ? "+" : "-"}{formatCurrency(tx.amount, language)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onDeleteTransaction(tx.id)
                          onTriggerToast(t('toastTxDeleted'))
                        }}
                        className="w-7 h-7 hover:bg-primary/10 hover:text-primary text-muted-foreground/60 transition-colors rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {selectedDateTransactions.length > 0 && (
                <div className="border-t border-border/30 pt-3 mt-1">
                  {(() => {
                    const totalIn = selectedDateTransactions
                      .filter((tx) => tx.type === 'in')
                      .reduce((sum, tx) => sum + tx.amount, 0)
                    const totalOut = selectedDateTransactions
                      .filter((tx) => tx.type === 'out')
                      .reduce((sum, tx) => sum + tx.amount, 0)
                    const net = totalIn - totalOut
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('income')}</span>
                          <span className="text-[11px] font-bold text-emerald-500">{formatCurrency(totalIn, language)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('expense')}</span>
                          <span className="text-[11px] font-bold text-primary">{formatCurrency(totalOut, language)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border/20">
                          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{language === 'id' ? 'Saldo Bersih' : 'Net Balance'}</span>
                          <span className={`text-[11px] font-black ${net >= 0 ? "text-emerald-500" : "text-primary"}`}>
                            {net >= 0 ? "+" : ""}{formatCurrency(net, language)}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
