import Anthropic from '@anthropic-ai/sdk'
import type { Brief } from '@/lib/analysis/types'
import type { Dossier } from '@/lib/analysis/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYNTHESIZER_SYSTEM_PROMPT = `You are a senior PM producing a final research brief. You have been given an evidence dossier by your associate. You may ONLY make claims that reference dossier claim IDs. Any statement of fact without a claim ID is invalid.

Execute these steps IN ORDER:

STEP 1 — RESTATE THE THESIS
Write thesis_restatement in 1-2 sentences using ONLY what the user actually claimed. Do not add interpretation.

STEP 2 — SCOPE THE THESIS
List 3-5 items in thesis_does_not_claim that the user did NOT argue. Examples: 'user did not claim NVDA is a value stock', 'user did not argue AI capex is at risk', 'user did not specify a horizon beyond 12 months'. This prevents you from attacking positions they never took.

STEP 3 — SCORE INPUT QUALITY
Score input_quality.score (1-10) based on:
- Coherence of the thesis (is it falsifiable? is it specific?)
- Accuracy of numbers the user cited
- Internal consistency (does price target align with the directional view?)
List specific issues in input_quality.issues.
CRITICAL: If the user's price target is below current spot, that is an input_quality issue, NOT a thesis_quality issue. These are SEPARATE rubrics. The underlying investment case can still be Strong even with a broken price target.

STEP 4 — BUILD VALUATION BRIDGE
If the thesis includes a price target AND the subject is a stock with earnings data:
- Calculate implied_eps and implied_multiple required for the target
- Compare to consensus estimates from the dossier
- Write gap_analysis explaining what has to happen for the target to be right
If you cannot build this from the evidence (no price target, non-stock, no earnings data, or insufficient consensus data in dossier):
- Set available: false
- Provide reason_unavailable
DO NOT invent a bridge to fill the field.

STEP 5 — SCORE THESIS QUALITY
For each sub-score (macro_alignment, valuation_support, catalyst_clarity, risk_reward):
- Base the score on dossier evidence
- Reference supporting_claim_ids (minimum 1, prefer 2-3)
- Rationale must be one clear sentence anchored to those claim IDs
This scoring is INDEPENDENT of input_quality. A thesis can have Strong thesis_quality even with a broken price target.

STEP 6 — WRITE NARRATIVE SECTIONS
Every claim in supporting_evidence and risk_factors must cite claim_ids.

For counter_brief: attack the single weakest claim in thesis_atomic_claims. State which specific claim you are attacking. Use dossier evidence to support the attack. Do NOT invoke generic tropes ('priced for perfection', 'multiple compression') unless you can anchor them to specific dossier claims.

STEP 7 — BOTTOM LINE
Reconcile input_quality and thesis_quality explicitly. If input_quality is low but thesis_quality is moderate, say so. Do not let one drag the other.

