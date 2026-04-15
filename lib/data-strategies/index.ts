// M1: Default strategy — Claude uses its own knowledge + web search beta
// M2: Add FMP integration for stock tickers (just add a file here, no refactoring needed)

export type SubjectType = 'stock' | 'commodity' | 'asset_class' | 'macro' | 'unknown'

function detectSubjectType(subject: string): SubjectType {
  const trimmed = subject.trim()

  // Stock tickers: 1-5 uppercase letters, optionally followed by exchange suffix
  if (/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(trimmed)) return 'stock'

  const lower = trimmed.toLowerCase()
  if (['gold', 'oil', 'silver', 'copper', 'wheat', 'crude', 'natural gas', 'wti', 'brent'].some(c => lower.includes(c))) return 'commodity'
  if (['real estate', 'reit', 'bond', 'treasury', 'credit', 'fixed income', 'mbs'].some(c => lower.includes(c))) return 'asset_class'
  if (['macro', 'fed', 'inflation', 'recession', 'gdp', 'rate', 'yield curve', 'dollar', 'dxy'].some(c => lower.includes(c))) return 'macro'

  return 'unknown'
}

export interface SubjectData {
  type: SubjectType
  // M2: additionalContext will carry FMP data for stocks
  additionalContext: string
}

export async function getDataForSubject(subject: string): Promise<SubjectData> {
  const type = detectSubjectType(subject)

  // M1: No external data source — Claude searches via web_search tool
  // M2: Switch on type === 'stock' and fetch from FMP here
  return {
    type,
    additionalContext: '',
  }
}
