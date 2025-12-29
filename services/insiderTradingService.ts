/**
 * Service pour les transactions Insider Trading FMP
 * Gère le cache et la logique métier
 */

import insiderTradingClient from '@/lib/api/insiderTradingClient'
import type { InsiderTradingResponse, InsiderTradingParams } from '@/types/insiderTrading'

interface CacheEntry {
  data: InsiderTradingResponse
  timestamp: number
}

class InsiderTradingService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes de cache
  }

  private getCacheKey(params?: InsiderTradingParams): string {
    return `insider_trading_${JSON.stringify(params || {})}`
  }

  /**
   * Récupère les dernières transactions Insider Trading
   * @param params - Paramètres de filtrage
   * @param forceRefresh - Force le rafraîchissement
   */
  async getLatestInsiderTrading(
    params?: InsiderTradingParams,
    forceRefresh = false
  ): Promise<InsiderTradingResponse> {
    const cacheKey = this.getCacheKey(params)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await insiderTradingClient.getLatestInsiderTrading(params)

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
   * Formate un montant en dollars
   */
  formatAmount(amount: number): string {
    if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(2)}M`
    }
    if (amount >= 1e3) {
      return `$${(amount / 1e3).toFixed(2)}K`
    }
    return `$${amount.toFixed(2)}`
  }

  /**
   * Calcule la valeur totale d'une transaction
   */
  calculateTransactionValue(transaction: { securitiesTransacted: number; price: number }): number {
    return transaction.securitiesTransacted * transaction.price
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const insiderTradingService = new InsiderTradingService()
export default insiderTradingService

