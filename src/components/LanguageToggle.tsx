"use client"

import * as React from "react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { motion } from "framer-motion"

const IndonesiaFlag = () => (
  <svg className="w-5 h-3.5 rounded-sm shadow-sm border border-black/10 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="10" fill="#E21C26" />
    <rect y="10" width="30" height="10" fill="#FFFFFF" />
  </svg>
)

const UKFlag = () => (
  <svg className="w-5 h-3.5 rounded-sm shadow-sm border border-black/10 shrink-0" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="30" fill="#012169" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#FFFFFF" strokeWidth="6" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="2" />
    <path d="M25 0 V30 M0 15 H50" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="butt" />
    <path d="M25 0 V30 M0 15 H50" stroke="#C8102E" strokeWidth="6" strokeLinecap="butt" />
  </svg>
)

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9 bg-muted/20 animate-pulse rounded-xl" />
  }

  const isId = language === 'id'

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setLanguage(isId ? 'en' : 'id')}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/30 hover:bg-muted/60 dark:bg-zinc-800/40 dark:hover:bg-zinc-700/60 transition-all duration-300 cursor-pointer select-none outline-none"
      title={isId ? "Switch to English" : "Ubah ke Bahasa Indonesia"}
    >
      <motion.div
        key={language}
        initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      >
        {isId ? <IndonesiaFlag /> : <UKFlag />}
      </motion.div>
    </motion.button>
  )
}
