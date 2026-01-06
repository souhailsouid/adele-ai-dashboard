/**
 * Composant d'alertes contextuelles pour les Flow Alerts
 * Inspiré du style MacroCalendar.tsx
 * Affiche dynamiquement les niveaux clés, expirations et alertes selon le ticker/catégorie
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import type { DarkPoolTransaction } from '@/types/darkPools'
import flowContextualService from '@/services/flowContextualService'
import convergenceRiskClient from '@/lib/api/convergenceRiskClient'
import type { WhaleAnalysis } from '@/types/convergenceRisk'
import darkPoolsService from '@/services/darkPoolsService'
import type { KeyLevel, ExpirationAlert, ContextualAlert } from '@/services/flowContextualService'
import EarningsHubModal from './EarningsHubModal'
import OpenInterestChart from '@/components/OpenInterestChart'
interface FlowAlertsContextualProps {
  ticker?: string
  alerts?: FlowAlert[]
  darkPools?: DarkPoolTransaction[]
  category?: string
  visibleAlertId?: string // ID de l'alerte actuellement visible dans le viewport
}

export default function FlowAlertsContextual({
  ticker,
  alerts = [],
  darkPools,
  category,
  visibleAlertId,
}: FlowAlertsContextualProps) {
  const [keyLevels, setKeyLevels] = useState<KeyLevel[]>([])
  const [whaleAnalysis, setWhaleAnalysis] = useState<WhaleAnalysis | null>(null)
  const [expirationAlerts, setExpirationAlerts] = useState<ExpirationAlert[]>([])
  const [contextualAlerts, setContextualAlerts] = useState<ContextualAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [activeTicker, setActiveTicker] = useState<string | undefined>(ticker)
  const [isEarningsHubOpen, setIsEarningsHubOpen] = useState(false)

  // Mettre à jour le ticker actif basé sur l'alerte visible avec debounce pour éviter les changements trop fréquents
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null

    const updateTicker = () => {
      // Si on survole une alerte, mettre à jour le ticker
      if (visibleAlertId && alerts.length > 0) {
        const visibleAlert = alerts.find(a => a.id === visibleAlertId)
        if (visibleAlert && visibleAlert.ticker !== activeTicker) {
          setActiveTicker(visibleAlert.ticker)
        }
      }
      // Sinon, ne pas réinitialiser - garder le dernier ticker survolé
      // Seulement initialiser si aucun ticker n'a été défini
      else if (!activeTicker) {
        if (ticker) {
          setActiveTicker(ticker)
        } else if (alerts.length > 0) {
          setActiveTicker(alerts[0].ticker)
        }
      }
    }

    // Debounce de 600ms pour éviter les changements trop fréquents pendant le scroll
    debounceTimer = setTimeout(updateTicker, 600)

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [visibleAlertId, ticker, alerts, activeTicker])

  // Charger les Dark Pools si non fournis - Utiliser activeTicker avec debounce
  useEffect(() => {
    if (!activeTicker) {
      setKeyLevels([])
      setContextualAlerts([])
      setExpirationAlerts([])
      setCurrentPrice(null)
      return
    }

    // Debounce pour éviter les chargements trop fréquents
    let debounceTimer: NodeJS.Timeout | null = null

    const loadData = async () => {
      setLoading(true)
      try {
        // Filtrer les alertes pour le ticker actif
        const tickerAlerts = alerts.filter(a => a.ticker === activeTicker)

        // Charger l'analyse de convergence et risque de liquidation
        try {
          const analysisResponse = await convergenceRiskClient.analyzeConvergenceRisk({
            ticker: activeTicker,
            darkPoolLimit: 100,
            optionsLimit: 200,
            minPremium: 50000,
          })

          if (analysisResponse.success && analysisResponse.analysis) {
            setWhaleAnalysis(analysisResponse.analysis)
            setCurrentPrice(analysisResponse.analysis.currentPrice)
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'analyse de convergence:', error)
        }

        // Charger les Dark Pools si non fournis
        let pools = darkPools?.filter(p => p.ticker === activeTicker)
        if (!pools || pools.length === 0) {
          pools = await darkPoolsService.getDarkPools(
            activeTicker,
            100,
            500000, // Premium minimum 500K$
            undefined,
            undefined,
            undefined,
            true // Force refresh
          )
        }

        // Détecter les niveaux clés
        const levels = await flowContextualService.detectWhaleSupportLevels(activeTicker, pools)
        setKeyLevels(levels)

        // Détecter les expirations pour ce ticker
        const expirations = flowContextualService.detectUpcomingExpirations(tickerAlerts, 30)
        setExpirationAlerts(expirations)

        // Générer les alertes contextuelles
        const contextual = await flowContextualService.generateContextualAlerts(
          activeTicker,
          tickerAlerts,
          pools
        )
        setContextualAlerts(contextual)

        // Extraire le prix actuel depuis l'analyse ou les alertes (seulement si pas déjà défini par l'analyse)
        if (!whaleAnalysis || !whaleAnalysis.currentPrice) {
          if (tickerAlerts.length > 0) {
            const latestAlert = tickerAlerts[0]
            const price = parseFloat(latestAlert.underlying_price || '0')
            if (!isNaN(price)) setCurrentPrice(price)
          } else if (pools.length > 0) {
            const latestPool = pools[0]
            const price = parseFloat(latestPool.price || '0')
            if (!isNaN(price)) setCurrentPrice(price)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données contextuelles:', error)
        setCurrentPrice(null)
      } finally {
        setLoading(false)
      }
    }

    // Attendre 500ms avant de charger pour éviter les chargements pendant le scroll actif
    debounceTimer = setTimeout(() => {
      loadData()
    }, 500)

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [activeTicker, alerts, darkPools])

  // Niveau de support principal (le plus fort) - Utiliser whaleSupport si disponible
  const primarySupportLevel = useMemo(() => {
    // Priorité 1: whaleSupport de l'analyse de convergence
    if (whaleAnalysis && whaleAnalysis.whaleSupport > 0) {
      return {
        price: whaleAnalysis.whaleSupport,
        transactionCount: 0,
        totalVolume: 0,
        totalPremium: 0,
        strength: whaleAnalysis.liquidationRisk === 'HIGH' ? 'high' : whaleAnalysis.liquidationRisk === 'MEDIUM' ? 'medium' : 'low' as 'high' | 'medium' | 'low',
        description: `Support calculé par convergence (risque: ${whaleAnalysis.liquidationRisk})`,
      }
    }
    // Priorité 2: Premier niveau détecté
    if (keyLevels.length === 0) return null
    return keyLevels[0]
  }, [keyLevels, whaleAnalysis])

  // Vérifier si le prix touche le support (pour animation clignotante)
  const isPriceAtSupport = useMemo(() => {
    if (!whaleAnalysis || !currentPrice) return false
    if (whaleAnalysis.priceDistanceFromSupport === null) return false
    return Math.abs(whaleAnalysis.priceDistanceFromSupport) < 0.01 // Moins de 0.01% de distance
  }, [whaleAnalysis, currentPrice])

  // Prochaine expiration
  const nextExpiration = useMemo(() => {
    if (expirationAlerts.length === 0) return null
    return expirationAlerts[0]
  }, [expirationAlerts])

  // Si pas de ticker actif, ne rien afficher
  if (!activeTicker) return null

  // Déterminer la couleur d'impact
  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-300'
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
      default:
        return 'bg-white/5 border-white/10 text-neutral-400'
    }
  }

  // Déterminer la couleur du point
  const getPointColor = (strength: 'high' | 'medium' | 'low') => {
    switch (strength) {
      case 'high':
        return 'bg-orange-400 ring-orange-400/10'
      case 'medium':
        return 'bg-yellow-400 ring-yellow-400/10'
      default:
        return 'bg-neutral-400 ring-neutral-400/10'
    }
  }

  return (
    <div className="relative w-full max-w-[500px] lg:ml-auto lg:sticky lg:top-6 self-start">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-orange-500/10 blur-[100px] -z-10 opacity-30"></div>

      <div className="glass-card rounded-[1.2em] p-1 shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
        <div className="bg-neutral-900/40 rounded-xl overflow-visible backdrop-blur-md">
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
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">
                  {activeTicker || 'Flow Context'}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {category ? category.toUpperCase() : 'FLOW ALERTS'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentPrice ? (
                <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm font-bold text-orange-400 font-mono">
                  ${currentPrice.toFixed(2)}
                </div>
              ) : (
                <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
                  LIVE
                </div>
              )}
              {activeTicker && (
                <button
                  onClick={() => setIsEarningsHubOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                  title="Voir l'analyse Earnings Hub"
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
                  >
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                  Rapport trimestriel
                </button>
              )}
            </div>
          </div>
        
          {/* Body */}
          <div className="p-5 space-y-6 relative pb-10">
            {/* Connecting line - S'adapte dynamiquement au contenu */}
            <div className="absolute left-[31px] top-8 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Support des Baleines */}
                {primarySupportLevel && (
                  <div className="relative flex gap-5 group">
                    <div className={`w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-400/10 mt-1.5 flex-shrink-0 z-10 ${isPriceAtSupport ? 'animate-pulse' : ''
                      }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">
                          Support des Baleines
                        </span>
                        <span className="text-base font-bold font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                          ${primarySupportLevel.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                        {whaleAnalysis ? (
                          <>
                            Support calculé par convergence.
                            {whaleAnalysis.isWhaleInProfit && (
                              <span className="font-bold text-emerald-400"> ✅ Baleines en profit.</span>
                            )}
                            {!whaleAnalysis.isWhaleInProfit && whaleAnalysis.priceDistanceFromSupport !== null && whaleAnalysis.priceDistanceFromSupport < 0 && (
                              <span className="font-bold text-red-400"> ⚠️ Baleines en perte.</span>
                            )}
                            {whaleAnalysis.liquidationRisk === 'HIGH' && (
                              <span className="font-bold text-orange-400"> Risque de liquidation élevé.</span>
                            )}
                            {whaleAnalysis.priceDistanceFromSupport !== null && whaleAnalysis.priceDistanceFromSupport !== 0 && (
                              <span className="text-neutral-500"> Distance: {whaleAnalysis.priceDistanceFromSupport > 0 ? '+' : ''}{(whaleAnalysis.priceDistanceFromSupport * 100).toFixed(2)}%</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-white">{primarySupportLevel.transactionCount}</span> transactions Dark Pool détectées à ce niveau.
                            {'institutions' in primarySupportLevel && primarySupportLevel.institutions && primarySupportLevel.institutions.length > 0 && (
                              <span> Institutions: <span className="font-semibold text-neutral-300">{primarySupportLevel.institutions.slice(0, 2).join(', ')}</span></span>
                            )}
                          </>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded border font-medium ${whaleAnalysis?.liquidationRisk === 'HIGH'
                            ? 'bg-red-500/10 border-red-500/20 text-red-300'
                            : whaleAnalysis?.liquidationRisk === 'MEDIUM'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                              : 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                          }`}>
                          {whaleAnalysis ? `${whaleAnalysis.liquidationRisk} RISK` : 'HIGH IMPACT'}
                        </span>
                        {whaleAnalysis && whaleAnalysis.targetStrike > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                            Target: ${whaleAnalysis.targetStrike.toFixed(2)}
                          </span>
                        )}
                        {!whaleAnalysis && (
                          <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                            {primarySupportLevel.transactionCount} TXNS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Prochaine Expiration */}
                {(nextExpiration || whaleAnalysis) && (
                  <div className="relative flex gap-5 group">
                    <div className={`w-3 h-3 rounded-full ${nextExpiration?.impact === 'high' || whaleAnalysis?.liquidationRisk === 'HIGH'
                        ? 'bg-orange-400 ring-orange-400/10'
                        : nextExpiration?.impact === 'medium' || whaleAnalysis?.liquidationRisk === 'MEDIUM'
                          ? 'bg-neutral-400 ring-neutral-400/10'
                          : 'bg-neutral-700 ring-white/5'
                      } ring-4 mt-1.5 flex-shrink-0 z-10`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          {whaleAnalysis?.targetStrike ? 'Objectif d\'Expiration' : 'Prochaine Expiration'}
                        </span>
                        {whaleAnalysis?.targetStrike ? (
                          <span className="text-base font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            ${whaleAnalysis.targetStrike.toFixed(2)}
                          </span>
                        ) : nextExpiration ? (
                          <span className={`text-base font-bold font-mono px-2.5 py-1 rounded-lg border ${nextExpiration.daysUntil === 0
                              ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                              : nextExpiration.daysUntil === 1
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-neutral-400 bg-white/5 border-white/10'
                            }`}>
                            {nextExpiration.daysUntil === 0 ? "Aujourd'hui" : nextExpiration.daysUntil === 1 ? 'Demain' : `Dans ${nextExpiration.daysUntil}j`}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-neutral-400 mb-2">
                        {whaleAnalysis?.targetStrike ? (
                          <>
                            Objectif calculé par convergence.
                            {whaleAnalysis.priceDistanceFromTarget !== null && whaleAnalysis.priceDistanceFromTarget !== 0 && (
                              <>
                                <span className="font-semibold text-white"> Distance: </span>
                                <span className={`font-bold ${whaleAnalysis.priceDistanceFromTarget > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {whaleAnalysis.priceDistanceFromTarget > 0 ? '↑ +' : '↓ '}{(Math.abs(whaleAnalysis.priceDistanceFromTarget) * 100).toFixed(2)}%
                                </span>
                                {whaleAnalysis.priceDistanceFromTarget < 0 && (
                                  <span className="text-neutral-500"> (Prix en-dessous de l'objectif)</span>
                                )}
                                {whaleAnalysis.priceDistanceFromTarget > 0 && (
                                  <span className="text-neutral-500"> (Prix au-dessus de l'objectif)</span>
                                )}
                              </>
                            )}
                          </>
                        ) : nextExpiration ? (
                          <>
                            <span className="font-semibold text-white">{nextExpiration.strikeCount}</span> strikes • <span className="font-semibold text-white">{nextExpiration.totalVolume.toLocaleString()}</span> volume • <span className="font-bold text-orange-400">${(nextExpiration.totalPremium / 1000000).toFixed(1)}M</span> premium
                          </>
                        ) : null}
                      </p>
                      {nextExpiration && (
                        <div className="flex gap-2">
                          <span className={`text-[10px] px-2 py-1 rounded border font-medium ${nextExpiration.impact === 'high'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                              : nextExpiration.impact === 'medium'
                                ? 'bg-white/5 border-white/10 text-neutral-400'
                                : 'bg-white/5 border-white/10 text-neutral-500'
                            }`}>
                            {nextExpiration.impact === 'high' ? 'HIGH' : nextExpiration.impact === 'medium' ? 'MED' : 'LOW'} IMPACT
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Autres niveaux clés (si présents) */}
                {keyLevels.slice(1, 2).map((level, idx) => (
                  <div
                    key={idx}
                    className="relative flex gap-5 group opacity-60"
                  >
                    <div className="w-3 h-3 rounded-full bg-neutral-700 ring-4 ring-white/5 mt-1.5 flex-shrink-0 z-10"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          Niveau Secondaire
                        </span>
                        <span className="text-sm font-bold font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                          ${level.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-neutral-500 font-medium">
                          LOW IMPACT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Interprétation et Scénarios */}
                {whaleAnalysis?.interpretation && (
                  <div className="relative flex gap-5 group">
                    <div className="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-400/10 mt-1.5 flex-shrink-0 z-10"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          Analyse
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                        {whaleAnalysis.interpretation.summary}
                      </p>

                      {/* Key Points */}
                      {whaleAnalysis.interpretation.keyPoints.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {whaleAnalysis.interpretation.keyPoints.map((point, idx) => {
                            const isWarning = point.startsWith('⚠️')
                            return (
                              <div key={idx} className={`flex items-start gap-2 text-[11px] ${isWarning ? 'text-orange-300' : 'text-neutral-400'
                                }`}>
                                <span className="mt-0.5 flex-shrink-0">
                                  {isWarning ? '⚠️' : '•'}
                                </span>
                                <span>{point.replace('⚠️', '').trim()}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Scénarios */}
                      {whaleAnalysis.interpretation.scenarios.length > 0 && (
                        <div className="space-y-2">
                          {whaleAnalysis.interpretation.scenarios.map((scenario, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 backdrop-blur-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-red-400">
                                  {scenario.label}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${scenario.probability === 'high'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : scenario.probability === 'medium'
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  }`}>
                                  {scenario.probability === 'high' ? 'HAUTE' : scenario.probability === 'medium' ? 'MOYENNE' : 'FAIBLE'}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-300 leading-relaxed">
                                {scenario.conditions}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recommendation */}
                      {whaleAnalysis.interpretation.recommendation && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                              Recommandation:
                            </span>
                            <span className={`text-xs font-bold ${whaleAnalysis.interpretation.recommendation === 'action'
                                ? 'text-red-400'
                                : whaleAnalysis.interpretation.recommendation === 'alert'
                                  ? 'text-orange-400'
                                  : 'text-blue-400'
                              }`}>
                              {whaleAnalysis.interpretation.recommendation === 'action' ? 'ACTION REQUISE' : whaleAnalysis.interpretation.recommendation === 'alert' ? 'ALERTE' : 'SURVEILLER'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Message si aucune donnée */}
                {!primarySupportLevel && !nextExpiration && keyLevels.length === 0 && !whaleAnalysis && (
                  <div className="text-center py-8 text-neutral-500 text-sm">
                    Aucune alerte contextuelle disponible
                  </div>
                )}
              </>
            )}

            {/* Margin bottom dynamique pour s'assurer que tout le contenu est visible */}
            <div className="h-10"></div>
          </div>

          {/* Alert overlay (si alerte contextuelle importante) */}
          {contextualAlerts.length > 0 && contextualAlerts[0].impact === 'high' && (
            <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 border border-white/10 backdrop-blur-xl rounded-lg p-3 flex items-start gap-3 transform translate-y-2 animate-[float_4s_ease-in-out_infinite] shadow-lg">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 flex-shrink-0">
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
                <div className="text-xs font-medium text-white">
                  {contextualAlerts[0].title}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {contextualAlerts[0].description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Hub Modal */}
      {activeTicker && (
        <EarningsHubModal
          isOpen={isEarningsHubOpen}
          onClose={() => setIsEarningsHubOpen(false)}
          ticker={activeTicker}
        />
      )}
    </div>
  )
}

