# MarketFlow - Implementation Guide

## Architecture Overview

### Recommended Tech Stack

**Frontend:**
- **Next.js 14+** (React framework) - Server-side rendering, API routes, optimal performance
- **TypeScript** - Type safety
- **Tailwind CSS** - Already using it
- **React Query / SWR** - Data fetching and caching
- **Zustand / Redux** - State management
- **Socket.io Client** - Real-time updates

**Backend:**
- **Node.js + Express** or **Next.js API Routes**
- **Python FastAPI** (for data processing/ML)
- **PostgreSQL** - User data, preferences, watchlists
- **Redis** - Caching, real-time data, rate limiting
- **WebSocket Server** - Real-time market data streaming

**Data Sources:**
- **Polygon.io** - Real-time market data, options flow
- **Alpha Vantage** - Market data API
- **Finnhub** - Stock data, news
- **TradingView** - Chart data
- **SEC EDGAR** - Dark pool data (13F filings)
- **FRED API** - Macro economic data (CPI, unemployment, etc.)

---

## Project Structure

```
marketflow/
├── frontend/                 # Next.js app
│   ├── app/                  # App router (Next.js 13+)
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   │   ├── live-flow/
│   │   │   ├── dark-pools/
│   │   │   └── macro-calendar/
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── MarketFlowTable/  # Transaction table
│   │   ├── MacroCalendar/    # Calendar component
│   │   └── Header/
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities, API clients
│   ├── store/                # State management
│   └── types/                # TypeScript types
│
├── backend/                  # Optional separate backend
│   ├── services/
│   │   ├── marketData.ts     # Market data fetcher
│   │   ├── optionsFlow.ts    # Options analysis
│   │   └── darkPool.ts       # Dark pool detection
│   ├── workers/
│   │   └── dataProcessor.ts  # Background jobs
│   └── websocket/
│       └── server.ts         # WebSocket server
│
├── shared/                   # Shared types/utils
└── docker-compose.yml        # Local development
```

---

## Key Features Implementation

### 1. Real-Time Transaction Flow

**Frontend Component:**
```typescript
// components/MarketFlowTable/index.tsx
'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Transaction {
  ticker: string
  time: string
  type: 'CALL_SWEEP' | 'PUT_BLOCK' | 'CALL_SPLIT'
  strike: number
  expiry: string
  premium: number
  whaleScore: number
  sentiment: 'Bullish' | 'Bearish' | 'Neutral'
}

export function MarketFlowTable() {
  const { transactions, isConnected } = useWebSocket<Transaction>(
    'ws://localhost:3001/transactions'
  )
  
  // Filter logic, sorting, etc.
  
  return (
    <div className="glass-card rounded-[1.2em]">
      {/* Table implementation */}
    </div>
  )
}
```

**Backend WebSocket:**
```typescript
// backend/websocket/server.ts
import { WebSocketServer } from 'ws'
import { processOptionsFlow } from '../services/optionsFlow'

const wss = new WebSocketServer({ port: 3001 })

wss.on('connection', (ws) => {
  // Subscribe to real-time options flow
  const interval = setInterval(async () => {
    const transactions = await processOptionsFlow()
    ws.send(JSON.stringify({ type: 'transactions', data: transactions }))
  }, 1000) // Update every second
  
  ws.on('close', () => clearInterval(interval))
})
```

### 2. Macro Calendar

**Data Source Integration:**
```typescript
// lib/api/macroCalendar.ts
import { FRED_API_KEY } from '@/lib/config'

export interface MacroEvent {
  name: string
  time: string
  impact: 'HIGH' | 'MED' | 'LOW'
  forecast?: string
  description: string
}

export async function fetchMacroEvents(): Promise<MacroEvent[]> {
  // Fetch from FRED API or custom calendar service
  const response = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}`
  )
  // Process and format data
  return formattedEvents
}
```

### 3. Dark Pool Detection

**Algorithm:**
```typescript
// backend/services/darkPool.ts
export async function detectDarkPoolActivity(ticker: string) {
  // Analyze:
  // 1. Large block trades (>10,000 shares)
  // 2. Off-exchange volume (FINRA ATS data)
  // 3. Unusual volume patterns
  // 4. Price action vs volume discrepancy
  
  const blockTrades = await fetchBlockTrades(ticker)
  const offExchangeVolume = await fetchOffExchangeVolume(ticker)
  
  return {
    darkPoolVolume: calculateDarkPoolVolume(blockTrades, offExchangeVolume),
    supportLevels: identifySupportLevels(blockTrades),
    resistanceLevels: identifyResistanceLevels(blockTrades)
  }
}
```

### 4. Whale Score Calculation

```typescript
// backend/services/whaleScore.ts
export function calculateWhaleScore(transaction: Transaction): number {
  let score = 0
  
  // Premium size (0-40 points)
  if (transaction.premium > 1000000) score += 40
  else if (transaction.premium > 500000) score += 25
  else if (transaction.premium > 100000) score += 10
  
  // Volume vs average (0-30 points)
  const volumeRatio = transaction.volume / averageVolume
  if (volumeRatio > 10) score += 30
  else if (volumeRatio > 5) score += 20
  
  // Strike proximity (0-20 points)
  const strikeProximity = Math.abs(currentPrice - transaction.strike) / currentPrice
  if (strikeProximity < 0.02) score += 20
  
  // Time decay (0-10 points)
  const daysToExpiry = getDaysToExpiry(transaction.expiry)
  if (daysToExpiry < 7) score += 10
  
  return Math.min(score, 100)
}
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  subscription_tier VARCHAR(50), -- free, pro, enterprise
  created_at TIMESTAMP
);

