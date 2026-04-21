import Anthropic from '@anthropic-ai/sdk'
import type { Dossier } from '@/lib/analysis/types'
import type { StockData } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const DOSSIER_SYSTEM_PROMPT = `You are a research associate building an evidence dossier. You do NOT write analysis, narratives, or recommendations. You gather and categorize claims.

For every claim you enter into the dossier:
- Assign a unique ID (C1, C2, C3...)
- Categorize the type:
  * financial_fact: verifiable from SEC filings, earnings releases, or the verified financial data provided
  * management_statement: quotes from company executives, official guidance, forward-looking opportunity language
  * third_party_claim: analyst estimates, industry reports, news coverage, competitor disclosures
  * analyst_inference: your own reasoning connecting dots (use sparingly — prefer primary sources)

- For management_statement and third_party_claim types, you MUST provide a verbatim_source_quote. If you cannot produce a verbatim quote from the source text, do NOT enter the claim in the dossier.

- Include source_url and source_date when available.

- Rate confidence:
  * high: primary source, current (within 6 months), verifiable
  * medium: secondary source or 6-12 months old
  * low: inferred, weakly sourced, or older than 12 months

Also output:
- thesis_atomic_claims: break the user's thesis into 3-7 atomic statements they are actually making. Use their exact framing. Do not add interpretation.
- thesis_internal_issues: factual errors, stale numbers, internal contradictions (e.g., 'price target below current spot', 'wrong fiscal year attribution'). This is factual QA, not thesis analysis.

Target range: 15-25 claims. Prioritize primary sources (SEC filings, earnings calls, company press releases) over secondary coverage. Do NOT include claims without verbatim quotes for third-party or management statements.`

const GENERATE_DOSSIER_TOOL: Anthropic.Messages.Tool = {
  name: 'generate_dossier',
  description:
    'Generate the structured evidence dossier from gathered research. Call this when you have gathered sufficient primary and secondary source material.',
  input_schema: {
    type: 'object',
    properties: {
      subject: { type: 'string' },
      subject_type: {
        type: 'string',
        enum: ['stock', 'commodity', 'asset_class', 'market', 'unknown'],
      },
      thesis_atomic_claims: {
        type: 'array',
        description: "The user's thesis broken into 3-7 atomic statements using their exact framing.",
        items: { type: 'string' },
      },
      thesis_internal_issues: {
        type: 'array',
        description: 'Factual errors, stale numbers, internal contradictions in the thesis. Empty array if none found.',
        items: { type: 'string' },
      },
      claims: {
        type: 'array',
        description: '15-25 evidence claims from primary and secondary sources.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Sequential ID: C1, C2, C3...' },
            claim: { type: 'string', description: 'Paraphrased claim in analyst voice.' },
            type: {
              type: 'string',
              enum: ['financial_fact', 'management_statement', 'third_party_claim', 'analyst_inference'],
            },
            verbatim_source_quote: {
              type: 'string',
              description:
                'REQUIRED for management_statement and third_party_claim. Exact quote from source. Use empty string if financial_fact or analyst_inference.',
            },
            source_url: { type: 'string', description: 'Source URL if available, empty string if not.' },
            source_date: {
              type: 'string',
              description: 'Publication date of source (YYYY-MM-DD). Empty string if unknown.',
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: [
            'id',
            'claim',
            'type',
            'verbatim_source_quote',
            'source_url',
            'source_date',
            'confidence',
          ],
        },
      },
    },
    required: ['subject', 'subject_type', 'thesis_atomic_claims', 'thesis_internal_issues', 'claims'],
  },
}

const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 3,
}

function fmtLarge(n: number | null): string {
  if (n == null) return 'N/A'
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toFixed(0)}`
}

function pctStr(n: number | null): string {
  if (n == null) return 'N/A'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function buildVerifiedDataBlock(d: StockData): string {
  const today = new Date().toISOString().split('T')[0]
  return `VERIFIED FINANCIAL DATA for ${d.ticker} (${d.companyName}) — USE AS GROUND TRUTH. Do not contradict these numbers:
