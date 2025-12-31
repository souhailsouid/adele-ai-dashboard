/**
 * Carte Terminal pour un Feed spécifique (Twitter/Bloomberg)
 * Affichage statique avec logo officiel
 */

'use client'

import { useState, useEffect } from 'react'
import NewsTerminal from './NewsTerminal'
import { TwitterIcon, BloombergIcon } from './SocialIcons'
import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'

interface FeedTerminalCardProps {
  feed: 'twitter' | 'bloomberg'
  feedName: string
  feedIcon: string
  feedColor: 'blue' | 'orange'
}

export default function FeedTerminalCard({ feed, feedName, feedIcon, feedColor }: FeedTerminalCardProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSignals = async () => {
      try {
        setLoading(true)
        const response = await signalsService.getSignals({ 
          source: 'rss', 
          limit: 50 
        })
        
        // Filtrer par feed
        const feedSignals = (response.data || []).filter(s => {
          const signalFeed = s.raw_data?.feed
          if (feed === 'twitter') {
            return signalFeed === 'twitter' || signalFeed === 'social'
          }
          if (feed === 'bloomberg') {
            return signalFeed === 'bloomberg'
          }
          return false
        })
        
        setSignals(feedSignals)
      } catch (error) {
        console.error(`Erreur lors du chargement des signaux ${feedName}:`, error)
        setSignals([])
      } finally {
        setLoading(false)
      }
    }

    loadSignals()
  }, [feed, feedName])

  const colorClasses = feedColor === 'orange' 
    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'

  return (
    <section className="relative z-10">
      {/* Header inspiré de NewsStats */}
  

   

      {/* Terminal Card */}
      <div className="">

     

        {/* Terminal */}
        {!loading && signals.length > 0 && (
          <NewsTerminal signals={signals} feed={feed === 'twitter' ? 'social' : 'bloomberg'} />
        )}
        
        {!loading && signals.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-400">Aucun signal disponible</p>
          </div>
        )}
      </div>
    </section>
  )
}

