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
   * Inclut TOUS les paramètres pour éviter les collisions de cache
   */
  private getCacheKey(params?: FlowAlertsParams): string {
    if (!params) return 'flow_alerts_default'
    
    // Trier les clés pour garantir l'ordre (important pour le cache)
    const sortedKeys = Object.keys(params).sort()
    const cacheParts = sortedKeys
      .filter(key => params[key as keyof FlowAlertsParams] !== undefined)
      .map(key => {
        const value = params[key as keyof FlowAlertsParams]
        // Convertir les arrays et objets en string JSON
        if (Array.isArray(value)) {
          return `${key}_${JSON.stringify(value)}`
        }
        if (typeof value === 'object' && value !== null) {
          return `${key}_${JSON.stringify(value)}`
        }
        return `${key}_${value}`
      })
    
    return `flow_alerts_${cacheParts.join('_')}`
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
        return cached.data
      }
    }

    // Récupérer depuis l'API
    try {
      const response = await flowAlertsClient.getFlowAlerts(params)

      // Vérifier que les données sont valides
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide : type incorrect')
      }

      if (!('data' in response)) {
        throw new Error('Réponse API invalide : pas de propriété data')
      }

      if (!Array.isArray(response.data)) {
        throw new Error('Réponse API invalide : data n\'est pas un tableau')
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      })

      return response
    } catch (error) {
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
   * Calcule le changement d'IV en pourcentage
   * @param alert - L'alerte de flow
   * @returns IV change en pourcentage (ex: 0.05 = +5%, -0.03 = -3%)
   */
  getIVChange(alert: FlowAlert): number {
    const ivStart = parseFloat(alert.iv_start)
    const ivEnd = parseFloat(alert.iv_end)

    if (isNaN(ivStart) || isNaN(ivEnd) || ivStart === 0) {
      return 0
    }

    // Calcul du changement en pourcentage
    // Exemple: iv_start=0.40, iv_end=0.42 → (0.42-0.40)/0.40 = +0.05 = +5%
    return (ivEnd - ivStart) / ivStart
  }

  /**
   * Filtre les alertes selon les critères du preset actif
   * (filtrage côté frontend pour les paramètres que l'API ne supporte pas)
   */
  filterByPreset(alerts: FlowAlert[], presetParams: Partial<FlowAlertsParams>): FlowAlert[] {
    return alerts.filter(alert => {
      // Filtre IV change (côté frontend car l'API ne calcule pas ce changement)
      if (presetParams.min_iv_change !== undefined) {
        const ivChange = this.getIVChange(alert)
        // On prend la valeur absolue pour détecter les mouvements dans les 2 sens
        if (Math.abs(ivChange) < presetParams.min_iv_change) {
          return false
        }
      }

      // Les autres filtres sont gérés par l'API
      return true
    })
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton
export const flowAlertsService = new FlowAlertsService()
export default flowAlertsService

