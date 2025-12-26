'use client'

import { useEffect } from 'react'

export default function AuraBackground() {
  useEffect(() => {
    // Initialize Unicorn Studio if not already initialized
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false }
      
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js'
      script.onload = () => {
        if (!window.UnicornStudio?.isInitialized && window.UnicornStudio?.init) {
          window.UnicornStudio.init()
          window.UnicornStudio.isInitialized = true
        }
      }
      ;(document.head || document.body).appendChild(script)
    } else if (!window.UnicornStudio.isInitialized && window.UnicornStudio.init) {
      // If script already loaded but not initialized
      window.UnicornStudio.init()
      window.UnicornStudio.isInitialized = true
    }
  }, [])

  return (
    <div className="aura-background-component top-0 w-full -z-10 absolute h-full">
      <div
        data-us-project="ZHhDKfVqqu8PKOSMwfuA"
        className="absolute w-full h-full left-0 top-0 -z-10"
      ></div>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean
      init?: () => void
    }
  }
}

