/**
 * Hook pour les alertes en temps réel via Supabase Realtime (broadcast)
 * Utilise broadcast au lieu de postgres_changes pour la migration 019
 */

'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Signal } from '@/types/signals'

interface UseRealtimeSignalsOptions {
  keywords?: string[]
  onNewAlert?: (signal: Signal) => void
  enableBrowserNotifications?: boolean
}

export const useRealtimeSignals = (options: UseRealtimeSignalsOptions = {}) => {
  const {
    keywords = [],
    onNewAlert,
    enableBrowserNotifications = false,
  } = options

  const [signals, setSignals] = useState<Signal[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Vérifier que Supabase est configuré
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ [useRealtimeSignals] Supabase non configuré. Alertes temps réel désactivées.')
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.warn('⚠️ [useRealtimeSignals] Impossible d\'initialiser le client Supabase.')
      return
    }

    // Demander permission pour notifications browser
    if (enableBrowserNotifications && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
        }
      })
    }

    // S'abonner aux changements via broadcast
    const channel = supabase
      .channel('signals-realtime', {
        config: {
          broadcast: { self: true }, // Reçoit aussi ses propres messages
        },
      })
      .on(
        'broadcast',
        { event: 'INSERT' },
        (payload) => {
          try {
            const newSignal = payload.payload as Signal

            // Filtrer par keywords si spécifiés
            if (keywords.length > 0) {
              const text = `${newSignal.raw_data.title} ${newSignal.raw_data.description || ''}`.toLowerCase()
              const hasKeyword = keywords.some((keyword) =>
                text.includes(keyword.toLowerCase())
              )

              if (!hasKeyword) return // Ignorer si pas de keyword match
            }

            // Vérifier aussi les surprises économiques significatives
            const extractedData = newSignal.raw_data?.extracted_data
            const isSignificantSurprise =
              extractedData?.surprise &&
              extractedData.surprise !== 'neutral' &&
              (extractedData.surpriseMagnitude || 0) > 0.2

            // Ajouter l'alerte
            setSignals((prev) => [newSignal, ...prev].slice(0, 20))

            // Callback personnalisé
            if (onNewAlert) {
              onNewAlert(newSignal)
            }


            // Notification browser
            if (
              enableBrowserNotifications &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              const title = isSignificantSurprise
                ? `📊 ${extractedData?.indicator || 'Economic'} Surprise: ${extractedData?.surprise}`
                : `🔔 Nouvelle alerte: ${newSignal.raw_data.title}`

              new Notification(title, {
                body: newSignal.raw_data.description?.substring(0, 100) || newSignal.raw_data.title,
                icon: '/icon.png',
                tag: newSignal.id, // Évite les doublons
              })
            }
          } catch (error) {
            console.error('❌ [useRealtimeSignals] Erreur lors du traitement du signal:', error)
          }
        }
      )
      .on(
        'broadcast',
        { event: 'UPDATE' },
        (payload) => {
          try {
            // Signal mis à jour
            const updatedSignal = payload.payload as Signal
            setSignals((prev) =>
              prev.map((s) => (s.id === updatedSignal.id ? updatedSignal : s))
            )
          } catch (error) {
            console.error('❌ [useRealtimeSignals] Erreur lors de la mise à jour:', error)
          }
        }
      )
      .on(
        'broadcast',
        { event: 'DELETE' },
        (payload) => {
          try {
            // Signal supprimé
            const deletedId = (payload.payload as { id: string }).id
            setSignals((prev) => prev.filter((s) => s.id !== deletedId))
          } catch (error) {
            console.error('❌ [useRealtimeSignals] Erreur lors de la suppression:', error)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [useRealtimeSignals] Erreur de connexion au canal')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [keywords, onNewAlert, enableBrowserNotifications])

  return { signals, isConnected }
}

