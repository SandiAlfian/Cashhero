"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { History, Filter, ChevronDown } from "lucide-react"
import type { InvestmentAsset, AssetHistoryLog } from "@/store/usePortfolioStore"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  formatRelativeDate: (date: string, lang: 'id' | 'en') => string
  language: 'id' | 'en'
  selectedHistoryAsset: InvestmentAsset | null
  filteredLogs: AssetHistoryLog[]
  historyFilter: 'all' | 'capital_change' | 'gain_loss' | 'liquidation'
  isHistoryFilterDropdownOpen: boolean
  onFilterChange: (filter: 'all' | 'capital_change' | 'gain_loss' | 'liquidation') => void
  onToggleDropdown: () => void
  onExportExcel: () => void
  onExportPDF: () => void
  onClose: () => void
}

export function AssetHistoryDialog({
  open, onOpenChange, formatCurrency, formatRelativeDate, language,
  selectedHistoryAsset, filteredLogs,
  historyFilter, isHistoryFilterDropdownOpen,
  onFilterChange, onToggleDropdown,
  onExportExcel, onExportPDF, onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-lg font-bold tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            {language === 'id' ? 'Riwayat Penyesuaian Aset' : 'Asset Adjustment History'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {language === 'id'
              ? "Daftar lengkap log aktivitas penyesuaian modal, realized gain/loss, dan likuidasi aset."
              : "A complete list of logs for capital allocation, realized gain/loss, and asset liquidation."}
          </DialogDescription>
        </DialogHeader>

        {selectedHistoryAsset && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs flex justify-between items-center font-bold">
              <span className="text-muted-foreground">{language === 'id' ? 'Nama Aset:' : 'Asset Name:'}</span>
              <span className="text-foreground text-sm font-extrabold">{selectedHistoryAsset.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/40 text-xs no-print">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold uppercase">{language === 'id' ? 'Filter:' : 'Filter:'}</span>

                <div className="relative">
                  <button
                    onClick={onToggleDropdown}
                    className="px-3.5 py-2 bg-muted/40 hover:bg-muted/70 text-foreground border border-border/80 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-95 min-w-[130px]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {
                          {
                            all: language === 'id' ? 'Semua' : 'All',
                            capital_change: language === 'id' ? 'Alokasi Modal' : 'Capital',
                            gain_loss: language === 'id' ? 'Untung/Rugi' : 'Profit & Loss',
                            liquidation: language === 'id' ? 'Likuidasi' : 'Liquidation'
                          }[historyFilter]
                        }
                      </span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isHistoryFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isHistoryFilterDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-[160px] bg-background/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                      >
                        {([
                          { value: 'all', label: language === 'id' ? 'Semua' : 'All' },
                          { value: 'capital_change', label: language === 'id' ? 'Alokasi Modal' : 'Capital' },
                          { value: 'gain_loss', label: language === 'id' ? 'Untung/Rugi' : 'Profit & Loss' },
                          { value: 'liquidation', label: language === 'id' ? 'Likuidasi' : 'Liquidation' }
                        ] as const).map((opt) => {
                          const isActive = historyFilter === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => onFilterChange(opt.value)}
                              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                              }`}
                            >
                              <span>{opt.label}</span>
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={onExportExcel}
                  className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-bold text-[10px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Excel
                </button>
                <button
                  onClick={onExportPDF}
                  className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredLogs.length > 0 ? (
                [...filteredLogs].reverse().map((log) => {
                  const badgeColor = {
                    capital_change: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                    profit: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
                    loss: "bg-destructive/10 text-destructive border border-destructive/20",
                    liquidation: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                  }[log.type]

                  const typeLabel = {
                    capital_change: language === 'id' ? 'Modal' : 'Capital',
                    profit: language === 'id' ? 'Untung' : 'Profit',
                    loss: language === 'id' ? 'Rugi' : 'Loss',
                    liquidation: language === 'id' ? 'Likuidasi' : 'Liquidation'
                  }[log.type]

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-border/80 bg-muted/10 flex flex-col gap-1.5 text-xs hover:border-border transition-all duration-200 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {formatRelativeDate(log.date, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-0.5">
                        <span className="text-muted-foreground font-medium">{log.note}</span>
                        <span className="font-bold text-foreground font-number text-sm">
                          {log.type === 'loss' ? '-' : log.type === 'profit' || log.type === 'liquidation' ? '+' : ''}
                          {formatCurrency(log.amount, language)}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
                  <History className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-semibold">
                    {language === 'id' ? 'Belum ada log penyesuaian.' : 'No adjustment logs yet.'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40 mt-2">
              <Button
                onClick={onClose}
                className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2"
              >
                {language === 'id' ? 'Selesai' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
