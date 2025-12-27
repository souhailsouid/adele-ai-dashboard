/**
 * Client API pour les Signaux RSS
 * Étend BaseApiClient pour bénéficier de l'authentification automatique
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { Signal, SignalsParams, SignalsResponse, SearchParams } from '@/types/signals'

class SignalsClient extends BaseApiClient {
  constructor() {
    // Utilise l'URL API de base pour les signaux
    super(process.env.NEXT_PUBLIC_API_URL || 'https://tsdd1sibd1.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère les signaux depuis l'API
   * @param params - Paramètres de filtrage
   * @returns Promise<SignalsResponse>
   */
  async getSignals(params?: SignalsParams): Promise<SignalsResponse> {
    // Construction des paramètres de requête
    const queryParams = new URLSearchParams()
    
    if (params?.source) {
      queryParams.append('source', params.source)
    }
    if (params?.type && params.type.trim() !== '') {
      queryParams.append('type', params.type)
    }
    if (params?.min_importance !== undefined && params.min_importance !== null) {
      queryParams.append('min_importance', params.min_importance.toString())
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString())
    }

    const endpoint = `/signals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    let response = await this.get<SignalsResponse | Signal[] | string>(endpoint, {
      tokenType: 'access',
    })

    // Normaliser la réponse : gérer le cas où c'est une string (double encoding)
    let normalizedData: Signal[] = []
    
    // Si la réponse est une string, la parser en JSON
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response) as Signal[] | SignalsResponse
        if (Array.isArray(parsed)) {
          normalizedData = parsed
        } else if (parsed && typeof parsed === 'object' && 'data' in parsed) {
          normalizedData = (parsed as SignalsResponse).data || []
        }
      } catch (e) {
        throw new Error('Failed to parse API response')
      }
    }
    // Si c'est déjà un tableau
    else if (Array.isArray(response)) {
      normalizedData = response
    } 
    // Si c'est un objet avec une propriété data
    else if (response && typeof response === 'object' && 'data' in response) {
      normalizedData = (response as SignalsResponse).data || []
    }
    
    // Normaliser les données : déplacer extracted_data dans raw_data si nécessaire
    const normalizedSignals: Signal[] = normalizedData.map((signal: any) => {
      // Assurer que raw_data existe toujours
      const rawData = signal.raw_data || {}
      // Si extracted_data est au niveau racine (même si null), s'assurer qu'il est dans raw_data
      const extractedData = signal.extracted_data ?? rawData.extracted_data
      
      return {
        ...signal,
        raw_data: {
          ...rawData,
          extracted_data: extractedData,
        },
      } as Signal
    })

    return {
      success: true,
      data: normalizedSignals,
      count: normalizedSignals.length,
      cached: false,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Recherche des signaux par mot-clé
   * @param params - Paramètres de recherche
   * @returns Promise<Signal[]>
   */
  async searchSignals(params: SearchParams): Promise<Signal[]> {
    const endpoint = '/search'

    const response = await this.post<SignalsResponse | Signal[]>(
      endpoint,
      {
        query: params.query,
        limit: params.limit || 20,
      },
      {
        tokenType: 'access',
      }
    )

    // Normaliser la réponse
    let normalizedData: Signal[] = []
    
    if (Array.isArray(response)) {
      normalizedData = response
    } else if (response && typeof response === 'object' && 'data' in response) {
      normalizedData = response.data || []
    }

    // Normaliser les données : déplacer extracted_data dans raw_data si nécessaire
    return normalizedData.map((signal: any) => {
      // Si extracted_data est au niveau racine, le déplacer dans raw_data
      if (signal.extracted_data && !signal.raw_data?.extracted_data) {
        return {
          ...signal,
          raw_data: {
            ...signal.raw_data,
            extracted_data: signal.extracted_data,
          },
        }
      }
      return signal
    })
  }
}

// Export singleton
export const signalsClient = new SignalsClient()
export default signalsClient

