"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/store/useTransactionStore"
import type { Language } from "@/store/useLanguageStore"

interface TransactionTableProps {
  transactions: Transaction[]
  mounted: boolean
  formatDate: (dateString: string, lang: Language) => string
  formatCurrency: (amount: number, lang: Language) => string
  language: Language
  t: (key: string) => string
  onDeleteTransaction: (id: string) => void
  onTriggerToast: (msg: string) => void
  onEditTransaction?: (tx: Transaction) => void
  highlightedId?: string | null
  compact?: boolean
}

export function TransactionTable({
  transactions,
  mounted,
  formatDate,
  formatCurrency,
  language,
  t,
  onDeleteTransaction,
  onTriggerToast,
  onEditTransaction,
  highlightedId,
  compact
}: TransactionTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="border-border/30 hover:bg-muted/40">
          <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('date')}</TableHead>
          <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('category')}</TableHead>
          <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('note')}</TableHead>
          <TableHead className="text-right text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('amount')}</TableHead>
          <TableHead className="w-[120px] no-print py-4 px-6" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length > 0 ? transactions.map((tx) => {
          const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
          const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category
          const isHighlighted = tx.id === highlightedId

          return (
            <TableRow
              key={tx.id}
              className={cn(
                "transition-all duration-500 group relative",
                isHighlighted
                  ? "bg-gradient-to-r from-blue-500/8 via-blue-500/5 to-transparent dark:from-blue-400/10 dark:via-blue-400/5"
                  : "border-border/25 hover:bg-muted/35"
              )}
            >
              <TableCell className={cn("font-bold text-foreground/90 py-4 px-6 text-sm relative", isHighlighted && "text-blue-600 dark:text-blue-300")}>
                {isHighlighted && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 dark:bg-blue-400 rounded-r-sm shadow-[0_0_8px_rgba(59,130,246,0.4)] dark:shadow-[0_0_8px_rgba(96,165,250,0.3)]" />
                )}
                {mounted ? formatDate(tx.date, language) : ""}
              </TableCell>
              <TableCell className={cn("py-4 px-6 text-sm", isHighlighted ? "text-blue-600/80 dark:text-blue-300/80 font-semibold" : "text-muted-foreground")}>
                {categoryDisplay}
              </TableCell>
              <TableCell className={cn("py-4 px-6 text-sm max-w-[200px] truncate", isHighlighted ? "text-blue-600/70 dark:text-blue-300/70" : "text-muted-foreground/80")}>
                {noteDisplay}
              </TableCell>
              <TableCell className={cn(
                "text-right font-black text-sm py-4 px-6 tabular-nums",
                tx.type === 'in' ? (isHighlighted ? "text-blue-500 dark:text-blue-300" : "text-emerald-500") : (isHighlighted ? "text-blue-500 dark:text-blue-300" : "text-foreground")
              )}>
                {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
              </TableCell>
              <TableCell className="no-print py-4 px-6">
                <div className="flex items-center justify-end gap-1">
                  {onEditTransaction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTransaction(tx)}
                      className="text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer rounded-lg h-9 w-9"
                    >
                      <Pencil className="h-[15px] w-[15px]" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onDeleteTransaction(tx.id)
                      onTriggerToast(t('toastTxDeleted'))
                    }}
                    className="text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer rounded-lg h-9 w-9"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        }) : (
          <TableRow>
            <TableCell colSpan={5} className="h-28 text-center text-muted-foreground/60 font-semibold text-sm px-6">
              {t('noTransactions')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
