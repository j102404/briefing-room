'use client'

import type { ResearchBrief } from '@/lib/types'
import ConvictionBadge from './ConvictionBadge'

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
  items: string[]
  accent: 'green' | 'red'
}) {
  const dotColor = accent === 'green' ? 'bg-emerald-500' : 'bg-rose-500'
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed font-body">
          <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function BriefDisplay({ brief }: { brief: ResearchBrief }) {
  return (
    <div className="space-y-5">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-2 brief-animate" style={{ animationDelay: '0ms' }}>
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] font-display font-semibold tracking-[0.2em] uppercase text-gold-600">
          Research Brief
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Thesis summary */}
      <SectionCard label="Thesis (Restated)" delay={60}>
        <p className="text-slate-200 font-body leading-relaxed italic">{brief.thesis_summary}</p>
      </SectionCard>

      {/* Conviction */}
      <div className="brief-animate" style={{ animationDelay: '120ms' }}>
        <ConvictionBadge conviction={brief.conviction} />
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
