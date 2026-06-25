"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
  compact
}: TransactionTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="border-border/30 hover:bg-muted/40">
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('date')}</TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('category')}</TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('note')}</TableHead>
          <TableHead className="text-right text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('amount')}</TableHead>
          <TableHead className="w-[80px] no-print py-3.5 px-6"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length > 0 ? transactions.map((tx) => {
          const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
          const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category

          return (
            <TableRow key={tx.id} className="border-border/25 hover:bg-muted/45 transition-colors group">
              <TableCell className="font-bold text-foreground py-3.5 px-6">
                {mounted ? formatDate(tx.date, language) : ""}
              </TableCell>
              <TableCell className="text-muted-foreground py-3.5 px-6">{categoryDisplay}</TableCell>
              <TableCell className="text-muted-foreground py-3.5 px-6">{noteDisplay}</TableCell>
              <TableCell className={`text-right font-black text-sm py-3.5 px-6 ${tx.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
                {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
              </TableCell>
              <TableCell className="no-print py-3.5 px-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDeleteTransaction(tx.id)
                    onTriggerToast(t('toastTxDeleted'))
                  }}
                  className={`text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer ${
                    compact
                      ? "h-7 w-7 opacity-0 group-hover:opacity-100 rounded-md"
                      : "h-8 w-8 opacity-0 group-hover:opacity-100 rounded-lg"
                  }`}
                >
                  <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </Button>
              </TableCell>
            </TableRow>
          )
        }) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-semibold px-6">
              {t('noTransactions')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
