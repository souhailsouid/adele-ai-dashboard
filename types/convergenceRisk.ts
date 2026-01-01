/**
 * Types TypeScript pour le service Convergence et Risque de Liquidation
 */

export interface WhaleAnalysisRequest {
  ticker: string
  darkPoolLimit?: number
  optionsLimit?: number
  minPremium?: number
  expiryFilter?: string // "YYYY-MM-DD", "tomorrow", "next_week"
  liquidationThreshold?: number // Défaut: 0.005 = 0.5%
}

export interface Scenario {
  label: string
  probability: 'low' | 'medium' | 'high'
  conditions: string
}

export interface Interpretation {
  summary: string
  keyPoints: string[]
  scenarios: Scenario[]
  recommendation: 'monitor' | 'alert' | 'action'
}

export interface WhaleAnalysis {
  ticker: string
  currentPrice: number
  whaleSupport: number // Support Dark Pool pondéré par volume
  targetStrike: number // Objectif d'expiration (moyenne des strikes pondérée par premium)
  liquidationRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  isWhaleInProfit: boolean // true si currentPrice > whaleSupport
  priceDistanceFromSupport: number | null // Distance en % du prix actuel au support (+ = au-dessus)
  priceDistanceFromTarget: number | null // Distance en % du prix actuel à l'objectif (+ = au-dessus)
  interpretation?: Interpretation // Analyse interprétée (optionnel pour compatibilité)
}

export interface WhaleAnalysisResponse {
  success: boolean
  analysis: WhaleAnalysis
  timestamp: string
  error?: string
}

