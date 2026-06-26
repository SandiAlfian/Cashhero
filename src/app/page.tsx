"use client"

import * as React from "react"
import { motion, Variants } from "framer-motion"
import { useTransactionStore } from "@/store/useTransactionStore"
import { useLanguageStore, translations } from "@/store/useLanguageStore"
import { LayoutDashboard } from "lucide-react"
import { usePortfolioStore, type AssetType, type InvestmentAsset, type AssetHistoryLog } from "@/store/usePortfolioStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { formatCurrency, formatRelativeDate, formatInputVal, parseNum } from "@/lib/format"
import { useDashboardData, useAssetNeedsUpdate } from "@/hooks/useDashboardData"
import { DashboardCashFlowChart } from "@/components/dashboard/DashboardCashFlowChart"
import { type DashboardPeriodFilter } from "@/lib/dashboard"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { NetWorthSection } from "@/components/dashboard/NetWorthSection"
import { WeeklyReminderBanner } from "@/components/dashboard/WeeklyReminderBanner"
import { RecentTransactionsCard } from "@/components/dashboard/RecentTransactionsCard"
import { PortfolioDialog } from "@/components/dashboard/PortfolioDialog"
import { PartialLiquidationDialog } from "@/components/dashboard/PartialLiquidationDialog"
import { AssetHistoryDialog } from "@/components/dashboard/AssetHistoryDialog"
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog"
import { exportAssetHistoryToExcel, exportAssetHistoryToPDF } from "@/lib/export"

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } }
}

