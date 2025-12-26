# Guide de Migration Frontend Complet

Ce document récapitule tous les éléments nécessaires pour migrer vers une nouvelle application frontend.

## 📚 Documentation disponible

### Authentification
- **`AUTHENTICATION_INITIALIZATION.md`** - Guide complet d'initialisation de l'authentification
- **`AUTH_QUICK_START.md`** - Guide rapide (5 minutes)

### API
- **`API_IMPLEMENTATION_GUIDE.md`** - Guide complet d'implémentation des API
- **`API_QUICK_START.md`** - Guide rapide (5 minutes)

### Déploiement
- **`DEPLOYMENT_COMPLETE_GUIDE.md`** - Guide complet de déploiement
- **`DEPLOYMENT_QUICK_START.md`** - Guide rapide (5 minutes)

### Références
- **`API_ENDPOINTS_REFERENCE.md`** - Liste des endpoints disponibles

---

## 🎯 Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────┐
│         Composants React                │
│  (Pages, Components, Hooks)             │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         Services                        │
│  (Logique métier + Cache)              │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         Clients API                     │
│  (Requêtes HTTP spécialisées)           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         BaseClient                      │
│  (Authentification + Configuration)     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         AuthService                     │
│  (Gestion des tokens Cognito)           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         API Gateway                     │
│  (Backend AWS)                          │
└─────────────────────────────────────────┘
```

---

## 🚀 Étapes de migration

### Phase 1 : Configuration de base

1. **Variables d'environnement**
   ```env
   NEXT_PUBLIC_AWS_REGION=eu-west-3
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
   NEXT_PUBLIC_COGNITO_CLIENT_ID=...
   NEXT_PUBLIC_COGNITO_DOMAIN=...
   NEXT_PUBLIC_API_URL=...
   ```

2. **Installation des dépendances**
   ```bash
   npm install @aws-sdk/client-cognito-identity-provider
   ```

### Phase 2 : Authentification

1. **Copier les fichiers d'authentification**
   - `lib/auth/config.js`
   - `lib/auth/cognitoClient.js`
   - `lib/auth/authService.js`
   - `lib/auth/errors.js`
   - `context/AuthContext.js`
   - `hooks/useAuth.js`

2. **Initialiser dans `_app.js`**
   ```javascript
   import { AuthProvider } from '/context/AuthContext';
   
   function MyApp({ Component, pageProps }) {
     return (
       <AuthProvider>
         <Component {...pageProps} />
       </AuthProvider>
     );
   }
   ```

3. **Créer les pages d'authentification**
   - Page de connexion
   - Page d'inscription
   - Page de confirmation

### Phase 3 : Clients API

1. **Copier le client de base**
   - `lib/api/baseClient.js`

2. **Créer ou copier les clients spécialisés**
   - `lib/api/client.js` (pour APIs 13F - ID Token)
   - `lib/api/fmpUnusualWhalesClient.js` (pour FMP/UW - Access Token)
   - `lib/api/tickerActivityClient.js` (pour Ticker Activity - Access Token)
   - `lib/api/intelligenceClient.js` (pour Intelligence - Access Token)

### Phase 4 : Services

1. **Créer ou copier les services**
   - `services/marketService.js`
   - `services/tickerActivityService.js`
   - `services/intelligenceService.js`
   - Autres services selon besoins

2. **Adapter les services** selon votre logique métier

### Phase 5 : Composants

1. **Créer les composants UI**
   - Utiliser les services pour récupérer les données
   - Gérer les états de chargement
   - Gérer les erreurs

2. **Protéger les routes**
   - Utiliser `AuthGuard` ou `withAuth`
   - Vérifier l'authentification

### Phase 6 : Déploiement

1. **Configurer AWS Amplify**
   - Créer l'application Amplify
   - Configurer les variables d'environnement
   - Connecter le repository GitHub

2. **Configurer GitHub Actions**
   - Copier les workflows
   - Configurer les secrets GitHub
   - Tester le déploiement

3. **Déployer**
   - Utiliser le script de déploiement
   - Vérifier le déploiement
   - Tester l'application en production

---

## 📁 Structure de fichiers recommandée

```
votre-app/
├── .env.local                    # Variables d'environnement
├── lib/
│   ├── auth/
│   │   ├── config.js
│   │   ├── cognitoClient.js
│   │   ├── authService.js
│   │   └── errors.js
│   └── api/
│       ├── baseClient.js
│       ├── client.js
│       ├── fmpUnusualWhalesClient.js
│       ├── tickerActivityClient.js
│       └── intelligenceClient.js
├── context/
│   └── AuthContext.js
├── hooks/
│   └── useAuth.js
├── services/
│   ├── marketService.js
│   ├── tickerActivityService.js
│   └── intelligenceService.js
├── components/
│   └── AuthGuard.js
├── pages/
│   ├── _app.js
│   ├── authentication/
│   │   ├── sign-in.js
│   │   └── sign-up.js
│   └── dashboards/
│       └── ...
└── package.json
```

---

## ✅ Checklist complète

### Configuration
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées
- [ ] `AuthProvider` ajouté dans `_app.js`

### Authentification
- [ ] Fichiers d'authentification copiés
- [ ] Pages de login/signup créées
- [ ] Protection des routes configurée
- [ ] Test de connexion/déconnexion fonctionne

### API
- [ ] `baseClient.js` copié
- [ ] Clients API créés/copiés
- [ ] Services créés/copiés
- [ ] Test d'appel API fonctionne

### Composants
- [ ] Composants utilisent les services
- [ ] Gestion des états de chargement
- [ ] Gestion des erreurs
- [ ] Cache fonctionne

### Tests
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Tokens stockés correctement
- [ ] Appels API avec authentification fonctionnent
- [ ] Déconnexion fonctionne
- [ ] Protection des routes fonctionne

### Déploiement
- [ ] Repository GitHub créé
- [ ] Secrets GitHub configurés
- [ ] Application Amplify créée
- [ ] Variables d'environnement configurées
- [ ] Workflows GitHub Actions configurés
- [ ] Déploiement testé et fonctionnel

---

## 🔑 Concepts clés

### Authentification

- **Tokens stockés** : `localStorage` (cognito_id_token, cognito_access_token, cognito_refresh_token)
- **Vérification** : Automatique via `authService.isAuthenticated()`
- **Utilisation** : Hook `useAuth()` dans les composants

### API

- **Architecture** : Component → Service → Client → BaseClient → API Gateway
- **Tokens** : Access Token (par défaut) ou ID Token (pour APIs spécifiques)
- **Cache** : Géré au niveau des services

### Services

- **Rôle** : Logique métier + Cache + Formatage
- **Cache** : Map en mémoire ou localStorage
- **Erreurs** : Transformation en messages utilisateur-friendly

---

## 🐛 Dépannage courant

### Problème : "Not authenticated"
**Solution** : Vérifier que `AuthProvider` est monté et que les tokens sont présents dans localStorage

### Problème : Erreur 401 sur les API
**Solution** : Vérifier que le token est inclus dans le header `Authorization: Bearer <token>`

### Problème : Redirection infinie
**Solution** : Vérifier que la page de login n'est pas protégée par `AuthGuard`

### Problème : Cache ne fonctionne pas
**Solution** : Vérifier que le service met bien en cache et que les clés de cache sont correctes

---

## 📖 Ressources

### Documentation interne
- `AUTHENTICATION_INITIALIZATION.md` - Authentification complète
- `AUTH_QUICK_START.md` - Authentification rapide
- `API_IMPLEMENTATION_GUIDE.md` - API complète
- `API_QUICK_START.md` - API rapide
- `API_ENDPOINTS_REFERENCE.md` - Liste des endpoints

### Documentation externe
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS SDK JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 💡 Conseils

1. **Commencez par l'authentification** : C'est la base de tout
2. **Testez chaque étape** : Ne passez à la suivante que si la précédente fonctionne
3. **Utilisez les services** : Ne pas appeler directement les clients depuis les composants
4. **Gérez le cache** : Améliore les performances et réduit les appels API
5. **Gérez les erreurs** : Toujours afficher des messages utilisateur-friendly

---

## 🎓 Exemple de migration complète

### 1. Configuration initiale

```bash
# Installer les dépendances
npm install @aws-sdk/client-cognito-identity-provider

