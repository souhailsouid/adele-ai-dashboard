'use client'

import { useEffect, useState } from 'react'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import type { InstitutionHolding } from '@/types/institutionHoldings'
import type { InsiderTickerFlow } from '@/types/insiderTrades'
import type { DarkPoolTransaction } from '@/types/darkPools'
import InstitutionTimeline from './InstitutionTimeline'

interface InstitutionTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  institution: InstitutionalOwner | null
  alert: FlowAlert | null
  holdings: InstitutionHolding[]
  insiderTrades?: InsiderTickerFlow[]
  darkPools?: DarkPoolTransaction[]
}

export default function InstitutionTimelineModal({
  isOpen,
  onClose,
  institution,
  alert,
  holdings,
  insiderTrades = [],
  darkPools = [],
}: InstitutionTimelineModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (isOpen && institution && alert) {
      setIsMounted(true)
      // Délai plus court et synchronisé avec la modale principale
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
      setTimeout(() => setIsMounted(false), 300)
    }
  }, [isOpen, institution, alert])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isMounted || !institution || !alert) return null

  return (
    <>

      {/* Modal - Positioned to the right */}
      <div
        className={`fixed right-0 top-20 bottom-0 z-[112] w-full max-w-[500px] transition-all duration-300 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-full bg-neutral-900 ring-1 ring-white/10 shadow-2xl rounded-r-2xl flex flex-col overflow-hidden border-l border-white/5">
          {/* Background gradient - Réduire l'intensité pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.04),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.04),transparent_45%)] pointer-events-none"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-lg bg-neutral-800 border-2 border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-xl"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-16">
            <InstitutionTimeline 
              institution={institution} 
              alert={alert} 
              holdings={holdings}
              insiderTrades={insiderTrades}
              darkPools={darkPools}
            />
          </div>
        </div>
      </div>
    </>
  )
}

