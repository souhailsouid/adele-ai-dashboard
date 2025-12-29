import institutionActivityClient from '@/lib/api/institutionActivityClient'
import type { InstitutionActivityItem } from '@/types/institutionActivity'

interface CacheEntry {
  data: InstitutionActivityItem[]
  timestamp: number
}

class InstitutionActivityService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes de cache
  }

  private getCacheKey(cik: string, date?: string, limit: number): string {
    return `institution_activity_${cik}_${date || 'latest'}_${limit}`
  }

  async getActivity(
    cik: string,
    date?: string,
    limit = 100,
    forceRefresh = false
  ): Promise<InstitutionActivityItem[]> {
    const cacheKey = this.getCacheKey(cik, date, limit)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await institutionActivityClient.getActivity(cik, date, limit)

      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Réponse API invalide : données manquantes')
      }

      const data = response.data

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })

      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Filtre les transactions pour ne garder que les Shares (exclut Options, Debt, etc.)
   */
  filterSharesOnly(activity: InstitutionActivityItem[]): InstitutionActivityItem[] {
    return activity.filter((item) => item.security_type === 'Share')
  }

  /**
   * Filtre les transactions récentes (par date de filing)
   */
  filterRecent(activity: InstitutionActivityItem[], days = 90): InstitutionActivityItem[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return activity.filter((item) => {
      const filingDate = new Date(item.filing_date)
      return filingDate >= cutoffDate
    })
  }

  /**
   * Formate le prix pour l'affichage
   */
  formatPrice(price: string | null): string {
    if (!price) return 'N/A'
    const num = parseFloat(price)
    if (isNaN(num)) return 'N/A'
    return `$${num.toFixed(2)}`
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

  clearCache(): void {
    this.cache.clear()
  }
}

export const institutionActivityService = new InstitutionActivityService()
export default institutionActivityService

