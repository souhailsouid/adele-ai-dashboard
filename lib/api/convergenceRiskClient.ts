/**
 * Client API pour le service Convergence et Risque de Liquidation
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { WhaleAnalysisRequest, WhaleAnalysisResponse } from '@/types/convergenceRisk'

class ConvergenceRiskClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données Unusual Whales (même base que Dark Pools)
    super(process.env.NEXT_PUBLIC_API_URL)
  }

  /**
   * Analyse la convergence et le risque de liquidation pour un ticker
   * @param params - Paramètres de l'analyse
   * @param options - Options de requête additionnelles
   * @returns Promise<WhaleAnalysisResponse>
   */
  async analyzeConvergenceRisk(
    params: WhaleAnalysisRequest,
    options?: RequestOptions
  ): Promise<WhaleAnalysisResponse> {
    const {
      ticker,
      darkPoolLimit = 100,
      optionsLimit = 200,
      minPremium = 50000,
      expiryFilter,
      liquidationThreshold = 0.005,
    } = params

    // Construire les query params
    const queryParams = new URLSearchParams({
      ticker,
      darkPoolLimit: darkPoolLimit.toString(),
      optionsLimit: optionsLimit.toString(),
      minPremium: minPremium.toString(),
      liquidationThreshold: liquidationThreshold.toString(),
    })

    if (expiryFilter) {
      queryParams.append('expiryFilter', expiryFilter)
    }

    const endpoint = `/analyze/convergence-risk?${queryParams.toString()}`

    try {
      // La réponse peut être dans un format AWS Lambda avec statusCode et body (string JSON)
      const response = await this.post<any>(endpoint, {}, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response.statusCode && typeof response.body === 'string') {
        try {
          const parsedBody = JSON.parse(response.body) as WhaleAnalysisResponse
          return parsedBody
        } catch (parseError) {
          console.error('Erreur lors du parsing du body:', parseError)
          throw new Error('Réponse invalide du serveur')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as WhaleAnalysisResponse
    } catch (error: any) {
      // Si erreur, retourner une réponse avec success: false
      return {
        success: false,
        analysis: {
          ticker,
          currentPrice: 0,
          whaleSupport: 0,
          targetStrike: 0,
          liquidationRisk: 'LOW',
          isWhaleInProfit: false,
          priceDistanceFromSupport: null,
          priceDistanceFromTarget: null,
        },
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors de l\'analyse',
      }
    }
  }
}

// Export singleton
export const convergenceRiskClient = new ConvergenceRiskClient()
export default convergenceRiskClient

