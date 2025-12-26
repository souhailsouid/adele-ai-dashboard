# 🎯 Flow Alerts - Comparaison des Presets

## 📊 Vue d'ensemble : Les 3 presets institutionnels

Voici les différences entre **🐋 Whale Hunt**, **⚡ Aggressive Flow**, et **🏢 Institutional OTC** :

---

## 1️⃣ 🐋 Whale Hunt - "La Baleine Discrète"

### Concept
Détecte les **positions massives** prises de manière **discrète** par les institutionnels.

### Critères (paramètres API)
```typescript
{
  vol_greater_oi: true,        // Volume > Open Interest
  is_floor: true,              // Floor trade (OTC)
  min_volume: 10,000,          // Volume très élevé
  min_open_interest: 1,000,    // OI minimum
  min_dte: 7,                  // Expire dans 7+ jours
}
```

### Ce qu'il cible
- 🐋 **Positions nouvelles MASSIVES** (Volume > OI)
- 🤝 **Trades OTC** (négociés hors marché)
- 📅 **Vision long-terme** (>7 jours)
- 🎯 **Très sélectif** (volume ≥10K)

### Exemple de trade capturé
```
Ticker: TSLA
Type: CALL Floor Trade
Volume: 15,000
Open Interest: 8,000  → Vol > OI ✅
Premium: $50M
Expiry: 30 jours
```

**Interprétation** : Un gros institutionnel ouvre une **nouvelle position massive** de manière discrète.

### Cas d'usage
✅ Détecter les **convictions institutionnelles** (hedge funds, family offices)  
✅ Identifier les **accumulations discrètes** avant mouvement  
✅ Focus sur les **positions long-terme**

---

## 2️⃣ ⚡ Aggressive Flow - "L'Acheteur Pressé"

### Concept
Détecte les **achats agressifs** avec **urgence** et **conviction forte**.

### Critères (paramètres API)
```typescript
{
  is_sweep: true,              // Sweep uniquement
  min_volume_oi_ratio: 2.0,    // Vol/OI ≥ 2x
  min_volume: 5,000,           // Volume élevé
  min_open_interest: 1,000,    // OI minimum
  min_dte: 7,                  // Expire dans 7+ jours
}
```

