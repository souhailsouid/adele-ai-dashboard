/**
 * Client API pour les données de chaîne d'options (Options Chain)
 * Récupère l'Open Interest par strike pour un ticker donné
 */

import { BaseApiClient, RequestOptions } from './baseClient'

export interface OptionsChainData {
  strike: number
  call_oi: number
  put_oi: number
  call_volume?: number
  put_volume?: number
  call_iv?: number
  put_iv?: number
  date?: string
}

export interface OptionsChainResponse {
  success: boolean
  data: OptionsChainData[]
  ticker: string
  date?: string
  timestamp: string
  error?: string
}

class OptionsChainClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données d'options (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère la chaîne d'options avec Open Interest pour un ticker
   * @param ticker - Symbole du ticker (ex: MSFT, AAPL)
   * @param date - Date au format YYYY-MM-DD (optionnel)
   * @param options - Options de requête additionnelles
   * @returns Promise<OptionsChainResponse>
   */
  async getOptionsChain(
    ticker: string,
    date?: string,
    options?: RequestOptions
  ): Promise<OptionsChainResponse> {
    let endpoint = `/unusual-whales/stock/${ticker.toUpperCase()}/oi-per-strike`
    
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

      // Gérer différents formats de réponse
      let parsed: any = response
      if (typeof response === 'string') {
        try {
          parsed = JSON.parse(response)
        } catch (error) {
          throw new Error('Réponse API invalide : impossible de parser le JSON')
        }
      }

      // Si c'est un objet avec une propriété data
      if (parsed?.success && Array.isArray(parsed.data)) {
        return {
          success: true,
          data: parsed.data,
          ticker: ticker.toUpperCase(),
          date: parsed.date,
          timestamp: parsed.timestamp || new Date().toISOString(),
        }
      }

      // Si c'est un tableau directement
      if (Array.isArray(parsed)) {
        return {
          success: true,
          data: parsed,
          ticker: ticker.toUpperCase(),
          timestamp: new Date().toISOString(),
        }
      }

      // Format avec wrapper
      if (parsed?.data && Array.isArray(parsed.data)) {
        return {
          success: true,
          data: parsed.data,
          ticker: ticker.toUpperCase(),
          date: parsed.date,
          timestamp: parsed.timestamp || new Date().toISOString(),
        }
      }

      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: 'Format de réponse inattendu',
      }
    } catch (error: any) {
      console.error('Error fetching options chain:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement de la chaîne d\'options',
      }
    }
  }
}

// Export singleton
export const optionsChainClient = new OptionsChainClient()
export default optionsChainClient
