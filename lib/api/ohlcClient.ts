/**
 * Client API pour les données OHLC (Open, High, Low, Close)
 * Récupère les données de prix historiques pour un ticker
 * Endpoint: GET /unusual-whales/stock/{ticker}/ohlc/{candle_size}
 */

import { BaseApiClient, RequestOptions } from './baseClient'

export interface OHLCData {
  date: string
  time?: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface OHLCResponse {
  success: boolean
  data: OHLCData[]
  ticker: string
  candleSize: string
  timestamp: string
  error?: string
}

class OHLCClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données d'options (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère les données OHLC pour un ticker
   * @param ticker - Symbole du ticker (ex: MSFT, AAPL, NVDA)
   * @param candleSize - Taille de la bougie (ex: '1d', '1w', '1m')
   * @param limit - Nombre de bougies à récupérer (optionnel, défaut: 200)
   * @param options - Options de requête additionnelles
   * @returns Promise<OHLCResponse>
   */
  async getOHLC(
    ticker: string,
    candleSize: string = '1d',
    limit?: number,
    options?: RequestOptions
  ): Promise<OHLCResponse> {
    let endpoint = `/unusual-whales/stock/${ticker.toUpperCase()}/ohlc/${candleSize}`
    
    const params = new URLSearchParams()
    if (limit) {
      params.append('limit', limit.toString())
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      return this.parseOHLCResponse(response, ticker, candleSize)
    } catch (error: any) {
      console.error('Error fetching OHLC data:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        candleSize,
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement des données OHLC',
      }
    }
  }

  /**
   * Parse la réponse OHLC
   */
  private parseOHLCResponse(
    response: any,
    ticker: string,
    candleSize: string
  ): OHLCResponse {
    let parsed: any = response
    if (typeof response === 'string') {
      try {
        parsed = JSON.parse(response)
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }

    // Format Unusual Whales avec wrapper (data.data)
    if (parsed?.data?.data && Array.isArray(parsed.data.data)) {
      const formattedData: OHLCData[] = parsed.data.data.map((item: any) => ({
        date: item.date || item.time || '',
        time: item.time,
        open: parseFloat(item.open || item.o || '0'),
        high: parseFloat(item.high || item.h || '0'),
        low: parseFloat(item.low || item.l || '0'),
        close: parseFloat(item.close || item.c || '0'),
        volume: item.volume ? parseFloat(item.volume.toString()) : undefined,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        candleSize,
        timestamp: parsed.cached_at || parsed.timestamp || new Date().toISOString(),
      }
    }

    // Format direct (tableau sans wrapper)
    if (Array.isArray(parsed)) {
      const formattedData: OHLCData[] = parsed.map((item: any) => ({
        date: item.date || item.time || '',
        time: item.time,
        open: parseFloat(item.open || item.o || '0'),
        high: parseFloat(item.high || item.h || '0'),
        low: parseFloat(item.low || item.l || '0'),
        close: parseFloat(item.close || item.c || '0'),
        volume: item.volume ? parseFloat(item.volume.toString()) : undefined,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        candleSize,
        timestamp: new Date().toISOString(),
      }
    }

    // Format avec wrapper simple (parsed.data)
    if (parsed?.data && Array.isArray(parsed.data)) {
      const formattedData: OHLCData[] = parsed.data.map((item: any) => ({
        date: item.date || item.time || '',
        time: item.time,
        open: parseFloat(item.open || item.o || '0'),
        high: parseFloat(item.high || item.h || '0'),
        low: parseFloat(item.low || item.l || '0'),
        close: parseFloat(item.close || item.c || '0'),
        volume: item.volume ? parseFloat(item.volume.toString()) : undefined,
      }))

      return {
        success: true,
        data: formattedData,
        ticker: ticker.toUpperCase(),
        candleSize,
        timestamp: parsed.cached_at || parsed.timestamp || new Date().toISOString(),
      }
    }

    return {
      success: false,
      data: [],
      ticker: ticker.toUpperCase(),
      candleSize,
      timestamp: new Date().toISOString(),
      error: 'Format de réponse inattendu',
    }
  }
}

// Export singleton
export const ohlcClient = new OHLCClient()
export default ohlcClient
