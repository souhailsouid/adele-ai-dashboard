export interface NewsHeadline {
  id?: string
  title: string
  description?: string
  url?: string
  source: string
  published_at: string
  ticker?: string | null
  tickers?: string[] // Array de tickers depuis l'API
  is_major: boolean
  sentiment?: 'positive' | 'negative' | 'neutral' | null
  category?: string | null
  meta?: any
  tags?: string[]
  created_at?: string // Format de l'API
}

export interface NewsHeadlinesResponse {
  success: boolean
  data: NewsHeadline[]
  total?: number
  limit?: number
  cached?: boolean
  timestamp: string
  error?: string
}

export interface NewsHeadlinesParams {
  limit?: number
  ticker?: string
  search_term?: string
  major_only?: boolean
  source?: string
}

