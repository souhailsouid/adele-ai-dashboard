'use client'

import { useEffect, useState } from 'react'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import institutionalOwnershipService from '@/services/institutionalOwnershipService'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { InsiderTickerFlow, Insider } from '@/types/insiderTrades'
import insiderTradesService from '@/services/insiderTradesService'
import flowAlertsService from '@/services/flowAlertsService'
import InstitutionDetailModal from './InstitutionDetailModal'
import InsiderTradesList from './InsiderTradesList'
import DarkPoolsList from './DarkPoolsList'
import UnifiedTimeline from './UnifiedTimeline'
import TickerNewsTimeline from './TickerNewsTimeline'
import Tooltip from './Tooltip'
import darkPoolsService from '@/services/darkPoolsService'
import type { DarkPoolTransaction } from '@/types/darkPools'
import EarningsHubModal from './EarningsHubModal'
import OpenInterestChart from './OpenInterestChart'

interface HeroDashboardDynamicProps {
  alert: FlowAlert | null
  onClose?: () => void
}

type TabType = 'institutional' | 'insider' | 'darkpools' | 'earnings' | 'options'

export default function HeroDashboardDynamic({ alert, onClose }: HeroDashboardDynamicProps) {
  const [activeTab, setActiveTab] = useState<TabType>('institutional')
  const [ownership, setOwnership] = useState<InstitutionalOwner[]>([])
  const [loadingOwnership, setLoadingOwnership] = useState(false)
  const [ownershipError, setOwnershipError] = useState<string | null>(null)
  const [insiderTrades, setInsiderTrades] = useState<InsiderTickerFlow[]>([])
  const [insiders, setInsiders] = useState<Insider[]>([])
  const [loadingInsiderTrades, setLoadingInsiderTrades] = useState(false)
  const [insiderTradesError, setInsiderTradesError] = useState<string | null>(null)
  const [darkPools, setDarkPools] = useState<DarkPoolTransaction[]>([])
  const [loadingDarkPools, setLoadingDarkPools] = useState(false)
  const [darkPoolsError, setDarkPoolsError] = useState<string | null>(null)
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionalOwner | null>(null)
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false)
  const [isEarningsHubOpen, setIsEarningsHubOpen] = useState(false) 
  // Charger les données 13F on-demand quand une alerte est fournie
  useEffect(() => {
    if (!alert?.ticker) {
      setOwnership([])
      return
    }

    const loadOwnership = async () => {
      setLoadingOwnership(true)
      setOwnershipError(null)
      try {
        const data = await institutionalOwnershipService.getOwnership(alert.ticker, 5)
        setOwnership(data)
      } catch (err: any) {
        setOwnershipError(err.message || 'Erreur lors du chargement des données institutionnelles')
        setOwnership([])
      } finally {
        setLoadingOwnership(false)
      }
    }

    loadOwnership()
  }, [alert?.ticker])

  // Charger les insider trades on-demand quand l'onglet est actif
  useEffect(() => {
    if (!alert?.ticker || activeTab !== 'insider') {
      return
    }

    const loadInsiderTrades = async () => {
      setLoadingInsiderTrades(true)
      setInsiderTradesError(null)
      try {
        // Charger le flow et les insiders en parallèle
        const [flowData, insidersData] = await Promise.all([
          insiderTradesService.getInsiderTrades(alert.ticker, 20),
          insiderTradesService.getInsiders(alert.ticker)
        ])
        setInsiderTrades(flowData)
        setInsiders(insidersData)
      } catch (err: any) {
        setInsiderTradesError(err.message || 'Erreur lors du chargement des insider trades')
        setInsiderTrades([])
        setInsiders([])
      } finally {
        setLoadingInsiderTrades(false)
      }
    }

    loadInsiderTrades()
  }, [alert?.ticker, activeTab])

  // Charger les Dark Pools on-demand quand l'onglet est actif
  useEffect(() => {
    if (!alert?.ticker || activeTab !== 'darkpools') {
      setDarkPools([])
      return
    }

    const loadDarkPools = async () => {
      setLoadingDarkPools(true)
      setDarkPoolsError(null)
      try {
        // Utiliser le même min_premium que flow alerts (1M$) pour la cohérence
        const minPremium = 1000000
        
        // Corrélation temporelle : filtrer les Dark Pools proches de l'alerte de flow
        // On cherche les transactions dans les 24h avant et après l'alerte
        let newerThan: string | undefined
        let olderThan: string | undefined
        
        if (alert.created_at) {
          const alertDate = new Date(alert.created_at)
          // 24h avant l'alerte
          const beforeDate = new Date(alertDate.getTime() - 24 * 60 * 60 * 1000)
          newerThan = beforeDate.toISOString()
          // 24h après l'alerte (ou maintenant si plus récent)
          const afterDate = new Date(alertDate.getTime() + 24 * 60 * 60 * 1000)
          const now = new Date()
          olderThan = afterDate < now ? afterDate.toISOString() : now.toISOString()
        } else if (alert.start_time) {
          // Utiliser start_time si created_at n'est pas disponible
          const alertDate = new Date(alert.start_time * 1000)
          const beforeDate = new Date(alertDate.getTime() - 24 * 60 * 60 * 1000)
          newerThan = beforeDate.toISOString()
          const afterDate = new Date(alertDate.getTime() + 24 * 60 * 60 * 1000)
          const now = new Date()
          olderThan = afterDate < now ? afterDate.toISOString() : now.toISOString()
        }
        
        // Taille minimale : filtrer les transactions significatives (ex: 1000 actions minimum)
        const minSize = 1000
        
        const data = await darkPoolsService.getDarkPools(
          alert.ticker, 
          30, 
          minPremium,
          minSize,
          newerThan,
          olderThan
        )
        setDarkPools(data)
      } catch (err: any) {
        setDarkPoolsError(err.message || 'Erreur lors du chargement des Dark Pools')
        setDarkPools([])
      } finally {
        setLoadingDarkPools(false)
      }
    }

    loadDarkPools()
  }, [alert?.ticker, alert?.created_at, alert?.start_time, activeTab])

  if (!alert) {
    return (
      <section className="grid grid-cols-1 gap-10 lg:gap-12 md:py-14 min-h-[500px] pt-10 pb-10 relative items-center">
        <div className="text-center text-neutral-400">
          <p>Aucune alerte sélectionnée</p>
        </div>
      </section>
    )
  }

  const sentiment = flowAlertsService.getSentiment(alert)
  const whaleScore = flowAlertsService.getWhaleScore(alert)

  return (
    <section className="grid grid-cols-1 gap-10 lg:gap-12 md:py-14 min-h-[500px] pt-10 pb-10 relative items-center">
      <div className="flex group w-full h-[700px] max-w-[1200px] my-16 relative items-center justify-center">
        <style jsx>{`
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes float-medium {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          @keyframes float-fast {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
          }
          .animate-float-medium {
            animation: float-medium 5s ease-in-out infinite;
          }
          .animate-float-fast {
            animation: float-fast 4s ease-in-out infinite;
          }
        `}</style>

        {/* DESKTOP DASHBOARD UI */}
        <div
          className="hero-perspective -mt-10 group md:px-0 md:pt-20 my-24 pt-20 pr-4 pb-20 pl-4"
          style={{
            maskImage: 'linear-gradient(180deg, transparent, black 0%, black 25%, black 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 25%, black 100%)',
          }}
        >
          <div
            className="hero-rotate overflow-hidden bg-[#0F1012] max-w-[1300px] border-white/10 border rounded-xl mr-auto ml-auto relative shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]"
            style={{
              maskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, black 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, black 100%)',
            }}
          >
            <div className="shimmer"></div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-[500px_1fr] divide-x divide-white/5 h-[900px]">


              {/* List View - Avec onglets */}
              <div className="flex flex-col bg-[#0F1012]">
                {/* List Header */}
                <div className="flex h-14 border-white/5 border-b pr-5 pl-5 items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">Analyse du Ticker</span>
                </div>

                {/* Onglets dans la List View */}
                <div className="flex flex-col border-b border-white/5">
                  {/* Active Item Info */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="group flex flex-col gap-1 p-4 border border-white/5 bg-[#16181D] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-orange-400">{alert.ticker}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <span className="text-xs text-gray-500">High Priority</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {alert.ticker} {alert.type.toUpperCase()} {alert.has_floor ? 'Floor' : alert.has_sweep ? 'Sweep' : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse bg-orange-400"></div>
                        <span className="text-xs text-gray-500">Live</span>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-700 to-orange-600 ml-auto border border-black/50 text-[10px] flex items-center justify-center text-white">
                          {whaleScore === 'WHALE' ? 'W' : whaleScore} 
                       
                        </div>
                      </div>
                      <div className="mt-2 border-t border-white/5">
                        <div className="text-xs text-gray-500">Premium</div>
                        <div className="flex items-center gap-2">

                          <div className="text-sm font-semibold text-orange-400">
                            {flowAlertsService.formatPremium(alert.total_premium)}
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <span className={`text-xs border px-2 py-0.5 rounded ${sentiment.color === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                              {sentiment.label}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  <Tooltip
                    content="Détention Institutionnelle : Positions déclarées des grands fonds et institutions (13F). Détention à long terme des 'géants' du marché."
                    position="right"
                  >
                    <button
                      onClick={() => setActiveTab('institutional')}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-2 w-full ${activeTab === 'institutional'
                        ? 'text-orange-400 border-l-orange-400 bg-[#16181D]'
                        : 'text-gray-400 border-l-transparent hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🏢</span>
                        <span>Détention Institutionnelle</span>
                      </div>
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Achats des Dirigeants : Transactions déclarées par le CEO, CFO ou les membres du conseil d'administration. Signal de confiance interne."
                    position="right"
                  >
                    <button
                      onClick={() => setActiveTab('insider')}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-2 w-full ${activeTab === 'insider'
                        ? 'text-orange-400 border-l-orange-400 bg-[#16181D]'
                        : 'text-gray-400 border-l-transparent hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>Achats des Dirigeants</span>
                      </div>
                      {insiderTrades.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                          {insiderTrades.length}
                        </span>
                      )}
                      {insiderTrades.filter(t => t.buy_sell === 'sell').length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          {insiderTrades.filter(t => t.buy_sell === 'sell').length}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Volume Caché : Transactions massives réalisées hors des bourses publiques par les banques et fonds. Accumulation invisible au marché."
                    position="right"
                  >
                    <button
                      onClick={() => setActiveTab('darkpools')}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-2 w-full ${activeTab === 'darkpools'
                        ? 'text-orange-400 border-l-orange-400 bg-[#16181D]'
                        : 'text-gray-400 border-l-transparent hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🌑</span>
                        <span>Volume Caché</span>
                      </div>
                      {darkPools.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                          {darkPools.length}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Résultats Trimestriels : Analyse historique des bénéfices par action (EPS), taux de beat, et performance post-annonce."
                    position="right"
                  >
                    <button
                      onClick={() => {
                        setActiveTab('earnings')
                        setIsEarningsHubOpen(true)
                      }}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-2 w-full ${activeTab === 'earnings'
                        ? 'text-orange-400 border-l-orange-400 bg-[#16181D]'
                        : 'text-gray-400 border-l-transparent hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span>Résultats Trimestriels</span>
                      </div>
                    </button>
                  </Tooltip>
                  <Tooltip
                    content="Open Interest par Strike : Visualisation de l'intérêt ouvert (OI) pour les calls et puts à chaque strike. Permet d'identifier les niveaux de support/résistance et les zones d'accumulation."
                    position="right"
                  >
                    <button
                      onClick={() => setActiveTab('options')}
                      className={`group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-l-2 w-full ${activeTab === 'options'
                        ? 'text-orange-400 border-l-orange-400 bg-[#16181D]'
                        : 'text-gray-400 border-l-transparent hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📈</span>
                        <span>Open Interest</span>
                      </div>
                    </button>
                  </Tooltip>
                </div>

                  {/* Timeline Unifiée */}
                  <div className="mt-6">
                    <UnifiedTimeline
                      alert={alert}
                      ownership={ownership}
                      insiderTrades={insiderTrades}
                      darkPools={darkPools}
                    />
                  </div>

              </div>
              {/* Detail View */}
              <div className="flex flex-col bg-[#0B0C0E] relative">
                {/* Detail Header */}
                <div className="flex h-14 border-white/5 border-b pr-6 pl-6 items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs font-mono">Whale Detection</span>
                    <span className="text-xs">/</span>
                    <span className="text-xs font-mono text-gray-300">{alert.ticker}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">



                  {/* Section A: Contenu des onglets (sans les onglets, ils sont dans la 2ème colonne) */}
                  <div className="">

                    {/* Contenu des onglets */}
                    {activeTab === 'institutional' && (
                      <>
                        {loadingOwnership ? (
                          <div className="rounded-lg bg-[#090A0B] border border-white/10 p-6 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-sm text-neutral-400 mt-4">Chargement des données institutionnelles...</p>
                          </div>
                        ) : ownershipError ? (
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
                                <p className="text-sm text-orange-400 font-medium">Données non disponibles</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {ownershipError.includes('réponse vide') || ownershipError.includes('type incorrect')
                                    ? 'Le ticker n\'a peut-être pas de données institutionnelles disponibles.'
                                    : ownershipError.includes('tableau')
                                      ? 'Aucune donnée institutionnelle trouvée pour ce ticker.'
                                      : ownershipError}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : ownership.length === 0 && !loadingOwnership ? (
                          <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden relative">
                            <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex items-center justify-between">
                              <span className="text-xs text-gray-500 font-mono">Données Institutionnelles</span>
                              {onClose && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onClose()
                                  }}
                                  className="p-1.5 rounded-lg bg-neutral-800/80 border border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-lg z-10 cursor-pointer"
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
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <p className="text-sm text-neutral-400">Aucune donnée institutionnelle disponible pour ce ticker</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden flex flex-col max-h-[400px]">
                            <div className="px-4 py-3 bg-[#131416] border-b border-white/5 flex-shrink-0 flex items-center justify-between relative">
                              <span className="text-xs text-gray-500 font-mono">Top 5 Détenteurs Institutionnels</span>
                              {onClose && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onClose()
                                  }}
                                  className="p-2 rounded-lg bg-neutral-800/80 border border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-lg z-10 cursor-pointer"
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
                            <div className="divide-y divide-white/5 overflow-y-auto flex-1 custom-scrollbar">
                              {ownership.map((owner, idx) => {
                                const hasRecentActivity = institutionalOwnershipService.hasRecentActivity(owner)
                                return (
                                  <div
                                    key={idx}
                                    className="p-4 hover:bg-[#131416] transition-colors cursor-pointer"
                                    onClick={() => {
                                      setSelectedInstitution(owner)
                                      setIsInstitutionModalOpen(true)
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400">
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-white">{owner.name}</div>
                                          {owner.cik && (
                                            <div className="text-xs text-gray-500 font-mono">CIK: {owner.cik}</div>
                                          )}
                                        </div>
                                      </div>
                                      {hasRecentActivity && alert.has_floor && (
                                        <span className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          Activité corrélée
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                                      <div>
                                        <span className="text-gray-500">Ownership:</span>
                                        <span className="ml-2 text-white font-mono">
                                          {owner.ownership_perc !== undefined
                                            ? institutionalOwnershipService.formatOwnershipPercent(owner.ownership_perc)
                                            : 'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Units:</span>
                                        <span className="ml-2 text-white font-mono">
                                          {owner.units.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Market Value:</span>
                                        <span className="ml-2 text-white font-mono">
                                          {institutionalOwnershipService.formatMarketValue(owner.value)}
                                        </span>
                                      </div>
                                      {owner.short_name && (
                                        <div className="col-span-2">
                                          <span className="text-gray-500">Short Name:</span>
                                          <span className="ml-2 text-white">{owner.short_name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'insider' && (
                      <InsiderTradesList
                        trades={insiderTrades}
                        insiders={insiders}
                        loading={loadingInsiderTrades}
                        error={insiderTradesError}
                        onClose={onClose}
                      />
                    )}

                    {activeTab === 'darkpools' && (
                      <DarkPoolsList
                        transactions={darkPools}
                        loading={loadingDarkPools}
                        error={darkPoolsError}
                        onClose={onClose}
                      />
                    )}

                    {activeTab === 'options' && alert?.ticker && (
                      <div className="space-y-4">
                        <OpenInterestChart
                          ticker={alert.ticker}
                          currentPrice={alert.strike}
                          showRangeFilter={true}
                        />
                      </div>
                    )}

          

                    {/* Note de compliance */}
                    <div className="mt-4 p-3 rounded-lg bg-neutral-900/50 border border-white/5">
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        <strong className="text-neutral-400">Note:</strong> {activeTab === 'institutional'
                          ? "Ces données de détention sont déclarées (13F). Il s'agit d'une corrélation informative, pas d'une preuve de l'identité du trader derrière l'alerte options. Cliquez sur un intervenant pour voir ses transactions détaillées."
                          : activeTab === 'insider'
                            ? "Les achats des dirigeants sont des transactions déclarées par le CEO, CFO ou les membres du conseil d'administration. Ces données peuvent fournir des signaux précieux sur la confiance des dirigeants dans leur entreprise."
                            : activeTab === 'darkpools'
                              ? "Le volume caché représente des transactions massives réalisées hors des bourses publiques par les banques et fonds. Ces échanges permettent d'accumuler ou de distribuer des positions sans impacter le marché visible."
                              : activeTab === 'options'
                                ? "L'Open Interest (OI) représente le nombre total de contrats d'options ouverts (non exercés) à chaque strike. Les pics d'OI peuvent indiquer des niveaux de support/résistance importants et des zones d'accumulation institutionnelle."
                                : "L'analyse des résultats trimestriels examine l'historique des bénéfices par action (EPS), le taux de beat des estimations, et la réaction du marché post-annonce. Ces données aident à évaluer la qualité des résultats de l'entreprise."}
                      </p>
                    </div>
                  </div>


                  {/* Modal pour les détails de l'institution */}
                  <InstitutionDetailModal
                    isOpen={isInstitutionModalOpen}
                    onClose={() => {
                      setIsInstitutionModalOpen(false)
                      setSelectedInstitution(null)
                    }}
                    institution={selectedInstitution}
                    alert={alert}
                    insiderTrades={insiderTrades}
                    darkPools={darkPools}
                    disableBackdropClose={isEarningsHubOpen}
                  />

              

                  <div className="space-y-6 text-base text-gray-300 leading-relaxed mt-6">
                    <p>
                      The Whale Detection model has identified an unusual {alert.type} {alert.has_floor ? 'floor trade' : alert.has_sweep ? 'sweep' : 'transaction'}
                      on {alert.ticker} with a premium of {flowAlertsService.formatPremium(alert.total_premium)} at
                      the ${alert.strike} strike. This transaction deviates significantly from normal volume patterns and suggests
                      institutional {sentiment.label.toLowerCase()} sentiment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
     
        </div>
      </div>
      {alert?.ticker && (
        <EarningsHubModal
          isOpen={isEarningsHubOpen}
          onClose={() => {
            setIsEarningsHubOpen(false)
          }}
          ticker={alert.ticker}
        />
      )}
    </section>
  )
}

