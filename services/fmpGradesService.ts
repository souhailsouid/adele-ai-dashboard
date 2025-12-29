/**
 * Service pour les données FMP Grades
 * Gère le cache et la logique métier
 */

import fmpGradesClient from '@/lib/api/fmpGradesClient'
import type {
  FMPGradesHistoricalResponse,
  FMPConsensusResponse,
  FMPPriceTargetResponse,
} from '@/types/fmpSignals'

interface CacheEntry {
  data: FMPGradesHistoricalResponse | FMPConsensusResponse | FMPPriceTargetResponse
  timestamp: number
}

class FMPGradesService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes de cache (données moins volatiles)
  }

  private getCacheKey(type: 'historical' | 'consensus' | 'price-target', symbol: string, limit?: number): string {
    return `fmp_grades_${type}_${symbol}_${limit || 'default'}`
  }

  /**
   * Récupère l'historique des grades
   */
  async getGradesHistorical(
    symbol: string,
    limit = 100,
    forceRefresh = false
  ): Promise<FMPGradesHistoricalResponse> {
    const cacheKey = this.getCacheKey('historical', symbol, limit)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data as FMPGradesHistoricalResponse
      }
    }

    try {
      const response = await fmpGradesClient.getGradesHistorical(symbol, limit)

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
   * Récupère le consensus actuel
   */
  async getGradesConsensus(
    symbol: string,
    forceRefresh = false
  ): Promise<FMPConsensusResponse> {
    const cacheKey = this.getCacheKey('consensus', symbol)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data as FMPConsensusResponse
      }
    }

    try {
      const response = await fmpGradesClient.getGradesConsensus(symbol)

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
   * Récupère le consensus des price targets
   */
  async getPriceTargetConsensus(
    symbol: string,
    forceRefresh = false
  ): Promise<FMPPriceTargetResponse> {
    const cacheKey = this.getCacheKey('price-target', symbol)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data as FMPPriceTargetResponse
      }
    }

    try {
      const response = await fmpGradesClient.getPriceTargetConsensus(symbol)

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
   * Calcule le consensus à partir des ratings
   */
  calculateConsensus(strongBuy: number, buy: number, hold: number, sell: number, strongSell: number): string {
    const total = strongBuy + buy + hold + sell + strongSell
    if (total === 0) return 'N/A'

    const bullish = strongBuy + buy
    const bearish = sell + strongSell

    if (bullish > bearish * 1.5) return 'Strong Buy'
    if (bullish > bearish) return 'Buy'
    if (bearish > bullish * 1.5) return 'Strong Sell'
    if (bearish > bullish) return 'Sell'
    return 'Hold'
  }

  /**
   * Formate la date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const fmpGradesService = new FMPGradesService()
export default fmpGradesService

