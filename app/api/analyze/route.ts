import { getDataForSubject } from '@/lib/data-strategies'
import { buildDossier } from '@/lib/analysis/dossier'
import { synthesizeBrief } from '@/lib/analysis/synthesizer'
import { runValidators } from '@/lib/analysis/validators'
import { readDossierCache, writeDossierCache } from '@/lib/cache/dossier-cache'

export const maxDuration = 300

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
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

        // Stage 0: detect subject type + fetch FMP data for stocks
        const subjectData = await getDataForSubject(subject)
        const { stockData } = subjectData

        // Emit stock_data immediately so MetricsCard renders before the brief arrives
        send('stock_data', stockData)

        // Stage A: build evidence dossier (Haiku 4.5 + web search)
        send('status', { message: 'Gathering evidence…' })

        let dossier = readDossierCache(subject, thesis)

        if (!dossier) {
          dossier = await buildDossier(
            subject,
            thesis,
            stockData,
            subjectData.type,
            (msg) => send('status', { message: msg })
          )
          writeDossierCache(subject, thesis, dossier)
        }

        // Emit dossier_ready for future frontend use (ignored by current frontend)
        send('dossier_ready', {
          claim_count: dossier.claims.length,
          subject_type: dossier.subject_type,
          thesis_atomic_claims: dossier.thesis_atomic_claims,
          thesis_internal_issues: dossier.thesis_internal_issues,
        })

        // Stage B: synthesize brief (Sonnet 4.6 + extended thinking)
        send('status', { message: 'Stress-testing thesis…' })

        const brief = await synthesizeBrief(dossier, (msg) => send('status', { message: msg }))

        // Run deterministic validators
        const validationWarnings = runValidators(brief, dossier)
        if (validationWarnings.length > 0) {
          send('validation_warnings', { warnings: validationWarnings })
        }

        send('brief', brief)
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
      Connection: 'keep-alive',
    },
  })
}
