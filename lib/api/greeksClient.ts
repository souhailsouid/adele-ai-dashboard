/**
 * Client API pour les données de Greeks (Gamma, Delta, etc.)
 * Récupère l'exposition aux Greeks pour un ticker
 * Endpoints:
 * - GET /unusual-whales/stock/{ticker}/greek-exposure/strike
 * - GET /unusual-whales/stock/{ticker}/spot-exposures/strike
 * - GET /unusual-whales/stock/{ticker}/greeks
 */

import { BaseApiClient, RequestOptions } from './baseClient'

export interface GreekExposureData {
  strike: number
  call_gamma_oi?: number
  put_gamma_oi?: number
  total_gamma?: number
  call_delta_oi?: number
  put_delta_oi?: number
  total_delta?: number
  call_vega_oi?: number
  put_vega_oi?: number
  total_vega?: number
  call_theta_oi?: number
  put_theta_oi?: number
  total_theta?: number
  date?: string
  expiration?: string
}

export interface SpotExposureData {
  strike: number
  gamma: number
  delta?: number
  vega?: number
  theta?: number
  date?: string
  expiration?: string
}

export interface GreeksResponse {
  success: boolean
  data: GreekExposureData[] | SpotExposureData[]
  ticker: string
  timestamp: string
  error?: string
}

class GreeksClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données d'options (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère l'exposition aux Greeks par strike
   * @param ticker - Symbole du ticker (ex: MSFT, AAPL)
   * @param date - Date au format YYYY-MM-DD pour récupérer les données historiques (optionnel)
   * @param options - Options de requête additionnelles
   * @returns Promise<GreeksResponse>
   */
  async getGreekExposureByStrike(
    ticker: string,
    date?: string,
    options?: RequestOptions
  ): Promise<GreeksResponse> {
    let endpoint = `/unusual-whales/stock/${ticker.toUpperCase()}/greek-exposure/strike`
    
    const params = new URLSearchParams()
    if (date) {
      params.append('date', date)
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      return this.parseGreekResponse(response, ticker, date)
    } catch (error: any) {
      console.error('Error fetching greek exposure:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement de l\'exposition aux Greeks',
      }
    }
  }

  /**
   * Récupère les expositions spot (temps réel) par strike
   * @param ticker - Symbole du ticker
   * @param date - Date au format YYYY-MM-DD (optionnel)
   * @param options - Options de requête additionnelles
   * @returns Promise<GreeksResponse>
   */
  async getSpotExposuresByStrike(
    ticker: string,
    date?: string,
    options?: RequestOptions
  ): Promise<GreeksResponse> {
    let endpoint = `/unusual-whales/stock/${ticker.toUpperCase()}/spot-exposures/strike`
    
    const params = new URLSearchParams()
    if (date) {
      params.append('date', date)
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      return this.parseSpotExposureResponse(response, ticker, date)
    } catch (error: any) {
      console.error('Error fetching spot exposures:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement des expositions spot',
      }
    }
  }

  /**
   * Parse la réponse pour Greek Exposure
   */
  private parseGreekResponse(
    response: any,
    ticker: string,
    date?: string
  ): GreeksResponse {
    let parsed: any = response
    if (typeof response === 'string') {
      try {
        parsed = JSON.parse(response)
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }

    // Format Unusual Whales avec wrapper
    if (parsed?.data && Array.isArray(parsed.data)) {
      const formattedData: GreekExposureData[] = parsed.data.map((item: any) => ({
        strike: typeof item.strike === 'string' ? parseFloat(item.strike) : item.strike || 0,
        call_gamma_oi: item.call_gamma_oi || 0,
        put_gamma_oi: item.put_gamma_oi || 0,
        total_gamma: item.total_gamma || (item.call_gamma_oi || 0) + (item.put_gamma_oi || 0),
        call_delta_oi: item.call_delta_oi,
        put_delta_oi: item.put_delta_oi,
        total_delta: item.total_delta,
        call_vega_oi: item.call_vega_oi,
        put_vega_oi: item.put_vega_oi,
        total_vega: item.total_vega,
        call_theta_oi: item.call_theta_oi,
        put_theta_oi: item.put_theta_oi,
        total_theta: item.total_theta,
        date: item.date || parsed.data_date || date,
        expiration: item.expiration,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        timestamp: parsed.cached_at || parsed.timestamp || new Date().toISOString(),
      }
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      const formattedData: GreekExposureData[] = parsed.map((item: any) => ({
        strike: typeof item.strike === 'string' ? parseFloat(item.strike) : item.strike || 0,
        call_gamma_oi: item.call_gamma_oi || 0,
        put_gamma_oi: item.put_gamma_oi || 0,
        total_gamma: item.total_gamma || (item.call_gamma_oi || 0) + (item.put_gamma_oi || 0),
        call_delta_oi: item.call_delta_oi,
        put_delta_oi: item.put_delta_oi,
        total_delta: item.total_delta,
        date: item.date || date,
        expiration: item.expiration,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: false,
      data: [],
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      error: 'Format de réponse inattendu',
    }
  }

  /**
   * Parse la réponse pour Spot Exposures
   */
  private parseSpotExposureResponse(
    response: any,
    ticker: string,
    date?: string
  ): GreeksResponse {
    let parsed: any = response
    if (typeof response === 'string') {
      try {
        parsed = JSON.parse(response)
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }

    // Format Unusual Whales avec wrapper
    if (parsed?.data && Array.isArray(parsed.data)) {
      const formattedData: SpotExposureData[] = parsed.data.map((item: any) => ({
        strike: typeof item.strike === 'string' ? parseFloat(item.strike) : item.strike || 0,
        gamma: item.gamma || 0,
        delta: item.delta,
        vega: item.vega,
        theta: item.theta,
        date: item.date || parsed.data_date || date,
        expiration: item.expiration,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        timestamp: parsed.cached_at || parsed.timestamp || new Date().toISOString(),
      }
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      const formattedData: SpotExposureData[] = parsed.map((item: any) => ({
        strike: typeof item.strike === 'string' ? parseFloat(item.strike) : item.strike || 0,
        gamma: item.gamma || 0,
        delta: item.delta,
        vega: item.vega,
        theta: item.theta,
        date: item.date || date,
        expiration: item.expiration,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: false,
      data: [],
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      error: 'Format de réponse inattendu',
    }
  }
}

// Export singleton
export const greeksClient = new GreeksClient()
export default greeksClient
