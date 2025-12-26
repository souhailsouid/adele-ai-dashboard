# 📊 Flow Alerts - Indicateurs et Analyse

Ce document explique les différents indicateurs utilisés dans les Flow Alerts pour analyser les transactions institutionnelles.

## 🐋 Whale Score

Le **Whale Score** est un indicateur propriétaire qui évalue l'importance et l'impact potentiel d'une transaction sur le marché.

### Calcul

Le score est calculé sur **100 points** ou étiqueté **"WHALE"** pour les transactions exceptionnelles :

#### Critères "WHALE" (Transaction Institutionnelle Majeure)
- Premium > **$5,000,000**
- Volume > **1,000 contrats**
- → Indique une position institutionnelle massive avec impact marché significatif

#### Score sur 100 points

| Critère | Points | Seuils |
|---------|--------|--------|
| **Premium élevé** | +20 à +50 | >$100K (+20), >$500K (+50) |
| **Volume élevé** | +20 à +30 | >500 (+20), >2000 (+30) |
| **Position ITM** | +10 | Strike < Prix actuel (calls) ou Strike > Prix actuel (puts) |

**Interprétation** :
- **0-30** : Transaction retail standard
- **31-60** : Transaction significative, possiblement institutionnelle
- **61-90** : Transaction institutionnelle importante
- **91-100** : Transaction institutionnelle majeure
- **WHALE** : Transaction exceptionnelle avec impact marché garanti

### Exemples

```
TLT $100P Premium $9.7M, Vol 8,000 → WHALE (Floor Trade)
SPX $6400P Premium $5.0M, Vol 502 → Score 70-80 (Institutionnel)
IWM $240P Premium $1.6M, Vol 13,070 → Score 60-70 (Significatif)
```

---

## 📈 Sentiment Analysis

Le **Sentiment** analyse la direction du marché anticipée par les traders institutionnels.

### Types de Sentiment

#### 🟢 Bullish (Haussier)
- **Type** : CALL
- **Premium** : > $1,000,000
- **Interprétation** : Les institutionnels anticipent une hausse du sous-jacent

#### 🟢 Extremely Bullish (Extrêmement Haussier)
- **Type** : CALL
- **Premium** : > $5,000,000
- **Volume/OI Ratio** : > 2.0x
- **Interprétation** : Conviction très forte d'une hausse importante

#### 🔴 Bearish (Baissier)
- **Type** : PUT
- **Premium** : > $1,000,000
- **Interprétation** : Les institutionnels anticipent une baisse du sous-jacent

#### 🔴 Extremely Bearish (Extrêmement Baissier)
- **Type** : PUT
- **Premium** : > $5,000,000
- **Interprétation** : Conviction très forte d'une baisse importante

#### 🟠 Bearish Hedge (Couverture Baissière)
- **Type** : PUT
- **Alert Rule** : Contient "Hedge"
- **Interprétation** : Position de protection contre une baisse (pas forcément bearish net)

#### 🟡 Earnings Bet (Pari sur les Résultats)
- **Alert Rule** : Contient "Earnings"
- **Interprétation** : Position spéculative avant publication de résultats

#### ⚪ Neutral
- Transactions ne répondant pas aux critères ci-dessus

### Facteurs d'Analyse

1. **Type d'Option**
   - CALL → Anticipation haussière
   - PUT → Anticipation baissière ou protection

2. **Premium (Montant investi)**
   - Plus le premium est élevé, plus la conviction est forte
   - Seuils : $1M (significatif), $5M (très fort)

3. **Volume/OI Ratio**
   - Ratio élevé (>2) → Nouvelle position, conviction forte
   - Ratio faible (<0.5) → Ajustement de positions existantes

4. **Alert Rules**
   - **RepeatedHits** : Accumulation progressive
   - **Floor Trade** : Transaction de gré à gré (OTC), très institutionnel
   - **Sweep** : Achat agressif multi-exchanges
   - **Hedge** : Protection de portefeuille

