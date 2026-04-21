export interface ConvictionScore {
  score: number
  rationale: string
  supporting_claim_ids?: string[]
}

export interface Conviction {
  overall_tier: 'Strong' | 'Moderate' | 'Weak' | 'Against'
  macro_alignment: ConvictionScore
  valuation_support: ConvictionScore
  catalyst_clarity: ConvictionScore
  risk_reward: ConvictionScore
}

export type { Brief } from '@/lib/analysis/types'

export interface StockData {
  ticker: string
  companyName: string
  sector: string
  industry: string
  // Quote
  price: number
  marketCap: number
  pe: number | null
  eps: number | null
  dayLow: number
  dayHigh: number
  yearLow: number
  yearHigh: number
  priceAvg50: number
  priceAvg200: number
  volume: number
  // Key metrics TTM (margins already multiplied ×100 → percentage points)
  peRatioTTM: number | null
  priceToBookRatioTTM: number | null
  debtToEquityTTM: number | null
  returnOnEquityTTM: number | null       // %
  grossProfitMarginTTM: number | null    // %
  operatingProfitMarginTTM: number | null // %
  netProfitMarginTTM: number | null      // %
  // Income statement (most recent annual)
  revenue: number | null
  revenueGrowthYoY: number | null        // %
  grossProfit: number | null
  operatingIncome: number | null
  netIncome: number | null
}
