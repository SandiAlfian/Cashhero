"use client"

import * as React from "react"
import { useLanguageStore } from "@/store/useLanguageStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { motion } from "framer-motion"

const IndonesiaFlag = () => (
  <svg className="w-[20px] h-[13.5px] rounded-[1px] shadow-sm border border-black/10 shrink-0" viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="10" fill="#E21C26" />
    <rect y="10" width="30" height="10" fill="#FFFFFF" />
  </svg>
)

const UKFlag = () => (
  <svg className="w-[20px] h-[13.5px] rounded-[1px] shadow-sm border border-black/10 shrink-0" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Saint Andrew's Cross (White Saltire) on Blue Field */}
    <rect width="50" height="30" fill="#012169" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#FFFFFF" strokeWidth="6" />
    {/* Saint Patrick's Cross (Red Saltire) */}
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="2" />
    {/* Saint George's Cross (White Border) */}
    <path d="M25 0 V30 M0 15 H50" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="butt" />
    {/* Saint George's Cross (Red) */}
    <path d="M25 0 V30 M0 15 H50" stroke="#C8102E" strokeWidth="6" strokeLinecap="butt" />
  </svg>
)

const TinyArrow = () => (
  <svg className="w-1.5 h-1.5 text-muted-foreground/75 dark:text-zinc-400/80 shrink-0" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1 L4 4 L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()
  const isSidebarCollapsed = useSettingsStore((state) => state.isSidebarCollapsed)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return isSidebarCollapsed ? (
      <div className="w-12 h-8 bg-muted/20 animate-pulse rounded-lg" />
    ) : (
      <div className="w-[64px] h-[26px] bg-muted/20 animate-pulse rounded-full" />
    )
  }

  const isId = language === 'id'

  if (isSidebarCollapsed) {
    return (
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setLanguage(isId ? 'en' : 'id')}
        className="w-12 h-8 px-1.5 py-1 flex items-center justify-between rounded-lg bg-muted/20 hover:bg-muted dark:bg-zinc-900/40 dark:hover:bg-zinc-800/80 border border-primary/50 dark:border-rose-500/40 hover:border-primary dark:hover:border-rose-400 shadow-sm transition-colors cursor-pointer select-none outline-none gap-1"
        title={isId ? "Switch to English" : "Ubah ke Bahasa Indonesia"}
      >
        <motion.div
          key={language}
          className="flex items-center"
          initial={{ scale: 0.7, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
        >
          {isId ? <IndonesiaFlag /> : <UKFlag />}
        </motion.div>
        <TinyArrow />
      </motion.button>
    )
  }

  return (
    <div className="flex items-center no-print">
      {/* Modern, smaller sliding tab toggle with spring animations */}
      <div className="bg-muted/80 dark:bg-zinc-800/80 border border-border/80 dark:border-zinc-700/80 rounded-full p-[2px] relative flex items-center w-[64px] h-[26px] select-none shadow-inner transition-all duration-300">
        
        {/* Sliding background active bubble */}
        <motion.div
          className="absolute top-[2px] bottom-[2px] left-[2px] w-[28px] bg-primary dark:bg-rose-600 rounded-full shadow-sm z-0"
          animate={{ x: isId ? 0 : 30 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        />

        {/* ID Tab Button */}
        <button
          onClick={() => setLanguage('id')}
          className={`flex-1 text-[9px] font-black tracking-widest text-center relative z-10 h-full flex items-center justify-center transition-colors duration-300 cursor-pointer rounded-full active:scale-95 focus:outline-none`}
          style={{ color: isId ? '#FFFFFF' : 'var(--muted-foreground)' }}
        >
          ID
        </button>

        {/* EN Tab Button */}
        <button
          onClick={() => setLanguage('en')}
          className={`flex-1 text-[9px] font-black tracking-widest text-center relative z-10 h-full flex items-center justify-center transition-colors duration-300 cursor-pointer rounded-full active:scale-95 focus:outline-none`}
          style={{ color: !isId ? '#FFFFFF' : 'var(--muted-foreground)' }}
        >
          EN
        </button>
      </div>
    </div>
  )
}