---

## 📊 Autres Indicateurs

### Volume vs Open Interest (Vol/OI Ratio)

Le ratio **Volume / Open Interest** indique si de nouvelles positions sont ouvertes :

- **Ratio > 2.0x** : Beaucoup de nouvelles positions → Conviction forte
- **Ratio 1.0x - 2.0x** : Activité normale
- **Ratio < 0.5x** : Peu de nouvelles positions → Ajustements

### Alert Rules (Règles d'Alerte)

| Règle | Signification |
|-------|--------------|
| **RepeatedHits** | Accumulation progressive sur plusieurs transactions |
| **RepeatedHitsAscendingFill** | Accumulation avec prix croissant (achat agressif) |
| **RepeatedHitsDescendingFill** | Accumulation avec prix décroissant (vente agressive) |
| **FloorTradeLargeCap** | Transaction de gré à gré sur large cap (très institutionnel) |
| **Sweep** | Balayage multi-exchanges (très agressif) |

### ITM vs OTM (In/Out of The Money)

- **ITM (In The Money)** : Strike favorable → Position déjà profitable
- **OTM (Out of The Money)** : Strike défavorable → Pari sur mouvement important

---

## 🎯 Comment Interpréter les Flow Alerts ?

### Exemple 1 : Transaction WHALE Bearish

```
TLT $100P
Premium: $9.7M
Volume: 8,000
OI: 3,679
Ratio: 2.17x
Alert: Floor Trade Large Cap
Sentiment: Extremely Bearish
Whale Score: WHALE
```

**Interprétation** :
- Transaction institutionnelle massive ($9.7M)
- Floor Trade → négocié en OTC, très sophistiqué
- Ratio 2.17x → nouvelles positions importantes
- **Conclusion** : Les institutionnels anticipent une forte baisse de TLT (hausse des taux)

### Exemple 2 : Accumulation Bearish

```
IWM $240P
Premium: $1.6M
Volume: 13,070
OI: 42,815
Ratio: 0.31x
Alert: Repeated Hits
Sentiment: Bearish
```

**Interprétation** :
- Transaction significative ($1.6M)
- Volume élevé (13K) mais ratio faible → ajustement de positions existantes
- Repeated Hits → accumulation progressive
- **Conclusion** : Sentiment baissier sur IWM, mais moins agressif

### Exemple 3 : Protection SPX

```
SPX $6400P
Premium: $5.0M
Volume: 502
OI: 5,483
Ratio: 0.09x
Alert: Repeated Hits
Sentiment: Extremely Bearish
```

**Interprétation** :
- Premium très élevé ($5M) mais volume faible
- Ratio très bas (0.09x) → ajustement
- Strike loin OTM → protection tail risk
- **Conclusion** : Protection contre crash, pas forcément conviction bearish

---

## 🔥 Trading Signals (Signaux à Suivre)

### Signaux Très Forts
1. **WHALE Score** + **Extremely Bullish/Bearish** → Impact marché probable
2. **Floor Trade** + **Premium > $5M** → Transaction sophistiquée institutionnelle
3. **Ratio > 2.0x** + **Ascending Fill** → Achat agressif, conviction forte

### Signaux Modérés
1. **Score 60-90** + **Bullish/Bearish** → Transaction significative
2. **Repeated Hits** + **Premium > $1M** → Accumulation progressive

### Signaux à Contextualiser
1. **Bearish Hedge** → Peut être neutre (protection)
2. **Ratio < 0.5x** → Ajustement, pas nouvelle conviction
3. **Earnings Bet** → Spéculation événementielle

---

## 📚 Ressources

- **Unusual Whales** : Source des données Flow Alerts
- **Options Greeks** : Delta, Gamma, Theta, Vega pour analyse approfondie
- **IV (Implied Volatility)** : Niveau de volatilité anticipée

---

*Dernière mise à jour : 26 décembre 2024*

