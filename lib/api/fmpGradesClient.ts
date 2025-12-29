/**
 * Client API pour les données FMP Grades
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type {
  FMPGradesHistoricalResponse,
  FMPConsensusResponse,
  FMPPriceTargetResponse,
} from '@/types/fmpSignals'

class FMPGradesClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère l'historique des grades d'analystes
   * @param symbol - Symbole du ticker (ex: TSLA, AAPL)
   * @param limit - Nombre de résultats (max 1000)
   * @returns Promise<FMPGradesHistoricalResponse>
   */
  async getGradesHistorical(
    symbol: string,
    limit = 100,
    options?: RequestOptions
  ): Promise<FMPGradesHistoricalResponse> {
    const endpoint = `/fmp/grades-historical/${symbol}?limit=${limit}`

    const response = await this.get<FMPGradesHistoricalResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }

  /**
   * Récupère le consensus actuel des grades
   * @param symbol - Symbole du ticker
   * @returns Promise<FMPConsensusResponse>
   */
  async getGradesConsensus(
    symbol: string,
    options?: RequestOptions
  ): Promise<FMPConsensusResponse> {
    const endpoint = `/fmp/grades-consensus/${symbol}`

    const response = await this.get<FMPConsensusResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }

  /**
   * Récupère le consensus des price targets
   * @param symbol - Symbole du ticker
   * @returns Promise<FMPPriceTargetResponse>
   */
  async getPriceTargetConsensus(
    symbol: string,
    options?: RequestOptions
  ): Promise<FMPPriceTargetResponse> {
    const endpoint = `/fmp/price-target-consensus/${symbol}`

    const response = await this.get<FMPPriceTargetResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }
}

// Export singleton
export const fmpGradesClient = new FMPGradesClient()
export default fmpGradesClient