-- Watchlists
CREATE TABLE watchlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  tickers TEXT[]
);

-- Transactions (cached)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  ticker VARCHAR(10),
  timestamp TIMESTAMP,
  type VARCHAR(50),
  strike DECIMAL,
  expiry DATE,
  premium DECIMAL,
  whale_score INTEGER,
  sentiment VARCHAR(50),
  created_at TIMESTAMP
);

-- Macro Events
CREATE TABLE macro_events (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  scheduled_time TIMESTAMP,
  impact VARCHAR(20),
  forecast TEXT,
  description TEXT
);

-- User Preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  alert_threshold INTEGER, -- Minimum whale score for alerts
  preferred_tickers TEXT[],
  notification_settings JSONB
);
```

---

## Authentication & Authorization

**Next.js Auth:**
```typescript
// lib/auth.ts
import { NextAuth } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Verify user credentials
        const user = await verifyUser(credentials.email, credentials.password)
        return user
      }
    })
  ],
  pages: {
    signIn: '/login'
  }
}
```

---

## Real-Time Data Pipeline

```
Market Data APIs → Data Processor → Redis Cache → WebSocket Server → Frontend
                     ↓
              PostgreSQL (Historical)
```

**Data Processor:**
```typescript
// backend/workers/dataProcessor.ts
import cron from 'node-cron'

// Run every minute
cron.schedule('* * * * *', async () => {
  // 1. Fetch latest options flow
  const optionsFlow = await fetchOptionsFlow()
  
  // 2. Calculate whale scores
  const scoredTransactions = optionsFlow.map(calcWhaleScore)
  
  // 3. Filter significant transactions
  const significant = scoredTransactions.filter(t => t.whaleScore > 70)
  
  // 4. Store in Redis for real-time access
  await redis.set('latest_transactions', JSON.stringify(significant))
  
  // 5. Store in PostgreSQL for historical analysis
  await db.transactions.insertMany(significant)
  
  // 6. Send WebSocket updates to connected clients
  broadcastToClients(significant)
})
```

---

## API Endpoints

```typescript
// app/api/transactions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  const transactions = await db.transactions
    .find({ ticker })
    .sort({ timestamp: -1 })
    .limit(limit)
  
  return Response.json(transactions)
}

// app/api/macro-calendar/route.ts
export async function GET() {
  const events = await fetchMacroEvents()
  return Response.json(events)
}

// app/api/dark-pools/[ticker]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  const data = await detectDarkPoolActivity(params.ticker)
  return Response.json(data)
}
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)
```bash
# Deploy frontend + API routes
vercel deploy
```

### Option 2: Docker Compose (Full Stack)
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: marketflow
  
  redis:
    image: redis:7
```

### Option 3: AWS/GCP
- **Frontend**: Vercel or AWS Amplify
- **Backend**: AWS Lambda + API Gateway or GCP Cloud Functions
- **Database**: AWS RDS (PostgreSQL) or Cloud SQL
- **Real-time**: AWS AppSync or Pub/Sub
- **Workers**: AWS ECS or Cloud Run

---

## Step-by-Step Implementation

1. **Setup Next.js Project**
   ```bash
   npx create-next-app@latest marketflow --typescript --tailwind --app
   ```

2. **Convert HTML to React Components**
   - Extract sections into components
   - Convert static data to state/props
   - Add TypeScript types

3. **Setup Database**
   ```bash
   npm install @prisma/client prisma
   npx prisma init
   ```

4. **Create API Routes**
   - Implement data fetching endpoints
   - Add authentication middleware

5. **Integrate Real-Time Data**
   - Setup WebSocket server
   - Connect to market data APIs
   - Implement caching layer

6. **Add Authentication**
   ```bash
   npm install next-auth
   ```

7. **Deploy**
   - Setup environment variables
   - Deploy to Vercel/your platform
   - Configure database connections

---

## Cost Considerations

- **Market Data APIs**: $50-500/month (depending on tier)
- **Hosting**: $0-20/month (Vercel free tier)
- **Database**: $0-25/month (Supabase free tier or AWS RDS)
- **Redis**: $0-15/month (Upstash free tier)

**Total**: ~$50-560/month for MVP

---

## Next Steps

1. Start with Next.js setup and component conversion
2. Implement mock data first, then integrate real APIs
3. Add authentication and user management
4. Deploy incrementally (frontend → API → real-time)

Would you like me to start implementing any specific part?

