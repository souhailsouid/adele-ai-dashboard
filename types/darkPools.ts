// Structure d'une transaction Dark Pool
export interface DarkPoolTransaction {
  size: number
  ticker: string
  price: string
  volume: number
  executed_at: string
  premium: string
  nbbo_ask: string
  nbbo_bid: string
  canceled: boolean
  ext_hour_sold_codes: string | null
  market_center: string
  nbbo_ask_quantity: number
  nbbo_bid_quantity: number
  sale_cond_codes: string | null
  tracking_id: number
  trade_code: string | null
  trade_settlement: string
}

// Réponse API pour les Dark Pools
export interface DarkPoolsResponse {
  success: boolean
  data: DarkPoolTransaction[]
  cached: boolean
  count: number
  timestamp: string
}