# Créer .env.local
cat > .env.local << EOF
NEXT_PUBLIC_AWS_REGION=eu-west-3
NEXT_PUBLIC_COGNITO_USER_POOL_ID=votre_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=votre_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=votre_domaine
NEXT_PUBLIC_API_URL=https://votre-api-gateway
EOF
```

### 2. Structure de base

```bash
# Créer la structure
mkdir -p lib/auth lib/api context hooks services components
```

### 3. Copier les fichiers

```bash
# Authentification
cp -r lib/auth/* votre-app/lib/auth/
cp context/AuthContext.js votre-app/context/
cp hooks/useAuth.js votre-app/hooks/

# API
cp lib/api/baseClient.js votre-app/lib/api/
cp lib/api/*Client.js votre-app/lib/api/  # Selon besoins

# Services
cp services/*.js votre-app/services/  # Selon besoins
```

### 4. Initialiser dans `_app.js`

```javascript
import { AuthProvider } from '/context/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### 5. Tester

```javascript
// Test dans un composant
import { useAuth } from '/hooks/useAuth';

function TestComponent() {
  const { user, signIn, isAuthenticated } = useAuth();
  
  console.log('User:', user);
  console.log('Authenticated:', isAuthenticated());
  
  return <div>Test</div>;
}
```

---

## 📞 Support

Pour toute question :
1. Consultez d'abord la documentation correspondante
2. Vérifiez les exemples dans les guides
3. Consultez les fichiers source existants
4. Vérifiez les logs de la console et du backend

---

**Bon courage avec votre migration ! 🚀**

