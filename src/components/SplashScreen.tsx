"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useLanguageStore } from "@/store/useLanguageStore"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false)
  const { language } = useLanguageStore()

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onComplete, 500)
    }, 2600)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <>
      {/* Inject Adumu font-face scoped to this component */}
      <style>{`
        @font-face {
          font-family: 'Adumu';
          src: url('/fonts/Adumu.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.48, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none no-print overflow-hidden"
            style={{
              background: "radial-gradient(ellipse at center, #27141E 0%, #0E0B10 100%)"
            }}
          >
            {/* Deep ambient maroon backdrop glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.22, scale: 1.4 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute w-[440px] h-[440px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, #810B38 0%, transparent 70%)",
                filter: "blur(64px)"
              }}
            />

            {/* Subtle gold top-right accent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 2.2, ease: "easeOut", delay: 0.4 }}
              className="absolute top-12 right-12 w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)",
                filter: "blur(50px)"
              }}
            />

            <div className="flex flex-col items-center gap-3 relative z-10">
              {/* Pop Logo with spring physics */}
              <motion.div
                initial={{ scale: 0.22, opacity: 0, rotate: -12, y: 24 }}
                animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 175,
                  damping: 13,
                  delay: 0.08
                }}
                className="relative"
              >
                {/* Core soft Burgundy glow */}
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.0, ease: "easeOut", delay: 0.55 }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(129,11,56,0.3) 0%, transparent 70%)",
                    filter: "blur(16px)",
                    transform: "scale(1.7)"
                  }}
                />

                <Image
                  src="/cashhero-logo.png"
                  alt="CashHero"
                  width={192}
                  height={192}
                  className="w-48 h-48 object-contain select-none relative z-10"
                  style={{
                    filter: "drop-shadow(0 14px 36px rgba(129,11,56,0.48))"
                  }}
                  priority
                />
              </motion.div>

              {/* Brand name using Adumu font with burgundy "Hero" */}
              <div className="flex flex-col items-center gap-2">
                <motion.h1
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.58, ease: "easeOut", delay: 0.65 }}
                  style={{ fontFamily: "'Adumu', sans-serif", lineHeight: 1 }}
                  className="text-[3rem] tracking-wide select-none"
                >
                  <span style={{ color: "#F3EBE1" }}>Cash</span>
                  <span style={{ color: "#810B38" }}>Hero</span>
                </motion.h1>

                {/* Slogan in Adumu font */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.72, y: 0 }}
                  transition={{ duration: 0.85, ease: "easeOut", delay: 1.05 }}
                  style={{
                    fontFamily: "'Adumu', sans-serif",
                    color: "#D5C5B5",
                    letterSpacing: "0.18em"
                  }}
                  className="text-[11px] uppercase text-center whitespace-nowrap mt-1"
                >
                  {language === "en" ? "Personal Finance Management Hero" : "Pahlawan Kelola Keuangan Pribadi"}
                </motion.p>
              </div>

              {/* Animated loading dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.4 }}
                className="flex items-center gap-2 mt-1"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1.15, 0.75] }}
                    transition={{
                      duration: 0.85,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#810B38" }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
