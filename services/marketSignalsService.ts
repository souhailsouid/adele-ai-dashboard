/**
 * Service pour les signaux de marché FMP
 * Gère le cache et la logique métier
 */

import marketSignalsClient from '@/lib/api/marketSignalsClient'
import type { MarketSignalResponse } from '@/types/fmpSignals'

interface CacheEntry {
  data: MarketSignalResponse
  timestamp: number
}

class MarketSignalsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes de cache
  }

  private getCacheKey(ticker: string, includeCompany: boolean): string {
    return `market_signal_${ticker}_${includeCompany ? 'full' : 'simple'}`
  }

  /**
   * Récupère les signaux de marché pour un ticker
   * @param ticker - Symbole du ticker
   * @param includeCompany - Inclure les infos company (profil, quote, métriques, earnings)
   * @param forceRefresh - Force le rafraîchissement
   */
  async getMarketSignal(
    ticker: string,
    includeCompany = false,
    forceRefresh = false
  ): Promise<MarketSignalResponse> {
    const cacheKey = this.getCacheKey(ticker, includeCompany)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await marketSignalsClient.getMarketSignal(ticker, includeCompany)

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      })

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Formate la date relative
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)
    const diffMinutes = Math.round(diffSeconds / 60)
    const diffHours = Math.round(diffMinutes / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const marketSignalsService = new MarketSignalsService()
export default marketSignalsService

