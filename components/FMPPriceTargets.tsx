/**
 * Composant Consensus des Price Targets
 * Style inspiré de MacroCalendar
 */

'use client'

import { useState, useEffect } from 'react'
import fmpGradesService from '@/services/fmpGradesService'
import type { FMPPriceTargetResponse } from '@/types/fmpSignals'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface FMPPriceTargetsProps {
  symbol: string
  currentPrice?: number
}

export default function FMPPriceTargets({ symbol, currentPrice }: FMPPriceTargetsProps) {
  const [targets, setTargets] = useState<FMPPriceTargetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuth()
  const { openModal } = useAuthModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isAuthenticated()) {
      setLoading(false)
      return
    }

    const loadTargets = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fmpGradesService.getPriceTargetConsensus(symbol, true)
        setTargets(response)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des price targets')
      } finally {
        setLoading(false)
      }
    }

    loadTargets()
  }, [symbol, mounted, isAuthenticated])

  if (!mounted) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 mt-4 text-sm">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <div className="text-orange-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p className="text-sm text-neutral-300 mb-4">Authentification requise</p>
            <button
              onClick={() => openModal('login')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 mt-4 text-sm">Chargement des price targets...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!targets || !targets.data || targets.data.length === 0) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <p className="text-neutral-400 text-sm">Aucun price target disponible pour {symbol}</p>
          </div>
        </div>
      </div>
    )
  }

  const data = targets.data[0]
  const upside = currentPrice ? ((data.targetConsensus - currentPrice) / currentPrice) * 100 : null
  const upsideMedian = currentPrice ? ((data.targetMedian - currentPrice) / currentPrice) * 100 : null

  // Calculer les pourcentages pour la barre
  const minVal = Math.min(data.targetLow, currentPrice || data.targetLow)
  const maxVal = Math.max(data.targetHigh, currentPrice || data.targetHigh)
  const range = maxVal - minVal

  const getPosition = (value: number) => ((value - minVal) / range) * 100

  return (
    <div className="relative w-full max-w-[500px]">
      <div className="glass-card rounded-[1.2em] p-1">
        <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Price Targets</div>
                <div className="text-[10px] text-neutral-500 font-mono">{symbol}</div>
              </div>
            </div>
            {upside !== null && (
              <span
                className={`px-3 py-1 rounded text-xs font-bold ${
                  upside > 0 ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'
                } border`}
              >
                {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Barre de prix */}
            <div className="relative h-12 bg-neutral-800 rounded-lg overflow-hidden">
              {/* Current Price */}
              {currentPrice && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-20"
                  style={{ left: `${getPosition(currentPrice)}%` }}
                >
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-orange-400 font-bold">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Range */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500 rounded"
                style={{
                  left: `${getPosition(data.targetLow)}%`,
                  width: `${getPosition(data.targetHigh) - getPosition(data.targetLow)}%`,
                }}
              />

              {/* Consensus */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded"
                style={{ left: `${getPosition(data.targetConsensus)}%` }}
              >
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-emerald-400 font-bold whitespace-nowrap">
                  Consensus
                </div>
              </div>

              {/* Median */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded"
                style={{ left: `${getPosition(data.targetMedian)}%` }}
              >
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-blue-400 font-bold whitespace-nowrap">
                  Median
                </div>
              </div>
            </div>

            {/* Valeurs */}
            <div className="grid grid-cols-4 gap-3 pt-2 border-t border-white/5">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Low</div>
                <div className="text-sm font-bold text-red-400 font-mono">${data.targetLow.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Consensus</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">${data.targetConsensus.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Median</div>
                <div className="text-sm font-bold text-blue-400 font-mono">${data.targetMedian.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">High</div>
                <div className="text-sm font-bold text-orange-400 font-mono">${data.targetHigh.toFixed(2)}</div>
              </div>
            </div>

            {/* Upside/Downside */}
            {currentPrice && upside !== null && (
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Upside Potential</span>
                  <span className={`text-sm font-bold ${upside > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {upside > 0 ? '+' : ''}{upside.toFixed(1)}% (Consensus)
                  </span>
                </div>
                {upsideMedian !== null && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-400">Upside Potential</span>
                    <span className={`text-sm font-bold ${upsideMedian > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {upsideMedian > 0 ? '+' : ''}{upsideMedian.toFixed(1)}% (Median)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

