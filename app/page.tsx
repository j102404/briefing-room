'use client'

import { useRef, useState } from 'react'
import BriefDisplay from '@/components/BriefDisplay'
import MetricsCard from '@/components/MetricsCard'
import SourcesDrawer from '@/components/SourcesDrawer'
import PdfDownload from '@/components/PdfDownload'
import type { Brief, StockData } from '@/lib/types'
import type { DossierClaim } from '@/lib/analysis/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const EXAMPLES = [
  {
    label: 'NVDA — Bullish',
    subject: 'NVDA',
    thesis:
      'NVDA is the defining infrastructure play of the AI decade. CUDA moat is 10+ years deep, hyperscalers locked in, inference TAM tripling by 2027. Long with 12-month target of $280.',
  },
  {
    label: 'GME — Weak Thesis',
    subject: 'GME',
    thesis:
      'GameStop is going to $500 because Reddit community sentiment is building again and Ryan Cohen will transform the business.',
  },
  {
    label: 'Gold — Commodity',
    subject: 'Gold',
    thesis:
      'Gold runs to $3,500 by year end driven by central bank buying, geopolitical tensions, and a Fed dovish pivot.',
  },
  {
    label: 'Office CRE — Bearish',
    subject: 'Commercial Real Estate',
    thesis:
      'Commercial real estate faces a multi-year decline as remote work permanently reduces office demand and refinancing walls hit overleveraged landlords.',
  },
]

