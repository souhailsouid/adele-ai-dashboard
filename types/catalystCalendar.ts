/**
 * Types TypeScript pour le service Catalyst Calendar
 */

export type CatalystImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type CatalystType = 'macro' | 'fundamental' | 'fda' | 'whale-risk' | 'insider' | 'dark-pool'

export interface CatalystEvent {
  id: string
  date: string // ISO date string
  time?: string // Optional time (e.g., "09:30" for premarket)
  type: CatalystType
  impact: CatalystImpact
  title: string
  description: string
  ticker?: string // For earnings, whale-risk, etc.
  
  // Type-specific data
  macro?: {
    event: string // e.g., "CPI Data", "FOMC"
    country?: string
    previous?: number
    forecast?: number
  }
  
  earnings?: {
    period: string // e.g., "Q4 2025"
    reportTime: 'premarket' | 'afterhours' | 'unknown'
    hubScore?: 'A' | 'B' | 'C' | 'D' | 'F'
    epsEstimate?: number
  }
  
  fda?: {
    drugName?: string
    indication?: string
    decisionType: 'PDUFA' | 'Advisory Committee' | 'Clinical Trial'
  }
  
  whaleRisk?: {
    currentPrice: number
    whaleSupport: number
    priceDistanceFromSupport: number
    liquidationRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  
  // Metadata
  source: 'unusual-whales' | 'calculated'
  metadata?: Record<string, any>
}

export interface CatalystCalendarRequest {
  startDate: string // ISO date string
  endDate: string // ISO date string
  watchlist?: string[] // Optional list of tickers to monitor
}

export interface CatalystCalendarResponse {
  success: boolean
  events: CatalystEvent[]
  summary: {
    totalEvents: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    byType: Record<CatalystType, number>
  }
  timestamp: string
  error?: string
}

