import type { StockData } from '@/lib/types'
import { getStockData } from './stock'

export type SubjectType = 'stock' | 'commodity' | 'asset_class' | 'macro' | 'unknown'

export interface SubjectData {
  type: SubjectType
  stockData: StockData | null
}

/**
 * Detects whether the input looks like a stock ticker.
 * Accepts all-uppercase (NVDA, BRK.A) or all-lowercase (nvda, brk.a).
 * Rejects title-case proper nouns like "Gold" or "Meta" to avoid false positives.
 */
function isTickerLike(s: string): boolean {
  const upper = s.toUpperCase()
  if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(upper)) return false
  // Must be uniformly cased — title-case words (Gold, Silver) are not tickers
  return s === s.toUpperCase() || s === s.toLowerCase()
}

export async function getDataForSubject(subject: string): Promise<SubjectData> {
  const trimmed = subject.trim()

  if (isTickerLike(trimmed)) {
    const ticker = trimmed.toUpperCase()
    const stockData = await getStockData(ticker)
    // If FMP returns null (unknown ticker), fall through to macro strategy
    return { type: stockData ? 'stock' : 'unknown', stockData }
  }

  // Non-stock subjects: web search only (M2 scope)
  return { type: detectNonStockType(trimmed), stockData: null }
}

function detectNonStockType(s: string): SubjectType {
  const lower = s.toLowerCase()
  if (['gold', 'oil', 'silver', 'copper', 'wheat', 'crude', 'natural gas', 'wti', 'brent'].some(c => lower.includes(c))) return 'commodity'
  if (['real estate', 'reit', 'bond', 'treasury', 'credit', 'fixed income', 'mbs'].some(c => lower.includes(c))) return 'asset_class'
  if (['macro', 'fed', 'inflation', 'recession', 'gdp', 'rate', 'yield curve', 'dollar', 'dxy'].some(c => lower.includes(c))) return 'macro'
  return 'unknown'
}
