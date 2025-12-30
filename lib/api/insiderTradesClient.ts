/**
 * Client API pour les données d'insider trades
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { InsidersListResponse, InsiderTickerFlowResponse, Insider, InsiderTickerFlow, InsiderTransactionDetail, InsiderTransactionsResponse } from '@/types/insiderTrades'

class InsiderTradesClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API 2 pour les données insider trades (Unusual Whales)
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  /**
   * Récupère le flow agrégé des insider trades pour un ticker
   * @param ticker - Symbole du ticker (ex: TSLA, AAPL)
   * @param options - Options de requête additionnelles
   * @returns Promise<InsiderTickerFlow[]>
   */
  async getTickerFlow(
    ticker: string,
    options?: RequestOptions
  ): Promise<InsiderTickerFlow[]> {
    const endpoint = `/unusual-whales/insider/${ticker}/ticker-flow`

    const response = await this.get<InsiderTickerFlowResponse | string>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    // Si la réponse est une string (JSON non parsé), la parser
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
      return parsed.data as InsiderTickerFlow[]
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      return parsed as InsiderTickerFlow[]
    }

    return []
  }

  /**
   * Récupère la liste des insiders d'un ticker
   * @param ticker - Symbole du ticker (ex: TSLA, AAPL)
   * @param options - Options de requête additionnelles
   * @returns Promise<Insider[]>
   */
  async getInsiders(
    ticker: string,
    options?: RequestOptions
  ): Promise<Insider[]> {
    const endpoint = `/unusual-whales/insider/${ticker}`

    const response = await this.get<Insider[] | InsidersListResponse | string>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    // Si la réponse est une string (JSON non parsé), la parser
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
      return parsed.data as Insider[]
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      return parsed as Insider[]
    }

    return []
  }

  /**
   * Récupère les transactions détaillées d'insiders pour un ticker
   * @param ticker - Symbole du ticker (ex: TSLA, AAPL)
   * @param options - Options de requête additionnelles (peut inclure date pour filtrer)
   * @returns Promise<InsiderTransactionDetail[]>
   */
  async getTransactions(
    ticker: string,
    options?: RequestOptions & { date?: string }
  ): Promise<InsiderTransactionDetail[]> {
    let endpoint = `/unusual-whales/insider/transactions?ticker_symbol=${ticker}`
    
    // Ajouter le filtre de date si fourni
    if (options?.date) {
      endpoint += `&date=${options.date}`
    }

    const response = await this.get<InsiderTransactionsResponse | InsiderTransactionDetail[] | string>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    // Si la réponse est une string (JSON non parsé), la parser
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
      return parsed.data as InsiderTransactionDetail[]
    }

    // Si c'est un tableau directement
    if (Array.isArray(parsed)) {
      return parsed as InsiderTransactionDetail[]
    }

    return []
  }

}

// Export singleton
export const insiderTradesClient = new InsiderTradesClient()
export default insiderTradesClient

