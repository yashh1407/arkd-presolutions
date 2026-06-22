"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
        Get the app on your device for easy access & a better experience!
      </p>
      <button 
        onClick={handleInstallClick}
        className="bg-[#18181b] hover:bg-black text-white text-[13px] font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Download className="w-4 h-4" /> Install
      </button>
    </div>
  )
}
