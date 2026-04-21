---
name: FMP API Deprecated
description: FMP legacy endpoints dead as of Aug 31 2025; MetricsCard data broken
type: project
---

FMP legacy endpoints (financialmodelingprep.com/api/v3/quote, /profile, etc.) stopped working for non-legacy subscribers as of August 31, 2025. All calls return "Legacy Endpoint" error. stock_data SSE event emits null for all tickers.

**Why:** API key DA8C5UZirVxvnhOUx0jtsB8zNGtQM979 does not have a valid subscription post-August 2025.

**How to apply:** MetricsCard won't render for any stock. The dossier stage still works via web search. When asked to fix stock data, need to either: (a) update FMP subscription, (b) swap to a new financial data provider (e.g. yfinance, Alpha Vantage, Polygon), or (c) keep web-search-only approach and remove MetricsCard dependency.
