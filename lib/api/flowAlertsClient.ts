/**
 * Client API pour les Flow Alerts (Unusual Whales)
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient } from './baseClient'

export interface FlowAlert {
  id: string
  ticker: string
  created_at: string
  start_time: number
  end_time: number
  type: 'call' | 'put'
  strike: string
  expiry: string
  total_premium: string
  volume: number
  underlying_price: string
  price: string
  bid: string
  ask: string
  alert_rule: string
  sector: string
  has_sweep: boolean
  has_floor: boolean
  trade_count: number
  open_interest: number
  volume_oi_ratio: string
  iv_start: string
  iv_end: string
  total_size: number
  marketcap: string
}

export interface FlowAlertsResponse {
  success: boolean
  data: FlowAlert[]
  cached: boolean
  count: number
  timestamp: string
}

export interface FlowAlertsParams {
  ticker_symbol?: string
  min_premium?: number
  limit?: number
}

class FlowAlertsClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour Flow Alerts
    super(process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère les flow alerts depuis l'API
   * @param params - Paramètres de filtrage
   * @returns Promise<FlowAlertsResponse>
   */
  async getFlowAlerts(params?: FlowAlertsParams): Promise<FlowAlertsResponse> {
    // Construction des paramètres de requête
    const queryParams = new URLSearchParams()
    
    if (params?.ticker_symbol) {
      queryParams.append('ticker_symbol', params.ticker_symbol)
    }
    if (params?.min_premium) {
      queryParams.append('min_premium', params.min_premium.toString())
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const endpoint = `/unusual-whales/option-trades/flow-alerts${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`

    let response = await this.get<FlowAlertsResponse>(endpoint, {
      tokenType: 'access', // Utilise le token d'accès
    })
    
    // Si la réponse est une string JSON, la parser
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response) as FlowAlertsResponse
      } catch (error) {
        console.error('❌ [FlowAlertsClient] Failed to parse JSON:', error)
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }
    
    return response
  }
}

// Export singleton
export const flowAlertsClient = new FlowAlertsClient()
export default flowAlertsClient

