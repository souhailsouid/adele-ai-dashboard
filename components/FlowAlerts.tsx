'use client'

import { useState, useEffect, useRef } from 'react'
import flowAlertsService from '@/services/flowAlertsService'
import type { FlowAlert, FlowAlertsParams } from '@/lib/api/flowAlertsClient'
import { useAuthModal } from './useAuthModal'
import { useAuth } from '@/hooks/useAuth'

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
      min_dte: 7, // Évite expirations proches
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
      min_marketcap: 50000000000, // $50B
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
      min_iv_change: 0.01,      // ✅ Réduit à 1% pour plus de résultats
      min_volume: 1000,         // Volume minimum réduit
      min_volume_oi_ratio: 0.8, // Ratio plus permissif
      min_open_interest: 500,   // OI minimum réduit
      min_dte: 7,               // Expire dans 7+ jours
    },
    color: 'red',
  },
  {
    id: 'volatility-moderate',
    name: 'Vol Moderate',
    icon: '🌡️',
    description: 'Volatilité modérée (+3% IV)',
    params: {
      min_iv_change: 0.03,      // +3% IV (plus de résultats)
      min_volume: 500,          // Volume très permissif
      min_open_interest: 300,   // OI minimum bas
      min_dte: 3,               // Expire dans 3+ jours
    },
    color: 'yellow',
  },
]

