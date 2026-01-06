'use client'

import { useState, useEffect, useMemo } from 'react'
import convergenceTerminalClient from '@/lib/api/convergenceTerminalClient'
import type {
  ConvergenceEvent,
  ConvergenceEventType,
  ConvergenceImpact,
} from '@/types/convergenceTerminal'
import { useAuth } from '@/hooks/useAuth'
import { Minus, Square, X, Menu, Grid, Inbox, Layers, Flag, Settings, Search, Bell, Calendar, Clock, RefreshCw, Radar } from 'lucide-react'

interface ConvergenceTerminalProps {
  defaultWatchlist?: string[]
  defaultDays?: number
}

export default function ConvergenceTerminal({
  defaultWatchlist = [],
  defaultDays = 60,
}: ConvergenceTerminalProps) {
  const { loading: authLoading } = useAuth()
  const [events, setEvents] = useState<ConvergenceEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>(defaultWatchlist)
  const [watchlistInput, setWatchlistInput] = useState('')
  const [selectedType, setSelectedType] = useState<ConvergenceEventType | 'all'>('all')
  const [selectedImpact, setSelectedImpact] = useState<ConvergenceImpact | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month')

  // Calculer les dates (aujourd'hui + defaultDays)
  const dateRange = useMemo(() => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + defaultDays)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }, [defaultDays])

  // Charger les événements
  useEffect(() => {
    if (authLoading) return

    const loadEvents = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await convergenceTerminalClient.getConvergenceEvents({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          watchlist: watchlist.length > 0 ? watchlist : undefined,
          debug: false,
        })

        if (response.success) {
          setEvents(response.events)
        } else {
          setError('Erreur lors du chargement des événements')
        }
      } catch (err: any) {
        console.error('Error loading convergence events:', err)
        setError(err.message || 'Erreur lors du chargement des événements')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [authLoading, dateRange.startDate, dateRange.endDate, watchlist])

  // Ajouter un ticker à la watchlist
  const addToWatchlist = () => {
    const tickers = watchlistInput
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t && !watchlist.includes(t))

    if (tickers.length > 0) {
      setWatchlist([...watchlist, ...tickers])
      setWatchlistInput('')
    }
  }

  // Retirer un ticker de la watchlist
  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(watchlist.filter((t) => t !== ticker))
  }

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let filtered = events.filter((event) => {
      const matchesType = selectedType === 'all' || event.type === selectedType
      const matchesImpact = selectedImpact === 'all' || event.impact === selectedImpact
      return matchesType && matchesImpact
    })

    // Filtrer par date si une date est sélectionnée
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0]
      filtered = filtered.filter((event) => {
        const eventDate = event.date.split('T')[0]
        return eventDate === selectedDateStr
      })
    }

    return filtered
  }, [events, selectedType, selectedImpact, selectedDate])

  // Grouper par ticker/catégorie pour la timeline
  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, ConvergenceEvent[]> = {}
    
    filteredEvents.forEach((event) => {
      const category = event.ticker || event.type
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(event)
    })

    return grouped
  }, [filteredEvents])

  // Calculer la position et largeur d'un événement dans la timeline
  const getEventPosition = (event: ConvergenceEvent, dateRange: { start: Date; end: Date }) => {
    const eventDate = new Date(event.date)
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromStart = Math.ceil((eventDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    
    const leftPercent = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100))
    const widthPercent = Math.max(8, Math.min(20, 100 / totalDays * 4)) // Largeur minimale 8%, max 20% pour meilleure lisibilité
    
    return { left: leftPercent, width: widthPercent }
  }

  // Calendrier mensuel
  const monthCalendar = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendar: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = []

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendar.push({
        day: prevMonthLastDay - i,
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      })
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push({
        day,
        date: new Date(year, month, day),
        isCurrentMonth: true,
      })
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - calendar.length
    for (let day = 1; day <= remainingDays; day++) {
      calendar.push({
        day,
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      })
    }

    return calendar
  }, [currentMonth])

  // Obtenir l'impact maximum d'un jour
  const getDayMaxImpact = (date: Date): ConvergenceImpact | null => {
    const dateStr = date.toISOString().split('T')[0]
    const dayEvents = events.filter((e) => e.date.split('T')[0] === dateStr)
    if (dayEvents.length === 0) return null

    const impactOrder: ConvergenceImpact[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    let maxImpact: ConvergenceImpact | null = null
    let maxIndex = Infinity

    dayEvents.forEach((event) => {
      const index = impactOrder.indexOf(event.impact)
      if (index < maxIndex) {
        maxIndex = index
        maxImpact = event.impact
      }
    })

    return maxImpact
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const getImpactColor = (impact: ConvergenceImpact) => {
    switch (impact) {
      case 'CRITICAL':
        return 'from-red-500/40 to-red-400/25 ring-red-400/40 text-white'
      case 'HIGH':
        return 'from-orange-500/40 to-orange-400/25 ring-orange-400/40 text-white'
      case 'MEDIUM':
        return 'from-yellow-500/40 to-yellow-400/25 ring-yellow-400/40 text-white'
      case 'LOW':
        return 'from-blue-500/40 to-blue-400/25 ring-blue-400/40 text-white'
      default:
        return 'from-white/10 to-white/5 ring-white/10 text-white'
    }
  }

  const getTypeColor = (type: ConvergenceEventType) => {
    switch (type) {
      case 'WHALE_RISK':
        return 'bg-blue-500/15 text-blue-300'
      case 'FDA':
        return 'bg-purple-500/15 text-purple-300'
      case 'MACRO':
        return 'bg-emerald-500/15 text-emerald-300'
      case 'EARNINGS':
        return 'bg-amber-500/15 text-amber-300'
      default:
        return 'bg-white/5 text-white'
    }
  }

  const getTypeIcon = (type: ConvergenceEventType) => {
    switch (type) {
      case 'WHALE_RISK':
        return '🐋'
      case 'FDA':
        return '🧪'
      case 'MACRO':
        return '📊'
      case 'EARNINGS':
        return '💰'
      default:
        return '📅'
    }
  }

  const getTypeBorderColor = (type: ConvergenceEventType) => {
    switch (type) {
      case 'WHALE_RISK':
        return 'ring-blue-400/30'
      case 'FDA':
        return 'ring-purple-400/30'
      case 'MACRO':
        return 'ring-emerald-400/30'
      case 'EARNINGS':
        return 'ring-amber-400/30'
      default:
        return 'ring-white/10'
    }
  }

  // Calculer la plage de dates pour la timeline
  const timelineDateRange = useMemo(() => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + defaultDays)
    return { start, end }
  }, [defaultDays])

  // Générer les labels de dates pour la timeline
  const timelineLabels = useMemo(() => {
    const labels: string[] = []
    const numLabels = 9 // 9 colonnes comme dans l'exemple
    const daysPerLabel = Math.ceil(defaultDays / numLabels)
    
    for (let i = 0; i <= numLabels; i++) {
      const date = new Date(timelineDateRange.start)
      date.setDate(date.getDate() + i * daysPerLabel)
      labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))
    }
    
    return labels
  }, [timelineDateRange, defaultDays])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const criticalCount = events.filter((e) => e.impact === 'CRITICAL').length

  return (
    <div className="ring-1 ring-white/10 supports-[backdrop-filter]:bg-neutral-950/60 outline outline-1 outline-white/5 overflow-hidden bg-neutral-950/70 rounded-2xl shadow-2xl backdrop-blur">
      {/* Frame Title Bar */}
      <div className="h-10 flex items-center justify-between px-3 sm:px-4 border-b border-white/10 bg-neutral-900/70">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500"></span>
          <span className="h-3 w-3 rounded-full bg-amber-400"></span>
          <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-neutral-300">Convergence Terminal — Market Timeline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="p-1.5 rounded-md hover:bg-neutral-800/70">
            <Minus className="w-[18px] h-[18px] text-neutral-300" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-neutral-800/70">
            <Square className="w-[18px] h-[18px] text-neutral-300" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-neutral-800/70">
            <X className="w-[18px] h-[18px] text-neutral-300" />
          </button>
        </div>
      </div>

      {/* App Shell */}
      <div className="flex flex-col lg:flex-row">
        {/* Slim Sidebar */}
        <aside className="hidden lg:flex lg:w-16 xl:w-20 flex-col gap-6 bg-neutral-900/60 pt-6 items-center">
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Menu className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Grid className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Inbox className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Layers className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Flag className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-neutral-800/70">
            <Settings className="w-5 h-5 text-neutral-400" />
          </button>
        </aside>

        {/* Main Content + Right Panel */}
        <main className="flex-1">
          <div className="sm:px-6 lg:px-8 pt-6 pr-4 pb-6 pl-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400/20 to-sky-400/10 ring-1 ring-white/10 flex items-center justify-center">
                    <Radar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h1 className="text-[22px] sm:text-2xl tracking-tight font-semibold">Convergence Terminal</h1>
                </div>
                <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4" />
                  <span>{todayLabel}</span>
                  {criticalCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/15 text-rose-300 px-1.5 text-[11px]">
                      {criticalCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex bg-neutral-900/70 ring-1 ring-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'day' ? 'text-neutral-300 bg-neutral-800/70' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'week' ? 'text-neutral-300 bg-neutral-800/70' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'month' ? 'text-neutral-300 bg-neutral-800/70' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewMode === 'year' ? 'text-neutral-300 bg-neutral-800/70' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Year
                  </button>
                </div>
                <button className="hidden sm:flex p-2 rounded-xl bg-neutral-900/70 ring-1 ring-white/10 hover:bg-neutral-800/70">
                  <Search className="w-5 h-5 text-neutral-300" />
                </button>
                <button className="relative p-2 rounded-xl bg-neutral-900/70 ring-1 ring-white/10 hover:bg-neutral-800/70">
                  <Bell className="w-5 h-5 text-neutral-300" />
                  {criticalCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-neutral-950"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Timeline + Cards */}
              <section className="xl:col-span-8 2xl:col-span-9">
                {/* Watchlist & Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type="text"
                        value={watchlistInput}
                        onChange={(e) => setWatchlistInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                        placeholder="Ajouter des tickers (ex: NVDA, AAPL, TSLA)"
                        className="w-full bg-neutral-900/70 border border-white/10 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder-neutral-600 font-mono"
                      />
                    </div>
                    <button
                      onClick={addToWatchlist}
                      className="px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm font-medium border border-orange-500/20"
                    >
                      Ajouter
                    </button>
                  </div>

                  {watchlist.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchlist.map((ticker) => (
                        <div
                          key={ticker}
                          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400 font-mono"
                        >
                          <span>{ticker}</span>
                          <button
                            onClick={() => removeFromWatchlist(ticker)}
                            className="text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">Type:</span>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as ConvergenceEventType | 'all')}
                        className="bg-neutral-900/70 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="all">Tous</option>
                        <option value="WHALE_RISK">🐋 Whale Risk</option>
                        <option value="FDA">🧪 FDA</option>
                        <option value="MACRO">📊 Macro</option>
                        <option value="EARNINGS">💰 Earnings</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">Impact:</span>
                      <select
                        value={selectedImpact}
                        onChange={(e) => setSelectedImpact(e.target.value as ConvergenceImpact | 'all')}
                        className="bg-neutral-900/70 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="all">Tous</option>
                        <option value="CRITICAL">🔴 Critical</option>
                        <option value="HIGH">🟠 High</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="LOW">🔵 Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="relative rounded-2xl bg-neutral-900/70 ring-1 ring-white/10 p-4 sm:p-6 overflow-hidden mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl tracking-tight font-semibold">Market Timeline</h2>
                      <span className="text-xs text-neutral-400">Next {defaultDays} days</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(dateRange.startDate)} — {formatDate(dateRange.endDate)}</span>
                    </div>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
                      {error}
                    </div>
                  )}

                  {!loading && filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
                      <p>Aucun événement trouvé pour cette période.</p>
                    </div>
                  )}

                  {!loading && filteredEvents.length > 0 && (
                    <>
                      {/* Header Columns */}
                      <div className="mt-4 hidden md:grid grid-cols-12 text-[11px] text-neutral-400 mb-2">
                        <div className="col-span-3"></div>
                        <div className="col-span-9 grid grid-cols-9">
                          {timelineLabels.slice(0, 9).map((label, idx) => (
                            <div key={idx} className="text-center">{label}</div>
                          ))}
                        </div>
                      </div>

                      {/* Rows */}
                      <div className="mt-2 space-y-3">
                        {Object.entries(eventsByCategory).map(([category, categoryEvents]) => {
                          const firstEvent = categoryEvents[0]
                          
                          return (
                            <div key={category} className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
                              <div className="md:col-span-3 flex items-center gap-3">
                                <button className={`hidden md:flex h-10 w-10 rounded-full ${getTypeColor(firstEvent.type)} items-center justify-center ring-1 ring-white/10 flex-shrink-0`}>
                                  <span className="text-base">{getTypeIcon(firstEvent.type)}</span>
                                </button>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {firstEvent.ticker || firstEvent.type.replace('_', ' ')}
                                  </p>
                                  <p className="text-xs text-neutral-400">
                                    {categoryEvents.length} event{categoryEvents.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="md:col-span-9">
                                <div className="relative h-16 w-full rounded-xl ring-1 ring-white/5 bg-neutral-950/40 overflow-visible">
                                  {/* Grid guides */}
                                  <div className="absolute inset-0 grid grid-cols-9 pointer-events-none">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                      <div key={i} className="border-r border-white/5"></div>
                                    ))}
                                  </div>
                                  {/* Event bars */}
                                  {categoryEvents.map((event, idx) => {
                                    const eventPos = getEventPosition(event, timelineDateRange)
                                    const eventDate = new Date(event.date)
                                    const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    const daysText = daysUntil === 0 ? 'Aujourd\'hui' : daysUntil === 1 ? '1j' : daysUntil < 0 ? `Il y a ${Math.abs(daysUntil)}j` : `${daysUntil}j`
                                    
                                    // Format date courte pour affichage
                                    const shortDate = eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                    
                                    return (
                                      <div
                                        key={event.id}
                                        className={`absolute top-1/2 -translate-y-1/2 h-14 rounded-lg bg-gradient-to-r ${getImpactColor(event.impact)} ${getTypeBorderColor(event.type)} ring-1 backdrop-blur-[2px] flex flex-col justify-center px-3 py-2.5 cursor-pointer hover:scale-[1.02] hover:ring-2 hover:shadow-xl transition-all shadow-lg group`}
                                        style={{
                                          left: `${eventPos.left}%`,
                                          width: `${Math.max(eventPos.width, 10)}%`,
                                          minWidth: '140px',
                                          zIndex: event.impact === 'CRITICAL' ? 10 : event.impact === 'HIGH' ? 5 : 1,
                                        }}
                                        title={`${event.title} - ${formatDate(event.date)}`}
                                      >
                                        <div className="flex items-center justify-between gap-2 w-full">
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-[12px] font-bold text-white truncate leading-tight">
                                              {event.ticker || event.type.replace('_', ' ')}
                                            </span>
                                          </div>
                                          {event.impact === 'CRITICAL' && (
                                            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse flex-shrink-0"></span>
                                          )}
                                          {event.impact === 'HIGH' && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.6)] flex-shrink-0"></span>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                          <span className="text-[11px] text-white/90 font-medium leading-tight">
                                            {shortDate}
                                          </span>
                                          <span className="text-[10px] text-white/80 font-semibold bg-white/10 px-2 py-0.5 rounded-md flex-shrink-0">
                                            {daysText}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Time labels */}
                      <div className="mt-5 hidden md:flex justify-end">
                        <div className="w-full md:w-9/12 grid grid-cols-9 text-[11px] text-neutral-500">
                          {timelineLabels.slice(0, 9).map((label, idx) => (
                            <div key={idx} className="text-center">{label}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Right Sidebar */}
              <aside className="xl:col-span-4 2xl:col-span-3 space-y-6">
                {/* Calendar */}
                <div className="rounded-2xl bg-neutral-900/70 ring-1 ring-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    >
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
                        className="text-neutral-200"
                      >
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                    </button>
                    <h3 className="text-sm font-medium tracking-tight text-white">
                      {formatMonthYear(currentMonth)}
                    </h3>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    >
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
                        className="text-neutral-200"
                      >
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-400 font-medium mb-2">
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {monthCalendar.map((dayInfo, idx) => {
                      const dayIsToday = isToday(dayInfo.date)
                      const dayIsSelected = isSelected(dayInfo.date)
                      const maxImpact = getDayMaxImpact(dayInfo.date)
                      const hasEvents = maxImpact !== null

                      if (!dayInfo.isCurrentMonth) {
                        return (
                          <div key={idx} className="p-1.5 text-neutral-700">
                            {dayInfo.day}
                          </div>
                        )
                      }

                      let dayColorClass = 'text-neutral-300 hover:text-white cursor-pointer rounded hover:bg-white/10'
                      if (dayIsSelected) {
                        dayColorClass = 'text-orange-400 font-semibold bg-orange-500/20 rounded border-2 border-orange-500'
                      } else if (dayIsToday) {
                        dayColorClass = 'text-orange-300 bg-orange-500/10 rounded border border-orange-500/20'
                      } else if (hasEvents) {
                        if (maxImpact === 'CRITICAL') {
                          dayColorClass = 'text-red-400 bg-red-500/20 border border-red-500/40 rounded'
                        } else if (maxImpact === 'HIGH') {
                          dayColorClass = 'text-orange-400 bg-orange-500/20 border border-orange-500/40 rounded'
                        } else if (maxImpact === 'MEDIUM') {
                          dayColorClass = 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/40 rounded'
                        } else {
                          dayColorClass = 'text-blue-400 bg-blue-500/20 border border-blue-500/40 rounded'
                        }
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDate(dayInfo.date)}
                          className={`p-1.5 ${dayColorClass} transition-colors`}
                        >
                          {dayInfo.day}
                        </div>
                      )
                    })}
                  </div>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="w-full mt-4 text-[11px] text-neutral-500 hover:text-neutral-400 text-center transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Overview */}
                <div className="rounded-2xl bg-neutral-900/70 ring-1 ring-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg tracking-tight font-semibold">Overall Progress</h3>
                    <button className="p-1.5 rounded-lg hover:bg-neutral-800/70">
                      <RefreshCw className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">Total Events: {filteredEvents.length}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-2xl font-semibold text-white">
                        {events.filter((e) => e.impact === 'CRITICAL').length}
                      </div>
                      <div className="text-xs text-neutral-400">Critical</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-2xl font-semibold text-white">
                        {events.filter((e) => e.impact === 'HIGH').length}
                      </div>
                      <div className="text-xs text-neutral-400">High</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-2xl font-semibold text-white">
                        {events.filter((e) => e.impact === 'MEDIUM').length}
                      </div>
                      <div className="text-xs text-neutral-400">Medium</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <div className="text-2xl font-semibold text-white">
                        {events.filter((e) => e.impact === 'LOW').length}
                      </div>
                      <div className="text-xs text-neutral-400">Low</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-neutral-900/70 ring-1 ring-white/10 p-5">
                    <p className="text-xs text-neutral-400">Total Events</p>
                    <p className="mt-2 text-2xl tracking-tight font-semibold">{events.length}</p>
                  </div>
                  <div className="ring-1 ring-teal-300/30 bg-teal-400/20 rounded-2xl p-5">
                    <p className="text-xs text-neutral-100">Upcoming</p>
                    <p className="mt-2 text-2xl tracking-tight font-semibold">{filteredEvents.length}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
