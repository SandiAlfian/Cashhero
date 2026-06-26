"use client"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, FileSpreadsheet, Pencil, Trash2 } from "lucide-react"
import { exportToExcel, exportToPDF } from "@/lib/export"
import type { Language } from "@/store/useLanguageStore"
import type { GroupedRow } from "@/lib/history"
import type { Transaction } from "@/store/useTransactionStore"

interface DrillDownModalProps {
  activeGroup: GroupedRow | null
  selectedGroupId: string | null
  setSelectedGroupId: (id: string | null) => void
  mounted: boolean
  formatDate: (dateString: string, lang: Language) => string
  formatCurrency: (amount: number, lang: Language) => string
  language: Language
  t: (key: string) => string
  onDeleteTransaction: (id: string) => void
  onTriggerToast: (msg: string) => void
  onEditTransaction?: (tx: Transaction) => void
}

export function DrillDownModal({
  activeGroup,
  selectedGroupId,
  setSelectedGroupId,
  mounted,
  formatDate,
  formatCurrency,
  language,
  t,
  onDeleteTransaction,
  onTriggerToast,
  onEditTransaction
}: DrillDownModalProps) {
  if (!activeGroup) return null

  return (
    <Dialog open={selectedGroupId !== null} onOpenChange={(open) => { if (!open) setSelectedGroupId(null) }}>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-full bg-card border border-border/50 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">

        {/* Custom header */}
        <div className="p-6 border-b border-border/30 bg-muted/20 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 select-none">
          <div>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText className="w-5 h-5" />
              </span>
              {language === 'id' ? activeGroup.label : activeGroup.labelEn}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              {language === 'id'
                ? `Rincian detail transaksi keuangan dari ${activeGroup.startDate.toLocaleDateString('id-ID')} sampai ${activeGroup.endDate.toLocaleDateString('id-ID')}`
                : `Detailed transaction records from ${activeGroup.startDate.toLocaleDateString('en-US')} to ${activeGroup.endDate.toLocaleDateString('en-US')}`
              }
            </DialogDescription>
          </div>

          {/* Isolated sub-period export buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                exportToExcel(
                  activeGroup.transactions,
                  language === 'id' ? activeGroup.label : activeGroup.labelEn,
                  { income: activeGroup.income, expense: activeGroup.expense, balance: activeGroup.net },
                  language
                )
              }}
              className="px-3.5 py-2 bg-muted/40 hover:bg-muted/80 text-foreground border border-border/50 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer duration-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => {
                exportToPDF(
                  activeGroup.transactions,
                  language === 'id' ? activeGroup.label : activeGroup.labelEn,
                  { income: activeGroup.income, expense: activeGroup.expense, balance: activeGroup.net },
                  language
                )
              }}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer duration-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-period Quick metrics summary */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/10 border-b border-border/20 shrink-0 select-none">
          <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{t('income')}</span>
            <span className="text-base font-extrabold text-emerald-500 tracking-tight mt-0.5">
              {formatCurrency(activeGroup.income, language)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{t('expense')}</span>
            <span className="text-base font-extrabold text-primary tracking-tight mt-0.5">
              {formatCurrency(activeGroup.expense, language)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-card/50 border border-border/30 flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{language === 'id' ? 'Arus Kas Bersih' : 'Net Cash Flow'}</span>
            <span className={`text-base font-extrabold tracking-tight mt-0.5 ${activeGroup.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
              {activeGroup.net < 0 ? "-" : ""}{formatCurrency(Math.abs(activeGroup.net), language)}
            </span>
          </div>
        </div>

        {/* Individual Group Transactions list table */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[180px]">
          <div className="rounded-xl border border-border/40 overflow-hidden bg-card/30 backdrop-blur-md">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/30">
                  <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('date')}</TableHead>
                  <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('category')}</TableHead>
                  <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('note')}</TableHead>
                  <TableHead className="text-right text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">{t('amount')}</TableHead>
                  <TableHead className="w-[120px] py-3.5 px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeGroup.transactions.length > 0 ? activeGroup.transactions.map((tx) => {
                  const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
                  const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category

                  return (
                    <TableRow key={tx.id} className="border-border/20 hover:bg-muted/40 transition-colors group">
                      <TableCell className="font-bold text-foreground py-3.5 px-6">
                        {mounted ? formatDate(tx.date, language) : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-3.5 px-6">{categoryDisplay}</TableCell>
                      <TableCell className="text-muted-foreground py-3.5 px-6">{noteDisplay}</TableCell>
                      <TableCell className={`text-right font-black text-sm py-3.5 px-6 ${tx.type === 'in' ? 'text-emerald-500' : 'text-foreground'}`}>
                        {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
                      </TableCell>
                      <TableCell className="py-3.5 text-center px-6">
                        <div className="flex items-center justify-center gap-0.5">
                          {onEditTransaction && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditTransaction(tx)}
                              className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-md"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              onDeleteTransaction(tx.id)
                              onTriggerToast(t('toastTxDeleted'))
                            }}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