export default function FlowAlerts() {
  const [alerts, setAlerts] = useState<FlowAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'calls' | 'puts'>('all')
  const [tickerInput, setTickerInput] = useState('') // Input de saisie
  const [searchedTicker, setSearchedTicker] = useState('') // Ticker actuellement recherché
  const [minVolume, setMinVolume] = useState(0) // Volume minimum
  const [minVolumeOI, setMinVolumeOI] = useState(0) // Ratio Volume/OI minimum
  const [showFilters, setShowFilters] = useState(false) // Afficher les filtres avancés
  const [activePreset, setActivePreset] = useState<string | null>(null) // Preset actif
  const { openModal } = useAuthModal() // Pour ouvrir la modal d'authentification
  const { isAuthenticated, loading: authLoading, user } = useAuth() // Pour détecter les changements d'auth
  const previousAuthState = useRef<boolean>(false) // Pour tracker l'état précédent

  // Fonction pour charger les alertes (définie avant les useEffect)
  const loadFlowAlerts = async (
    ticker?: string, 
    forceRefresh = false,
    presetParams?: Partial<FlowAlertsParams>
  ) => {
    // Vérifier l'authentification AVANT de charger
    if (!isAuthenticated()) {
      setLoading(false)
      setError('Authentification requise. Vous devez être connecté pour accéder aux Flow Alerts.')
      setAlerts([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Construire les paramètres finaux
      const finalParams: FlowAlertsParams = {
        limit: 100,
        min_premium: 1000000,
        ...(ticker && ticker.trim() && { ticker_symbol: ticker.trim().toUpperCase() }),
        ...(presetParams || {}), // Ajouter les paramètres du preset
      }
      
      const response = await flowAlertsService.getFlowAlerts(
        finalParams,
        forceRefresh
      )
      
      // Vérification de sécurité
      if (response && Array.isArray(response.data)) {
        setAlerts(response.data)
        setSearchedTicker(ticker?.trim().toUpperCase() || '')
      } else {
        setAlerts([])
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
      setAlerts([]) // Reset en cas d'erreur
    } finally {
      setLoading(false)
    }
  }

  // Recharger les données après la connexion
  useEffect(() => {
    // Attendre que le chargement de l'auth soit terminé
    if (authLoading) return

    const wasAuthenticated = previousAuthState.current
    const isCurrentlyAuthenticated = isAuthenticated()

    // Si l'utilisateur vient de se connecter (passage de non-auth à auth)
    if (!wasAuthenticated && isCurrentlyAuthenticated) {
      // Vider le cache et recharger
      flowAlertsService.clearCache()
      
      // Récupérer les paramètres du preset actif si nécessaire
      const presetParams = activePreset 
        ? FLOW_PRESETS.find(p => p.id === activePreset)?.params 
        : undefined

      // Petit délai pour s'assurer que les tokens sont bien sauvegardés
      setTimeout(() => {
        loadFlowAlerts(searchedTicker || undefined, true, presetParams)
      }, 300)
    }

    // Mettre à jour l'état précédent
    previousAuthState.current = isCurrentlyAuthenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email, activePreset, searchedTicker])

  // Chargement initial
  useEffect(() => {
    // Attendre que le chargement de l'auth soit terminé
    if (authLoading) {
      setLoading(true)
      return
    }

    // Si non authentifié, afficher l'erreur directement sans charger
    if (!isAuthenticated()) {
      setLoading(false)
      setError('Authentification requise. Vous devez être connecté pour accéder aux Flow Alerts.')
      setAlerts([])
      return
    }

    // Si authentifié, charger les données
    const timer = setTimeout(() => {
      loadFlowAlerts()
    }, 100)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  // Recherche par ticker
  const handleTickerSearch = () => {
    loadFlowAlerts(tickerInput)
  }

  // Réinitialiser la recherche
  const handleClearSearch = () => {
    setTickerInput('')
    setSearchedTicker('')
    loadFlowAlerts()
  }

  // Recherche au Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTickerSearch()
    }
  }

  // Appliquer un preset
  const handlePresetClick = (preset: FlowPreset) => {
    // Vider le cache pour forcer un nouveau fetch
    flowAlertsService.clearCache()
    
    if (activePreset === preset.id) {
      // Désactiver le preset
      setActivePreset(null)
      loadFlowAlerts(searchedTicker || undefined, true) // Force refresh
    } else {
      // Activer le preset
      setActivePreset(preset.id)
      loadFlowAlerts(searchedTicker || undefined, true, preset.params) // Force refresh avec params
    }
  }

  // Filtrage côté client : type, volume, ratio Volume/OI, et filtres preset
  let filteredAlerts = alerts || []
  
  // 1. Appliquer les filtres du preset actif (ex: min_iv_change pour Vol Spike)
  if (activePreset) {
    const preset = FLOW_PRESETS.find(p => p.id === activePreset)
    if (preset) {
      filteredAlerts = flowAlertsService.filterByPreset(filteredAlerts, preset.params)
    }
  }
  
  // 2. Filtres UI manuels
  filteredAlerts = filteredAlerts.filter((alert) => {
    // Filtre par type (call/put)
    const matchesType = filter === 'all' || 
      (filter === 'calls' && alert.type === 'call') ||
      (filter === 'puts' && alert.type === 'put')
    
    // Filtre par volume minimum
    const matchesVolume = alert.volume >= minVolume
    
    // Filtre par ratio Volume/OI minimum
    const volumeOIRatio = parseFloat(alert.volume_oi_ratio)
    const matchesVolumeOI = volumeOIRatio >= minVolumeOI
    
    return matchesType && matchesVolume && matchesVolumeOI
  })

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 mb-32">
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
      <section className="max-w-7xl mx-auto px-6 mb-32">
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <h3 className="text-xl font-semibold mb-2">Session expirée</h3>
                <p className="text-sm text-neutral-400 max-w-md mx-auto">
                  Votre session a expiré. Veuillez vous reconnecter pour continuer.
                </p>
              </div>
              <div className="flex gap-3 justify-center mt-8">
                <button
                  onClick={() => openModal('login')}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors inline-flex items-center gap-2 font-medium"
                >
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
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" x2="3" y1="12" y2="12"></line>
                  </svg>
                  Se connecter
                </button>
                <button
                  onClick={() => openModal('signup')}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 font-medium border border-white/10"
                >
                  Créer un compte
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="12"></line>
                  <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
                <p className="text-lg font-medium">Erreur de chargement</p>
                <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">{error}</p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => loadFlowAlerts(searchedTicker || undefined, true)}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-6 mb-32">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tighter text-white mb-4">
          Flow Alerts — Institutional Activity
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
          Real-time detection of large institutional trades with premium exceeding $1M. 
          These alerts signal significant market moves before they happen.
        </p>
      </div>

      <div className="glass-card rounded-[1.2em]">
        <div className="bg-neutral-900/30">
          {/* Main Controls */}
          <div className="border-b border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filter === 'all'
                    ? 'bg-white/10 text-white border-white/10'
                    : 'bg-transparent text-neutral-500 hover:text-white border-transparent'
                }`}
              >
                All Alerts
              </button>
              <button
                onClick={() => setFilter('calls')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filter === 'calls'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-transparent text-neutral-500 hover:text-white border-transparent'
                }`}
              >
                Calls Only
              </button>
              <button
                onClick={() => setFilter('puts')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filter === 'puts'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-transparent text-neutral-500 hover:text-white border-transparent'
                }`}
              >
                Puts Only
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-white/10"></div>

              {/* Presets intelligents */}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${
                      isActive
                        ? activeClass
                        : 'bg-transparent text-neutral-500 hover:text-white border-transparent hover:border-white/10'
                    }`}
                    title={preset.description}
                  >
                    <span>{preset.icon}</span>
                    <span className="hidden sm:inline">{preset.name}</span>
                  </button>
                )
              })}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Ticker Search */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search ticker (e.g., TSLA)..."
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="px-3 py-1.5 rounded-full text-xs bg-neutral-900/50 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-48"
                />
                <button
                  onClick={handleTickerSearch}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                  title="Search Ticker"
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
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
                {searchedTicker && (
                  <button
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-white/10 hover:bg-neutral-700 transition-colors"
                    title="Clear Search"
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
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500">
                {searchedTicker && (
                  <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {searchedTicker}
                  </span>
                )}
                {activePreset && (
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    {FLOW_PRESETS.find(p => p.id === activePreset)?.icon}
                    <span className="hidden md:inline">{FLOW_PRESETS.find(p => p.id === activePreset)?.name}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> LIVE
                </span>
                <span>{filteredAlerts.length} ALERTS</span>
              </div>
              
              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  showFilters || minVolume > 0 || minVolumeOI > 0
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'bg-neutral-800 text-neutral-400 border border-white/10 hover:bg-neutral-700'
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
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-b border-white/5 p-4 bg-neutral-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Volume Filter */}
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
                  {minVolume > 0 && (
                    <button
                      onClick={() => setMinVolume(0)}
                      className="text-[10px] text-neutral-500 hover:text-orange-400 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                {/* Volume/OI Ratio Filter */}
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
                  {minVolumeOI > 0 && (
                    <button
                      onClick={() => setMinVolumeOI(0)}
                      className="text-[10px] text-neutral-500 hover:text-orange-400 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Summary */}
              {(minVolume > 0 || minVolumeOI > 0) && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    <span className="font-medium text-white">{filteredAlerts.length}</span> alertes correspondent aux critères
                    {minVolume > 0 && <span> · Vol ≥ {minVolume.toLocaleString()}</span>}
                    {minVolumeOI > 0 && <span> · Ratio ≥ {minVolumeOI.toFixed(2)}x</span>}
                  </div>
                  <button
                    onClick={() => {
                      setMinVolume(0)
                      setMinVolumeOI(0)
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
                  >
                    Réinitialiser tous les filtres
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-8 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            <div className="col-span-1">Ticker / Time</div>
            <div className="col-span-1">Type / Rule</div>
            <div className="col-span-1">Strike / Exp</div>
            <div className="col-span-1">Premium / Price</div>
            <div className="col-span-1">Volume / OI</div>
            <div className="col-span-1 text-center">IV Change</div>
            <div className="col-span-1 text-center">Whale Score</div>
            <div className="col-span-1 text-right">Sentiment</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5 text-sm">
            {filteredAlerts.length === 0 ? (
              <div className="px-6 py-12 text-center text-neutral-500">
                Aucune alerte trouvée avec les filtres actuels
              </div>
            ) : (
              filteredAlerts.map((alert, idx) => {
                const sentiment = flowAlertsService.getSentiment(alert)
                const whaleScore = flowAlertsService.getWhaleScore(alert)
                const ivChange = flowAlertsService.getIVChange(alert)
                
                return (
                  <div
                    key={alert.id}
                    className={`grid grid-cols-1 lg:grid-cols-8 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group ${
                      idx === 0 ? 'relative shimmer' : ''
                    }`}
                  >
                    {/* Ticker / Time */}
                    <div className="col-span-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center text-xs tracking-tight shadow-lg">
                        {alert.ticker}
                      </div>
                      <div>
                        <div className="font-semibold text-white tracking-tight">{alert.ticker}</div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          {flowAlertsService.formatDate(alert.created_at)}
                        </div>
                        <div className="text-[10px] text-neutral-600">{alert.sector}</div>
                      </div>
                    </div>

                    {/* Type / Rule */}
                    <div className="col-span-1 flex flex-col justify-center gap-1">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold w-fit ${
                          alert.type === 'call'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}
                      >
                        {alert.type.toUpperCase()}
                        {alert.has_sweep && ' SWEEP'}
                        {alert.has_floor && ' FLOOR'}
                      </span>
                      <span className="text-[9px] text-neutral-600 truncate">
                        {alert.alert_rule.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>

                    {/* Strike / Expiry */}
                    <div className="col-span-1 flex flex-col justify-center font-mono">
                      <div className="text-white font-medium">${alert.strike} {alert.type === 'call' ? 'C' : 'P'}</div>
                      <div className="text-[10px] text-neutral-500">
                        EXP {flowAlertsService.formatExpiry(alert.expiry)}
                      </div>
                    </div>

                    {/* Premium / Price */}
                    <div className="col-span-1 flex flex-col justify-center font-mono">
                      <div className="text-white font-bold">
                        {flowAlertsService.formatPremium(alert.total_premium)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        @ ${parseFloat(alert.price).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-neutral-600">
                        Bid ${alert.bid} / Ask ${alert.ask}
                      </div>
                    </div>

                    {/* Volume / OI */}
                    <div className="col-span-1 flex flex-col justify-center font-mono text-xs">
                      <div className="text-white">Vol: {alert.volume.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-500">
                        OI: {alert.open_interest.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-neutral-600">
                        Ratio: {parseFloat(alert.volume_oi_ratio).toFixed(2)}x
                      </div>
                    </div>

                    {/* IV Change */}
                    <div className="col-span-1 flex items-center justify-center">
                      {Math.abs(ivChange) >= 0.05 ? (
                        // Spike détecté (≥5%)
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          ivChange > 0 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                          {ivChange > 0 ? '🔥' : '❄️'}
                          <span className="text-[10px] font-bold">
                            {ivChange > 0 ? '+' : ''}{(ivChange * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        // Changement normal
                        <div className="font-mono text-xs text-neutral-500">
                          {ivChange > 0 ? '+' : ''}{(ivChange * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>

                    {/* Whale Score */}
                    <div className="col-span-1 flex items-center justify-center">
                      {whaleScore === 'WHALE' ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-300">
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
                        <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-neutral-600 to-orange-500" 
                            style={{ width: `${whaleScore}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Sentiment */}
                    <div className="col-span-1 flex items-center justify-end">
                      <span
                        className={`text-xs font-medium ${
                          sentiment.color === 'emerald' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {sentiment.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 p-3 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.preventDefault()
                const presetParams = activePreset 
                  ? FLOW_PRESETS.find(p => p.id === activePreset)?.params 
                  : undefined
                loadFlowAlerts(searchedTicker, true, presetParams)
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-sans"
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
    </section>
  )
}

