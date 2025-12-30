/**
 * Client API pour les données Dark Pools
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { DarkPoolsResponse, DarkPoolTransaction } from '@/types/darkPools'

class DarkPoolsClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données Dark Pools (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère les transactions Dark Pool pour un ticker
   * @param ticker - Symbole du ticker (ex: TSLA, AAPL)
   * @param options - Options de requête additionnelles
   * @returns Promise<DarkPoolTransaction[]>
   */
  async getDarkPools(
    ticker: string,
    options?: RequestOptions & { 
      limit?: number
      min_premium?: number
      min_size?: number
      newer_than?: string // ISO 8601 date string (ex: "2025-12-30T10:00:00Z")
      older_than?: string // ISO 8601 date string
    }
  ): Promise<DarkPoolTransaction[]> {
    let endpoint = `/unusual-whales/dark-pool/${ticker}`
    
    const queryParams = new URLSearchParams()
    if (options?.limit) {
      queryParams.append('limit', options.limit.toString())
    }
    if (options?.min_premium) {
      queryParams.append('min_premium', options.min_premium.toString())
    }
    if (options?.min_size) {
      queryParams.append('min_size', options.min_size.toString())
    }
    if (options?.newer_than) {
      queryParams.append('newer_than', options.newer_than)
    }
    if (options?.older_than) {
      queryParams.append('older_than', options.older_than)
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }

    const response = await this.get<DarkPoolsResponse | DarkPoolTransaction[] | string>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    // Si la réponse est une string (JSON non parsé), la parser
    let parsed: any = response
    if (typeof response === 'string') {
      try {
        parsed = JSON.parse(response)
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }

    // Si c'est un objet avec une propriété data
    if (parsed?.success && Array.isArray(parsed.data)) {
      return parsed.data as DarkPoolTransaction[]
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      return parsed as DarkPoolTransaction[]
    }

    return []
  }
}

// Export singleton
export const darkPoolsClient = new DarkPoolsClient()
export default darkPoolsClient

