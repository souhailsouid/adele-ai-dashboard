import { BaseApiClient, RequestOptions } from './baseClient'
import type { InstitutionActivityData } from '@/types/institutionActivity'

class InstitutionActivityClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2 || 'https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod')
  }

  async getActivity(
    cik: string,
    date?: string,
    limit = 100,
    options?: RequestOptions
  ): Promise<InstitutionActivityData> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    params.append('limit', limit.toString())

    const endpoint = `/unusual-whales/institution/${cik}/activity?${params.toString()}`

    const response = await this.get<InstitutionActivityData>(endpoint, {
      tokenType: 'access',
      ...options,
    })

    return response
  }
}

export const institutionActivityClient = new InstitutionActivityClient()
export default institutionActivityClient

