'use client'

import { useEffect, useState } from 'react'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import institutionActivityService from '@/services/institutionActivityService'
import institutionHoldingsService from '@/services/institutionHoldingsService'
import type { InstitutionActivityItem } from '@/types/institutionActivity'
import type { InstitutionHolding } from '@/types/institutionHoldings'
import InstitutionTimelineModal from './InstitutionTimelineModal'

interface InstitutionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  institution: InstitutionalOwner | null
  alert: FlowAlert | null
}

export default function InstitutionDetailModal({
  isOpen,
  onClose,
  institution,
  alert,
}: InstitutionDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'holdings' | 'activity'>('holdings')
  const [holdings, setHoldings] = useState<InstitutionHolding[]>([])
  const [activity, setActivity] = useState<InstitutionActivityItem[]>([])
  const [loadingHoldings, setLoadingHoldings] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(true) // Timeline ouverte par défaut

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setTimeout(() => setIsVisible(true), 10)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      setTimeout(() => setIsMounted(false), 300)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Réinitialiser tous les states et charger les données quand l'institution change
  useEffect(() => {
    if (!institution?.cik || !isOpen) return

    // Réinitialiser les données pour éviter l'affichage saccadé
    setHoldings([])
    setActivity([])
    setError(null)
    setActiveTab('holdings')
    setIsTimelineModalOpen(true)

    // Charger les données initiales (holdings) immédiatement
    const loadInitialData = async () => {
      setLoadingHoldings(true)
      setError(null)
      const reportDate = '2025-09-30' // Date du dernier rapport

      try {
        // Récupérer plus de données pour inclure les ventes (qui sont triées à la fin)
        const data = await institutionHoldingsService.getHoldings(
          institution.cik,
          reportDate,
          200, // Augmenter la limite pour inclure les ventes
          'units_change',
          'desc'
        )
        setHoldings(data)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des holdings')
      } finally {
        setLoadingHoldings(false)
      }
    }

    loadInitialData()
  }, [institution?.cik, isOpen])

  // Charger les données quand on change d'onglet (seulement pour activity)
  useEffect(() => {
    if (!institution?.cik || !isOpen || activeTab !== 'activity') return
    // Ne charger activity que si on est sur l'onglet activity et qu'on n'a pas encore de données
    if (activity.length > 0 || loadingActivity) return

    const loadActivityData = async () => {
      setLoadingActivity(true)
      setError(null)
      const reportDate = '2025-09-30' // Date du dernier rapport

      try {
        const data = await institutionActivityService.getActivity(institution.cik, reportDate, 100)
        setActivity(data)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement de l\'activité')
      } finally {
        setLoadingActivity(false)
      }
    }

    loadActivityData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, institution?.cik, isOpen])

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

  if (!isMounted || !institution) return null

  const topPurchases = institutionHoldingsService.getTopPurchases(holdings, 5)
  const topSales = institutionHoldingsService.getTopSales(holdings, 5)
  const sharesActivity = institutionActivityService.filterSharesOnly(activity).slice(0, 10)

  return (
    <>
      {/* Backdrop - Réduire l'opacité pour améliorer la lisibilité */}
      <div
        className={`fixed inset-0 z-[110] bg-black/60 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal - Positioned to the left */}
      <div
        className={`fixed left-0 top-20 bottom-0 z-[111] transition-all duration-300 ${
          isTimelineModalOpen ? 'right-[500px]' : 'right-0 max-w-7xl ml-auto mr-auto'
        } ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative overflow-hidden bg-neutral-900 ring-1 ring-white/10 shadow-2xl flex flex-col ${
            isTimelineModalOpen
              ? 'h-full rounded-l-2xl border-r border-white/5'
              : 'w-full max-w-7xl max-h-[90vh] rounded-2xl'
          }`}
        >
          {/* Background gradient - Réduire l'intensité pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.04),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.04),transparent_45%)] pointer-events-none"></div>

          {/* Content */}
          <div className="relative flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 relative">
              {/* Close button - Top left */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-30 p-2.5 rounded-lg bg-neutral-800 border-2 border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-xl"
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
              <div className="flex items-center justify-between mb-4 pl-12">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{institution.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-neutral-400 font-mono">CIK: {institution.cik}</span>
                    {institution.short_name && (
                      <span className="text-sm text-neutral-500">{institution.short_name}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-400">Valeur du Portfolio</div>
                  <div className="text-xl font-semibold text-white">
                    {institutionHoldingsService.formatMarketValue(institution.value)}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/5">
                <button
                  onClick={() => setActiveTab('holdings')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'holdings'
                      ? 'text-orange-400 border-b-2 border-orange-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Changements Récents
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'text-orange-400 border-b-2 border-orange-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Derniers Trades
                </button>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Main Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
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
                        <p className="text-sm text-orange-400 font-medium">Données non disponibles</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {error.includes('données manquantes') || error.includes('tableau')
                            ? 'Aucune donnée disponible pour cette institution à cette date.'
                            : error.includes('réponse vide') || error.includes('type incorrect')
                            ? 'L\'API n\'a pas retourné de données valides.'
                            : error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'holdings' && (
                  <div className="space-y-8 pb-8">
                    {/* Top Purchases */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      Top 5 Achats
                    </h3>
                    {loadingHoldings ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                      </div>
                    ) : topPurchases.length > 0 ? (
                      <div className="space-y-3">
                        {topPurchases.map((holding, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg bg-neutral-800/50 border border-white/5 hover:border-orange-500/20 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-orange-400">{holding.ticker}</span>
                                <span className="text-xs text-neutral-500">{holding.full_name}</span>
                              </div>
                              <span className="text-sm font-semibold text-emerald-400">
                                +{holding.units_change.toLocaleString()} units
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-neutral-500">Valeur:</span>
                                <span className="ml-2 text-white">
                                  {institutionHoldingsService.formatMarketValue(holding.value)}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Changement:</span>
                                <span className="ml-2 text-emerald-400">
                                  {institutionHoldingsService.formatChangePercent(holding.change_perc)}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Prix:</span>
                                <span className="ml-2 text-white">
                                  {holding.close ? `$${parseFloat(holding.close).toFixed(2)}` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">Aucun achat récent</p>
                    )}
                  </div>

                  {/* Top Sales */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      Top 5 Ventes
                    </h3>
                    {loadingHoldings ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                      </div>
                    ) : topSales.length > 0 ? (
                      <div className="space-y-3">
                        {topSales.map((holding, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg bg-neutral-800/50 border border-white/5 hover:border-red-500/20 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-orange-400">{holding.ticker}</span>
                                <span className="text-xs text-neutral-500">{holding.full_name}</span>
                              </div>
                              <span className="text-sm font-semibold text-red-400">
                                {holding.units_change.toLocaleString()} units
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-neutral-500">Valeur:</span>
                                <span className="ml-2 text-white">
                                  {institutionHoldingsService.formatMarketValue(holding.value)}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Changement:</span>
                                <span className="ml-2 text-red-400">
                                  {institutionHoldingsService.formatChangePercent(holding.change_perc)}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Prix:</span>
                                <span className="ml-2 text-white">
                                  {holding.close ? `$${parseFloat(holding.close).toFixed(2)}` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400">Aucune vente récente</p>
                    )}
                  </div>
                </div>
              )}

                {activeTab === 'activity' && (
                  <div className="pb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Derniers Trades</h3>
                  {loadingActivity ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    </div>
                  ) : sharesActivity.length > 0 ? (
                    <div className="space-y-3">
                      {sharesActivity.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-neutral-800/50 border border-white/5 hover:border-orange-500/20 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-mono text-orange-400">{item.ticker}</span>
                            <span className="text-xs text-neutral-500">{item.filing_date}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-neutral-500">Units:</span>
                              <span className="ml-2 text-white">{item.units.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Prix d'achat:</span>
                              <span className="ml-2 text-white">
                                {institutionActivityService.formatPrice(item.buy_price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Prix de vente:</span>
                              <span className="ml-2 text-white">
                                {institutionActivityService.formatPrice(item.sell_price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Prix actuel:</span>
                              <span className="ml-2 text-white">
                                {institutionActivityService.formatPrice(item.close)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400">Aucune activité récente</p>
                  )}
                  </div>
                )}

                {/* Corrélation avec l'alerte */}
                {alert && institution && (
                  <div className="mt-8 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
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
                        >
                          <path d="m22 2-7 20-4-9-9-4Z"></path>
                          <path d="M22 2 11 13"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Corrélation avec l'alerte</div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Cette institution détient {alert.ticker} qui vient de déclencher un{' '}
                          {alert.has_floor ? 'Call Floor' : alert.has_sweep ? 'Sweep' : 'transaction'}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Modal - Positioned to the right */}
      {isMounted && (
        <InstitutionTimelineModal
          key={`timeline-${institution?.cik}`} // Force le remount quand l'institution change
          isOpen={isTimelineModalOpen && isOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          institution={institution}
          alert={alert}
          holdings={holdings}
        />
      )}
    </>
  )
}

