"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Wallet, TrendingUp, Coins, ArrowLeft, Info } from "lucide-react"
import { CURRENCY_SYMBOLS } from "@/lib/statistics"
import type { InvestmentAsset, AssetType } from "@/store/usePortfolioStore"

interface Props {
  t: (k: string) => string
  formatCurrency: (amount: number, lang: 'id' | 'en') => string
  formatInputVal: (val: string) => string
  parseNum: (str: string) => number
  language: 'id' | 'en'
  activeCurrency: string
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
  onSave: () => void
  onResetForm: () => void
}

export function AssetFormView({
  t, formatCurrency, formatInputVal, parseNum,
  language, activeCurrency,
  isAdding, editingAsset,
  assetNameInput, assetTypeInput, assetInitialInput,
  assetGainLossInput, assetGainLossType, deductCash,
  onAssetNameChange, onAssetTypeChange, onAssetInitialChange,
  onAssetGainLossChange, onAssetGainLossTypeChange, onDeductCashChange,
  onSave, onResetForm,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <button
          onClick={onResetForm}
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-foreground">
          {editingAsset ? t('editAsset') : t('newAsset')}
        </h3>
      </div>

      <div className="grid gap-4 py-1">
        <div className="grid gap-1.5">
          <label className="font-semibold text-xs text-muted-foreground">{t('assetName')}</label>
          <Input
            placeholder={language === 'id' ? 'Contoh: Saham BBCA, Bitcoin, Emas Antam' : 'e.g. BBCA Stocks, Bitcoin, Gold'}
            value={assetNameInput}
            onChange={(e) => onAssetNameChange(e.target.value)}
            className="bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="font-semibold text-xs text-muted-foreground">{t('assetType')}</label>
          <div className="flex gap-2">
            {([
              { value: 'stocks', label: t('stocks'), icon: TrendingUp },
              { value: 'crypto', label: t('crypto'), icon: Coins },
              { value: 'other', label: t('otherType'), icon: Wallet }
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onAssetTypeChange(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  assetTypeInput === opt.value
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{t('initialCapital')}</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">
                {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
              </span>
              <CurrencyInput
                value={assetInitialInput}
                onChange={(e) => onAssetInitialChange(formatInputVal(e.target.value))}
                className="pl-8 bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="font-semibold text-xs text-muted-foreground">{t('realizedGainLoss')}</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground/60 font-semibold select-none">
                {CURRENCY_SYMBOLS[activeCurrency] || 'Rp'}
              </span>
              <CurrencyInput
                value={assetGainLossInput}
                onChange={(e) => onAssetGainLossChange(formatInputVal(e.target.value))}
                className="pl-8 bg-muted/40 border border-input text-foreground focus-visible:ring-primary h-10 rounded-lg text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-muted/40 p-2 rounded-lg border border-border/40">
          <span className="text-xs text-muted-foreground font-semibold">
            {language === 'id' ? 'Status Kinerja Mingguan' : 'Weekly Performance Status'}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onAssetGainLossTypeChange('profit')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                assetGainLossType === 'profit'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('profit')}
            </button>
            <button
              type="button"
              onClick={() => onAssetGainLossTypeChange('loss')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                assetGainLossType === 'loss'
                  ? 'bg-destructive text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('loss')}
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-muted/30">
            <input
              id="deductCashToggle"
              type="checkbox"
              checked={deductCash}
              onChange={(e) => onDeductCashChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <div className="grid gap-0.5 cursor-pointer select-none" onClick={() => onDeductCashChange(!deductCash)}>
              <label htmlFor="deductCashToggle" className="text-xs font-bold text-foreground cursor-pointer">
                {t('deductFromCash')}
              </label>
              <p className="text-[10px] text-muted-foreground">
                {t('deductHelp')}
              </p>
            </div>
          </div>
        )}

        {editingAsset && (
          <div className="p-2.5 rounded-lg border border-border/40 bg-muted/30 text-[10px] text-muted-foreground flex gap-1.5 items-start">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{t('glAdjustNote')}</span>
          </div>
        )}

        {(assetTypeInput === 'stocks' || assetTypeInput === 'crypto') && (
          <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 flex gap-2 items-start text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              {language === 'id'
                ? "Kategori Saham dan Kripto direkomendasikan untuk diperbarui realized gain/loss-nya secara rutin setiap minggu."
                : "Stocks and Crypto categories are recommended to have their realized gain/loss updated regularly every week."}
            </span>
          </div>
        )}

        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between text-xs font-bold text-foreground">
          <span>{t('netInvestmentValue')}:</span>
          <span className={`text-base ${parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {formatCurrency(
              parseNum(assetInitialInput) + parseNum(assetGainLossInput) * (assetGainLossType === 'profit' ? 1 : -1),
              language
            )}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button
          variant="ghost"
          onClick={onResetForm}
          className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-xs font-semibold rounded-lg px-4 py-2"
          type="button"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={onSave}
          disabled={!assetNameInput.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md text-xs font-semibold rounded-lg px-5 py-2 disabled:opacity-55 disabled:cursor-not-allowed"
        >
          {t('saveChanges')}
        </Button>
      </div>
    </div>
  )
}
