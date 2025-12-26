# Architecture API - MarketFlow

Ce document décrit l'architecture API du projet selon le pattern **Client-Service-Component**.

## 📐 Structure

```
Component (UI)
    ↓
Service (Logique métier + Cache)
    ↓
Client API (Requêtes HTTP)
    ↓
BaseClient (Authentification + Configuration)
    ↓
API Gateway (Backend)
```

## 📁 Organisation des fichiers

```
lib/
  api/
    ├── baseClient.ts              # ✅ Client de base (authentification automatique)
    ├── flowAlertsClient.ts        # ✅ Client Flow Alerts
    └── ...                        # Autres clients API

services/
    ├── flowAlertsService.ts       # ✅ Service Flow Alerts (cache + logique)
    └── ...                        # Autres services

components/
    ├── FlowAlerts.tsx             # ✅ Composant UI
    └── ...                        # Autres composants
```

## 🔧 Composants de l'architecture

### 1. BaseClient (`lib/api/baseClient.ts`)

Le client de base fournit :
- ✅ Authentification automatique (Access Token ou ID Token)
- ✅ Gestion des erreurs HTTP
- ✅ Configuration centralisée
- ✅ Méthodes HTTP helpers (get, post, put, delete)

**Utilisation** :
```typescript
import BaseApiClient from './baseClient'

class MyClient extends BaseApiClient {
  constructor() {
    super() // Utilise l'URL de base par défaut
    // ou
    super('https://custom-api.com') // URL personnalisée
  }

  async getData(id: string) {
    return this.get(`/data/${id}`, {
      tokenType: 'access' // ou 'id'
    })
  }
}
```

### 2. Client API (`lib/api/flowAlertsClient.ts`)

Responsabilités :
- Définir les endpoints spécifiques
- Typer les requêtes et réponses
- Construire les paramètres de requête

**Exemple** :
```typescript
class FlowAlertsClient extends BaseApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_URL_2)
  }

  async getFlowAlerts(params?: FlowAlertsParams): Promise<FlowAlertsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.ticker_symbol) queryParams.append('ticker_symbol', params.ticker_symbol)
    
    return this.get<FlowAlertsResponse>(
      `/unusual-whales/option-trades/flow-alerts?${queryParams}`,
      { tokenType: 'access' }
    )
  }
}
```

### 3. Service (`services/flowAlertsService.ts`)

Responsabilités :
- Gestion du cache côté frontend
- Logique métier (formatage, transformations)
- Méthodes utilitaires
- Logs et monitoring

**Exemple** :
```typescript
class FlowAlertsService {
  private cache: Map<string, CacheEntry>
  
  async getFlowAlerts(params?: FlowAlertsParams, forceRefresh = false) {
    const cacheKey = this.getCacheKey(params)
    
    // Vérifier le cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && !this.isCacheExpired(cached)) {
        return cached.data
      }
    }
    
    // Récupérer depuis l'API
    const data = await flowAlertsClient.getFlowAlerts(params)
    
    // Mettre en cache
    this.cache.set(cacheKey, { data, timestamp: Date.now() })
    
    return data
  }
  
  // Méthodes utilitaires
  formatPremium(premium: number): string { ... }
  getSentiment(alert: FlowAlert): Sentiment { ... }
}
```

### 4. Composant (`components/FlowAlerts.tsx`)

Responsabilités :
- Affichage UI
- Gestion des états (loading, error)
- Appel au service

**Exemple** :
```typescript
function FlowAlerts() {
  const [data, setData] = useState<FlowAlert[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function load() {
      try {
        const response = await flowAlertsService.getFlowAlerts({
          limit: 50,
          min_premium: 1000000,
        })
        setData(response.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  
  // ... render UI
}
```

## 🔐 Authentification

### Types de tokens

- **Access Token** : Pour la plupart des APIs
- **ID Token** : Pour les APIs 13F/Organizations

### Utilisation

```typescript
// Dans le client
return this.get('/endpoint', {
  tokenType: 'access' // ou 'id'
})
```

