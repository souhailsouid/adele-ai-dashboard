export type ConvergenceEventType = 'WHALE_RISK' | 'FDA' | 'MACRO' | 'EARNINGS'
export type ConvergenceImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ConvergenceEvent {
  id: string
  type: ConvergenceEventType
  date: string
  title: string
  description: string
  ticker: string | null
  impact: ConvergenceImpact
  icon: string
  metadata: {
    // WHALE_RISK metadata
    priceDistanceFromSupport?: number
    liquidationRisk?: string
    whaleSupport?: number
    currentPrice?: number
    // FDA metadata
    fdaDate?: string
    decisionType?: string
    drug?: string
    indication?: string
    // MACRO metadata
    country?: string
    currency?: string
    // EARNINGS metadata (à définir si nécessaire)
    [key: string]: any
  }
}

export interface ConvergenceTerminalSummary {
  total: number
  byType: {
    MACRO: number
    FDA: number
    EARNINGS: number
    WHALE_RISK: number
  }
  byImpact: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  criticalEvents: ConvergenceEvent[]
}

export interface ConvergenceTerminalResponse {
  success: boolean
  events: ConvergenceEvent[]
  summary: ConvergenceTerminalSummary
  timestamp: string
  debug?: {
    apiResponses?: any
    filtering?: any
  }
}

export interface ConvergenceTerminalParams {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  watchlist?: string[] // Array of tickers
  debug?: boolean
}

