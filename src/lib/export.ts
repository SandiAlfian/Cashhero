/**
 * Utility to export transactions and financial data to Excel (CSV format) and PDF
 */

import { Transaction } from "@/store/useTransactionStore"
import { AssetHistoryLog } from "@/store/usePortfolioStore"

interface Totals {
  income: number
  expense: number
  balance: number
}

/**
 * Exports transaction data as a beautifully-styled, professional Excel file.
 * Uses native Excel HTML format with XML directives to preserve colors, layouts, grids, and alignments.
 */
export function exportToExcel(
  transactions: Transaction[],
  filterName: string,
  totals: Totals,
  language: 'id' | 'en'
) {
  const isId = language === 'id'

  // Text translations
  const title = isId ? "LAPORAN KEUANGAN CASSHERO" : "CASSHERO FINANCIAL REPORT"
  const filterLabel = isId ? "Filter Periode" : "Period Filter"
  const dateLabel = isId ? "Tanggal Ekspor" : "Export Date"
  const incLabel = isId ? "Total Pemasukan" : "Total Income"
  const expLabel = isId ? "Total Pengeluaran" : "Total Expense"
  const balLabel = isId ? "Saldo Bersih" : "Net Balance"
  
  const headers = isId 
    ? ["Tanggal", "Kategori", "Catatan", "Tipe", "Nominal"]
    : ["Date", "Category", "Note", "Type", "Amount"]

  // Formatting helper
  const fmt = (num: number) => {
    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Row generation with premium zebra styling
  const rows = transactions.map((t, idx) => {
    const formattedDate = new Date(t.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    const typeLabel = t.type === 'in' 
      ? (isId ? "Pemasukan" : "Income")
      : (isId ? "Pengeluaran" : "Expense")
    
    const typeColor = t.type === 'in' ? '#15803D' : '#B91C1C'
    const typeBg = t.type === 'in' ? '#DCFCE7' : '#FEE2E2'
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

    return `
      <tr style="background-color: ${rowBg};">
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
          ${formattedDate}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; font-weight: bold; color: #1E293B; font-family: 'Segoe UI', Arial, sans-serif;">
          ${t.category}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; color: #475569; font-style: italic; font-family: 'Segoe UI', Arial, sans-serif;">
          ${t.note || "-"}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 9pt; font-weight: bold; text-align: center; color: ${typeColor}; background-color: ${typeBg}; font-family: 'Segoe UI', Arial, sans-serif;">
          ${typeLabel}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; font-weight: bold; text-align: right; color: ${t.type === 'in' ? '#16A34A' : '#DC2626'}; font-family: 'Segoe UI', Arial, sans-serif;">
          ${fmt(t.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netBg = totals.balance >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = totals.balance >= 0 ? '#BFDBFE' : '#FCA5A5'
  const netColor = totals.balance >= 0 ? '#1D4ED8' : '#B91C1C'

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Cashhero</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines />
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        @page {
          margin: 0.75in 0.75in 0.75in 0.75in;
          mso-header-margin: 0.3in;
          mso-footer-margin: 0.3in;
        }
      </style>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #FFFFFF;">
      <table style="border-collapse: collapse; width: 100%;">
        <!-- Columns widths configuration -->
        <colgroup>
          <col width="180" />
          <col width="160" />
          <col width="300" />
          <col width="130" />
          <col width="180" />
        </colgroup>

        <!-- TITLE / HEADER BANNER -->
        <tr>
          <td colspan="5" style="background-color: #810B38; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; padding: 16px; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #810B38;">
            ${title}
          </td>
        </tr>
        
        <!-- METADATA ROWS -->
        <tr>
          <td colspan="5" style="font-size: 10pt; color: #475569; padding: 10px 0 2px 0; font-family: 'Segoe UI', Arial, sans-serif;">
            <strong>${filterLabel}:</strong> ${filterName}
          </td>
        </tr>
        <tr>
          <td colspan="5" style="font-size: 10pt; color: #475569; padding: 2px 0 15px 0; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px double #CBD5E1;">
            <strong>${dateLabel}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </td>
        </tr>

        <!-- EMPTY ROW -->
        <tr><td colspan="5" style="height: 10px;"></td></tr>

        <!-- DASHBOARD SUMMARY METRICS BOXES -->
        <tr>
          <td colspan="2" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle;">
            <span style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; color: #16A34A; display: block;">${incLabel}</span>
            <span style="font-size: 14pt; font-weight: bold; color: #15803D; margin-top: 4px; display: block;">${fmt(totals.income)}</span>
          </td>
          <td style="background-color: #FEF2F2; border: 1px solid #FCA5A5; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle;">
            <span style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; color: #EF4444; display: block;">${expLabel}</span>
            <span style="font-size: 14pt; font-weight: bold; color: #B91C1C; margin-top: 4px; display: block;">${fmt(totals.expense)}</span>
          </td>
          <td colspan="2" style="background-color: ${netBg}; border: 1px solid ${netBorder}; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle;">
            <span style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; color: #475569; display: block;">${balLabel}</span>
            <span style="font-size: 14pt; font-weight: bold; color: ${netColor}; margin-top: 4px; display: block;">${fmt(totals.balance)}</span>
          </td>
        </tr>

        <!-- EMPTY ROW -->
        <tr><td colspan="5" style="height: 20px;"></td></tr>

        <!-- TABLE HEADER -->
        <tr style="background-color: #1E293B;">
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[0]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: left; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[1]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: left; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[2]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[3]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: right; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[4]}
          </th>
        </tr>

        <!-- DATA ROWS -->
        ${rows}

        <!-- SUMMARY FOOTER ROW -->
        <tr style="background-color: #F1F5F9;">
          <td colspan="4" style="border: 1px solid #CBD5E1; padding: 12px; font-size: 10pt; font-weight: bold; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; color: #334155;">
            ${isId ? "TOTAL TRANSAKSI" : "TOTAL TRANSACTIONS"}:
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 12px; font-size: 10pt; font-weight: bold; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; color: #334155;">
            ${transactions.length}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  // Create download link using standardized Microsoft Excel format XML-HTML
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  
  const sanitizedFilter = filterName.replace(/[^a-zA-Z0-9]/g, "_")
  const dateStr = new Date().toISOString().split('T')[0]
  
  link.setAttribute("href", url)
  link.setAttribute("download", `Cashhero_Report_${sanitizedFilter}_${dateStr}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generates and prints a premium, highly professional A4 financial PDF report.
 * Dynamically builds a print-optimized document with rich styling, custom headers, and dashboard metrics.
 */
export function exportToPDF(
  transactions: Transaction[],
  filterName: string,
  totals: Totals,
  language: 'id' | 'en'
) {
  const isId = language === 'id'
  
  const title = isId ? "LAPORAN KEUANGAN CASSHERO" : "CASSHERO FINANCIAL REPORT"
  const filterLabel = isId ? "Filter Periode" : "Period Filter"
  const dateLabel = isId ? "Tanggal Cetak" : "Print Date"
  const incLabel = isId ? "Total Pemasukan" : "Total Income"
  const expLabel = isId ? "Total Pengeluaran" : "Total Expense"
  const balLabel = isId ? "Saldo Bersih" : "Net Balance"
  
  const headers = isId 
    ? ["Tanggal", "Kategori", "Catatan", "Tipe", "Nominal"]
    : ["Date", "Category", "Note", "Type", "Amount"]

  const fmt = (num: number) => {
    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const rowsHtml = transactions.map((t, idx) => {
    const formattedDate = new Date(t.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    const typeLabel = t.type === 'in' 
      ? (isId ? "Pemasukan" : "Income")
      : (isId ? "Pengeluaran" : "Expense")
    
    const typeColor = t.type === 'in' ? '#16A34A' : '#DC2626'
    const typeBg = t.type === 'in' ? '#F0FDF4' : '#FEF2F2'
    const typeBorder = t.type === 'in' ? '#BBF7D0' : '#FCA5A5'
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

    return `
      <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; color: #475569; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${formattedDate}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; color: #1E293B; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${t.category}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #64748B; font-style: italic; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${t.note || "-"}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 9px; text-transform: uppercase; color: ${typeColor}; background: ${typeBg}; border: 1px solid ${typeBorder};">
            ${typeLabel}
          </span>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; text-align: right; color: ${t.type === 'in' ? '#16A34A' : '#DC2626'}; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${t.type === 'in' ? '+' : '-'}${fmt(t.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netColor = totals.balance >= 0 ? '#1D4ED8' : '#B91C1C'
  const netBg = totals.balance >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = totals.balance >= 0 ? '#BFDBFE' : '#FCA5A5'

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Cashhero - PDF Export</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          body {
            font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .header-banner {
            background-color: #810B38;
            padding: 24px;
            border-radius: 12px;
            color: #FFFFFF;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin: 0;
            text-transform: uppercase;
          }
          
          .brand-logo {
            font-size: 14px;
            font-weight: 700;
            opacity: 0.9;
          }

          .meta-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748B;
            padding-bottom: 12px;
            border-bottom: 2px solid #F1F5F9;
            margin-bottom: 20px;
          }

          .meta-info strong {
            color: #1E293B;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }

          .metric-card {
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
            background: #F8FAFC;
          }

          .metric-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748B;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 6px;
          }

          .metric-value {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: -0.3px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th {
            padding: 12px 10px;
            text-align: left;
            background: #1E293B;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 3px solid #CBD5E1;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            font-size: 10px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <!-- Header Banner -->
        <div class="header-banner">
          <div class="title">${title}</div>
          <div class="brand-logo">Cashhero</div>
        </div>

        <!-- Meta Info -->
        <div class="meta-info">
          <div><strong>${filterLabel}:</strong> ${filterName}</div>
          <div><strong>${dateLabel}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <!-- Summary KPI Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card" style="background: #F0FDF4; border-color: #BBF7D0;">
            <span class="metric-label" style="color: #16A34A;">${incLabel}</span>
            <div class="metric-value" style="color: #15803D;">${fmt(totals.income)}</div>
          </div>
          <div class="metric-card" style="background: #FEF2F2; border-color: #FCA5A5;">
            <span class="metric-label" style="color: #EF4444;">${expLabel}</span>
            <div class="metric-value" style="color: #B91C1C;">${fmt(totals.expense)}</div>
          </div>
          <div class="metric-card" style="background: ${netBg}; border-color: ${netBorder};">
            <span class="metric-label" style="color: #475569;">${balLabel}</span>
            <div class="metric-value" style="color: ${netColor};">${fmt(totals.balance)}</div>
          </div>
        </div>

        <!-- Data Table -->
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25%;">${headers[0]}</th>
              <th style="width: 20%;">${headers[1]}</th>
              <th style="width: 30%;">${headers[2]}</th>
              <th class="text-center" style="width: 12%;">${headers[3]}</th>
              <th class="text-right" style="width: 13%;">${headers[4]}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Printable Report Footer -->
        <div class="footer">
          <strong>${isId ? "TOTAL TRANSAKSI" : "TOTAL TRANSACTIONS"}:</strong> ${transactions.length} | Generated by Cashhero Financial Manager
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Exports asset history logs as a beautifully-styled, professional Excel file.
 * Uses native Excel HTML format with XML directives to preserve colors, layouts, grids, and alignments.
 */
export function exportAssetHistoryToExcel(
  assetName: string,
  logs: AssetHistoryLog[],
  language: 'id' | 'en'
) {
  const isId = language === 'id'

  // Text translations
  const title = isId ? `LAPORAN AUDIT RIWAYAT ASET: ${assetName.toUpperCase()}` : `ASSET HISTORY AUDIT REPORT: ${assetName.toUpperCase()}`
  const dateLabel = isId ? "Tanggal Ekspor" : "Export Date"
  const capLabel = isId ? "Total Alokasi Modal" : "Total Capital Allocation"
  const glLabel = isId ? "Total Untung/Rugi Bersih" : "Net Gain/Loss"
  const liqLabel = isId ? "Total Dana Dilikuidasi" : "Total Liquidated"
  const netLabel = isId ? "Nilai Bersih Aset Saat Ini" : "Current Net Value"

  const headers = isId 
    ? ["Tanggal", "Tipe Aktivitas", "Catatan Penyesuaian", "Nominal"]
    : ["Date", "Activity Type", "Adjustment Note", "Amount"]

  // Calculate totals
  const totalCapital = logs.filter(l => l.type === 'capital_change').reduce((sum, l) => sum + l.amount, 0)
  const netGainLoss = logs.filter(l => l.type === 'profit').reduce((sum, l) => sum + l.amount, 0) - 
                      logs.filter(l => l.type === 'loss').reduce((sum, l) => sum + l.amount, 0)
  const totalLiquidated = logs.filter(l => l.type === 'liquidation').reduce((sum, l) => sum + l.amount, 0)
  const currentNetValue = totalCapital + netGainLoss - totalLiquidated

  // Formatting helper
  const fmt = (num: number) => {
    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  // Row generation
  const rows = [...logs].reverse().map((log, idx) => {
    const formattedDate = new Date(log.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    const typeLabel = {
      capital_change: isId ? "Modal" : "Capital",
      profit: isId ? "Keuntungan" : "Profit",
      loss: isId ? "Kerugian" : "Loss",
      liquidation: isId ? "Likuidasi" : "Liquidation"
    }[log.type]

    const typeColor = {
      capital_change: '#1D4ED8',
      profit: '#15803D',
      loss: '#B91C1C',
      liquidation: '#B45309'
    }[log.type]

    const typeBg = {
      capital_change: '#EFF6FF',
      profit: '#DCFCE7',
      loss: '#FEE2E2',
      liquidation: '#FEF3C7'
    }[log.type]

    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

    return `
      <tr style="background-color: ${rowBg}; border: 1px solid #CBD5E1;">
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
          ${formattedDate}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 9pt; font-weight: bold; text-align: center; color: ${typeColor}; background-color: ${typeBg}; font-family: 'Segoe UI', Arial, sans-serif;">
          ${typeLabel}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; color: #475569; font-style: italic; font-family: 'Segoe UI', Arial, sans-serif;">
          ${log.note || "-"}
        </td>
        <td style="border: 1px solid #CBD5E1; padding: 10px; font-size: 10pt; font-weight: bold; text-align: right; color: ${log.type === 'loss' ? '#DC2626' : '#1E293B'}; font-family: 'Segoe UI', Arial, sans-serif;">
          ${log.type === 'loss' ? '-' : ''}${fmt(log.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netBg = currentNetValue >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = currentNetValue >= 0 ? '#BFDBFE' : '#FCA5A5'
  const netColor = currentNetValue >= 0 ? '#1D4ED8' : '#B91C1C'

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Riwayat Aset</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines />
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #FFFFFF;">
      <table style="border-collapse: collapse; width: 100%;">
        <colgroup>
          <col width="180" />
          <col width="140" />
          <col width="300" />
          <col width="180" />
        </colgroup>

        <!-- TITLE -->
        <tr>
          <td colspan="4" style="background-color: #810B38; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 16px; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #810B38;">
            ${title}
          </td>
        </tr>

        <!-- METADATA -->
        <tr>
          <td colspan="4" style="font-size: 10pt; color: #475569; padding: 10px 0 15px 0; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px double #CBD5E1;">
            <strong>${dateLabel}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </td>
        </tr>

        <!-- EMPTY ROW -->
        <tr><td colspan="4" style="height: 10px;"></td></tr>

        <!-- SUMMARY METRICS -->
        <tr>
          <td style="background-color: #EFF6FF; border: 1px solid #BFDBFE; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
            <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #1D4ED8; display: block;">${capLabel}</span>
            <span style="font-size: 11pt; font-weight: bold; color: #1E40AF; margin-top: 4px; display: block;">${fmt(totalCapital)}</span>
          </td>
          <td style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
            <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #16A34A; display: block;">${glLabel}</span>
            <span style="font-size: 11pt; font-weight: bold; color: #15803D; margin-top: 4px; display: block;">${netGainLoss >= 0 ? '+' : ''}${fmt(netGainLoss)}</span>
          </td>
          <td style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
            <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #D97706; display: block;">${liqLabel}</span>
            <span style="font-size: 11pt; font-weight: bold; color: #B45309; margin-top: 4px; display: block;">${fmt(totalLiquidated)}</span>
          </td>
          <td style="background-color: ${netBg}; border: 1px solid ${netBorder}; padding: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
            <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #475569; display: block;">${netLabel}</span>
            <span style="font-size: 11pt; font-weight: bold; color: ${netColor}; margin-top: 4px; display: block;">${fmt(currentNetValue)}</span>
          </td>
        </tr>

        <!-- EMPTY ROW -->
        <tr><td colspan="4" style="height: 20px;"></td></tr>

        <!-- TABLE HEADER -->
        <tr style="background-color: #1E293B;">
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[0]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: center; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[1]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: left; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[2]}
          </th>
          <th style="border: 1px solid #475569; color: #FFFFFF; font-size: 10pt; font-weight: bold; text-align: right; padding: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${headers[3]}
          </th>
        </tr>

        <!-- DATA ROWS -->
        ${rows}

        <!-- SUMMARY FOOTER -->
        <tr style="background-color: #F1F5F9;">
          <td colspan="3" style="border: 1px solid #CBD5E1; padding: 12px; font-size: 10pt; font-weight: bold; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; color: #334155;">
            ${isId ? "TOTAL LOG PENYESUAIAN" : "TOTAL ADJUSTMENT LOGS"}:
          </td>
          <td style="border: 1px solid #CBD5E1; padding: 12px; font-size: 10pt; font-weight: bold; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; color: #334155;">
            ${logs.length}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  
  const sanitizedAssetName = assetName.replace(/[^a-zA-Z0-9]/g, "_")
  const dateStr = new Date().toISOString().split('T')[0]
  
  link.setAttribute("href", url)
  link.setAttribute("download", `Riwayat_Aset_${sanitizedAssetName}_${dateStr}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generates and prints a premium, highly professional A4 portfolio history PDF report.
 */
export function exportAssetHistoryToPDF(
  assetName: string,
  logs: AssetHistoryLog[],
  language: 'id' | 'en'
) {
  const isId = language === 'id'

  // Text translations
  const title = isId ? `LAPORAN AUDIT RIWAYAT ASET: ${assetName.toUpperCase()}` : `ASSET HISTORY AUDIT REPORT: ${assetName.toUpperCase()}`
  const dateLabel = isId ? "Tanggal Cetak" : "Print Date"
  const capLabel = isId ? "Total Alokasi Modal" : "Total Capital Allocation"
  const glLabel = isId ? "Total Untung/Rugi Bersih" : "Net Gain/Loss"
  const liqLabel = isId ? "Total Dana Dilikuidasi" : "Total Liquidated"
  const netLabel = isId ? "Nilai Bersih Aset Saat Ini" : "Current Net Value"

  const headers = isId 
    ? ["Tanggal", "Tipe Aktivitas", "Catatan Penyesuaian", "Nominal"]
    : ["Date", "Activity Type", "Adjustment Note", "Amount"]

  // Calculate totals
  const totalCapital = logs.filter(l => l.type === 'capital_change').reduce((sum, l) => sum + l.amount, 0)
  const netGainLoss = logs.filter(l => l.type === 'profit').reduce((sum, l) => sum + l.amount, 0) - 
                      logs.filter(l => l.type === 'loss').reduce((sum, l) => sum + l.amount, 0)
  const totalLiquidated = logs.filter(l => l.type === 'liquidation').reduce((sum, l) => sum + l.amount, 0)
  const currentNetValue = totalCapital + netGainLoss - totalLiquidated

  // Formatting helper
  const fmt = (num: number) => {
    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const rowsHtml = [...logs].reverse().map((log, idx) => {
    const formattedDate = new Date(log.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const typeLabel = {
      capital_change: isId ? "Modal" : "Capital",
      profit: isId ? "Keuntungan" : "Profit",
      loss: isId ? "Kerugian" : "Loss",
      liquidation: isId ? "Likuidasi" : "Liquidation"
    }[log.type]

    const typeColor = {
      capital_change: '#1D4ED8',
      profit: '#16A34A',
      loss: '#DC2626',
      liquidation: '#D97706'
    }[log.type]

    const typeBg = {
      capital_change: '#EFF6FF',
      profit: '#F0FDF4',
      loss: '#FEF2F2',
      liquidation: '#FEF3C7'
    }[log.type]

    const typeBorder = {
      capital_change: '#BFDBFE',
      profit: '#BBF7D0',
      loss: '#FCA5A5',
      liquidation: '#FDE68A'
    }[log.type]

    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

    return `
      <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; color: #475569; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${formattedDate}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 9px; text-transform: uppercase; color: ${typeColor}; background: ${typeBg}; border: 1px solid ${typeBorder};">
            ${typeLabel}
          </span>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #64748B; font-style: italic; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${log.note || "-"}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; text-align: right; color: ${log.type === 'loss' ? '#DC2626' : '#1E293B'}; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          ${log.type === 'loss' ? '-' : ''}${fmt(log.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netColor = currentNetValue >= 0 ? '#1D4ED8' : '#B91C1C'
  const netBg = currentNetValue >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = currentNetValue >= 0 ? '#BFDBFE' : '#FCA5A5'

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Cashhero - PDF Export</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          body {
            font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .header-banner {
            background-color: #810B38;
            padding: 24px;
            border-radius: 12px;
            color: #FFFFFF;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin: 0;
            text-transform: uppercase;
          }
          
          .brand-logo {
            font-size: 14px;
            font-weight: 700;
            opacity: 0.9;
          }
          
          .meta-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748B;
            padding-bottom: 12px;
            border-bottom: 2px solid #F1F5F9;
            margin-bottom: 20px;
          }
          
          .meta-info strong {
            color: #1E293B;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 30px;
          }
          
          .metric-card {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
            background: #F8FAFC;
          }
          
          .metric-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748B;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 6px;
          }
          
          .metric-value {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: -0.3px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          th {
            padding: 12px 10px;
            text-align: left;
            background: #1E293B;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 3px solid #CBD5E1;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            font-size: 10px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div class="title">${title}</div>
          <div class="brand-logo">Cashhero</div>
        </div>
        
        <div class="meta-info">
          <div><strong>${isId ? "Kategori Laporan" : "Report Category"}:</strong> ${isId ? "Audit Portofolio Investasi" : "Investment Portfolio Audit"}</div>
          <div><strong>${dateLabel}:</strong> ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card" style="background: #EFF6FF; border-color: #BFDBFE;">
            <span class="metric-label" style="color: #1D4ED8;">${capLabel}</span>
            <div class="metric-value" style="color: #1E40AF;">${fmt(totalCapital)}</div>
          </div>
          <div class="metric-card" style="background: #F0FDF4; border-color: #BBF7D0;">
            <span class="metric-label" style="color: #16A34A;">${glLabel}</span>
            <div class="metric-value" style="color: #15803D;">${netGainLoss >= 0 ? '+' : ''}${fmt(netGainLoss)}</div>
          </div>
          <div class="metric-card" style="background: #FEF3C7; border-color: #FDE68A;">
            <span class="metric-label" style="color: #D97706;">${liqLabel}</span>
            <div class="metric-value" style="color: #B45309;">${fmt(totalLiquidated)}</div>
          </div>
          <div class="metric-card" style="background: ${netBg}; border-color: ${netBorder};">
            <span class="metric-label" style="color: #475569;">${netLabel}</span>
            <div class="metric-value" style="color: ${netColor};">${fmt(currentNetValue)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25%;">${headers[0]}</th>
              <th class="text-center" style="width: 20%;">${headers[1]}</th>
              <th style="width: 35%;">${headers[2]}</th>
              <th class="text-right" style="width: 20%;">${headers[3]}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          <strong>${isId ? "TOTAL LOG PENYESUAIAN" : "TOTAL ADJUSTMENT LOGS"}:</strong> ${logs.length} | Generated by Cashhero Financial Manager
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
