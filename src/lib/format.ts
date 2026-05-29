import { Language } from "@/store/useLanguageStore"
import { useSettingsStore, EXCHANGE_RATES } from "@/store/useSettingsStore"

/**
 * Formats a numeric value into dynamic converted currency format.
 * Supported currencies: IDR, USD, EUR, SGD, JPY.
 */
export const formatCurrency = (amount: number, lang: Language): string => {
  const absoluteAmount = Math.abs(amount)
  
  // Read dynamically from store state (reactive & non-reactive safe)
  const state = typeof window !== 'undefined' ? useSettingsStore.getState() : null
  const currency = state?.currency || 'IDR'
  const rate = state?.exchangeRates?.[currency] || EXCHANGE_RATES[currency] || 1
  const convertedAmount = absoluteAmount / rate

  // Determine decimal places for foreign currencies (2 decimal places if there are cents)
  const isJapanOrIndo = currency === 'JPY' || currency === 'IDR'
  const hasDecimals = convertedAmount % 1 !== 0
  const decimals = isJapanOrIndo ? 0 : (hasDecimals ? 2 : 0)

  // Separators based on locale
  const locale = lang === 'id' ? 'id-ID' : 'en-US'
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(convertedAmount)

  // Map currency symbols
  const symbolMap = {
    IDR: 'Rp ',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    JPY: '¥'
  }
  
  const symbol = symbolMap[currency] || 'Rp '
  
  return `${symbol}${formattedNumber}`
}

/**
 * Formats a Date object or string according to the selected language locale.
 */
export const formatDate = (dateString: string, lang: Language): string => {
  const date = new Date(dateString)
  if (lang === 'id') {
    return date.toLocaleDateString("id-ID", {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString("en-US", {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Formats a relative date according to the selected language locale.
 */
export const formatRelativeDate = (dateString: string, lang: Language): string => {
  const date = new Date(dateString)
  const today = new Date()
  
  // Reset hours to compare dates accurately
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const diffTime = d2.getTime() - d1.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return lang === 'id' ? "Hari ini" : "Today"
  }
  if (diffDays === 1) {
    return lang === 'id' ? "Kemarin" : "Yesterday"
  }
  
  if (lang === 'id') {
    return `${diffDays} Hari lalu`
  } else {
    return `${diffDays} days ago`
  }
}
