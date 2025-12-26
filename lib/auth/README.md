# Architecture d'Authentification AWS Cognito

Cette architecture suit les meilleures pratiques de développement senior avec une séparation claire des responsabilités.

## Structure

```
lib/auth/
├── config.ts              # Configuration Cognito (singleton)
├── cognitoClient.ts       # Client AWS SDK (singleton)
├── authService.ts         # Service d'authentification (singleton)
└── errors.ts              # Gestion des erreurs et traductions

context/
└── AuthContext.tsx        # Context React pour l'état global

hooks/
└── useAuth.ts             # Hook personnalisé (alias)

components/
└── AuthGuard.tsx          # Composant de protection de routes

lib/api/
└── baseClient.ts          # Client API avec authentification automatique
```

## Design Patterns Utilisés

### 1. Singleton Pattern
- `authService`: Une seule instance pour toute l'application
- `cognitoClient`: Réutilisation de la connexion AWS
- `baseApiClient`: Client API partagé

### 2. Service Layer Pattern
- `authService` encapsule toute la logique d'authentification
- Séparation entre la logique métier et les composants React

### 3. Context Pattern
- `AuthProvider` gère l'état global d'authentification
- Accessible via `useAuth()` hook

### 4. Error Handling Pattern
- Traduction centralisée des erreurs Cognito
- Messages d'erreur utilisateur-friendly

## Configuration

Créez un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_AWS_REGION=eu-west-3
NEXT_PUBLIC_COGNITO_USER_POOL_ID=votre_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=votre_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=votre_domaine
NEXT_PUBLIC_API_URL=https://votre-api-gateway-url
```

## Utilisation

### Dans un composant

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, signIn, signOut, isAuthenticated } = useAuth()
  
  // Votre code
}
```

### Protection de route

```typescript
import AuthGuard from '@/components/AuthGuard'

function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Contenu protégé</div>
    </AuthGuard>
  )
}
```

### Appels API

```typescript
import baseApiClient from '@/lib/api/baseClient'

const data = await baseApiClient.get('/endpoint')
// Le token est automatiquement inclus
```

## Flux d'authentification

1. **Inscription**: `signUp()` → Email de confirmation
2. **Confirmation**: `confirmSignUp()` → Compte activé
3. **Connexion**: `signIn()` → Tokens stockés
4. **Utilisation**: Tokens automatiquement inclus dans les requêtes API
5. **Déconnexion**: `signOut()` → Tokens supprimés

## Sécurité

- Tokens stockés dans `localStorage` (peut être migré vers httpOnly cookies)
- Vérification d'expiration automatique
- Nettoyage des tokens en cas d'erreur 401
- Validation des tokens avant chaque requête importante

