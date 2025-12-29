/**
 * Hook React pour les signaux FMP en temps réel via Supabase
 */

'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { FMPSignal } from '@/types/fmpSignals'

interface UseFMPSignalsOptions {
  ticker?: string
  limit?: number
  onNewSignal?: (signal: FMPSignal) => void
}

export function useFMPSignals(options: UseFMPSignalsOptions = {}) {
  const { ticker, limit = 50, onNewSignal } = options

  const [signals, setSignals] = useState<FMPSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    // Charger les signaux existants depuis la table
    const loadInitialSignals = async () => {
      try {
        let query = supabase
          .from('fmp_signals')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit)

        if (ticker) {
          query = query.eq('ticker', ticker.toUpperCase())
        }

        const { data, error } = await query

        if (error) throw error
        setSignals((data as FMPSignal[]) || [])
      } catch (error) {
        console.error('Error loading FMP signals:', error)
        // Si la table n'existe pas encore, on continue sans erreur
      } finally {
        setLoading(false)
      }
    }

    loadInitialSignals()

    // S'abonner aux nouveaux signaux via Realtime broadcast
    const channel = supabase
      .channel('fmp_signals:events', {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'broadcast',
        { event: '*' },
        (payload) => {
          try {
            const event = payload.payload as any

            if (event.event === 'INSERT' && event.data) {
              const newSignal = event.data as FMPSignal

              // Filtrer par ticker si spécifié
              if (ticker && newSignal.ticker !== ticker.toUpperCase()) {
                return
              }

              // Ajouter le signal
              setSignals((prev) => [newSignal, ...prev].slice(0, limit))

              // Callback personnalisé
              if (onNewSignal) {
                onNewSignal(newSignal)
              }
            }
          } catch (error) {
            console.error('Error processing FMP signal:', error)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticker, limit, onNewSignal])

  return { signals, loading, isConnected }
}

