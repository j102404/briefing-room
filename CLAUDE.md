# Frontend Development Instructions

Drop this file in your project root. Claude Code reads it automatically.

## Design Philosophy
Create distinctive, production-grade interfaces. No generic "AI slop."
- No Inter, Roboto, Poppins, Montserrat, Open Sans
- No purple gradients on white backgrounds
- No cookie-cutter layouts
- Commit to a bold aesthetic direction before writing code

## Component Source: 21st.dev
Before writing any UI component from scratch, check if a production-ready version exists at https://21st.dev

**Install components:**
```bash
npx shadcn@latest add "[component-url-from-21st.dev]"
```

**Browse the full catalog:** https://21st.dev/community/components

### Marketing Blocks
- Heroes (73): https://21st.dev/s/hero
- Features (36): https://21st.dev/s/features
- Calls to Action (34): https://21st.dev/s/call-to-action
- Backgrounds (33): https://21st.dev/s/background
- Hooks (31): https://21st.dev/s/hook
- Images (26): https://21st.dev/s/image
- Scroll Areas (24): https://21st.dev/s/scroll-area
- Pricing Sections (17): https://21st.dev/s/pricing-section
- Clients (16): https://21st.dev/s/clients
- Testimonials (15): https://21st.dev/s/testimonials
- Shaders (15): https://21st.dev/s/shader
- Footers (14): https://21st.dev/s/footer
- Borders (12): https://21st.dev/s/border
- Navigation (11): https://21st.dev/s/navbar-navigation
- Announcements (10): https://21st.dev/s/announcement
- Videos (9): https://21st.dev/s/video
- Comparisons (6): https://21st.dev/s/comparison
- Docks (6): https://21st.dev/s/dock

### UI Components
- Buttons (130): https://21st.dev/s/button
- Inputs (102): https://21st.dev/s/input
- Cards (79): https://21st.dev/s/card
- Selects (62): https://21st.dev/s/select
- Sliders (45): https://21st.dev/s/slider
- Accordions (40): https://21st.dev/s/accordion
- Tabs (38): https://21st.dev/s/tabs
- Dialogs/Modals (37): https://21st.dev/s/modal-dialog
- Calendars (34): https://21st.dev/s/calendar
- Tables (30): https://21st.dev/s/table
- AI Chats (30): https://21st.dev/s/ai-chat
- Tooltips (28): https://21st.dev/s/tooltip
- Badges (25): https://21st.dev/s/badge
- Dropdowns (25): https://21st.dev/s/dropdown
- Alerts (23): https://21st.dev/s/alert
- Forms (23): https://21st.dev/s/form
- Popovers (23): https://21st.dev/s/popover
- Text Areas (22): https://21st.dev/s/textarea
- Radio Groups (22): https://21st.dev/s/radio-group
- Spinner Loaders (21): https://21st.dev/s/spinner-loader
- Paginations (20): https://21st.dev/s/pagination
- Checkboxes (19): https://21st.dev/s/checkbox
- Numbers (18): https://21st.dev/s/number
- Menus (18): https://21st.dev/s/menu
- Avatars (17): https://21st.dev/s/avatar
- Carousels (16): https://21st.dev/s/carousel
- Links (13): https://21st.dev/s/link
- Date Pickers (12): https://21st.dev/s/date-picker
- Toggles (12): https://21st.dev/s/toggle
- Icons (10): https://21st.dev/s/icons
- Sidebars (10): https://21st.dev/s/sidebar
- File Uploads (7): https://21st.dev/s/upload-download
- Tags (6): https://21st.dev/s/chip-tag
- Notifications (5): https://21st.dev/s/notification
- Sign Ins (4): https://21st.dev/s/sign-in
- Sign Ups (4): https://21st.dev/s/registration-signup
- Toasts (2): https://21st.dev/s/toast
- File Trees (2): https://21st.dev/s/file-tree

Always check 21st.dev before writing components from scratch.

## CRITICAL: Actually USE Installed Components

**DO NOT install 21st.dev components and then write custom ones instead.**

After installing a component with `npx shadcn@latest add`, you MUST:

1. **Import it** in the page/layout that needs it:
   ```tsx
   import { FloatingNav } from "@/components/ui/floating-navbar"
   import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"
   ```

2. **Replace any hand-written version** of the same component type. If you installed a navbar component, DELETE your custom navbar and use the installed one.

3. **Read the component file** (`components/ui/[name].tsx`) to understand its props, then pass the correct data:
   ```tsx
   // Read the component to see what props it expects
   // Then wire it in with real data:
   <FloatingNav navItems={[
     { name: "Features", link: "#features" },
     { name: "Pricing", link: "#pricing" },
   ]} />
   ```

