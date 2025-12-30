'use client'

import { useState } from 'react'
import type { DarkPoolTransaction } from '@/types/darkPools'
import darkPoolsService from '@/services/darkPoolsService'

interface DarkPoolsListProps {
  transactions: DarkPoolTransaction[]
  loading: boolean
  error: string | null
  onClose?: () => void
}

export default function DarkPoolsList({ transactions, loading, error, onClose }: DarkPoolsListProps) {
  const [showOnlyLarge, setShowOnlyLarge] = useState(false)

  // Filtrer les transactions massives (> 5M$)
  const largeTransactions = transactions.filter(t => parseFloat(t.premium) >= 5000000)
  const filteredTransactions = showOnlyLarge ? largeTransactions : transactions

  if (loading) {
    return (
      <div className="rounded-lg bg-[#090A0B] border border-white/10 p-6 text-center">
        <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-400 mt-4">Chargement des Dark Pools...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-[#090A0B] border border-orange-500/20 p-4">
        <div className="flex items-start gap-2">
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
            className="text-orange-400 mt-0.5 flex-shrink-0"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <p className="text-sm text-orange-400 font-medium">Erreur de chargement</p>
            <p className="text-xs text-neutral-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden relative">
        <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">Dark Pools</span>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onClose()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="p-1.5 rounded-lg bg-neutral-800/80 border border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 shadow-lg cursor-pointer relative z-[100]"
              aria-label="Fermer"
              style={{ pointerEvents: 'auto' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
          )}
        </div>
        <div className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-500"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <p className="text-sm text-neutral-400">Aucune transaction Dark Pool disponible pour ce ticker</p>
          </div>
        </div>
      </div>
    )
  }

  const totalPremium = transactions.reduce((sum, t) => sum + parseFloat(t.premium), 0)

  return (
    <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden flex flex-col max-h-[400px] relative">
      <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-500 font-mono">Dark Pools ({transactions.length})</span>
            {largeTransactions.length > 0 && (
              <button
                onClick={() => setShowOnlyLarge(!showOnlyLarge)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  showOnlyLarge
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-orange-500/10 text-orange-400/70 border border-orange-500/20 hover:bg-orange-500/20 hover:text-orange-400'
                }`}
              >
                {largeTransactions.length} baleines (&gt;5M$)
              </button>
            )}
            <div className="text-xs text-gray-500 ml-auto">
              Total: <span className="text-orange-400">{darkPoolsService.formatCurrency(totalPremium)}</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onClose()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="p-1.5 rounded-lg bg-neutral-800/80 border border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 shadow-lg cursor-pointer relative z-[100]"
              aria-label="Fermer"
              style={{ pointerEvents: 'auto' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
          )}
        </div>
      </div>
      <div className="divide-y divide-white/5 overflow-y-auto flex-1 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-neutral-400">Aucune transaction massive trouvée</p>
          </div>
        ) : (
          filteredTransactions.map((tx, idx) => {
            const isRecent = darkPoolsService.isRecentTransaction(tx)
            const premium = parseFloat(tx.premium)
            const isLarge = premium >= 5000000
            
            return (
              <div
                key={idx}
                className="p-4 hover:bg-[#131416]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-white">
                        {tx.size.toLocaleString()} actions
                      </div>
                      {isRecent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Récent
                        </span>
                      )}
                      {isLarge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Baleine
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Market Center: {tx.market_center} • Volume: {tx.volume.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-orange-400">
                      {darkPoolsService.formatCurrency(tx.premium)}
                    </div>
                    <div className="text-xs text-gray-500">
                      @ ${parseFloat(tx.price).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <span className="text-gray-500">NBBO Ask:</span>
                    <span className="ml-2 text-white font-mono">${parseFloat(tx.nbbo_ask).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">NBBO Bid:</span>
                    <span className="ml-2 text-white font-mono">${parseFloat(tx.nbbo_bid).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Heure:</span>
                    <span className="ml-2 text-white">
                      {darkPoolsService.formatRelativeDate(tx.executed_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Settlement:</span>
                    <span className="ml-2 text-white">{tx.trade_settlement}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

