import type { Brief, Dossier } from '@/lib/analysis/types'

export interface ValidationResult {
  valid: boolean
  warnings: string[]
}

export function validateValuationMath(brief: Brief): { valid: boolean; issue?: string } {
  const bridge = brief.valuation_bridge
  if (!bridge.available) return { valid: true }

  const { implied_eps, implied_multiple } = bridge
  if (implied_eps == null || implied_multiple == null) {
    return { valid: false, issue: 'valuation_bridge.available=true but implied_eps or implied_multiple is missing' }
  }

  const implied_price = implied_eps * implied_multiple
  const fmpPrice = brief.sources[0]?.confidence != null
    ? null // price comes from dossier context, not sources
    : null

  // We can only check internal math consistency (eps × multiple)
  // Price target check requires the original price target, which isn't in Brief schema
  // So we just validate that implied_eps and implied_multiple are positive and reasonable
  if (implied_eps <= 0) {
    return { valid: false, issue: `Valuation bridge has non-positive implied_eps: ${implied_eps}` }
  }
  if (implied_multiple <= 0 || implied_multiple > 200) {
    return { valid: false, issue: `Valuation bridge has implausible implied_multiple: ${implied_multiple}` }
  }

  return { valid: true }
}

export function checkClaimIdReferences(brief: Brief, dossier: Dossier): string[] {
  const validIds = new Set(dossier.claims.map((c) => c.id))
  const invalid: string[] = []

  const checkIds = (ids: string[], context: string) => {
    for (const id of ids) {
      if (!validIds.has(id)) {
        invalid.push(`${context}: claim ID "${id}" not found in dossier`)
      }
    }
  }

  for (const item of brief.supporting_evidence) {
    checkIds(item.claim_ids, 'supporting_evidence')
  }
  for (const item of brief.risk_factors) {
    checkIds(item.claim_ids, 'risk_factors')
  }
  checkIds(brief.thesis_quality.macro_alignment.supporting_claim_ids, 'thesis_quality.macro_alignment')
  checkIds(brief.thesis_quality.valuation_support.supporting_claim_ids, 'thesis_quality.valuation_support')
  checkIds(brief.thesis_quality.catalyst_clarity.supporting_claim_ids, 'thesis_quality.catalyst_clarity')
  checkIds(brief.thesis_quality.risk_reward.supporting_claim_ids, 'thesis_quality.risk_reward')

  return invalid
}

export function verifyNonEmptyFields(brief: Brief): string[] {
  const empty: string[] = []
  const required: Array<[keyof Brief, string]> = [
    ['counter_brief', 'counter_brief'],
    ['bull_case', 'bull_case'],
    ['bear_case', 'bear_case'],
    ['bottom_line', 'bottom_line'],
    ['thesis_restatement', 'thesis_restatement'],
  ]
  for (const [field, label] of required) {
    const val = brief[field]
    if (typeof val === 'string' && val.trim().length === 0) {
      empty.push(`${label} is empty`)
    }
  }
  if (!brief.supporting_evidence || brief.supporting_evidence.length === 0) {
    empty.push('supporting_evidence is empty')
  }
  if (!brief.risk_factors || brief.risk_factors.length === 0) {
    empty.push('risk_factors is empty')
  }
  return empty
}

export function runValidators(brief: Brief, dossier: Dossier): string[] {
  const warnings: string[] = []

  const mathCheck = validateValuationMath(brief)
  if (!mathCheck.valid && mathCheck.issue) {
    warnings.push(mathCheck.issue)
  }

  const invalidRefs = checkClaimIdReferences(brief, dossier)
  warnings.push(...invalidRefs)

  const emptyFields = verifyNonEmptyFields(brief)
  warnings.push(...emptyFields)

  return warnings
}
