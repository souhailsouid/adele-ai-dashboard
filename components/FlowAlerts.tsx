'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import flowAlertsService from '@/services/flowAlertsService'
import type { FlowAlert, FlowAlertsParams } from '@/lib/api/flowAlertsClient'
import { useAuthModal } from './useAuthModal'
import { useAuth } from '@/hooks/useAuth'
import FlowAlertDetailModal from './FlowAlertDetailModal'
import FlowAlertsContextual from './FlowAlertsContextual'
import MacroCalendar from './MacroCalendar'

// Presets intelligents
interface FlowPreset {
  id: string
  name: string
  icon: string
  description: string
  params: Partial<FlowAlertsParams>
  color: string
}

const FLOW_PRESETS: FlowPreset[] = [
  {
    id: 'whale-hunt',
    name: 'Whale Hunt',
    icon: '🐋',
    description: 'Transactions institutionnelles exceptionnelles',
    params: {
      vol_greater_oi: true,
      is_floor: true,
      min_volume: 10000,
      min_open_interest: 1000,
      min_dte: 7,
    },
    color: 'orange',
  },
  {
    id: 'aggressive-flow',
    name: 'Aggressive Flow',
    icon: '⚡',
    description: 'Achats agressifs à fort momentum',
    params: {
      is_sweep: true,
      min_volume_oi_ratio: 2.0,
      min_volume: 5000,
      min_open_interest: 1000,
      min_dte: 7,
    },
    color: 'emerald',
  },
  {
    id: 'institutional-otc',
    name: 'Institutional OTC',
    icon: '🏢',
    description: 'Floor trades institutionnels',
    params: {
      is_floor: true,
      min_volume: 3000,
      min_open_interest: 1000,
      rule_name: ['FloorTradeLargeCap', 'FloorTradeMidCap'],
    },
    color: 'blue',
  },
  {
    id: 'large-cap-focus',
    name: 'Large Cap',
    icon: '🎯',
    description: 'Méga caps uniquement (>$50B)',
    params: {
      min_marketcap: 50000000000,
      issue_types: ['Common Stock'],
      min_volume: 5000,
      min_open_interest: 1000,
      min_dte: 7,
      max_dte: 365,
    },
    color: 'purple',
  },
  {
    id: 'volatility-spike',
    name: 'Vol Spike',
    icon: '🔥',
    description: 'Forte volatilité (+5% IV)',
    params: {
      min_iv_change: 0.01,
      min_volume: 1000,
      min_volume_oi_ratio: 0.8,
      min_open_interest: 500,
      min_dte: 7,
    },
    color: 'red',
  },
  {
    id: 'volatility-moderate',
    name: 'Vol Moderate',
    icon: '🌡️',
    description: 'Volatilité modérée (+3% IV)',
    params: {
      min_iv_change: 0.03,
      min_volume: 500,
      min_open_interest: 300,
      min_dte: 3,
    },
    color: 'yellow',
  },
]

