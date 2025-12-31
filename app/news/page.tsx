/**
 * Page Signaux RSS - Affiche les signaux économiques avec données extraites
 * Style Pinterest avec barre de recherche et tags
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import FeedTerminalCard from '@/components/FeedTerminalCard'
import NewsStats from '@/components/NewsStats'
import RealtimeAlerts from '@/components/RealtimeAlerts'
import Footer from '@/components/Footer'
import type { Signal, SignalsParams } from '@/types/signals'
import signalsService from '@/services/signalsService'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/components/useAuthModal'

export default function NewsPage() {
  const criticalKeywords = ['Trump', 'CPI', 'Fed', 'GDP', 'NFP', 'Musk', 'BTC', 'TSLA']
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  // Tags disponibles avec logos PNG
  const availableTags = [
    { id: 'reuters', label: 'Reuters', logo: '/reuters.png' },
    { id: 'bloomberg', label: 'Bloomberg', logo: '/bloomberg.png' },
    { id: 'cnbc', label: 'CNBC', logo: '/cnbc.png' },
    { id: 'financial-press', label: 'Presse Financière', logo: '/financialtime.png' },
    { id: 'trading', label: 'Trading', logo: '/barchart.png' },
    { id: 'personalities', label: 'Personnalités', logo: '/investing.png' },
    { id: 'institutions', label: 'Institutions', logo: '/bloomberg.png' },
    { id: 'real-vision', label: 'Real Vision', logo: '/cnbc.png' },
    { id: 'financial-juice', label: 'Financial Juice', logo: '/financialjuice.png' },
    { id: 'investing', label: 'Investing', logo: '/investing.png' },
  ]

  const fetchSignals = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      if (!isAuthenticated()) {
        setError('Authentification requise')
        setSignals([])
        setLoading(false)
        return
      }

      const response = await signalsService.getSignals({ source: 'rss', limit: 200 }, forceRefresh)
      setSignals(response.data || [])
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des données'
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentification requise')) {
        setError('Authentification requise. Vous devez être connecté pour accéder aux signaux.')
      } else {
        setError(errorMessage)
      }
      setSignals([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    fetchSignals(true)
  }, [authLoading, fetchSignals])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <>
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>

      {/* Alertes en temps réel (flottant) */}
      <RealtimeAlerts keywords={criticalKeywords} maxAlerts={5} position="top-right" />

      <main className="relative z-10 pt-32 pb-24">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              News & Signaux RSS — Version Pro
            </h1>
            <p className="text-lg text-neutral-400 max-w-3xl">
              Suivez en temps réel les actualités financières, breaking news, analyses macro et signaux 
              des principales sources (Reuters, Bloomberg, CNBC, Financial Times, WSJ, et plus). 
              Chaque signal peut contenir des données structurées avec détection automatique des surprises économiques.
            </p>
          </div>
        </div>

          {/* Barre de recherche et Tags */}
          <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="glass-card rounded-[1.2em] p-6 space-y-4">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-neutral-800 ring-1 ring-neutral-800 px-4 py-3">
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
                  className="size-5 text-neutral-400"
                >
                  <path d="m21 21-4.34-4.34"></path>
                  <circle cx="11" cy="11" r="8"></circle>
                </svg>
                <input
                  className="w-full bg-transparent placeholder-neutral-500 text-sm focus:outline-none text-neutral-200"
                  placeholder="Rechercher dans les news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tags avec logos PNG */}
            <div className="flex flex-wrap gap-3">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'bg-orange-600/90 text-white shadow-sm'
                        : 'bg-neutral-800 text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700'
                    }`}
                  >
                    {tag.logo && (
                      <div className="w-5 h-5 flex-shrink-0 relative">
                        <Image
                          src={tag.logo}
                          alt={tag.label}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span>{tag.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

          {/* Terminaux Twitter et Bloomberg (statiques) */}
          <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeedTerminalCard 
              feed="twitter" 
              feedName="Twitter" 
              feedIcon="" 
              feedColor="blue" 
            />
            <FeedTerminalCard 
              feed="bloomberg" 
              feedName="Bloomberg" 
              feedIcon="" 
              feedColor="orange" 
            />
          </div>
        </div>

        {/* Stats Section avec Articles */}
        <div className="max-w-7xl mx-auto px-6 mb-32">
          {loading ? (
            <div className="glass-card rounded-[1.2em] p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-neutral-400 mt-4">Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="glass-card rounded-[1.2em] p-12 text-center">
              <p className="text-lg font-medium text-red-400 mb-2">Erreur de chargement</p>
              <p className="text-sm text-neutral-500 mb-4">{error}</p>
              {error.includes('Authentification requise') ? (
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
              ) : (
                <button
                  onClick={() => fetchSignals(true)}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Réessayer
                </button>
              )}
            </div>
          ) : (
            <NewsStats 
              signals={signals} 
              searchQuery={searchQuery}
              selectedTags={selectedTags}
            />
          )}
        </div>

        {/* Info Section */}
        <section className="max-w-7xl mx-auto px-6 mt-16 mb-32">
          <div className="glass-card rounded-[1.2em] p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              À propos des Signaux RSS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="font-medium text-white">Surprise Positive 📈</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les données économiques dépassent les prévisions, 
                  indiquant une économie plus forte que prévu.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <h4 className="font-medium text-white">Surprise Négative 📉</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les données économiques sont inférieures aux prévisions, 
                  pouvant indiquer un ralentissement économique.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <h4 className="font-medium text-white">Données Extraites</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les valeurs Actual, Forecast et Previous sont extraites 
                  automatiquement des articles pour un suivi précis.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

