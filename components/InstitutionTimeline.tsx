'use client'

import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import institutionHoldingsService from '@/services/institutionHoldingsService'
import type { InstitutionHolding } from '@/types/institutionHoldings'
import type { InsiderTickerFlow } from '@/types/insiderTrades'
import type { DarkPoolTransaction } from '@/types/darkPools'

interface InstitutionTimelineProps {
  institution: InstitutionalOwner
  alert: FlowAlert | null
  holdings: InstitutionHolding[]
  insiderTrades?: InsiderTickerFlow[]
  darkPools?: DarkPoolTransaction[]
}

export default function InstitutionTimeline({ 
  institution, 
  alert, 
  holdings,
  insiderTrades = [],
  darkPools = []
}: InstitutionTimelineProps) {
  if (!alert) return null

  // Trouver le holding du ticker de l'alerte
  const tickerHolding = holdings.find((h) => h.ticker === alert.ticker)

  // Détecter les corrélations temporelles avec l'alerte de flow
  const getAlertDate = (): Date | null => {
    if (alert.created_at) {
      return new Date(alert.created_at)
    }
    if (alert.start_time) {
      return new Date(alert.start_time * 1000)
    }
    return null
  }

  const alertDate = getAlertDate()
  
  // Détecter les insider trades corrélés (même jour que l'alerte)
  const hasInsiderTradeCorrelation = alertDate && insiderTrades.some(trade => {
    const tradeDate = new Date(trade.date)
    return tradeDate.toDateString() === alertDate.toDateString()
  })

  // Détecter les dark pools corrélés (volume > 10M$ et dans les 24h de l'alerte)
  const hasDarkPoolCorrelation = alertDate && darkPools.some(pool => {
    const poolDate = new Date(pool.executed_at)
    const timeDiff = Math.abs(poolDate.getTime() - alertDate.getTime())
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    const premium = parseFloat(pool.premium)
    return hoursDiff <= 24 && premium >= 10_000_000 // 10M$
  })

  // Filtrer les holdings significatifs pour le ticker de l'alerte et créer une timeline
  const relevantHoldings = holdings
    .filter((h) => {
      // Si c'est le ticker de l'alerte, toujours l'inclure
      if (h.ticker === alert.ticker) return true
      // Sinon, inclure les holdings avec un changement significatif (>5% ou >$10M)
      const changeValue = Math.abs(h.units_change * parseFloat(h.close || '0'))
      return Math.abs(h.units_change) > h.units * 0.05 || changeValue > 10_000_000
    })
    .sort((a, b) => {
      // Trier par units_change décroissant (les plus significatifs en premier)
      return Math.abs(b.units_change) - Math.abs(a.units_change)
    })
    .slice(0, 5) // Limiter à 5 items pour la timeline

  return (
    <div className="relative w-full">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-orange-500/10 blur-[100px] -z-10 opacity-30"></div>

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
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Timeline Institutionnelle</div>
                <div className="text-[10px] text-neutral-500 font-mono">ACTIVITÉ RÉCENTE</div>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
              {alert.ticker}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="p-5 space-y-6 relative">
            {/* Connecting line */}
            <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {/* Item: Ticker de l'alerte (prioritaire) */}
            {tickerHolding && (
              <div className="relative flex gap-5 group">
                <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-400/10 mt-1.5 flex-shrink-0 z-10"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white group-hover:text-orange-300 transition-colors">
                      Position {alert.ticker}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {tickerHolding.change_perc
                        ? institutionHoldingsService.formatChangePercent(tickerHolding.change_perc)
                        : 'Nouvelle position'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                    {tickerHolding.units_change > 0
                      ? `Renforcement de la position: +${tickerHolding.units_change.toLocaleString()} units (${institutionHoldingsService.formatChangePercent(tickerHolding.change_perc)}). Position totale: ${tickerHolding.units.toLocaleString()} units.`
                      : tickerHolding.units_change < 0
                        ? `Réduction de la position: ${tickerHolding.units_change.toLocaleString()} units (${institutionHoldingsService.formatChangePercent(tickerHolding.change_perc)}). Position totale: ${tickerHolding.units.toLocaleString()} units.`
                        : `Position maintenue: ${tickerHolding.units.toLocaleString()} units.`}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-300 font-medium">
                      {tickerHolding.units_change > 0 ? 'RENFORCEMENT' : tickerHolding.units_change < 0 ? 'RÉDUCTION' : 'MAINTIEN'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                      VALEUR: {institutionHoldingsService.formatMarketValue(tickerHolding.value)}
                    </span>
                    {/* Icônes de corrélation */}
                    {hasInsiderTradeCorrelation && (
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium flex items-center gap-1"
                        title="Achat/Vente d'initié détecté ce jour"
                      >
                        👤 Insider
                      </span>
                    )}
                    {hasDarkPoolCorrelation && (
                      <span 
                        className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium flex items-center gap-1"
                        title="Volume hors-marché exceptionnel (> 10M$)"
                      >
                        🔥 Dark Pool
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Autres holdings significatifs */}
            {relevantHoldings
              .filter((h) => h.ticker !== alert.ticker)
              .map((holding, idx) => {
                const isIncrease = holding.units_change > 0
                const isDecrease = holding.units_change < 0
                const changeValue = Math.abs(holding.units_change * parseFloat(holding.close || '0'))

                return (
                  <div key={idx} className="relative flex gap-5 group">
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                        isIncrease
                          ? 'bg-emerald-400 ring-4 ring-emerald-400/10'
                          : isDecrease
                            ? 'bg-red-400 ring-4 ring-red-400/10'
                            : 'bg-neutral-400 ring-4 ring-neutral-400/10'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{holding.ticker}</span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {institutionHoldingsService.formatChangePercent(holding.change_perc)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-2">
                        {isIncrease
                          ? `Achat de ${Math.abs(holding.units_change).toLocaleString()} units`
                          : isDecrease
                            ? `Vente de ${Math.abs(holding.units_change).toLocaleString()} units`
                            : 'Position inchangée'}
                        {' '}• Valeur: {institutionHoldingsService.formatMarketValue(changeValue)}
                      </p>
                      <div className="flex gap-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isIncrease
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                              : isDecrease
                                ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                : 'bg-white/5 border border-white/10 text-neutral-400'
                          }`}
                        >
                          {isIncrease ? 'ACHAT' : isDecrease ? 'VENTE' : 'NEUTRE'}
                        </span>
                        {holding.sector && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                            {holding.sector}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* Message si aucune activité significative */}
            {relevantHoldings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-400">Aucune activité significative récente</p>
              </div>
            )}
          </div>

          {/* Alert overlay */}
          {tickerHolding && (
            <div className="px-4 pb-4 space-y-3">
              <div className="bg-neutral-900/90 border border-white/10 backdrop-blur-xl rounded-lg p-3 flex items-start gap-3 shadow-lg">
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
                    {tickerHolding.units_change > 0 ? 'Position renforcée' : tickerHolding.units_change < 0 ? 'Position réduite' : 'Position maintenue'}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {institution.name} détient {tickerHolding.units.toLocaleString()} units de {alert.ticker} (
                    {institutionHoldingsService.formatChangePercent(tickerHolding.change_perc)} ce trimestre).
                  </div>
                </div>
              </div>
              
              {/* Corrélations détectées */}
              {(hasInsiderTradeCorrelation || hasDarkPoolCorrelation) && (
                <div className="bg-blue-500/5 border border-blue-500/20 backdrop-blur-xl rounded-lg p-3 shadow-lg">
                  <div className="text-[10px] font-medium text-blue-300 mb-2 flex items-center gap-2">
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
                    >
                      <path d="M12 2v20M2 12h20"></path>
                    </svg>
                    CORRÉLATIONS DÉTECTÉES
                  </div>
                  <div className="space-y-1.5 text-[10px] text-neutral-300">
                    {hasInsiderTradeCorrelation && (
                      <div className="flex items-center gap-2">
                        <span className="text-base">👤</span>
                        <span>Achat/Vente d'initié détecté ce jour</span>
                      </div>
                    )}
                    {hasDarkPoolCorrelation && (
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔥</span>
                        <span>Volume hors-marché exceptionnel (&gt; 10M$)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

