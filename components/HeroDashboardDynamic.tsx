'use client'

import { useEffect, useState } from 'react'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import institutionalOwnershipService from '@/services/institutionalOwnershipService'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import flowAlertsService from '@/services/flowAlertsService'
import InstitutionDetailModal from './InstitutionDetailModal'

interface HeroDashboardDynamicProps {
  alert: FlowAlert | null
  onClose?: () => void
}

export default function HeroDashboardDynamic({ alert, onClose }: HeroDashboardDynamicProps) {
  const [ownership, setOwnership] = useState<InstitutionalOwner[]>([])
  const [loadingOwnership, setLoadingOwnership] = useState(false)
  const [ownershipError, setOwnershipError] = useState<string | null>(null)
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionalOwner | null>(null)
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false)

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
      <div className="flex transform-style-preserve-3d group w-full h-[700px] max-w-[1200px] my-16 relative perspective-[2000px] items-center justify-center">
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
            className="hero-rotate overflow-hidden bg-[#0F1012] max-w-[1300px] border-white/10 border rounded-xl mr-auto ml-auto relative left-20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] rotate-x-20 rotate-y-30 -rotate-z-20"
            style={{
              maskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, black 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, black 100%)',
            }}
          >
            <div className="shimmer"></div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-[260px_380px_1fr] divide-x divide-white/5 h-[900px]">
              {/* Sidebar */}
              <div className="flex flex-col bg-[#0F1012]">
                {/* Workspace Select */}
                <div className="flex h-14 border-white/5 border-b pr-4 pl-4 gap-y-3 items-center gap-x-0">
                  <span className="ml-3 font-medium text-gray-200">MarketFlow</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    role="img"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="ml-auto"
                    style={{ color: 'rgb(107, 114, 128)' }}
                  >
                    <path
                      fill="currentColor"
                      d="m12.37 15.835l6.43-6.63C19.201 8.79 18.958 8 18.43 8H5.57c-.528 0-.771.79-.37 1.205l6.43 6.63c.213.22.527.22.74 0"
                    ></path>
                  </svg>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex gap-3 text-gray-200 bg-white/5 border-white/5 border rounded-md pt-2 pr-3 pb-2 pl-3 gap-x-3 gap-y-3 items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-400"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    <span className="text-sm">New Alert</span>
                    <span className="ml-auto text-xs text-gray-600 border border-white/10 rounded px-1.5 py-0.5">A</span>
                  </div>
                </div>

                <div className="p-3 space-y-0.5 mt-2">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" x2="12" y1="20" y2="10"></line>
                      <line x1="18" x2="18" y1="20" y2="4"></line>
                      <line x1="6" x2="6" y1="20" y2="16"></line>
                    </svg>
                    <span className="text-sm">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span className="text-sm">Alerts</span>
                    <span className="ml-auto text-xs px-1.5 rounded text-orange-400 bg-orange-400/10">3</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    <span className="text-sm">Dark Pools</span>
                  </div>
                </div>

                <div className="mt-6 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Models</div>
                <div className="p-3 space-y-0.5">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-200 bg-white/5 cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-400"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z"></path>
                      <path d="M22 2 11 13"></path>
                    </svg>
                    <span className="text-sm">Whale Detection</span>
                  </div>
                </div>
              </div>

              {/* List View */}
              <div className="flex flex-col bg-[#0B0C0E]">
                {/* List Header */}
                <div className="flex h-14 border-white/5 border-b pr-5 pl-5 items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">Whale Detection</span>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto">
                  {/* Active Item */}
                  <div className="group flex flex-col gap-1 p-4 border-b border-white/5 bg-[#16181D] border-l-2 cursor-pointer border-l-orange-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-orange-400">{alert.ticker}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-500">High Priority</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {alert.ticker} {alert.type.toUpperCase()} • {flowAlertsService.formatPremium(alert.total_premium)} Premium
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-orange-400"></div>
                      <span className="text-xs text-gray-500">Live</span>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-700 to-orange-600 ml-auto border border-black/50 text-[10px] flex items-center justify-center text-white">
                        {whaleScore === 'WHALE' ? 'W' : whaleScore}
                      </div>
                    </div>
                  </div>
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
                <div className="p-8 overflow-y-auto custom-scrollbar pb-12">
                  <h2 className="text-2xl font-medium text-white mb-4 tracking-tight">
                    {alert.ticker} {alert.type.toUpperCase()} {alert.has_floor ? 'Floor Trade' : alert.has_sweep ? 'Sweep' : ''} • {flowAlertsService.formatPremium(alert.total_premium)} Premium
                  </h2>

                  <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
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
                          className="text-gray-400"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">
                        Detected by <span className="text-gray-200">Whale Detection Model</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className={`text-xs border px-2 py-0.5 rounded ${
                        sentiment.color === 'emerald' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {sentiment.label}
                      </span>
                    </div>
                  </div>

                  {/* Section A: Profil de l'Intervenant (13F) */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-orange-400"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profil de l'Intervenant (13F)
                    </h3>
                    
                    {loadingOwnership ? (
                      <div className="rounded-lg bg-[#090A0B] border border-white/10 p-6 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-neutral-400 mt-4">Chargement des données institutionnelles...</p>
                      </div>
                    ) : ownershipError ? (
                      <div className="rounded-lg bg-[#090A0B] border border-red-500/20 p-4">
                        <p className="text-sm text-red-400">{ownershipError}</p>
                      </div>
                    ) : ownership.length === 0 ? (
                      <div className="rounded-lg bg-[#090A0B] border border-white/10 p-6 text-center">
                        <p className="text-sm text-neutral-400">Aucune donnée institutionnelle disponible</p>
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
                    
                    {/* Note de compliance */}
                    <div className="mt-4 p-3 rounded-lg bg-neutral-900/50 border border-white/5">
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        <strong className="text-neutral-400">Note:</strong> Ces données de détention sont déclarées (13F). 
                        Il s'agit d'une corrélation informative, pas d'une preuve de l'identité du trader derrière l'alerte options.
                        Cliquez sur un intervenant pour voir ses transactions détaillées.
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
                  />

                  <div className="space-y-6 text-base text-gray-300 leading-relaxed">
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
    </section>
  )
}

