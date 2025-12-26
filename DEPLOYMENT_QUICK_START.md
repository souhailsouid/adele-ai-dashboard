# Guide Rapide de Déploiement

Guide condensé pour déployer rapidement l'application sur AWS Amplify.

## 🚀 Déploiement rapide (5 minutes)

### Option 1 : Script automatique (Recommandé)

```bash
npm run deploy "feat: nouvelle fonctionnalité"
```

### Option 2 : Commandes manuelles

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

---

## 📋 Configuration initiale

### 1. Secrets GitHub

Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Clé d'accès AWS |
| `AWS_SECRET_ACCESS_KEY` | Clé secrète AWS |
| `AMPLIFY_APP_ID` | ID de l'app Amplify (optionnel) |

### 2. AWS Amplify

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. **New app** → **Host web app**
3. Connecter GitHub repository
4. Sélectionner branche `main`
5. **Save and deploy**

### 3. Variables d'environnement

**AWS Amplify Console** → **App settings** → **Environment variables**

```env
NEXT_PUBLIC_AWS_REGION=eu-west-3
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
NEXT_PUBLIC_COGNITO_DOMAIN=...
NEXT_PUBLIC_API_URL=...
```

---

## 📁 Fichiers requis

### Structure minimale

```
votre-app/
├── amplify.yml                    # Configuration Amplify
├── .github/
│   └── workflows/
│       ├── deploy-amplify.yml    # Workflow de déploiement
│       └── ci.yml                # CI pour PRs
├── scripts/
│   └── deploy.sh                 # Script de déploiement
└── package.json                  # Scripts npm
```

### `amplify.yml`

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

### `package.json` - Scripts

```json
{
  "scripts": {
    "deploy": "./scripts/deploy.sh"
  }
}
```

---

## ✅ Checklist de migration

### Configuration

- [ ] Repository GitHub créé
- [ ] Secrets GitHub configurés
- [ ] Application Amplify créée
- [ ] Variables d'environnement configurées

### Fichiers

- [ ] `amplify.yml` copié
- [ ] `.github/workflows/deploy-amplify.yml` copié
- [ ] `.github/workflows/ci.yml` copié
- [ ] `scripts/deploy.sh` copié et exécutable

### Test

- [ ] Build local fonctionne : `npm run build`
- [ ] Push sur main déclenche le workflow
- [ ] Déploiement Amplify réussi
- [ ] Application accessible en production

---

## 🔑 Points clés

### Flux de déploiement

```
Push sur main/master
    ↓
GitHub Actions (Build + Test)
    ↓
AWS Amplify (Déploiement)
    ↓
Application en production
```

### Déclencheurs

- **Push sur main/master** : Build + Deploy
- **Pull Request** : Build + Test seulement
- **Workflow dispatch** : Déclenchement manuel

### Variables d'environnement

- **Production** : Configurées dans AWS Amplify Console
- **Local** : Fichier `.env.local` (ne pas commiter)

---

## 🐛 Dépannage rapide

| Problème | Solution |
|----------|----------|
| Workflow ne se déclenche pas | Vérifier branche main/master |
| Erreur de build | Vérifier variables d'environnement |
| Erreur de déploiement | Vérifier credentials AWS |
| Variables manquantes | Ajouter dans Amplify Console |

---

## 📚 Documentation complète

Pour plus de détails, consultez `DEPLOYMENT_COMPLETE_GUIDE.md`

---

## 💡 Commandes utiles

### Déploiement

```bash
# Script de déploiement
npm run deploy "message"

# Déploiement manuel
git add .
git commit -m "message"
git push origin main
```

### Vérification

```bash
# Build local
npm run build

# Linter
npm run lint

# Vérifier les secrets GitHub
# Repository → Settings → Secrets
```

### Monitoring

- **GitHub Actions** : Repository → Actions
- **AWS Amplify** : Console Amplify → App → Deployments

---

## 🔐 Sécurité

⚠️ **Important** :
- Ne jamais commiter les secrets
- Utiliser GitHub Secrets
- Utiliser AWS Amplify Environment Variables
- Ne pas commiter `.env.local`

---

## 📞 Support

1. Consulter les logs GitHub Actions
2. Consulter les logs AWS Amplify
3. Vérifier la documentation complète
4. Vérifier les permissions IAM

