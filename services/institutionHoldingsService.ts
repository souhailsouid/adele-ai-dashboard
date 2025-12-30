import institutionHoldingsClient from '@/lib/api/institutionHoldingsClient'
import type { InstitutionHolding } from '@/types/institutionHoldings'

interface CacheEntry {
  data: InstitutionHolding[]
  timestamp: number
}

class InstitutionHoldingsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes de cache
  }

  private getCacheKey(
    cik: string,
    limit: number,
    order: string,
    orderDirection: string,
    date?: string
  ): string {
    return `institution_holdings_${cik}_${date || 'latest'}_${limit}_${order}_${orderDirection}`
  }

  async getHoldings(
    cik: string,
    date: string,
    limit = 100,
    order: 'units_change' | 'value' | 'units' = 'units_change',
    orderDirection: 'asc' | 'desc' = 'desc',
    forceRefresh = false
  ): Promise<InstitutionHolding[]> {
    const cacheKey = this.getCacheKey(cik, limit, order, orderDirection, date)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await institutionHoldingsClient.getHoldings(
        cik,
        date,
        limit,
        order,
        orderDirection
      )

      // Validation de la réponse - la structure peut varier selon l'API
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide : réponse vide ou type incorrect')
      }

      let holdingsArray: InstitutionHolding[] = []

      // Cas 1: Structure standard { success, data: { id, data: [...], ... }, cached, timestamp }
      if (response.data && typeof response.data === 'object') {
        // Si response.data.data existe et est un tableau
        if (Array.isArray(response.data.data)) {
          holdingsArray = response.data.data
        }
        // Si response.data est directement un tableau (cas alternatif)
        else if (Array.isArray(response.data)) {
          holdingsArray = response.data
        }
      }
      // Cas 2: La réponse est directement un tableau
      else if (Array.isArray(response)) {
        holdingsArray = response
      }
      // Cas 3: Structure d'erreur
      else if (response.success === false || (response as any).error) {
        const errorMessage = (response as any).error || (response as any).message || 'Erreur inconnue'
        throw new Error(`Erreur API : ${errorMessage}`)
      }

      // Si aucun tableau n'a été trouvé après toutes les vérifications
      if (!Array.isArray(holdingsArray)) {
        // Structure inattendue mais pas un tableau vide valide - retourner vide sans erreur
        // (certaines institutions peuvent ne pas avoir de holdings)
        return []
      }

      // Si c'est un tableau vide, c'est valide (pas de holdings pour cette institution)
      // On retourne le tableau vide, pas une erreur

      this.cache.set(cacheKey, {
        data: holdingsArray,
        timestamp: Date.now(),
      })

      return holdingsArray
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtient les top achats (units_change > 0)
   */
  getTopPurchases(holdings: InstitutionHolding[], limit = 5): InstitutionHolding[] {
    return holdings
      .filter((h) => h.units_change > 0)
      .sort((a, b) => b.units_change - a.units_change)
      .slice(0, limit)
  }

  /**
   * Obtient les top ventes (units_change < 0)
   */
  getTopSales(holdings: InstitutionHolding[], limit = 5): InstitutionHolding[] {
    return holdings
      .filter((h) => h.units_change < 0)
      .sort((a, b) => a.units_change - b.units_change) // Tri ascendant car les valeurs sont négatives
      .slice(0, limit)
  }

  /**
   * Formate le changement de position en pourcentage
   */
  formatChangePercent(changePerc: string | null): string {
    if (!changePerc) return 'N/A'
    const num = parseFloat(changePerc)
    if (isNaN(num)) return 'N/A'
    const sign = num >= 0 ? '+' : ''
    return `${sign}${(num * 100).toFixed(1)}%`
  }

  /**
   * Formate la valeur de marché
   */
  formatMarketValue(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  /**
   * Calcule le pourcentage de changement de position
   */
  calculateChangePercent(current: number, change: number): number {
    if (current === 0) return 0
    return (change / current) * 100
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const institutionHoldingsService = new InstitutionHoldingsService()
export default institutionHoldingsService

