/**
 * Service pour détecter automatiquement les niveaux clés et alertes contextuelles
 * Basé sur les Dark Pools, Options et Flow Alerts
 */

import type { DarkPoolTransaction } from '@/types/darkPools'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import darkPoolsService from './darkPoolsService'

export interface KeyLevel {
  price: number
  type: 'whale-support' | 'dark-pool-cluster' | 'option-wall'
  strength: 'high' | 'medium' | 'low'
  transactionCount: number
  totalVolume: number
  totalPremium?: number
  description: string
  institutions?: string[]
}

export interface ExpirationAlert {
  expiry: string
  daysUntil: number
  strikeCount: number
  totalVolume: number
  totalPremium: number
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface ContextualAlert {
  type: 'whale-support' | 'expiration' | 'volatility-spike' | 'dark-pool-cluster'
  title: string
  description: string
  value: string
  impact: 'high' | 'medium' | 'low'
  timestamp?: string
}

class FlowContextualService {
  /**
   * Détecte les niveaux de support des baleines basés sur les Dark Pools
   * Si plus de 5 transactions au même prix, c'est un niveau clé
   */
  async detectWhaleSupportLevels(
    ticker: string,
    darkPools?: DarkPoolTransaction[]
  ): Promise<KeyLevel[]> {
    try {
      // Charger les Dark Pools si non fournis
      let transactions = darkPools
      if (!transactions || transactions.length === 0) {
        transactions = await darkPoolsService.getDarkPools(
          ticker,
          100, // Limite élevée pour avoir assez de données
          500000, // Premium minimum de 500K$ pour les baleines
          undefined,
          undefined,
          undefined,
          true // Force refresh
        )
      }

      // Grouper par prix (arrondi à 2 décimales)
      const priceGroups: Record<string, DarkPoolTransaction[]> = {}
      
      transactions.forEach(transaction => {
        const price = parseFloat(transaction.price)
        if (isNaN(price)) return
        
        // Arrondir à 2 décimales pour grouper
        const roundedPrice = Math.round(price * 100) / 100
        const key = roundedPrice.toFixed(2)
        
        if (!priceGroups[key]) {
          priceGroups[key] = []
        }
        priceGroups[key].push(transaction)
      })

      // Filtrer les groupes avec au moins 5 transactions (niveau clé)
      const keyLevels: KeyLevel[] = []
      
      Object.entries(priceGroups).forEach(([priceStr, group]) => {
        if (group.length >= 5) {
          const price = parseFloat(priceStr)
          const totalVolume = group.reduce((sum, t) => sum + t.volume, 0)
          const totalPremium = group.reduce((sum, t) => sum + parseFloat(t.premium || '0'), 0)
          
          // Déterminer la force basée sur le nombre de transactions
          let strength: 'high' | 'medium' | 'low' = 'low'
          if (group.length >= 10) strength = 'high'
          else if (group.length >= 7) strength = 'medium'
          
          // Extraire les institutions uniques (market centers)
          const institutions = [...new Set(group.map(t => t.market_center).filter(Boolean))]
          
          keyLevels.push({
            price,
            type: 'whale-support',
            strength,
            transactionCount: group.length,
            totalVolume,
            totalPremium,
            description: `${group.length} transactions Dark Pool à $${price.toFixed(2)}`,
            institutions: institutions.slice(0, 5), // Limiter à 5 institutions
          })
        }
      })

      // Trier par nombre de transactions (décroissant)
      return keyLevels.sort((a, b) => b.transactionCount - a.transactionCount)
    } catch (error) {
      console.error('Erreur lors de la détection des niveaux de support:', error)
      return []
    }
  }

  /**
   * Détecte les clusters de Dark Pools (groupes de transactions proches)
   */
  detectDarkPoolClusters(
    darkPools: DarkPoolTransaction[],
    clusterThreshold = 0.5 // Prix dans un rayon de 0.5$
  ): KeyLevel[] {
    if (!darkPools || darkPools.length === 0) return []

    const clusters: KeyLevel[] = []
    const processed = new Set<number>()

    darkPools.forEach((transaction, idx) => {
      if (processed.has(idx)) return

      const price = parseFloat(transaction.price)
      if (isNaN(price)) return

      // Trouver toutes les transactions dans le cluster
      const cluster = darkPools.filter((t, i) => {
        if (processed.has(i)) return false
        const tPrice = parseFloat(t.price)
        return !isNaN(tPrice) && Math.abs(tPrice - price) <= clusterThreshold
      })

      if (cluster.length >= 5) {
        // Calculer le prix moyen du cluster
        const avgPrice = cluster.reduce((sum, t) => sum + parseFloat(t.price), 0) / cluster.length
        const totalVolume = cluster.reduce((sum, t) => sum + t.volume, 0)
        const totalPremium = cluster.reduce((sum, t) => sum + parseFloat(t.premium || '0'), 0)

        let strength: 'high' | 'medium' | 'low' = 'low'
        if (cluster.length >= 10) strength = 'high'
        else if (cluster.length >= 7) strength = 'medium'

        clusters.push({
          price: Math.round(avgPrice * 100) / 100,
          type: 'dark-pool-cluster',
          strength,
          transactionCount: cluster.length,
          totalVolume,
          totalPremium,
          description: `Cluster de ${cluster.length} transactions autour de $${avgPrice.toFixed(2)}`,
        })

        // Marquer comme traité
        cluster.forEach((_, i) => {
          const originalIdx = darkPools.indexOf(cluster[i])
          if (originalIdx !== -1) processed.add(originalIdx)
        })
      }
    })

    return clusters.sort((a, b) => b.transactionCount - a.transactionCount)
  }

