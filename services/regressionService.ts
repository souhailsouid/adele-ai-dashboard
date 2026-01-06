/**
 * Service pour calculer la régression linéaire et les écarts-types
 * Utilisé pour créer des canaux de régression linéaire sur les prix
 */

import ohlcClient, { type OHLCData } from '@/lib/api/ohlcClient'

export interface RegressionPoint {
  date: string
  price: number
  regression: number
  plus2Sigma: number
  plus1Sigma: number
  minus1Sigma: number
  minus2Sigma: number
}

export interface RegressionResult {
  slope: number // Pente de la régression
  intercept: number // Interception (b)
  rSquared: number // Coefficient de détermination
  standardDeviation: number // Écart-type
  data: RegressionPoint[]
}

export interface RegressionServiceResponse {
  success: boolean
  data: RegressionPoint[]
  regression: RegressionResult
  ticker: string
  timestamp: string
  error?: string
}

class RegressionService {
  // Cache simple pour éviter les appels API multiples
  private cache: Map<string, { data: RegressionPoint[]; regression: RegressionResult; timestamp: number; ticker: string }> = new Map()
  private readonly CACHE_DURATION = 300000 // 5 minutes en millisecondes

  /**
   * Génère une clé de cache unique
   */
  private getCacheKey(ticker: string, candleSize: string, limit?: number): string {
    return `${ticker.toUpperCase()}_${candleSize}_${limit || 'default'}`
  }

  /**
   * Vérifie si les données en cache sont encore valides
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.CACHE_DURATION
  }

  /**
   * Calcule la régression linéaire sur échelle logarithmique (log-regression)
   * Utilise log(price) pour le calcul, puis reconvertit en prix pour l'affichage
   * Cette méthode est recommandée pour les actions à forte croissance (ex: NVDA)
   */
  private calculateLinearRegression(
    data: { x: number; y: number }[]
  ): { slope: number; intercept: number; rSquared: number; standardDeviation: number } {
    const n = data.length
    if (n < 2) {
      return { slope: 0, intercept: 0, rSquared: 0, standardDeviation: 0 }
    }

    // Convertir les prix en logarithmes pour le calcul de régression
    const logData = data.map((p) => ({
      x: p.x,
      y: Math.log(Math.max(p.y, 0.01)), // Éviter log(0), utiliser 0.01 comme minimum
    }))

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0
    let sumYY = 0

    logData.forEach((p) => {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumXX += p.x * p.x
      sumYY += p.y * p.y
    })

    // Calcul de la pente (m) et de l'interception (b) sur l'échelle logarithmique
    const denominator = n * sumXX - sumX * sumX
    const logSlope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
    const logIntercept = (sumY - logSlope * sumX) / n

    // Calcul des valeurs prédites en log, puis conversion en prix
    let sumSquaredResiduals = 0
    let sumSquaredTotal = 0
    const meanLogY = sumY / n

    data.forEach((p, index) => {
      // Prédiction en échelle logarithmique
      const predictedLog = logSlope * index + logIntercept
      // Conversion en prix
      const predicted = Math.exp(predictedLog)
      // Résidu en échelle logarithmique (pour le calcul de R²)
      const logY = Math.log(Math.max(p.y, 0.01))
      const residualLog = logY - predictedLog
      sumSquaredResiduals += residualLog * residualLog
      sumSquaredTotal += (logY - meanLogY) * (logY - meanLogY)
    })

    // R² (coefficient de détermination) sur l'échelle logarithmique
    const rSquared = sumSquaredTotal !== 0 ? 1 - sumSquaredResiduals / sumSquaredTotal : 0

    // Écart-type des résidus en échelle logarithmique
    const logStandardDeviation = Math.sqrt(sumSquaredResiduals / (n - 2))

    // Pour l'affichage, on doit convertir les paramètres pour travailler avec les prix réels
    // La pente et l'interception sont en échelle log, mais on les utilisera avec exp() pour les prix
    return {
      slope: logSlope, // Pente en échelle log
      intercept: logIntercept, // Interception en échelle log
      rSquared,
      standardDeviation: logStandardDeviation, // Écart-type en échelle log
    }
  }

  /**
   * Récupère les données OHLC et calcule la régression linéaire
   * @param ticker - Symbole du ticker
   * @param candleSize - Taille de la bougie (ex: '1d', '1w', '1m')
   * @param limit - Nombre de bougies à récupérer (défaut: 200)
   * @returns Promise<RegressionServiceResponse>
   */
  async getRegressionData(
    ticker: string,
    candleSize: string = '1d',
    limit: number = 200
  ): Promise<RegressionServiceResponse> {
    const cacheKey = this.getCacheKey(ticker, candleSize, limit)

    // Vérifier le cache d'abord
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return {
        success: true,
        data: cached.data,
        regression: cached.regression,
        ticker: cached.ticker,
        timestamp: new Date(cached.timestamp).toISOString(),
      }
    }