4. **Check for required config** — some components need:
   - Image domains in `next.config.js` (for components using `next/image`)
   - Additional dependencies (check imports in the component file)
   - Tailwind config extensions (check for custom classes)

**The rule: If a 21st.dev component is installed in `components/ui/`, it MUST be imported and used. No orphaned installs.**

## Typography
Use `next/font/google` for all fonts (auto-optimized, self-hosted).

**Banned:** Inter, Roboto, Poppins, Montserrat, Open Sans, Playfair Display

**Recommended display fonts:** Sora, Elms Sans, Vend Sans, Zalando Sans
**Recommended body fonts:** Manrope, Figtree, Source Sans 3, Stack Sans Text
**Recommended serif:** Bacasime Antique, Gentium Plus, Libertinus Serif
**Recommended mono:** SUSE Mono, JetBrains Mono

Always pair a display font + body font. Variable fonts preferred.

## Next.js 15 Patterns
- App Router with Server Components by default
- Only `'use client'` when actually needed (interactivity, event listeners, browser APIs)
- Suspense boundaries with `loading.tsx`
- `next/image` for all images
- Metadata API for SEO
- Server Actions for forms

## Accessibility (WCAG 2.1 AA)
- Semantic HTML (button, nav, main, article — not div for everything)
- ARIA labels on all interactive elements
- 4.5:1 contrast ratio for text
- Keyboard navigable
- Skip-to-content link

## Motion & Animation
- Use Framer Motion for scroll reveals and transitions
- Stagger child animations on viewport entry
- Hover micro-interactions on cards and buttons
- Keep animations purposeful — enhance, don't distract

## When User Asks to Build UI
1. Pick a bold aesthetic direction (or ask)
2. Browse 21st.dev for matching components
3. Install via `npx shadcn@latest add "[url]"`
4. Customize with Tailwind
5. Apply Next.js patterns
6. Add motion with Framer Motion
7. Verify accessibility

