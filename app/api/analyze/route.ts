import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt } from '@/lib/prompts'
import { getDataForSubject } from '@/lib/data-strategies'
import type { StockData } from '@/lib/types'

export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const GENERATE_BRIEF_TOOL: Anthropic.Messages.Tool = {
  name: 'generate_research_brief',
  description:
    'Generate a structured, institutional-grade investment research brief that stress-tests the investor\'s thesis. Call this tool after gathering sufficient context to produce a thorough, data-driven analysis.',
  input_schema: {
    type: 'object',
    properties: {
      thesis_summary: {
        type: 'string',
        description: "Restate the investor's thesis in one precise, declarative sentence.",
      },
      conviction: {
        type: 'object',
        description: 'Your independent conviction assessment — scores reflect YOUR view, not the investor\'s enthusiasm.',
        properties: {
          overall_tier: {
            type: 'string',
            enum: ['Strong', 'Moderate', 'Weak', 'Against'],
            description: 'Your top-level conviction tier for this thesis.',
          },
          macro_alignment: {
            type: 'object',
            description: 'Does the macro environment support this thesis?',
            properties: {
              score: { type: 'number', description: 'Score 1–10' },
              rationale: { type: 'string', description: 'One sentence explanation with specific data.' },
            },
            required: ['score', 'rationale'],
          },
          valuation_support: {
            type: 'object',
            description: 'Do current valuations support entry here?',
            properties: {
              score: { type: 'number', description: 'Score 1–10' },
              rationale: { type: 'string', description: 'One sentence with specific multiples or comparisons.' },
            },
            required: ['score', 'rationale'],
          },
          catalyst_clarity: {
            type: 'object',
            description: 'Are the catalysts specific and near-term?',
            properties: {
              score: { type: 'number', description: 'Score 1–10' },
              rationale: { type: 'string', description: 'One sentence identifying the clearest catalyst or why it is fuzzy.' },
            },
            required: ['score', 'rationale'],
          },
          risk_reward: {
            type: 'object',
            description: 'Does the risk/reward profile justify the position?',
            properties: {
              score: { type: 'number', description: 'Score 1–10' },
              rationale: { type: 'string', description: 'One sentence quantifying the asymmetry or lack thereof.' },
            },
            required: ['score', 'rationale'],
          },
        },
        required: ['overall_tier', 'macro_alignment', 'valuation_support', 'catalyst_clarity', 'risk_reward'],
      },
      supporting_evidence: {
        type: 'array',
        items: { type: 'string' },
        description: '3–4 specific data points that support or partially support the thesis. Include numbers, dates, and context.',
        minItems: 3,
        maxItems: 4,
      },
      risk_factors: {
        type: 'array',
        items: { type: 'string' },
        description: '3–4 specific, concrete risks to the thesis. Quantify where possible.',
        minItems: 3,
        maxItems: 4,
      },
      counter_brief: {
        type: 'string',
        description:
          'The most critical section. Identify the single weakest link in the thesis and dismantle it directly and aggressively with specific evidence, data, and alternative analysis. This is the devil\'s advocate centerpiece — do not soften it or hedge. If the thesis is fundamentally flawed, say so and explain why clearly.',
      },
      bull_case: {
        type: 'string',
        description: '2–3 sentences outlining the bull case and what specific conditions would have to materialize for the thesis to work.',
      },
      bear_case: {
        type: 'string',
        description: '2–3 sentences outlining the most probable path to losses and what the market is pricing incorrectly.',
      },
      bottom_line: {
        type: 'string',
        description: '2–3 sentences. Your final, direct assessment. Do not hedge. If the thesis is wrong, say so.',
      },
    },
    required: [
      'thesis_summary',
      'conviction',
      'supporting_evidence',
      'risk_factors',
      'counter_brief',
      'bull_case',
      'bear_case',
      'bottom_line',
    ],
  },
}

const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 3,
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
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

