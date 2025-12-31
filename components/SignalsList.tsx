/**
 * Composant Liste de Signaux avec Filtres
 * Affiche une liste de signaux RSS avec possibilité de filtrer
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import SignalCard from './SignalCard'
import NewsTerminal from './NewsTerminal'
import NewsStats from './NewsStats'
import type { Signal, SignalsParams } from '@/types/signals'
import signalsService from '@/services/signalsService'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'



interface SignalsListProps {
  initialFilters?: Partial<SignalsParams>
  showStats?: boolean
}

export default function SignalsList({ initialFilters, showStats = false }: SignalsListProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SignalsParams>({
    source: 'rss',
    // Pas de type par défaut car les données sont de type 'news' et 'macro'
    // type: 'macro', // Optionnel - commenté pour voir tous les types
    // Pas de min_importance par défaut car beaucoup de signaux ont null
    // min_importance: 7,
    limit: 50,
    ...initialFilters,
  })
  const [showSurprisesOnly, setShowSurprisesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  // Catégories organisées par onglets
  const tabs = [
    {
      id: 'all',
      label: 'Tous',
      icon: '📰',
      feeds: [] // Tous les feeds
    },
    {
      id: 'breaking',
      label: 'Breaking News',
      icon: '🔴',
      feeds: ['reuters', 'bloomberg', 'cnbc']
    },
    {
      id: 'financial-press',
      label: 'Presse Financière',
      icon: '🏦',
      feeds: ['financial-press']
    },
    {
      id: 'trading',
      label: 'Marchés / Trading',
      icon: '📊',
      feeds: ['trading', 'barchart']
    },
    {
      id: 'personalities',
      label: 'Personnalités',
      icon: '🧠',
      feeds: ['personalities']
    },
    {
      id: 'institutions',
      label: 'Institutions & Macro',
      icon: '🏛️',
      feeds: ['institutions', 'real-vision']
    },
    {
      id: 'social',
      label: 'Réseaux Sociaux',
      icon: '🌐',
      feeds: ['social']
    },
    {
      id: 'legacy',
      label: 'Autres',
      icon: '📈',
      feeds: ['financial-juice', 'investing']
    }
  ]

  // Filtrer les signaux par recherche et onglet sélectionné
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch = !searchQuery || 
      signal.raw_data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.raw_data?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtrer par onglet sélectionné
    if (selectedTab === 'all') {
      return matchesSearch
    }
    
    const selectedTabConfig = tabs.find(tab => tab.id === selectedTab)
    if (!selectedTabConfig) {
      return matchesSearch
    }
    
    // Si l'onglet a des feeds spécifiques, filtrer par feed
    if (selectedTabConfig.feeds.length > 0) {
      const signalFeed = signal.raw_data?.feed
      const matchesFeed = signalFeed && selectedTabConfig.feeds.includes(signalFeed)
      return matchesSearch && matchesFeed
    }
    
    return matchesSearch
  })

  const fetchSignals = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true)
        setError(null)

        const response = await signalsService.getSignals(filters, forceRefresh)
        let processedSignals = response.data || []

        // Ne pas filtrer par feed ici, on le fera dans le filtre de catégorie

        // Filtrer les surprises si demandé
        if (showSurprisesOnly) {
          processedSignals = processedSignals.filter(
            (s) => s.raw_data?.extracted_data?.surprise
          )
        }

        setSignals(processedSignals)
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du chargement des données'
        
        // Si erreur d'authentification, afficher le message approprié
        if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentification requise')) {
          setError('Authentification requise. Vous devez être connecté pour accéder aux signaux.')
        } else {
          setError(errorMessage)
        }
        setSignals([])
      } finally {
        setLoading(false)
      }
    },
    [filters, showSurprisesOnly]
  )

  // Charger les données quand l'auth est prête et quand les filtres changent
  useEffect(() => {
    // Attendre que l'auth soit chargée
    if (authLoading) {
      return
    }

    // Si non authentifié, afficher l'erreur directement (pas besoin d'appeler l'API)
    if (!isAuthenticated()) {
      setError('Authentification requise. Vous devez être connecté pour accéder aux signaux.')
      setSignals([])
      setLoading(false)
      return
    }

    // Charger les données (seulement si authentifié)
    fetchSignals(true)
  }, [authLoading, filters.source, filters.type, filters.min_importance, filters.limit, showSurprisesOnly, fetchSignals, isAuthenticated])

  if (loading && authLoading) {
    return (
      <div className="glass-card rounded-[1.2em] p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-neutral-400 mt-4">Chargement des données...</p>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes('Authentification requise') || error.includes('Not authenticated')

    return (
      <div className="glass-card rounded-[1.2em] p-12 text-center">
        <div className={`${isAuthError ? 'text-orange-400' : 'text-red-400'} mb-4`}>
          {isAuthError ? (
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
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          ) : (
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
          )}
        </div>
        <p className="text-lg font-medium">
          {isAuthError ? 'Authentification requise' : 'Erreur de chargement'}
        </p>
        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">{error}</p>
        <div className="flex gap-3 justify-center mt-6">
          {isAuthError ? (
            <>
              <button
                onClick={() => openModal('login')}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Se connecter
              </button>
              <button
                onClick={() => openModal('signup')}
                className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <button
              onClick={() => fetchSignals(true)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* News Stats Section */}
      {showStats && (
        <div className="mb-8">
          <NewsStats signals={signals} />
        </div>
      )}

      <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
      {/* Status/header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="size-8 rounded-lg bg-neutral-800 ring-1 ring-neutral-800 flex items-center justify-center hover:ring-neutral-700 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-neutral-300"
            >
              <path d="M4 12h16"></path>
              <path d="M4 18h16"></path>
              <path d="M4 6h16"></path>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-neutral-300"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
            <span className="text-base font-medium text-neutral-200">Signals</span>
          </div>
        </div>
        <button className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700 transition-colors">
          Select
        </button>
      </div>

      {/* Search + quick actions */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-neutral-800 ring-1 ring-neutral-800 px-3 py-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 text-neutral-400"
            >
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input
              className="w-full bg-transparent placeholder-neutral-500 text-sm focus:outline-none text-neutral-200"
              placeholder="Search signals"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="size-10 rounded-xl bg-neutral-800 ring-1 ring-neutral-800 flex items-center justify-center hover:ring-neutral-700 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-neutral-300"
            >
              <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-white/5">
          <div className="flex gap-1 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.id
              const tabSignals = signals.filter(s => {
                if (tab.id === 'all') return true
                if (tab.feeds.length === 0) return true
                return tab.feeds.includes(s.raw_data?.feed || '')
              })
              const count = tabSignals.length
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'text-orange-400'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-6 pb-4">
        <div className="pr-4 pl-4">
          {filteredSignals.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800/50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-500"
                >
                  <path d="M21 21l-4.34-4.34"></path>
                  <circle cx="11" cy="11" r="8"></circle>
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">Aucun signal trouvé</p>
              {searchQuery && (
                <p className="text-neutral-500 text-xs mt-2">
                  Essayez de modifier votre recherche ou de changer d'onglet
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Terminal pour Twitter/Bloomberg/Social */}
              {(() => {
                const terminalSignals = filteredSignals.filter(s => {
                  const feed = s.raw_data?.feed
                  return feed === 'social' || feed === 'bloomberg' || feed === 'twitter'
                })
                
                const nonTerminalSignals = filteredSignals.filter(s => {
                  const feed = s.raw_data?.feed
                  return !(feed === 'social' || feed === 'bloomberg' || feed === 'twitter')
                })
                
                // Grouper par feed pour les terminaux
                const socialSignals = terminalSignals.filter(s => s.raw_data?.feed === 'social' || s.raw_data?.feed === 'twitter')
                const bloombergSignals = terminalSignals.filter(s => s.raw_data?.feed === 'bloomberg')
                
                return (
                  <div className="space-y-6">
                    {/* Terminaux pour social/twitter */}
                    {socialSignals.length > 0 && (selectedTab === 'social' || selectedTab === 'breaking') && (
                      <NewsTerminal signals={socialSignals} feed="social" />
                    )}
                    
                    {/* Terminal pour bloomberg */}
                    {bloombergSignals.length > 0 && (selectedTab === 'breaking' || selectedTab === 'social') && (
                      <NewsTerminal signals={bloombergSignals} feed="bloomberg" />
                    )}
                    
                    {/* Cards normales pour les autres signaux */}
                    {nonTerminalSignals.length > 0 && (
                      <div className="space-y-3">
                        {nonTerminalSignals.map((signal) => (
                          <SignalCard key={signal.id} signal={signal} />
                        ))}
                      </div>
                    )}
                    
                    {/* Si pas de terminal mais des signaux, afficher en cards */}
                    {terminalSignals.length === 0 && filteredSignals.length > 0 && (
                      <div className="space-y-3">
                        {filteredSignals.map((signal) => (
                          <SignalCard key={signal.id} signal={signal} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

