/**
 * Service pour gérer les données d'insider trades
 * Gère le cache et la transformation des données
 */

import insiderTradesClient from '@/lib/api/insiderTradesClient'
import type { Insider, InsiderTickerFlow, InsiderTransaction, InsiderTransactionDetail } from '@/types/insiderTrades'

interface CacheEntry {
  data: Insider[]
  timestamp: number
}

interface TickerFlowCacheEntry {
  data: InsiderTickerFlow[]
  timestamp: number
}

interface TransactionsCacheEntry {
  data: InsiderTransactionDetail[]
  timestamp: number
}

class InsiderTradesService {
  private cache: Map<string, CacheEntry>
  private tickerFlowCache: Map<string, TickerFlowCacheEntry>
  private transactionsCache: Map<string, TransactionsCacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.tickerFlowCache = new Map()
    this.transactionsCache = new Map()
    this.cacheTimeout = 10 * 60 * 1000 // 10 minutes de cache (données plus volatiles)
  }

  private getCacheKey(ticker: string): string {
    return `insiders_${ticker}`
  }

  private getTickerFlowCacheKey(ticker: string): string {
    return `insider_ticker_flow_${ticker}`
  }

  private getTransactionsCacheKey(ticker: string, date?: string): string {
    return date ? `insider_transactions_${ticker}_${date}` : `insider_transactions_${ticker}`
  }

  /**
   * Formate la valeur monétaire (accepte string ou number)
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
   * Formate la date relative (ex: "Il y a 3 jours")
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
    return `Il y a ${Math.floor(diffDays / 365)} ans`
  }

  /**
   * Vérifie si un trade est récent (dans les 7 derniers jours)
   */
  isRecentTrade(trade: InsiderTickerFlow, days = 7): boolean {
    const tradeDate = new Date(trade.date)
    const now = new Date()
    const diffMs = now.getTime() - tradeDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= days
  }

  /**
   * Récupère la liste des insiders pour un ticker
   * @param ticker - Symbole du ticker
   * @param forceRefresh - Forcer le rafraîchissement
   * @returns Promise<Insider[]>
   */
  async getInsiders(
    ticker: string,
    forceRefresh = false
  ): Promise<Insider[]> {
    const cacheKey = this.getCacheKey(ticker)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const insiders = await insiderTradesClient.getInsiders(ticker)

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: insiders,
        timestamp: Date.now(),
      })

      return insiders
    } catch (error: any) {
      console.error(`Erreur lors du chargement des insiders pour ${ticker}:`, error)
      return []
    }
  }

  /**
   * Récupère le flow agrégé des insider trades pour un ticker
   * @param ticker - Symbole du ticker
   * @param limit - Non utilisé (l'API retourne toutes les données)
   * @param forceRefresh - Forcer le rafraîchissement
   * @returns Promise<InsiderTickerFlow[]>
   */
  async getInsiderTrades(
    ticker: string,
    limit = 20,
    forceRefresh = false
  ): Promise<InsiderTickerFlow[]> {
    const cacheKey = this.getTickerFlowCacheKey(ticker)

    if (!forceRefresh) {
      const cached = this.tickerFlowCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const flow = await insiderTradesClient.getTickerFlow(ticker)

      // Trier par date (plus récentes en premier)
      const sorted = flow.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })

      // Limiter si nécessaire
      const limited = limit > 0 ? sorted.slice(0, limit) : sorted

      // Mettre en cache
      this.tickerFlowCache.set(cacheKey, {
        data: limited,
        timestamp: Date.now(),
      })

      return limited
    } catch (error: any) {
      console.error(`Erreur lors du chargement du flow insider pour ${ticker}:`, error)
      return []
    }
  }

  /**
   * Récupère les transactions détaillées pour un ticker
   * @param ticker - Symbole du ticker
   * @param date - Date optionnelle pour filtrer (format YYYY-MM-DD)
   * @param forceRefresh - Forcer le rafraîchissement
   * @returns Promise<InsiderTransactionDetail[]>
   */
  async getTransactions(
    ticker: string,
    date?: string,
    forceRefresh = false
  ): Promise<InsiderTransactionDetail[]> {
    const cacheKey = this.getTransactionsCacheKey(ticker, date)

    if (!forceRefresh) {
      const cached = this.transactionsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const transactions = await insiderTradesClient.getTransactions(ticker, { date })

      // Trier par date (plus récentes en premier)
      const sorted = transactions.sort((a, b) => {
        const dateA = new Date(a.transaction_date).getTime()
        const dateB = new Date(b.transaction_date).getTime()
        return dateB - dateA
      })

      // Mettre en cache
      this.transactionsCache.set(cacheKey, {
        data: sorted,
        timestamp: Date.now(),
      })

      return sorted
    } catch (error: any) {
      console.error(`Erreur lors du chargement des transactions détaillées pour ${ticker}:`, error)
      return []
    }
  }

  /**
   * Corrèle une transaction avec un insider via le nom
   * @param transaction - Transaction détaillée
   * @param insiders - Liste des insiders
   * @returns L'insider correspondant ou null
   */
  correlateTransactionWithInsider(
    transaction: InsiderTransactionDetail,
    insiders: Insider[]
  ): Insider | null {
    // Normaliser les noms pour la comparaison
    const normalizeName = (name: string) => 
      name.toUpperCase().trim().replace(/\s+/g, ' ')

    const transactionName = normalizeName(transaction.owner_name)

    // Chercher une correspondance exacte ou partielle
    return insiders.find(insider => {
      const insiderName = normalizeName(insider.display_name || insider.name)
      return insiderName === transactionName || 
             insiderName.includes(transactionName) ||
             transactionName.includes(insiderName)
    }) || null
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
    
    // Nettoyer aussi le cache du ticker flow
    const tickerFlowKeysToDelete: string[] = []
    this.tickerFlowCache.forEach((entry, key) => {
      if (now - entry.timestamp >= this.cacheTimeout) {
        tickerFlowKeysToDelete.push(key)
      }
    })
    
    tickerFlowKeysToDelete.forEach(key => this.tickerFlowCache.delete(key))

    // Nettoyer le cache des transactions
    const transactionsKeysToDelete: string[] = []
    this.transactionsCache.forEach((entry, key) => {
      if (now - entry.timestamp >= this.cacheTimeout) {
        transactionsKeysToDelete.push(key)
      }
    })
    transactionsKeysToDelete.forEach(key => this.transactionsCache.delete(key))
  }
}

// Export singleton
const insiderTradesService = new InsiderTradesService()
export default insiderTradesService

