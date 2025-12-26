# 🔥 Vol Spike Preset - Guide de Debug

## Problème identifié

Le preset **Vol Spike** ne fonctionnait pas comme attendu car :
1. L'API backend ne calcule probablement pas le paramètre `min_iv_change`
2. Les données API contiennent `iv_start` et `iv_end`, mais pas le changement d'IV
3. Beaucoup d'alertes ont des changements d'IV **très faibles** (<1%)

## Solution implémentée

### 1. Calcul côté frontend
- Ajout de `getIVChange()` dans `flowAlertsService`
- Calcule : `(iv_end - iv_start) / iv_start`
- Retourne un pourcentage (ex: 0.05 = +5%)

### 2. Filtrage côté frontend
- Ajout de `filterByPreset()` dans `flowAlertsService`
- Filtre les alertes APRÈS la réponse API
- Applique le critère `min_iv_change >= 0.05` (5%)

### 3. Affichage visuel
- Nouvelle colonne **IV Change** dans le tableau
- 🔥 **Rouge** : IV spike ≥ +5% (volatilité attendue)
- ❄️ **Vert** : IV chute ≥ -5% (volatilité en baisse)
- **Gris** : Changement < 5% (normal)

---

## Comment tester le preset Vol Spike

### Scénario de test : Détecter un événement sur NVDA

1. **Ouvre le Dashboard** : `/dashboard`

2. **Clique sur le preset** : 🔥 **Vol Spike**
   - Applique automatiquement :
     - `min_iv_change: 0.05` (+5% IV)
     - `min_volume: 5000`
     - `min_volume_oi_ratio: 1.5`
     - `min_open_interest: 1000`
     - `min_dte: 7` (expire dans 7+ jours)

3. **Tape "NVDA"** dans le champ de recherche

4. **Clique sur** 🔍 **Rechercher**

5. **Observe les résultats** :
   - Si tu vois des alertes avec 🔥 **+5%** ou plus dans la colonne **IV Change** → **SPIKE DÉTECTÉ** ✅
   - Si tu vois uniquement des changements faibles (-1%, +0.5%, etc.) → **Pas de spike actuellement**

---

## Pourquoi le preset peut ne rien retourner ?

### Cas 1 : Pas de spike d'IV récent
- NVDA n'a peut-être pas d'événement imminent en ce moment
- Les alertes récentes ont des changements d'IV normaux (<5%)
- **Solution** : Essaye un autre ticker (TSLA, AAPL, SPY)

### Cas 2 : Les données API sont limitées
- L'API retourne max 100 alertes (paramètre `limit: 100`)
- Les alertes avec gros IV spike peuvent être plus anciennes
- **Solution** : Augmente `limit` si possible ou rafraîchis souvent

### Cas 3 : Le calcul d'IV est précis mais les vrais spikes sont rares
- Un vrai "volatility spike" de +5% ou plus est **rare**
- C'est un signal **très fort** (earnings, FDA approval, etc.)
- **Solution** : Réduis le seuil à +3% pour plus de résultats

---

## Ajuster le seuil de sensibilité

Si tu veux **plus d'alertes Vol Spike**, réduis le seuil dans `/components/FlowAlerts.tsx` :

### Fichier : `components/FlowAlerts.tsx` (ligne ~79)

```typescript
{
  id: 'volatility-spike',
  name: 'Vol Spike',
  icon: '🔥',
  description: 'Anticipation de volatilité (+5% IV)',
  params: {
    min_iv_change: 0.03, // ← Changer de 0.05 à 0.03 = +3% au lieu de +5%
    min_volume: 5000,
    min_volume_oi_ratio: 1.5,
    min_open_interest: 1000,
    min_dte: 7,
  },
  color: 'red',
}
```

**Impact** :
- 0.05 (5%) → **Signal très fort**, peu de résultats
- 0.03 (3%) → **Signal fort**, plus de résultats
- 0.01 (1%) → **Signal faible**, beaucoup de résultats

---

## Exemple de données API

### Alerte avec spike d'IV (rare)
```json
{
  "ticker": "NVDA",
  "iv_start": "0.40",
  "iv_end": "0.43"
}
```
→ IV Change = `(0.43 - 0.40) / 0.40 = +7.5%` ✅ **SPIKE DÉTECTÉ** 🔥

### Alerte sans spike (normal)
```json
{
  "ticker": "TSLA",
  "iv_start": "0.416322",
  "iv_end": "0.416288"
}
```
→ IV Change = `(0.416288 - 0.416322) / 0.416322 = -0.008%` ❌ **Pas de spike**

---

## Commandes de debug dans la console

### 1. Vérifier les alertes chargées
```javascript
// Ouvre la console (F12)
// Inspecte window.__flowAlerts (si tu l'exportes pour debug)
console.log('Alertes:', window.__flowAlerts)
```

### 2. Calculer l'IV Change d'une alerte manuellement
```javascript
const alert = { iv_start: "0.40", iv_end: "0.42" }
const ivChange = (parseFloat(alert.iv_end) - parseFloat(alert.iv_start)) / parseFloat(alert.iv_start)
console.log('IV Change:', (ivChange * 100).toFixed(1) + '%') // +5.0%
```

### 3. Compter les alertes avec spike
```javascript
const alerts = [...] // Tes alertes
const spikes = alerts.filter(a => {
  const change = (parseFloat(a.iv_end) - parseFloat(a.iv_start)) / parseFloat(a.iv_start)
  return Math.abs(change) >= 0.05
})
console.log(`${spikes.length} alertes avec IV spike ≥ 5%`)
```

---

## Prochaines étapes

1. ✅ **Teste le preset Vol Spike** sur plusieurs tickers (NVDA, TSLA, AAPL, SPY)
2. ✅ **Observe la colonne IV Change** pour voir les changements réels
3. ✅ **Ajuste le seuil** si tu veux plus/moins de résultats
4. 📊 **Partage tes observations** : combien d'alertes avec spike ?

---

## Questions à te poser

- **Est-ce que tu vois des alertes avec 🔥 +5% ou plus ?**
  - Si **OUI** → Le preset fonctionne ! ✅
  - Si **NON** → Réduis le seuil à +3% ou essaye d'autres tickers

- **Est-ce que les alertes avec gros IV spike sont pertinentes ?**
  - Check si elles correspondent à des événements réels (earnings, news)

- **Combien d'alertes retournées vs combien avec spike ?**
  - Ex: 100 alertes → 3 avec spike = **3% de spikes** (réaliste)

