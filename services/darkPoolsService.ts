/**
 * Service pour gérer les données Dark Pools
 * Gère le cache et la transformation des données
 */

import darkPoolsClient from '@/lib/api/darkPoolsClient'
import type { DarkPoolTransaction } from '@/types/darkPools'

interface CacheEntry {
  data: DarkPoolTransaction[]
  timestamp: number
}

class DarkPoolsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes de cache (données très volatiles)
  }

  private getCacheKey(
    ticker: string, 
    minPremium?: number, 
    minSize?: number,
    newerThan?: string,
    olderThan?: string
  ): string {
    const parts = [`dark_pools_${ticker}`]
    if (minPremium) parts.push(`premium_${minPremium}`)
    if (minSize) parts.push(`size_${minSize}`)
    if (newerThan) parts.push(`newer_${newerThan}`)
    if (olderThan) parts.push(`older_${olderThan}`)
    return parts.join('_')
  }

  /**
   * Formate la valeur monétaire
   */
  formatCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '$0'
    
    const absValue = Math.abs(numValue)
    if (absValue >= 1000000) {
      return `${numValue < 0 ? '-' : ''}$${(absValue / 1000000).toFixed(2)}M`
    }
    if (absValue >= 1000) {
      return `${numValue < 0 ? '-' : ''}$${(absValue / 1000).toFixed(2)}K`
    }
    return `${numValue < 0 ? '-' : ''}$${absValue.toFixed(2)}`
  }

  /**
   * Formate la date relative
   */
  formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  /**
   * Vérifie si une transaction est récente (dernières 24h)
   */
  isRecentTransaction(transaction: DarkPoolTransaction, hours = 24): boolean {
    const transactionDate = new Date(transaction.executed_at)
    const now = new Date()
    const diffMs = now.getTime() - transactionDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours <= hours
  }

  /**
   * Récupère les transactions Dark Pool pour un ticker
   * @param ticker - Symbole du ticker
   * @param limit - Nombre maximum de résultats (défaut: 30)
   * @param minPremium - Premium minimum en dollars pour filtrer les "baleines" (défaut: 1000000 = 1M$)
   * @param minSize - Taille minimale en nombre d'actions (ex: 1000)
   * @param newerThan - Filtrer les transactions plus récentes que cette date (ISO 8601)
   * @param olderThan - Filtrer les transactions plus anciennes que cette date (ISO 8601)
   * @param forceRefresh - Forcer le rafraîchissement
   * @returns Promise<DarkPoolTransaction[]>
   */
  async getDarkPools(
    ticker: string,
    limit = 30,
    minPremium = 1000000, // 1M$ par défaut (cohérent avec flow alerts)
    minSize?: number,
    newerThan?: string,
    olderThan?: string,
    forceRefresh = false
  ): Promise<DarkPoolTransaction[]> {
    const cacheKey = this.getCacheKey(ticker, minPremium, minSize, newerThan, olderThan)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const transactions = await darkPoolsClient.getDarkPools(ticker, {
        limit,
        min_premium: minPremium,
        min_size: minSize,
        newer_than: newerThan,
        older_than: olderThan,
      })

      // Trier par date (plus récentes en premier)
      const sorted = transactions.sort((a, b) => {
        const dateA = new Date(a.executed_at).getTime()
        const dateB = new Date(b.executed_at).getTime()
        return dateB - dateA
      })

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: sorted,
        timestamp: Date.now(),
      })

      return sorted
    } catch (error: any) {
      console.error(`Erreur lors du chargement des Dark Pools pour ${ticker}:`, error)
      return []
    }
  }

  /**
   * Nettoie le cache expiré
   */
  clearExpiredCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= this.cacheTimeout) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Export singleton
const darkPoolsService = new DarkPoolsService()
export default darkPoolsService

