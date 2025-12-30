'use client'

import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { InsiderTickerFlow } from '@/types/insiderTrades'
import type { DarkPoolTransaction } from '@/types/darkPools'
import flowAlertsService from '@/services/flowAlertsService'
import darkPoolsService from '@/services/darkPoolsService'
import institutionalOwnershipService from '@/services/institutionalOwnershipService'

interface UnifiedTimelineProps {
  alert: FlowAlert | null
  ownership: InstitutionalOwner[]
  insiderTrades: InsiderTickerFlow[]
  darkPools: DarkPoolTransaction[]
}

interface TimelineEvent {
  id: string
  type: 'institutional' | 'insider' | 'darkpool' | 'alert'
  date: Date
  title: string
  description: string
  value?: string
  icon: string
  color: string
  priority: number
  trendIcon?: string // Icône de tendance pour les insider trades
}

export default function UnifiedTimeline({
  alert,
  ownership,
  insiderTrades,
  darkPools,
}: UnifiedTimelineProps) {
  if (!alert) return null

  const events: TimelineEvent[] = []

  // 1. Alerte de flow (priorité maximale)
  const alertDate = alert.created_at ? new Date(alert.created_at) : (alert.start_time ? new Date(alert.start_time * 1000) : new Date())
  const sentiment = flowAlertsService.getSentiment(alert)
  
  events.push({
    id: `alert-${alert.id}`,
    type: 'alert',
    date: alertDate,
    title: `${alert.ticker} ${alert.type.toUpperCase()} ${alert.has_floor ? 'Floor' : alert.has_sweep ? 'Sweep' : ''}`,
    description: `Premium: ${flowAlertsService.formatPremium(alert.total_premium)} • Strike: $${alert.strike}`,
    value: sentiment.label,
    icon: '⚡',
    color: sentiment.color === 'emerald' ? 'emerald' : 'red',
    priority: 10,
  })

  // 2. Top institutions (limité aux 3 plus importantes)
  ownership.slice(0, 3).forEach((owner, idx) => {
    const ownershipPerc = owner.ownership_perc !== undefined
      ? institutionalOwnershipService.formatOwnershipPercent(owner.ownership_perc)
      : 'N/A'
    
    events.push({
      id: `institution-${owner.cik || idx}`,
      type: 'institutional',
      date: new Date(), // Les données 13F sont trimestrielles, on utilise la date actuelle
      title: owner.name,
      description: `Ownership: ${ownershipPerc} • Value: ${institutionalOwnershipService.formatMarketValue(owner.value)}`,
      value: `${owner.units.toLocaleString()} units`,
      icon: '🏛️',
      color: 'blue',
      priority: 8 - idx, // Priorité décroissante
    })
  })

  // Calculer la tendance des 30 derniers jours pour les insider trades
  const calculateInsiderTrend = (): 'up' | 'down' | 'neutral' => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTrades = insiderTrades.filter(trade => {
      const tradeDate = new Date(trade.date)
      return tradeDate >= thirtyDaysAgo
    })
    
    if (recentTrades.length === 0) return 'neutral'
    
    let totalBuy = 0
    let totalSell = 0
    
    recentTrades.forEach(trade => {
      const premium = parseFloat(trade.premium || '0')
      if (trade.buy_sell === 'buy') {
        totalBuy += premium
      } else if (trade.buy_sell === 'sell') {
        totalSell += premium
      }
    })
    
    if (totalBuy > totalSell * 1.1) return 'up' // 10% de marge pour éviter les faux positifs
    if (totalSell > totalBuy * 1.1) return 'down'
    return 'neutral'
  }

  const insiderTrend = calculateInsiderTrend()
  const trendIcon = insiderTrend === 'up' ? '📈' : insiderTrend === 'down' ? '📉' : ''

  // 3. Insider trades significatifs (achats/ventes récents, limité aux 5 plus récents)
  insiderTrades
    .filter(trade => {
      // Filtrer les trades significatifs (volume > 100K$ ou ventes)
      const premium = parseFloat(trade.premium || '0')
      return premium > 100000 || trade.buy_sell === 'sell'
    })
    .slice(0, 5)
    .forEach((trade) => {
      const tradeDate = new Date(trade.date)
      const isSell = trade.buy_sell === 'sell'
      
      // Ajouter l'icône de tendance uniquement pour le premier trade (le plus récent)
      const showTrend = trade === insiderTrades
        .filter(t => {
          const p = parseFloat(t.premium || '0')
          return p > 100000 || t.buy_sell === 'sell'
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      
      events.push({
        id: `insider-${trade.date}-${trade.ticker}`,
        type: 'insider',
        date: tradeDate,
        title: `Insider ${isSell ? 'Vente' : 'Achat'}`,
        description: `${trade.uniq_insiders || 0} insider(s) • ${trade.transactions} transaction(s)`,
        value: flowAlertsService.formatPremium(trade.premium),
        icon: '👤',
        color: isSell ? 'red' : 'emerald',
        priority: isSell ? 7 : 6, // Les ventes ont une priorité plus élevée
        trendIcon: showTrend && trendIcon ? trendIcon : undefined, // Icône de tendance uniquement pour le plus récent
      })
    })

  // 4. Dark Pools significatifs (premium > 5M$, limité aux 5 plus récents)
  darkPools
    .filter(pool => parseFloat(pool.premium) >= 5_000_000) // 5M$ minimum
    .slice(0, 5)
    .forEach((pool) => {
      const poolDate = new Date(pool.executed_at)
      
      events.push({
        id: `darkpool-${pool.tracking_id}`,
        type: 'darkpool',
        date: poolDate,
        title: 'Dark Pool Transaction',
        description: `Size: ${pool.size.toLocaleString()} shares • Price: $${parseFloat(pool.price).toFixed(2)}`,
        value: darkPoolsService.formatCurrency(pool.premium),
        icon: '🔥',
        color: 'purple',
        priority: 5,
      })
    })

  // Trier par date (plus récents en premier), puis par priorité
  events.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime()
    if (Math.abs(dateDiff) < 24 * 60 * 60 * 1000) { // Si dans les 24h, trier par priorité
      return b.priority - a.priority
    }
    return dateDiff
  })

  // Limiter à 10 événements les plus importants
  const topEvents = events.slice(0, 10)

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      red: 'bg-red-500/20 text-red-300 border-red-500/40',
      blue: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      purple: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      orange: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    }
    return colors[color] || colors.blue
  }

  const formatRelativeDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

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
                <div className="text-sm font-medium text-white tracking-tight">Timeline Unifiée</div>
                <div className="text-[10px] text-neutral-500 font-mono">ÉVÉNEMENTS CLÉS</div>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
              {alert.ticker}
            </div>
          </div>

          {/* Timeline Body - Scrollable */}
          <div className="p-5 space-y-4 relative max-h-[600px] overflow-y-auto custom-scrollbar">
            {/* Connecting line */}
            <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {topEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-400">Aucun événement significatif</p>
              </div>
            ) : (
              topEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                const isAlert = event.type === 'alert'

                return (
                  <div key={event.id} className="relative flex gap-5 group">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ring-4 ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{event.icon}</span>
                          <span className={`text-sm font-semibold ${isAlert ? 'text-orange-300' : 'text-white'} group-hover:text-orange-300 transition-colors truncate`}>
                            {event.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {event.trendIcon && (
                            <span className="text-base" title="Tendance des 30 derniers jours">
                              {event.trendIcon}
                            </span>
                          )}
                          <span className="text-xs font-mono text-neutral-400">
                            {formatRelativeDate(event.date)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {event.value && (
                          <span className={`px-2.5 py-1 text-xs rounded-md border font-medium ${colorClasses}`}>
                            {event.value}
                          </span>
                        )}
                        <span className="px-2.5 py-1 text-xs rounded-md bg-white/10 border border-white/10 text-white/90 font-medium">
                          {event.type === 'institutional' ? 'INSTITUTION' : event.type === 'insider' ? 'DIRIGEANT' : event.type === 'darkpool' ? 'VOLUME CACHÉ' : 'ALERTE'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