## Project: The Briefing Room
- AI-powered investment research desk
- Color palette: deep navy (#121e37), warm gold (#E8A838)
- Dark, refined, editorial aesthetic — NOT terminal themed
- No generic fonts (Inter, Roboto, Poppins, Montserrat, Open Sans are banned)
- Use 21st.dev components where appropriate
- Architecture: lib/data-strategies/ and lib/analysis/ for extensibility
- No auth, no database, no scope creep

## Current Architecture (M2.5 — two-stage dossier + synthesizer, as of 2026-04-20)

### Stack
- **Next.js 14** (App Router), **TypeScript** (`strict: false`), **Tailwind CSS**
- **Fonts:** Sora (display, `--font-sora`) + Manrope (body, `--font-manrope`) via `next/font/google`
- **Colors:** custom Tailwind tokens — `navy-{500–950}`, `gold-{300–700}`
- **Models:** Haiku 4.5 (dossier) + Sonnet 4.6 with extended thinking (synthesizer)

### Model Tiering
| Stage | Model | Env Var | Rationale |
|-------|-------|---------|-----------|
| Stage A (Dossier) | `claude-haiku-4-5-20251001` | `DOSSIER_MODEL` | Extraction task — Haiku is sufficient at ~70% lower cost |
| Stage B (Synthesizer) | `claude-sonnet-4-6` | `SYNTHESIZER_MODEL` | Reasoning task — Sonnet + thinking handles it well |

To upgrade synthesizer quality: set `SYNTHESIZER_MODEL=claude-opus-4-7` (no code changes needed).
Extended thinking level: `SYNTHESIZER_THINKING=high` (options: `off`, `low`, `medium`, `high`).

### Request Flow
1. User submits `{ subject, thesis }` → `POST /api/analyze`
2. API route calls `getDataForSubject(subject)`:
   - If subject looks like a ticker → `getStockData(ticker)` hits 4 FMP endpoints in parallel
   - Otherwise → `stockData: null`, subject typed as commodity/asset_class/macro/unknown
3. Emits `stock_data` SSE event immediately so MetricsCard renders before the brief arrives
4. **Stage A — Dossier (Haiku 4.5):** agentic loop (max 8 iter) with `web_search_20250305` + `generate_dossier` tools. Produces a `Dossier` with 15-25 typed evidence claims, thesis atomic claims, and internal issue flags. Result is cached to disk when `USE_DOSSIER_CACHE=true`.
5. Emits `dossier_ready` SSE event (frontend ignores for now — for future UI)
6. **Stage B — Synthesizer (Sonnet 4.6):** single call with extended thinking enabled + `generate_research_brief` tool. Executes 7-step rubric: restate → scope → score input quality → valuation bridge → score thesis quality → write narrative → bottom line. Falls back to no-thinking if extended thinking fails.
7. Deterministic validators run: math check on valuation bridge, claim ID reference check, non-empty field check. Issues emitted as `validation_warnings` SSE event.
8. Emits `brief` SSE event (new `Brief` schema — see below)

### File Map
```
app/
  page.tsx                   — form, SSE consumer, stockData + brief state
  layout.tsx                 — fonts, metadata, global CSS import
  globals.css                — @tailwind directives, .brief-animate, .gold-shimmer, score-bar utilities
  api/analyze/route.ts       — SSE handler, orchestrates Stage A + Stage B pipeline

components/
  BriefDisplay.tsx           — renders full brief; maps thesis_quality → ConvictionBadge; shows valuation bridge + input quality banner
  ConvictionBadge.tsx        — tier pill + 2×2 sub-score grid (unchanged internals)
  MetricsCard.tsx            — live stock metrics (unchanged)

lib/
  types.ts                   — StockData, Conviction, ConvictionScore interfaces; re-exports Brief
  analysis/
    types.ts                 — DossierClaim, Dossier, Brief, ThesisQualityScore, ValuationBridge interfaces
    dossier.ts               — buildDossier(): Stage A agentic loop with Haiku + web search
    synthesizer.ts           — synthesizeBrief(): Stage B with Sonnet + extended thinking
    validators.ts            — runValidators(): deterministic math + claim ID + non-empty checks
  cache/
    dossier-cache.ts         — file-based dossier cache (keyed by SHA256(subject+thesis).slice(16))
    dossiers/                — cached dossier JSON files (gitignored in prod, useful for dev iteration)
  data-strategies/
    index.ts                 — getDataForSubject(); isTickerLike() heuristic
    stock.ts                 — getStockData(); 4-way parallel FMP fetch; file-based mock cache
  mock-data/                 — {TICKER}.json cache files (committed; safe, no secrets)
```

### SSE Event Protocol
| Event | Payload | When |
|-------|---------|------|
| `status` | `{ message: string }` | Throughout processing |
| `stock_data` | `StockData \| null` | After FMP fetch, before Stage A |
| `dossier_ready` | `{ claim_count, subject_type, thesis_atomic_claims, thesis_internal_issues }` | After Stage A completes |
| `brief` | `Brief` | After Stage B completes |
| `validation_warnings` | `{ warnings: string[] }` | If validators flag issues (non-blocking) |
| `error` | `{ message: string }` | On any failure |

### Brief Schema (M2.5)
- `input_quality`: `{ score: 1-10, issues: string[] }` — coherence, accuracy, internal consistency of user's input
- `thesis_restatement`: 1-2 sentences, only what user claimed
- `thesis_does_not_claim`: 3-5 positions user did NOT take (prevents strawmanning)
- `valuation_bridge`: `{ available, implied_eps?, implied_multiple?, consensus_eps?, consensus_multiple?, gap_analysis? }` — only populated for stocks with price targets
- `thesis_quality`: `{ overall_tier, macro_alignment, valuation_support, catalyst_clarity, risk_reward }` — each sub-score has `score`, `rationale`, `supporting_claim_ids[]`
- `supporting_evidence`: `Array<{ text, claim_ids[] }>` — each item cites dossier claim IDs
- `risk_factors`: `Array<{ text, claim_ids[] }>` — same
- `counter_brief`, `bull_case`, `bear_case`, `bottom_line`: narrative strings
- `sources`: subset of `DossierClaim[]` actually cited in the brief

### Key Design Invariants
- `input_quality` and `thesis_quality` are SEPARATE rubrics — a broken price target lowers input_quality but must not drag thesis_quality score
- Every `supporting_evidence` and `risk_factors` item must cite dossier claim IDs (validated by `validators.ts`)
- No fabricated precision: synthesizer prompt forbids specific % / bps / $ figures not traceable to a dossier claim
- `verbatim_source_quote` is required for all `management_statement` and `third_party_claim` dossier entries

### Known Limitations (M2.5)
- Dossier web search falls back silently if beta header is rejected — no retry or user-visible signal
- Extended thinking adds ~30-60s to synthesis time; can disable with `SYNTHESIZER_THINKING=off`
- Valuation bridge requires price target in thesis text — model infers it, no explicit parsing
- Dossier cache is off by default (`USE_DOSSIER_CACHE=false`) to ensure fresh evidence in production

## FMP API Quota Management
FMP free tier: 250 calls/day. Each stock analysis makes 4 parallel FMP calls.

**When iterating on prompts / UI:** set `USE_MOCK_FMP=true` in `.env.local`.
This reads from `lib/mock-data/{TICKER}.json` instead of hitting FMP.

**When testing live data:** set `USE_MOCK_FMP=false`.
On a successful fetch, the response is automatically written to `lib/mock-data/{TICKER}.json`,
building up the cache over time. Commit these files so teammates share the cache.

Mock files in `lib/mock-data/` are safe to commit — they contain no secrets, only public market data.
