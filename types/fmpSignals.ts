/**
 * Types pour les signaux FMP (Financial Modeling Prep)
 */

export interface FMPSignal {
  id: string
  ticker: string
  type: 'bullish' | 'bearish'
  severity: 'low' | 'medium' | 'high'
  signals: string[]
  message: string
  timestamp: string
  source: 'fmp'
  details?: {
    grades?: {
      upgrade?: number
      downgrade?: number
      maintain?: number
    }
    consensus?: string
    priceTarget?: {
      current: number
      consensus: number
      upside?: number
    }
    insiderTrading?: {
      buys?: number
      sells?: number
      net?: number
    }
  }
}

export interface CompanyProfile {
  companyName: string
  sector: string
  industry: string
}

export interface CompanyQuote {
  price: number
  marketCap: number
  volume: number
}

export interface CompanyKeyMetrics {
  peRatio?: number
  pbRatio?: number
}

export interface CompanyEarnings {
  date?: string
  eps?: number
  revenue?: number
}

export interface CompanyInfo {
  profile: CompanyProfile
  quote: CompanyQuote
  keyMetrics?: CompanyKeyMetrics
  earnings?: CompanyEarnings
}

export interface MarketSignalResponse {
  ticker: string
  hasAlert: boolean
  alert?: FMPSignal
  message?: string
  company?: CompanyInfo
}

export interface FMPGradesResponse {
  symbol: string
  date: string
  gradingCompany: string
  previousGrade: string
  newGrade: string
  action: 'upgrade' | 'downgrade' | 'maintain'
}

export interface FMPGradesHistoricalResponse {
  success: boolean
  data: Array<{
    symbol: string
    date: string
    analystRatingsStrongBuy: number
    analystRatingsBuy: number
    analystRatingsHold: number
    analystRatingsSell: number
    analystRatingsStrongSell: number
  }>
  cached: boolean
  count: number
  timestamp: string
}

export interface FMPConsensusResponse {
  success: boolean
  data: Array<{
    symbol: string
    strongBuy: number
    buy: number
    hold: number
    sell: number
    strongSell: number
    consensus: string
  }>
  cached: boolean
  count: number
  timestamp: string
}

export interface FMPPriceTargetResponse {
  success: boolean
  data: Array<{
    symbol: string
    targetHigh: number
    targetLow: number
    targetConsensus: number
    targetMedian: number
  }>
  cached: boolean
  count: number
  timestamp: string
}

export interface FMPInsiderTradingResponse {
  symbol: string
  filingDate: string
  transactionDate: string
  transactionType: string
  acquisitionOrDisposition: 'A' | 'D'
  securitiesTransacted: number
  price: number
  reportingName: string
  typeOfOwner: string
}

