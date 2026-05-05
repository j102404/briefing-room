'use client'

import type { Brief, StockData } from '@/lib/types'
import type { Conviction } from '@/lib/types'
import ConvictionBadge from './ConvictionBadge'
import MetricsCard from './MetricsCard'

function SectionCard({
  label,
  children,
  delay = 0,
  className = '',
}: {
  label: string
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={`bg-navy-800/50 border border-white/[0.06] rounded-xl p-5 brief-animate ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[10px] font-display font-semibold tracking-[0.14em] uppercase text-slate-500 mb-3">
        {label}
      </p>
      {children}
    </div>
  )
}

function BulletList({
  items,
  accent,
}: {
  items: Array<{ text: string; claim_ids: string[] }>
  accent: 'green' | 'red'
}) {
  const dotColor = accent === 'green' ? 'bg-emerald-500' : 'bg-rose-500'
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed font-body">
          <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span>
            {item.text}
            {item.claim_ids.length > 0 && (
              <span className="ml-1.5 text-[10px] text-slate-600 font-display tracking-wide">
                [{item.claim_ids.join(', ')}]
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ValuationBridgeCard({ bridge }: { bridge: Brief['valuation_bridge'] }) {
  if (!bridge.available) return null

  return (
    <div className="brief-animate bg-navy-800/40 border border-white/[0.06] rounded-xl p-5">
      <p className="text-[10px] font-display font-semibold tracking-[0.14em] uppercase text-slate-500 mb-3">
        Valuation Bridge
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {bridge.implied_eps != null && (
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-display tracking-wide uppercase mb-1">Implied EPS</p>
            <p className="text-slate-200 font-display font-bold text-sm">${bridge.implied_eps.toFixed(2)}</p>
          </div>
        )}
        {bridge.implied_multiple != null && (
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-display tracking-wide uppercase mb-1">Implied P/E</p>
            <p className="text-slate-200 font-display font-bold text-sm">{bridge.implied_multiple.toFixed(1)}x</p>
          </div>
        )}
        {bridge.consensus_eps != null && (
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-display tracking-wide uppercase mb-1">Consensus EPS</p>
            <p className="text-slate-200 font-display font-bold text-sm">${bridge.consensus_eps.toFixed(2)}</p>
          </div>
        )}
        {bridge.consensus_multiple != null && (
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-display tracking-wide uppercase mb-1">Consensus P/E</p>
            <p className="text-slate-200 font-display font-bold text-sm">{bridge.consensus_multiple.toFixed(1)}x</p>
          </div>
        )}
      </div>
      {bridge.gap_analysis && (
        <p className="text-xs text-slate-400 font-body leading-relaxed">{bridge.gap_analysis}</p>
      )}
    </div>
  )
}

export default function BriefDisplay({
  brief,
  stockData,
}: {
  brief: Brief
  stockData?: StockData | null
}) {
  // Map thesis_quality to the Conviction shape ConvictionBadge expects
  const conviction: Conviction = {
    overall_tier: brief.thesis_quality.overall_tier,
    macro_alignment: {
      score: brief.thesis_quality.macro_alignment.score,
      rationale: brief.thesis_quality.macro_alignment.rationale,
    },
    valuation_support: {
      score: brief.thesis_quality.valuation_support.score,
      rationale: brief.thesis_quality.valuation_support.rationale,
    },
    catalyst_clarity: {
      score: brief.thesis_quality.catalyst_clarity.score,
      rationale: brief.thesis_quality.catalyst_clarity.rationale,
    },
    risk_reward: {
      score: brief.thesis_quality.risk_reward.score,
      rationale: brief.thesis_quality.risk_reward.rationale,
    },
  }

  const hasInputIssues = brief.input_quality?.issues?.length > 0

  return (
    <div className="space-y-5">
      {/* Thesis restatement */}
      <SectionCard label="Thesis (Restated)" delay={60}>
        <p className="text-slate-200 font-body leading-relaxed italic">{brief.thesis_restatement}</p>
      </SectionCard>

      {/* MetricsCard — stocks only, above ConvictionBadge */}
      {stockData && (
        <div className="brief-animate" style={{ animationDelay: '90ms' }}>
          <MetricsCard data={stockData} />
        </div>
      )}

      {/* Valuation bridge — only rendered when available */}
      {brief.valuation_bridge?.available && (
        <div style={{ animationDelay: '100ms' }}>
          <ValuationBridgeCard bridge={brief.valuation_bridge} />
        </div>
      )}

      {/* Input quality banner — only rendered when there are issues */}
      {hasInputIssues && (
        <div
          className="brief-animate bg-amber-950/30 border border-amber-700/30 rounded-lg px-4 py-3"
          style={{ animationDelay: '110ms' }}
        >
          <p className="text-[11px] text-amber-400 font-body leading-relaxed">
            <span className="font-display font-semibold tracking-wide">⚠ Input issues: </span>
            {brief.input_quality.issues.join(' · ')}
          </p>
        </div>
      )}

      {/* Conviction — sourced from thesis_quality */}
      <div className="brief-animate" style={{ animationDelay: '120ms' }}>
        <ConvictionBadge conviction={conviction} />
      </div>

      {/* ── COUNTER BRIEF — the centerpiece ── */}
      <div
        className="brief-animate rounded-xl overflow-hidden"
        style={{ animationDelay: '200ms' }}
      >
        <div className="bg-[#1c0e04] border border-gold-700/50 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-gold-600" />
            <span className="text-[10px] font-display font-bold tracking-[0.22em] uppercase gold-shimmer">
              Devil's Advocate
            </span>
            <div className="flex-1 h-px bg-gold-800/40" />
          </div>
          {/* Content */}
          <p className="text-slate-200 font-body leading-[1.8] text-[0.95rem]">{brief.counter_brief}</p>
        </div>
      </div>

      {/* Evidence + Risks side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard label="Supporting Evidence" delay={300}>
          <BulletList items={brief.supporting_evidence} accent="green" />
        </SectionCard>
        <SectionCard label="Risk Factors" delay={360}>
          <BulletList items={brief.risk_factors} accent="red" />
        </SectionCard>
      </div>

      {/* Bull / Bear */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard label="Bull Case" delay={440} className="border-emerald-900/30">
          <p className="text-sm text-slate-300 font-body leading-relaxed">{brief.bull_case}</p>
        </SectionCard>
        <SectionCard label="Bear Case" delay={500} className="border-rose-900/30">
          <p className="text-sm text-slate-300 font-body leading-relaxed">{brief.bear_case}</p>
        </SectionCard>
      </div>

      {/* Bottom line */}
      <div
        className="brief-animate bg-navy-800/30 border border-gold-700/20 rounded-xl p-5"
        style={{ animationDelay: '580ms' }}
      >
        <p className="text-[10px] font-display font-semibold tracking-[0.14em] uppercase text-gold-600 mb-3">
          Bottom Line
        </p>
        <p className="text-slate-100 font-body leading-relaxed font-medium">{brief.bottom_line}</p>
      </div>
    </div>
  )
}