- Sector: ${d.sector || 'N/A'} | Industry: ${d.industry || 'N/A'}
- Current Price: $${d.price.toFixed(2)} (as of ${today})
- Market Cap: ${fmtLarge(d.marketCap)}
- P/E (TTM): ${d.peRatioTTM != null ? d.peRatioTTM.toFixed(1) + 'x' : 'N/A'}
- 52-Week Range: $${d.yearLow.toFixed(2)} – $${d.yearHigh.toFixed(2)}
- 50-Day Avg: $${d.priceAvg50.toFixed(2)} | 200-Day Avg: $${d.priceAvg200.toFixed(2)}
- Revenue (latest FY): ${fmtLarge(d.revenue)} | Revenue Growth YoY: ${pctStr(d.revenueGrowthYoY)}
- Gross Margin: ${d.grossProfitMarginTTM != null ? d.grossProfitMarginTTM.toFixed(1) + '%' : 'N/A'} | Operating Margin: ${d.operatingProfitMarginTTM != null ? d.operatingProfitMarginTTM.toFixed(1) + '%' : 'N/A'} | Net Margin: ${d.netProfitMarginTTM != null ? d.netProfitMarginTTM.toFixed(1) + '%' : 'N/A'}
- EPS: ${d.eps != null ? '$' + d.eps.toFixed(2) : 'N/A'} | ROE: ${d.returnOnEquityTTM != null ? d.returnOnEquityTTM.toFixed(1) + '%' : 'N/A'} | Debt/Equity: ${d.debtToEquityTTM != null ? d.debtToEquityTTM.toFixed(2) : 'N/A'}`
}

export async function buildDossier(
  subject: string,
  thesis: string,
  stockData: StockData | null,
  subjectType: string,
  onStatus: (msg: string) => void
): Promise<Dossier> {
  const model = process.env.DOSSIER_MODEL ?? 'claude-haiku-4-5-20251001'

  const verifiedBlock = stockData ? buildVerifiedDataBlock(stockData) : ''
  const userContent = [
    verifiedBlock,
    `Subject: ${subject}`,
    `Subject Type: ${subjectType}`,
    `Investment Thesis:\n${thesis}`,
    'Search for recent primary sources (SEC filings, earnings calls, company press releases) and secondary sources (analyst reports, news). Then call generate_dossier with all gathered claims.',
  ]
    .filter(Boolean)
    .join('\n\n')

  const messages: Anthropic.Messages.MessageParam[] = [{ role: 'user', content: userContent }]

  const MAX_ITER = 8
  let dossierInput: any = null

  for (let iter = 0; iter < MAX_ITER && !dossierInput; iter++) {
    const forceStructured = iter > 0
    const toolChoice = forceStructured
      ? ({ type: 'tool', name: 'generate_dossier' } as const)
      : ({ type: 'auto' } as const)

    let response: Anthropic.Messages.Message

    try {
      response = await anthropic.messages.create(
        {
          model,
          max_tokens: 8096,
          system: DOSSIER_SYSTEM_PROMPT,
          // @ts-ignore — web_search_20250305 is a beta built-in tool
          tools: forceStructured ? [GENERATE_DOSSIER_TOOL] : [WEB_SEARCH_TOOL, GENERATE_DOSSIER_TOOL],
          tool_choice: toolChoice,
          messages,
        },
        { headers: { 'anthropic-beta': 'web-search-2025-03-05' } }
      )
    } catch {
      response = await anthropic.messages.create({
        model,
        max_tokens: 8096,
        system: DOSSIER_SYSTEM_PROMPT,
        tools: [GENERATE_DOSSIER_TOOL],
        tool_choice: forceStructured ? ({ type: 'tool', name: 'generate_dossier' } as const) : ({ type: 'auto' } as const),
        messages,
      })
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      if (block.name === 'generate_dossier') {
        dossierInput = block.input
        break
      }

      if (block.name === 'web_search') {
        const query = (block.input as any)?.query ?? subject
        onStatus(`Searching: "${query}"…`)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Search acknowledged for: ${query}`,
        })
      }
    }

    if (dossierInput) break

    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults })
    } else if (response.stop_reason === 'end_turn') {
      messages.push({
        role: 'user',
        content: 'Now call the generate_dossier tool to produce your structured evidence dossier.',
      })
    }
  }

  if (!dossierInput) {
    throw new Error('Dossier stage failed to produce structured output within iteration limit.')
  }

  // Normalize nullable string fields (model may return empty string instead of null)
  const normalizeClaims = (claims: any[]) =>
    claims.map((c) => ({
      ...c,
      verbatim_source_quote: c.verbatim_source_quote || null,
      source_url: c.source_url || null,
      source_date: c.source_date || null,
    }))

  const dossier: Dossier = {
    subject,
    subject_type: dossierInput.subject_type ?? subjectType,
    thesis_atomic_claims: dossierInput.thesis_atomic_claims ?? [],
    thesis_internal_issues: dossierInput.thesis_internal_issues ?? [],
    claims: normalizeClaims(dossierInput.claims ?? []),
    fmp_data: stockData,
  }

  return dossier
}
