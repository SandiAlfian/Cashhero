"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { Language } from "@/store/useLanguageStore"
import type { GroupedRow } from "@/lib/history"

interface GroupedPeriodTableProps {
  groupedData: GroupedRow[]
  mounted: boolean
  language: Language
  formatCurrency: (amount: number, lang: Language) => string
  onSelectGroup: (id: string) => void
}

export function GroupedPeriodTable({ groupedData, mounted, language, formatCurrency, onSelectGroup }: GroupedPeriodTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="border-border/30 hover:bg-muted/40 select-none">
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 px-6">
            {language === 'id' ? 'Periode' : 'Period'}
          </TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-center px-6">
            {language === 'id' ? 'Jumlah Transaksi' : 'Transactions Count'}
          </TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
            {language === 'id' ? 'Pemasukan (+)' : 'Total Income'}
          </TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
            {language === 'id' ? 'Pengeluaran (-)' : 'Total Expense'}
          </TableHead>
          <TableHead className="text-muted-foreground font-extrabold text-xs uppercase tracking-wider py-3.5 text-right px-6">
            {language === 'id' ? 'Saldo Bersih' : 'Net Balance'}
          </TableHead>
          <TableHead className="w-[100px] no-print py-3.5 px-6"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedData.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onSelectGroup(row.id)}
            className="border-border/25 hover:bg-primary/5 transition-colors cursor-pointer group select-none"
          >
            <TableCell className="font-bold text-foreground py-3.5 px-6">
              {mounted ? (language === 'id' ? row.label : row.labelEn) : ""}
            </TableCell>
            <TableCell className="text-center font-semibold text-muted-foreground py-3.5 px-6">
              {row.txCount}
            </TableCell>
            <TableCell className="text-right text-emerald-500 font-extrabold py-3.5 px-6">
              {row.income > 0 ? `+${formatCurrency(row.income, language)}` : formatCurrency(0, language)}
            </TableCell>
            <TableCell className="text-right text-primary font-extrabold py-3.5 px-6">
              {row.expense > 0 ? `-${formatCurrency(row.expense, language)}` : formatCurrency(0, language)}
            </TableCell>
            <TableCell className={`text-right font-black py-3.5 px-6 ${row.net >= 0 ? "text-emerald-500" : "text-primary"}`}>
              {row.net < 0 ? "-" : ""}{formatCurrency(Math.abs(row.net), language)}
            </TableCell>
            <TableCell className="no-print py-3.5 text-center px-6">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-lg text-xs font-bold text-muted-foreground group-hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Detail</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
