'use client'

import { useState, useEffect, useMemo } from 'react'
import economicCalendarClient from '@/lib/api/economicCalendarClient'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Mail, CalendarDays, CalendarClock, CalendarRange, MapPin, ChevronRight, Play } from 'lucide-react'

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

export default function MacroCalendarPage() {
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
          .slice(0, 20) // Limiter à 20 événements

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
  }, [authLoading])

  // Format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month}, ${day}`
  }

  // Format day of week
  const formatDayOfWeek = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  // Get impact color - aligné avec le thème du site
  const getImpactColor = (impact: 'HIGH' | 'MED' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return 'text-orange-400'
      case 'MED':
        return 'text-orange-300'
      case 'LOW':
        return 'text-neutral-400'
      default:
        return 'text-neutral-400'
    }
  }

  // Get location/category text
  const getLocationText = (event: MacroEvent) => {
    if (event.type === 'FOMC') {
      return 'Federal Reserve'
    } else if (event.country) {
      return `${event.country} - ${event.category}`
    }
    return event.category
  }

  // Get icon based on event type
  const getEventIcon = (event: MacroEvent) => {
    if (event.type === 'FOMC' || event.type === '13F') {
      return CalendarClock
    } else if (event.time && event.time.includes(':')) {
      return CalendarRange
    }
    return CalendarDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-400 mb-2">Erreur</div>
          <div className="text-neutral-400 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  // Trouver le premier événement HIGH pour le featured
  const featuredEvent = events.find(e => e.impact === 'HIGH') || events[0]
  const regularEvents = events.filter(e => e.id !== featuredEvent?.id)

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neutral-900/40 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-900/5 blur-[150px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/5 blur-[120px]"></div>
      </div>

      <section id="macro-calendar-upcoming-events" className="relative z-10 max-w-7xl md:px-8 mt-10 mr-auto ml-auto pr-6 pl-6 pb-20">
        {/* Header with buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 hover:bg-orange-500/15 transition"
          >
            <Calendar className="h-4 w-4" />
            <span className="tracking-wide">Explore Macro Calendar</span>
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <Mail className="h-4 w-4" />
            <span className="tracking-wide">Sign up for our newsletter</span>
          </a>
        </div>

        {/* Title */}
        <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight text-white/95 uppercase">
          Upcoming Events
        </h2>

        {/* Events List */}
        <div className="mt-6 space-y-4">
          {/* Regular Events */}
          {regularEvents.slice(0, 2).map((event) => {
            const EventIcon = getEventIcon(event)
            const impactColor = getImpactColor(event.impact)
            
            return (
              <article
                key={event.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-5 py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-4">
                  <div className="flex items-center md:block justify-between">
                    <div className={`flex items-center gap-2 ${impactColor} text-[11px] uppercase tracking-wide`}>
                      <EventIcon className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <p className="md:mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white/95">
                      {formatDayOfWeek(event.date)}
                    </p>
                  </div>
                  <div>
                    <div className={`flex items-center gap-2 text-[11px] uppercase tracking-wide ${impactColor}`}>
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{getLocationText(event)}</span>
                    </div>
                    <h3 className="mt-1 text-base md:text-lg font-semibold tracking-tight text-white">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      {event.description || `${event.category} event for ${event.country}`}
                    </p>
                    {event.forecast && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                        {event.previous && <span>Prev: {event.previous}</span>}
                        <span>Forecast: {event.forecast}</span>
                      </div>
                    )}
                  </div>
                  <a
                    href="#"
                    aria-label={`View ${event.name} event`}
                    className="justify-self-end h-10 w-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            )
          })}

          {/* Featured Event */}
          {featuredEvent && (
            <article className="group relative overflow-hidden rounded-2xl border border-orange-400/30 bg-orange-500/5 backdrop-blur shadow-lg shadow-orange-500/20">
              {/* Background gradient instead of image */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-orange-800/30 to-orange-900/20"></div>
              <div className="relative px-5 py-5">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-4">
                  <div className="flex items-center md:block justify-between">
                    <div className="flex items-center gap-2 text-orange-300 text-[11px] uppercase tracking-wide">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span>{formatEventDate(featuredEvent.date)}</span>
                    </div>
                    <p className="md:mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-white">
                      {formatDayOfWeek(featuredEvent.date)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-orange-300">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{getLocationText(featuredEvent)}</span>
                    </div>
                    <h3 className="mt-1 text-lg md:text-2xl font-semibold tracking-tight text-white">
                      {featuredEvent.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      {featuredEvent.description || `${featuredEvent.category} event - High impact on markets`}
                    </p>
                    {featuredEvent.forecast && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/70">
                        {featuredEvent.previous && <span>Previous: {featuredEvent.previous}</span>}
                        <span>Forecast: {featuredEvent.forecast}</span>
                      </div>
                    )}
                  </div>
              
                </div>
              </div>
              <span className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-orange-400/30"></span>
            </article>
          )}

          {/* Remaining Events */}
          {regularEvents.slice(2).map((event) => {
            const EventIcon = getEventIcon(event)
            const impactColor = getImpactColor(event.impact)
            
            return (
              <article
                key={event.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-5 py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-4">
                  <div className="flex items-center md:block justify-between">
                    <div className={`flex items-center gap-2 ${impactColor} text-[11px] uppercase tracking-wide`}>
                      <EventIcon className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <p className="md:mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white/95">
                      {formatDayOfWeek(event.date)}
                    </p>
                  </div>
                  <div>
                    <div className={`flex items-center gap-2 text-[11px] uppercase tracking-wide ${impactColor}`}>
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{getLocationText(event)}</span>
                    </div>
                    <h3 className="mt-1 text-base md:text-lg font-semibold tracking-tight text-white">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      {event.description || `${event.category} event for ${event.country}`}
                    </p>
                    {event.forecast && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                        {event.previous && <span>Prev: {event.previous}</span>}
                        <span>Forecast: {event.forecast}</span>
                      </div>
                    )}
                  </div>
                  <a
                    href="#"
                    aria-label={`View ${event.name} event`}
                    className="justify-self-end h-10 w-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