function buildVerifiedDataBlock(d: StockData, today: string): string {
  return `VERIFIED FINANCIAL DATA for ${d.ticker} (${d.companyName}):
- Sector: ${d.sector || 'N/A'} | Industry: ${d.industry || 'N/A'}
- Current Price: $${d.price.toFixed(2)} (as of ${today})
- Market Cap: ${fmtLarge(d.marketCap)}
- P/E (TTM): ${d.peRatioTTM != null ? d.peRatioTTM.toFixed(1) + 'x' : 'N/A'}
- 52-Week Range: $${d.yearLow.toFixed(2)} – $${d.yearHigh.toFixed(2)}
- 50-Day Avg: $${d.priceAvg50.toFixed(2)} | 200-Day Avg: $${d.priceAvg200.toFixed(2)}
- Revenue (latest FY): ${fmtLarge(d.revenue)} | Revenue Growth YoY: ${pctStr(d.revenueGrowthYoY)}
- Gross Margin: ${d.grossProfitMarginTTM != null ? d.grossProfitMarginTTM.toFixed(1) + '%' : 'N/A'} | Operating Margin: ${d.operatingProfitMarginTTM != null ? d.operatingProfitMarginTTM.toFixed(1) + '%' : 'N/A'} | Net Margin: ${d.netProfitMarginTTM != null ? d.netProfitMarginTTM.toFixed(1) + '%' : 'N/A'}
- EPS: ${d.eps != null ? '$' + d.eps.toFixed(2) : 'N/A'} | ROE: ${d.returnOnEquityTTM != null ? d.returnOnEquityTTM.toFixed(1) + '%' : 'N/A'} | Debt/Equity: ${d.debtToEquityTTM != null ? d.debtToEquityTTM.toFixed(2) : 'N/A'}

USE THIS DATA AS GROUND TRUTH. Do not contradict these numbers. If you need additional data points beyond what is listed here, use web search.`
}

export async function POST(req: Request) {
  const { subject, thesis } = await req.json()

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        send('status', { message: 'Fetching market data…' })

        // Fetch FMP data (or null for non-stocks)
        const subjectData = await getDataForSubject(subject)
        const { stockData } = subjectData

        // Emit stock_data immediately so the frontend can render MetricsCard
        send('stock_data', stockData)

        const systemPrompt = getSystemPrompt(subjectData.type)
        const today = new Date().toISOString().split('T')[0]

        // Build the user message — prepend verified data block for stocks
        const verifiedBlock = stockData ? buildVerifiedDataBlock(stockData, today) : ''
        const userContent = [
          verifiedBlock,
          `Subject: ${subject}`,
          `Investment Thesis:\n${thesis}`,
        ].filter(Boolean).join('\n\n')

        send('status', { message: 'Initializing research desk…' })

        const messages: Anthropic.Messages.MessageParam[] = [
          { role: 'user', content: userContent },
        ]

        let brief: unknown = null
        const MAX_ITER = 6

        for (let iter = 0; iter < MAX_ITER && !brief; iter++) {
          const forceStructured = iter > 0
          const toolChoice = forceStructured
            ? ({ type: 'tool', name: 'generate_research_brief' } as const)
            : ({ type: 'auto' } as const)

          let response: Anthropic.Messages.Message

          try {
            response = await anthropic.messages.create(
              {
                model: 'claude-opus-4-7',
                max_tokens: 8096,
                system: systemPrompt,
                // @ts-ignore — web_search_20250305 is a beta built-in tool
                tools: forceStructured
                  ? [GENERATE_BRIEF_TOOL]
                  : [WEB_SEARCH_TOOL, GENERATE_BRIEF_TOOL],
                tool_choice: toolChoice,
                messages,
              },
              { headers: { 'anthropic-beta': 'web-search-2025-03-05' } }
            )
          } catch {
            send('status', { message: 'Analyzing…' })
            response = await anthropic.messages.create({
              model: 'claude-opus-4-7',
              max_tokens: 8096,
              system: systemPrompt,
              tools: [GENERATE_BRIEF_TOOL],
              tool_choice: { type: 'tool', name: 'generate_research_brief' },
              messages,
            })
          }

          messages.push({ role: 'assistant', content: response.content })

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

          for (const block of response.content) {
            if (block.type !== 'tool_use') continue

            if (block.name === 'generate_research_brief') {
              brief = block.input
              break
            }

            if (block.name === 'web_search') {
              const query = (block.input as any)?.query ?? subject
              send('status', { message: `Searching: "${query}"…` })
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: `Search acknowledged for: ${query}`,
              })
            }
          }

          if (brief) break

          if (toolResults.length > 0) {
            messages.push({ role: 'user', content: toolResults })
            send('status', { message: 'Processing market intelligence…' })
          } else if (response.stop_reason === 'end_turn') {
            messages.push({
              role: 'user',
              content: 'Now call the generate_research_brief tool to produce your structured analysis.',
            })
          }
        }

        if (brief) {
          send('brief', brief)
        } else {
          send('error', { message: 'Failed to generate structured brief. Please try again.' })
        }
      } catch (err: any) {
        send('error', { message: err?.message ?? 'An unexpected error occurred.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
