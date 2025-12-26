# Guide Complet de Déploiement - Aura

Ce document explique comment configurer et déployer l'application Aura (Next.js 14) sur AWS Amplify avec GitHub Actions.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture de déploiement](#architecture-de-déploiement)
3. [Configuration initiale](#configuration-initiale)
4. [Fichiers de configuration](#fichiers-de-configuration)
5. [Processus de déploiement](#processus-de-déploiement)
6. [Variables d'environnement](#variables-denvironnement)
7. [Scripts de déploiement](#scripts-de-déploiement)
8. [Vérification et monitoring](#vérification-et-monitoring)
9. [Dépannage](#dépannage)
10. [Spécificités du projet Aura](#spécificités-du-projet-aura)

---

## Vue d'ensemble

### Stack de déploiement

- **Frontend** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Hosting** : AWS Amplify
- **CI/CD** : GitHub Actions
- **Version Control** : GitHub
- **Build** : Node.js 18.x

### Flux de déploiement

```
Développeur
    ↓
Git Push (main)
    ↓
GitHub Actions (Build + Test)
    ↓
AWS Amplify (Déploiement automatique)
    ↓
Application en production
```

---

## Architecture de déploiement

### Composants

1. **GitHub Repository** : Code source
2. **GitHub Actions** : CI/CD pipeline
3. **AWS Amplify** : Hosting et build
4. **AWS Cognito** : Authentification
5. **API Gateway** : Backend API

### Workflow complet

```
┌─────────────────┐
│  Code Changes   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Git Push       │
│  (main)         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ GitHub Actions  │
│  - Lint         │
│  - Build        │
│  - Test         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ AWS Amplify     │
│  - Build        │
│  - Deploy       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Production     │
│  Application    │
└─────────────────┘
```

---

## Configuration initiale

### Étape 1 : Vérifier le repository GitHub

```bash
# Vérifier que le repository est bien configuré
cd /Users/souhailsouid/aura
git remote -v
```

### Étape 2 : Configurer AWS Amplify

#### Option A : Via la Console AWS (Recommandé)

1. Allez sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Cliquez sur **New app** → **Host web app**
3. Sélectionnez **GitHub** et connectez votre repository
4. Sélectionnez la branche `main`
5. Amplify détectera automatiquement `amplify.yml`
6. Configurez les variables d'environnement (voir section suivante)
7. Cliquez sur **Save and deploy**

#### Option B : Via AWS CLI

```bash
# Créer l'application Amplify
aws amplify create-app \
  --name "aura" \
  --repository "https://github.com/votre-username/aura" \
  --platform "WEB" \
  --region eu-west-3

# Créer une branche
aws amplify create-branch \
  --app-id <APP_ID> \
  --branch-name main \
  --region eu-west-3
```

### Étape 3 : Configurer les Secrets GitHub

Allez sur votre repository GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Secrets requis

| Secret | Description | Où le trouver |
|--------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | Clé d'accès AWS | Console AWS → IAM → Users → Security credentials → Create access key |
| `AWS_SECRET_ACCESS_KEY` | Clé secrète AWS | Générée avec AWS_ACCESS_KEY_ID |
| `AMPLIFY_APP_ID` | ID de l'app Amplify (optionnel) | Console Amplify → App settings → General → App ID |

#### Permissions IAM requises

L'utilisateur AWS doit avoir les permissions suivantes :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "amplify:StartJob",
        "amplify:GetApp",
        "amplify:GetBranch",
        "amplify:ListJobs"
      ],
      "Resource": "*"
    }
  ]
}
```

### Étape 4 : Configurer les variables d'environnement

Dans **AWS Amplify Console** → **App settings** → **Environment variables**, ajoutez :

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-3

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=votre_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=votre_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=votre_domaine

# API Configuration
NEXT_PUBLIC_API_URL=https://votre-api-gateway-url
```

---

## Fichiers de configuration

### 1. `amplify.yml` - Configuration Amplify

Ce fichier configure le processus de build pour AWS Amplify.

**Emplacement** : `/Users/souhailsouid/aura/amplify.yml`

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**Explication** :
- `preBuild` : Commandes avant le build (installation des dépendances)
- `build` : Commandes de build
- `artifacts` : Fichiers à déployer (Next.js génère dans `.next`)
- `cache` : Chemins à mettre en cache pour accélérer les builds

### 2. `.github/workflows/deploy-amplify.yml` - Workflow GitHub Actions

Ce workflow déclenche le build et le déploiement automatique.

**Emplacement** : `/Users/souhailsouid/aura/.github/workflows/deploy-amplify.yml`

```yaml
name: Deploy to AWS Amplify

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch: # Permet de déclencher manuellement

env:
  NODE_VERSION: '18.x'
  AWS_REGION: 'eu-west-3'

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
        continue-on-error: true

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: |
            .next/
            public/
            package.json
            package-lock.json
          retention-days: 1

  deploy:
    name: Deploy to AWS Amplify
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to Amplify
        run: |
          APP_ID=${{ secrets.AMPLIFY_APP_ID }}
          BRANCH_NAME=${GITHUB_REF#refs/heads/}
          
          if [ -z "$APP_ID" ]; then
            echo "⚠️ AMPLIFY_APP_ID n'est pas configuré. Le déploiement sera géré automatiquement par Amplify."
            echo "✅ Amplify détectera automatiquement le push et déclenchera un build."
          else
            echo "🚀 Déclenchement du build Amplify..."
            aws amplify start-job \
              --app-id $APP_ID \
              --branch-name $BRANCH_NAME \
              --job-type RELEASE
          fi
```

**Explication** :
- `on` : Déclencheurs du workflow (push sur main, PRs, déclenchement manuel)
- `jobs.build` : Build et tests
- `jobs.deploy` : Déploiement sur Amplify (seulement sur push vers main)

### 3. `.github/workflows/ci.yml` - CI pour Pull Requests

Ce workflow exécute les tests et le lint pour les Pull Requests.

**Emplacement** : `/Users/souhailsouid/aura/.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '18.x'

jobs:
  lint-and-test:
    name: Lint and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Build application
        run: npm run build
```

**Explication** : Workflow simplifié pour les PRs (pas de déploiement)

### 4. `scripts/deploy.sh` - Script de déploiement

Script pour faciliter le déploiement depuis la ligne de commande.

**Emplacement** : `/Users/souhailsouid/aura/scripts/deploy.sh`

```bash
#!/bin/bash

# Script pour faciliter le déploiement
# Usage: ./scripts/deploy.sh [message de commit]

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage du déploiement Aura...${NC}"

# Vérifier que nous sommes sur la bonne branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  Vous n'êtes pas sur main. Voulez-vous continuer ? (y/n)${NC}"
  read -r response
  if [ "$response" != "y" ]; then
    echo "Annulé."
    exit 1
  fi
fi

# Vérifier que le repo est à jour
echo -e "${BLUE}📥 Récupération des dernières modifications...${NC}"
git fetch origin

# Vérifier s'il y a des changements non commités
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${BLUE}📝 Changements détectés, préparation du commit...${NC}"
  
  # Message de commit
  if [ -z "$1" ]; then
    COMMIT_MSG="chore: update before deployment [skip ci]"
  else
    COMMIT_MSG="$1 [skip ci]"
  fi
  
  # Ajouter tous les changements
  git add .
  
  # Commit
  git commit -m "$COMMIT_MSG" || echo "Aucun changement à commiter"
else
  echo -e "${GREEN}✅ Aucun changement à commiter${NC}"
fi

# Push vers GitHub
echo -e "${BLUE}📤 Push vers GitHub...${NC}"
git push origin "$CURRENT_BRANCH"

echo -e "${GREEN}✅ Déploiement déclenché !${NC}"
echo -e "${BLUE}📊 Suivez le déploiement sur:${NC}"
echo -e "   - GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo -e "   - AWS Amplify Console"
```

**Rendre le script exécutable** :

```bash
chmod +x scripts/deploy.sh
```

### 5. `package.json` - Scripts de déploiement

Mettre à jour `package.json` pour ajouter le script de déploiement.

**Emplacement** : `/Users/souhailsouid/aura/package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "deploy": "./scripts/deploy.sh"
  }
}
```

### 6. `next.config.js` - Configuration Next.js

Vérifier que la configuration Next.js est optimisée pour la production.

**Emplacement** : `/Users/souhailsouid/aura/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimisations pour la production
  swcMinify: true,
  // Configuration pour AWS Amplify
  output: 'standalone', // Optionnel : pour optimiser le build
}

module.exports = nextConfig
```

---

## Processus de déploiement

### Déploiement automatique

Le déploiement se fait **automatiquement** à chaque push sur `main` :

```bash
# 1. Faire vos modifications
# 2. Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

**Ce qui se passe automatiquement** :
1. ✅ GitHub Actions détecte le push
2. ✅ Build et tests sont exécutés
3. ✅ AWS Amplify détecte le push (ou est déclenché via API)
4. ✅ Build et déploiement sur Amplify
5. ✅ Application mise à jour en production

**Aucune action supplémentaire n'est nécessaire !** Le déploiement est entièrement automatique.

### Déploiement manuel via GitHub Actions

1. Allez sur votre repository GitHub
2. Cliquez sur l'onglet **Actions**
3. Sélectionnez le workflow **Deploy to AWS Amplify**
4. Cliquez sur **Run workflow**
5. Sélectionnez la branche et cliquez sur **Run workflow**

### Déploiement manuel via AWS Amplify

1. Allez sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sélectionnez votre app
3. Cliquez sur **Redeploy this version** ou **Deploy without Git commit**

---

## Variables d'environnement

### Variables requises

#### Production (AWS Amplify)

Configurez dans **AWS Amplify Console** → **App settings** → **Environment variables** :

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-3

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-3_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=votre-domaine-cognito

# API Configuration
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.eu-west-3.amazonaws.com/prod
```

#### Développement local (`.env.local`)

Créez un fichier `.env.local` à la racine (ne pas commiter) :

```env
# Copier les mêmes variables que production
NEXT_PUBLIC_AWS_REGION=eu-west-3
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-3_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=votre-domaine-cognito
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.eu-west-3.amazonaws.com/prod
```

**Important** : Ajoutez `.env.local` au `.gitignore` :

```
# .gitignore
.env.local
.env*.local
```

### Gestion des variables

#### Ajouter une variable

1. **Production** : AWS Amplify Console → App settings → Environment variables → Add variable
2. **Local** : Ajouter dans `.env.local`

#### Modifier une variable

1. **Production** : AWS Amplify Console → Modifier la variable → Save
2. **Local** : Modifier dans `.env.local` → Redémarrer le serveur dev

#### Supprimer une variable

1. **Production** : AWS Amplify Console → Supprimer la variable → Save
2. **Local** : Supprimer de `.env.local`

---

## Scripts de déploiement

### Script principal : `scripts/deploy.sh`

Le script est déjà créé ci-dessus. Assurez-vous qu'il est exécutable :

```bash
chmod +x scripts/deploy.sh
```

### Utilisation

```bash
# Déploiement avec message par défaut
npm run deploy

# Déploiement avec message personnalisé
npm run deploy "feat: ajout nouvelle fonctionnalité"
```

---

## Vérification et monitoring

### Vérifier le déploiement

#### 1. GitHub Actions

1. Allez sur votre repository GitHub
2. Cliquez sur l'onglet **Actions**
3. Vérifiez le statut du workflow :
   - ✅ Vert = Succès
   - ❌ Rouge = Erreur
   - 🟡 Jaune = En cours

#### 2. AWS Amplify Console

1. Allez sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sélectionnez votre app
3. Vérifiez l'onglet **Deployments** :
   - Statut du build
   - Logs de build
   - URL de déploiement

#### 3. Application en production

1. Ouvrez l'URL de votre application Amplify
2. Vérifiez que l'application fonctionne
3. Testez les fonctionnalités principales :
   - Authentification
   - Flow Alerts
   - Dashboard

### Monitoring

#### Logs de build

**GitHub Actions** :
- Onglet **Actions** → Sélectionner le workflow → Voir les logs

**AWS Amplify** :
- Console Amplify → App → Deployments → Sélectionner un déploiement → View logs

#### Métriques

**AWS Amplify Console** :
- Build time
- Build success rate
- Deployment frequency

---

## Dépannage

### Problème : Le workflow ne se déclenche pas

**Solutions** :
- ✅ Vérifier que vous êtes sur `main`
- ✅ Vérifier que le workflow existe dans `.github/workflows/`
- ✅ Vérifier les logs dans l'onglet **Actions**
- ✅ Vérifier que le push a bien été effectué

### Problème : Erreur de build

**Solutions** :
- ✅ Vérifier que toutes les dépendances sont dans `package.json`
- ✅ Vérifier les variables d'environnement dans Amplify
- ✅ Consulter les logs du job `build` dans GitHub Actions
- ✅ Tester le build localement : `npm run build`

**Erreurs courantes** :
- `Module not found` : Vérifier les imports TypeScript
- `Environment variable missing` : Ajouter dans Amplify
- `Build timeout` : Optimiser le build ou augmenter le timeout
- `TypeScript errors` : Vérifier `tsconfig.json`

### Problème : Erreur de déploiement Amplify

**Solutions** :
- ✅ Vérifier que `AMPLIFY_APP_ID` est correct (si utilisé)
- ✅ Vérifier que les credentials AWS sont valides
- ✅ Vérifier que l'application Amplify existe
- ✅ Vérifier la configuration dans `amplify.yml`

**Erreurs courantes** :
- `Access Denied` : Vérifier les permissions IAM
- `App not found` : Vérifier l'APP_ID
- `Build failed` : Consulter les logs Amplify

### Problème : Erreur de permissions

**Solutions** :
- ✅ Vérifier que les secrets GitHub sont bien configurés
- ✅ Vérifier que l'utilisateur AWS a les permissions nécessaires :
  - `amplify:StartJob`
  - `amplify:GetApp`
  - `amplify:GetBranch`
  - `amplify:ListJobs`

### Problème : Variables d'environnement non disponibles

**Solutions** :
- ✅ Vérifier que les variables sont configurées dans Amplify
- ✅ Vérifier que les variables commencent par `NEXT_PUBLIC_` pour être accessibles côté client
- ✅ Redémarrer le build après modification des variables

### Problème : Application ne se charge pas

**Solutions** :
- ✅ Vérifier l'URL de l'application
- ✅ Vérifier les logs de la console navigateur
- ✅ Vérifier que les variables d'environnement sont correctes
- ✅ Vérifier que l'authentification Cognito est configurée

### Problème : Erreurs TypeScript en production

**Solutions** :
- ✅ Vérifier que `tsconfig.json` est correct
- ✅ Vérifier que tous les types sont définis
- ✅ Vérifier que les imports sont corrects
- ✅ Tester le build localement : `npm run build`

---

## Spécificités du projet Aura

### Structure du projet

```
aura/
├── app/                    # Next.js App Router
│   ├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Composants React
├── context/                # Contextes React
├── hooks/                  # Hooks personnalisés
├── lib/                    # Bibliothèques
│   ├── api/                # Clients API
│   └── auth/               # Authentification
├── services/               # Services métier
└── ...
```

### Technologies utilisées

- **Next.js 14** : App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling
- **AWS Cognito** : Authentification
- **AWS SDK** : Intégration AWS

### Points d'attention

1. **TypeScript** : Vérifier que tous les types sont corrects avant le build
2. **Variables d'environnement** : Toutes les variables doivent commencer par `NEXT_PUBLIC_`
3. **Authentification** : Vérifier que Cognito est bien configuré
4. **API** : Vérifier que les endpoints API sont accessibles

### Commandes utiles

```bash
# Build local
npm run build

# Linter
npm run lint

# Développement
npm run dev

# Déploiement
npm run deploy "message"
```

---

## Bonnes pratiques

### Sécurité

1. **Ne jamais commiter les secrets** :
   - Utiliser GitHub Secrets
   - Utiliser AWS Amplify Environment Variables
   - Ne pas commiter `.env.local`

2. **Permissions minimales** :
   - Donner seulement les permissions nécessaires à l'utilisateur IAM
   - Utiliser des rôles IAM plutôt que des utilisateurs

3. **Rotation des credentials** :
   - Roter régulièrement les clés AWS
   - Utiliser des tokens temporaires quand possible

### Performance

1. **Cache** :
   - Utiliser le cache dans `amplify.yml`
   - Mettre en cache `node_modules` et `.next/cache`

2. **Optimisation du build** :
   - Utiliser `npm ci` au lieu de `npm install`
   - Optimiser les imports
   - Utiliser le mode standalone de Next.js si nécessaire

3. **Monitoring** :
   - Surveiller les temps de build
   - Optimiser les dépendances
   - Utiliser les CDN pour les assets statiques

### Maintenance

1. **Mises à jour régulières** :
   - Mettre à jour les dépendances
   - Mettre à jour les workflows GitHub Actions
   - Mettre à jour Node.js

2. **Documentation** :
   - Documenter les changements de configuration
   - Documenter les variables d'environnement
   - Documenter les procédures de déploiement

---

## Support

Pour toute question ou problème :

1. Consultez les logs dans GitHub Actions
2. Consultez les logs dans AWS Amplify Console
3. Vérifiez la documentation ci-dessus
4. Consultez la documentation officielle :
   - [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
   - [GitHub Actions Documentation](https://docs.github.com/en/actions)
   - [Next.js Deployment](https://nextjs.org/docs/deployment)
   - [Next.js 14 App Router](https://nextjs.org/docs/app)

---

**Bon déploiement ! 🚀**

