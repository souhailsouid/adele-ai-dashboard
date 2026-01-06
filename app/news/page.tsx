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
import { Clock, ExternalLink, AlertCircle, TrendingUp, TrendingDown, DollarSign, Search, ArrowRight, Share2, Bookmark, Zap, Layers, Coins, Check } from 'lucide-react'

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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'source' | 'ticker' | 'major' | 'crypto' | 'stocks' | 'geopolitics'>('all')
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all')
  const [selectedTickerFilter, setSelectedTickerFilter] = useState<string>('all')
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all')

  // Helper functions pour le rendu des headlines
  const getSentimentColor = (sentiment?: string | null) => {
    if (sentiment === 'positive') return 'bg-emerald-500'
    if (sentiment === 'negative') return 'bg-red-600'
    return 'bg-zinc-700'
  }

  const getSourceBadge = (source: string) => {
    const sourceLower = source.toLowerCase()
    if (sourceLower.includes('bloomberg')) return 'Bloomberg'
    if (sourceLower.includes('reuters')) return 'Reuters'
    if (sourceLower.includes('benzinga')) return 'Benzinga'
    if (sourceLower.includes('pr newswire') || sourceLower.includes('prnewswire')) return 'PR NewsWire'
    if (sourceLower.includes('blockchain') || sourceLower.includes('crypto')) return 'Blockchain News'
    if (sourceLower.includes('cointelegraph')) return 'Cointelegraph'
    if (sourceLower.includes('nyt') || sourceLower.includes('new york times')) return 'NYT'
    if (sourceLower.includes('globenewswire')) return 'GlobeNewswire'
    if (sourceLower.includes('investors.com')) return 'Investors.com'
    if (sourceLower.includes('decrypt')) return 'Decrypt'
    if (sourceLower.includes('tradex')) return 'Tradex'
    return source
  }

  const getTickerIcon = (ticker: string) => {
    const tickerUpper = ticker.toUpperCase()
    if (tickerUpper === 'ETH' || tickerUpper.includes('ETH')) return Layers
    if (tickerUpper === 'BNB' || tickerUpper.includes('BNB')) return Coins
    return TrendingUp
  }

  const getTickerColor = (ticker: string) => {
    const tickerUpper = ticker.toUpperCase()
    if (tickerUpper === 'ETH' || tickerUpper.includes('ETH')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    if (tickerUpper === 'BNB' || tickerUpper.includes('BNB')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Fonction pour catégoriser un headline
  const categorizeHeadline = (headline: NewsHeadline): string[] => {
    const categories: string[] = []
    const title = headline.title?.toLowerCase() || ''
    const description = headline.description?.toLowerCase() || ''
    const source = headline.source?.toLowerCase() || ''
    const tickers = headline.tickers && headline.tickers.length > 0 ? headline.tickers : (headline.ticker ? [headline.ticker] : [])
    
    // Crypto
    const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'altcoin', 'solana', 'sol', 'cardano', 'ada', 'xrp', 'ripple', 'polkadot', 'dot', 'matic', 'polygon', 'avalanche', 'avax', 'chainlink', 'link', 'uniswap', 'uni', 'dogecoin', 'doge', 'shiba', 'bch', 'bitcoin cash', 'litecoin', 'ltc', 'cosmos', 'atom', 'binance', 'bnb', 'coinbase', 'wallet', 'mining', 'hash', 'token', 'ico', 'airdrop']
    const cryptoSources = ['cointelegraph', 'blockchain news', 'decrypt', 'crypto']
    const cryptoTickers = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'DOGE', 'BCH', 'LTC', 'ATOM', 'BNB', 'EVM']
    
    if (cryptoSources.some(s => source.includes(s)) || 
        cryptoTickers.some(t => tickers.includes(t)) ||
        cryptoKeywords.some(k => title.includes(k) || description.includes(k))) {
      categories.push('crypto')
    }
    
    // Stocks/Bourses
    const stockKeywords = ['stock', 'equity', 'nasdaq', 'nyse', 'dow jones', 's&p', 'sp500', 'earnings', 'revenue', 'profit', 'dividend', 'ipo', 'merger', 'acquisition', 'trading', 'market', 'bull', 'bear', 'investor', 'shareholder', 'quarterly', 'annual report']
    const stockSources = ['bloomberg', 'reuters', 'wsj', 'wall street journal', 'financial times', 'cnbc', 'benzinga', 'investors.com', 'barchart', 'financial juice']
    const stockTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC', 'JPM', 'BAC', 'GS', 'SPY', 'QQQ', 'DIA']
    
    if (stockSources.some(s => source.includes(s)) ||
        stockTickers.some(t => tickers.includes(t)) ||
        stockKeywords.some(k => title.includes(k) || description.includes(k))) {
      categories.push('stocks')
    }
    
    // Géopolitique
    const geopoliticsKeywords = ['trump', 'biden', 'president', 'congress', 'senate', 'election', 'war', 'conflict', 'iran', 'russia', 'china', 'ukraine', 'israel', 'palestine', 'venezuela', 'sanctions', 'embargo', 'trade war', 'tariff', 'diplomacy', 'nato', 'un', 'united nations', 'military', 'defense', 'foreign policy', 'geopolitical', 'crisis', 'tension', 'protest', 'riot', 'revolution']
    const geopoliticsSources = ['bloomberg', 'reuters', 'nyt', 'new york times', 'tradex']
    
    if (geopoliticsSources.some(s => source.includes(s)) ||
        geopoliticsKeywords.some(k => title.includes(k) || description.includes(k))) {
      categories.push('geopolitics')
    }
    
    return categories.length > 0 ? categories : ['other']
  }

  // Extraire les sources et tickers uniques pour les filtres
  const availableSources = useMemo(() => {
    const sources = new Set<string>()
    headlines.forEach(h => {
      if (h.source) sources.add(h.source)
    })
    return Array.from(sources).sort()
  }, [headlines])

  const availableTickers = useMemo(() => {
    const tickers = new Set<string>()
    headlines.forEach(h => {
      if (h.tickers && h.tickers.length > 0) {
        h.tickers.forEach(t => tickers.add(t))
      } else if (h.ticker) {
        tickers.add(h.ticker)
      }
    })
    return Array.from(tickers).sort()
  }, [headlines])

  // Catégoriser tous les headlines
  const headlinesByCategory = useMemo(() => {
    const categorized: Record<string, NewsHeadline[]> = {
      crypto: [],
      stocks: [],
      geopolitics: [],
      other: []
    }
    
    headlines.forEach(h => {
      const categories = categorizeHeadline(h)
      categories.forEach(cat => {
        if (!categorized[cat]) categorized[cat] = []
        categorized[cat].push(h)
      })
    })
    
    return categorized
  }, [headlines])

  // Filtrer les headlines selon les filtres sélectionnés
  const filteredHeadlines = useMemo(() => {
    let filtered = [...headlines]

    // Filtre par source
    if (selectedSourceFilter !== 'all') {
      filtered = filtered.filter(h => h.source === selectedSourceFilter)
    }

    // Filtre par ticker
    if (selectedTickerFilter !== 'all') {
      filtered = filtered.filter(h => {
        const tickers = h.tickers && h.tickers.length > 0 ? h.tickers : (h.ticker ? [h.ticker] : [])
        return tickers.includes(selectedTickerFilter)
      })
    }

    // Filtre major only
    if (majorOnly) {
      filtered = filtered.filter(h => h.is_major)
    }

    // Filtre par recherche
    if (headlinesSearch) {
      const searchLower = headlinesSearch.toLowerCase()
      filtered = filtered.filter(h => 
        h.title?.toLowerCase().includes(searchLower) ||
        h.description?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par ticker (input)
    if (headlinesTicker) {
      const tickerUpper = headlinesTicker.toUpperCase()
      filtered = filtered.filter(h => {
        const tickers = h.tickers && h.tickers.length > 0 ? h.tickers : (h.ticker ? [h.ticker] : [])
        return tickers.some(t => t.toUpperCase() === tickerUpper)
      })
    }

    // Filtre par catégorie/topic
    if (selectedTopicFilter !== 'all') {
      filtered = filtered.filter(h => {
        const categories = categorizeHeadline(h)
        return categories.includes(selectedTopicFilter)
      })
    }

    return filtered
  }, [headlines, selectedSourceFilter, selectedTickerFilter, selectedTopicFilter, majorOnly, headlinesSearch, headlinesTicker])

  // Organiser les headlines filtrés par catégories
  const organizedHeadlines = useMemo(() => {
    // Par source
    const bySource = filteredHeadlines.reduce((acc, h) => {
      const source = h.source || 'Unknown'
      if (!acc[source]) acc[source] = []
      acc[source].push(h)
      return acc
    }, {} as Record<string, typeof filteredHeadlines>)

    // Par ticker
    const byTicker = filteredHeadlines.reduce((acc, h) => {
      const tickers = h.tickers && h.tickers.length > 0 ? h.tickers : (h.ticker ? [h.ticker] : [])
      if (tickers.length === 0) {
        if (!acc['No Ticker']) acc['No Ticker'] = []
        acc['No Ticker'].push(h)
      } else {
        tickers.forEach(ticker => {
          if (!acc[ticker]) acc[ticker] = []
          acc[ticker].push(h)
        })
      }
      return acc
    }, {} as Record<string, typeof filteredHeadlines>)

    // Major vs Regular
    const majorHeadlines = filteredHeadlines.filter(h => h.is_major)
    const regularHeadlines = filteredHeadlines.filter(h => !h.is_major)

    return { bySource, byTicker, majorHeadlines, regularHeadlines }
  }, [filteredHeadlines])

  // Composant de carte headline réutilisable
  const HeadlineCard = ({ headline }: { headline: NewsHeadline }) => {
    const sentimentColor = getSentimentColor(headline.sentiment)
    const tickers = headline.tickers && headline.tickers.length > 0 ? headline.tickers : (headline.ticker ? [headline.ticker] : [])

    return (
      <article className="group relative bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl transition-all duration-300 hover:border-white/30 hover-trigger overflow-hidden">
        {/* Sentiment Indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${sentimentColor} group-hover:${sentimentColor === 'bg-emerald-500' ? 'bg-emerald-400' : sentimentColor === 'bg-red-600' ? 'bg-red-500' : 'bg-zinc-500'} transition-colors ${sentimentColor === 'bg-emerald-500' ? 'shadow-[2px_0_15px_rgba(16,185,129,0.4)]' : ''}`}></div>
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
              {getSourceBadge(headline.source)}
            </span>
            {headline.is_major && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)] animate-pulse`}>
                <Zap className="w-3 h-3 fill-orange-500" strokeWidth={0} />
                Major
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {formatDate(headline.published_at)}
          </span>
        </div>

        {headline.url ? (
          <a href={headline.url} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-lg text-neutral-300 font-light mb-6 leading-relaxed group-hover:text-white transition-colors">
              {headline.title}
            </h3>
          </a>
        ) : (
          <h3 className="text-lg text-neutral-300 font-light mb-6 leading-relaxed group-hover:text-white transition-colors">
            {headline.title}
          </h3>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {tickers.length > 0 ? (
              tickers.map((ticker, idx) => {
                const TickerIcon = getTickerIcon(ticker)
                return (
                  <span key={idx} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getTickerColor(ticker)}`}>
                    <TickerIcon className="w-3 h-3" strokeWidth={1.5} />
                    {ticker}
                  </span>
                )
              })
            ) : headline.category ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {headline.category}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {headline.is_major && (
              <button className="text-zinc-500 hover:text-white transition-colors">
                <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <button className="text-zinc-500 hover:text-white transition-colors">
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </article>
    )
  }
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

          {/* Header & Filters */}
          <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="space-y-8">
            {/* Onglets RSS / Headlines */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 w-fit">
                <button
                  onClick={() => setActiveTab('rss')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors rounded-md ${
                    activeTab === 'rss'
                      ? 'text-zinc-400 hover:text-white'
                      : 'text-white bg-zinc-800 shadow-sm border border-white/5'
                  }`}
                >
                  RSS Feeds
                </button>
                <button
                  onClick={() => setActiveTab('headlines')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors rounded-md ${
                    activeTab === 'headlines'
                      ? 'text-white bg-zinc-800 shadow-sm border border-white/5'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  News Headlines
                </button>
              </div>
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
                {/* Filter Bar */}
                <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 space-y-4 shadow-2xl shadow-black/50">
                  {/* First Row: Selects */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Topic/Category Select */}
                    <div className="relative w-full lg:w-56 group">
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                        <Layers className="w-4 h-4" strokeWidth={1.5} />
                      </label>
                      <select
                        value={selectedTopicFilter}
                        onChange={(e) => setSelectedTopicFilter(e.target.value)}
                        className="w-full bg-[#050505] text-white text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Topics</option>
                        <option value="crypto">Crypto ({headlinesByCategory.crypto.length})</option>
                        <option value="stocks">Bourses ({headlinesByCategory.stocks.length})</option>
                        <option value="geopolitics">Géopolitique ({headlinesByCategory.geopolitics.length})</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Source Select */}
                    <div className="relative w-full lg:w-64 group">
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                        <Search className="w-4 h-4" strokeWidth={1.5} />
                      </label>
                      <select
                        value={selectedSourceFilter}
                        onChange={(e) => setSelectedSourceFilter(e.target.value)}
                        className="w-full bg-[#050505] text-white text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Sources ({availableSources.length})</option>
                        {availableSources.map(source => {
                          const count = headlines.filter(h => h.source === source).length
                          return (
                            <option key={source} value={source}>
                              {getSourceBadge(source)} ({count})
                            </option>
                          )
                        })}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Ticker Select */}
                    <div className="relative w-full lg:w-64 group">
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                        <DollarSign className="w-4 h-4" strokeWidth={1.5} />
                      </label>
                      <select
                        value={selectedTickerFilter}
                        onChange={(e) => setSelectedTickerFilter(e.target.value)}
                        className="w-full bg-[#050505] text-white text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Tickers ({availableTickers.length})</option>
                        {availableTickers.map(ticker => {
                          const count = headlines.filter(h => {
                            const tickers = h.tickers && h.tickers.length > 0 ? h.tickers : (h.ticker ? [h.ticker] : [])
                            return tickers.includes(ticker)
                          }).length
                          return (
                            <option key={ticker} value={ticker}>
                              {ticker} ({count})
                            </option>
                          )
                        })}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Ticker Input (Manual) */}
                    <div className="relative w-full lg:w-64 group">
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                        <DollarSign className="w-4 h-4" strokeWidth={1.5} />
                      </label>
                      <input
                        type="text"
                        placeholder="Ticker (ex: XRP)"
                        value={headlinesTicker}
                        onChange={(e) => setHeadlinesTicker(e.target.value.toUpperCase())}
                        className="w-full bg-[#050505] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Second Row: Search & Controls */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative w-full flex-1 group">
                      <label className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                        <Search className="w-4 h-4" strokeWidth={1.5} />
                      </label>
                      <input
                        type="text"
                        placeholder="Search headlines..."
                        value={headlinesSearch}
                        onChange={(e) => setHeadlinesSearch(e.target.value)}
                        className="w-full bg-[#050505] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:text-zinc-600 font-medium"
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={majorOnly}
                            onChange={(e) => setMajorOnly(e.target.checked)}
                          />
                          <div className="w-5 h-5 border border-zinc-700 rounded bg-[#050505] peer-checked:bg-orange-600 peer-checked:border-orange-600 transition-colors flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={2.5} />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">Major only</span>
                      </label>

                      <button
                        onClick={() => {
                          setSelectedSourceFilter('all')
                          setSelectedTickerFilter('all')
                          setSelectedTopicFilter('all')
                          setHeadlinesTicker('')
                          setHeadlinesSearch('')
                          setMajorOnly(false)
                          setSelectedCategory('all')
                          fetchHeadlines()
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                      >
                        <span>Reset</span>
                      </button>

                      <button
                        onClick={fetchHeadlines}
                        className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)] flex items-center gap-2"
                      >
                        <span>Search</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
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
            <>
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
              ) : (
                <>

                  {/* Section Title & Category Filters */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-12 mb-6">
                    <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                      Latest Headlines 
                      <span className="text-zinc-500 font-normal text-base">({filteredHeadlines.length})</span>
                      {filteredHeadlines.length !== headlines.length && (
                        <span className="text-xs text-orange-500 font-medium">
                          (filtered from {headlines.length})
                        </span>
                      )}
                    </h2>
                    
                    {/* Category Filter Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                        }`}
                      >
                        All ({filteredHeadlines.length})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('major')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedCategory === 'major'
                            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                        }`}
                      >
                        Major ({organizedHeadlines.majorHeadlines.length})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('source')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedCategory === 'source'
                            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                        }`}
                      >
                        By Source
                      </button>
                      <button
                        onClick={() => setSelectedCategory('ticker')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedCategory === 'ticker'
                            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                        }`}
                      >
                        By Ticker
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bullish</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600"></span> Neutral</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Bearish</span>
                    </div>
                  </div>

                  {/* News Grid - Organisé par catégorie */}
                  {selectedCategory === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredHeadlines.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                          <p className="text-neutral-400">Aucun headline trouvé. Utilisez les filtres pour rechercher.</p>
                        </div>
                      ) : (
                        filteredHeadlines.map((headline) => (
                          <HeadlineCard key={headline.id} headline={headline} />
                        ))
                      )}
                    </div>
                  )}

                  {selectedCategory === 'crypto' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-orange-500" />
                          Crypto News ({headlinesByCategory.crypto.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {headlinesByCategory.crypto.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <p className="text-neutral-400">Aucun headline crypto trouvé.</p>
                            </div>
                          ) : (
                            headlinesByCategory.crypto.map((headline) => (
                              <HeadlineCard key={headline.id} headline={headline} />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'stocks' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-orange-500" />
                          Bourses ({headlinesByCategory.stocks.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {headlinesByCategory.stocks.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <p className="text-neutral-400">Aucun headline boursier trouvé.</p>
                            </div>
                          ) : (
                            headlinesByCategory.stocks.map((headline) => (
                              <HeadlineCard key={headline.id} headline={headline} />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'geopolitics' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          Géopolitique ({headlinesByCategory.geopolitics.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {headlinesByCategory.geopolitics.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <p className="text-neutral-400">Aucun headline géopolitique trouvé.</p>
                            </div>
                          ) : (
                            headlinesByCategory.geopolitics.map((headline) => (
                              <HeadlineCard key={headline.id} headline={headline} />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'major' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          Major Headlines ({organizedHeadlines.majorHeadlines.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {organizedHeadlines.majorHeadlines.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <p className="text-neutral-400">Aucun headline major trouvé.</p>
                            </div>
                          ) : (
                            organizedHeadlines.majorHeadlines.map((headline) => (
                              <HeadlineCard key={headline.id} headline={headline} />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'source' && (
                    <div className="space-y-8">
                      {Object.entries(organizedHeadlines.bySource)
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([source, sourceHeadlines]) => (
                          <div key={source}>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
                                {getSourceBadge(source)}
                              </span>
                              <span className="text-zinc-500 font-normal text-sm">({sourceHeadlines.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {sourceHeadlines.map((headline) => (
                                <HeadlineCard key={headline.id} headline={headline} />
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {selectedCategory === 'ticker' && (
                    <div className="space-y-8">
                      {Object.entries(organizedHeadlines.byTicker)
                        .sort((a, b) => {
                          if (a[0] === 'No Ticker') return 1
                          if (b[0] === 'No Ticker') return -1
                          return b[1].length - a[1].length
                        })
                        .map(([ticker, tickerHeadlines]) => (
                          <div key={ticker}>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              {ticker === 'No Ticker' ? (
                                <span className="text-zinc-400">No Ticker</span>
                              ) : (
                                <>
                                  {(() => {
                                    const TickerIcon = getTickerIcon(ticker)
                                    return <TickerIcon className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
                                  })()}
                                  <span className="font-mono">{ticker}</span>
                                </>
                              )}
                              <span className="text-zinc-500 font-normal text-sm">({tickerHeadlines.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {tickerHeadlines.map((headline) => (
                                <HeadlineCard key={headline.id} headline={headline} />
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
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

