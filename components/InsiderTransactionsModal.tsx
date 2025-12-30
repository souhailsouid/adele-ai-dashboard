'use client'

import { useEffect, useState } from 'react'
import type { InsiderTransactionDetail, Insider } from '@/types/insiderTrades'
import insiderTradesService from '@/services/insiderTradesService'

interface InsiderTransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  ticker: string
  insiders: Insider[]
  tradeSummary?: {
    transactions: number
    volume: number
    premium: string
    uniq_insiders: number
  }
}

export default function InsiderTransactionsModal({
  isOpen,
  onClose,
  date,
  ticker,
  insiders,
  tradeSummary,
}: InsiderTransactionsModalProps) {
  const [transactions, setTransactions] = useState<InsiderTransactionDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setTimeout(() => setIsVisible(true), 10)
      loadTransactions()
    } else {
      setIsVisible(false)
      setTimeout(() => setIsMounted(false), 300)
    }
  }, [isOpen, date, ticker])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await insiderTradesService.getTransactions(ticker, date)
      setTransactions(data)
    } catch (err) {
      console.error('Erreur lors du chargement des transactions:', err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  const transactionCodeLabels: Record<string, string> = {
    S: 'Vente',
    P: 'Achat',
    M: 'Exercice',
    A: 'Acquisition',
    G: 'Don',
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-start justify-center pt-16 md:pt-20 p-2 md:p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.08),transparent_45%)] pointer-events-none z-0"></div>

          {/* Close button */}
          <div className="absolute top-4 right-4 z-[200] pointer-events-auto backdrop-blur-sm">
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-2.5 rounded-lg bg-neutral-800 border-2 border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-xl cursor-pointer"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
              >
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="relative overflow-y-auto max-h-[90vh] z-10">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                Transactions du {formatDate(date)}
              </h2>
              {tradeSummary && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>
                    {tradeSummary.transactions} transaction{tradeSummary.transactions > 1 ? 's' : ''}
                  </span>
                  <span>
                    {tradeSummary.uniq_insiders} insider{tradeSummary.uniq_insiders > 1 ? 's' : ''}
                  </span>
                  <span className="text-orange-400">
                    {insiderTradesService.formatCurrency(tradeSummary.premium)}
                  </span>
                </div>
              )}
            </div>

            {/* Transactions List */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-neutral-400 mt-4">Chargement des transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-neutral-400">Aucune transaction disponible pour cette date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const correlatedInsider = insiderTradesService.correlateTransactionWithInsider(tx, insiders)
                    const isBuy = tx.amount > 0
                    const amount = Math.abs(tx.amount)

                    return (
                      <div
                        key={tx.id}
                        className="p-4 rounded-lg bg-[#131416] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-semibold text-white">{tx.owner_name}</h3>
                              {correlatedInsider && (
                                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                  ID: {correlatedInsider.id}
                                </span>
                              )}
                              {tx.is_10b5_1 ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  10b5-1
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Direct
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-sm text-gray-400">
                              {tx.officer_title && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Rôle:</span>
                                  <span className="text-white">{tx.officer_title}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Type:</span>
                                <span className="text-white">
                                  {transactionCodeLabels[tx.transaction_code] || tx.transaction_code}
                                </span>
                                {(tx.is_director || tx.is_officer) && (
                                  <>
                                    {tx.is_director && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        Directeur
                                      </span>
                                    )}
                                    {tx.is_officer && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        Officier
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {tx.security_title && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Titre:</span>
                                  <span className="text-white">{tx.security_title}</span>
                                </div>
                              )}
                              {tx.filing_date && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Déclaration:</span>
                                  <span className="text-white">
                                    {new Date(tx.filing_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${
                              isBuy ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {isBuy ? '+' : '-'}{insiderTradesService.formatCurrency(tx.amount)}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {amount.toLocaleString()} action{amount > 1 ? 's' : ''}
                            </div>
                            {tx.price && parseFloat(tx.price) > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                @ ${parseFloat(tx.price).toFixed(2)}
                              </div>
                            )}
                            {tx.shares_owned_after !== null && (
                              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-white/5">
                                Possession: {tx.shares_owned_after.toLocaleString()} actions
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional details */}
                        {(tx.natureofownership || tx.director_indirect) && (
                          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
                            {tx.natureofownership && (
                              <div>Nature: {tx.natureofownership}</div>
                            )}
                            {tx.director_indirect && (
                              <div>
                                Type: {tx.director_indirect === 'D' ? 'Direct' : 'Indirect'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

