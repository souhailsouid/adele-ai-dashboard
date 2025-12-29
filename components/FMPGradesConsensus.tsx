/**
 * Composant Consensus des Grades d'Analystes
 * Style inspiré de MacroCalendar
 */

'use client'

import { useState, useEffect } from 'react'
import fmpGradesService from '@/services/fmpGradesService'
import type { FMPConsensusResponse } from '@/types/fmpSignals'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface FMPGradesConsensusProps {
  symbol: string
}

export default function FMPGradesConsensus({ symbol }: FMPGradesConsensusProps) {
  const [consensus, setConsensus] = useState<FMPConsensusResponse | null>(null)
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

    const loadConsensus = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fmpGradesService.getGradesConsensus(symbol, true)
        setConsensus(response)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du consensus')
      } finally {
        setLoading(false)
      }
    }

    loadConsensus()
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
            <p className="text-neutral-400 mt-4 text-sm">Chargement du consensus...</p>
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

  if (!consensus || !consensus.data || consensus.data.length === 0) {
    return (
      <div className="relative w-full max-w-[500px]">
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md p-6 text-center">
            <p className="text-neutral-400 text-sm">Aucun consensus disponible pour {symbol}</p>
          </div>
        </div>
      </div>
    )
  }

  const data = consensus.data[0]
  const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell
  const bullish = data.strongBuy + data.buy
  const bearish = data.sell + data.strongSell
  const consensusLower = data.consensus.toLowerCase()

  const consensusColor =
    consensusLower.includes('strong buy') || consensusLower === 'buy'
      ? 'text-emerald-400'
      : consensusLower.includes('strong sell') || consensusLower === 'sell'
      ? 'text-red-400'
      : 'text-orange-400'

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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Analyst Consensus</div>
                <div className="text-[10px] text-neutral-500 font-mono">{symbol}</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${consensusColor} border ${consensusColor.replace('text-', 'border-').replace('400', '500/20')}`}>
              {data.consensus}
            </span>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Barre de progression globale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Total Analysts</span>
                <span className="text-neutral-300 font-medium">{total}</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(bullish / total) * 100}%` }}
                  />
                  <div
                    className="bg-orange-500"
                    style={{ width: `${(data.hold / total) * 100}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${(bearish / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Détails des ratings */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/5">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{data.strongBuy}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Strong Buy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-300">{data.buy}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Buy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{data.hold}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Hold</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-300">{data.sell}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Sell</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{data.strongSell}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Strong Sell</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