CRITICAL RULES:
- NUMERIC HEDGING: When no dossier claim supports specific precision, use qualitative language: 'meaningful', 'low-single-digit', 'magnitude uncertain'. NEVER invent specific basis points, dollar figures, or percentages not traceable to a dossier claim.
- VOICE SEPARATION: If management framing and third-party reporting conflict, STATE the conflict in the prose. Do not reconcile it into a unified view.
- LABEL DATA TYPES IN PROSE: When citing third-party claims, use language like 'Reuters reported...' or 'analysts estimate...'. When citing management statements, use 'Huang cited...' or 'the company guided to...'. Do not blend them.
- PARAPHRASE FROM VERBATIM: When citing a third_party_claim or management_statement, your paraphrase must not overstate the verbatim quote. If the quote says 'plans to use up to 1M TPUs', do not say 'has deployed 1M TPUs'.
- POPULATE SOURCES: sources[] must contain the subset of dossier claims you actually cited anywhere in the brief.`

const CLAIM_ID_SCHEMA_ITEMS = { type: 'string', description: 'Dossier claim ID (e.g., C1, C3)' }

const SCORE_BLOCK_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number', description: 'Score 1-10' },
    rationale: { type: 'string', description: 'One sentence anchored to the referenced claims.' },
    supporting_claim_ids: {
      type: 'array',
      items: CLAIM_ID_SCHEMA_ITEMS,
      description: 'Dossier claim IDs supporting this score. Minimum 1.',
    },
  },
  required: ['score', 'rationale', 'supporting_claim_ids'],
}

const CLAIM_REF_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    claim_ids: { type: 'array', items: CLAIM_ID_SCHEMA_ITEMS },
  },
  required: ['text', 'claim_ids'],
}

const DOSSIER_CLAIM_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    claim: { type: 'string' },
    type: {
      type: 'string',
      enum: ['financial_fact', 'management_statement', 'third_party_claim', 'analyst_inference'],
    },
    verbatim_source_quote: { type: 'string', description: 'Empty string if null.' },
    source_url: { type: 'string', description: 'Empty string if null.' },
    source_date: { type: 'string', description: 'Empty string if null.' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['id', 'claim', 'type', 'verbatim_source_quote', 'source_url', 'source_date', 'confidence'],
}

const GENERATE_BRIEF_TOOL: Anthropic.Messages.Tool = {
  name: 'generate_research_brief',
  description:
    'Generate the final structured research brief from the evidence dossier. Call this when you have completed all 7 steps.',
  input_schema: {
    type: 'object',
    properties: {
      input_quality: {
        type: 'object',
        properties: {
          score: { type: 'number', description: 'Thesis input quality score 1-10.' },
          issues: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific input issues (factual errors, internal inconsistencies). Empty if none.',
          },
        },
        required: ['score', 'issues'],
      },
      thesis_restatement: {
        type: 'string',
        description: "1-2 sentences restating only what the user actually claimed.",
      },
      thesis_does_not_claim: {
        type: 'array',
        items: { type: 'string' },
        description: '3-5 positions the user did NOT take, to prevent strawmanning.',
      },
      valuation_bridge: {
        type: 'object',
        properties: {
          available: { type: 'boolean' },
          reason_unavailable: {
            type: 'string',
            description: 'Required when available=false. Empty string when available=true.',
          },
          implied_eps: { type: 'number', description: 'Required when available=true.' },
          implied_multiple: { type: 'number', description: 'Required when available=true.' },
          base_year: { type: 'string', description: 'Fiscal year for the bridge (e.g., "FY2026").' },
          consensus_eps: { type: 'number', description: 'Consensus EPS estimate for comparison.' },
          consensus_multiple: { type: 'number', description: 'Current consensus multiple for comparison.' },
          gap_analysis: {
            type: 'string',
            description: 'What has to be true for the price target to be reached.',
          },
        },
        required: ['available'],
      },
      thesis_quality: {
        type: 'object',
        properties: {
          overall_tier: { type: 'string', enum: ['Strong', 'Moderate', 'Weak', 'Against'] },
          macro_alignment: SCORE_BLOCK_SCHEMA,
          valuation_support: SCORE_BLOCK_SCHEMA,
          catalyst_clarity: SCORE_BLOCK_SCHEMA,
          risk_reward: SCORE_BLOCK_SCHEMA,
        },
        required: ['overall_tier', 'macro_alignment', 'valuation_support', 'catalyst_clarity', 'risk_reward'],
      },
      supporting_evidence: {
        type: 'array',
        items: CLAIM_REF_SCHEMA,
        description: '3-4 evidence items supporting the thesis. Each must cite claim_ids.',
        minItems: 3,
        maxItems: 5,
      },
      risk_factors: {
        type: 'array',
        items: CLAIM_REF_SCHEMA,
        description: '3-4 specific risks to the thesis. Each must cite claim_ids.',
        minItems: 3,
        maxItems: 5,
      },
      counter_brief: {
        type: 'string',
        description:
          'Attack the single weakest claim in the thesis. State which claim you are attacking. Anchor the attack to specific dossier evidence.',
      },
      bull_case: {
        type: 'string',
        description: '2-3 sentences: what conditions would need to materialize for the thesis to work.',
      },
      bear_case: {
        type: 'string',
        description: '2-3 sentences: most probable path to losses, what the market prices incorrectly.',
      },
      bottom_line: {
        type: 'string',
        description:
          'Reconcile input_quality and thesis_quality explicitly. 2-3 sentences. Do not hedge.',
      },
      sources: {
        type: 'array',
        items: DOSSIER_CLAIM_SCHEMA,
        description: 'Subset of dossier claims actually cited anywhere in this brief.',
      },
    },
    required: [
      'input_quality',
      'thesis_restatement',
      'thesis_does_not_claim',
      'valuation_bridge',
      'thesis_quality',
      'supporting_evidence',
      'risk_factors',
      'counter_brief',
      'bull_case',
      'bear_case',
      'bottom_line',
      'sources',
    ],
  },
}

function buildThinkingConfig(): { type: 'enabled'; budget_tokens: number } | undefined {
  const level = process.env.SYNTHESIZER_THINKING
  if (!level || level === 'off') return undefined
  const budgetMap: Record<string, number> = { low: 2000, medium: 5000, high: 10000 }
  const budget = budgetMap[level] ?? 10000
  return { type: 'enabled', budget_tokens: budget }
}

function dossierToUserMessage(dossier: Dossier): string {
  const claimsText = dossier.claims
    .map((c) => {
      const quote = c.verbatim_source_quote ? `\n  Quote: "${c.verbatim_source_quote}"` : ''
      const url = c.source_url ? `\n  Source: ${c.source_url}` : ''
      const date = c.source_date ? ` (${c.source_date})` : ''
      return `[${c.id}] (${c.type}, confidence: ${c.confidence})${date}\n  ${c.claim}${quote}${url}`
    })
    .join('\n\n')

  const atomicClaims = dossier.thesis_atomic_claims.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
  const internalIssues =
    dossier.thesis_internal_issues.length > 0
      ? dossier.thesis_internal_issues.map((s) => `  - ${s}`).join('\n')
      : '  (none found)'

  const fmpBlock = dossier.fmp_data
    ? `\nVERIFIED FMP DATA: Price $${dossier.fmp_data.price.toFixed(2)}, EPS $${dossier.fmp_data.eps?.toFixed(2) ?? 'N/A'}, P/E TTM ${dossier.fmp_data.peRatioTTM?.toFixed(1) ?? 'N/A'}x`
    : ''

  return `EVIDENCE DOSSIER
