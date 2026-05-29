"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useLanguageStore } from "@/store/useLanguageStore"
import { Languages, Sun, Moon, Laptop, Settings2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function DesktopHeaderUtils() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguageStore()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleLanguageChange = () => {
    setLanguage(language === 'id' ? 'en' : 'id')
  }

  const handleThemeChange = (t: string) => {
    setTheme(t)
  }

  return (
    <div className="hidden md:flex fixed top-6 right-8 z-50 flex-col items-end gap-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-xl border border-border/50 shadow-xl flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title={isOpen ? "Tutup Menu" : "Pengaturan Tampilan"}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
        </motion.div>
      </button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, transformOrigin: "top right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-card/70 backdrop-blur-2xl border border-border/60 p-2.5 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            {/* Compact language button */}
            <button
              onClick={handleLanguageChange}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30 cursor-pointer active:scale-95 group/lang"
            >
              <Languages className="w-4 h-4 text-primary group-hover/lang:scale-110 transition-transform" />
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-foreground leading-none tracking-wider">
                  {language === 'id' ? 'ID' : 'EN'}
                </span>
                <span className="text-[8px] font-semibold text-muted-foreground uppercase leading-none mt-1 tracking-widest">
                  {language === 'id' ? 'Bahasa' : 'Language'}
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-border/50 rounded-full" />

            {/* Compact theme toggle */}
            <div className="flex items-center bg-muted/20 p-1 rounded-xl border border-border/30 gap-1">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  title={t === 'light' ? 'Light Mode' : t === 'dark' ? 'Dark Mode' : 'System Theme'}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    theme === t
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {t === 'light' ? (
                    <Sun className="w-3.5 h-3.5" />
                  ) : t === 'dark' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
