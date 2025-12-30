// Structure d'un insider (personne)
export interface Insider {
  id: number
  name: string
  ticker: string
  display_name: string
  name_slug: string
  logo_url: string | null
  social_links: any[]
  is_person: boolean
}

// Structure d'une transaction insider agrégée par date (ticker-flow)
export interface InsiderTickerFlow {
  date: string
  ticker: string
  transactions: number
  volume: number // positif pour buy, négatif pour sell
  premium: string // valeur monétaire en string
  avg_price: string
  buy_sell: 'buy' | 'sell'
  premium_10b5: string
  transactions_10b5: number
  uniq_insiders: number
  uniq_insiders_10b5: number
  volume_10b5: number
  avg_price_10b5: string | null
}

// Pour compatibilité avec l'ancien code
export type InsiderTransaction = InsiderTickerFlow
export type InsiderTrade = InsiderTickerFlow

// Réponse API pour la liste des insiders d'un ticker
export interface InsidersListResponse {
  success: boolean
  data: Insider[]
  cached: boolean
  count: number
  timestamp: string
}

// Réponse API pour le flow agrégé des insider trades
export interface InsiderTickerFlowResponse {
  success: boolean
  data: InsiderTickerFlow[]
  cached: boolean
  count: number
  timestamp: string
}

// Structure d'une transaction détaillée d'insider
export interface InsiderTransactionDetail {
  id: string
  ticker: string
  amount: number // positif pour buy, négatif pour sell
  transactions: number
  price: string
  sector: string
  marketcap: string
  next_earnings_date: string | null
  transaction_date: string
  is_s_p_500: boolean
  filing_date: string
  is_director: boolean
  is_officer: boolean
  is_ten_percent_owner: boolean
  reporter_is_public_company: boolean
  stock_price: string | null
  security_title: string | null
  formtype: string
  transaction_code: string // S, P, M, A, G, etc.
  is_10b5_1: boolean
  owner_name: string
  security_ad_code: string | null
  shares_owned_after: number | null
  officer_title: string | null
  shares_owned_before: number | null
  director_indirect: string | null // D = Direct, I = Indirect
  natureofownership: string | null
  date_excercisable: string | null
  price_excercisable: string | null
  expiration_date: string | null
  ids: string[] // UUIDs des transactions individuelles
}

// Réponse API pour les transactions détaillées
export interface InsiderTransactionsResponse {
  success: boolean
  data: InsiderTransactionDetail[]
  cached: boolean
  count: number
  timestamp: string
}

