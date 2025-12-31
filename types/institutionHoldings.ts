export interface InstitutionHolding {
  date: string
  close: string | null
  units: number
  value: number
  sector: string | null
  ticker: string
  put_call: 'put' | 'call' | null
  avg_price: string | null
  first_buy: string
  full_name: string
  change_perc: string | null
  units_change: number
  perc_of_total: number | null
  security_type: string
  price_first_buy: string
  historical_units: number[]
  shares_outstanding: string | null
  perc_of_share_value: number | null
  avg_price_change_perc: string | null
  price_change_since_first_buy_perc: string | null
}

export interface InstitutionHoldingsData {
  id: number
  cache_key: string
  data: InstitutionHolding[]
  data_date: string | null
  cached_at: string
  expires_at: string
}

export interface InstitutionHoldingsResponse {
  success: boolean
  data: InstitutionHoldingsData
  cached: boolean
  timestamp: string
}


