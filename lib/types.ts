export interface ConvictionScore {
  score: number
  rationale: string
}

export interface Conviction {
  overall_tier: 'Strong' | 'Moderate' | 'Weak' | 'Against'
  macro_alignment: ConvictionScore
  valuation_support: ConvictionScore
  catalyst_clarity: ConvictionScore
  risk_reward: ConvictionScore
}

export interface ResearchBrief {
  thesis_summary: string
  conviction: Conviction
  supporting_evidence: string[]
  risk_factors: string[]
  counter_brief: string
  bull_case: string
  bear_case: string
  bottom_line: string
}