export default function FlowAlerts() {
  const [alerts, setAlerts] = useState<FlowAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'calls' | 'puts'>('all')
  const [tickerInput, setTickerInput] = useState('')
  const [searchedTicker, setSearchedTicker] = useState('')
  const [minVolume, setMinVolume] = useState(0)
  const [minVolumeOI, setMinVolumeOI] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<FlowAlert | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleAlertId, setVisibleAlertId] = useState<string | null>(null)
  const alertRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { openModal } = useAuthModal()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const previousAuthState = useRef<boolean>(false)

  const loadFlowAlerts = useCallback(async (
    ticker?: string,
    forceRefresh = false,
    presetParams?: Partial<FlowAlertsParams>
  ) => {
    if (!isAuthenticated()) {
      setLoading(false)
      setError('Authentification requise. Vous devez être connecté pour accéder aux Flow Alerts.')
      setAlerts([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const finalParams: FlowAlertsParams = {
        limit: 100,
        min_premium: 1000000,
        ...(ticker && ticker.trim() && { ticker_symbol: ticker.trim().toUpperCase() }),
        ...(presetParams || {}),
      }

      const response = await flowAlertsService.getFlowAlerts(
        finalParams,
        forceRefresh
      )
      setAlerts(response.data || [])
      setSearchedTicker(ticker || '')
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des données'
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentification requise') || errorMessage.includes('Token')) {
        setError('Authentification requise. Vous devez être connecté pour accéder aux Flow Alerts.')
      } else {
        setError(errorMessage)
      }
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return

    if (!previousAuthState.current && isAuthenticated()) {
      loadFlowAlerts(searchedTicker || undefined, true)
    }
    previousAuthState.current = isAuthenticated()

    if (!isAuthenticated()) {
      setLoading(false)
      setError('Authentification requise. Vous devez être connecté pour accéder aux Flow Alerts.')
      setAlerts([])
      return
    }

    if (alerts.length === 0 && !searchedTicker) {
      const timer = setTimeout(() => {
        loadFlowAlerts(undefined, true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, loadFlowAlerts])

  const filteredAlerts = useMemo(() => {
    let result = alerts || []

    if (activePreset) {
      const preset = FLOW_PRESETS.find(p => p.id === activePreset)
      if (preset) {
        result = flowAlertsService.filterByPreset(result, preset.params)
      }
    }

    return result.filter((alert: FlowAlert) => {
      const matchesType = filter === 'all' ||
        (filter === 'calls' && alert.type === 'call') ||
        (filter === 'puts' && alert.type === 'put')

      const matchesVolume = alert.volume >= minVolume

      const volumeOIRatio = parseFloat(alert.volume_oi_ratio || '0')
      const matchesVolumeOI = volumeOIRatio >= minVolumeOI

      return matchesType && matchesVolume && matchesVolumeOI
    })
  }, [alerts, activePreset, filter, minVolume, minVolumeOI])

  // Gestionnaire pour mettre à jour le calendrier au hover sur une ligne
  const handleRowHover = (alertId: string) => {
    setVisibleAlertId(alertId)
  }

  // Ne pas réinitialiser quand on quitte le hover - garder le dernier état
  // Cela permet de conserver les données de la timeline même après avoir quitté le survol
  const handleRowLeave = () => {
    // Ne rien faire - garder visibleAlertId pour conserver l'état de la timeline
  }

  const handleTickerSearch = () => {
    loadFlowAlerts(tickerInput)
  }

  const handleClearSearch = () => {
    setTickerInput('')
    setSearchedTicker('')
    loadFlowAlerts()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTickerSearch()
    }
  }

  const handlePresetClick = (preset: FlowPreset) => {
    flowAlertsService.clearCache()

    if (activePreset === preset.id) {
      setActivePreset(null)
      loadFlowAlerts(searchedTicker || undefined, true)
    } else {
      setActivePreset(preset.id)
      loadFlowAlerts(searchedTicker || undefined, true, preset.params)
    }
  }

  const handleRowClick = (alert: FlowAlert) => {
    setSelectedAlert(alert)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <section className="max-w-[1600px] mx-auto px-4 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tighter text-white mb-4">
            Flow Alerts — Institutional Activity
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
            Real-time detection of large institutional trades with premium exceeding $1M.
            These alerts signal significant market moves before they happen.
          </p>
        </div>
        <div className="glass-card rounded-[1.2em] p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-neutral-400 mt-4">Chargement des données...</p>
        </div>
      </section>
    )
  }

  if (error) {
    const isAuthError = error.includes('connecté') || error.includes('authentification') || error.includes('Token') || error.includes('Not authenticated')

    return (
      <section className="max-w-[1800px] mx-auto px-4 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tighter text-white mb-4">
            Flow Alerts — Institutional Activity
          </h2>
        </div>
        <div className="glass-card rounded-[1.2em] p-12 text-center">
          {isAuthError ? (
            <>
              <div className="text-orange-400 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" x2="12" y1="9" y2="13"></line>
                  <line x1="12" x2="12.01" y1="17" y2="17"></line>
                </svg>
              </div>
              <p className="text-lg font-medium text-red-400 mb-2">Authentification requise</p>
              <p className="text-sm text-neutral-500 mb-4">Vous devez être connecté pour accéder aux Flow Alerts.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => openModal('login')}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => openModal('signup')}
                  className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                >
                  Créer un compte
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-red-400 mb-2">Erreur de chargement</p>
              <p className="text-sm text-neutral-500 mb-4">{error}</p>
              <button
                onClick={() => loadFlowAlerts(searchedTicker || undefined, true)}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-[1800px] mx-auto px-2 mb-32 relative">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
          Flow Alerts — Institutional Activity
        </h2>
        <p className="text-neutral-400 text-sm max-w-2xl mx-auto font-light leading-relaxed">
          Real-time detection of large institutional trades with premium exceeding $1M. 
          These alerts signal significant market moves before they happen.
        </p>
      </div>

      {/* WORKSPACE GRID LAYOUT - 12 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Main Flow Table (Takes 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filter Bar */}
          <div className="glass-card rounded-xl p-1.5 flex flex-wrap gap-1 items-center bg-[#111111] border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-neutral-800 text-white border border-white/10 shadow-sm'
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('calls')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'calls'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Calls Only
            </button>
            <button
              onClick={() => setFilter('puts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'puts'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Puts Only
            </button>
            
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            
            {FLOW_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id
              const colorMap: Record<string, string> = {
                orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                red: 'bg-red-500/10 text-red-400 border-red-500/20',
                yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
              }
              const activeClass = colorMap[preset.color] || colorMap.blue
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? `${activeClass} border`
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span className="hidden sm:inline">{preset.name}</span>
                </button>
              )
            })}
          </div>

          {/* Active Filters / Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="text-neutral-500 group-focus-within:text-white transition-colors"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Ticker"
                className="bg-[#111111] border border-white/10 text-white text-xs rounded-lg block w-32 pl-9 pr-2.5 py-2 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder-neutral-600 font-mono tracking-tight"
              />
            </div>
            {searchedTicker && (
              <div className="px-2.5 py-1.5 rounded border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-bold tracking-wider uppercase">
                {searchedTicker}
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <span className="flex items-center gap-1.5 text-green-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                LIVE
              </span>
              <span>{filteredAlerts.length} ALERTS</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#111111] text-xs transition-colors ${
                showFilters || minVolume > 0 || minVolumeOI > 0
                  ? 'text-orange-400 border-orange-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
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
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filtres avancés
              {(minVolume > 0 || minVolumeOI > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="glass-card rounded-xl p-4 border border-white/10 bg-[#111111]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                    <span>Volume minimum</span>
                    <span className="text-orange-400 font-mono">{minVolume.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={minVolume}
                    onChange={(e) => setMinVolume(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>0</span>
                    <span>10K</span>
                    <span>25K</span>
                    <span>50K</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                    <span>Ratio Volume/OI minimum</span>
                    <span className="text-orange-400 font-mono">{minVolumeOI.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minVolumeOI}
                    onChange={(e) => setMinVolumeOI(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>0x</span>
                    <span>1x</span>
                    <span>2x</span>
                    <span>3x</span>
                    <span>5x</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABLE Container */}
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-50">
                    <tr className="border-b border-white/5 bg-gradient-to-r from-neutral-900/98 via-neutral-900/95 to-neutral-900/98 backdrop-blur-xl shadow-lg">
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider">Ticker / Time</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider">Type / Rule</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider">Strike / Exp</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider">Premium / Price</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider">Volume / OI</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider text-right">IV Change</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider text-center">Whale Score</th>
                    <th className="px-4 py-3 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-wider text-right">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                        Aucune alerte trouvée avec les filtres actuels
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert, idx) => {
                      const sentiment = flowAlertsService.getSentiment(alert)
                      const whaleScore = flowAlertsService.getWhaleScore(alert)
                      const ivChange = flowAlertsService.getIVChange(alert)
                      
                      return (
                        <tr
                          key={alert.id}
                          ref={(el) => {
                            if (el) alertRefs.current.set(alert.id, el)
                            else alertRefs.current.delete(alert.id)
                          }}
                          data-alert-id={alert.id}
                          onClick={() => handleRowClick(alert)}
                          onMouseEnter={() => handleRowHover(alert.id)}
                          onMouseLeave={handleRowLeave}
                          className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${
                            idx === 0 ? 'bg-white/[0.01] shimmer' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded bg-orange-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-orange-900/20">
                                {alert.ticker}
                              </div>
                              <div>
                                <div className="text-base font-bold text-white tracking-tight mb-1">{alert.ticker}</div>
                                <div className="text-xs font-mono font-semibold text-neutral-400 mb-0.5">
                                  {flowAlertsService.formatDate(alert.created_at)}
                                </div>
                                <div className="text-[10px] text-neutral-600">{alert.sector}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  alert.type === 'call'
                                    ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-900/30 border border-red-500/20 text-red-400'
                                }`}
                              >
                                {alert.type.toUpperCase()}
                                {alert.has_sweep && ' SWEEP'}
                                {alert.has_floor && ' FLOOR'}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {alert.alert_rule.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-mono text-base font-bold text-white mb-1">
                              ${alert.strike} {alert.type === 'call' ? 'C' : 'P'}
                            </div>
                            <div className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                              EXP {flowAlertsService.formatExpiry(alert.expiry)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-mono text-base font-bold text-orange-400 mb-1">
                              {flowAlertsService.formatPremium(alert.total_premium)}
                            </div>
                            <div className="text-sm font-mono font-semibold text-white mb-1">
                              @ ${parseFloat(alert.price).toFixed(2)}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              Bid ${alert.bid} / Ask ${alert.ask}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-mono text-sm font-bold text-white mb-1">
                              Vol: <span className="text-orange-400">{alert.volume.toLocaleString()}</span>
                            </div>
                            <div className="text-xs font-mono font-semibold text-neutral-300 mb-1">
                              OI: {alert.open_interest.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              Ratio: {parseFloat(alert.volume_oi_ratio || '0').toFixed(2)}x
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {Math.abs(ivChange) >= 0.05 ? (
                              <span className={`font-mono text-sm font-bold px-2 py-1 rounded border ${
                                ivChange > 0 
                                  ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              }`}>
                                {ivChange > 0 ? '+' : ''}{(ivChange * 100).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-neutral-400">
                                {ivChange > 0 ? '+' : ''}{(ivChange * 100).toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {whaleScore === 'WHALE' ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-300 mx-auto w-fit">
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
                                  <path d="m22 2-7 20-4-9-9-4Z"></path>
                                  <path d="M22 2 11 13"></path>
                                </svg>
                                <span className="text-[10px] font-bold">WHALE</span>
                              </div>
                            ) : (
                              <div className="w-16 h-1 bg-neutral-800 rounded-full mx-auto overflow-hidden">
                                <div 
                                  className="h-full bg-orange-500" 
                                  style={{ width: `${typeof whaleScore === 'number' ? whaleScore : 0}%` }}
                                ></div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`text-sm font-bold px-2 py-1 rounded border ${
                                sentiment.color === 'emerald' 
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                  : 'text-red-400 bg-red-500/10 border-red-500/20'
                              }`}
                            >
                              {sentiment.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            <div className="border-t border-white/5 p-3 flex items-center justify-between bg-gradient-to-r from-neutral-900/30 to-transparent">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  const presetParams = activePreset 
                    ? FLOW_PRESETS.find(p => p.id === activePreset)?.params 
                    : undefined
                  loadFlowAlerts(searchedTicker, true, presetParams)
                }}
                className="text-xs text-neutral-400 hover:text-orange-400 transition-all duration-200 flex items-center gap-2 font-sans hover:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-orange-500/20"
                disabled={loading}
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
                  className={loading ? 'animate-spin' : ''}
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
                {loading ? 'Actualisation...' : 'Actualiser'}
              </button>
              <span className="text-[10px] font-mono text-neutral-600">
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Context Alert Calendar (Sticky) - Takes 4 cols */}
        <div className="lg:col-span-4 sticky top-24">
          <FlowAlertsContextual
            ticker={searchedTicker || (filteredAlerts.length > 0 ? filteredAlerts[0].ticker : undefined) || undefined}
            alerts={filteredAlerts}
            category={activePreset || 'all'}
            visibleAlertId={visibleAlertId || undefined}
          />
        </div>
      </div>

      {/* Modal de détails de l'alerte */}
      <FlowAlertDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        alert={selectedAlert}
      />
    </section>
  )
}