export default function Home() {
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const deleteAssetTransactions = useTransactionStore((state) => state.deleteAssetTransactions)
  const { language } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  const defaultHistoryFilter = useSettingsStore((state) => state.defaultHistoryFilter)
  const [filter, setFilter] = React.useState<DashboardPeriodFilter>(defaultHistoryFilter)

  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0])

  React.useEffect(() => {
    setMounted(true)
    setFilter(defaultHistoryFilter)
    if (defaultHistoryFilter === 'customPeriod') {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }, [defaultHistoryFilter])

  const {
    filteredTransactions,
    assets,
    activeCurrency,
    periodSubLabel,
    totalIn,
    totalOut,
    balance,
    totalInvestment,
    totalSavings,
    totalReceivables,
    netWorth,
    recentTransactions,
  } = useDashboardData(filter, startDate, endDate)

  const { showBanner, oldestUpdateDate, checkAssetNeedsUpdate } = useAssetNeedsUpdate()

  const {
    addAsset,
    updateAsset,
    deleteAsset,
    addAssetHistoryLog
  } = usePortfolioStore()

  // Modal State
  const [portfolioOpen, setPortfolioOpen] = React.useState(false)

  // Form State
  const [editingAsset, setEditingAsset] = React.useState<InvestmentAsset | null>(null)
  const [isAdding, setIsAdding] = React.useState(false)

  const [assetNameInput, setAssetNameInput] = React.useState("")
  const [assetTypeInput, setAssetTypeInput] = React.useState<AssetType>('stocks')
  const [assetInitialInput, setAssetInitialInput] = React.useState("")
  const [assetGainLossInput, setAssetGainLossInput] = React.useState("")
  const [assetGainLossType, setAssetGainLossType] = React.useState<'profit' | 'loss'>('profit')

  // New Integration States
  const [deductCash, setDeductCash] = React.useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [assetToDelete, setAssetToDelete] = React.useState<InvestmentAsset | null>(null)
  
  // Partial Liquidation States
  const [partialLiqOpen, setPartialLiqOpen] = React.useState(false)
  const [liqAsset, setLiqAsset] = React.useState<InvestmentAsset | null>(null)
  const [partialLiqAmountInput, setPartialLiqAmountInput] = React.useState("")

  // Asset History States
  const [assetHistoryOpen, setAssetHistoryOpen] = React.useState(false)
  const [selectedHistoryAsset, setSelectedHistoryAsset] = React.useState<InvestmentAsset | null>(null)
  const [historyFilter, setHistoryFilter] = React.useState<'all' | 'capital_change' | 'gain_loss' | 'liquidation'>('all')
  const [isHistoryFilterDropdownOpen, setIsHistoryFilterDropdownOpen] = React.useState(false)

  const filteredLogs = React.useMemo(() => {
    if (!selectedHistoryAsset || !selectedHistoryAsset.history) return []
    return selectedHistoryAsset.history.filter((log) => {
      if (historyFilter === 'all') return true
      if (historyFilter === 'capital_change') return log.type === 'capital_change'
      if (historyFilter === 'gain_loss') return log.type === 'profit' || log.type === 'loss'
      if (historyFilter === 'liquidation') return log.type === 'liquidation'
      return true
    })
  }, [selectedHistoryAsset, historyFilter])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = (key: string) => {
    const k = key as keyof typeof translations['id']
    if (!mounted) return translations['id'][k]
    return translations[language]?.[k] || translations['id'][k]
  }

  // Reset form
  const resetForm = () => {
    setAssetNameInput("")
    setAssetTypeInput('stocks')
    setAssetInitialInput("")
    setAssetGainLossInput("")
    setAssetGainLossType('profit')
    setDeductCash(true)
    setEditingAsset(null)
    setIsAdding(false)
    setHistoryFilter('all')
    setIsHistoryFilterDropdownOpen(false)
  }

  // Open & populate form state
  const handleOpenPortfolio = () => {
    resetForm()
    setPortfolioOpen(true)
  }

  const handleStartEdit = (asset: InvestmentAsset) => {
    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1
    const displayInitial = Math.round(asset.initialCapital / rate)
    const displayGainLoss = Math.round(Math.abs(asset.realizedGainLoss) / rate)

    setEditingAsset(asset)
    setAssetNameInput(asset.name)
    setAssetTypeInput(asset.type)
    setAssetInitialInput(new Intl.NumberFormat("id-ID").format(displayInitial))
    setAssetGainLossInput(new Intl.NumberFormat("id-ID").format(displayGainLoss))
    setAssetGainLossType(asset.realizedGainLoss >= 0 ? 'profit' : 'loss')
    setIsAdding(false)
  }

  const handleStartAdd = () => {
    resetForm()
    setIsAdding(true)
  }

  const handleSaveAsset = () => {
    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1

    const initialVal = parseNum(assetInitialInput) * rate
    const glVal = parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1) * rate
    const trimmedName = assetNameInput.trim()
    
    if (!trimmedName) return

    if (editingAsset) {
      if (initialVal !== editingAsset.initialCapital) {
        const diffCap = initialVal - editingAsset.initialCapital
        addAssetHistoryLog(
          editingAsset.id,
          Math.abs(diffCap),
          'capital_change',
          language === 'id'
            ? `Penyesuaian Modal: ${diffCap >= 0 ? '+' : ''}${formatCurrency(diffCap, language)}`
            : `Capital Adjustment: ${diffCap >= 0 ? '+' : ''}${formatCurrency(diffCap, language)}`
        )
      }

      if (glVal !== editingAsset.realizedGainLoss) {
        const diffGL = glVal - editingAsset.realizedGainLoss
        addAssetHistoryLog(
          editingAsset.id,
          Math.abs(diffGL),
          diffGL >= 0 ? 'profit' : 'loss',
          language === 'id'
            ? `Penyesuaian Keuntungan/Kerugian: ${diffGL >= 0 ? '+' : ''}${formatCurrency(diffGL, language)}`
            : `Gain/Loss Adjustment: ${diffGL >= 0 ? '+' : ''}${formatCurrency(diffGL, language)}`
        )
      }

      updateAsset(editingAsset.id, {
        name: trimmedName,
        type: assetTypeInput,
        initialCapital: initialVal,
        realizedGainLoss: glVal
      })
    } else if (isAdding) {
      const initialLogs: Omit<AssetHistoryLog, 'id' | 'date'>[] = []
      if (initialVal > 0) {
        initialLogs.push({
          amount: initialVal,
          type: 'capital_change',
          note: language === 'id' ? 'Alokasi Modal Awal' : 'Initial Capital Allocation'
        })
      }
      if (glVal !== 0) {
        initialLogs.push({
          amount: Math.abs(glVal),
          type: glVal >= 0 ? 'profit' : 'loss',
          note: language === 'id' ? 'Penyesuaian Nilai Awal' : 'Initial Value Adjustment'
        })
      }

      const newAssetId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)
      addAsset(
        trimmedName,
        assetTypeInput,
        initialVal,
        glVal,
        initialLogs,
        newAssetId
      )

      if (deductCash && initialVal > 0) {
        const note = t('initialAssetNote').replace('[Nama Aset]', trimmedName)
        addTransaction({
          amount: initialVal,
          type: 'out',
          category: 'Investasi',
          note: note,
          assetId: newAssetId
        })
      }
    }
    resetForm()
  }

  const handleDeleteAsset = (asset: InvestmentAsset) => {
    setAssetToDelete(asset)
    setDeleteConfirmOpen(true)
  }

  const handleExecuteDelete = (liquidate: boolean) => {
    if (!assetToDelete) return

    if (liquidate) {
      const netVal = assetToDelete.initialCapital + assetToDelete.realizedGainLoss
      if (netVal > 0) {
        const note = t('liquidateAssetNote').replace('[Nama Aset]', assetToDelete.name)
        addTransaction({
          amount: netVal,
          type: 'in',
          category: 'Investasi',
          note: note,
          assetId: assetToDelete.id
        })
      }
    } else {
      deleteAssetTransactions(assetToDelete.id, assetToDelete.name)
    }

    deleteAsset(assetToDelete.id)
    setDeleteConfirmOpen(false)
    setAssetToDelete(null)

    if (editingAsset?.id === assetToDelete.id) {
      resetForm()
    }
  }

  const handleStartPartialLiquidation = (asset: InvestmentAsset) => {
    setLiqAsset(asset)
    setPartialLiqAmountInput("")
    setPartialLiqOpen(true)
  }

  const handleExecutePartialLiquidation = () => {
    if (!liqAsset) return

    const state = useSettingsStore.getState()
    const rate = state.exchangeRates[state.currency] || 1
    const liqAmt = parseNum(partialLiqAmountInput) * rate
    if (liqAmt <= 0) return

    const netVal = liqAsset.initialCapital + liqAsset.realizedGainLoss
    if (liqAmt > netVal) return

    let newInitial = liqAsset.initialCapital
    let newGL = liqAsset.realizedGainLoss

    if (liqAmt <= liqAsset.initialCapital) {
      newInitial = liqAsset.initialCapital - liqAmt
    } else {
      newInitial = 0
      const remainder = liqAmt - liqAsset.initialCapital
      newGL = liqAsset.realizedGainLoss - remainder
    }

    updateAsset(liqAsset.id, {
      initialCapital: newInitial,
      realizedGainLoss: newGL
    })

    addAssetHistoryLog(
      liqAsset.id,
      liqAmt,
      'liquidation',
      language === 'id' 
        ? `Likuidasi Sebagian Aset` 
        : `Partial Asset Liquidation`
    )

    const noteTemplate = language === 'id' ? 'Likuidasi Sebagian: [Nama Aset]' : 'Partial Liquidation: [Nama Aset]'
    const note = noteTemplate.replace('[Nama Aset]', liqAsset.name)

    addTransaction({
      amount: liqAmt,
      type: 'in',
      category: 'Investasi',
      note: note,
      assetId: liqAsset.id
    })

    setPartialLiqOpen(false)
    setLiqAsset(null)
    setPartialLiqAmountInput("")
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setAssetToDelete(null)
  }

  const handlePartialLiqClose = () => {
    setPartialLiqOpen(false)
    setLiqAsset(null)
    setPartialLiqAmountInput("")
  }

  const handleHistoryClose = () => {
    setAssetHistoryOpen(false)
    setSelectedHistoryAsset(null)
  }

  return (
    <motion.div 
      className="flex flex-col gap-8 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Title */}
      <motion.div variants={itemVariant} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('dashboard')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('dashboardSubtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Row: Cash Flow metrics */}
      <motion.div variants={itemVariant}>
        <SummaryCards
          t={t}
          mounted={mounted}
          formatCurrency={formatCurrency}
          language={language}
          balance={balance}
          totalIn={totalIn}
          totalOut={totalOut}
          periodSubLabel={periodSubLabel}
        />
      </motion.div>

      {/* Portfolio & Asset Section */}
      <motion.div variants={itemVariant} className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('portfolioAsset')}</h2>
        </div>

        <NetWorthSection
          t={t}
          mounted={mounted}
          formatCurrency={formatCurrency}
          language={language}
          balance={balance}
          totalInvestment={totalInvestment}
          totalSavings={totalSavings}
          totalReceivables={totalReceivables}
          netWorth={netWorth}
          assets={assets}
          onOpenPortfolio={handleOpenPortfolio}
        />

        {/* Weekly Reminder Alert Banner */}
        {showBanner && (
          <WeeklyReminderBanner
            t={t}
            mounted={mounted}
            formatRelativeDate={formatRelativeDate}
            language={language}
            oldestUpdateDate={oldestUpdateDate}
            onOpenPortfolio={handleOpenPortfolio}
          />
        )}
      </motion.div>

      {/* Bottom Row: Cash Flow Chart & Recent Transactions */}
      <motion.div variants={itemVariant} className="grid gap-6 md:grid-cols-7">
        <DashboardCashFlowChart
          language={language}
          mounted={mounted}
          t={t}
          formatCurrency={formatCurrency}
          filter={filter}
          setFilter={setFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          filteredTransactions={filteredTransactions}
        />

        <RecentTransactionsCard
          t={t}
          mounted={mounted}
          formatCurrency={formatCurrency}
          formatRelativeDate={formatRelativeDate}
          language={language}
          recentTransactions={recentTransactions}
        />
      </motion.div>

      {/* PORTFOLIO DETAIL & UPDATE DIALOG MODAL */}
      <PortfolioDialog
        open={portfolioOpen}
        onOpenChange={setPortfolioOpen}
        t={t}
        formatCurrency={formatCurrency}
        formatInputVal={formatInputVal}
        parseNum={parseNum}
        language={language}
        activeCurrency={activeCurrency}
        assets={assets}
        isAdding={isAdding}
        editingAsset={editingAsset}
        assetNameInput={assetNameInput}
        assetTypeInput={assetTypeInput}
        assetInitialInput={assetInitialInput}
        assetGainLossInput={assetGainLossInput}
        assetGainLossType={assetGainLossType}
        deductCash={deductCash}
        onAssetNameChange={setAssetNameInput}
        onAssetTypeChange={setAssetTypeInput}
        onAssetInitialChange={setAssetInitialInput}
        onAssetGainLossChange={setAssetGainLossInput}
        onAssetGainLossTypeChange={setAssetGainLossType}
        onDeductCashChange={setDeductCash}
        onStartAdd={handleStartAdd}
        onStartEdit={handleStartEdit}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
        onStartPartialLiquidation={handleStartPartialLiquidation}
        onShowHistory={(asset) => {
          setSelectedHistoryAsset(asset)
          setAssetHistoryOpen(true)
        }}
        onResetForm={resetForm}
        checkAssetNeedsUpdate={checkAssetNeedsUpdate}
      />

      {/* PARTIAL LIQUIDATION DIALOG */}
      <PartialLiquidationDialog
        open={partialLiqOpen}
        onOpenChange={setPartialLiqOpen}
        t={t}
        formatCurrency={formatCurrency}
        formatInputVal={formatInputVal}
        parseNum={parseNum}
        language={language}
        activeCurrency={activeCurrency}
        liqAsset={liqAsset}
        partialLiqAmountInput={partialLiqAmountInput}
        onAmountChange={setPartialLiqAmountInput}
        onExecute={handleExecutePartialLiquidation}
        onClose={handlePartialLiqClose}
      />

      {/* ASSET HISTORY DIALOG */}
      <AssetHistoryDialog
        open={assetHistoryOpen}
        onOpenChange={setAssetHistoryOpen}
        formatCurrency={formatCurrency}
        formatRelativeDate={formatRelativeDate}
        language={language}
        selectedHistoryAsset={selectedHistoryAsset}
        filteredLogs={filteredLogs}
        historyFilter={historyFilter}
        isHistoryFilterDropdownOpen={isHistoryFilterDropdownOpen}
        onFilterChange={setHistoryFilter}
        onToggleDropdown={() => setIsHistoryFilterDropdownOpen(!isHistoryFilterDropdownOpen)}
                onExportExcel={() => {
                  if (selectedHistoryAsset) exportAssetHistoryToExcel(selectedHistoryAsset.name, filteredLogs, language)
                }}
                onExportPDF={() => {
                  if (selectedHistoryAsset) exportAssetHistoryToPDF(selectedHistoryAsset.name, filteredLogs, language)
                }}
        onClose={handleHistoryClose}
      />

      {/* PORTFOLIO DELETE & LIQUIDATION CONFIRMATION DIALOG */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        t={t}
        formatCurrency={formatCurrency}
        language={language}
        assetToDelete={assetToDelete}
        onExecuteDelete={handleExecuteDelete}
        onCancel={handleDeleteCancel}
      />
    </motion.div>
  )
}
