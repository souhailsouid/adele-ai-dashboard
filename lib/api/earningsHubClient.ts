/**
 * Client API pour le service Earnings Hub
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { EarningsHubRequest, EarningsHubResponse } from '@/types/earningsHub'

class EarningsHubClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API de base
    super(process.env.NEXT_PUBLIC_API_URL || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Analyse l'historique des earnings pour un ticker
   * @param params - Paramètres de l'analyse
   * @param options - Options de requête additionnelles
   * @returns Promise<EarningsHubResponse>
   */
  async analyzeEarningsHub(
    params: EarningsHubRequest,
    options?: RequestOptions
  ): Promise<EarningsHubResponse> {
    const {
      ticker,
      quartersLimit = 16,
    } = params

    // Construire les query params
    const queryParams = new URLSearchParams({
      ticker,
      quartersLimit: quartersLimit.toString(),
    })

    const endpoint = `/analyze/earnings-hub?${queryParams.toString()}`

    try {
      // La réponse peut être dans un format AWS Lambda avec statusCode et body (string JSON)
      const response = await this.post<any>(endpoint, {}, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response.statusCode && typeof response.body === 'string') {
        try {
          const parsedBody = JSON.parse(response.body) as EarningsHubResponse
          return parsedBody
        } catch (parseError) {
          console.error('Erreur lors du parsing du body:', parseError)
          throw new Error('Réponse invalide du serveur')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as EarningsHubResponse
    } catch (error: any) {
      // Si erreur, retourner une réponse avec success: false
      return {
        success: false,
        analysis: {
          ticker,
          hubScore: 'F',
          stats: {
            marketCap: 'N/A',
            peRatio: null,
            currentPrice: 0,
            epsBeatsCount: 0,
            totalQuarters: 0,
            epsBeatRate: 0,
            avgEpsSurprise: 0,
          },
          latestQuarter: null,
          history: [],
          insights: [],
          interpretation: {
            summary: 'Erreur lors du chargement des données',
            keyPoints: [],
            trends: [],
          },
        },
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors de l\'analyse',
      }
    }
  }
}

// Export singleton
export const earningsHubClient = new EarningsHubClient()
export default earningsHubClient