    try {
      // Récupérer les données OHLC
      const ohlcResponse = await ohlcClient.getOHLC(ticker, candleSize, limit)

      if (!ohlcResponse.success || !ohlcResponse.data || ohlcResponse.data.length === 0) {
        return {
          success: false,
          data: [],
          regression: { slope: 0, intercept: 0, rSquared: 0, standardDeviation: 0, data: [] },
          ticker: ticker.toUpperCase(),
          timestamp: ohlcResponse.timestamp,
          error: ohlcResponse.error || 'Aucune donnée disponible',
        }
      }

      // Préparer les données pour la régression (x = index, y = prix de clôture)
      const regressionData: { x: number; y: number }[] = ohlcResponse.data.map((item, index) => ({
        x: index,
        y: item.close,
      }))

      // Calculer la régression linéaire
      const regression = this.calculateLinearRegression(regressionData)

      // Générer les points de régression avec les écarts-types
      // Conversion depuis l'échelle logarithmique vers les prix réels
      const regressionPoints: RegressionPoint[] = ohlcResponse.data.map((item, index) => {
        // Prédiction en échelle logarithmique
        const predictedLog = regression.slope * index + regression.intercept
        // Conversion en prix réel
        const predicted = Math.exp(predictedLog)
        
        // Calcul des écarts-types en échelle logarithmique, puis conversion en prix
        const plus2SigmaLog = predictedLog + 2 * regression.standardDeviation
        const plus1SigmaLog = predictedLog + regression.standardDeviation
        const minus1SigmaLog = predictedLog - regression.standardDeviation
        const minus2SigmaLog = predictedLog - 2 * regression.standardDeviation
        
        return {
          date: item.date,
          price: item.close,
          regression: predicted,
          plus2Sigma: Math.exp(plus2SigmaLog),
          plus1Sigma: Math.exp(plus1SigmaLog),
          minus1Sigma: Math.exp(minus1SigmaLog),
          minus2Sigma: Math.exp(minus2SigmaLog),
        }
      })

      const result: RegressionResult = {
        ...regression,
        data: regressionPoints,
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: regressionPoints,
        regression: result,
        timestamp: Date.now(),
        ticker: ticker.toUpperCase(),
      })

      return {
        success: true,
        data: regressionPoints,
        regression: result,
        ticker: ticker.toUpperCase(),
        timestamp: ohlcResponse.timestamp,
      }
    } catch (error: any) {
      console.error('Error in regressionService:', error)
      return {
        success: false,
        data: [],
        regression: { slope: 0, intercept: 0, rSquared: 0, standardDeviation: 0, data: [] },
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du calcul de la régression',
      }
    }
  }

  /**
   * Extrapole la régression dans le futur pour la projection
   * @param regression - Résultat de la régression
   * @param currentDataLength - Nombre de points de données actuels
   * @param projectionDays - Nombre de jours à projeter dans le futur
   * @returns RegressionPoint[]
   */
  extrapolateProjection(
    regression: RegressionResult,
    currentDataLength: number,
    projectionDays: number = 365
  ): RegressionPoint[] {
    const projection: RegressionPoint[] = []
    const startDate = new Date(regression.data[regression.data.length - 1]?.date || new Date())
    
    for (let i = 1; i <= projectionDays; i++) {
      const futureIndex = currentDataLength + i - 1
      // Prédiction en échelle logarithmique
      const predictedLog = regression.slope * futureIndex + regression.intercept
      // Conversion en prix réel
      const predicted = Math.exp(predictedLog)
      
      // Calcul des écarts-types en échelle logarithmique, puis conversion en prix
      const plus2SigmaLog = predictedLog + 2 * regression.standardDeviation
      const plus1SigmaLog = predictedLog + regression.standardDeviation
      const minus1SigmaLog = predictedLog - regression.standardDeviation
      const minus2SigmaLog = predictedLog - 2 * regression.standardDeviation
      
      const futureDate = new Date(startDate)
      futureDate.setDate(futureDate.getDate() + i)
      
      projection.push({
        date: futureDate.toISOString().split('T')[0],
        price: predicted, // Prix projeté (même que régression)
        regression: predicted,
        plus2Sigma: Math.exp(plus2SigmaLog),
        plus1Sigma: Math.exp(plus1SigmaLog),
        minus1Sigma: Math.exp(minus1SigmaLog),
        minus2Sigma: Math.exp(minus2SigmaLog),
      })
    }
    
    return projection
  }
}

// Export singleton
export const regressionService = new RegressionService()
export default regressionService
