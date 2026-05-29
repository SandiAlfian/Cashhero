"use client"

import * as React from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  React.useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Check if already installed / running in standalone mode
    const standaloneMode = window.matchMedia("(display-mode: standalone)").matches 
      || ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)

    if (standaloneMode) {
      localStorage.setItem("cashhero-pwa-installed", "true")
      return
    }

    // 2. Capture beforeinstallprompt for Chrome / Android / Edge / Safari (on supported devices)
    const handleBeforeInstall = (e: Event) => {
      // Store in window for settings page or other parts of the app to access
      const globalWindow = window as unknown as Window & { deferredPwaPrompt?: BeforeInstallPromptEvent }
      globalWindow.deferredPwaPrompt = e as BeforeInstallPromptEvent

      // 3. Check if user already dismissed it
      const hasDismissed = localStorage.getItem("cashhero-pwa-dismissed") === "true"
      const hasInstalled = localStorage.getItem("cashhero-pwa-installed") === "true"

      if (!hasDismissed && !hasInstalled) {
        const installEvent = e as BeforeInstallPromptEvent
        // Delay slightly to ensure page is loaded, interactive, and splash screen is gone
        setTimeout(() => {
          installEvent.prompt()
            .then(() => installEvent.userChoice)
            .then((choiceResult) => {
              if (choiceResult.outcome === "accepted") {
                localStorage.setItem("cashhero-pwa-installed", "true")
              } else {
                localStorage.setItem("cashhero-pwa-dismissed", "true")
              }
            })
            .catch(() => {
              // Ignore silently in production
            })
        }, 1500)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // Check if app gets installed
    const handleAppInstalled = () => {
      localStorage.setItem("cashhero-pwa-installed", "true")
    }
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  return null
}

