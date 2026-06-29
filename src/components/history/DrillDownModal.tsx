"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, FileSpreadsheet, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
  highlightedId?: string | null
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
  onEditTransaction,
  highlightedId
}: DrillDownModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [perPage, setPerPage] = React.useState<number | 'all'>(25)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    setSearchQuery('')
    setPerPage(25)
    setPage(1)
  }, [selectedGroupId])

  const searched = React.useMemo(() => {
    if (!activeGroup) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return activeGroup.transactions
    return activeGroup.transactions.filter(
      (tx) =>
        tx.category.toLowerCase().includes(q) ||
        tx.note.toLowerCase().includes(q)
    )
  }, [activeGroup, searchQuery])

  const totalPages = perPage === 'all' ? 1 : Math.max(1, Math.ceil(searched.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginated = perPage === 'all'
    ? searched
    : searched.slice((safePage - 1) * perPage, safePage * perPage)

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

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-border/10 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder={language === 'id' ? 'Cari dalam periode ini...' : 'Search within this period...'}
              className="pl-9 pr-9 h-9 text-sm bg-muted/20 border-border/30 focus-visible:ring-primary/30 rounded-lg w-full placeholder:text-muted-foreground/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Individual Group Transactions list table */}
        <div className="flex-1 overflow-y-auto px-6 pb-0 min-h-[120px]">
          <div className="rounded-xl border border-border/40 overflow-hidden bg-card/30 backdrop-blur-md">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/30">
                  <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('date')}</TableHead>
                  <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('category')}</TableHead>
                  <TableHead className="text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('note')}</TableHead>
                  <TableHead className="text-right text-muted-foreground/70 font-bold text-[11px] uppercase tracking-widest py-4 px-6">{t('amount')}</TableHead>
                  <TableHead className="w-[120px] py-4 px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length > 0 ? paginated.map((tx) => {
                  const noteDisplay = tx.note === 'Modal awal' ? t('initialNote') : tx.note
                  const categoryDisplay = tx.category === 'Saldo Awal' ? t('initialBalance') : tx.category
                  const isHighlighted = tx.id === highlightedId

                  return (
                    <TableRow key={tx.id} className={cn(
                        "transition-all duration-500 group relative",
                        isHighlighted
                          ? "bg-gradient-to-r from-blue-500/8 via-blue-500/5 to-transparent dark:from-blue-400/10 dark:via-blue-400/5"
                          : "border-border/20 hover:bg-muted/40"
                      )}>
                      <TableCell className={cn("font-bold text-foreground/90 py-4 px-6 text-sm relative", isHighlighted && "text-blue-600 dark:text-blue-300")}>
                        {isHighlighted && (
                          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 dark:bg-blue-400 rounded-r-sm shadow-[0_0_8px_rgba(59,130,246,0.4)] dark:shadow-[0_0_8px_rgba(96,165,250,0.3)]" />
                        )}
                        {mounted ? formatDate(tx.date, language) : ""}
                      </TableCell>
                      <TableCell className={cn("py-4 px-6 text-sm", isHighlighted ? "text-blue-600/80 dark:text-blue-300/80 font-semibold" : "text-muted-foreground")}>
                        {categoryDisplay}
                      </TableCell>
                      <TableCell className={cn("py-4 px-6 text-sm max-w-[180px] truncate", isHighlighted ? "text-blue-600/70 dark:text-blue-300/70" : "text-muted-foreground/80")}>
                        {noteDisplay}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-black text-sm py-4 px-6 tabular-nums",
                        tx.type === 'in' ? (isHighlighted ? "text-blue-500 dark:text-blue-300" : "text-emerald-500") : (isHighlighted ? "text-blue-500 dark:text-blue-300" : "text-foreground")
                      )}>
                        {tx.type === 'in' ? '+' : '-'}{mounted ? formatCurrency(tx.amount, language) : "Rp 0"}
                      </TableCell>
                      <TableCell className="py-4 text-center px-6">
                        <div className="flex items-center justify-center gap-0.5">
                          {onEditTransaction && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditTransaction(tx)}
                              className="text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer rounded-lg h-8 w-8"
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
                            className="text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer rounded-lg h-8 w-8"
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
                      {searchQuery
                        ? (language === 'id' ? 'Tidak ada hasil' : 'No results')
                        : t('noTransactions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {searched.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-border/15 bg-muted/5 shrink-0">
            <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70 font-medium">
              <span>{language === 'id' ? 'Tampil' : 'Show'}</span>
              <select
                value={perPage === 'all' ? 'all' : String(perPage)}
                onChange={(e) => {
                  setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 rounded-lg border border-border/40 bg-background/60 px-2.5 text-[13px] font-semibold text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">{language === 'id' ? 'Semua' : 'All'}</option>
              </select>
              <span className="text-muted-foreground/50">
                &middot; {searched.length} {language === 'id' ? 'transaksi' : 'transactions'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={safePage <= 1}
                onClick={() => setPage(Math.max(1, safePage - 1))}
                className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-25 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {perPage !== 'all' && (
                <div className="flex items-center gap-1.5 min-w-[72px] justify-center select-none">
                  <span className="text-[13px] font-bold text-foreground/80 tabular-nums">{safePage}</span>
                  <span className="text-muted-foreground/40 text-[13px]">/</span>
                  <span className="text-[13px] font-medium text-muted-foreground/60 tabular-nums">{totalPages}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                disabled={perPage !== 'all' && safePage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                className="h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 disabled:opacity-25 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
