import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt } from '@/lib/prompts'
import { getDataForSubject } from '@/lib/data-strategies'

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

// Web search tool definition (Anthropic built-in, requires beta header)
const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 3,
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const { subject, thesis } = await req.json()

  const subjectData = await getDataForSubject(subject)
  const systemPrompt = getSystemPrompt(subjectData.type)

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)))
      }

      try {
        send('status', { message: 'Initializing research desk...' })

        const userContent = `Subject: ${subject}\n\nInvestment Thesis:\n${thesis}${subjectData.additionalContext ? `\n\nAdditional context:\n${subjectData.additionalContext}` : ''}`

        const messages: Anthropic.Messages.MessageParam[] = [
          { role: 'user', content: userContent },
        ]

        let brief: unknown = null
        let searchCount = 0
        const MAX_ITER = 6

        for (let iter = 0; iter < MAX_ITER && !brief; iter++) {
          // After the first search pass, force structured output
          const forceStructured = iter > 0
          const toolChoice = forceStructured
            ? ({ type: 'tool', name: 'generate_research_brief' } as const)
            : ({ type: 'auto' } as const)

          let response: Anthropic.Messages.Message

          try {
            // Attempt with web search beta
            response = await anthropic.messages.create(
              {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8096,
                system: systemPrompt,
                // @ts-ignore — web_search_20250305 is a beta built-in tool
                tools: forceStructured
                  ? [GENERATE_BRIEF_TOOL]
                  : [WEB_SEARCH_TOOL, GENERATE_BRIEF_TOOL],
                tool_choice: toolChoice,
                messages,
              },
              {
                headers: { 'anthropic-beta': 'web-search-2025-03-05' },
              }
            )
          } catch (betaErr: any) {
            // Beta unavailable — skip web search, force structured output directly
            send('status', { message: 'Analyzing with training data...' })
            response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
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
              searchCount++
              const query = (block.input as any)?.query ?? subject
              send('status', { message: `Searching: "${query}"…` })
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                // The beta API executes the search server-side; acknowledge the call
                content: `Search acknowledged for: ${query}`,
              })
            }
          }

          if (brief) break

          if (toolResults.length > 0) {
            messages.push({ role: 'user', content: toolResults })
            send('status', { message: 'Processing market intelligence...' })
          } else if (response.stop_reason === 'end_turn') {
            // Claude responded in text without calling a tool — nudge it
            messages.push({
              role: 'user',
              content: 'Now call the generate_research_brief tool to produce your structured analysis.',
            })
          }
        }

        if (brief) {
          send('brief', brief)
        } else {
          send('error', { message: 'Failed to generate structured brief after maximum iterations. Please try again.' })
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
