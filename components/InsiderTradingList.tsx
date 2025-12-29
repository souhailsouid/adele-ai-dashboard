/**
 * Liste des Transactions Insider Trading
 * Style inspiré de HeroDashboard avec structure List View
 */

'use client'

import { useState, useEffect } from 'react'
import insiderTradingService from '@/services/insiderTradingService'
import type { InsiderTradingTransaction } from '@/types/insiderTrading'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'

interface InsiderTradingListProps {
  symbol?: string
  maxItems?: number
}

export default function InsiderTradingList({ symbol, maxItems = 20 }: InsiderTradingListProps) {
  const [transactions, setTransactions] = useState<InsiderTradingTransaction[]>([])
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

    const loadTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await insiderTradingService.getLatestInsiderTrading({
          symbol,
          limit: maxItems,
        })

        setTransactions(response.data || [])
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des transactions')
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [symbol, maxItems, mounted, isAuthenticated])

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
          <p className="text-sm text-neutral-500 mb-6">Vous devez être connecté pour voir les transactions Insider Trading</p>
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
          <p className="text-neutral-400 mt-4">Chargement des transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
        <div className="p-12 text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Grouper par symbol si pas de filtre
  const groupedTransactions = symbol
    ? { [symbol]: transactions }
    : transactions.reduce((acc, tx) => {
        if (!acc[tx.symbol]) {
          acc[tx.symbol] = []
        }
        acc[tx.symbol].push(tx)
        return acc
      }, {} as Record<string, InsiderTradingTransaction[]>)

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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="text-base font-medium text-neutral-200">Insider Trading</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{transactions.length}</span>
        </div>
      </div>

      {/* List View */}
      <div className="flex flex-col bg-[#0B0C0E]">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-400 text-sm">Aucune transaction Insider Trading pour le moment</p>
            {symbol && (
              <p className="text-xs text-neutral-500 mt-2">Ticker: {symbol}</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[800px]">
            {Object.entries(groupedTransactions).map(([symbolKey, txs]) => (
              <div key={symbolKey}>
                {!symbol && Object.keys(groupedTransactions).length > 1 && (
                  <div className="px-4 py-2 border-b border-white/5">
                    <h3 className="text-xs font-medium text-neutral-400 uppercase">{symbolKey}</h3>
                  </div>
                )}
                {txs.map((tx, idx) => {
                  const isAcquisition = tx.acquisitionOrDisposition === 'A'
                  const transactionValue = insiderTradingService.calculateTransactionValue(tx)
                  const isFirst = idx === 0

                  return (
                    <div
                      key={`${tx.symbol}-${tx.filingDate}-${idx}`}
                      className={`group flex flex-col gap-1 p-4 border-b border-white/5 cursor-pointer transition-colors ${
                        isFirst ? 'bg-[#16181D] border-l-2 border-l-orange-500' : 'hover:bg-[#131416]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono ${isFirst ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                          {tx.symbol}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <span className="text-xs text-gray-500">{tx.reportingName}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${isAcquisition ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isAcquisition ? '🟢 ACHAT' : '🔴 VENTE'}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {tx.securitiesTransacted.toLocaleString()} {tx.securityName.includes('Stock') ? 'shares' : 'units'}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mb-1">
                            {tx.typeOfOwner} • {tx.transactionType}
                          </div>
                          {tx.price > 0 && (
                            <div className="text-xs text-neutral-500">
                              Prix: ${tx.price.toFixed(2)} • Valeur: {insiderTradingService.formatAmount(transactionValue)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-500 mb-1">
                            {insiderTradingService.formatRelativeDate(tx.transactionDate)}
                          </div>
                          <a
                            href={tx.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            SEC Form {tx.formType} →
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

