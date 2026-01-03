/**
 * Client API pour le calendrier FDA (FDA Calendar)
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'

export interface FDACalendarEvent {
  drug: string
  time: string | null // Time string (e.g., "07:44:07")
  notes: string | null
  status: string
  ticker: string | null
  outcome: string | null
  catalyst: string | null
  end_date: string | null
  marketcap: string | null
  commentary: string | null
  created_at: string | null
  event_type: string | null
  indication: string | null
  nic_number: string | null
  start_date: string | null
  updated_at: string | null
  benzinga_id: string | null
  date_string: string // YYYY-MM-DD or MM/DD/YYYY
  description: string | null
  has_options: boolean | null
  source_link: string | null
  source_type: string | null
  target_date: string | null
  outcome_brief: string | null
  unique_identifier: string
}

export interface FDACalendarResponse {
  success: boolean
  data: {
    id: number
    cache_key: string
    data: FDACalendarEvent[]
    data_date: string | null
    cached_at: string
    expires_at: string
  }
  cached: boolean
  timestamp: string
  error?: string
}

class FDACalendarClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère le calendrier FDA
   * @param limit - Nombre maximum d'événements à retourner (défaut: 100, max: 200)
   * @param targetDateMin - Date minimale cible (format YYYY-MM-DD, YYYY-Q[1-4], YYYY-H[1-2], YYYY-MID, YYYY-LATE)
   * @param targetDateMax - Date maximale cible (format YYYY-MM-DD, YYYY-Q[1-4], YYYY-H[1-2], YYYY-MID, YYYY-LATE)
   * @param ticker - Filtrer par ticker (ex: "AAPL,INTC")
   * @param drug - Filtrer par nom de médicament (recherche partielle)
   * @param options - Options de requête additionnelles
   * @returns Promise<FDACalendarResponse>
   */
  async getFDACalendar(
    limit = 100,
    targetDateMin?: string,
    targetDateMax?: string,
    ticker?: string,
    drug?: string,
    options?: RequestOptions
  ): Promise<FDACalendarResponse> {
    const params = new URLSearchParams()
    params.append('limit', Math.min(limit, 200).toString()) // Max 200 selon la doc
    
    if (targetDateMin) params.append('target_date_min', targetDateMin)
    if (targetDateMax) params.append('target_date_max', targetDateMax)
    if (ticker) params.append('ticker', ticker)
    if (drug) params.append('drug', drug)

    const endpoint = `/unusual-whales/market/fda-calendar?${params.toString()}`

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response && typeof response.statusCode === 'number' && typeof response.body === 'string') {
        try {
          const parsed = JSON.parse(response.body)
          return parsed as FDACalendarResponse
        } catch (parseError) {
          console.error('Failed to parse Lambda response body for FDA Calendar:', parseError)
          throw new Error('Invalid API response format for FDA Calendar')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as FDACalendarResponse
    } catch (error: any) {
      console.error('Error fetching FDA calendar:', error)
      return {
        success: false,
        data: {
          id: 0,
          cache_key: '',
          data: [],
          data_date: null,
          cached_at: '',
          expires_at: '',
        },
        cached: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement du calendrier FDA',
      }
    }
  }
}

// Export singleton
export const fdaCalendarClient = new FDACalendarClient()
export default fdaCalendarClient

