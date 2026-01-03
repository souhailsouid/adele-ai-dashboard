/**
 * Client API pour le calendrier économique (Economic Calendar)
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'

export interface EconomicCalendarEvent {
  prev: string | null
  time: string // ISO date string (e.g., "2026-02-17T23:00:00Z")
  type: string // e.g., "13F", "report", "FOMC"
  event: string // Event name (e.g., "13F Deadline", "Initial jobless claims")
  forecast: string | null
  reported_period: string | null
  country?: string
}

export interface EconomicCalendarResponse {
  success: boolean
  data:
    | EconomicCalendarEvent[] // Format direct array
    | {
        id: number
        cache_key: string
        data: EconomicCalendarEvent[]
        data_date: string | null
        cached_at: string
        expires_at: string
      } // Format avec objet data
  cached?: boolean
  count?: number
  timestamp: string
  error?: string
}

class EconomicCalendarClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère le calendrier économique pour une date donnée
   * @param date - Date au format YYYY-MM-DD (ex: "2026-01-05")
   * @param limit - Nombre maximum d'événements à retourner (défaut: 500)
   * @param options - Options de requête additionnelles
   * @returns Promise<EconomicCalendarResponse>
   */
  async getEconomicCalendar(
    date?: string,
    limit = 500,
    options?: RequestOptions
  ): Promise<EconomicCalendarResponse> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    params.append('limit', limit.toString())

    const endpoint = `/unusual-whales/market/economic-calendar?${params.toString()}`

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response && typeof response.statusCode === 'number' && typeof response.body === 'string') {
        try {
          const parsed = JSON.parse(response.body)
          return parsed as EconomicCalendarResponse
        } catch (parseError) {
          console.error('Failed to parse Lambda response body for Economic Calendar:', parseError)
          throw new Error('Invalid API response format for Economic Calendar')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as EconomicCalendarResponse
    } catch (error: any) {
      console.error('Error fetching economic calendar:', error)
      return {
        success: false,
        data: [] as EconomicCalendarEvent[],
        cached: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement du calendrier économique',
      }
    }
  }
}

// Export singleton
export const economicCalendarClient = new EconomicCalendarClient()
export default economicCalendarClient