  /**
   * Détecte les prochaines expirations majeures d'options
   */
  detectUpcomingExpirations(
    alerts: FlowAlert[],
    daysAhead = 30
  ): ExpirationAlert[] {
    if (!alerts || alerts.length === 0) return []

    const now = new Date()
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    // Grouper par date d'expiration
    const expiryGroups: Record<string, FlowAlert[]> = {}

    alerts.forEach(alert => {
      if (!alert.expiry) return

      const expiryDate = new Date(alert.expiry)
      if (expiryDate < now || expiryDate > futureDate) return

      const expiryKey = expiryDate.toISOString().split('T')[0]

      if (!expiryGroups[expiryKey]) {
        expiryGroups[expiryKey] = []
      }
      expiryGroups[expiryKey].push(alert)
    })

    // Créer les alertes d'expiration
    const expirationAlerts: ExpirationAlert[] = []

    Object.entries(expiryGroups).forEach(([expiry, group]) => {
      const expiryDate = new Date(expiry)
      const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const totalVolume = group.reduce((sum, a) => sum + a.volume, 0)
      const totalPremium = group.reduce((sum, a) => sum + parseFloat(a.total_premium || '0'), 0)
      const strikeCount = new Set(group.map(a => a.strike)).size

      // Déterminer l'impact
      let impact: 'high' | 'medium' | 'low' = 'low'
      if (totalPremium > 100000000 || totalVolume > 100000) impact = 'high'
      else if (totalPremium > 50000000 || totalVolume > 50000) impact = 'medium'

      expirationAlerts.push({
        expiry,
        daysUntil,
        strikeCount,
        totalVolume,
        totalPremium,
        description: `${strikeCount} strikes • ${totalVolume.toLocaleString()} volume`,
        impact,
      })
    })

    // Trier par jours jusqu'à expiration (croissant)
    return expirationAlerts.sort((a, b) => a.daysUntil - b.daysUntil)
  }

  /**
   * Génère les alertes contextuelles pour un ticker
   */
  async generateContextualAlerts(
    ticker: string,
    alerts: FlowAlert[],
    darkPools?: DarkPoolTransaction[]
  ): Promise<ContextualAlert[]> {
    const contextualAlerts: ContextualAlert[] = []

    try {
      // 1. Détecter les niveaux de support des baleines
      const whaleLevels = await this.detectWhaleSupportLevels(ticker, darkPools)
      if (whaleLevels.length > 0) {
        const strongestLevel = whaleLevels[0]
        contextualAlerts.push({
          type: 'whale-support',
          title: 'Support des Baleines',
          description: `${strongestLevel.transactionCount} transactions Dark Pool détectées`,
          value: `$${strongestLevel.price.toFixed(2)}`,
          impact: strongestLevel.strength,
        })
      }

      // 2. Détecter les expirations proches
      const expirations = this.detectUpcomingExpirations(alerts, 30)
      if (expirations.length > 0) {
        const nextExpiration = expirations[0]
        contextualAlerts.push({
          type: 'expiration',
          title: 'Prochaine Expiration Majeure',
          description: `${nextExpiration.strikeCount} strikes • ${nextExpiration.totalVolume.toLocaleString()} volume`,
          value: `Dans ${nextExpiration.daysUntil} jour${nextExpiration.daysUntil > 1 ? 's' : ''}`,
          impact: nextExpiration.impact,
          timestamp: nextExpiration.expiry,
        })
      }

      // 3. Détecter les clusters de Dark Pools
      if (darkPools && darkPools.length > 0) {
        const clusters = this.detectDarkPoolClusters(darkPools)
        if (clusters.length > 0) {
          const strongestCluster = clusters[0]
          contextualAlerts.push({
            type: 'dark-pool-cluster',
            title: 'Cluster Dark Pool Détecté',
            description: `${strongestCluster.transactionCount} transactions groupées`,
            value: `$${strongestCluster.price.toFixed(2)}`,
            impact: strongestCluster.strength,
          })
        }
      }

      // 4. Détecter les spikes de volatilité
      const volatilitySpikes = alerts.filter(alert => {
        const ivStart = parseFloat(alert.iv_start || '0')
        const ivEnd = parseFloat(alert.iv_end || '0')
        if (ivStart === 0) return false
        const ivChange = (ivEnd - ivStart) / ivStart
        return ivChange > 0.05 // +5% IV
      })

      if (volatilitySpikes.length > 0) {
        contextualAlerts.push({
          type: 'volatility-spike',
          title: 'Spike de Volatilité',
          description: `${volatilitySpikes.length} alertes avec IV +5%`,
          value: `${volatilitySpikes.length} alertes`,
          impact: volatilitySpikes.length > 10 ? 'high' : 'medium',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la génération des alertes contextuelles:', error)
    }

    return contextualAlerts
  }

  /**
   * Formate un nombre de jours en texte lisible
   */
  formatDaysUntil(days: number): string {
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Demain'
    if (days < 7) return `Dans ${days} jours`
    if (days < 30) {
      const weeks = Math.floor(days / 7)
      return `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`
    }
    const months = Math.floor(days / 30)
    return `Dans ${months} mois`
  }
}

// Export singleton
const flowContextualService = new FlowContextualService()
export default flowContextualService

