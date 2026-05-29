"use client"

import * as React from "react"
import { SplashScreen } from "./SplashScreen"
import { PWAInstallPrompt } from "./PWAInstallPrompt"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = React.useState(true)

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <>
          {children}
          <PWAInstallPrompt />
        </>
      )}
    </>
  )
}
