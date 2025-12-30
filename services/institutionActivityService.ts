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

  private getCacheKey(cik: string, limit: number, date?: string): string {
    return `institution_activity_${cik}_${date || 'latest'}_${limit}`
  }

  async getActivity(
    cik: string,
    date?: string,
    limit = 100,
    forceRefresh = false
  ): Promise<InstitutionActivityItem[]> {
    const cacheKey = this.getCacheKey(cik, limit, date)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await institutionActivityClient.getActivity(cik, date, limit)

      // Validation de la réponse - la structure peut varier selon l'API
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide : réponse vide ou type incorrect')
      }

      let activityArray: InstitutionActivityItem[] = []

      // Cas 1: Structure standard { success, data: [...], cached, timestamp }
      if (response.data && Array.isArray(response.data)) {
        activityArray = response.data
      }
      // Cas 2: La réponse est directement un tableau
      else if (Array.isArray(response)) {
        activityArray = response
      }
      // Cas 3: Structure d'erreur
      else if (response.success === false || (response as any).error) {
        const errorMessage = (response as any).error || (response as any).message || 'Erreur inconnue'
        throw new Error(`Erreur API : ${errorMessage}`)
      }

      // Si aucun tableau n'a été trouvé après toutes les vérifications
      if (!Array.isArray(activityArray)) {
        // Retourner un tableau vide plutôt qu'une erreur (certaines institutions peuvent ne pas avoir d'activité)
        return []
      }

      this.cache.set(cacheKey, {
        data: activityArray,
        timestamp: Date.now(),
      })

      return activityArray
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

