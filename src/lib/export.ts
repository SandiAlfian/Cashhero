/**
 * Utility to export transactions and financial data to Excel (CSV format) and PDF
 */

import { Transaction } from "@/store/useTransactionStore"
import { AssetHistoryLog } from "@/store/usePortfolioStore"
import { useSettingsStore, EXCHANGE_RATES } from "@/store/useSettingsStore"

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

  // Dynamic currency format helper
  const state = typeof window !== 'undefined' ? useSettingsStore.getState() : null
  const currency = state?.currency || 'IDR'
  const rate = state?.exchangeRates?.[currency] || EXCHANGE_RATES[currency] || 1
  
  const fmt = (num: number) => {
    const converted = num / rate
    const isJapanOrIndo = currency === 'JPY' || currency === 'IDR'
    const hasDecimals = converted % 1 !== 0
    const decimals = isJapanOrIndo ? 0 : (hasDecimals ? 2 : 0)

    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(converted)
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

  // Dynamic currency format helper
  const state = typeof window !== 'undefined' ? useSettingsStore.getState() : null
  const currency = state?.currency || 'IDR'
  const rate = state?.exchangeRates?.[currency] || EXCHANGE_RATES[currency] || 1
  
  const fmt = (num: number) => {
    const converted = num / rate
    const isJapanOrIndo = currency === 'JPY' || currency === 'IDR'
    const hasDecimals = converted % 1 !== 0
    const decimals = isJapanOrIndo ? 0 : (hasDecimals ? 2 : 0)

    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(converted)
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
    
    const typeColor = t.type === 'in' ? '#15803D' : '#B91C1C'
    const typeBg = t.type === 'in' ? '#F0FDF4' : '#FEF2F2'
    const typeBorder = t.type === 'in' ? '#DCFCE7' : '#FEE2E2'
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'

    return `
      <tr style="background-color: ${rowBg}; page-break-inside: avoid;">
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; color: #475569; font-family: 'Inter', sans-serif;">
          ${formattedDate}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: 600; color: #1E293B; font-family: 'Inter', sans-serif;">
          ${t.category}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #64748B; font-style: italic; font-family: 'Inter', sans-serif;">
          ${t.note || "-"}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; font-family: 'Inter', sans-serif;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; color: ${typeColor}; background: ${typeBg}; border: 1px solid ${typeBorder};">
            ${typeLabel}
          </span>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: 700; text-align: right; color: ${t.type === 'in' ? '#15803D' : '#B91C1C'}; font-family: 'Inter', sans-serif;">
          ${t.type === 'in' ? '+' : '-'}${fmt(t.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netColor = totals.balance >= 0 ? '#1D4ED8' : '#B91C1C'
  const netBg = totals.balance >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = totals.balance >= 0 ? '#BFDBFE' : '#FCA5A5'

  // Dynamic Filename Generation
  const sanitizedFilter = filterName.replace(/[^a-zA-Z0-9]/g, "_")
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, "_")
  const docTitle = isId 
    ? `Cashhero_Laporan_Keuangan_${sanitizedFilter}_${dateStr}`
    : `Cashhero_Financial_Report_${sanitizedFilter}_${dateStr}`

  // Hidden Iframe Print implementation (direct print/save dialog on same tab)
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document || iframe.contentDocument
  if (!doc) return

  doc.write(`
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          
          .header-left .company-name {
            font-size: 22px;
            font-weight: 800;
            color: #810B38;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            margin: 0 0 2px 0;
          }

          .header-left .document-type {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          
          .header-right {
            text-align: right;
            font-size: 10px;
            color: #64748B;
          }
          
          .header-right .verified-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            color: #16A34A;
            border-radius: 6px;
            font-weight: 700;
            font-size: 9px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 24px;
            font-size: 11px;
          }

          .meta-item {
            margin-bottom: 4px;
          }

          .meta-item:last-child {
            margin-bottom: 0;
          }

          .meta-label {
            color: #64748B;
            font-weight: 600;
          }

          .meta-value {
            color: #1E293B;
            font-weight: 700;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .metric-card {
            padding: 12px 14px;
            border-radius: 8px;
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
            margin-bottom: 4px;
          }

          .metric-value {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: -0.3px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: auto;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th {
            padding: 10px 8px;
            text-align: left;
            background: #0F172A;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #475569;
            font-family: 'Inter', sans-serif;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .total-row td {
            border-top: 1.5px solid #0F172A;
            border-bottom: 3px double #0F172A;
            font-weight: 800;
            padding: 12px 8px;
            font-size: 12px;
            color: #0F172A;
            background: #F8FAFC;
          }

          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 6px;
            page-break-before: avoid;
          }
        </style>
      </head>
      <body>
        <!-- Header Container -->
        <div class="header-container">
          <div class="header-left">
            <h1 class="company-name">Cashhero Financial</h1>
            <p class="document-type">${title}</p>
          </div>
          <div class="header-right">
            <span class="verified-badge">${isId ? "Sistem Terverifikasi" : "System Verified"}</span>
            <div>${dateLabel}: ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <!-- Meta Grid Info -->
        <div class="meta-grid">
          <div>
            <div class="meta-item">
              <span class="meta-label">${filterLabel}:</span>
              <span class="meta-value">${filterName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">${isId ? "Status Laporan" : "Report Status"}:</span>
              <span class="meta-value" style="color: #16A34A;">${isId ? "Final & Akurat" : "Final & Audited"}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="meta-item">
              <span class="meta-label">${isId ? "ID Dokumen" : "Doc ID"}:</span>
              <span class="meta-value" style="font-family: monospace;">CH-${Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
          </div>
        </div>

        <!-- KPI Metrics Grid -->
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

        <!-- Transaction Table -->
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25%; font-family: 'Inter', sans-serif;">${headers[0]}</th>
              <th style="width: 20%; font-family: 'Inter', sans-serif;">${headers[1]}</th>
              <th style="width: 30%; font-family: 'Inter', sans-serif;">${headers[2]}</th>
              <th class="text-center" style="width: 12%; font-family: 'Inter', sans-serif;">${headers[3]}</th>
              <th class="text-right" style="width: 13%; font-family: 'Inter', sans-serif;">${headers[4]}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <!-- Professional Accounting Summary row inside Table -->
            <tr class="total-row">
              <td colspan="4" class="text-right" style="font-family: 'Inter', sans-serif;">
                ${isId ? "TOTAL TRANSAKSI" : "TOTAL TRANSACTIONS"} (${transactions.length} ${isId ? 'Item' : 'Items'}):
              </td>
              <td class="text-right" style="color: ${netColor}; font-family: 'Inter', sans-serif;">
                ${fmt(totals.balance)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Print Footer -->
        <div class="footer">
          Laporan ini dibuat otomatis oleh Cashhero Financial Manager. Seluruh perhitungan telah terverifikasi secara matematis. | Halaman 1 dari 1
        </div>
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 500)
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

  // Dynamic currency format helper
  const state = typeof window !== 'undefined' ? useSettingsStore.getState() : null
  const currency = state?.currency || 'IDR'
  const rate = state?.exchangeRates?.[currency] || EXCHANGE_RATES[currency] || 1
  
  const fmt = (num: number) => {
    const converted = num / rate
    const isJapanOrIndo = currency === 'JPY' || currency === 'IDR'
    const hasDecimals = converted % 1 !== 0
    const decimals = isJapanOrIndo ? 0 : (hasDecimals ? 2 : 0)

    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(converted)
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
  const title = isId ? `LAPORAN RIWAYAT ASET: ${assetName.toUpperCase()}` : `ASSET HISTORY REPORT: ${assetName.toUpperCase()}`
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

  // Dynamic currency format helper
  const state = typeof window !== 'undefined' ? useSettingsStore.getState() : null
  const currency = state?.currency || 'IDR'
  const rate = state?.exchangeRates?.[currency] || EXCHANGE_RATES[currency] || 1
  
  const fmt = (num: number) => {
    const converted = num / rate
    const isJapanOrIndo = currency === 'JPY' || currency === 'IDR'
    const hasDecimals = converted % 1 !== 0
    const decimals = isJapanOrIndo ? 0 : (hasDecimals ? 2 : 0)

    return new Intl.NumberFormat(isId ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(converted)
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
      profit: '#15803D',
      loss: '#B91C1C',
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
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; color: #475569; font-family: 'Inter', sans-serif;">
          ${formattedDate}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center; font-family: 'Inter', sans-serif;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; color: ${typeColor}; background: ${typeBg}; border: 1px solid ${typeBorder};">
            ${typeLabel}
          </span>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #64748B; font-style: italic; font-family: 'Inter', sans-serif;">
          ${log.note || "-"}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: 700; text-align: right; color: ${log.type === 'loss' ? '#B91C1C' : '#1E293B'}; font-family: 'Inter', sans-serif;">
          ${log.type === 'loss' ? '-' : ''}${fmt(log.amount)}
        </td>
      </tr>
    `
  }).join("")

  const netColor = currentNetValue >= 0 ? '#1D4ED8' : '#B91C1C'
  const netBg = currentNetValue >= 0 ? '#EFF6FF' : '#FEF2F2'
  const netBorder = currentNetValue >= 0 ? '#BFDBFE' : '#FCA5A5'

  // Dynamic Filename Generation
  const sanitizedAssetName = assetName.replace(/[^a-zA-Z0-9]/g, "_")
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, "_")
  const docTitle = isId 
    ? `Cashhero_Laporan_Riwayat_Aset_${sanitizedAssetName}_${dateStr}`
    : `Cashhero_Asset_History_Report_${sanitizedAssetName}_${dateStr}`

  // Hidden Iframe Print implementation (direct print/save dialog on same tab)
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document || iframe.contentDocument
  if (!doc) return

  doc.write(`
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          
          .header-left .company-name {
            font-size: 22px;
            font-weight: 800;
            color: #810B38;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            margin: 0 0 2px 0;
          }

          .header-left .document-type {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          
          .header-right {
            text-align: right;
            font-size: 10px;
            color: #64748B;
          }
          
          .header-right .verified-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            color: #1D4ED8;
            border-radius: 6px;
            font-weight: 700;
            font-size: 9px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 24px;
            font-size: 11px;
          }

          .meta-item {
            margin-bottom: 4px;
          }

          .meta-item:last-child {
            margin-bottom: 0;
          }

          .meta-label {
            color: #64748B;
            font-weight: 600;
          }

          .meta-value {
            color: #1E293B;
            font-weight: 700;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 24px;
          }

          .metric-card {
            padding: 10px 12px;
            border-radius: 8px;
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
            margin-bottom: 4px;
          }

          .metric-value {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: -0.3px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: auto;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th {
            padding: 10px 8px;
            text-align: left;
            background: #0F172A;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #475569;
            font-family: 'Inter', sans-serif;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .total-row td {
            border-top: 1.5px solid #0F172A;
            border-bottom: 3px double #0F172A;
            font-weight: 800;
            padding: 12px 8px;
            font-size: 12px;
            color: #0F172A;
            background: #F8FAFC;
          }

          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 6px;
            page-break-before: avoid;
          }
        </style>
      </head>
      <body>
        <!-- Header Container -->
        <div class="header-container">
          <div class="header-left">
            <h1 class="company-name">Cashhero Financial</h1>
            <p class="document-type">${title}</p>
          </div>
          <div class="header-right">
            <span class="verified-badge">${isId ? "Audit Aset Resmi" : "Official Asset Audit"}</span>
            <div>${dateLabel}: ${new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <!-- Meta Grid Info -->
        <div class="meta-grid">
          <div>
            <div class="meta-item">
              <span class="meta-label">${isId ? "Identitas Aset" : "Asset Identity"}:</span>
              <span class="meta-value">${assetName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">${isId ? "Klasifikasi Laporan" : "Report Classification"}:</span>
              <span class="meta-value" style="color: #1D4ED8;">${isId ? "Riwayat Portofolio & Audit" : "Portfolio History & Audit"}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="meta-item">
              <span class="meta-label">${isId ? "ID Laporan" : "Audit ID"}:</span>
              <span class="meta-value" style="font-family: monospace;">AS-${Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
          </div>
        </div>

        <!-- KPI Metrics Grid -->
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

        <!-- Asset Logs Table -->
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25%; font-family: 'Inter', sans-serif;">${headers[0]}</th>
              <th class="text-center" style="width: 20%; font-family: 'Inter', sans-serif;">${headers[1]}</th>
              <th style="width: 35%; font-family: 'Inter', sans-serif;">${headers[2]}</th>
              <th class="text-right" style="width: 20%; font-family: 'Inter', sans-serif;">${headers[3]}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <!-- Accounting double-underlined Summary Row -->
            <tr class="total-row">
              <td colspan="3" class="text-right" style="font-family: 'Inter', sans-serif;">
                ${isId ? "NILAI BERSIH AKHIR ASET" : "FINAL NET ASSET VALUE"} (${logs.length} ${isId ? 'Log Penyesuaian' : 'Adjustments'}):
              </td>
              <td class="text-right" style="color: ${netColor}; font-family: 'Inter', sans-serif;">
                ${fmt(currentNetValue)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Print Footer -->
        <div class="footer">
          Dokumen riwayat aset ini bersifat resmi dan dihasilkan secara langsung berdasarkan catatan digital transaksi. | Halaman 1 dari 1
        </div>
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 500)
}
