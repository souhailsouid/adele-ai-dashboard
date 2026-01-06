/**
 * Service pour formater et traiter les données d'options
 * Utilisé pour préparer les données avant l'affichage dans les graphiques
 */

import optionsChainClient, { type OptionsChainData } from '@/lib/api/optionsChainClient'

export interface FormattedOptionsData {
  strike: string
  call: number
  put: number
  call_volume?: number
  put_volume?: number
  call_iv?: number
  put_iv?: number
}

export interface OptionsDataServiceResponse {
  success: boolean
  data: FormattedOptionsData[]
  ticker: string
  error?: string
}

class OptionsDataService {
  /**
   * Récupère et formate les données d'Open Interest pour un ticker
   * @param ticker - Symbole du ticker
   * @param date - Date au format YYYY-MM-DD pour récupérer les données historiques (optionnel)
   * @returns Promise<OptionsDataServiceResponse>
   */
  async getOpenInterestData(
    ticker: string,
    date?: string
  ): Promise<OptionsDataServiceResponse> {
    try {
      const response = await optionsChainClient.getOptionsChain(ticker, date)

      if (!response.success || !response.data || response.data.length === 0) {
        return {
          success: false,
          data: [],
          ticker: ticker.toUpperCase(),
          error: response.error || 'Aucune donnée disponible',
        }
      }

      // Formater les données pour le graphique
      const formattedData: FormattedOptionsData[] = response.data.map((item) => ({
        strike: item.strike.toString(),
        call: item.call_oi || 0,
        put: item.put_oi || 0,
        call_volume: item.call_volume,
        put_volume: item.put_volume,
        call_iv: item.call_iv,
        put_iv: item.put_iv,
      }))

      // Filtrer les strikes avec OI > 0 pour éviter le bruit
      const filteredData = formattedData.filter(
        (item) => item.call > 0 || item.put > 0
      )

      // Trier par strike
      filteredData.sort((a, b) => parseFloat(a.strike) - parseFloat(b.strike))

      return {
        success: true,
        data: filteredData,
        ticker: ticker.toUpperCase(),
      }
    } catch (error: any) {
      console.error('Error in optionsDataService:', error)
      return {
        success: false,
        data: [],
        ticker: ticker.toUpperCase(),
        error: error.message || 'Erreur lors du chargement des données',
      }
    }
  }

  /**
   * Filtre les données pour n'afficher que les strikes autour du prix actuel
   * @param data - Données formatées
   * @param currentPrice - Prix actuel du ticker
   * @param rangePercent - Pourcentage de range autour du prix (défaut: 20%)
   * @returns FormattedOptionsData[]
   */
  filterAroundPrice(
    data: FormattedOptionsData[],
    currentPrice: number,
    rangePercent: number = 20
  ): FormattedOptionsData[] {
    const minStrike = currentPrice * (1 - rangePercent / 100)
    const maxStrike = currentPrice * (1 + rangePercent / 100)

    return data.filter((item) => {
      const strike = parseFloat(item.strike)
      return strike >= minStrike && strike <= maxStrike
    })
  }

  /**
   * Limite le nombre de strikes affichés (pour performance)
   * @param data - Données formatées
   * @param maxStrikes - Nombre maximum de strikes (défaut: 100)
   * @returns FormattedOptionsData[]
   */
  limitStrikes(
    data: FormattedOptionsData[],
    maxStrikes: number = 100
  ): FormattedOptionsData[] {
    if (data.length <= maxStrikes) {
      return data
    }

    // Prendre un échantillon équilibré
    const step = Math.ceil(data.length / maxStrikes)
    return data.filter((_, index) => index % step === 0).slice(0, maxStrikes)
  }
}

// Export singleton
export const optionsDataService = new OptionsDataService()
export default optionsDataService
