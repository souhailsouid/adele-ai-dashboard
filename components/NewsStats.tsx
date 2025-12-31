/**
 * Composant de Statistiques pour les News RSS
 * Inspiré du design moderne avec métriques et témoignages
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import SignalCard from './SignalCard'
import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'

interface NewsStatsProps {
  signals?: Signal[]
  searchQuery?: string
  selectedTags?: string[]
}

interface StatsData {
  totalSignals: number
  activeSources: number
  surprisesDetected: number
  topFeeds: { feed: string; count: number }[]
  recentActivity: number // Signaux des dernières 24h
}

export default function NewsStats({ signals: externalSignals, searchQuery = '', selectedTags = [] }: NewsStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalSignals: 0,
    activeSources: 0,
    surprisesDetected: 0,
    topFeeds: [],
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(!externalSignals || externalSignals.length === 0)

  useEffect(() => {
    const calculateStats = async () => {
      try {
        setLoading(true)
        
        // Si des signaux sont fournis en props, les utiliser, sinon les charger
        let signalsToUse = externalSignals
        if (!signalsToUse || signalsToUse.length === 0) {
          const response = await signalsService.getSignals({ source: 'rss', limit: 1000 })
          signalsToUse = response.data || []
        }

        // Calculer les statistiques
        const now = new Date()
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        
        const recentSignals = signalsToUse.filter(s => {
          const signalDate = new Date(s.timestamp)
          return signalDate >= last24h
        })

        // Compter les surprises
        const surprises = signalsToUse.filter(s => 
          s.raw_data?.extracted_data?.surprise && 
          s.raw_data.extracted_data.surprise !== 'neutral'
        )

        // Compter les sources uniques
        const uniqueFeeds = new Set(
          signalsToUse
            .map(s => s.raw_data?.feed)
            .filter(Boolean) as string[]
        )

        // Top feeds
        const feedCounts: Record<string, number> = {}
        signalsToUse.forEach(s => {
          const feed = s.raw_data?.feed
          if (feed) {
            feedCounts[feed] = (feedCounts[feed] || 0) + 1
          }
        })

        const topFeeds = Object.entries(feedCounts)
          .map(([feed, count]) => ({ feed, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        setStats({
          totalSignals: signalsToUse.length,
          activeSources: uniqueFeeds.size,
          surprisesDetected: surprises.length,
          topFeeds,
          recentActivity: recentSignals.length,
        })
      } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error)
      } finally {
        setLoading(false)
      }
    }

    // Si des signaux sont fournis, calculer immédiatement
    if (externalSignals && externalSignals.length > 0) {
      calculateStats()
    } else {
      // Sinon, charger d'abord
      calculateStats()
    }
  }, [externalSignals])

  if (loading) {
    return (
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      </section>
    )
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Filtrer les signaux pour la grille
  const filteredSignals = useMemo(() => {
    if (!externalSignals || externalSignals.length === 0) return []
    
    return externalSignals.filter((signal) => {
      // Filtre par recherche
      const matchesSearch = !searchQuery || 
        signal.raw_data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        signal.raw_data?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Filtre par tags
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => 
          signal.tags?.includes(tag) ||
          signal.raw_data?.feed === tag ||
          signal.type === tag
        )
      
      return matchesSearch && matchesTags
    })
  }, [externalSignals, searchQuery, selectedTags])

  // Exclure les feeds Twitter/Bloomberg pour l'affichage grille
  const gridSignals = filteredSignals.filter(s => {
    const feed = s.raw_data?.feed
    return !(feed === 'social' || feed === 'twitter' || feed === 'bloomberg')
  })

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-8 sm:py-16">



      {/* Grille Pinterest des Articles */}
      {gridSignals.length === 0 ? (
        <div className="mt-12 py-12 text-center">
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
          <p className="text-neutral-400 text-sm">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="mt-12">
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
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
              className="h-4 w-4"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
            </svg>
            <span className="font-normal">Articles</span>
          </div>

          <div className="mt-2 mb-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-[0.9] text-white font-medium tracking-tighter">
              Actualités.
            </h2>
            <p className="mt-1 text-sm sm:text-base text-neutral-400 font-normal">
              {gridSignals.length} article{gridSignals.length > 1 ? 's' : ''} disponible{gridSignals.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille Pinterest - Style zigzag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gridSignals.map((signal, idx) => (
              <div key={signal.id} className="flex flex-col">
                <SignalCard signal={signal} index={idx} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

