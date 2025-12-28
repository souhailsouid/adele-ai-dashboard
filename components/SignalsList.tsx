/**
 * Composant Liste de Signaux avec Filtres
 * Affiche une liste de signaux RSS avec possibilité de filtrer
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import SignalCard from './SignalCard'
import type { Signal, SignalsParams } from '@/types/signals'
import signalsService from '@/services/signalsService'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from './useAuthModal'



interface SignalsListProps {
  initialFilters?: Partial<SignalsParams>
}

export default function SignalsList({ initialFilters }: SignalsListProps) {
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
  const [selectedCategory, setSelectedCategory] = useState('Financial Juice')
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  const categories = [
    { id: 'Financial Juice', label: 'Financial Juice' },
    { id: 'Investing', label: 'Investing' },
    { id: 'Barchart', label: 'Barchart' },
    { id: 'Macro', label: 'Macro' },
    { id: 'News', label: 'News' },
    { id: 'Surprises', label: 'Surprises' },
  ]

  // Filtrer les signaux par recherche et catégorie
  const filteredSignals = signals.filter((signal) => {
    const matchesSearch = !searchQuery || 
      signal.raw_data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.raw_data?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtrer par catégorie (feed, type, ou surprise)
    let matchesCategory = false
    
    switch (selectedCategory) {
      case 'Financial Juice':
        matchesCategory = signal.raw_data?.feed === 'financial-juice'
        break
      case 'Investing':
        matchesCategory = signal.raw_data?.feed === 'investing'
        break
      case 'Barchart':
        matchesCategory = signal.raw_data?.feed === 'barchart'
        break
      case 'Macro':
        matchesCategory = signal.type === 'macro'
        break
      case 'News':
        matchesCategory = signal.type === 'news'
        break
      case 'Surprises':
        matchesCategory = !!signal.raw_data?.extracted_data?.surprise
        break
      default:
        matchesCategory = true // Si aucune catégorie correspond, afficher tout
    }
    
    return matchesSearch && matchesCategory
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

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 py-1 items-center" style={{ scrollbarWidth: 'none' }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-orange-600/90 text-white shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-6 pb-4">
        {/* Section: Financial Juice */}
        <div className="pr-4 pl-4">
          <div className="flex items-center gap-2 py-2">
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
              className="size-4 text-orange-400"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
            </svg>
            <p className="text-[13px] font-medium text-neutral-300">
              {selectedCategory} <span className="ml-1 rounded-md bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-400 ring-1 ring-neutral-800">{filteredSignals.length}</span>
            </p>
          </div>

          {filteredSignals.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-neutral-400 text-sm">Aucun signal trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

