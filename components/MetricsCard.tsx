'use client'

import type { StockData } from '@/lib/types'

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

function fmtMarketCap(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toFixed(0)}`
}

function fmtLarge(n: number | null): string {
  if (n == null) return '—'
  return fmtMarketCap(n)
}

function fmtPct(n: number | null, showSign = false): string {
  if (n == null) return '—'
  const sign = showSign && n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtRatio(n: number | null, suffix = 'x'): string {
  if (n == null) return '—'
  return `${n.toFixed(1)}${suffix}`
}

function fmtNum(n: number | null, prefix = '', decimals = 2): string {
  if (n == null) return '—'
  return `${prefix}${n.toFixed(decimals)}`
}

function fmtVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-slate-600">
        {label}
      </span>
      <span className={`text-sm font-display font-semibold tabular-nums ${highlight ? 'text-gold-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Range bar ─────────────────────────────────────────────────────────────────

function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))
  return (
    <div className="flex items-center gap-3 text-xs font-body text-slate-500">
      <span className="tabular-nums w-16 text-right">{fmtPrice(low)}</span>
      <div className="relative flex-1 h-[3px] bg-white/[0.07] rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-gold-700/60 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold-500 ring-2 ring-navy-800"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums w-16">{fmtPrice(high)}</span>
    </div>
  )
}

// ── MetricsCard ───────────────────────────────────────────────────────────────

export default function MetricsCard({ data }: { data: StockData }) {
  const priceChangeVs50 = data.priceAvg50
    ? ((data.price - data.priceAvg50) / data.priceAvg50) * 100
    : null

  return (
    <div className="bg-navy-800/60 border border-white/[0.06] rounded-xl p-5 brief-animate space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-display font-bold text-slate-100 text-base">
              {data.ticker}
            </span>
            {data.sector && (
              <span className="text-[10px] font-display font-semibold tracking-[0.12em] uppercase text-gold-600 border border-gold-700/30 bg-gold-500/[0.06] px-2 py-0.5 rounded">
                {data.sector}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            {data.companyName}{data.industry ? ` · ${data.industry}` : ''}
          </p>
        </div>
        {/* Current price */}
        <div className="text-right flex-shrink-0">
          <div className="font-display font-bold text-2xl text-slate-100 tabular-nums">
            {fmtPrice(data.price)}
          </div>
          <div className="text-[10px] text-slate-600 font-body mt-0.5">
            {fmtPrice(data.dayLow)} – {fmtPrice(data.dayHigh)} today
          </div>
        </div>
      </div>

      {/* 52-week range bar */}
      <div>
        <p className="text-[9px] font-display font-semibold tracking-[0.14em] uppercase text-slate-600 mb-2">
          52-Week Range
        </p>
        <RangeBar low={data.yearLow} high={data.yearHigh} current={data.price} />
      </div>

      {/* Primary metrics grid */}
      <div className="grid grid-cols-4 gap-x-4 gap-y-3 pt-1 border-t border-white/[0.04]">
        <MetricCell label="Market Cap"    value={fmtMarketCap(data.marketCap)} />
        <MetricCell label="P/E (TTM)"     value={fmtRatio(data.peRatioTTM)} />
        <MetricCell label="EPS"           value={fmtNum(data.eps, '$')} />
        <MetricCell label="Volume"        value={fmtVolume(data.volume)} />
      </div>

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-4 gap-x-4 gap-y-3 pt-1 border-t border-white/[0.04]">
        <MetricCell label="Revenue (FY)"  value={fmtLarge(data.revenue)} />
        <MetricCell
          label="Rev Growth"
          value={fmtPct(data.revenueGrowthYoY, true)}
          highlight={data.revenueGrowthYoY != null && data.revenueGrowthYoY > 0}
        />
        <MetricCell label="Gross Margin"  value={fmtPct(data.grossProfitMarginTTM)} />
        <MetricCell label="Op Margin"     value={fmtPct(data.operatingProfitMarginTTM)} />
      </div>

      {/* Moving averages + debt/equity footer */}
      <div className="flex items-center gap-6 pt-1 border-t border-white/[0.04] text-[10px] font-body text-slate-600">
        <span>
          50-Day Avg: <span className={`font-semibold ${data.price > data.priceAvg50 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>{fmtPrice(data.priceAvg50)}</span>
        </span>
        <span>
          200-Day Avg: <span className={`font-semibold ${data.price > data.priceAvg200 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>{fmtPrice(data.priceAvg200)}</span>
        </span>
        <span className="ml-auto">
          ROE: <span className="text-slate-400 font-semibold">{fmtPct(data.returnOnEquityTTM)}</span>
        </span>
        <span>
          Debt/Eq: <span className="text-slate-400 font-semibold">{fmtNum(data.debtToEquityTTM, '', 2)}</span>
        </span>
      </div>
    </div>
  )
}
