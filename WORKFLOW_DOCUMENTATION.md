# 📚 MarketFlow - Documentation des Workflows

## 📋 Table des matières

1. [Workflow d'Authentification](#workflow-dauthentification)
2. [Workflow Flow Alerts](#workflow-flow-alerts)
3. [Workflow de Build & Déploiement](#workflow-de-build--déploiement)
4. [Architecture Client-Service-Component](#architecture-client-service-component)
5. [Workflow de Navigation](#workflow-de-navigation)

---

## 🔐 Workflow d'Authentification

### Vue d'ensemble

L'authentification utilise **AWS Cognito** avec un système de **tokens JWT** (Access Token et ID Token). Le workflow garantit que toutes les requêtes API sont automatiquement authentifiées.

---

### 1. Inscription (Sign Up)

```
┌─────────────────┐
│  Utilisateur    │
│  (Email/Pass)   │
└────────┬────────┘
         │ 1. Submit form
         ↓
┌─────────────────┐
│  AuthModal      │ → AuthContext.signUp()
│  Component      │
└────────┬────────┘
         │ 2. Appel service
         ↓
┌─────────────────┐
│  authService    │ → AWS Cognito
│  .signUp()      │   InitiateAuthCommand
└────────┬────────┘
         │ 3. Résultat
         ↓
┌─────────────────┐
│  Email de       │ ✅ Confirmation code envoyé
│  confirmation   │
└─────────────────┘
```

**Fichiers concernés :**
- `components/AuthModal.tsx` → Interface utilisateur
- `context/AuthContext.tsx` → `signUp()`
- `lib/auth/authService.ts` → `signUp()` → AWS Cognito

**Étapes détaillées :**

1. **Utilisateur remplit le formulaire** (`AuthModal.tsx`)
   - Email
   - Password
   - Confirm Password
   - First Name, Last Name (optionnel)

2. **Soumission** → `AuthContext.signUp()` appelé
   ```typescript
   const result = await signUp(email, password, { firstName, lastName })
   ```

3. **Service Layer** → `authService.signUp()`
   - Valide la configuration Cognito
   - Appelle `SignUpCommand` avec AWS SDK
   - Retourne le résultat (succès ou erreur)

4. **Résultat**
   - ✅ **Succès** → Email de confirmation envoyé
   - ❌ **Erreur** → Message d'erreur affiché

---

### 2. Confirmation de l'inscription

```
┌─────────────────┐
│  Code de        │
│  confirmation   │
└────────┬────────┘
         │ 1. Submit code
         ↓
┌─────────────────┐
│  AuthContext    │ → authService.confirmSignUp()
│  .confirmSignUp │
└────────┬────────┘
         │ 2. AWS Cognito
         ↓
┌─────────────────┐
│  Compte activé  │ ✅ Prêt à se connecter
└─────────────────┘
```

**Fichiers concernés :**
- `context/AuthContext.tsx` → `confirmSignUp()`
- `lib/auth/authService.ts` → `confirmSignUp()` → `ConfirmSignUpCommand`

---

### 3. Connexion (Sign In)

```
┌─────────────────┐
│  Utilisateur    │
│  (Email/Pass)   │
└────────┬────────┘
         │ 1. Submit
         ↓
┌─────────────────┐
│  AuthContext    │ → authService.signIn()
│  .signIn()      │
└────────┬────────┘
         │ 2. AWS Cognito
         │    USER_PASSWORD_AUTH
         ↓
┌─────────────────┐
│  Tokens JWT     │
│  - Access Token │
│  - ID Token     │
│  - Refresh      │
└────────┬────────┘
         │ 3. Stockage
         ↓
┌─────────────────┐
│  localStorage   │ ✅ Tokens sauvegardés
│  - cognito_*    │
└────────┬────────┘
         │ 4. Chargement user
         ↓
┌─────────────────┐
│  authService    │ → getUserAttributes()
│  .getCurrentUser│
└────────┬────────┘
         │ 5. État global
         ↓
┌─────────────────┐
│  AuthContext    │ ✅ user state mis à jour
│  user state     │    Header mis à jour
└─────────────────┘
```

**Fichiers concernés :**
- `components/AuthModal.tsx` → Interface
- `context/AuthContext.tsx` → `signIn()` → `loadUser()`
- `lib/auth/authService.ts` → `signIn()`, `getCurrentUser()`

**Étapes détaillées :**

1. **Utilisateur se connecte** → `AuthContext.signIn(email, password)`

2. **AWS Cognito authentifie** → `InitiateAuthCommand` avec `USER_PASSWORD_AUTH`

3. **Tokens reçus** :
   ```typescript
   {
     idToken: "eyJraWQiOi...",
     accessToken: "eyJraWQiOi...",
     refreshToken: "eyJjdHkiOi...",
     expiresIn: 3600
   }
   ```

4. **Stockage dans localStorage** :
   ```javascript
   localStorage.setItem('cognito_access_token', accessToken)
   localStorage.setItem('cognito_id_token', idToken)
   localStorage.setItem('cognito_refresh_token', refreshToken)
   localStorage.setItem('cognito_token_expires_at', expiresAt)
   ```

5. **Chargement des infos utilisateur** → `getCurrentUser()` → `GetUserCommand`

6. **État global mis à jour** :
   ```typescript
   setUser({
     email: "user@example.com",
     firstName: "John",
     lastName: "Doe",
     emailVerified: true
   })
   ```

7. **UI mise à jour** :
   - Header affiche le nom d'utilisateur
   - ProfileDropdown disponible
   - FlowAlerts peut charger les données

---

### 4. Appels API avec authentification automatique

```
┌─────────────────┐
│  Component      │
│  (FlowAlerts)   │
└────────┬────────┘
         │ 1. Appel API
         ↓
┌─────────────────┐
│  Service Layer  │ → flowAlertsService.getFlowAlerts()
│  (Cache check)  │
└────────┬────────┘
         │ 2. Si pas en cache
         ↓
┌─────────────────┐
│  Client Layer   │ → flowAlertsClient.getFlowAlerts()
└────────┬────────┘
         │ 3. Construire requête
         ↓
┌─────────────────┐
│  baseClient     │ → getToken() depuis localStorage
│  .request()     │ → Ajouter Authorization header
└────────┬────────┘
         │ 4. Requête HTTP
         ↓
┌─────────────────┐
│  API Gateway    │ → Vérifie JWT token
│  AWS Lambda     │ → Retourne données
└────────┬────────┘
         │ 5. Réponse
         ↓
┌─────────────────┐
│  Service Layer  │ → Cache les données
│  (Transform)    │ → Formate les données
└────────┬────────┘
         │ 6. Component
         ↓
┌─────────────────┐
│  FlowAlerts UI  │ ✅ Données affichées
└─────────────────┘
```

**Fichiers concernés :**
- `lib/api/baseClient.ts` → `getToken()`, `request()` avec Authorization header
- `lib/auth/authService.ts` → `getAccessToken()`, `getIdToken()`
- `lib/api/flowAlertsClient.ts` → Extend BaseApiClient
- `services/flowAlertsService.ts` → Cache + transformation

**Exemple de code :**

```typescript
// Dans baseClient.ts
private getToken(tokenType: TokenType = 'access'): string | null {
  return tokenType === 'access' 
    ? authService.getAccessToken() 
    : authService.getIdToken()
}

async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = this.getToken(options.tokenType)
  
  if (!token) {
    throw new Error('Not authenticated. Please sign in first.')
  }

  requestHeaders['Authorization'] = `Bearer ${token}`
  
  // Requête HTTP avec token automatique
  return fetch(url, { headers: requestHeaders })
}
```

**Gestion d'erreurs :**

- **401 Unauthorized** → `baseClient` détecte et appelle `authService.clearTokens()`
- **Token expiré** → `authService.isAuthenticated()` vérifie l'expiration
- **Pas de token** → Erreur avant même l'appel API

---

### 5. Déconnexion (Sign Out)

```
┌─────────────────┐
│  Utilisateur    │
│  Clic Logout    │
└────────┬────────┘
         │ 1. ProfileDropdown
         ↓
┌─────────────────┐
│  AuthContext    │ → authService.signOut()
│  .signOut()     │
└────────┬────────┘
         │ 2. AWS Cognito
         ↓
┌─────────────────┐
│  GlobalSignOut  │ → Invalide tous les tokens
│  Command        │
└────────┬────────┘
         │ 3. Nettoyage local
         ↓
┌─────────────────┐
│  localStorage   │ → clearTokens()
│  cleared        │ → setUser(null)
└────────┬────────┘
         │ 4. Redirection
         ↓
┌─────────────────┐
│  router.push(/) │ ✅ Retour à la home
└─────────────────┘
```

---

## 📊 Workflow Flow Alerts

### Vue d'ensemble

Le workflow Flow Alerts suit l'architecture **Client-Service-Component** pour séparer les responsabilités et optimiser les performances avec un système de cache.

---

### 1. Chargement initial des alertes

```
┌─────────────────┐
│  FlowAlerts     │
│  Component      │ (montage)
└────────┬────────┘
         │ 1. useEffect initial
         ↓
┌─────────────────┐
│  Vérification   │ → isAuthenticated() ?
│  Auth           │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   NON       OUI
    │         │
    ↓         ↓
┌─────────┐ ┌─────────────────┐
│  Erreur │ │ loadFlowAlerts()│
│  Auth   │ └────────┬────────┘
└─────────┘          │
                     │ 2. Construire params
                     ↓
            ┌─────────────────┐
            │  Params finaux: │
            │  - limit: 100   │
            │  - min_premium  │
            │  - preset params│
            └────────┬────────┘
                     │ 3. Service Layer
                     ↓
            ┌─────────────────┐
            │  flowAlerts     │ → Check cache
            │  Service        │
            └────────┬────────┘
                     │
              ┌──────┴──────┐
              │             │
         Cache hit      Cache miss
              │             │
              ↓             ↓
        ┌─────────┐  ┌─────────────────┐
        │ Return  │  │  flowAlerts     │
        │ cached  │  │  Client         │
        │ data    │  └────────┬────────┘
        └─────────┘           │
                              │ 4. HTTP Request
                              ↓
                    ┌─────────────────┐
                    │  baseClient     │ → + Authorization
                    │  .request()     │
                    └────────┬────────┘
                             │ 5. API Gateway
                             ↓
                    ┌─────────────────┐
                    │  Unusual Whales │ → Retourne JSON
                    │  API            │
                    └────────┬────────┘
                             │ 6. Response
                             ↓
                    ┌─────────────────┐
                    │  Service Layer  │ → Cache + Transform
                    └────────┬────────┘
                             │ 7. Component
                             ↓
                    ┌─────────────────┐
                    │  setAlerts()    │ ✅ UI mise à jour
                    └─────────────────┘
```

**Fichiers concernés :**
- `components/FlowAlerts.tsx` → `useEffect()` initial, `loadFlowAlerts()`
- `services/flowAlertsService.ts` → Cache, transformation
- `lib/api/flowAlertsClient.ts` → Requête HTTP
- `lib/api/baseClient.ts` → Authentification automatique

**Timeline détaillée :**

| Temps | Action | Fichier |
|-------|--------|---------|
| **0ms** | Component monte | `FlowAlerts.tsx` |
| **100ms** | `useEffect` déclenché | `FlowAlerts.tsx` |
| **100ms** | Vérification auth | `isAuthenticated()` |
| **101ms** | Construction params | `loadFlowAlerts()` |
| **102ms** | Appel service | `flowAlertsService.getFlowAlerts()` |
| **103ms** | Check cache | `flowAlertsService.ts` |
| **104ms** | Appel client (si pas en cache) | `flowAlertsClient.getFlowAlerts()` |
| **105ms** | Récupération token | `baseClient.getToken()` |
| **106ms** | Construction URL | `flowAlertsClient.ts` |
| **200ms** | Requête HTTP | `baseClient.request()` |
| **500ms** | Réponse API | Unusual Whales API |
| **501ms** | Validation données | `flowAlertsService.ts` |
| **502ms** | Mise en cache | `flowAlertsService.ts` |
| **503ms** | Formatage données | `flowAlertsService.ts` |
| **504ms** | `setAlerts()` | `FlowAlerts.tsx` |
| **505ms** | Rendu UI | React re-render |

---

### 2. Filtrage et presets

```
┌─────────────────┐
│  Utilisateur    │
│  Clique preset  │
└────────┬────────┘
         │ 1. handlePresetClick()
         ↓
┌─────────────────┐
│  setActivePreset│ → Whale Hunt, Vol Spike, etc.
│  (preset.id)    │
└────────┬────────┘
         │ 2. Vider cache
         ↓
┌─────────────────┐
│  clearCache()   │ → Service cache cleared
└────────┬────────┘
         │ 3. Recharger
         ↓
┌─────────────────┐
│  loadFlowAlerts │ → Avec preset.params
│  (preset params)│
└────────┬────────┘
         │ 4. Appel API avec filtres
         ↓
┌─────────────────┐
│  API avec       │ → ?is_floor=true&min_volume=10000
│  query params   │
└────────┬────────┘
         │ 5. Réponse filtrée
         ↓
┌─────────────────┐
│  Service Layer  │ → Filtrage frontend (IV change)
│  filterByPreset │
└────────┬────────┘
         │ 6. UI mise à jour
         ↓
┌─────────────────┐
│  Alertes        │ ✅ Filtrées selon preset
│  affichées      │
└─────────────────┘
```

**Exemple avec preset "Whale Hunt" :**

```typescript
// 1. Utilisateur clique 🐋 Whale Hunt
handlePresetClick(preset) {
  setActivePreset('whale-hunt')
  clearCache()
  loadFlowAlerts(undefined, true, {
    vol_greater_oi: true,
    is_floor: true,
    min_volume: 10000,
    min_open_interest: 1000,
    min_dte: 7
  })
}

// 2. API appelée avec :
// /flow-alerts?vol_greater_oi=true&is_floor=true&min_volume=10000&...

// 3. Réponse : 15 alertes (pré-filtrées par l'API)

// 4. Filtrage frontend si nécessaire (ex: min_iv_change)
// filterByPreset(alerts, preset.params)

// 5. UI affiche 15 alertes filtrées
```

---

### 3. Recherche par ticker

```
┌─────────────────┐
│  Utilisateur    │
│  Tape "NVDA"    │
└────────┬────────┘
         │ 1. handleTickerSearch()
         ↓
┌─────────────────┐
│  setActiveTicker│ → "NVDA"
│  ("NVDA")       │
└────────┬────────┘
         │ 2. Vider cache
         ↓
┌─────────────────┐
│  clearCache()   │
└────────┬────────┘
         │ 3. Recharger
         ↓
┌─────────────────┐
│  loadFlowAlerts │ → ticker_symbol: "NVDA"
│  ("NVDA")       │
└────────┬────────┘
         │ 4. API avec ticker
         ↓
┌─────────────────┐
│  API            │ → ?ticker_symbol=NVDA&...
│  /flow-alerts   │
└────────┬────────┘
         │ 5. Réponse
         ↓
┌─────────────────┐
│  34 alertes     │ ✅ Toutes pour NVDA
│  NVDA           │
└─────────────────┘
```

---

### 4. Rafraîchissement après connexion

```
┌─────────────────┐
│  Utilisateur    │
│  Se connecte    │
└────────┬────────┘
         │ 1. AuthContext updated
         ↓
┌─────────────────┐
│  useEffect      │ → Détecte changement auth
│  (auth listener)│
└────────┬────────┘
         │ 2. Vérification
         ↓
┌─────────────────┐
│  !wasAuth &&    │ → Transition non-auth → auth
│  isAuth         │
└────────┬────────┘
         │ 3. Recharger
         ↓
┌─────────────────┐
│  clearCache()   │ → Vider ancien cache
│  loadFlowAlerts │ → Force refresh
└────────┬────────┘
         │ 4. Nouveau token utilisé
         ↓
┌─────────────────┐
│  API avec       │ ✅ Données chargées
│  nouveau token  │
└─────────────────┘
```

**Fichiers concernés :**
- `components/FlowAlerts.tsx` → `useEffect()` avec `authLoading`, `user`
- `context/AuthContext.tsx` → État global d'authentification

---

## 🏗️ Workflow de Build & Déploiement

### Vue d'ensemble

Le workflow utilise **AWS Amplify** pour le déploiement automatique. Chaque push sur `main` déclenche un build et un déploiement.

---

### 1. Workflow Amplify (amplify.yml)

```
┌─────────────────┐
│  Push GitHub    │ → origin/main
└────────┬────────┘
         │ 1. Webhook déclenché
         ↓
┌─────────────────┐
│  AWS Amplify    │ → Détecte nouveau commit
│  Webhook        │
└────────┬────────┘
         │ 2. Clone repo
         ↓
┌─────────────────┐
│  Git Clone      │ → 810f705bb2f8...
└────────┬────────┘
         │ 3. Pre-Build Phase
         ↓
┌─────────────────┐
│  npm ci         │ → Installation dépendances
│  node --version │ → Debug logs
└────────┬────────┘
         │ 4. Build Phase
         ↓
┌─────────────────┐
│  npm run build  │ → next build
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Échec    Succès
    │         │
    ↓         ↓
┌───────┐ ┌─────────────────┐
│ ❌    │ │ ✅ Build OK     │
│ Build │ │ - .next/        │
│ Failed│ │ - Static pages  │
└───────┘ └────────┬────────┘
                   │ 5. Artifacts
                   ↓
          ┌─────────────────┐
          │  .next/**/*     │ → Deploy vers CDN
          └─────────────────┘
```

**Fichiers concernés :**
- `amplify.yml` → Configuration du build
- `package.json` → Scripts de build

**Phases détaillées :**

#### Phase 1 : Pre-Build
```yaml
preBuild:
  commands:
    - npm ci                    # Installation propre
    - echo "Node version:"      # Debug
    - node --version
    - echo "NPM version:"
    - npm --version
```

**Durée** : ~20-30 secondes

#### Phase 2 : Build
```yaml
build:
  commands:
    - echo "Starting build..."
    - npm run build             # next build
```

**Durée** : ~1-2 minutes

**Processus Next.js :**
1. Compilation TypeScript
2. Linting et validation de types
3. Collecte des données de pages
4. Génération des pages statiques
5. Optimisation des assets
6. Création des chunks JS

#### Phase 3 : Artifacts
```yaml
artifacts:
  baseDirectory: .next
  files:
    - '**/*'
```

Les fichiers sont déployés sur **CloudFront CDN**.

#### Phase 4 : Cache
```yaml
cache:
  paths:
    - node_modules/**/*
    - .next/cache/**/*
```

Le cache accélère les builds suivants.

---

### 2. Gestion des erreurs de build

```
┌─────────────────┐
│  Build échoue   │
└────────┬────────┘
         │ 1. Erreur détectée
         ↓
┌─────────────────┐
│  Types d'erreur │
│  possibles:     │
│  - TypeScript   │
│  - Linting      │
│  - Runtime      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  TypeScript  Autres
    │         │
    ↓         ↓
┌─────────┐ ┌──────────────┐
│ Erreur  │ │ Erreur de    │
│ de type │ │ compilation  │
│ (ex:    │ │ (ex: syntaxe)│
│ AuthMod │ │              │
│ Provider│ │              │
└─────────┘ └──────────────┘
```

**Exemple d'erreur résolue :**

```
Failed to compile.

./app/layout.tsx:27:12
Type error: 'AuthModalProvider' cannot be used as a JSX component.
```

**Solution appliquée :**
- Suppression du fichier dupliqué `useAuthModal.ts`
- Correction du type de retour dans `useAuthModal.tsx`

---

### 3. Variables d'environnement

```
┌─────────────────┐
│  .env.local     │ → Variables locales
│  (développement)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  AWS Amplify    │ → Variables d'environnement
│  Console        │   configurées manuellement
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Build process  │ → process.env.*
│  (npm run build)│
└─────────────────┘
```

**Variables requises :**

| Variable | Description | Utilisée dans |
|----------|-------------|---------------|
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | ID du pool Cognito | `lib/auth/config.ts` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Client ID Cognito | `lib/auth/config.ts` |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Domaine Cognito | `lib/auth/config.ts` |
| `NEXT_PUBLIC_AWS_REGION` | Région AWS | `lib/auth/config.ts` |
| `NEXT_PUBLIC_API_URL` | URL API principale | `lib/api/baseClient.ts` |
| `NEXT_PUBLIC_API_URL_2` | URL API Flow Alerts | `lib/api/flowAlertsClient.ts` |

**Configuration Amplify :**
1. AWS Amplify Console
2. App Settings → Environment Variables
3. Ajouter chaque variable
4. Redéployer

---

## 🏛️ Architecture Client-Service-Component

### Pattern utilisé

L'application suit le pattern **Client-Service-Component** pour une séparation claire des responsabilités.

```
┌─────────────────────────────────────────┐
│           COMPONENT LAYER               │
│  (UI, State, User Interactions)        │
│  - FlowAlerts.tsx                      │
│  - Header.tsx                          │
│  - AuthModal.tsx                       │
└────────────┬────────────────────────────┘
             │ Calls
             ↓
┌─────────────────────────────────────────┐
│            SERVICE LAYER                │
│  (Business Logic, Cache, Transform)    │
│  - flowAlertsService.ts                │
│  - authService.ts                      │
└────────────┬────────────────────────────┘
             │ Uses
             ↓
┌─────────────────────────────────────────┐
│            CLIENT LAYER                 │
│  (HTTP Requests, Auth, Error Handling) │
│  - flowAlertsClient.ts                 │
│  - baseClient.ts                       │
└────────────┬────────────────────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────────────┐
│          EXTERNAL APIs                  │
│  - AWS Cognito                         │
│  - Unusual Whales API                  │
└─────────────────────────────────────────┘
```

---

### 1. Component Layer

**Responsabilités :**
- Affichage UI
- Gestion de l'état local (React hooks)
- Interactions utilisateur (clics, formulaires)
- Appels aux services

**Exemple : `components/FlowAlerts.tsx`**

```typescript
// État local
const [alerts, setAlerts] = useState<FlowAlert[]>([])
const [loading, setLoading] = useState(true)
const [activePreset, setActivePreset] = useState<string | null>(null)

// Appel service
const response = await flowAlertsService.getFlowAlerts(params, forceRefresh)
setAlerts(response.data) // Mise à jour état local
```

**Ne fait PAS :**
- ❌ Requêtes HTTP directes
- ❌ Logique métier complexe
- ❌ Cache de données

---

### 2. Service Layer

**Responsabilités :**
- Logique métier
- Cache en mémoire
- Transformation de données
- Formatage pour l'affichage

**Exemple : `services/flowAlertsService.ts`**

```typescript
class FlowAlertsService {
  private cache: Map<string, CacheEntry>
  private cacheTimeout: number

  async getFlowAlerts(params?: FlowAlertsParams, forceRefresh = false) {
    // 1. Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && !forceRefresh) {
      return cached.data // Return cached
    }

    // 2. Call client
    const response = await flowAlertsClient.getFlowAlerts(params)

    // 3. Validate
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response')
    }

    // 4. Cache
    this.cache.set(cacheKey, { data: response, timestamp: Date.now() })

    // 5. Return
    return response
  }

  formatPremium(premium: string | number): string {
    // Transformation pour affichage
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    // ...
  }

  getWhaleScore(alert: FlowAlert): number | 'WHALE' {
    // Calcul métier
    // ...
  }
}
```

**Ne fait PAS :**
- ❌ Requêtes HTTP directes (utilise le client)
- ❌ Gestion de l'UI

---

### 3. Client Layer

**Responsabilités :**
- Requêtes HTTP
- Authentification automatique
- Gestion des erreurs HTTP
- Parsing des réponses

**Exemple : `lib/api/baseClient.ts`**

```typescript
class BaseApiClient {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // 1. Get token
    const token = this.getToken(options.tokenType)
    if (!token) throw new Error('Not authenticated')

    // 2. Add Authorization header
    requestHeaders['Authorization'] = `Bearer ${token}`

    // 3. HTTP request
    const response = await fetch(url, { headers: requestHeaders })

    // 4. Error handling
    if (!response.ok) {
      if (response.status === 401) {
        authService.clearTokens() // Auto-cleanup
      }
      throw new Error(errorMessage)
    }

    // 5. Parse response
    return await response.json()
  }
}
```

**Ne fait PAS :**
- ❌ Cache de données
- ❌ Logique métier
- ❌ Transformation de données

---

### Avantages de cette architecture

| Aspect | Avantage |
|--------|----------|
| **Séparation des responsabilités** | Chaque couche a un rôle clair |
| **Réutilisabilité** | Services réutilisables par plusieurs components |
| **Testabilité** | Chaque couche peut être testée indépendamment |
| **Maintenabilité** | Changements isolés à une couche |
| **Performance** | Cache centralisé au niveau service |

---

## 🧭 Workflow de Navigation

### Structure des routes

```
/ (home)
├── Header (global)
├── Hero
├── Features
└── Footer

/dashboard
├── Header (global)
├── Dashboard Content
│   └── FlowAlerts Component
└── Footer
```

---

### Workflow Header global

```
┌─────────────────┐
│  app/layout.tsx │ → Wrapper global
└────────┬────────┘
         │
         ├─→ <Header />        → Affiché partout
         ├─→ {children}        → Contenu page
         └─→ <AuthModalWrapper /> → Modal globale
```

**Avantages :**
- ✅ Header identique sur toutes les pages
- ✅ Modal d'auth accessible partout
- ✅ État d'authentification synchronisé

---

### Workflow de protection des routes

```
┌─────────────────┐
│  /dashboard     │
└────────┬────────┘
         │ 1. Page load
         ↓
┌─────────────────┐
│  AuthGuard      │ → Vérifie isAuthenticated()
│  Component      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  NON       OUI
    │         │
    ↓         ↓
┌───────┐ ┌─────────────────┐
│Redirect│ │  Render page   │
│ /auth │ │  /dashboard     │
└───────┘ └─────────────────┘
```

**Fichiers concernés :**
- `components/AuthGuard.tsx` → Protection des routes
- `app/dashboard/page.tsx` → Wrapped avec `<AuthGuard>`

---

## 📈 Flux de données complet : Exemple Flow Alerts

### Scénario : Utilisateur recherche NVDA avec preset Vol Spike

```
1. Utilisateur arrive sur /dashboard
   ↓
2. AuthGuard vérifie l'authentification
   ↓
3. FlowAlerts component monte
   ↓
4. useEffect initial → loadFlowAlerts()
   ↓
5. Service check cache → Pas de cache
   ↓
6. Client construit URL → /flow-alerts?min_premium=1000000&limit=100
   ↓
7. BaseClient récupère token → localStorage.getItem('cognito_access_token')
   ↓
8. Requête HTTP → GET /flow-alerts + Authorization: Bearer <token>
   ↓
9. API Gateway vérifie JWT → AWS Cognito
   ↓
10. API retourne données → 100 alertes
    ↓
11. Service valide → response.data est array
    ↓
12. Service cache → Map.set(cacheKey, { data, timestamp })
    ↓
13. Service transforme → formatPremium(), getWhaleScore()
    ↓
14. Component setAlerts() → React re-render
    ↓
15. UI affiche → Table avec 100 alertes

16. Utilisateur clique 🔥 Vol Spike
    ↓
17. handlePresetClick() → setActivePreset('volatility-spike')
    ↓
18. clearCache() → Service cache cleared
    ↓
19. loadFlowAlerts(undefined, true, { min_iv_change: 0.01, ... })
    ↓
20. Service → Pas de cache, appel client
    ↓
21. Client → URL avec preset params
    ↓
22. API → Retourne 15 alertes (pré-filtrées)
    ↓
23. Service filterByPreset() → Filtre IV change côté frontend
    ↓
24. Component setAlerts() → 7 alertes finales
    ↓
25. UI affiche → 7 alertes avec badge 🔥

26. Utilisateur tape "NVDA"
    ↓
27. handleTickerSearch() → setActiveTicker("NVDA")
    ↓
28. clearCache() → Service cache cleared
    ↓
29. loadFlowAlerts("NVDA", true, presetParams)
    ↓
30. Service → Nouveau cache key avec ticker
    ↓
31. Client → URL avec ticker_symbol=NVDA
    ↓
32. API → Retourne 34 alertes NVDA
    ↓
33. Service filterByPreset() → Filtre IV change
    ↓
34. Component setAlerts() → 0 alertes (NVDA n'a pas de spike ≥1%)
    ↓
35. UI affiche → "Aucune alerte trouvée"
```

---

## 🔄 Cycle de vie des données

### Cache lifecycle

```
1. Premier chargement
   → Pas de cache
   → Appel API
   → Cache créé (timestamp: Date.now())

2. Deuxième chargement (mêmes params)
   → Cache trouvé
   → Vérifie expiration (Date.now() - timestamp < 2 minutes)
   → Retourne cache (pas d'appel API)

3. Chargement avec params différents
   → Nouveau cache key
   → Pas de cache
   → Appel API
   → Nouveau cache créé

4. Force refresh
   → clearCache() appelé
   → Cache vidé
   → Appel API
   → Nouveau cache créé
```

**Timeout du cache** : 2 minutes (configurable dans `flowAlertsService.ts`)

---

## 🛠️ Utilitaires et helpers

### Formatage de données

| Méthode | Service | Description |
|---------|---------|-------------|
| `formatPremium()` | `flowAlertsService` | `$9.1M` au lieu de `9100000` |
| `formatDate()` | `flowAlertsService` | `19:23:57` depuis ISO string |
| `formatExpiry()` | `flowAlertsService` | `JAN 15, 27` depuis date |
| `getSentiment()` | `flowAlertsService` | `{ label: 'Bullish', color: 'emerald' }` |
| `getWhaleScore()` | `flowAlertsService` | `85` ou `'WHALE'` |
| `getIVChange()` | `flowAlertsService` | `0.05` (5%) depuis `iv_start` et `iv_end` |

---

## 🎯 Résumé des workflows

### Workflow d'authentification
1. Inscription → Confirmation → Connexion
2. Tokens stockés dans localStorage
3. Tokens automatiquement inclus dans les requêtes API
4. Expiration gérée automatiquement

### Workflow Flow Alerts
1. Chargement initial avec vérification d'auth
2. Cache pour optimiser les performances
3. Presets pour filtrage intelligent
4. Recherche par ticker
5. Filtrage frontend pour paramètres non supportés par l'API

### Workflow Build
1. Push GitHub → Webhook Amplify
2. Clone repo → npm ci → npm run build
3. Déploiement sur CloudFront CDN
4. Cache pour accélérer les builds suivants

---

## 📚 Fichiers clés par workflow

### Authentification
- `components/AuthModal.tsx` → UI
- `components/AuthModalWrapper.tsx` → Wrapper modal
- `components/useAuthModal.tsx` → Hook modal state
- `context/AuthContext.tsx` → État global
- `lib/auth/authService.ts` → Logique Cognito
- `lib/auth/config.ts` → Configuration

### Flow Alerts
- `components/FlowAlerts.tsx` → UI principale
- `services/flowAlertsService.ts` → Cache + logique métier
- `lib/api/flowAlertsClient.ts` → Client API spécifique
- `lib/api/baseClient.ts` → Client API de base

### Build & Déploiement
- `amplify.yml` → Configuration Amplify
- `package.json` → Scripts et dépendances
- `next.config.js` → Configuration Next.js

---

## 🚀 Prochaines améliorations possibles

1. **WebSocket pour données temps réel**
   - Remplace le polling
   - Updates instantanés

2. **Service Worker pour cache offline**
   - Cache persistant
   - Mode offline

3. **Optimistic updates**
   - UI mise à jour immédiatement
   - Sync avec serveur en background

4. **Error boundaries**
   - Gestion d'erreurs globale
   - Fallback UI

---

**Documentation créée le :** 2025-12-26  
**Version :** 1.0  
**Dernière mise à jour :** Après correction des problèmes de build Amplify


