/**
 * Types pour les transactions Insider Trading FMP
 */

export interface InsiderTradingTransaction {
  symbol: string
  filingDate: string
  transactionDate: string
  reportingCik: string
  companyCik: string
  transactionType: string
  securitiesOwned: number
  reportingName: string
  typeOfOwner: string
  acquisitionOrDisposition: 'A' | 'D' // A = Acquisition, D = Disposition
  directOrIndirect: 'D' | 'I' // D = Direct, I = Indirect
  formType: string
  securitiesTransacted: number
  price: number
  securityName: string
  url: string
}

export interface InsiderTradingResponse {
  success: boolean
  data: InsiderTradingTransaction[]
  cached: boolean
  count: number
  timestamp: string
}

export interface InsiderTradingParams {
  symbol?: string
  limit?: number
  page?: number
}

