/**
 * Client API pour les news headlines (Unusual Whales)
 */

import { BaseApiClient, RequestOptions } from './baseClient'
import type { NewsHeadlinesResponse, NewsHeadlinesParams } from '@/types/newsHeadlines'

class NewsHeadlinesClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  /**
   * Récupère les news headlines
   * @param params - Paramètres de filtrage
   * @param options - Options de requête additionnelles
   * @returns Promise<NewsHeadlinesResponse>
   */
  async getHeadlines(
    params?: NewsHeadlinesParams,
    options?: RequestOptions
  ): Promise<NewsHeadlinesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.ticker) queryParams.append('ticker', params.ticker)
    if (params?.search_term) queryParams.append('search_term', params.search_term)
    if (params?.major_only) queryParams.append('major_only', 'true')
    if (params?.source) queryParams.append('source', params.source)

    const endpoint = `/unusual-whales/news/headlines?${queryParams.toString()}`

    try {
      const response = await this.get<any>(endpoint, {
        tokenType: 'access',
        ...options,
      })

      // Si la réponse est dans le format AWS Lambda (statusCode + body string)
      if (response && typeof response.statusCode === 'number' && typeof response.body === 'string') {
        try {
          const parsed = JSON.parse(response.body)
          // Gérer la structure imbriquée data.data
          let headlinesArray: any[] = []
          
          if (parsed.data) {
            // Si data.data existe (structure imbriquée)
            if (parsed.data.data && Array.isArray(parsed.data.data)) {
              headlinesArray = parsed.data.data
            }
            // Sinon si data est directement un tableau
            else if (Array.isArray(parsed.data)) {
              headlinesArray = parsed.data
            }
          }
          
          // Mapper les champs de l'API vers notre interface
          const mappedHeadlines = headlinesArray.map((item, idx) => ({
            id: item.id || `headline-${idx}`,
            title: item.headline || item.title || '',
            description: item.description || undefined,
            url: item.url || undefined,
            source: item.source || '',
            published_at: item.created_at || item.published_at || new Date().toISOString(),
            ticker: item.tickers && item.tickers.length > 0 ? item.tickers[0] : (item.ticker || null),
            tickers: item.tickers || [],
            is_major: item.is_major || false,
            sentiment: item.sentiment || null,
            category: item.category || null,
            meta: item.meta,
            tags: item.tags || [],
            created_at: item.created_at,
          }))
          
          return {
            success: true,
            data: mappedHeadlines,
            total: mappedHeadlines.length,
            limit: params?.limit || 100,
            cached: parsed.cached || false,
            timestamp: parsed.timestamp || new Date().toISOString(),
          }
        } catch (parseError) {
          console.error('Failed to parse Lambda response body for News Headlines:', parseError)
          throw new Error('Invalid API response format for News Headlines')
        }
      }

      // Si la réponse est directement un tableau
      if (Array.isArray(response)) {
        const mappedHeadlines = response.map((item, idx) => ({
          id: item.id || `headline-${idx}`,
          title: item.headline || item.title || '',
          description: item.description || undefined,
          url: item.url || undefined,
          source: item.source || '',
          published_at: item.created_at || item.published_at || new Date().toISOString(),
          ticker: item.tickers && item.tickers.length > 0 ? item.tickers[0] : (item.ticker || null),
          tickers: item.tickers || [],
          is_major: item.is_major || false,
          sentiment: item.sentiment || null,
          category: item.category || null,
          meta: item.meta,
          tags: item.tags || [],
          created_at: item.created_at,
        }))
        
        return {
          success: true,
          data: mappedHeadlines,
          total: mappedHeadlines.length,
          limit: params?.limit || 100,
          cached: false,
          timestamp: new Date().toISOString(),
        }
      }

      // Si la réponse a une structure data.data (structure imbriquée)
      if (response.data) {
        let headlinesArray: any[] = []
        
        // Vérifier si c'est data.data (structure imbriquée)
        if (response.data.data && Array.isArray(response.data.data)) {
          headlinesArray = response.data.data
        }
        // Sinon si data est directement un tableau
        else if (Array.isArray(response.data)) {
          headlinesArray = response.data
        }
        
        // Mapper les champs
        const mappedHeadlines = headlinesArray.map((item, idx) => ({
          id: item.id || `headline-${idx}`,
          title: item.headline || item.title || '',
          description: item.description || undefined,
          url: item.url || undefined,
          source: item.source || '',
          published_at: item.created_at || item.published_at || new Date().toISOString(),
          ticker: item.tickers && item.tickers.length > 0 ? item.tickers[0] : (item.ticker || null),
          tickers: item.tickers || [],
          is_major: item.is_major || false,
          sentiment: item.sentiment || null,
          category: item.category || null,
          meta: item.meta,
          tags: item.tags || [],
          created_at: item.created_at,
        }))
        
        return {
          success: true,
          data: mappedHeadlines,
          total: mappedHeadlines.length,
          limit: response.limit || params?.limit || 100,
          cached: response.cached || false,
          timestamp: response.timestamp || new Date().toISOString(),
        }
      }

      return response as NewsHeadlinesResponse
    } catch (error: any) {
      console.error('Error fetching news headlines:', error)
      return {
        success: false,
        data: [],
        total: 0,
        limit: params?.limit || 100,
        cached: false,
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement des headlines',
      }
    }
  }
}

// Export singleton
export const newsHeadlinesClient = new NewsHeadlinesClient()

