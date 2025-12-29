/**
 * Composant Historique des Grades d'Analystes avec Graphique
 * Style inspiré de MacroCalendar et DataComparisonChart
 */

'use client'

import { useState, useEffect } from 'react'
import fmpGradesService from '@/services/fmpGradesService'
import type { FMPGradesHistoricalResponse } from '@/types/fmpSignals'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface FMPGradesHistoricalProps {
  symbol: string
  limit?: number
}

export default function FMPGradesHistorical({ symbol, limit = 24 }: FMPGradesHistoricalProps) {
  const [historical, setHistorical] = useState<FMPGradesHistoricalResponse | null>(null)
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

    const loadHistorical = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fmpGradesService.getGradesHistorical(symbol, limit, true)
        setHistorical(response)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement de l\'historique')
      } finally {
        setLoading(false)
      }
    }

    loadHistorical()
  }, [symbol, limit, mounted, isAuthenticated])

  if (!mounted) {
    return (
      <div className="relative w-full">
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
      <div className="relative w-full">
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
      <div className="relative w-full">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 mt-4 text-sm">Chargement de l'historique...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full">
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

  if (!historical || !historical.data || historical.data.length === 0) {
    return (
      <div className="relative w-full">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <p className="text-neutral-400 text-sm">Aucun historique disponible pour {symbol}</p>
          </div>
        </div>
      </div>
    )
  }

  const data = historical.data.slice(0, limit).reverse() // Plus récent en premier
  const maxTotal = Math.max(...data.map((d) => d.analystRatingsStrongBuy + d.analystRatingsBuy + d.analystRatingsHold + d.analystRatingsSell + d.analystRatingsStrongSell))

  return (
    <div className="relative w-full">
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Analyst Ratings History</div>
                <div className="text-[10px] text-neutral-500 font-mono">{symbol} • Last {limit} months</div>
              </div>
            </div>
          </div>

          {/* Graphique */}
          <div className="p-5">
            <div className="h-64 flex items-end gap-1 mb-4">
              {data.map((item, idx) => {
                const total = item.analystRatingsStrongBuy + item.analystRatingsBuy + item.analystRatingsHold + item.analystRatingsSell + item.analystRatingsStrongSell
                const bullish = item.analystRatingsStrongBuy + item.analystRatingsBuy
                const bearish = item.analystRatingsSell + item.analystRatingsStrongSell

                const bullishPercent = (bullish / maxTotal) * 100
                const holdPercent = (item.analystRatingsHold / maxTotal) * 100
                const bearishPercent = (bearish / maxTotal) * 100

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-neutral-900 border border-white/10 rounded-lg p-2 shadow-xl min-w-[120px]">
                      <div className="text-[10px] text-neutral-400 mb-1">{fmpGradesService.formatDate(item.date)}</div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-emerald-400">Bullish:</span>
                          <span className="text-neutral-300">{bullish}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-orange-400">Hold:</span>
                          <span className="text-neutral-300">{item.analystRatingsHold}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-red-400">Bearish:</span>
                          <span className="text-neutral-300">{bearish}</span>
                        </div>
                        <div className="flex justify-between gap-2 pt-1 border-t border-white/5">
                          <span className="text-neutral-400">Total:</span>
                          <span className="text-neutral-300 font-bold">{total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barre empilée */}
                    <div className="w-full flex flex-col items-end gap-0.5 h-full">
                      {/* Bearish (rouge) */}
                      {bearishPercent > 0 && (
                        <div
                          className="w-full bg-red-500/80 rounded-t transition-all hover:opacity-80"
                          style={{ height: `${bearishPercent}%` }}
                          title={`Bearish: ${bearish}`}
                        />
                      )}
                      {/* Hold (orange) */}
                      {holdPercent > 0 && (
                        <div
                          className="w-full bg-orange-500/80 transition-all hover:opacity-80"
                          style={{ height: `${holdPercent}%` }}
                          title={`Hold: ${item.analystRatingsHold}`}
                        />
                      )}
                      {/* Bullish (vert) */}
                      {bullishPercent > 0 && (
                        <div
                          className="w-full bg-emerald-500/80 rounded-b transition-all hover:opacity-80"
                          style={{ height: `${bullishPercent}%` }}
                          title={`Bullish: ${bullish}`}
                        />
                      )}
                    </div>

                    {/* Date (tous les 3 mois) */}
                    {idx % 3 === 0 && (
                      <div className="text-[8px] text-neutral-500 mt-1 font-mono transform -rotate-45 origin-left">
                        {fmpGradesService.formatDate(item.date).split(' ')[0]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/80"></div>
                <span className="text-[10px] text-neutral-400">Bullish (Strong Buy + Buy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500/80"></div>
                <span className="text-[10px] text-neutral-400">Hold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500/80"></div>
                <span className="text-[10px] text-neutral-400">Bearish (Sell + Strong Sell)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

