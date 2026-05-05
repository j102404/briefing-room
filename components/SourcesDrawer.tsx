'use client'

import type { DossierClaim } from '@/lib/analysis/types'

const TYPE_CONFIG: Record<
  DossierClaim['type'],
  { label: string; color: string; border: string; bg: string }
> = {
  financial_fact: {
    label: 'Financial Fact',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  management_statement: {
    label: 'Mgmt Statement',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
  third_party_claim: {
    label: 'Third Party',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  analyst_inference: {
    label: 'Analyst Inference',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'High confidence',   color: 'text-emerald-500' },
  medium: { label: 'Medium confidence', color: 'text-amber-500' },
  low:    { label: 'Low confidence',    color: 'text-rose-500' },
}

const TYPE_ORDER: DossierClaim['type'][] = [
  'financial_fact',
  'management_statement',
  'third_party_claim',
  'analyst_inference',
]

function groupClaims(claims: DossierClaim[]): [DossierClaim['type'], DossierClaim[]][] {
  return TYPE_ORDER
    .map(type => [type, claims.filter(c => c.type === type)] as [DossierClaim['type'], DossierClaim[]])
    .filter(([, group]) => group.length > 0)
}

export default function SourcesDrawer({
  claims,
  open,
  onOpenChange,
}: {
  claims: DossierClaim[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!claims || claims.length === 0) return null

  const groups = groupClaims(claims)

  return (
    <div
      className="border border-white/[0.06] rounded-xl overflow-hidden brief-animate"
      style={{ animationDelay: '700ms' }}
    >
      {/* Toggle header */}
      <button
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="sources-drawer-content"
        className="w-full flex items-center justify-between px-5 py-4 bg-navy-800/40 hover:bg-navy-800/70 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-display font-semibold tracking-[0.18em] uppercase text-slate-500 group-hover:text-slate-400 transition-colors">
            Evidence Dossier
          </span>
          <span className="text-[10px] font-display text-gold-600 border border-gold-700/30 bg-gold-500/[0.06] px-2 py-0.5 rounded tabular-nums">
            {claims.length} sources
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Claims list */}
      {open && (
        <div id="sources-drawer-content" className="p-5 space-y-7 bg-navy-900/40">
          {groups.map(([type, typeClaims]) => {
            const cfg = TYPE_CONFIG[type]
            return (
              <section key={type}>
                <p className={`text-[10px] font-display font-semibold tracking-[0.16em] uppercase mb-3 ${cfg.color}`}>
                  {cfg.label}
                </p>
                <div className="space-y-3">
                  {typeClaims.map(claim => {
                    const conf = CONFIDENCE_CONFIG[claim.confidence] ?? CONFIDENCE_CONFIG.medium
                    return (
                      <article
                        key={claim.id}
                        className="bg-navy-800/50 border border-white/[0.05] rounded-lg p-4"
                      >
                        {/* Claim header */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <span
                            className={`text-[10px] font-display font-bold px-2 py-0.5 rounded border ${cfg.color} ${cfg.border} ${cfg.bg}`}
                          >
                            {claim.id}
                          </span>
                          <span className={`text-[10px] font-body ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>

                        {/* Claim text */}
                        <p className="text-sm text-slate-300 font-body leading-relaxed mb-3">
                          {claim.claim}
                        </p>

                        {/* Verbatim quote */}
                        {claim.verbatim_source_quote && (
                          <blockquote className="border-l-2 border-gold-700/40 pl-3 mb-3">
                            <p className="text-xs text-slate-500 font-body italic leading-relaxed">
                              &ldquo;{claim.verbatim_source_quote}&rdquo;
                            </p>
                          </blockquote>
                        )}

                        {/* Source link + date */}
                        {(claim.source_url || claim.source_date) && (
                          <div className="flex items-center gap-3 flex-wrap">
                            {claim.source_url && (
                              <a
                                href={claim.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-gold-600 hover:text-gold-500 font-display tracking-wide transition-colors"
                                aria-label={`Source: ${claim.source_url}`}
                              >
                                ↗{' '}
                                {(() => {
                                  try {
                                    return new URL(claim.source_url).hostname.replace(/^www\./, '')
                                  } catch {
                                    return claim.source_url.slice(0, 40)
                                  }
                                })()}
                              </a>
                            )}
                            {claim.source_date && (
                              <span className="text-[10px] text-slate-600 font-body">
                                {claim.source_date}
                              </span>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
