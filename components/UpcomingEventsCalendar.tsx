'use client'

import { useState, useEffect } from 'react'
import economicCalendarClient from '@/lib/api/economicCalendarClient'
import { useAuth } from '@/hooks/useAuth'
import { Calendar } from 'lucide-react'

interface MacroEvent {
  id: string
  name: string
  date: string
  time: string
  impact: 'HIGH' | 'MED' | 'LOW'
  forecast?: string
  previous?: string
  description: string
  country: string
  category: string
  type: string
  reported_period?: string | null
}

export default function UpcomingEventsCalendar({ maxEvents = 20 }: { maxEvents?: number }) {
  const { loading: authLoading } = useAuth()
  const [events, setEvents] = useState<MacroEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les événements depuis l'API
  useEffect(() => {
    if (authLoading) return

    const loadEvents = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await economicCalendarClient.getEconomicCalendar(undefined, 500)
        
        // Gérer les différents formats de réponse
        let economicEvents: any[] = []
        
        if (Array.isArray(response.data)) {
          economicEvents = response.data
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          economicEvents = response.data.data
        } else if (response.success && Array.isArray((response as any).data)) {
          economicEvents = (response as any).data
        }

        // Convertir les événements de l'API au format MacroEvent
        const convertedEvents: MacroEvent[] = economicEvents.map((event, index) => {
          const eventDate = event.time ? new Date(event.time) : new Date()
          const dateStr = eventDate.toISOString().split('T')[0]
          const timeStr = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })

          // Déterminer l'impact selon le type
          let impact: 'HIGH' | 'MED' | 'LOW' = 'MED'
          const eventName = (event.event || '').toLowerCase()
          
          if (event.type === 'FOMC' || event.type === '13F') {
            impact = 'HIGH'
          } else if (event.type === 'report') {
            if (
              eventName.includes('jobless') ||
              eventName.includes('unemployment') ||
              eventName.includes('gdp') ||
              eventName.includes('inflation') ||
              eventName.includes('cpi') ||
              eventName.includes('ppi') ||
              eventName.includes('retail sales') ||
              eventName.includes('non-farm payroll')
            ) {
              impact = 'HIGH'
            } else {
              impact = 'MED'
            }
          } else {
            impact = 'LOW'
          }

          // Déterminer la catégorie
          let category = 'Economic Data'
          if (event.type === 'FOMC') {
            category = 'Monetary Policy'
          } else if (event.type === '13F') {
            category = 'Regulatory'
          } else if (eventName.includes('jobless') || eventName.includes('unemployment') || eventName.includes('payroll')) {
            category = 'Employment'
          } else if (eventName.includes('gdp')) {
            category = 'GDP'
          } else if (eventName.includes('inflation') || eventName.includes('cpi') || eventName.includes('ppi')) {
            category = 'Inflation'
          } else if (eventName.includes('retail sales')) {
            category = 'Consumer'
          }

          return {
            id: event.id || `event-${index}`,
            name: event.event || 'Economic Event',
            date: dateStr,
            time: timeStr,
            impact,
            forecast: event.forecast,
            previous: event.prev,
            description: event.event || '',
            country: event.country || 'US',
            category,
            type: event.type || 'report',
            reported_period: event.reported_period || null,
          }
        })

        // Filtrer les événements futurs et trier par date
        const now = new Date()
        const upcomingEvents = convertedEvents
          .filter(event => {
            const eventDate = new Date(event.date)
            return eventDate >= now
          })
          .sort((a, b) => {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
          })
          .slice(0, maxEvents)

        setEvents(upcomingEvents)
      } catch (err: any) {
        console.error('Error loading events:', err)
        setError(err.message || 'Erreur lors du chargement des événements')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [authLoading, maxEvents])

  // Get impact color for timeline dot
  const getImpactDotColor = (impact: 'HIGH' | 'MED' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return 'bg-orange-400 ring-orange-400/10'
      case 'MED':
        return 'bg-neutral-400 ring-neutral-700/10'
      case 'LOW':
        return 'bg-neutral-700 ring-white/5'
      default:
        return 'bg-neutral-700 ring-white/5'
    }
  }

  // Get impact badge style
  const getImpactBadgeStyle = (impact: 'HIGH' | 'MED' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-300'
      case 'MED':
        return 'bg-white/5 border-white/10 text-neutral-400'
      case 'LOW':
        return 'bg-white/5 border-white/10 text-neutral-500'
      default:
        return 'bg-white/5 border-white/10 text-neutral-500'
    }
  }

  // Get impact text
  const getImpactText = (impact: 'HIGH' | 'MED' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return 'HIGH IMPACT'
      case 'MED':
        return 'MED IMPACT'
      case 'LOW':
        return 'LOW IMPACT'
      default:
        return 'MED IMPACT'
    }
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString
  }

  const displayEvents = events.slice(0, maxEvents)

  return (
    <div className="relative w-full max-w-[500px] lg:ml-auto z-20 opacity-100 hover:opacity-100 transition-all duration-300">
      <div className="glass-card rounded-[1.2em] p-1 shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative z-20 overflow-hidden">
        <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Macro Calendar</div>
                <div className="text-[10px] text-neutral-500 font-mono">UPCOMING EVENTS</div>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
              EST (UTC-5)
            </div>
          </div>

          {/* Calendar Body */}
          <div className="p-5 space-y-6 relative pb-10">
            {/* Connecting line */}
            <div className="absolute left-[31px] top-8 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Events */}
            {!loading && !error && displayEvents.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p>Aucun événement à venir.</p>
              </div>
            ) : (
              !loading && !error && displayEvents.map((event) => {
                const isLowImpact = event.impact === 'LOW'
                const dotColor = getImpactDotColor(event.impact)
                const badgeStyle = getImpactBadgeStyle(event.impact)
                const impactText = getImpactText(event.impact)
                
                return (
                  <div key={event.id} className={`relative flex gap-5 group ${isLowImpact ? 'opacity-60' : ''}`}>
                    <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 mt-1.5 flex-shrink-0 z-10`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold text-white ${event.impact === 'HIGH' ? 'group-hover:text-orange-300 transition-colors' : ''}`}>
                          {event.name}
                        </span>
                        {event.time && (
                          <span className="text-[10px] font-mono text-neutral-500">{formatTime(event.time)}</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${badgeStyle}`}>
                          {impactText}
                        </span>
                        {event.forecast && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                            FORECAST: {event.forecast}
                          </span>
                        )}
                        {event.previous && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                            PREV: {event.previous}
                          </span>
                        )}
                        {event.country && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                            {event.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* Margin bottom */}
            <div className="h-10"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
