/**
 * Client API pour les transactions Insider Trading FMP
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { InsiderTradingResponse, InsiderTradingParams } from '@/types/insiderTrading'

class InsiderTradingClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère les dernières transactions Insider Trading
   * @param params - Paramètres de filtrage (symbol, limit, page)
   * @returns Promise<InsiderTradingResponse>
   */
  async getLatestInsiderTrading(
    params?: InsiderTradingParams,
    options?: RequestOptions
  ): Promise<InsiderTradingResponse> {
    const queryParams = new URLSearchParams()

    if (params?.symbol) {
      queryParams.append('symbol', params.symbol)
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }

    const endpoint = `/fmp/insider-trading/latest${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await this.get<InsiderTradingResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }
}

// Export singleton
export const insiderTradingClient = new InsiderTradingClient()
export default insiderTradingClient

