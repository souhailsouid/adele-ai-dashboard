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
  
  // Phase 1 : Paramètres essentiels pour performance et précision
  min_volume?: number              // Volume minimum (ex: 5000)
  min_volume_oi_ratio?: number     // Ratio Vol/OI minimum (ex: 1.5)
  vol_greater_oi?: boolean         // Volume > OI = nouvelles positions massives
  is_floor?: boolean               // Floor trades uniquement (OTC institutionnel)
  is_sweep?: boolean               // Sweeps uniquement (achats agressifs)
  min_open_interest?: number       // OI minimum pour ratio fiable (ex: 1000)
  
  // Phase 2 : Paramètres Pro pour filtrage avancé
  min_dte?: number                 // Days to expiry minimum (ex: 7)
  max_dte?: number                 // Days to expiry maximum (ex: 365)
  size_greater_oi?: boolean        // Size > OI = position unique massive
  rule_name?: string[]             // Règles spécifiques (ex: ["FloorTradeLargeCap"])
  min_marketcap?: number           // Capitalisation min (ex: 10000000000 = $10B)
  max_marketcap?: number           // Capitalisation max
  issue_types?: string[]           // Types d'actifs (ex: ["Common Stock", "ETF"])
  is_otm?: boolean                 // Out of the money uniquement
  min_iv_change?: number           // Changement IV minimum (ex: 0.05 = +5%)
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
    
    // Phase 1 : Paramètres essentiels
    if (params?.min_volume) {
      queryParams.append('min_volume', params.min_volume.toString())
    }
    if (params?.min_volume_oi_ratio !== undefined) {
      queryParams.append('min_volume_oi_ratio', params.min_volume_oi_ratio.toString())
    }
    if (params?.vol_greater_oi !== undefined) {
      queryParams.append('vol_greater_oi', params.vol_greater_oi.toString())
    }
    if (params?.is_floor !== undefined) {
      queryParams.append('is_floor', params.is_floor.toString())
    }
    if (params?.is_sweep !== undefined) {
      queryParams.append('is_sweep', params.is_sweep.toString())
    }
    if (params?.min_open_interest) {
      queryParams.append('min_open_interest', params.min_open_interest.toString())
    }
    
    // Phase 2 : Paramètres Pro
    if (params?.min_dte !== undefined) {
      queryParams.append('min_dte', params.min_dte.toString())
    }
    if (params?.max_dte !== undefined) {
      queryParams.append('max_dte', params.max_dte.toString())
    }
    if (params?.size_greater_oi !== undefined) {
      queryParams.append('size_greater_oi', params.size_greater_oi.toString())
    }
    if (params?.rule_name && params.rule_name.length > 0) {
      params.rule_name.forEach(rule => {
        queryParams.append('rule_name[]', rule)
      })
    }
    if (params?.min_marketcap) {
      queryParams.append('min_marketcap', params.min_marketcap.toString())
    }
    if (params?.max_marketcap) {
      queryParams.append('max_marketcap', params.max_marketcap.toString())
    }
    if (params?.issue_types && params.issue_types.length > 0) {
      params.issue_types.forEach(type => {
        queryParams.append('issue_types[]', type)
      })
    }
    if (params?.is_otm !== undefined) {
      queryParams.append('is_otm', params.is_otm.toString())
    }
    if (params?.min_iv_change !== undefined) {
      queryParams.append('min_iv_change', params.min_iv_change.toString())
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
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }
    
    return response
  }
}

// Export singleton
export const flowAlertsClient = new FlowAlertsClient()
export default flowAlertsClient