### Ce qu'il cible
- ⚡ **Sweeps** (achats multi-exchanges simultanés)
- 🚀 **Momentum fort** (Vol/OI ≥ 2x)
- ⏰ **Urgence** (on n'attend pas le meilleur prix)
- 💪 **Conviction forte** (on achète agressivement)

### Exemple de trade capturé
```
Ticker: NVDA
Type: CALL SWEEP
Volume: 8,000
Open Interest: 3,000  → Ratio 2.67x ✅
Premium: $15M
Expiry: 14 jours
Spread: Bid $10.05 / Ask $10.50
→ Acheté à $10.50 (au Ask) ✅
```

**Interprétation** : Quelqu'un **paye le prix fort** pour entrer **immédiatement** (ne négocie pas).

### Cas d'usage
✅ Détecter les **paris urgents** (earnings imminents, news)  
✅ Identifier les **convictions fortes** (on paye cher pour entrer vite)  
✅ Focus sur les **mouvements rapides**

---

## 3️⃣ 🏢 Institutional OTC - "Le Club Privé"

### Concept
Détecte les **trades institutionnels OTC** sur les **grosses capitalisations**.

### Critères (paramètres API)
```typescript
{
  is_floor: true,                              // Floor trade uniquement
  min_volume: 3,000,                           // Volume modéré
  min_open_interest: 1,000,                    // OI minimum
  rule_name: ['FloorTradeLargeCap',            // Large cap floor
               'FloorTradeMidCap'],            // Mid cap floor
}
```

### Ce qu'il cible
- 🏢 **Floor trades** (OTC institutionnel)
- 🎯 **Large/Mid caps** (règles spécifiques)
- 🤝 **Négociations privées** (hors marché)
- 📊 **Blocs institutionnels**

### Exemple de trade capturé
```
Ticker: AAPL
Type: CALL Floor Trade
Volume: 5,000
Rule: FloorTradeLargeCap ✅
Premium: $8M
Expiry: 45 jours
```

**Interprétation** : Un institutionnel négocie un **bloc d'options** hors marché (pas de spread visible).

### Cas d'usage
✅ Détecter les **deals institutionnels** (banques, hedge funds)  
✅ Identifier les **transactions de gros blocs**  
✅ Focus sur les **large/mid caps**

---

## 📊 Tableau comparatif

| Critère | 🐋 Whale Hunt | ⚡ Aggressive Flow | 🏢 Institutional OTC |
|---------|--------------|------------------|---------------------|
| **Type de trade** | Floor (OTC) | Sweep (multi-exchanges) | Floor (OTC) |
| **Volume minimum** | **10,000** (très élevé) | 5,000 (élevé) | **3,000** (modéré) |
| **Critère principal** | **Vol > OI** | **Sweep** | **Large/Mid cap** |
| **Ratio Vol/OI** | N/A (mais > 1x implicite) | **≥ 2.0x** | N/A |
| **Règles spécifiques** | ❌ | ❌ | ✅ FloorTradeLargeCap |
| **Conviction** | 🐋 **Très forte** | ⚡ **Urgente** | 🏢 **Institutionnelle** |
| **Timing** | Long-terme | Court-terme | Moyen-terme |
| **Résultats attendus** | 3-8/jour | 10-20/jour | 5-15/jour |

---

## 🎯 Quand utiliser chaque preset ?

### Scénario 1 : "Je veux détecter les grosses convictions institutionnelles"
**→ Utilise 🐋 Whale Hunt**

```bash
Exemple :
- Hedge fund achète 20,000 calls TSLA
- Open Interest était de 5,000 → Volume > OI ✅
- Floor trade → Discret ✅
- Expiration 60 jours → Vision long-terme ✅

Signal : Conviction TRÈS forte sur TSLA
```

---

### Scénario 2 : "Je veux détecter les paris urgents (earnings, news)"
**→ Utilise ⚡ Aggressive Flow**

```bash
Exemple :
- Quelqu'un achète 10,000 calls NVDA en SWEEP
- Paye le ASK (pas de négociation)
- Ratio Vol/OI = 3.5x → Très agressif ✅
- Expiration 7 jours → Court-terme ✅

Signal : Quelqu'un sait quelque chose d'imminent
```

---

### Scénario 3 : "Je veux voir ce que les institutions font sur les mega-caps"
**→ Utilise 🏢 Institutional OTC**

```bash
Exemple :
- Goldman Sachs négocie un bloc de 8,000 calls AAPL
- Floor trade (OTC, pas de spread visible)
- Rule: FloorTradeLargeCap ✅
- Premium: $12M

Signal : Positionnement institutionnel sur large cap
```

---

## 🔍 Comparaison sur un exemple réel : TSLA

Imaginons cette alerte TSLA apparaît :

```
Ticker: TSLA
Type: CALL Floor Trade
Volume: 12,000
Open Interest: 8,000
Ratio Vol/OI: 1.5x
Premium: $35M
Expiry: 30 jours
Rule: FloorTradeMidCap
```

### Est-ce que cette alerte apparaîtrait dans chaque preset ?

| Preset | Apparaît ? | Pourquoi ? |
|--------|-----------|-----------|
| 🐋 **Whale Hunt** | ✅ **OUI** | Vol (12K) > OI (8K) ✅ + Floor ✅ + Vol ≥ 10K ✅ |
| ⚡ **Aggressive Flow** | ❌ **NON** | Pas un SWEEP (c'est un Floor) ❌ |
| 🏢 **Institutional OTC** | ✅ **OUI** | Floor ✅ + Rule FloorTradeMidCap ✅ |

**Résultat** : Cette alerte apparaît dans **Whale Hunt** et **Institutional OTC**, mais PAS dans **Aggressive Flow**.

---

## 💡 Combinaison des presets (stratégie avancée)

### Stratégie 1 : "Confirmation multi-presets"

```bash
1. Utilise 🐋 Whale Hunt → Trouve TSLA avec Vol > OI
2. Vérifie ⚡ Aggressive Flow → Y a-t-il aussi des sweeps ?
3. Si OUI → Conviction DOUBLE (Floor + Sweep) ✅

Interprétation :
- Floor trade = Institutionnel discret
- Sweep agressif = Retail/algo urgent
- Les deux = SIGNAL TRÈS FORT
```

---

### Stratégie 2 : "Filtrage progressif"

```bash
1. Commence avec 🏢 Institutional OTC (large scope)
   → Identifie les tickers avec activité institutionnelle

2. Focus sur un ticker intéressant (ex: AAPL)

3. Lance ⚡ Aggressive Flow sur AAPL
   → Vérifie s'il y a aussi des achats urgents

4. Lance 🐋 Whale Hunt sur AAPL
   → Vérifie s'il y a des positions massives
```

---

## 📈 Exemple pratique avec TSLA

### Situation : Tu veux analyser TSLA

**Étape 1 : Whale Hunt + TSLA**
```
Résultat : 2 alertes
- Call $440C : Volume 15K, OI 5K → Vol > OI ✅
- Put $420P : Volume 8K, OI 3K → Vol > OI ✅

Signal : Positions nouvelles massives (accumulation)
```

**Étape 2 : Aggressive Flow + TSLA**
```
Résultat : 5 alertes
- Call Sweep $440C : Premium $24.8M, Ratio 2.5x
- Call Sweep $450C : Premium $5M, Ratio 3.1x
- Put Sweep $430P : Premium $3M, Ratio 2.8x

Signal : Achats urgents (conviction court-terme)
```

**Étape 3 : Institutional OTC + TSLA**
```
Résultat : 3 alertes
- Call Floor : $440C, Premium $18M
- Call Floor : $460C, Premium $12M

Signal : Deals institutionnels (négociations privées)
```

**Analyse combinée** :
- ✅ Whale Hunt + Aggressive Flow = Conviction FORTE
- ✅ Tous les 3 presets montrent activité = SIGNAL MAJEUR
- 🎯 Direction : Majorité CALLS = Bullish
- ⏰ Timing : Sweeps + Floor = Immédiat + Long-terme

**Conclusion** : TSLA a une **activité institutionnelle massive** avec **convictions fortes** sur plusieurs horizons de temps.

---

## 🎯 Récapitulatif : Quel preset pour quel besoin ?

| Besoin | Preset recommandé | Raison |
|--------|------------------|--------|
| **Convictions institutionnelles long-terme** | 🐋 Whale Hunt | Volume > OI = nouvelles positions |
| **Paris urgents / événements imminents** | ⚡ Aggressive Flow | Sweeps = urgence + conviction |
| **Activité institutionnelle large/mid caps** | 🏢 Institutional OTC | Focus règles spécifiques |
| **Découvrir des opportunités** | 🐋 Whale Hunt | Le plus sélectif (qualité > quantité) |
| **Suivre le momentum court-terme** | ⚡ Aggressive Flow | Détecte les mouvements rapides |
| **Voir ce que font les banques** | 🏢 Institutional OTC | Floor trades = deals privés |

---

## 🚀 Workflow recommandé

### Pour un trader actif (court-terme)
```bash
Matin : ⚡ Aggressive Flow (sans ticker)
→ Identifie les sweeps urgents
→ Trade dans la journée

Midi : 🐋 Whale Hunt (sans ticker)  
→ Vérifie si des positions massives se forment
→ Note pour swing trades

Soir : 🏢 Institutional OTC (sans ticker)
→ Analyse les deals institutionnels
→ Prépare positions pour demain
```

---

### Pour un investisseur (moyen-terme)
```bash
1-2x par semaine : 🐋 Whale Hunt (sans ticker)
→ Identifie les convictions institutionnelles
→ Recherche le "pourquoi"
→ Décide si ça rejoint ta thèse d'investissement
```

---

### Pour un analyste (recherche)
```bash
1. Lance les 3 presets sur un ticker spécifique
2. Compare les résultats :
   - Tous les 3 actifs → Signal TRÈS fort
   - 2 sur 3 actifs → Signal fort
   - 1 sur 3 actif → Signal modéré
3. Analyse la direction (Calls vs Puts)
4. Vérifie le timing (expirations)
5. Recherche les news/catalyseurs
```

---

## ✅ En résumé

| Preset | Focus | Signal |
|--------|-------|--------|
| 🐋 **Whale Hunt** | **Positions massives** (Vol > OI) | Conviction institutionnelle |
| ⚡ **Aggressive Flow** | **Sweeps urgents** (achat agressif) | Conviction court-terme |
| 🏢 **Institutional OTC** | **Floor trades** (large/mid caps) | Deals institutionnels |

**Ils ne sont PAS en compétition, ils sont COMPLÉMENTAIRES !**

---

## 💬 Cas pratique : Quel preset choisir ?

### Question 1 : "Je veux savoir si AAPL va bouger cette semaine"
**→ ⚡ Aggressive Flow + AAPL**

---

### Question 2 : "Je veux savoir si les institutions accumulent TSLA"
**→ 🐋 Whale Hunt + TSLA**

---

### Question 3 : "Je veux voir ce que Goldman Sachs fait sur les mega-caps"
**→ 🏢 Institutional OTC (sans ticker)**

---

### Question 4 : "Je veux découvrir des opportunités que je ne connais pas"
**→ 🐋 Whale Hunt (sans ticker) + 🔥 Vol Spike**

---

**Maintenant tu comprends la différence ? 🎯**

Chaque preset cible un **TYPE DIFFÉRENT** d'activité institutionnelle !

