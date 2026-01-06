/**
 * Client API pour les données d'Open Interest par strike
 * Récupère l'Open Interest total pour les Calls et les Puts pour chaque strike du ticker
 * Endpoint: GET /unusual-whales/stock/{ticker}/oi-per-strike
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
   * Récupère l'Open Interest par strike pour un ticker
   * @param ticker - Symbole du ticker (ex: MSFT, AAPL)
   * @param date - Date au format YYYY-MM-DD pour récupérer les données historiques (optionnel)
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

      // Format Unusual Whales avec wrapper (id, cache_key, data, data_date, cached_at, etc.)
      if (parsed?.data && Array.isArray(parsed.data)) {
        // Convertir les strikes de string à number et mapper les champs
        const formattedData = parsed.data.map((item: any) => ({
          strike: typeof item.strike === 'string' ? parseFloat(item.strike) : item.strike,
          call_oi: item.call_oi || 0,
          put_oi: item.put_oi || 0,
          call_volume: item.call_volume,
          put_volume: item.put_volume,
          call_iv: item.call_iv,
          put_iv: item.put_iv,
          date: item.date || parsed.data_date || date,
        }))

        return {
          success: true,
          data: formattedData,
          ticker: ticker.toUpperCase(),
          date: parsed.data_date || date,
          timestamp: parsed.cached_at || new Date().toISOString(),
        }
      }

      // Si c'est un objet avec une propriété data et success
      if (parsed?.success && Array.isArray(parsed.data)) {
        return {
          success: true,
          data: parsed.data,
          ticker: ticker.toUpperCase(),
          date: parsed.date || date,
          timestamp: parsed.timestamp || new Date().toISOString(),
        }
      }

      // Si c'est un tableau directement
      if (Array.isArray(parsed)) {
        return {
          success: true,
          data: parsed,
          ticker: ticker.toUpperCase(),
          date: date,
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
    } catch (error: any) {
      console.error('Error fetching options chain:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement de l\'Open Interest par strike',
      }
    }
  }
}

// Export singleton
export const optionsChainClient = new OptionsChainClient()
export default optionsChainClient
