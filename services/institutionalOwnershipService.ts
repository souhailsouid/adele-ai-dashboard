/**
 * Service pour gérer les données d'ownership institutionnel (13F)
 * Gère le cache et la transformation des données
 */

import institutionalOwnershipClient from '@/lib/api/institutionalOwnershipClient'
import type { InstitutionalOwner, InstitutionalOwnershipResponse } from '@/types/institutionalOwnership'

interface CacheEntry {
  data: InstitutionalOwner[]
  timestamp: number
}

class InstitutionalOwnershipService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes de cache (données moins volatiles)
  }

  private getCacheKey(ticker: string, limit: number): string {
    return `institutional_ownership_${ticker}_${limit}`
  }

  /**
   * Calcule le pourcentage d'ownership à partir des units et shares_outstanding
   */
  private calculateOwnershipPercent(units: number, sharesOutstanding: string | number): number {
    const shares = typeof sharesOutstanding === 'string' ? parseFloat(sharesOutstanding) || 0 : sharesOutstanding || 0
    if (shares === 0) return 0
    return (units / shares) * 100
  }

  /**
   * Récupère l'ownership institutionnel pour un ticker
   * @param ticker - Symbole du ticker
   * @param limit - Nombre de résultats (défaut 5 pour afficher les top détenteurs)
   * @param forceRefresh - Forcer le rafraîchissement
   * @returns Promise<InstitutionalOwner[]>
   */
  async getOwnership(
    ticker: string,
    limit = 5,
    forceRefresh = false
  ): Promise<InstitutionalOwner[]> {
    const cacheKey = this.getCacheKey(ticker, limit)

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const response = await institutionalOwnershipClient.getOwnership(ticker, limit)
      
      // Validation de la réponse - la structure est { success, data: { id, data: [...], ... }, cached, timestamp }
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide : réponse vide ou type incorrect')
      }

      // Vérifier si response.data existe et est un objet
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Réponse API invalide : response.data n\'existe pas ou n\'est pas un objet')
      }

      // Vérifier si response.data.data existe et est un tableau
      if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Réponse API invalide : response.data.data n\'existe pas ou n\'est pas un tableau')
      }

      // Extraire le tableau des owners depuis response.data.data
      const ownersArray = response.data.data

      // Enrichir les données avec le pourcentage d'ownership calculé
      const enrichedData = ownersArray.map((owner) => {
        const ownership_perc = this.calculateOwnershipPercent(owner.units, owner.shares_outstanding)
        return {
          ...owner,
          ownership_perc,
        }
      })

      // Trier par ownership_perc décroissant et prendre les top N
      const sortedData = enrichedData
        .sort((a, b) => (b.ownership_perc || 0) - (a.ownership_perc || 0))
        .slice(0, limit)

      this.cache.set(cacheKey, {
        data: sortedData,
        timestamp: Date.now(),
      })

      return sortedData
    } catch (error) {
      throw error
    }
  }

  /**
   * Formate le pourcentage d'ownership
   */
  formatOwnershipPercent(percent: number): string {
    return `${percent.toFixed(2)}%`
  }

  /**
   * Formate la valeur de marché (utilise `value` du format API)
   */
  formatMarketValue(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  /**
   * Vérifie si une institution a acheté récemment (corrélation avec Flow Alert)
   * Cette logique sera améliorée plus tard avec les données de changements trimestriels
   */
  hasRecentActivity(owner: InstitutionalOwner): boolean {
    // Pour l'instant, on considère qu'une institution avec >5% d'ownership est "active"
    // À améliorer avec des données de changements trimestriels
    return (owner.ownership_perc || 0) >= 5
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const institutionalOwnershipService = new InstitutionalOwnershipService()
export default institutionalOwnershipService

