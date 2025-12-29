/**
 * Client API pour les signaux de marché FMP
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { MarketSignalResponse } from '@/types/fmpSignals'

class MarketSignalsClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL || 'https://tsdd1sibd1.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère les signaux de marché pour un ticker donné
   * @param ticker - Symbole du ticker (ex: AAPL, TSLA)
   * @param includeCompany - Inclure les infos company (profil, quote, métriques, earnings)
   * @returns Promise<MarketSignalResponse>
   */
  async getMarketSignal(
    ticker: string,
    includeCompany = false,
    options?: RequestOptions
  ): Promise<MarketSignalResponse> {
    const endpoint = includeCompany
      ? `/market-signals/${ticker}?includeCompany=true`
      : `/market-signals/${ticker}`

    const response = await this.get<MarketSignalResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }
}

// Export singleton
export const marketSignalsClient = new MarketSignalsClient()
export default marketSignalsClient

