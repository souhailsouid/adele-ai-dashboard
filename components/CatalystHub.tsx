'use client'

import { useState, useEffect, useMemo } from 'react'
import catalystCalendarClient from '@/lib/api/catalystCalendarClient'
import type { CatalystEvent, CatalystImpact, CatalystType } from '@/types/catalystCalendar'

interface CatalystHubProps {
  watchlist?: string[] // Liste de tickers à surveiller
  defaultDays?: number // Nombre de jours à afficher par défaut (défaut: 7)
}

// Fonction pour obtenir la couleur selon l'impact
const getImpactColor = (impact: CatalystImpact) => {
  switch (impact) {
    case 'CRITICAL':
      return 'bg-red-500/20 border-red-500/40 text-red-300'
    case 'HIGH':
      return 'bg-orange-500/20 border-orange-500/40 text-orange-300'
    case 'MEDIUM':
      return 'bg-blue-500/20 border-blue-500/40 text-blue-300'
    case 'LOW':
      return 'bg-neutral-500/20 border-neutral-500/40 text-neutral-300'
    default:
      return 'bg-neutral-500/20 border-neutral-500/40 text-neutral-300'
  }
}

// Fonction pour obtenir l'icône selon le type
const getTypeIcon = (type: CatalystType) => {
  switch (type) {
    case 'macro':
      return '🌍'
    case 'fundamental':
      return '📊'
    case 'fda':
      return '💊'
    case 'whale-risk':
      return '🐋'
    case 'insider':
      return '👔'
    case 'dark-pool':
      return '🌊'
    default:
      return '📅'
  }
}

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui"
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Demain'
  } else {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }
}

export default function CatalystHub({ watchlist = [], defaultDays = 7 }: CatalystHubProps) {
  const [events, setEvents] = useState<CatalystEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<CatalystType | 'all'>('all')
  const [selectedImpact, setSelectedImpact] = useState<CatalystImpact | 'all'>('all')

  // Calculer les dates de début et fin
  const dateRange = useMemo(() => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + defaultDays)
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }
  }, [defaultDays])

  // Charger les événements
  useEffect(() => {
    setLoading(true)
    setError(null)

    catalystCalendarClient
      .getCatalystCalendar({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        watchlist,
      })
      .then((response) => {
        if (response.success) {
          setEvents(response.events)
        } else {
          setError(response.error || 'Erreur lors du chargement')
        }
      })
      .catch((err) => {
        setError(err.message || 'Erreur lors du chargement')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dateRange.startDate, dateRange.endDate, watchlist.join(',')])

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeMatch = selectedFilter === 'all' || event.type === selectedFilter
      const impactMatch = selectedImpact === 'all' || event.impact === selectedImpact
      return typeMatch && impactMatch
    })
  }, [events, selectedFilter, selectedImpact])

  // Grouper les événements par date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CatalystEvent[]> = {}
    filteredEvents.forEach((event) => {
      const dateKey = event.date.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    return grouped
  }, [filteredEvents])

  // Statistiques
  const stats = useMemo(() => {
    const critical = events.filter((e) => e.impact === 'CRITICAL').length
    const high = events.filter((e) => e.impact === 'HIGH').length
    const medium = events.filter((e) => e.impact === 'MEDIUM').length
    const low = events.filter((e) => e.impact === 'LOW').length

    return { critical, high, medium, low, total: events.length }
  }, [events])

  return (
    <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-neutral-900/98 to-neutral-900/95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Aura Catalyst Hub</h2>
            <p className="text-sm text-neutral-400">
              Radar de volatilité institutionnelle • {stats.total} événements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
              {stats.critical} CRITICAL
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400">
              {stats.high} HIGH
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Tous
          </button>
          {(['macro', 'fundamental', 'fda', 'whale-risk'] as CatalystType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedFilter === type
                  ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                  : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {type === 'macro' ? '🌍 Macro' : type === 'fundamental' ? '📊 Earnings' : type === 'fda' ? '💊 FDA' : '🐋 Whale Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-2">Erreur</div>
            <div className="text-neutral-400 text-sm">{error}</div>
          </div>
        ) : Object.keys(eventsByDate).length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            Aucun événement prévu pour cette période
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateEvents]) => (
                <div key={date} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      <div className="px-4 py-1.5 rounded-lg bg-neutral-800/50 border border-white/10">
                        <span className="text-sm font-semibold text-white">{formatDate(date)}</span>
                        <span className="text-xs text-neutral-500 ml-2">
                          {dateEvents.length} événement{dateEvents.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-3">
                    {dateEvents
                      .sort((a, b) => {
                        // Trier par impact (CRITICAL > HIGH > MEDIUM > LOW)
                        const impactOrder: Record<CatalystImpact, number> = {
                          CRITICAL: 0,
                          HIGH: 1,
                          MEDIUM: 2,
                          LOW: 3,
                        }
                        return impactOrder[a.impact] - impactOrder[b.impact]
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg border ${getImpactColor(event.impact)} hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-2xl flex-shrink-0">{getTypeIcon(event.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                                <div className="flex items-center gap-2">
                                  {event.ticker && (
                                    <span className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs font-bold text-white">
                                      {event.ticker}
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${getImpactColor(event.impact)}`}>
                                    {event.impact}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-neutral-300 mb-2">{event.description}</p>

                              {/* Type-specific details */}
                              {event.earnings && (
                                <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                                  <span>{event.earnings.period}</span>
                                  {event.earnings.hubScore && (
                                    <span className={`px-2 py-0.5 rounded font-bold ${
                                      event.earnings.hubScore === 'A' ? 'bg-emerald-500/20 text-emerald-300' :
                                      event.earnings.hubScore === 'B' ? 'bg-blue-500/20 text-blue-300' :
                                      event.earnings.hubScore === 'C' ? 'bg-yellow-500/20 text-yellow-300' :
                                      event.earnings.hubScore === 'D' ? 'bg-orange-500/20 text-orange-300' :
                                      'bg-red-500/20 text-red-300'
                                    }`}>
                                      Score: {event.earnings.hubScore}
                                    </span>
                                  )}
                                  <span className="text-neutral-500">
                                    {event.earnings.reportTime === 'premarket' ? 'Pre-market' : event.earnings.reportTime === 'afterhours' ? 'After-hours' : 'Heure inconnue'}
                                  </span>
                                </div>
                              )}

                              {event.macro && (
                                <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                                  <span>{event.macro.event}</span>
                                  {event.macro.forecast !== undefined && (
                                    <span>Prévision: {event.macro.forecast}</span>
                                  )}
                                </div>
                              )}

                              {event.whaleRisk && (
                                <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                                  <span>Support: ${event.whaleRisk.whaleSupport.toFixed(2)}</span>
                                  <span className={`font-bold ${
                                    event.whaleRisk.liquidationRisk === 'HIGH' ? 'text-red-400' :
                                    event.whaleRisk.liquidationRisk === 'MEDIUM' ? 'text-orange-400' :
                                    'text-yellow-400'
                                  }`}>
                                    Risque: {event.whaleRisk.liquidationRisk}
                                  </span>
                                </div>
                              )}

                              {event.time && (
                                <div className="text-xs text-neutral-500 mt-2">
                                  ⏰ {event.time}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

