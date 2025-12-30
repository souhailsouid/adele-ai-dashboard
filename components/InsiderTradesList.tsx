'use client'

import { useState } from 'react'
import type { InsiderTickerFlow, Insider } from '@/types/insiderTrades'
import insiderTradesService from '@/services/insiderTradesService'
import InsiderTransactionsModal from './InsiderTransactionsModal'

interface InsiderTradesListProps {
  trades: InsiderTickerFlow[]
  insiders: Insider[]
  loading: boolean
  error: string | null
  onClose?: () => void
}

type ViewType = 'flow' | 'insiders'

export default function InsiderTradesList({ trades, insiders, loading, error, onClose }: InsiderTradesListProps) {
  const [activeView, setActiveView] = useState<ViewType>('flow')
  const [showOnlySells, setShowOnlySells] = useState(false)
  const [selectedInsiderId, setSelectedInsiderId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtrer les trades selon le filtre actif
  const filteredTrades = showOnlySells
    ? trades.filter(t => t.buy_sell === 'sell')
    : trades

  const sellCount = trades.filter(t => t.buy_sell === 'sell').length

  // Ouvrir la modal pour une date
  const handleDateClick = (date: string, ticker: string, trade: InsiderTickerFlow) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  // Obtenir le ticker depuis les trades
  const ticker = trades.length > 0 ? trades[0].ticker : ''
  
  // Trouver le trade sélectionné pour le résumé
  const selectedTrade = selectedDate ? trades.find(t => t.date === selectedDate) : undefined
  if (loading) {
    return (
      <div className="rounded-lg bg-[#090A0B] border border-white/10 p-6 text-center">
        <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-400 mt-4">Chargement des insider trades...</p>
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

  if (trades.length === 0) {
    return (
      <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden relative mt-[200px]">
        <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">Insider Trades</span>
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p className="text-sm text-neutral-400">Aucun insider trade disponible pour ce ticker</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden flex flex-col max-h-[400px] relative">
      <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex-shrink-0 relative z-10">
        {/* Onglets Flow / Insiders */}
        <div className="flex gap-2 mb-3 border-b border-white/10">
          <button
            onClick={() => {
              setActiveView('flow')
              setSelectedInsiderId(null)
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              activeView === 'flow'
                ? 'text-orange-400 border-orange-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Flow ({trades.length})
          </button>
          <button
            onClick={() => {
              setActiveView('insiders')
              setShowOnlySells(false)
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              activeView === 'insiders'
                ? 'text-orange-400 border-orange-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Insiders ({insiders.length})
          </button>
        </div>

        {/* Header avec filtres */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {activeView === 'flow' && (
              <>
                <div className="flex items-center gap-1.5 text-[12px] text-yellow-500 px-2 py-1 rounded bg-white/5 border border-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-orange-400/70"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Cliquez sur une date pour consulter les détails</span>
                </div>
                {sellCount > 0 && (
                  <button
                    onClick={() => setShowOnlySells(!showOnlySells)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      showOnlySells
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-red-500/10 text-red-400/70 border border-red-500/20 hover:bg-red-500/20 hover:text-red-400'
                    }`}
                  >
                    {sellCount} ventes
                  </button>
                )}
              </>
            )}
            {activeView === 'insiders' && selectedInsiderId && (
              <button
                onClick={() => setSelectedInsiderId(null)}
                className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
              >
                Filtrer: {insiders.find(i => i.id === selectedInsiderId)?.display_name}
                <span className="ml-1">×</span>
              </button>
            )}
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
        {activeView === 'flow' ? (
          <>
            {filteredTrades.length === 0 && showOnlySells ? (
              <div className="p-6 text-center">
                <p className="text-sm text-neutral-400">Aucune vente trouvée</p>
              </div>
            ) : (
              filteredTrades.map((trade, idx) => {
            const isRecent = insiderTradesService.isRecentTrade(trade)
            const isBuy = trade.buy_sell === 'buy'
            const volume = Math.abs(trade.volume)
            
            return (
              <div
                key={idx}
                className="p-4 hover:bg-[#131416]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => handleDateClick(trade.date, trade.ticker, trade)}
                        className="group flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-white hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/30 transition-all cursor-pointer"
                        title="Cliquer pour voir les détails des transactions"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-orange-400/70 group-hover:text-orange-400 transition-colors"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>{new Date(trade.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-60 group-hover:opacity-100 transition-opacity text-orange-400"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </button>
                      {isRecent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Récent
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {trade.transactions} transaction{trade.transactions > 1 ? 's' : ''} • {trade.uniq_insiders} insider{trade.uniq_insiders > 1 ? 's' : ''}
                    </div>
                    {/* Afficher les insiders impliqués si disponibles */}
                    {insiders.length > 0 && trade.uniq_insiders > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-gray-500">Insiders impliqués ({trade.uniq_insiders}):</span>
                          {insiders.slice(0, Math.min(trade.uniq_insiders, 3)).map((insider) => (
                            <button
                              key={insider.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedInsiderId(insider.id)
                                setActiveView('insiders')
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                              title={`ID: ${insider.id} - ${insider.display_name}`}
                            >
                              {insider.display_name.split(' ').slice(-1)[0]}
                            </button>
                          ))}
                          {trade.uniq_insiders > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveView('insiders')
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
                            >
                              +{trade.uniq_insiders - 3} autre{trade.uniq_insiders - 3 > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`text-sm font-semibold ${
                    isBuy ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {isBuy ? '+' : '-'}{insiderTradesService.formatCurrency(trade.premium)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <span className="text-gray-500">Volume:</span>
                    <span className={`ml-2 font-mono ${
                      isBuy ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isBuy ? '+' : '-'}{volume.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Prix moyen:</span>
                    <span className="ml-2 text-white font-mono">
                      ${parseFloat(trade.avg_price).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className={`ml-2 font-medium ${
                      isBuy ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isBuy ? 'Achat' : 'Vente'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 text-white">
                      {insiderTradesService.formatRelativeDate(trade.date)}
                    </span>
                  </div>
                  {trade.transactions_10b5 > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500">10b5-1:</span>
                      <span className="ml-2 text-orange-400 text-[10px]">
                        {trade.transactions_10b5} transaction{trade.transactions_10b5 > 1 ? 's' : ''} (${insiderTradesService.formatCurrency(trade.premium_10b5)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
            )}
          </>
        ) : (
          // Vue Liste des Insiders
          <>
            {insiders.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-neutral-400">Aucun insider trouvé</p>
              </div>
            ) : (
              insiders.map((insider) => {
                // Compter les transactions pour cet insider (approximation basée sur le flow)
                // On compte les jours où il y a eu de l'activité (tous les insiders sont potentiellement impliqués)
                const relatedTrades = trades.filter(t => t.uniq_insiders > 0)
                const isSelected = selectedInsiderId === insider.id
                
                // Trouver les transactions récentes (derniers 30 jours)
                const recentTrades = relatedTrades.filter(t => {
                  const tradeDate = new Date(t.date)
                  const now = new Date()
                  const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)
                  return diffDays <= 30
                })
                
                return (
                  <div
                    key={insider.id}
                    onClick={() => {
                      if (selectedInsiderId === insider.id) {
                        setSelectedInsiderId(null)
                        setActiveView('flow')
                      } else {
                        setSelectedInsiderId(insider.id)
                      }
                    }}
                    className={`p-4 hover:bg-[#131416] cursor-pointer ${
                      isSelected ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {insider.logo_url && (
                            <img
                              src={insider.logo_url}
                              alt={insider.display_name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}
                          <div className="text-sm font-medium text-white">{insider.display_name}</div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              Sélectionné
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">ID: {insider.id}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {relatedTrades.length > 0 && (
                        <div className="text-xs text-gray-400">
                          {relatedTrades.length} jour{relatedTrades.length > 1 ? 's' : ''} avec activité totale
                        </div>
                      )}
                      {recentTrades.length > 0 && (
                        <div className="text-xs text-emerald-400">
                          {recentTrades.length} jour{recentTrades.length > 1 ? 's' : ''} d'activité récente (30j)
                        </div>
                      )}
                      {selectedInsiderId === insider.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveView('flow')
                            setSelectedInsiderId(null)
                          }}
                          className="text-xs text-orange-400 hover:text-orange-300 underline"
                        >
                          Voir dans le flow →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>

      {/* Modal pour les transactions détaillées */}
      {selectedDate && ticker && (
        <InsiderTransactionsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDate(null)
          }}
          date={selectedDate}
          ticker={ticker}
          insiders={insiders}
          tradeSummary={selectedTrade ? {
            transactions: selectedTrade.transactions,
            volume: selectedTrade.volume,
            premium: selectedTrade.premium,
            uniq_insiders: selectedTrade.uniq_insiders,
          } : undefined}
        />
      )}
    </div>
  )
}

