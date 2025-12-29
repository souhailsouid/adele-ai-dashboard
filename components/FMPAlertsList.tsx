/**
 * Liste des Alertes FMP
 * Style inspiré de HeroDashboard avec structure List View
 */

'use client'

import { useState, useEffect } from 'react'
import { useFMPSignals } from '@/hooks/useFMPSignals'
import FMPAlertCard from './FMPAlertCard'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface FMPAlertsListProps {
  ticker?: string
  maxItems?: number
}

export default function FMPAlertsList({ ticker, maxItems = 10 }: FMPAlertsListProps) {
  const { signals, loading, isConnected } = useFMPSignals({ ticker, limit: maxItems })
  const { isAuthenticated } = useAuth()
  const { openModal } = useAuthModal()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Éviter l'hydratation mismatch en attendant que le client soit monté
  if (!mounted) {
    return (
      <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-neutral-400 mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
        <div className="p-12 text-center">
          <div className="text-orange-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Authentification requise</p>
          <p className="text-sm text-neutral-500 mb-6">Vous devez être connecté pour voir les alertes FMP</p>
          <button
            onClick={() => openModal('login')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-neutral-400 mt-4">Chargement des alertes FMP...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-neutral-300"
          >
            <path d="m22 2-7 20-4-9-9-4Z"></path>
            <path d="M22 2 11 13"></path>
          </svg>
          <span className="text-base font-medium text-neutral-200">FMP Market Signals</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`}></div>
          <span className="text-xs text-neutral-500">{signals.length}</span>
        </div>
      </div>

      {/* List View */}
      <div className="flex flex-col bg-[#0B0C0E]">
        {signals.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-400 text-sm">Aucune alerte FMP pour le moment</p>
            {ticker && (
              <p className="text-xs text-neutral-500 mt-2">Ticker: {ticker}</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {signals.map((signal, idx) => (
              <FMPAlertCard key={signal.id} signal={signal} isActive={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