Le `BaseClient` gère automatiquement :
- ✅ Récupération du token depuis `authService`
- ✅ Ajout du header `Authorization: Bearer <token>`
- ✅ Gestion des erreurs 401 (token expiré)

## 💾 Gestion du cache

### Stratégie

1. **Clé de cache** : Basée sur les paramètres de requête
2. **TTL** : 2 minutes pour les données temps réel
3. **Invalidation** : Manuel via `clearCache()` ou timeout automatique

### Exemple

```typescript
// Service avec cache
private cache: Map<string, CacheEntry>
private cacheTimeout = 2 * 60 * 1000 // 2 minutes

async getData(id: string, forceRefresh = false) {
  const cacheKey = `data_${id}`
  
  if (!forceRefresh) {
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
  }
  
  const data = await this.client.getData(id)
  this.cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}
```

## 📊 Exemple complet : Flow Alerts

### 1. Client (`lib/api/flowAlertsClient.ts`)

```typescript
class FlowAlertsClient extends BaseApiClient {
  async getFlowAlerts(params?: FlowAlertsParams): Promise<FlowAlertsResponse> {
    const queryParams = new URLSearchParams()
    // Construire les params...
    
    return this.get<FlowAlertsResponse>(
      `/unusual-whales/option-trades/flow-alerts?${queryParams}`,
      { tokenType: 'access' }
    )
  }
}
```

### 2. Service (`services/flowAlertsService.ts`)

```typescript
class FlowAlertsService {
  async getFlowAlerts(params?: FlowAlertsParams, forceRefresh = false) {
    // Cache logic...
    const data = await flowAlertsClient.getFlowAlerts(params)
    // Cache + return
  }
  
  formatPremium(premium: number): string { ... }
  getSentiment(alert: FlowAlert): Sentiment { ... }
}
```

### 3. Composant (`components/FlowAlerts.tsx`)

```typescript
function FlowAlerts() {
  const [alerts, setAlerts] = useState<FlowAlert[]>([])
  
  const loadAlerts = async () => {
    const response = await flowAlertsService.getFlowAlerts({
      limit: 50,
      min_premium: 1000000,
    })
    setAlerts(response.data)
  }
  
  // ... UI avec formatage via service
  flowAlertsService.formatPremium(alert.total_premium)
}
```

## ✅ Avantages de cette architecture

1. **Séparation des responsabilités**
   - Client = HTTP uniquement
   - Service = Logique métier + Cache
   - Composant = UI uniquement

2. **Réutilisabilité**
   - Un client peut être utilisé par plusieurs services
   - Un service peut être utilisé par plusieurs composants

3. **Testabilité**
   - Chaque couche peut être testée indépendamment
   - Mocking facile

4. **Maintenabilité**
   - Modifications localisées
   - Code plus lisible et organisé

5. **Performance**
   - Cache côté frontend
   - Requêtes optimisées

## 🚀 Créer un nouveau client/service

### 1. Créer le client

```typescript
// lib/api/myClient.ts
import BaseApiClient from './baseClient'

class MyClient extends BaseApiClient {
  async getData(id: string) {
    return this.get(`/my-endpoint/${id}`, {
      tokenType: 'access'
    })
  }
}

export const myClient = new MyClient()
export default myClient
```

### 2. Créer le service

```typescript
// services/myService.ts
import myClient from '@/lib/api/myClient'

class MyService {
  private cache = new Map()
  
  async getData(id: string) {
    // Cache logic...
    return myClient.getData(id)
  }
}

export const myService = new MyService()
export default myService
```

### 3. Utiliser dans un composant

```typescript
import myService from '@/services/myService'

function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    myService.getData('123').then(setData)
  }, [])
  
  return <div>{JSON.stringify(data)}</div>
}
```

## 📚 Références

- `lib/api/baseClient.ts` - Client de base
- `lib/api/flowAlertsClient.ts` - Exemple de client
- `services/flowAlertsService.ts` - Exemple de service
- `components/FlowAlerts.tsx` - Exemple de composant

