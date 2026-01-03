'use client'

import { useState, useEffect } from 'react'
import { newsHeadlinesClient } from '@/lib/api/newsHeadlinesClient'
import type { NewsHeadline } from '@/types/newsHeadlines'
import { Clock, ExternalLink, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface TickerNewsTimelineProps {
  ticker: string
}

export default function TickerNewsTimeline({ ticker }: TickerNewsTimelineProps) {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHeadlines = async () => {
      if (!ticker) return

      setLoading(true)
      setError(null)

      try {
        const response = await newsHeadlinesClient.getHeadlines({
          ticker,
          limit: 50,
        })

        if (response.success && response.data) {
          // Filtrer par ticker si nécessaire (au cas où l'API ne filtre pas correctement)
          let filtered = response.data
          if (ticker) {
            filtered = response.data.filter((h) => {
              // Vérifier si le ticker est dans le tableau tickers ou correspond au ticker unique
              const tickerUpper = ticker.toUpperCase()
              return (
                h.ticker?.toUpperCase() === tickerUpper ||
                (h.tickers && h.tickers.some((t: string) => t.toUpperCase() === tickerUpper))
              )
            })
          }
          
          // Trier par date (plus récent en premier)
          const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.published_at).getTime()
            const dateB = new Date(b.published_at).getTime()
            return dateB - dateA
          })
          setHeadlines(sorted)
        } else {
          setError(response.error || 'Erreur lors du chargement')
        }
      } catch (err: any) {
        console.error('Error loading news headlines:', err)
        setError(err.message || 'Erreur lors du chargement des actualités')
      } finally {
        setLoading(false)
      }
    }

    loadHeadlines()
  }, [ticker])

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
      return 'Il y a moins d\'1h'
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  const getFeedLogo = (source: string) => {
    const sourceLower = source.toLowerCase()
    if (sourceLower.includes('bloomberg')) return '/bloomberg.png'
    if (sourceLower.includes('reuters')) return '/reuters.png'
    if (sourceLower.includes('benzinga')) return '/benzinga.png'
    if (sourceLower.includes('cointelegraph')) return '/cointelegraph.png'
    if (sourceLower.includes('nyt') || sourceLower.includes('new york times')) return '/nyt.png'
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (headlines.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        Aucune actualité récente pour {ticker}
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-neutral-400"
          >
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
          </svg>
          <span className="text-xs text-neutral-400 font-normal">Articles</span>
        </div>
        <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
          {ticker}
        </span>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl leading-tight text-white font-medium tracking-tight mb-0.5">
          Actualités.
        </h2>
        <p className="text-xs text-neutral-400 font-normal mb-4">
          {headlines.length} article{headlines.length > 1 ? 's' : ''} disponible{headlines.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste verticale - Un seul article en longueur */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {headlines.map((headline, idx) => {
          const feedLogo = getFeedLogo(headline.source)
          
          return (
            <article 
              key={headline.id || idx} 
              className="glass-card rounded-xl p-5 flex flex-col transition-all hover:border-orange-500/30 border border-white/10"
            >
              {/* Header avec source et date */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {feedLogo && (
                    <div className="h-6 w-6 bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      <Image
                        src={feedLogo}
                        alt={headline.source}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium text-neutral-300">
                    {headline.source}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeDate(headline.published_at)}</span>
                </div>
              </div>

              {/* Titre - Police réduite */}
              <h3 className="text-base sm:text-lg leading-relaxed text-white font-normal mb-2">
                {headline.title}
              </h3>

              {/* Description si présente - Police réduite */}
              {headline.description && (
                <p className="text-sm text-neutral-300 leading-relaxed mb-3 line-clamp-3">
                  {headline.description}
                </p>
              )}

              {/* Badges et footer */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge MAJOR si présent */}
                  {headline.is_major && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-orange-500/10 text-orange-300 border-orange-500/20 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      MAJOR
                    </span>
                  )}

                  {/* Tickers si présents */}
                  {(headline.ticker || (headline.tickers && headline.tickers.length > 0)) && (
                    <>
                      {headline.tickers && headline.tickers.length > 0 ? (
                        headline.tickers.map((t, tickerIdx) => (
                          <span key={tickerIdx} className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] text-orange-400 font-mono">
                            {t}
                          </span>
                        ))
                      ) : headline.ticker ? (
                        <span className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] text-orange-400 font-mono">
                          {headline.ticker}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Lien "Lire l'article" */}
                {headline.url && (
                  <a
                    href={headline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors text-xs font-medium"
                  >
                    <span>Lire l'article</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
