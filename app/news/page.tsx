/**
 * Page Signaux RSS - Affiche les signaux économiques avec données extraites
 * Style Pinterest avec barre de recherche et tags
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import FeedTerminalCard from '@/components/FeedTerminalCard'
import NewsStats from '@/components/NewsStats'
import RealtimeAlerts from '@/components/RealtimeAlerts'
import Footer from '@/components/Footer'
import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/components/useAuthModal'
import { TwitterIcon, BloombergIcon, YouTubeIcon, TruthSocialIcon } from '@/components/SocialIcons'
import { newsHeadlinesClient } from '@/lib/api/newsHeadlinesClient'
import type { NewsHeadline } from '@/types/newsHeadlines'
import { Clock, ExternalLink, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

export default function NewsPage() {
  const criticalKeywords = ['Trump', 'CPI', 'Fed', 'GDP', 'NFP', 'Musk', 'BTC', 'TSLA']
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'rss' | 'headlines'>('rss')
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([])
  const [headlinesLoading, setHeadlinesLoading] = useState(false)
  const [headlinesError, setHeadlinesError] = useState<string | null>(null)
  const [headlinesTicker, setHeadlinesTicker] = useState('')
  const [headlinesSearch, setHeadlinesSearch] = useState('')
  const [majorOnly, setMajorOnly] = useState(false)
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  // Tags disponibles avec logos PNG et SVG - Organisés par plateforme
  const availableTags = [
    // RSS traditionnel
    { id: 'reuters', label: 'Reuters', logo: '/reuters.png', platform: 'rss' },
    { id: 'bloomberg', label: 'Bloomberg', logo: '/bloomberg.png', platform: 'rss' },
    { id: 'cnbc', label: 'CNBC', logo: '/cnbc.png', platform: 'rss' },
    { id: 'financial-times', label: 'Financial Times', logo: '/financialtime.png', platform: 'rss' },
    { id: 'benzinga', label: 'Benzinga', logo: '/benzinga.png', platform: 'rss' },
    { id: 'wsj', label: 'Wall Street Journal', logo: '/wsj.png', platform: 'rss' },
    { id: 'investing', label: 'Investing', logo: '/investing.png', platform: 'rss' },
    { id: 'barchart', label: 'Barchart', logo: '/barchart.png', platform: 'rss' },
    { id: 'financial-juice', label: 'Financial Juice', logo: '/financialjuice.png', platform: 'rss' },
    // YouTube
    // { id: 'youtube', label: 'YouTube', logo: YouTubeIcon, platform: 'youtube' },
    // { id: 'real-vision', label: 'Real Vision', logo: YouTubeIcon, platform: 'youtube' },
    // Twitter/X
    { id: 'personalities', label: 'Personnalités', logo: TwitterIcon, platform: 'twitter' },
    { id: 'twitter', label: 'Twitter', logo: TwitterIcon, platform: 'twitter' },
    // Truth Social
    { id: 'trump-truth-social', label: 'Truth Social', logo: TruthSocialIcon, platform: 'truth-social' },
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

  // Charger les headlines
  const fetchHeadlines = useCallback(async () => {
    if (!isAuthenticated()) return

    setHeadlinesLoading(true)
    setHeadlinesError(null)

    try {
      const response = await newsHeadlinesClient.getHeadlines({
        limit: 100,
        ticker: headlinesTicker || undefined,
        search_term: headlinesSearch || undefined,
        major_only: majorOnly || undefined,
      })

      if (response.success && response.data) {
        // Trier par date (plus récent en premier)
        const sorted = [...response.data].sort((a, b) => {
          const dateA = new Date(a.published_at).getTime()
          const dateB = new Date(b.published_at).getTime()
          return dateB - dateA
        })
        setHeadlines(sorted)
      } else {
        setHeadlinesError(response.error || 'Erreur lors du chargement')
      }
    } catch (err: any) {
      console.error('Error loading headlines:', err)
      setHeadlinesError(err.message || 'Erreur lors du chargement des headlines')
      setHeadlines([])
    } finally {
      setHeadlinesLoading(false)
    }
  }, [isAuthenticated, headlinesTicker, headlinesSearch, majorOnly])

  useEffect(() => {
    if (authLoading || activeTab !== 'headlines') return
    fetchHeadlines()
  }, [authLoading, activeTab, fetchHeadlines])

  // Fonction pour filtrer les signaux par tag (feed ou platform)
  const filterSignalsByTag = (signals: Signal[], tagId: string): Signal[] => {
    const tag = availableTags.find(t => t.id === tagId)
    if (!tag) return signals
    return signals.filter(signal => {
      // Cas spécial : Reuters - Vérifier l'URL pour détecter les signaux de X (Twitter)
      if (tagId === 'reuters') {
        const url = signal.raw_data?.url || ''
        // Si l'URL contient "x.com" et "Reuters", c'est un signal de X pour Reuters
        if (url.includes('x.com') && url.toLowerCase().includes('reuters')) {
          return true
        }
        // Sinon, vérifier le feed RSS traditionnel
        return signal.raw_data?.feed === 'reuters'
      }
      
      // Cas spécial : Benzinga - Vérifier l'URL pour détecter les signaux de X (Twitter)
      if (tagId === 'benzinga') {
        const url = signal.raw_data?.url || ''
        // Si l'URL contient "x.com" et "Benzinga", c'est un signal de X pour Benzinga
        if (url.includes('x.com') && url.toLowerCase().includes('benzinga')) {
          return true
        }
        // Sinon, vérifier le feed RSS traditionnel
        return signal.raw_data?.feed === 'benzinga'
      }
      
      // Cas spécial : Financial Times - Vérifier le type analysis-financial-times
      if (tagId === 'financial-times') {
        // Vérifier le type analysis-financial-times
        if (signal.type === 'analysis-financial-times') {
          return true
        }
        // Vérifier le feed RSS traditionnel
        return signal.raw_data?.feed === 'financial-times' || 
               signal.raw_data?.feed === 'financial-press'
      }
      
      // Cas spécial : WSJ (Wall Street Journal) - Vérifier l'URL et le type analysis-wsj*
      if (tagId === 'wsj') {
        const url = signal.raw_data?.url || ''
        // Si l'URL contient "x.com" et "WSJ", c'est un signal de X pour WSJ
        if (url.includes('x.com') && url.toLowerCase().includes('wsj')) {
          return true
        }
        // Vérifier le type analysis-wsj*
        if (signal.type?.startsWith('analysis-wsj')) {
          return true
        }
        // Sinon, vérifier les feeds RSS traditionnels (wsj-markets, wsj-world)
        return signal.raw_data?.feed === 'wsj-markets' || 
               signal.raw_data?.feed === 'wsj-world' ||
               signal.raw_data?.feed === 'wsj'
      }
      
      // Cas spécial : Truth Social
      if (tagId === 'trump-truth-social') {
        return signal.raw_data?.platform === 'truth-social' ||
               signal.raw_data?.feed === 'trump-truth-social' ||
               (signal.raw_data?.feed === 'social' && signal.raw_data?.platform === 'truth-social')
      }
      
      // Cas spécial : Réseaux Sociaux (Twitter uniquement, exclure Truth Social)
      if (tagId === 'social') {
        // S'assurer que c'est Twitter et pas Truth Social
        if (signal.raw_data?.platform === 'truth-social') return false
        return signal.raw_data?.platform === 'twitter' && 
               (signal.raw_data?.feed === 'social' || 
                signal.raw_data?.feed === 'personalities' ||
                signal.raw_data?.feed === 'twitter')
      }
      
      // Si le tag a une plateforme, filtrer par plateforme
      if (tag.platform && signal.raw_data?.platform === tag.platform) {
        // Si c'est YouTube, accepter tous les feeds de cette plateforme
        if (tag.platform === 'youtube') {
          return true
        }
        // Pour Twitter (personnalités), vérifier aussi le feed
        if (tag.platform === 'twitter') {
          return signal.raw_data?.feed === tag.id || 
                 signal.raw_data?.feed === 'personalities' ||
                 (signal.raw_data?.feed === 'social' && signal.raw_data?.platform === 'twitter')
        }
        // Pour RSS, vérifier le feed
        if (tag.platform === 'rss') {
          return signal.raw_data?.feed === tag.id
        }
      }
      // Fallback : vérifier le feed
      return signal.raw_data?.feed === tagId
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      // Si le tag est déjà sélectionné, le désélectionner (aucun tag sélectionné)
      prev.includes(tagId) 
        ? []
        : [tagId] // Sinon, sélectionner uniquement ce tag (remplace toute sélection précédente)
    )
  }

  // Mémoriser les signaux filtrés pour éviter les problèmes de hooks
  const filteredSignals = useMemo(() => {
    if (selectedTags.length === 0) {
      return signals
    }
    return selectedTags.reduce((acc, tagId) => filterSignalsByTag(acc, tagId), signals)
  }, [signals, selectedTags, filterSignalsByTag])

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
            {/* Onglets RSS / Headlines */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('rss')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'rss'
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                RSS Feeds
              </button>
              <button
                onClick={() => setActiveTab('headlines')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'headlines'
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                News Headlines
              </button>
            </div>

            {activeTab === 'rss' ? (
              <>
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
              </>
            ) : (
              <>
                {/* Filtres Headlines */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-400 whitespace-nowrap">Ticker:</label>
                    <input
                      type="text"
                      value={headlinesTicker}
                      onChange={(e) => setHeadlinesTicker(e.target.value.toUpperCase())}
                      placeholder="Ex: TSLA, NVDA"
                      className="flex-1 bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder-neutral-600 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-400 whitespace-nowrap">Recherche:</label>
                    <input
                      type="text"
                      value={headlinesSearch}
                      onChange={(e) => setHeadlinesSearch(e.target.value)}
                      placeholder="Mot-clé..."
                      className="flex-1 bg-neutral-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none placeholder-neutral-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={majorOnly}
                        onChange={(e) => setMajorOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-neutral-800 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-xs text-neutral-400">Major only</span>
                    </label>
                    <button
                      onClick={fetchHeadlines}
                      className="ml-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Rechercher
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Tags avec logos PNG et SVG - Uniquement pour RSS */}
            {activeTab === 'rss' && (
            <div className="flex flex-wrap gap-3">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                const isSvgComponent = typeof tag.logo !== 'string'
                
                // Helper pour rendre le logo
                const renderLogo = () => {
                  if (!tag.logo) return null
                  
                  if (isSvgComponent) {
                    // Composant SVG React
                    const IconComponent = tag.logo as React.ComponentType<{ className?: string }>
                    return <IconComponent className="h-5 w-5" />
                  } else {
                    // Image PNG
                    return (
                      <Image
                        src={tag.logo as string}
                        alt={tag.label}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    )
                  }
                }
                
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
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {renderLogo()}
                    </div>
                    <span>{tag.label}</span>
                  </button>
                )
              })}
            </div>
            )}
          </div>
        </div>

          {/* Terminaux Twitter et Bloomberg (statiques) */}
          <div className="max-w-7xl mx-auto px-6 mb-12">
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div> */}
        </div>

        {/* Stats Section avec Articles */}
        <div className="max-w-7xl mx-auto px-6 mb-32">
          {activeTab === 'rss' ? (
            loading ? (
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
                signals={filteredSignals} 
                searchQuery={searchQuery}
                selectedTags={selectedTags}
              />
            )
          ) : (
            <div className="glass-card rounded-[1.2em] p-6">
              {headlinesLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-neutral-400 mt-4">Chargement des headlines...</p>
                </div>
              ) : headlinesError ? (
                <div className="text-center py-12">
                  <p className="text-lg font-medium text-red-400 mb-2">Erreur de chargement</p>
                  <p className="text-sm text-neutral-500">{headlinesError}</p>
                </div>
              ) : headlines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400">Aucun headline trouvé. Utilisez les filtres pour rechercher.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      News Headlines ({headlines.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {headlines.map((headline) => {
                      const getSourceColor = (source: string) => {
                        const sourceLower = source.toLowerCase()
                        if (sourceLower.includes('bloomberg')) return 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        if (sourceLower.includes('reuters')) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        if (sourceLower.includes('benzinga')) return 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                        if (sourceLower.includes('cointelegraph')) return 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                        return 'bg-white/10 border-white/20 text-white'
                      }

                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString)
                        const now = new Date()
                        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
                        if (diffHours < 1) return 'Il y a moins d\'1h'
                        if (diffHours < 24) return `Il y a ${diffHours}h`
                        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      }

                      return (
                        <div
                          key={headline.id}
                          className="bg-neutral-900/50 border border-white/10 rounded-lg p-4 hover:bg-neutral-900/70 hover:border-orange-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
                              {headline.title}
                            </h3>
                            {headline.is_major && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded text-[10px] text-orange-400 font-medium flex-shrink-0">
                                <AlertCircle className="w-3 h-3" />
                                MAJOR
                              </span>
                            )}
                          </div>
                          {headline.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                              {headline.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getSourceColor(headline.source)}`}>
                              {headline.source}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(headline.published_at)}</span>
                            </div>
                          </div>
                          {(headline.ticker || (headline.tickers && headline.tickers.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {headline.tickers && headline.tickers.length > 0 ? (
                                headline.tickers.map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] text-orange-400 font-mono">
                                    {t}
                                  </span>
                                ))
                              ) : headline.ticker ? (
                                <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] text-orange-400 font-mono">
                                  {headline.ticker}
                                </span>
                              ) : null}
                            </div>
                          )}
                          {headline.url && (
                            <a
                              href={headline.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lire l'article
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
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

