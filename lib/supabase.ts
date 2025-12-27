/**
 * Client Supabase pour Realtime
 * Configuration pour les alertes en temps réel
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Nettoyer l'URL (enlever les espaces, double égal, etc.)
const supabaseUrl = rawSupabaseUrl?.trim().replace(/^=+/, '').replace(/=+$/, '')

let supabaseInstance: SupabaseClient | null = null

/**
 * Vérifie si Supabase est configuré
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.length === 0 || supabaseAnonKey.length === 0) return false
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) return false
  return true
}

/**
 * Récupère le client Supabase ou null si non configuré
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      console.warn('⚠️  Supabase URL ou Anon Key manquants. Les alertes en temps réel seront désactivées.')
      console.warn('   Variables requises: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    return null
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
      if (typeof window !== 'undefined') {
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du client Supabase:', error)
      return null
    }
  }

  return supabaseInstance
}

// Export pour compatibilité avec le code existant
// Retourne null si non configuré au lieu de lancer une erreur
export const supabase = {
  channel: (...args: Parameters<SupabaseClient['channel']>) => {
    const client = getSupabaseClient()
    if (!client) {
      // Retourne un mock channel qui ne fait rien
      return {
        on: () => ({ on: () => ({ on: () => ({ subscribe: () => {} }) }) }),
        subscribe: () => {},
      } as any
    }
    return client.channel(...args)
  },
  removeChannel: (channel: any) => {
    const client = getSupabaseClient()
    if (client) {
      client.removeChannel(channel)
    }
  },
} as SupabaseClient