Subject: ${dossier.subject} (${dossier.subject_type})${fmpBlock}

THESIS ATOMIC CLAIMS:
${atomicClaims}

THESIS INTERNAL ISSUES (factual QA from dossier stage):
${internalIssues}

CLAIMS:
${claimsText}

Execute the 7-step process and call generate_research_brief when complete.`
}

export async function synthesizeBrief(dossier: Dossier, onStatus: (msg: string) => void): Promise<Brief> {
  const model = process.env.SYNTHESIZER_MODEL ?? 'claude-sonnet-4-6'
  const thinkingConfig = buildThinkingConfig()

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: dossierToUserMessage(dossier) },
  ]

  // Thinking requires higher max_tokens to accommodate thinking budget + output
  const maxTokens = thinkingConfig ? Math.max(16000, thinkingConfig.budget_tokens + 8000) : 8096

  let briefInput: any = null

  // First call: with extended thinking if configured, tool_choice auto
  try {
    const createParams: any = {
      model,
      max_tokens: maxTokens,
      system: SYNTHESIZER_SYSTEM_PROMPT,
      tools: [GENERATE_BRIEF_TOOL],
      tool_choice: { type: 'auto' },
      messages,
    }

    if (thinkingConfig) {
      createParams.thinking = thinkingConfig
    }

    const response: Anthropic.Messages.Message = await anthropic.messages.create(createParams)
    messages.push({ role: 'assistant', content: response.content })

    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === 'generate_research_brief') {
        briefInput = block.input
        break
      }
    }
  } catch (err: any) {
    // Extended thinking may fail with certain models — try without thinking
    if (thinkingConfig) {
      onStatus('Retrying synthesis without extended thinking…')
      const response = await anthropic.messages.create({
        model,
        max_tokens: 8096,
        system: SYNTHESIZER_SYSTEM_PROMPT,
        tools: [GENERATE_BRIEF_TOOL],
        tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: dossierToUserMessage(dossier) }],
      })
      messages.length = 0
      messages.push({ role: 'user', content: dossierToUserMessage(dossier) })
      messages.push({ role: 'assistant', content: response.content })

      for (const block of response.content) {
        if (block.type === 'tool_use' && block.name === 'generate_research_brief') {
          briefInput = block.input
          break
        }
      }
    } else {
      throw err
    }
  }

  // Second call: force the tool if model didn't call it
  if (!briefInput) {
    messages.push({
      role: 'user',
      content: 'Now call the generate_research_brief tool to produce your structured brief.',
    })

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8096,
      system: SYNTHESIZER_SYSTEM_PROMPT,
      tools: [GENERATE_BRIEF_TOOL],
      tool_choice: { type: 'tool', name: 'generate_research_brief' } as const,
      messages,
    })

    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === 'generate_research_brief') {
        briefInput = block.input
        break
      }
    }
  }

  if (!briefInput) {
    throw new Error('Synthesizer failed to produce a structured brief.')
  }

  // Normalize nullable string fields in sources
  const normalizeSources = (sources: any[]) =>
    (sources ?? []).map((s: any) => ({
      ...s,
      verbatim_source_quote: s.verbatim_source_quote || null,
      source_url: s.source_url || null,
      source_date: s.source_date || null,
    }))

  const brief: Brief = {
    input_quality: briefInput.input_quality ?? { score: 5, issues: [] },
    thesis_restatement: briefInput.thesis_restatement ?? '',
    thesis_does_not_claim: briefInput.thesis_does_not_claim ?? [],
    valuation_bridge: briefInput.valuation_bridge ?? { available: false, reason_unavailable: 'Not provided.' },
    thesis_quality: briefInput.thesis_quality ?? {
      overall_tier: 'Moderate',
      macro_alignment: { score: 5, rationale: '', supporting_claim_ids: [] },
      valuation_support: { score: 5, rationale: '', supporting_claim_ids: [] },
      catalyst_clarity: { score: 5, rationale: '', supporting_claim_ids: [] },
      risk_reward: { score: 5, rationale: '', supporting_claim_ids: [] },
    },
    supporting_evidence: briefInput.supporting_evidence ?? [],
    risk_factors: briefInput.risk_factors ?? [],
    counter_brief: briefInput.counter_brief ?? '',
    bull_case: briefInput.bull_case ?? '',
    bear_case: briefInput.bear_case ?? '',
    bottom_line: briefInput.bottom_line ?? '',
    sources: normalizeSources(briefInput.sources),
  }

  return brief
}
