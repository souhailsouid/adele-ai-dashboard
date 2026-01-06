/**
 * Service pour formater et traiter les données de Greeks
 * Utilisé pour préparer les données avant l'affichage dans les graphiques
 */

import greeksClient, { type GreekExposureData, type SpotExposureData } from '@/lib/api/greeksClient'

export interface FormattedGreekData {
  strike: string
  gamma: number
  delta?: number
  vega?: number
  theta?: number
  color: string // Couleur basée sur le signe du gamma
}

export interface GreeksServiceResponse {
  success: boolean
  data: FormattedGreekData[]
  ticker: string
  timestamp: string
  error?: string
}

class GreeksService {
  // Cache simple pour éviter les appels API multiples
  private cache: Map<string, { data: FormattedGreekData[]; timestamp: number; ticker: string }> = new Map()
  private readonly CACHE_DURATION = 60000 // 1 minute en millisecondes

  /**
   * Génère une clé de cache unique pour un ticker et une date
   */
  private getCacheKey(ticker: string, date?: string, useSpot: boolean = false): string {
    return `${ticker.toUpperCase()}_${date || 'latest'}_${useSpot ? 'spot' : 'exposure'}`
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
   * Récupère et formate les données de Greeks pour un ticker
   * @param ticker - Symbole du ticker
   * @param date - Date au format YYYY-MM-DD pour récupérer les données historiques (optionnel)
   * @param useSpotExposures - Utiliser les expositions spot (temps réel) au lieu de l'exposition par OI
   * @returns Promise<GreeksServiceResponse>
   */
  async getGreeksData(
    ticker: string,
    date?: string,
    useSpotExposures: boolean = true
  ): Promise<GreeksServiceResponse> {
    const cacheKey = this.getCacheKey(ticker, date, useSpotExposures)

    // Vérifier le cache d'abord
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return {
        success: true,
        data: cached.data,
        ticker: cached.ticker,
        timestamp: new Date(cached.timestamp).toISOString(),
      }
    }

    try {
      const response = useSpotExposures
        ? await greeksClient.getSpotExposuresByStrike(ticker, date)
        : await greeksClient.getGreekExposureByStrike(ticker, date)

      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          data: [],
          ticker: ticker.toUpperCase(),
          timestamp: response.timestamp,
          error: response.error || 'Aucune donnée disponible',
        }
      }

      // Formater les données pour le graphique
      const formattedData: FormattedGreekData[] = response.data.map((item) => {
        let gamma = 0
        let delta: number | undefined
        let vega: number | undefined
        let theta: number | undefined

        if ('gamma' in item) {
          // SpotExposureData
          const spotItem = item as SpotExposureData
          gamma = spotItem.gamma || 0
          delta = spotItem.delta
          vega = spotItem.vega
          theta = spotItem.theta
        } else {
          // GreekExposureData
          const exposureItem = item as GreekExposureData
          gamma = exposureItem.total_gamma || 0
          delta = exposureItem.total_delta
          vega = exposureItem.total_vega
          theta = exposureItem.total_theta
        }

        return {
          strike: item.strike.toString(),
          gamma,
          delta,
          vega,
          theta,
          color: gamma > 0 ? '#4ade80' : '#f87171', // Vert pour positif, rouge pour négatif
        }
      })

      // Filtrer les strikes avec gamma significatif
      const filteredData = formattedData.filter(
        (item) => Math.abs(item.gamma) > 0
      )

      // Trier par strike
      filteredData.sort((a, b) => parseFloat(a.strike) - parseFloat(b.strike))

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: filteredData,
        timestamp: Date.now(),
        ticker: ticker.toUpperCase(),
      })

      return {
        success: true,
        data: filteredData,
        ticker: ticker.toUpperCase(),
        timestamp: response.timestamp,
      }
    } catch (error: any) {
      console.error('Error in greeksService:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message || 'Erreur lors du chargement des données',
      }
    }
  }

  /**
   * Filtre les données pour n'afficher que les strikes autour du prix actuel
   * @param data - Données formatées
   * @param currentPrice - Prix actuel du ticker
   * @param rangePercent - Pourcentage de range autour du prix (défaut: 20%)
   * @returns FormattedGreekData[]
   */
  filterAroundPrice(
    data: FormattedGreekData[],
    currentPrice: number,
    rangePercent: number = 20
  ): FormattedGreekData[] {
    if (!currentPrice || currentPrice <= 0) {
      return data
    }
    
    const minStrike = currentPrice * (1 - rangePercent / 100)
    const maxStrike = currentPrice * (1 + rangePercent / 100)
    
    console.log(`Filtering strikes: min=${minStrike}, max=${maxStrike}, currentPrice=${currentPrice}, range=${rangePercent}%`)

    const filtered = data.filter((item) => {
      const strike = parseFloat(item.strike)
      const inRange = strike >= minStrike && strike <= maxStrike
      if (!inRange && data.length < 10) {
        console.log(`Strike ${strike} (${item.strike}) is out of range [${minStrike}, ${maxStrike}]`)
      }
      return inRange
    })
    
    console.log(`Filtered ${data.length} strikes to ${filtered.length} strikes`)
    return filtered
  }

  /**
   * Limite le nombre de strikes affichés (pour performance)
   * @param data - Données formatées
   * @param maxStrikes - Nombre maximum de strikes (défaut: 100)
   * @returns FormattedGreekData[]
   */
  limitStrikes(
    data: FormattedGreekData[],
    maxStrikes: number = 100
  ): FormattedGreekData[] {
    if (data.length <= maxStrikes) {
      return data
    }

    // Prendre un échantillon équilibré
    const step = Math.ceil(data.length / maxStrikes)
    return data.filter((_, index) => index % step === 0).slice(0, maxStrikes)
  }
}

// Export singleton
export const greeksService = new GreeksService()
export default greeksService
