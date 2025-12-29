/**
 * Composant de Détection Manuelle de Signaux FMP
 * Style inspiré de MacroCalendar avec timeline
 */

'use client'

import { useState, useEffect } from 'react'
import marketSignalsService from '@/services/marketSignalsService'
import type { MarketSignalResponse } from '@/types/fmpSignals'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface TickerAlertsProps {
  ticker: string
  includeCompany?: boolean
  onPriceUpdate?: (price: number | null) => void
}

export default function TickerAlerts({ ticker, includeCompany = true, onPriceUpdate }: TickerAlertsProps) {
  const [signal, setSignal] = useState<MarketSignalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated } = useAuth()
  const { openModal } = useAuthModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkSignal = async () => {
    if (!isAuthenticated()) {
      setError('Authentification requise')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await marketSignalsService.getMarketSignal(ticker, includeCompany, true)
      setSignal(result)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted && ticker && isAuthenticated()) {
      checkSignal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, includeCompany, mounted])

  // Notifier le parent du prix actuel
  useEffect(() => {
    if (signal?.company?.quote?.price && onPriceUpdate) {
      onPriceUpdate(signal.company.quote.price)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal])

  // Éviter l'hydratation mismatch en attendant que le client soit monté
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
            <p className="text-neutral-400 mt-4 text-sm">Vérification des signaux...</p>
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
              onClick={checkSignal}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!signal?.hasAlert) {
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
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white tracking-tight">Market Signals</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{ticker}</div>
                </div>
              </div>
              <button
                onClick={checkSignal}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700 transition-colors"
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {/* Body */}
            <div className="p-5 text-center">
              <p className="text-neutral-400 text-sm">Aucun signal détecté pour {ticker}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { alert } = signal
  if (!alert) return null

  const isBullish = alert.type === 'bullish'

  return (
    <div className="relative w-full max-w-[500px]">
      {/* Glow effect */}
      <div className={`absolute inset-0 ${isBullish ? 'bg-emerald-500/10' : 'bg-red-500/10'} blur-[100px] -z-10 opacity-30`}></div>

      <div className="glass-card rounded-[1.2em] p-1">
        <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${isBullish ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} border flex items-center justify-center ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                {isBullish ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 6 12 12 6 6"></polyline>
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">
                  {isBullish ? '🟢 BULLISH' : '🔴 BEARISH'} Signal
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {ticker}
                  {signal.company?.quote?.price && ` • $${signal.company.quote.price.toFixed(2)}`}
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${
              alert.severity === 'high'
                ? 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
                : alert.severity === 'medium'
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
            }`}>
              {alert.severity}
            </span>
          </div>

          {/* Body with Timeline */}
          <div className="p-5 space-y-6 relative">
            {/* Connecting line */}
            <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {/* Message principale */}
            <div className="relative flex gap-5 group">
              <div className={`w-3 h-3 rounded-full ${isBullish ? 'bg-emerald-400' : 'bg-red-400'} ring-4 ${isBullish ? 'ring-emerald-400/10' : 'ring-red-400/10'} mt-1.5 flex-shrink-0 z-10`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isBullish ? 'text-emerald-300' : 'text-red-300'} group-hover:${isBullish ? 'text-emerald-200' : 'text-red-200'} transition-colors`}>
                    {alert.message}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {marketSignalsService.formatRelativeDate(alert.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signaux détectés */}
            {alert.signals.length > 0 && (
              <div className="relative flex gap-5 group">
                <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-400/10 mt-1.5 flex-shrink-0 z-10"></div>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-white">Signaux détectés</span>
                  </div>
                  <div className="space-y-2">
                    {alert.signals.map((sig, idx) => (
                      <div key={idx} className="text-[11px] text-neutral-400 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Détails de l'alerte */}
            {alert.details && (
              <div className="relative flex gap-5 group opacity-80">
                <div className="w-3 h-3 rounded-full bg-neutral-400 ring-4 ring-neutral-400/10 mt-1.5 flex-shrink-0 z-10"></div>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-white">Signaux détectés</span>
                  </div>
                  {alert.details.consensus && (
                    <div className="text-[11px] text-neutral-400 mb-1">
                      Consensus: <span className="text-neutral-300">{alert.details.consensus}</span>
                    </div>
                  )}
                  {alert.details.priceTarget && (
                    <div className="text-[11px] text-neutral-400 mb-1">
                      Target: <span className="text-neutral-300">${alert.details.priceTarget.consensus.toFixed(2)}</span>
                      {alert.details.priceTarget.upside && (
                        <span className={`ml-2 ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({isBullish ? '+' : ''}{(alert.details.priceTarget.upside * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  )}
                  {alert.details.insiderTrading && (
                    <div className="text-[11px] text-neutral-400">
                      Insider: <span className="text-neutral-300">
                        {alert.details.insiderTrading.net && alert.details.insiderTrading.net > 0 ? '+' : ''}
                        {alert.details.insiderTrading.net || 0} net
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Infos Company (si disponible) */}
            {signal.company && (
              <div className="relative flex gap-5 group opacity-80">
                <div className="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-400/10 mt-1.5 flex-shrink-0 z-10"></div>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-white">Company Info</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-neutral-400">
                      <span className="text-neutral-300 font-medium">{signal.company.profile.companyName}</span>
                      <span className="ml-2">({signal.company.profile.sector})</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Market Cap: <span className="text-neutral-300">
                        ${(signal.company.quote.marketCap / 1e9).toFixed(2)}B
                      </span>
                    </div>
                    {signal.company.keyMetrics?.peRatio && (
                      <div className="text-[11px] text-neutral-400">
                        P/E: <span className="text-neutral-300">{signal.company.keyMetrics.peRatio.toFixed(2)}</span>
                      </div>
                    )}
                    {signal.company.earnings?.date && (
                      <div className="text-[11px] text-neutral-400">
                        Earnings: <span className="text-neutral-300">{signal.company.earnings.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

