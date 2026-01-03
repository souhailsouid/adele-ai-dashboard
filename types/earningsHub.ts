/**
 * Types TypeScript pour le service Earnings Hub
 */

export interface EarningsStats {
  marketCap: string // Ex: "40.1B" ou "2.5M"
  peRatio: number | null // Ratio P/E (peut être null si non disponible)
  currentPrice: number // Prix actuel du stock
  epsBeatsCount: number // Nombre total de beats d'EPS
  totalQuarters: number // Nombre total de trimestres analysés
  epsBeatRate: number // Taux de beat en % (ex: 58.8)
  avgEpsSurprise: number // Surprise moyenne d'EPS en %
}

export interface EarningsQuarter {
  period: string // Ex: "Q4 2025"
  reportDate: string // Date ISO: "2025-12-19"
  reportTime: 'premarket' | 'postmarket' | 'unknown'
  epsActual: number // EPS réel publié
  epsEstimate: number // EPS estimé par les analystes
  epsSurprise: number // Surprise en % (positif = beat, négatif = miss)
  epsBeat: boolean // true si beat, false si miss
  priceMove1d: number | null // Mouvement prix 1 jour après (%)
  priceMove1w: number | null // Mouvement prix 1 semaine après (%)
}

export interface EarningsTrend {
  label: string
  direction: 'improving' | 'deteriorating' | 'stable'
  evidence: string
}

export interface EarningsInterpretation {
  summary: string
  keyPoints: string[]
  trends: EarningsTrend[]
}

export interface EarningsHubAnalysis {
  ticker: string
  hubScore: 'A' | 'B' | 'C' | 'D' | 'F'
  stats: EarningsStats
  latestQuarter: EarningsQuarter | null
  history: EarningsQuarter[]
  insights: string[]
  interpretation: EarningsInterpretation
}

export interface EarningsHubRequest {
  ticker: string
  quartersLimit?: number // Défaut: 16
}

export interface EarningsHubResponse {
  success: boolean
  analysis: EarningsHubAnalysis
  timestamp: string
  error?: string
}

