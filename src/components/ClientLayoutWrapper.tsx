"use client"

import * as React from "react"
import { SplashScreen } from "./SplashScreen"
import { PWAInstallPrompt } from "./PWAInstallPrompt"
import { useSmartReminders } from "@/hooks/useSmartReminders"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = React.useState(true)
  
  useSmartReminders()

  return (
    <>
      <PWAInstallPrompt />
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <>
          {children}
        </>
      )}
    </>
  )
}
