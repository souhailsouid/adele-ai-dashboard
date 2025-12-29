/**
 * Client API pour les données d'ownership institutionnel (13F)
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { InstitutionalOwnershipResponse } from '@/types/institutionalOwnership'

class InstitutionalOwnershipClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données institutionnelles (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère l'ownership institutionnel d'un ticker
   * @param ticker - Symbole du ticker (ex: TSLA, AAPL)
   * @param limit - Nombre de résultats à retourner (max 500, défaut 5 pour afficher les top détenteurs)
   * @param options - Options de requête additionnelles
   * @returns Promise<InstitutionalOwnershipResponse>
   */
  async getOwnership(
    ticker: string,
    limit = 5,
    options?: RequestOptions
  ): Promise<InstitutionalOwnershipResponse> {
    // Endpoint selon la documentation : /api/institution/{ticker}/ownership
    // Mais on utilise probablement le préfixe unusual-whales pour l'API 2
    const endpoint = `/unusual-whales/institution/${ticker}/ownership?limit=${limit}`

    const response = await this.get<InstitutionalOwnershipResponse | string>(endpoint, {
      tokenType: 'access',
      ...options,
    })
 console.log("response", response)
    // Si la réponse est une string (JSON non parsé), la parser
    if (typeof response === 'string') {
      try {
        return JSON.parse(response) as InstitutionalOwnershipResponse
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }
console.log("response", response)
    return response as InstitutionalOwnershipResponse
  }
}

// Export singleton
export const institutionalOwnershipClient = new InstitutionalOwnershipClient()
export default institutionalOwnershipClient

