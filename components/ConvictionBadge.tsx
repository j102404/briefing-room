'use client'

import type { Conviction, ConvictionScore } from '@/lib/types'

const TIER_CONFIG = {
  Strong:   { color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', bar: '#10b981' },
  Moderate: { color: 'text-blue-400',    border: 'border-blue-500/40',    bg: 'bg-blue-500/10',    bar: '#3b82f6' },
  Weak:     { color: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   bar: '#f59e0b' },
  Against:  { color: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-500/10',    bar: '#ef4444' },
}

function scoreBarColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#3b82f6'
  if (score >= 4) return '#f59e0b'
  return '#ef4444'
}

function ScoreCell({
  label,
  data,
  index,
}: {
  label: string
  data: ConvictionScore
  index: number
}) {
  return (
    <div
      className="bg-navy-800/60 border border-white/5 rounded-lg p-4 brief-animate"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-slate-500">
          {label}
        </span>
        <span
          className="text-lg font-display font-bold tabular-nums"
          style={{ color: scoreBarColor(data.score) }}
        >
          {data.score}<span className="text-slate-600 text-sm font-normal">/10</span>
        </span>
      </div>
      <div className="score-bar-track mb-3">
        <div
          className="score-bar-fill"
          style={{
            width: `${(data.score / 10) * 100}%`,
            background: scoreBarColor(data.score),
          }}
        />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed font-body">{data.rationale}</p>
    </div>
  )
}

export default function ConvictionBadge({ conviction }: { conviction: Conviction }) {
  const tier = TIER_CONFIG[conviction.overall_tier] ?? TIER_CONFIG.Moderate

  return (
    <div className="space-y-4">
      {/* Tier badge */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/5" />
        <div
          className={`px-5 py-2 rounded-full border text-xs font-display font-bold tracking-[0.2em] uppercase ${tier.color} ${tier.border} ${tier.bg}`}
        >
          {conviction.overall_tier} Conviction
        </div>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Sub-score grid */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCell label="Macro Alignment"   data={conviction.macro_alignment}   index={0} />
        <ScoreCell label="Valuation Support" data={conviction.valuation_support} index={1} />
        <ScoreCell label="Catalyst Clarity"  data={conviction.catalyst_clarity}  index={2} />
        <ScoreCell label="Risk / Reward"     data={conviction.risk_reward}       index={3} />
      </div>
    </div>
  )
}
