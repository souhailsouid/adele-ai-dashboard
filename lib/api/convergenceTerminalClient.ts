/**
 * Client API pour le Convergence Terminal
 * Affiche les événements de convergence (FDA, Macro, Earnings, Whale Risk)
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type {
  ConvergenceTerminalResponse,
  ConvergenceTerminalParams,
} from '@/types/convergenceTerminal'

class ConvergenceTerminalClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL)
  }

  /**
   * Récupère les événements de convergence pour une période donnée
   * @param params - Paramètres de la requête (dates, watchlist, debug)
   * @param options - Options de requête additionnelles
   * @returns Promise<ConvergenceTerminalResponse>
   */
  async getConvergenceEvents(
    params: ConvergenceTerminalParams,
    options?: RequestOptions
  ): Promise<ConvergenceTerminalResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('startDate', params.startDate)
    queryParams.append('endDate', params.endDate)
    
    if (params.watchlist && params.watchlist.length > 0) {
      queryParams.append('watchlist', params.watchlist.join(','))
    }
    
    if (params.debug) {
      queryParams.append('debug', 'true')
    }

    const endpoint = `/analyze/catalyst-calendar?${queryParams.toString()}`

    try {
      const response = await this.post<any>(endpoint, {}, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response && typeof response.statusCode === 'number' && typeof response.body === 'string') {
        try {
          const parsed = JSON.parse(response.body)
          return parsed as ConvergenceTerminalResponse
        } catch (parseError) {
          console.error('Failed to parse Lambda response body for Convergence Terminal:', parseError)
          throw new Error('Invalid API response format for Convergence Terminal')
        }
      }

      // Sinon, la réponse est déjà au bon format
      return response as ConvergenceTerminalResponse
    } catch (error: any) {
      console.error('Error fetching convergence events:', error)
      return {
        success: false,
        events: [],
        summary: {
          total: 0,
          byType: {
            MACRO: 0,
            FDA: 0,
            EARNINGS: 0,
            WHALE_RISK: 0,
          },
          byImpact: {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
          },
          criticalEvents: [],
        },
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// Export singleton
export const convergenceTerminalClient = new ConvergenceTerminalClient()
export default convergenceTerminalClient

