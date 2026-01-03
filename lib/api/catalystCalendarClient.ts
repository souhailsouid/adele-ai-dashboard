/**
 * Client API pour le service Catalyst Calendar
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { CatalystCalendarRequest, CatalystCalendarResponse } from '@/types/catalystCalendar'

class CatalystCalendarClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API de base
    super(process.env.NEXT_PUBLIC_API_URL)
  }

  /**
   * Récupère le calendrier de catalysts agrégé
   * @param params - Paramètres de la requête
   * @param options - Options de requête additionnelles
   * @returns Promise<CatalystCalendarResponse>
   */
  async getCatalystCalendar(
    params: CatalystCalendarRequest,
    options?: RequestOptions
  ): Promise<CatalystCalendarResponse> {
    const {
      startDate,
      endDate,
      watchlist = [],
    } = params

    // Construire les query params
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    })

    // Ajouter la watchlist si fournie
    if (watchlist.length > 0) {
      queryParams.append('watchlist', watchlist.join(','))
    }

    const endpoint = `/analyze/catalyst-calendar?${queryParams.toString()}`

    try {
      // La réponse peut être dans un format AWS Lambda avec statusCode et body (string JSON)
      const response = await this.post<any>(endpoint, {}, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response.statusCode && typeof response.body === 'string') {
        try {
          const parsedBody = JSON.parse(response.body) as CatalystCalendarResponse
          return parsedBody
        } catch (parseError) {
          console.error('Erreur lors du parsing du body:', parseError)
          throw new Error('Réponse invalide du serveur')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as CatalystCalendarResponse
    } catch (error: any) {
      // Si erreur, retourner une réponse avec success: false
      return {
        success: false,
        events: [],
        summary: {
          totalEvents: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          byType: {
            macro: 0,
            fundamental: 0,
            fda: 0,
            'whale-risk': 0,
            insider: 0,
            'dark-pool': 0,
          },
        },
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement du calendrier',
      }
    }
  }
}

// Export singleton
export const catalystCalendarClient = new CatalystCalendarClient()
export default catalystCalendarClient

