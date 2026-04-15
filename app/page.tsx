'use client'

import { useState } from 'react'
import BriefDisplay from '@/components/BriefDisplay'
import type { ResearchBrief } from '@/lib/types'

const DEFAULT_SUBJECT = 'NVDA'
const DEFAULT_THESIS =
  "NVDA is the defining infrastructure play of the AI decade. Their CUDA moat is 10+ years deep, hyperscalers are locked in, and every serious AI lab runs on their hardware. Data center revenue hit $47.5B in FY2025, up 142% YoY. With Blackwell ramping and sovereign AI demand just beginning, this is still early innings — inference alone will triple their TAM by 2027. I'm long with a 12-month target of $175."

type Status = 'idle' | 'loading' | 'done' | 'error'

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-gold-700/40 border-t-gold-500 rounded-full animate-spin-slow" />
  )
}

export default function Home() {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [thesis, setThesis] = useState(DEFAULT_THESIS)
  const [brief, setBrief] = useState<ResearchBrief | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')

  const isRunning = status === 'loading'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBrief(null)
    setError('')
    setStatus('loading')
    setStatusMsg('Connecting to research desk…')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), thesis: thesis.trim() }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })

        // SSE blocks are separated by double newline
        const blocks = buf.split('\n\n')
        buf = blocks.pop() ?? ''

        for (const block of blocks) {
          if (!block.trim()) continue

          let eventType = ''
          let dataLine = ''

          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            if (line.startsWith('data: '))  dataLine  = line.slice(6).trim()
          }

          if (!dataLine) continue

          try {
            const payload = JSON.parse(dataLine)

            if (eventType === 'status') {
              setStatusMsg(payload.message)
            } else if (eventType === 'brief') {
              setBrief(payload as ResearchBrief)
              setStatus('done')
              setStatusMsg('')
            } else if (eventType === 'error') {
              setError(payload.message ?? 'Unknown error')
              setStatus('error')
            }
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }

      if (status !== 'done' && status !== 'error') {
        setStatus('idle')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error')
      setStatus('error')
    }
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
            Enter any subject and your investment thesis. The desk generates an institutional-grade brief
            that challenges your reasoning with data, not encouragement.
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="bg-navy-800 border border-white/[0.06] rounded-2xl p-6 space-y-5">
            {/* Subject */}
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

            {/* Thesis */}
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

            {/* Footer row */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-700 font-body">
                Stocks · Commodities · Macro themes · Asset classes
              </p>
              <button
                type="submit"
                disabled={isRunning}
                className="flex items-center gap-2.5 px-7 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-950 font-display font-bold text-xs tracking-[0.16em] uppercase rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRunning && <Spinner />}
                {isRunning ? 'Analyzing…' : 'Generate Brief'}
              </button>
            </div>
          </div>
        </form>

        {/* ── Status line ── */}
        {isRunning && statusMsg && (
          <div className="flex items-center gap-3 mb-8 text-slate-500 text-xs font-body">
            <Spinner />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="mb-8 p-4 bg-rose-950/30 border border-rose-800/30 rounded-lg text-rose-400 text-sm font-body">
            {error}
          </div>
        )}

        {/* ── Brief ── */}
        {brief && <BriefDisplay brief={brief} />}
      </main>
    </div>
  )
}
