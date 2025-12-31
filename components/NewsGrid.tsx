/**
 * Composant Grille Pinterest pour les News
 * Affichage en style masonry/Pinterest
 */

'use client'

import { useState, useMemo } from 'react'
import SignalCard from './SignalCard'
import type { Signal } from '@/types/signals'

interface NewsGridProps {
  signals: Signal[]
  searchQuery?: string
  selectedTags?: string[]
}

export default function NewsGrid({ signals, searchQuery = '', selectedTags = [] }: NewsGridProps) {
  // Filtrer les signaux
  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
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
  }, [signals, searchQuery, selectedTags])

  // Exclure les feeds Twitter/Bloomberg pour l'affichage grille
  const gridSignals = filteredSignals.filter(s => {
    const feed = s.raw_data?.feed
    return !(feed === 'social' || feed === 'twitter' || feed === 'bloomberg')
  })

  if (gridSignals.length === 0) {
    return (
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
      </div>
    )
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {gridSignals.map((signal) => (
        <div key={signal.id} className="break-inside-avoid mb-4">
          <SignalCard signal={signal} />
        </div>
      ))}
    </div>
  )
}

