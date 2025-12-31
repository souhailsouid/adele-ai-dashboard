import { BaseApiClient, RequestOptions } from './baseClient'
import type { InstitutionHoldingsResponse } from '@/types/institutionHoldings'

class InstitutionHoldingsClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  async getHoldings(
    cik: string,
    date?: string,
    limit = 100,
    order: 'units_change' | 'value' | 'units' = 'units_change',
    orderDirection: 'asc' | 'desc' = 'desc',
    options?: RequestOptions
  ): Promise<InstitutionHoldingsResponse> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    params.append('limit', limit.toString())
    params.append('order', order)
    params.append('order_direction', orderDirection)

    const endpoint = `/unusual-whales/institution/${cik}/holdings?${params.toString()}`

    let response = await this.get<InstitutionHoldingsResponse>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    // Si la réponse est une string JSON, la parser
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response) as InstitutionHoldingsResponse
      } catch (error) {
        throw new Error('Réponse API invalide : impossible de parser le JSON')
      }
    }

    return response
  }
}

export const institutionHoldingsClient = new InstitutionHoldingsClient()
export default institutionHoldingsClient


