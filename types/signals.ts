/**
 * Types TypeScript pour les signaux RSS avec données extraites
 */

export interface ExtractedData {
  actual?: number
  forecast?: number
  previous?: number
  dataType?: 'inflation' | 'gdp' | 'employment' | 'retail_sales' | 'industrial_production' | 'other'
  indicator?: string // 'CPI', 'GDP', 'NFP', etc.
  surprise?: 'positive' | 'negative' | 'neutral'
  surpriseMagnitude?: number // Différence en points de pourcentage
  unit?: 'percent' | 'absolute' | 'index'
  period?: 'monthly' | 'quarterly' | 'yearly'
  region?: 'US' | 'JP' | 'EU' | 'CN'
}

export interface Signal {
  id: string
  source: 'rss' | 'scrapecreators' | 'coinglass' | 'sec_8k' | 'sec_13f'
  type: string
  timestamp: string
  raw_data: {
    title: string
    description?: string
    url: string
    feed?: string
    guid?: string
    extracted_data?: ExtractedData
  }
  summary?: string
  importance_score?: number
  tags?: string[]
  impact?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

export interface SignalsParams {
  source?: 'rss' | 'scrapecreators' | 'coinglass' | 'sec_8k' | 'sec_13f'
  type?: string
  min_importance?: number
  limit?: number
  offset?: number
}

export interface SearchParams {
  query: string
  limit?: number
}

export interface SignalsResponse {
  success?: boolean
  data: Signal[]
  count?: number
  cached?: boolean
  timestamp?: string
}

