/**
 * Service pour gérer les appels API des Flow Alerts
 */

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

class FlowAlertsService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod'
  }

  /**
   * Récupère le token d'accès depuis le localStorage
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  /**
   * Récupère les flow alerts depuis l'API
   */
  async getFlowAlerts(params?: FlowAlertsParams): Promise<FlowAlertsResponse> {
    try {
      const token = this.getAccessToken()
      
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      // Construction des paramètres de requête
      const queryParams = new URLSearchParams()
      if (params?.ticker_symbol) queryParams.append('ticker_symbol', params.ticker_symbol)
      if (params?.min_premium) queryParams.append('min_premium', params.min_premium.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())

      const url = `${this.baseUrl}/unusual-whales/option-trades/flow-alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
      }

      const data: FlowAlertsResponse = await response.json()
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des flow alerts:', error)
      throw error
    }
  }

  /**
   * Formate le premium pour l'affichage
   */
  formatPremium(premium: string | number): string {
    const num = typeof premium === 'string' ? parseFloat(premium) : premium
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`
    }
    return `$${num.toFixed(0)}`
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  }

  /**
   * Formate la date d'expiration
   */
  formatExpiry(expiry: string): string {
    const date = new Date(expiry)
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short',
      year: '2-digit'
    }).toUpperCase()
  }

  /**
   * Détermine le sentiment basé sur le type et les données
   */
  getSentiment(alert: FlowAlert): { label: string; color: string } {
    if (alert.type === 'call') {
      if (parseFloat(alert.total_premium) > 5000000) {
        return { label: 'Extremely Bullish', color: 'emerald' }
      }
      return { label: 'Bullish', color: 'emerald' }
    } else {
      if (parseFloat(alert.total_premium) > 5000000) {
        return { label: 'Extremely Bearish', color: 'red' }
      }
      return { label: 'Bearish', color: 'red' }
    }
  }

  /**
   * Calcule un score whale basé sur le premium et le volume
   */
  getWhaleScore(alert: FlowAlert): number | 'WHALE' {
    const premium = parseFloat(alert.total_premium)
    const volumeOI = parseFloat(alert.volume_oi_ratio)
    
    if (premium > 10000000 || volumeOI > 2) {
      return 'WHALE'
    }
    
    // Score basé sur le premium (0-100)
    const premiumScore = Math.min((premium / 10000000) * 100, 100)
    return Math.round(premiumScore)
  }
}

export const flowAlertsService = new FlowAlertsService()

