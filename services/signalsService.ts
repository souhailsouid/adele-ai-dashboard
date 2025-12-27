/**
 * Service pour gérer les Signaux RSS
 * Ajoute une couche de cache et de logique métier
 */

import signalsClient from '@/lib/api/signalsClient'
import type { Signal, SignalsParams, SignalsResponse, SearchParams, ExtractedData } from '@/types/signals'

interface CacheEntry {
  data: SignalsResponse
  timestamp: number
}

class SignalsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes (données moins fréquentes que Flow Alerts)
  }

  /**
   * Génère une clé de cache basée sur tous les paramètres pertinents
   */
  private getCacheKey(params?: SignalsParams): string {
    if (!params) return 'signals_default'

    const sortedKeys = Object.keys(params).sort()
    const cacheParts = sortedKeys
      .filter(key => params[key as keyof SignalsParams] !== undefined)
      .map(key => `${key}_${params[key as keyof SignalsParams]}`)

    return `signals_${cacheParts.join('_')}`
  }

  /**
   * Récupère les signaux avec cache
   * @param params - Paramètres de filtrage
   * @param forceRefresh - Force le rafraîchissement du cache
   */
  async getSignals(params?: SignalsParams, forceRefresh = false): Promise<SignalsResponse> {
    const cacheKey = this.getCacheKey(params)
    
    // Vérifier le cache si pas de rafraîchissement forcé
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    // Récupérer depuis l'API
    try {
      const response = await signalsClient.getSignals(params)
      
      // Vérifier que les données sont valides
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide : type incorrect')
      }

      if (!('data' in response) || !Array.isArray(response.data)) {
        throw new Error('Réponse API invalide : pas de propriété data ou data n\'est pas un tableau')
      }

      // Normaliser la réponse
      const normalizedResponse: SignalsResponse = {
        success: response.success ?? true,
        data: response.data,
        count: response.count ?? response.data.length,
        cached: response.cached ?? false,
        timestamp: response.timestamp ?? new Date().toISOString(),
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: normalizedResponse,
        timestamp: Date.now(),
      })

      return normalizedResponse
    } catch (error) {
      throw error
    }
  }

  /**
   * Recherche des signaux par mot-clé
   * @param params - Paramètres de recherche
   * @param forceRefresh - Force le rafraîchissement
   */
  async searchSignals(params: SearchParams, forceRefresh = false): Promise<Signal[]> {
    const cacheKey = `search_${params.query}_${params.limit || 20}`

    // Vérifier le cache si pas de rafraîchissement forcé
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data.data
      }
    }

    try {
      const results = await signalsClient.searchSignals(params)

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: {
          success: true,
          data: results,
          count: results.length,
          cached: false,
          timestamp: new Date().toISOString(),
        },
        timestamp: Date.now(),
      })

      return results
    } catch (error) {
      throw error
    }
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Formate la date relative (ex: "il y a 2 heures")
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return this.formatDate(dateString)
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton
export const signalsService = new SignalsService()
export default signalsService

