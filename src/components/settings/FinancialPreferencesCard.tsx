"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Coins, Sliders, Info, TrendingUp, ChevronDown, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { localT, itemVariants, currencyOptions, getFilterOptions } from "@/lib/settings"
import { RatesStaleness } from "./RatesStaleness"

interface FinancialPreferencesCardProps {
  triggerToast: (msg: string) => void
}

export function FinancialPreferencesCard({ triggerToast }: FinancialPreferencesCardProps) {
  const { language } = useLanguageStore()
  const currency = useSettingsStore((state) => state.currency)
  const defaultHistoryFilter = useSettingsStore((state) => state.defaultHistoryFilter)
  const autoLogging = useSettingsStore((state) => state.autoLogging)
  const setCurrency = useSettingsStore((state) => state.setCurrency)
  const setDefaultHistoryFilter = useSettingsStore((state) => state.setDefaultHistoryFilter)
  const setAutoLogging = useSettingsStore((state) => state.setAutoLogging)
  const exchangeRates = useSettingsStore((state) => state.exchangeRates)
  const ratesSource = useSettingsStore((state) => state.ratesSource)
  const lastRatesUpdate = useSettingsStore((state) => state.lastRatesUpdate)
  const fetchExchangeRates = useSettingsStore((state) => state.fetchExchangeRates)

  const [mounted, setMounted] = React.useState(false)
  const [localCurrency, setLocalCurrency] = React.useState<"IDR" | "USD" | "EUR" | "SGD" | "JPY">("IDR")
  const [localFilter, setLocalFilter] = React.useState<"daily" | "weekly" | "monthly" | "quarterly" | "customPeriod">("weekly")
  const [localAutoLogging, setLocalAutoLogging] = React.useState(true)
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = React.useState(false)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false)
  const [isSyncingRates, setIsSyncingRates] = React.useState(false)
  const currencyDropdownRef = React.useRef<HTMLDivElement>(null)
  const filterDropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
    setLocalCurrency(currency)
    setLocalFilter(defaultHistoryFilter)
    setLocalAutoLogging(autoLogging)
  }, [currency, defaultHistoryFilter, autoLogging])

  React.useEffect(() => {
    fetchExchangeRates()
  }, [fetchExchangeRates])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false)
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const t = React.useCallback((key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }, [mounted, language])

  const gT = React.useCallback((key: keyof typeof localT['id']) => {
    if (!mounted) return localT['id'][key]
    return localT[language]?.[key] || localT['id'][key]
  }, [mounted, language])

  const filterOptions = React.useMemo(() => getFilterOptions(gT as (key: string) => string), [gT])

  const handleSavePreferences = () => {
    setCurrency(localCurrency)
    setDefaultHistoryFilter(localFilter)
    setAutoLogging(localAutoLogging)
    triggerToast(t("preferencesSaved"))
  }

  const handleSyncExchangeRates = async () => {
    setIsSyncingRates(true)
    try {
      await fetchExchangeRates()
      const currentSource = useSettingsStore.getState().ratesSource
      if (currentSource === 'api') {
        triggerToast(language === 'id' ? "Kurs berhasil diperbarui dari API!" : "Rates successfully updated from API!")
      } else {
        triggerToast(language === 'id' ? "Gagal memuat kurs dari API. Menggunakan mode offline." : "Failed to load rates from API. Using offline mode.")
      }
    } catch {
      triggerToast(language === 'id' ? "Gagal memperbarui kurs." : "Failed to update rates.")
    } finally {
      setIsSyncingRates(false)
    }
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/25 backdrop-blur-md border border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:border-primary/20 h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-border/20 bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              {language === 'id' ? 'Preferensi Finansial' : 'Financial Preferences'}
            </CardTitle>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
              {language === 'id' ? 'Aktif' : 'Active'}
            </span>
          </div>
          <CardDescription className="text-xs">
            {language === 'id' ? 'Konfigurasi format mata uang dan parameter bawaan.' : 'Configure currency formats and default parameters.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="grid gap-1.5 relative" ref={currencyDropdownRef}>
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground/80 tracking-wider">
                {language === 'id' ? 'Mata Uang Utama' : 'Main Currency'}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)
                    setIsFilterDropdownOpen(false)
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted/15 dark:bg-zinc-900 border border-border/40 hover:bg-muted/25 hover:border-border/80 rounded-lg text-xs font-semibold text-foreground transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-[0.99] outline-none text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    <span>{currencyOptions.find(o => o.value === localCurrency)?.label || localCurrency}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isCurrencyDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCurrencyDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-2 bg-background/95 dark:bg-zinc-950/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                    >
                      {currencyOptions.map((opt) => {
                        const isActive = localCurrency === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setLocalCurrency(opt.value)
                              setIsCurrencyDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-between ${isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[9px] text-muted-foreground italic flex items-center gap-1 mt-0.5">
                <Info className="w-3 h-3 shrink-0" />
                {t("currencyHelp")}
              </p>

              {/* Premium visual exchange rates panel */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-muted/10 border border-border/20 text-[11px] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold uppercase text-[9px] tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary animate-pulse" />
                    {language === 'id' ? 'KURS AKTIF SAAT INI' : 'CURRENT ACTIVE RATES'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSyncExchangeRates}
                      disabled={isSyncingRates}
                      className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
                      title={language === 'id' ? "Perbarui Kurs" : "Refresh Rates"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-3.5 h-3.5 ${isSyncingRates ? 'animate-spin text-primary' : ''}`}
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full select-none ${ratesSource === 'api'
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>
                      {ratesSource === 'api'
                        ? (language === 'id' ? 'Terupdate Real-Time' : 'Live API Connected')
                        : (language === 'id' ? 'Mode Offline (Mei 2026)' : 'Offline Fallback')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-bold text-foreground">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">1 USD</span>
                    <span>Rp {(exchangeRates?.USD || 17825).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">1 EUR</span>
                    <span>Rp {(exchangeRates?.EUR || 20650).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">1 SGD</span>
                    <span>Rp {(exchangeRates?.SGD || 13950).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">1 JPY</span>
                    <span>Rp {(exchangeRates?.JPY || 112).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {lastRatesUpdate && <RatesStaleness lastUpdate={lastRatesUpdate} language={language} />}
              </div>
            </div>

            <div className="grid gap-1.5 relative" ref={filterDropdownRef}>
              <label className="text-[10px] font-extrabold uppercase text-muted-foreground/80 tracking-wider">
                {language === 'id' ? 'Default Filter Riwayat' : 'Default History Filter'}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFilterDropdownOpen(!isFilterDropdownOpen)
                    setIsCurrencyDropdownOpen(false)
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted/15 dark:bg-zinc-900 border border-border/40 hover:bg-muted/25 hover:border-border/80 rounded-lg text-xs font-semibold text-foreground transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-sm active:scale-[0.99] outline-none text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    <span>{filterOptions.find(o => o.value === localFilter)?.label || gT(localFilter as keyof typeof localT['id'])}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isFilterDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-2 bg-background/95 dark:bg-zinc-950/95 border border-border rounded-xl shadow-xl backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
                    >
                      {filterOptions.map((opt) => {
                        const isActive = localFilter === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setLocalFilter(opt.value)
                              setIsFilterDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-between ${isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-muted/10">
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-foreground">
                  {language === 'id' ? 'Pencatatan Otomatis' : 'Automatic Logging'}
                </h5>
                <p className="text-[10px] text-muted-foreground">
                  {t("autoLoggingDesc")}
                </p>
              </div>
              <div
                onClick={() => setLocalAutoLogging(!localAutoLogging)}
                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center ${localAutoLogging ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: localAutoLogging ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 py-2.5 px-4 rounded-lg font-bold text-xs shadow-md transition-all duration-200 cursor-pointer text-center select-none"
          >
            {language === 'id' ? 'Simpan Preferensi' : 'Save Preferences'}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
