# API Services Documentation

## Flow Alerts Service

Service pour gérer les appels API des Flow Alerts (alertes de transactions institutionnelles).

### Configuration

Le service utilise l'URL de base configurée dans les variables d'environnement :

```env
NEXT_PUBLIC_API_URL_2=https://faq9dl95v7.execute-api.eu-west-3.amazonaws.com/prod
```

### Authentification

Le service récupère automatiquement le token d'accès depuis le `localStorage` :
- Clé: `accessToken`
- Format: Bearer token stocké après connexion

### Utilisation

#### Récupérer les flow alerts

```typescript
import { flowAlertsService } from '@/lib/api/flowAlertsService'

// Récupérer toutes les alertes avec filtres
const response = await flowAlertsService.getFlowAlerts({
  ticker_symbol: 'TSLA',  // Optionnel
  min_premium: 1000000,    // Optionnel (en $)
  limit: 100               // Optionnel
})
```

#### Méthodes utilitaires

```typescript
// Formater le premium pour l'affichage
const formatted = flowAlertsService.formatPremium(4200000)
// => "$4.2M"

// Formater la date
const time = flowAlertsService.formatDate("2025-12-26T10:19:53.523Z")
// => "10:19:53"

// Formater l'expiration
const expiry = flowAlertsService.formatExpiry("2026-01-09")
// => "09 JAN 26"

// Obtenir le sentiment
const sentiment = flowAlertsService.getSentiment(alert)
// => { label: "Extremely Bullish", color: "emerald" }

// Calculer le whale score
const score = flowAlertsService.getWhaleScore(alert)
// => "WHALE" ou 0-100
```

### Types de données

#### FlowAlert

```typescript
interface FlowAlert {
  id: string
  ticker: string
  created_at: string
  type: 'call' | 'put'
  strike: string
  expiry: string
  total_premium: string
  volume: number
  underlying_price: string
  price: string
  alert_rule: string
  sector: string
  has_sweep: boolean
  has_floor: boolean
  trade_count: number
  open_interest: number
  volume_oi_ratio: string
  // ... autres propriétés
}
```

#### FlowAlertsResponse

```typescript
interface FlowAlertsResponse {
  success: boolean
  data: FlowAlert[]
  cached: boolean
  count: number
  timestamp: string
}
```

### Gestion des erreurs

Le service gère automatiquement les erreurs suivantes :
- Token d'authentification manquant
- Erreurs réseau
- Erreurs API (4xx, 5xx)

Les erreurs sont loggées dans la console et propagées pour être gérées par les composants.

### Exemples d'utilisation dans les composants

#### Composant FlowAlerts

Le composant `FlowAlerts.tsx` est un exemple complet d'utilisation :

```typescript
'use client'

import { useState, useEffect } from 'react'
import { flowAlertsService, FlowAlert } from '@/lib/api/flowAlertsService'

export default function FlowAlerts() {
  const [alerts, setAlerts] = useState<FlowAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await flowAlertsService.getFlowAlerts({
        limit: 50,
        min_premium: 1000000
      })
      setAlerts(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ... reste du composant
}
```

### Page Dashboard

URL: `/dashboard`

Affiche tous les Flow Alerts avec :
- Filtres par type (calls/puts)
- Recherche par ticker
- Actualisation en temps réel
- Affichage détaillé des transactions

### Notes techniques

1. **Client-side only**: Le service utilise `localStorage` et doit être utilisé uniquement côté client (`'use client'`)

2. **Caching**: L'API peut retourner des données en cache (propriété `cached: true`)

3. **Limites**: L'API accepte un paramètre `limit` pour contrôler le nombre de résultats

4. **Premium minimum**: Utilisez `min_premium` pour filtrer les transactions importantes (recommandé: 1M$)

