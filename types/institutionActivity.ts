export interface InstitutionActivityItem {
  close: string | null
  ticker: string
  units: number
  security_type: string
  avg_price: string | null
  filing_date: string
  shares_outstanding: string | null
  report_date: string
  put_call: 'put' | 'call' | null
  units_change: number
  sell_price: string | null
  buy_price: string | null
  price_on_filing: string
  price_on_report: string
}

export interface InstitutionActivityData {
  success: boolean
  data: InstitutionActivityItem[]
  cached: boolean
  count?: number
  timestamp: string
}

