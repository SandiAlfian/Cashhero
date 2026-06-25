"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { InvestmentAsset, AssetType } from "@/store/usePortfolioStore"
import { AssetListView } from "./AssetListView"
import { AssetFormView } from "./AssetFormView"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (k: string) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  formatInputVal: (val: string) => string
  parseNum: (str: string) => number
  language: 'id' | 'en'
  activeCurrency: string
  assets: InvestmentAsset[]

  isAdding: boolean
  editingAsset: InvestmentAsset | null
  assetNameInput: string
  assetTypeInput: AssetType
  assetInitialInput: string
  assetGainLossInput: string
  assetGainLossType: 'profit' | 'loss'
  deductCash: boolean

  onAssetNameChange: (val: string) => void
  onAssetTypeChange: (val: AssetType) => void
  onAssetInitialChange: (val: string) => void
  onAssetGainLossChange: (val: string) => void
  onAssetGainLossTypeChange: (val: 'profit' | 'loss') => void
  onDeductCashChange: (val: boolean) => void

  onStartAdd: () => void
  onStartEdit: (asset: InvestmentAsset) => void
  onSave: () => void
  onDelete: (asset: InvestmentAsset) => void
  onStartPartialLiquidation: (asset: InvestmentAsset) => void
  onShowHistory: (asset: InvestmentAsset) => void
  onResetForm: () => void

  checkAssetNeedsUpdate: (asset: InvestmentAsset) => boolean
}

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

export function PortfolioDialog({
  open, onOpenChange, t, formatCurrency, formatInputVal, parseNum,
  language, activeCurrency, assets,
  isAdding, editingAsset, assetNameInput, assetTypeInput,
  assetInitialInput, assetGainLossInput, assetGainLossType, deductCash,
  onAssetNameChange, onAssetTypeChange, onAssetInitialChange,
  onAssetGainLossChange, onAssetGainLossTypeChange, onDeductCashChange,
  onStartAdd, onStartEdit, onSave, onDelete,
  onStartPartialLiquidation, onShowHistory, onResetForm,
  checkAssetNeedsUpdate,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-none bg-background/95 border-border text-foreground backdrop-blur-xl p-6 shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-foreground text-xl font-bold tracking-tight flex items-center gap-2">
            <BriefcaseIcon className="w-5 h-5 text-primary dark:text-rose-400" />
            {t('allAssetsDetail')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {language === 'id'
              ? "Kelola alokasi aset investasi Anda secara dinamis dengan realized gain/loss mingguan."
              : "Manage your investment asset allocations dynamically with weekly realized gain/loss."}
          </DialogDescription>
        </DialogHeader>

        {!isAdding && !editingAsset ? (
          <AssetListView
            t={t} formatCurrency={formatCurrency} language={language}
            assets={assets} onStartAdd={onStartAdd}
            onStartEdit={onStartEdit} onDelete={onDelete}
            onStartPartialLiquidation={onStartPartialLiquidation}
            onShowHistory={onShowHistory}
            checkAssetNeedsUpdate={checkAssetNeedsUpdate}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <AssetFormView
            t={t} formatCurrency={formatCurrency} formatInputVal={formatInputVal}
            parseNum={parseNum} language={language} activeCurrency={activeCurrency}
            isAdding={isAdding} editingAsset={editingAsset}
            assetNameInput={assetNameInput} assetTypeInput={assetTypeInput}
            assetInitialInput={assetInitialInput} assetGainLossInput={assetGainLossInput}
            assetGainLossType={assetGainLossType} deductCash={deductCash}
            onAssetNameChange={onAssetNameChange}
            onAssetTypeChange={onAssetTypeChange}
            onAssetInitialChange={onAssetInitialChange}
            onAssetGainLossChange={onAssetGainLossChange}
            onAssetGainLossTypeChange={onAssetGainLossTypeChange}
            onDeductCashChange={onDeductCashChange}
            onSave={onSave} onResetForm={onResetForm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
