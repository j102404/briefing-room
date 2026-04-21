import type { StockData } from '@/lib/types'

export interface DossierClaim {
  id: string
  claim: string
  type: 'financial_fact' | 'management_statement' | 'third_party_claim' | 'analyst_inference'
  verbatim_source_quote: string | null
  source_url: string | null
  source_date: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface Dossier {
  subject: string
  subject_type: 'stock' | 'commodity' | 'asset_class' | 'market' | 'unknown'
  thesis_atomic_claims: string[]
  thesis_internal_issues: string[]
  claims: DossierClaim[]
  fmp_data: StockData | null
}

export interface ThesisQualityScore {
  score: number
  rationale: string
  supporting_claim_ids: string[]
}

export interface ValuationBridge {
  available: boolean
  reason_unavailable?: string
  implied_eps?: number
  implied_multiple?: number
  base_year?: string
  consensus_eps?: number
  consensus_multiple?: number
  gap_analysis?: string
}

export interface Brief {
  input_quality: {
    score: number
    issues: string[]
  }
  thesis_restatement: string
  thesis_does_not_claim: string[]
  valuation_bridge: ValuationBridge
  thesis_quality: {
    overall_tier: 'Strong' | 'Moderate' | 'Weak' | 'Against'
    macro_alignment: ThesisQualityScore
    valuation_support: ThesisQualityScore
    catalyst_clarity: ThesisQualityScore
    risk_reward: ThesisQualityScore
  }
  supporting_evidence: Array<{ text: string; claim_ids: string[] }>
  risk_factors: Array<{ text: string; claim_ids: string[] }>
  counter_brief: string
  bull_case: string
  bear_case: string
  bottom_line: string
  sources: DossierClaim[]
}