const LOADING_STAGES = [
  { id: 1, label: 'Market Data' },
  { id: 2, label: 'Gathering Evidence' },
  { id: 3, label: 'Building Dossier' },
  { id: 4, label: 'Synthesizing' },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block border-2 border-gold-700/40 border-t-gold-500 rounded-full animate-spin-slow ${className}`}
    />
  )
}

function LoadingProgress({ phase, statusMsg }: { phase: number; statusMsg: string }) {
  return (
    <div className="mb-8">
      {/* Stage track */}
      <div className="relative flex items-start justify-between mb-5">
        {/* Background rail */}
        <div className="absolute left-0 right-0 top-[9px] h-px bg-white/[0.05]" />
        {/* Progress rail */}
        <div
          className="absolute left-0 top-[9px] h-px bg-gold-700/50 transition-all duration-700 ease-out"
          style={{ width: `${((Math.max(phase, 1) - 1) / (LOADING_STAGES.length - 1)) * 100}%` }}
        />
        {LOADING_STAGES.map(stage => {
          const done   = stage.id < phase
          const active = stage.id === phase
          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-500 ${
                  done
                    ? 'bg-gold-600 border-2 border-gold-600'
                    : active
                    ? 'border-2 border-gold-500 bg-navy-900'
                    : 'border-2 border-white/10 bg-navy-900'
                }`}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-navy-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && (
                  <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                )}
              </div>
              <span
                className={`text-[9px] font-display font-semibold tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                  active ? 'text-gold-500' : done ? 'text-slate-500' : 'text-slate-700'
                }`}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-body">
          <Spinner className="w-3.5 h-3.5" />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function Home() {
  const [subject, setSubject]           = useState('NVDA')
  const [thesis, setThesis]             = useState(
    "NVDA is the defining infrastructure play of the AI decade. Their CUDA moat is 10+ years deep, hyperscalers are locked in, and every serious AI lab runs on their hardware. Data center revenue hit $47.5B in FY2025, up 142% YoY. With Blackwell ramping and sovereign AI demand just beginning, this is still early innings — inference alone will triple their TAM by 2027. I'm long with a 12-month target of $175."
  )
  const [brief, setBrief]               = useState<Brief | null>(null)
  const [stockData, setStockData]       = useState<StockData | null>(null)
  const [dossierClaims, setDossierClaims] = useState<DossierClaim[]>([])
  const [status, setStatus]             = useState<Status>('idle')
  const [statusMsg, setStatusMsg]       = useState('')
  const [error, setError]               = useState('')
  const [loadingPhase, setLoadingPhase] = useState(1)
  const [noDataWarning, setNoDataWarning] = useState('')
  const [drawerOpen, setDrawerOpen]     = useState(false)

  const briefRef  = useRef<HTMLDivElement>(null)
  const isRunning = status === 'loading'

  function advancePhase(n: number) {
    setLoadingPhase(prev => Math.max(prev, n))
  }

  async function runAnalysis(subj: string, thes: string) {
    setBrief(null)
    setStockData(null)
    setDossierClaims([])
    setError('')
    setNoDataWarning('')
    setDrawerOpen(false)
    setStatus('loading')
    setStatusMsg('Connecting to research desk…')
    setLoadingPhase(1)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subj.trim(), thesis: thes.trim() }),
      })

      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const blocks = buf.split('\n\n')
        buf = blocks.pop() ?? ''

        for (const block of blocks) {
          if (!block.trim()) continue

          let eventType = ''
          let dataLine  = ''

          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            if (line.startsWith('data: '))  dataLine  = line.slice(6).trim()
          }

          if (!dataLine) continue

          try {
            const payload = JSON.parse(dataLine)

            if (eventType === 'status') {
              const msg: string = payload.message ?? ''
              setStatusMsg(msg)
              const lower = msg.toLowerCase()
              if (lower.includes('gathering') || lower.includes('evidence')) {
                advancePhase(2)
              } else if (lower.includes('searching') || lower.includes('compiling')) {
                advancePhase(3)
              } else if (lower.includes('stress') || lower.includes('synthesiz')) {
                advancePhase(4)
              }
            } else if (eventType === 'stock_data') {
              setStockData(payload)
              advancePhase(2)
              if (
                payload === null &&
                /^[A-Z]{1,5}$/.test(subj.trim())
              ) {
                setNoDataWarning(
                  "Couldn't fetch live data for this ticker — analysis will proceed with web research only."
                )
              }
            } else if (eventType === 'dossier_ready') {
              if (Array.isArray(payload.claims)) {
                setDossierClaims(payload.claims)
              }
              advancePhase(4)
            } else if (eventType === 'brief') {
              setBrief(payload as Brief)
              setStatus('done')
              setStatusMsg('')
            } else if (eventType === 'validation_warnings') {
              console.warn('[BriefingRoom] Validation warnings:', payload.warnings)
            } else if (eventType === 'error') {
              setError(payload.message ?? 'Unknown error')
              setStatus('error')
            }
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }

      // If stream ended without a brief or error, set idle
      setStatus(s => (s === 'loading' ? 'idle' : s))
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error')
      setStatus('error')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    runAnalysis(subject, thesis)
  }

  function handleExample(ex: typeof EXAMPLES[0]) {
    setSubject(ex.subject)
    setThesis(ex.thesis)
    runAnalysis(ex.subject, ex.thesis)
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* ── Header ── */}
      <header className="border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-sm font-semibold tracking-[0.22em] text-gold-500 uppercase">
              The Briefing Room
            </h1>
            <p className="text-[10px] text-slate-600 tracking-[0.18em] uppercase mt-0.5 font-body">
              Investment Research Desk
            </p>
          </div>
          <div className="text-[10px] text-slate-700 font-display tracking-widest uppercase">
            Powered by Claude
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* ── Hero ── */}
        <div className="mb-10">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-100 leading-tight mb-4">
            Stress-test<br />
            <span className="text-gold-500">your thesis.</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl font-body leading-relaxed">
            Enter any subject and your investment thesis. The desk generates an institutional-grade
            brief that challenges your reasoning with data, not encouragement.
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="bg-navy-800 border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div>
              <label
                htmlFor="subject"
                className="block text-[10px] font-display font-semibold tracking-[0.16em] uppercase text-gold-600 mb-2"
              >
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="AAPL, Large-Cap Growth, Gold, Commercial Real Estate…"
                disabled={isRunning}
                required
                className="w-full bg-navy-950/80 border border-white/[0.07] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-700 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/40 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="thesis"
                className="block text-[10px] font-display font-semibold tracking-[0.16em] uppercase text-gold-600 mb-2"
              >
                Your Thesis
              </label>
              <textarea
                id="thesis"
                value={thesis}
                onChange={e => setThesis(e.target.value)}
                placeholder="I think energy rips from here because…"
                rows={5}
                disabled={isRunning}
                required
                className="w-full bg-navy-950/80 border border-white/[0.07] rounded-lg px-4 py-3 text-slate-100 placeholder-slate-700 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/40 transition-all resize-none leading-relaxed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-700 font-body">
                Stocks · Commodities · Macro themes · Asset classes
              </p>
              <button
                type="submit"
                disabled={isRunning}
                className="flex items-center gap-2.5 px-7 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 font-display font-bold text-xs tracking-[0.16em] uppercase rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRunning && <Spinner className="w-4 h-4" />}
                {isRunning ? 'Analyzing…' : 'Generate Brief'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Example buttons ── */}
        {!isRunning && !brief && (
          <div className="flex flex-wrap gap-2 mb-12">
            <span className="text-[10px] font-display font-semibold tracking-[0.14em] uppercase text-slate-700 self-center mr-1">
              Try:
            </span>
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex)}
                className="text-[10px] font-body text-slate-500 hover:text-slate-300 border border-white/[0.06] hover:border-white/[0.12] bg-navy-800/30 hover:bg-navy-800/60 px-3 py-1.5 rounded-full transition-all duration-200"
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Multi-stage loading ── */}
        {isRunning && (
          <LoadingProgress phase={loadingPhase} statusMsg={statusMsg} />
        )}

        {/* ── No-data warning (ticker not found in FMP) ── */}
        {noDataWarning && (
          <div className="mb-5 px-4 py-2.5 bg-navy-800/40 border border-white/[0.06] rounded-lg">
            <p className="text-[11px] text-slate-500 font-body leading-relaxed">
              ⚠ {noDataWarning}
            </p>
          </div>
        )}

        {/* ── MetricsCard (early render while brief still generating) ── */}
        {stockData && !brief && (
          <div className="mb-6">
            <MetricsCard data={stockData} />
          </div>
        )}

        {/* ── Error card ── */}
        {status === 'error' && (
          <div className="mb-8 p-5 bg-rose-950/30 border border-rose-800/30 rounded-xl">
            <p className="text-rose-400 text-sm font-body mb-4 leading-relaxed">{error}</p>
            <button
              onClick={() => runAnalysis(subject, thesis)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-700/30 text-rose-400 hover:text-rose-300 font-display text-[10px] tracking-[0.14em] uppercase rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* ── Full brief output ── */}
        {brief && (
          <>
            {/* PDF + brief header row */}
            <div className="flex items-center justify-between mb-4 brief-animate" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-display font-semibold tracking-[0.2em] uppercase text-gold-600">
                  Research Brief
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="ml-4 flex-shrink-0">
                <PdfDownload
                  targetRef={briefRef}
                  subject={subject}
                  onBeforeCapture={async () => {
                    setDrawerOpen(true)
                  }}
                />
              </div>
            </div>

            {/* Captured region for PDF */}
            <div ref={briefRef} className="space-y-5">
              <BriefDisplay brief={brief} stockData={stockData} />
              <SourcesDrawer
                claims={dossierClaims.length > 0 ? dossierClaims : (brief.sources ?? [])}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
