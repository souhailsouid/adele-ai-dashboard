/**
 * Service pour gérer les Flow Alerts
 * Ajoute une couche de cache et de logique métier
 */

import flowAlertsClient, { FlowAlert, FlowAlertsParams, FlowAlertsResponse } from '@/lib/api/flowAlertsClient'

interface CacheEntry {
  data: FlowAlertsResponse
  timestamp: number
}

class FlowAlertsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 2 * 60 * 1000 // 2 minutes (données temps réel)
  }

  /**
   * Génère une clé de cache basée sur les paramètres
   */
  private getCacheKey(params?: FlowAlertsParams): string {
    const parts = ['flow_alerts']
    
    if (params?.ticker_symbol) parts.push(`ticker_${params.ticker_symbol}`)
    if (params?.min_premium) parts.push(`min_${params.min_premium}`)
    if (params?.limit) parts.push(`limit_${params.limit}`)
    
    return parts.join('_')
  }

  /**
   * Récupère les flow alerts avec cache
   * @param params - Paramètres de filtrage
   * @param forceRefresh - Force le rafraîchissement du cache
   */
  async getFlowAlerts(params?: FlowAlertsParams, forceRefresh = false): Promise<FlowAlertsResponse> {
    const cacheKey = this.getCacheKey(params)

    // Vérifier le cache si pas de rafraîchissement forcé
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ Flow Alerts from cache')
        return cached.data
      }
    }

    // Récupérer depuis l'API
    try {
      const response = await flowAlertsClient.getFlowAlerts(params)

      // Vérifier que les données sont valides
      if (!response || typeof response !== 'object') {
        console.error('❌ [FlowAlertsService] Invalid response type:', typeof response)
        throw new Error('Réponse API invalide : type incorrect')
      }

      if (!('data' in response)) {
        console.error('❌ [FlowAlertsService] Response has no data property')
        throw new Error('Réponse API invalide : pas de propriété data')
      }

      if (!Array.isArray(response.data)) {
        console.error('❌ [FlowAlertsService] Data is not an array')
        throw new Error('Réponse API invalide : data n\'est pas un tableau')
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      })

      console.log(`✅ Loaded ${response.count} flow alerts (${response.cached ? 'cached' : 'fresh'})`)
      return response
    } catch (error) {
      console.error('❌ [FlowAlertsService] Error:', error)
      throw error
    }
  }

  /**
   * Formate le premium pour l'affichage
   */
  formatPremium(premium: string | number): string {
    const num = typeof premium === 'string' ? parseFloat(premium) : premium
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`
    }
    
    return `$${num.toFixed(0)}`
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  /**
   * Formate la date d'expiration
   */
  formatExpiry(expiry: string): string {
    const date = new Date(expiry)
    return date
      .toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
      .toUpperCase()
  }

  /**
   * Détermine le sentiment basé sur le type et les données
   */
  getSentiment(alert: FlowAlert): { label: string; color: string } {
    if (alert.type === 'call') {
      if (parseFloat(alert.total_premium) > 5000000) {
        return { label: 'Extremely Bullish', color: 'emerald' }
      }
      return { label: 'Bullish', color: 'emerald' }
    } else {
      if (parseFloat(alert.total_premium) > 5000000) {
        return { label: 'Extremely Bearish', color: 'red' }
      }
      return { label: 'Bearish', color: 'red' }
    }
  }

  /**
   * Calcule un score whale basé sur le premium et le volume
   */
  getWhaleScore(alert: FlowAlert): number | 'WHALE' {
    const premium = parseFloat(alert.total_premium)
    const volumeOI = parseFloat(alert.volume_oi_ratio)

    if (premium > 10000000 || volumeOI > 2) {
      return 'WHALE'
    }

    // Score basé sur le premium (0-100)
    const premiumScore = Math.min((premium / 10000000) * 100, 100)
    return Math.round(premiumScore)
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ [FlowAlertsService] Cache cleared')
  }
}

// Export singleton
export const flowAlertsService = new FlowAlertsService()
export default flowAlertsService

