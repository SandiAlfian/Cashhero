"use client"

import { FileSpreadsheet, FileText } from "lucide-react"
import { exportToExcel, exportToPDF } from "@/lib/export"
import type { Transaction } from "@/store/useTransactionStore"
import type { Language } from "@/store/useLanguageStore"

interface ExportButtonsProps {
  transactions: Transaction[]
  periodLabel: string
  totals: { income: number; expense: number; balance: number }
  language: Language
}

export function ExportButtons({ transactions, periodLabel, totals, language }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 self-start sm:self-center no-print">
      <button
        onClick={() => exportToExcel(transactions, periodLabel, totals, language)}
        className="px-4 py-2.5 bg-muted/40 hover:bg-muted/70 text-foreground border border-border font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
      >
        <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span>{language === 'id' ? 'Ekspor Excel' : 'Export Excel'}</span>
      </button>
      <button
        onClick={() => exportToPDF(transactions, periodLabel, totals, language)}
        className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer duration-200"
      >
        <FileText className="w-4 h-4" />
        <span>{language === 'id' ? 'Ekspor PDF' : 'Export PDF'}</span>
      </button>
    </div>
  )
}
