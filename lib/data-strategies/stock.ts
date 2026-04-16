import fs from 'fs'
import path from 'path'
import type { StockData } from '@/lib/types'

const FMP_BASE = 'https://financialmodelingprep.com'
const MOCK_DIR = path.join(process.cwd(), 'lib', 'mock-data')

function mockPath(ticker: string) {
  return path.join(MOCK_DIR, `${ticker}.json`)
}

function readMock(ticker: string): StockData | null {
  const p = mockPath(ticker)
  if (!fs.existsSync(p)) {
    console.warn(`[FMP mock] No cache file for ${ticker} — falling back to live fetch`)
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as StockData
  } catch {
    console.warn(`[FMP mock] Failed to parse cache for ${ticker}`)
    return null
  }
}

function writeMock(ticker: string, data: StockData) {
  try {
    if (!fs.existsSync(MOCK_DIR)) fs.mkdirSync(MOCK_DIR, { recursive: true })
    fs.writeFileSync(mockPath(ticker), JSON.stringify(data, null, 2))
  } catch (err) {
    console.warn(`[FMP mock] Failed to write cache for ${ticker}:`, err)
  }
}

async function fmpFetch(endpoint: string): Promise<any> {
  const key = process.env.FMP_API_KEY
  if (!key) throw new Error('FMP_API_KEY not set')
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = `${FMP_BASE}${endpoint}${sep}apikey=${key}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`FMP ${endpoint} → ${res.status}`)
  return res.json()
}

function pct(n: number | undefined | null): number | null {
  return n != null ? n * 100 : null
}

export async function getStockData(ticker: string): Promise<StockData | null> {
  const useMock = process.env.USE_MOCK_FMP === 'true'

  if (useMock) {
    const cached = readMock(ticker)
    if (cached) return cached
    // Fall through to live fetch if cache miss
  }

  try {
    const [quoteArr, profileArr, metricsArr, incomeArr] = await Promise.all([
      fmpFetch(`/api/v3/quote/${ticker}`),
      fmpFetch(`/api/v3/profile/${ticker}`),
      fmpFetch(`/api/v3/key-metrics-ttm/${ticker}`),
      fmpFetch(`/api/v3/income-statement/${ticker}?limit=2`),
    ])

    // FMP returns an empty array for unknown tickers
    if (!Array.isArray(quoteArr) || !quoteArr.length) return null
    if (!Array.isArray(profileArr) || !profileArr.length) return null

    const q = quoteArr[0]
    const p = profileArr[0]
    const m = Array.isArray(metricsArr) ? (metricsArr[0] ?? {}) : {}
    const inc0 = Array.isArray(incomeArr) ? incomeArr[0] : null
    const inc1 = Array.isArray(incomeArr) ? incomeArr[1] : null

    const revenueGrowthYoY =
      inc0?.revenue != null && inc1?.revenue != null && inc1.revenue !== 0
        ? ((inc0.revenue - inc1.revenue) / Math.abs(inc1.revenue)) * 100
        : null

    const data: StockData = {
      ticker,
      companyName: p.companyName ?? q.name ?? ticker,
      sector: p.sector ?? '',
      industry: p.industry ?? '',
      // Quote
      price: q.price,
      marketCap: q.marketCap,
      pe: q.pe ?? null,
      eps: q.eps ?? null,
      dayLow: q.dayLow,
      dayHigh: q.dayHigh,
      yearLow: q.yearLow,
      yearHigh: q.yearHigh,
      priceAvg50: q.priceAvg50,
      priceAvg200: q.priceAvg200,
      volume: q.volume,
      // Key metrics TTM — FMP returns margins as decimals (0.753 → 75.3%)
      peRatioTTM: m.peRatioTTM ?? null,
      priceToBookRatioTTM: m.priceToBookRatioTTM ?? null,
      debtToEquityTTM: m.debtToEquityTTM ?? null,
      returnOnEquityTTM: pct(m.returnOnEquityTTM),
      grossProfitMarginTTM: pct(m.grossProfitMarginTTM),
      operatingProfitMarginTTM: pct(m.operatingProfitMarginTTM),
      netProfitMarginTTM: pct(m.netProfitMarginTTM),
      // Income statement
      revenue: inc0?.revenue ?? null,
      revenueGrowthYoY,
      grossProfit: inc0?.grossProfit ?? null,
      operatingIncome: inc0?.operatingIncome ?? null,
      netIncome: inc0?.netIncome ?? null,
    }

    writeMock(ticker, data)
    return data
  } catch (err) {
    console.error(`[FMP] Fetch failed for ${ticker}:`, err)
    return null
  }
}
