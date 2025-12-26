# Implémentation CI/CD Pipeline - Aura

Cette branche `feature/ci-cd-pipeline` contient l'implémentation complète du pipeline CI/CD pour le projet Aura.

## 📋 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`DEPLOYMENT_COMPLETE_GUIDE.md`** - Guide complet de déploiement
2. **`amplify.yml`** - Configuration AWS Amplify
3. **`.github/workflows/deploy-amplify.yml`** - Workflow CI/CD GitHub Actions
4. **`.github/workflows/ci.yml`** - Workflow CI pour les Pull Requests

### Fichiers modifiés

Aucun fichier modifié (déploiement 100% automatique)

## 🚀 Configuration requise

### 1. Secrets GitHub (Optionnel)

**Note** : Si AWS Amplify est connecté directement à GitHub, vous n'avez **pas besoin** de secrets. Le déploiement est automatique.

Si vous souhaitez déclencher manuellement les builds via API, vous pouvez configurer :
- `AWS_ACCESS_KEY_ID` (optionnel)
- `AWS_SECRET_ACCESS_KEY` (optionnel)
- `AMPLIFY_APP_ID` (optionnel)

### 2. AWS Amplify

1. Créer l'application Amplify
2. Connecter le repository GitHub
3. Configurer les variables d'environnement

### 3. Variables d'environnement

Dans AWS Amplify Console → **App settings** → **Environment variables** :

```env
NEXT_PUBLIC_AWS_REGION=eu-west-3
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
NEXT_PUBLIC_COGNITO_DOMAIN=...
NEXT_PUBLIC_API_URL=...
```

## 📝 Utilisation

### Déploiement automatique

Le déploiement se fait **automatiquement** à chaque push sur `main` :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

**C'est tout !** AWS Amplify détectera automatiquement le push et déploiera l'application.

### Déploiement manuel (optionnel)

Si nécessaire, vous pouvez déclencher un déploiement manuel via :
- AWS Amplify Console → **Redeploy this version**
- GitHub Actions → **Run workflow** (pour les tests uniquement)

## ✅ Checklist avant merge

- [ ] Secrets GitHub configurés
- [ ] Application Amplify créée et configurée
- [ ] Variables d'environnement configurées
- [ ] Test du build local : `npm run build`
- [ ] Test du workflow sur une branche de test
- [ ] Documentation lue et comprise

## 📚 Documentation

Consulter `DEPLOYMENT_COMPLETE_GUIDE.md` pour la documentation complète.

## 🔄 Prochaines étapes

1. Merger cette branche dans `main`
2. Configurer les secrets GitHub
3. Créer l'application Amplify
4. Tester le premier déploiement

---

**Branche créée le** : $(date)
**Auteur** : CI/CD Implementation

