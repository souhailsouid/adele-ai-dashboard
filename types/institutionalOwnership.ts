export interface InstitutionalOwner {
  cik: string
  name: string
  tags: string[]
  units: number
  value: number
  people: any[]
  avg_price: string | null
  first_buy: string
  inst_value: string
  short_name: string | null
  filing_date: string
  report_date: string
  units_changed: number
  historical_units: number[]
  inst_share_value: string
  shares_outstanding: string
  // Champ calculé côté frontend
  ownership_perc?: number
}

export interface InstitutionalOwnershipData {
  id: number
  cache_key: string
  data: InstitutionalOwner[]
  data_date: string | null
  cached_at: string
  expires_at: string
}

export interface InstitutionalOwnershipResponse {
  success: boolean
  data: InstitutionalOwnershipData
  cached: boolean
  timestamp: string
}

