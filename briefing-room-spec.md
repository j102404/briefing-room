# The Briefing Room — Product Specification

**Version:** 1.0
**Date:** April 15, 2026
**Author:** Jackson Smith

---

## 1. Executive Summary

**One-liner:** An AI-powered investment research desk where you enter any investment thesis — a stock, an asset class, a commodity, a market — and it generates a structured, data-backed research brief that stress-tests your thinking.

**What it is NOT:** A chatbot wrapper. A stock screener. A planning tool. A startup. This is a personal portfolio project that demonstrates product thinking, domain expertise, and AI engineering fluency.

---

## 2. Origin & Motivation

### The Problem
Jackson regularly forms market views and wants to share them with his dad — they call about the market, his dad emails him tickers and funds for feedback, and Jackson used to write handwritten research reports in high school. The impulse to form, validate, and share investment theses is deeply natural. But the effort-to-payoff ratio of doing this manually broke down, so it stopped happening consistently.

### Why Not Just Ask ChatGPT?
ChatGPT gives a generic wall of text from stale training data. No current price. No real financials. No structure. You can't email it without it looking like you copied a chatbot. And it doesn't start from YOUR thesis — it starts from nothing. The Briefing Room pulls live financial data via API, searches for recent news, injects all of that into an engineered prompt alongside the user's thesis, and returns a structured brief with specific sections. The AI acts as a devil's advocate — it will give a bad thesis a low score and explain why you're wrong. This is a data pipeline with AI as the reasoning layer, not a chatbot.

### What Jackson Learns
- Claude API calls with structured output (tool use)
- Prompt engineering and prompt chaining
- Streaming responses (Server-Sent Events)
- Integrating external data APIs (Financial Modeling Prep)
- Web search tool integration
- Full-stack development with Next.js via Claude Code
- Building AI as a product feature, not just a build tool

### Portfolio Value
"I built a tool that takes a stock ticker and my investment thesis and generates an institutional-quality research brief in seconds — and it argues back if my thesis is weak." That lands in any fintech, IB, or engineering conversation. It shows product thinking, domain expertise, AND technical chops.

---

## 3. Core Product Philosophy

### Devil's Advocate by Default
The engine is NOT a yes-man. Its job is to stress-test the user's thesis. If you type "I think GameStop is going to $500 because of short squeeze momentum," the brief should come back with a low conviction score and a bear case that eviscerates you. The value is in the credibility: when you send your dad a brief with a Strong conviction rating, it means something because he's seen ones that came back as Weak.

### Expandable Beyond Stocks
The input is not "a ticker." The input is "a thesis about anything." The system should handle individual stocks, asset classes (Large-Cap Growth), alternatives (Gold), commodities, and broad markets (Commercial Real Estate). The architecture must support this without rewrites — adding a new subject type should mean adding a data-fetching function and a prompt variant, not refactoring.

### The Counter-Brief is the Centerpiece
Every brief includes a "Counter-Brief" section — a direct, aggressive challenge to the weakest part of the thesis. This is the feature that differentiates the product. It should be visually prominent, not buried in a list. This is what makes someone say "that's a cool idea."

---

## 4. User Personas & Use Cases

### Primary User: Jackson
- Forms market views from reading WSJ, conversations with his dad, general market awareness
- Wants to quickly validate or challenge his thinking with real data
- Wants to produce something polished enough to email his dad
- Uses it on his laptop, not mobile

### Secondary User: Jackson's Dad
- Receives PDF briefs via email
- Emails Jackson tickers or funds to analyze
- Values clear, structured analysis over raw opinions

### Key Use Cases
1. Dad emails a ticker → Jackson drops it in with his thesis → generates brief → emails PDF back
2. Jackson reads news about energy markets → forms a thesis → stress-tests it → saves the brief
3. Jackson is curious about gold or real estate → enters a macro thesis → gets a structured analysis
4. Interview/portfolio showcase → shows the app, explains the architecture, demonstrates a live brief generation

---

## 5. Feature Specification

### 5.1 Input Form
- **Subject field:** Flexible text input. Accepts stock tickers (AAPL), asset classes (Large-Cap Growth), commodities (Gold), markets (Commercial Real Estate), or any investment subject
  - Placeholder text: "AAPL, Large-Cap Growth, Gold, Commercial Real Estate..."
- **Thesis textarea:** Free-form text where the user states their investment thesis
  - Placeholder text: "I think energy rips from here because..."
- **Generate Brief button:** Triggers the analysis pipeline
- **Pre-populated demo state:** On first load, the form is pre-populated with a compelling example thesis (e.g., NVDA AI infrastructure thesis) so first-time visitors see something real, not an empty form
- **"Try an Example" button:** 3-4 pre-built thesis/subject combos across different asset types (stock, asset class, commodity, market)

### 5.2 Analysis Pipeline (Backend)
The API route orchestrates a multi-step pipeline:

**Step 1 — Subject Type Detection**
- Auto-detect whether the subject is a stock, asset class, commodity, or market
- Route to the appropriate data-fetching strategy and prompt variant

**Step 2 — Data Fetching (per subject type)**
- **Stocks:** Call Financial Modeling Prep API for live data (price, P/E, EPS, revenue growth, margins, 52-week range)
- **Asset classes / commodities / markets:** Rely on Claude's web search for current data (no FMP equivalent for these)
- **Development mode:** Use cached/mock FMP responses (USE_MOCK=true env variable) to avoid burning the 250/day free tier limit

**Step 3 — Claude API Call**
- Model: `claude-sonnet-4-20250514`
- **Tool use for structured output:** Define a `generate_research_brief` tool with a strict JSON schema (see Section 6). This forces Claude to return validated structured data every time, avoiding the "JSON wrapped in code fences" problem.
- **Web search tool enabled:** `web_search_20250305` — Claude searches for recent news and developments about the subject before forming its analysis
- **Streaming enabled:** Response streams back via Server-Sent Events so sections appear on screen progressively
- **System prompt adapted per subject type:** Stock analysis uses financial metrics language; macro analysis uses structural/thematic language

**Step 4 — Stream to Frontend**
- Sections fade in as they arrive
- Key metrics card populates immediately (for stocks with FMP data)
- Counter-Brief section has visual emphasis

### 5.3 Brief Output Schema

```typescript
{
  thesis_summary: string,              // Restate the user's thesis in one clear sentence
  conviction: {
    overall_tier: "Strong" | "Moderate" | "Weak" | "Against",
    macro_alignment: {
      score: number,                   // 1-10
      rationale: string                // One-sentence justification
    },
    valuation_support: {
      score: number,
      rationale: string
    },
    catalyst_clarity: {
      score: number,
      rationale: string
    },
    risk_reward: {
      score: number,
      rationale: string
    }
  },
  supporting_evidence: string[],       // 3-4 bullet points with specific data/events
  risk_factors: string[],              // 3-4 specific risks that could invalidate thesis
  counter_brief: string,               // THE CENTERPIECE. Direct attack on weakest point.
  bull_case: string,                   // 2-3 sentences
  bear_case: string,                   // 2-3 sentences
  bottom_line: string                  // 2-3 sentence final assessment
}
```

### 5.4 Brief Display (Frontend)
Sections render on screen as they stream in:

1. **Thesis Summary** — restated thesis at the top
2. **Conviction Badge** — overall tier (Strong/Moderate/Weak/Against) with color coding + four sub-scores in a clean grid
3. **Key Metrics Card** — (stocks only) price, P/E, EPS, revenue growth, margins, 52-week range
4. **Supporting Evidence** — 3-4 specific data points supporting the thesis
5. **Risk Factors** — 3-4 specific risks
6. **Counter-Brief** — visually distinct section (different background, contrasting accent color, prominent placement). This is the devil's advocate centerpiece.
7. **Bull Case / Bear Case** — side by side or stacked
8. **Bottom Line** — final assessment

### 5.5 PDF Generation
- **Method:** `html2canvas` + `jsPDF` (screenshot the rendered brief, convert to PDF). NOT @react-pdf/renderer (too finicky, separate layout engine, time sink).
- **Fallback:** Browser print-to-PDF is acceptable as MVP
- **PDF includes:** Branded header ("The Briefing Room" + date + subject), all sections from the on-screen brief
- **Download button** on the brief page

### 5.6 Brief History (Nice-to-Have)
- Save past briefs to localStorage
- Sidebar showing previous briefs with subject + date
- Click to reload a past brief
- **Cut this if running behind on schedule**

### 5.7 Error Handling
- Bad ticker / unrecognized subject → graceful error message, not white screen
- FMP API down → fall back to web-search-only mode
- Claude returns malformed data → "Something went wrong, try again" with retry button
- Rate limit hit on FMP → inform user, suggest trying again later

---

## 6. System Prompt Specification

### Core System Prompt (Stock Analysis)
```
You are a senior equity research analyst at a top-tier investment bank. Your job is NOT to validate the investor's thesis — it is to stress-test it ruthlessly.

Rules:
- If the thesis is weak, say so directly. Do not soften bad news.
- Your conviction scores must reflect YOUR independent assessment, not the investor's enthusiasm.
- A bad thesis gets a low score and a clear explanation of what's wrong.
- The counter_brief is your most important output — find the single weakest link in their reasoning and dismantle it with specific evidence.
- Always search for recent news and data before forming your assessment.
- Use specific numbers, dates, and data points. Never use generic statements like "the company has strong fundamentals."
- Reference the financial data provided when relevant.
- If the investor's thesis contradicts the data, call it out explicitly.
```

### Macro Analysis Prompt Variant (Asset Classes / Commodities / Markets)
```
You are a senior macro strategist at a top-tier investment bank. Your job is NOT to validate the investor's thesis — it is to stress-test it ruthlessly.

Adapt your analysis framework to the subject:
- For asset classes: focus on flows, relative valuation, cycle positioning, factor exposure
- For commodities: focus on supply/demand dynamics, inventory data, inflation correlation, central bank positioning, geopolitical risk
- For markets (e.g., real estate): focus on structural drivers, rate sensitivity, regional variation, regulatory environment, demographic trends

Rules: [same as stock analysis]
```

---

## 7. Technical Architecture

### Tech Stack
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | Next.js 14 (App Router) | Frontend + API routes in one project, no separate backend |
| Styling | Tailwind CSS + 21st.dev components | Clean, fast iteration, production-quality components |
| Language | TypeScript (strict: false) | Portfolio-appropriate but won't slow down development |
| AI Engine | Claude API (claude-sonnet-4-20250514) | Tool use for structured output, web search, streaming |
| Financial Data | Financial Modeling Prep API (free tier, 250/day) | Live stock data — price, P/E, margins, etc. |
| PDF | html2canvas + jsPDF | Simple, reliable, no separate layout engine |
| State | React state + localStorage | No database needed |

### Folder Structure
```
briefing-room/
├── CLAUDE.md                         # Claude Code project context (read automatically)
├── .env.local                        # API keys (ANTHROPIC_API_KEY, FMP_API_KEY)
├── app/
│   ├── page.tsx                      # Main UI — form + brief display
│   ├── layout.tsx                    # Root layout
│   └── api/
│       └── analyze/route.ts          # Orchestrator: detect type → fetch data → Claude → stream
├── components/
│   ├── BriefForm.tsx                 # Subject + thesis input form
│   ├── BriefDisplay.tsx              # Rendered brief (streams in section by section)
│   ├── MetricsCard.tsx               # Key financial metrics (stocks only)
│   ├── ConvictionBadge.tsx           # Overall tier + sub-score breakdown
│   └── CounterBrief.tsx              # Devil's advocate section (visual emphasis)
├── lib/
│   ├── claude.ts                     # Claude API client, tool definition, streaming
│   ├── data-strategies/
│   │   ├── stock.ts                  # FMP API fetch for individual equities
│   │   ├── macro.ts                  # Web-search-only strategy for non-stock subjects
│   │   └── index.ts                  # Router: pick strategy based on subject type
│   ├── prompts/
│   │   ├── stock.ts                  # System prompt for individual equities
│   │   ├── macro.ts                  # System prompt for asset classes/markets/commodities
│   │   └── index.ts                  # Router: pick prompt based on subject type
│   ├── mock-data/                    # Cached FMP responses for development
│   └── types.ts                      # TypeScript interfaces for brief schema
```

### Data Flow Diagram
```
┌──────────────────────────────────┐
│         USER INPUT               │
│  Subject: "AAPL"                 │
│  Thesis: "iPhone growth slowing" │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│     SUBJECT TYPE DETECTION       │
│  "AAPL" → stock                  │
│  "Gold" → commodity              │
│  "Large-Cap Growth" → asset_class│
└──────────┬───────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐  ┌──────────┐
│  STOCK  │  │  MACRO   │
│  FMP    │  │  (no API │
│  API    │  │   call)  │
│  fetch  │  │          │
└────┬────┘  └─────┬────┘
     │             │
     └──────┬──────┘
            ▼
┌──────────────────────────────────┐
│       CLAUDE API CALL            │
│  - System prompt (per type)      │
│  - User thesis + data context    │
│  - Web search tool enabled       │
│  - Tool use for structured JSON  │
│  - Streaming enabled             │
└──────────┬───────────────────────┘
           │ (SSE stream)
           ▼
┌──────────────────────────────────┐
│      FRONTEND DISPLAY            │
│  Sections fade in as they arrive │
│  Counter-Brief visually distinct │
│  PDF download available          │
└──────────────────────────────────┘
```

---

## 8. Design Direction

### Aesthetic
- **NOT** a generic terminal theme or dark mode default
- Clean, refined, editorial feel
- Color palette anchored in **deep navy (#121e37)** and **warm gold accents (#E8A838)** (aligned with Aurexus branding)
- Generous spacing, strong typography hierarchy
- No generic fonts (banned: Inter, Roboto, Poppins, Montserrat, Open Sans)
- Recommended pairings: distinctive display font + refined body font (e.g., Sora + Manrope, or similar)

### Key UI Elements
- **Conviction Badge:** Color-coded by tier (Strong = green, Moderate = amber, Weak = orange, Against = red)
- **Counter-Brief section:** Visually distinct — different background color, contrasting accent, prominent placement. This is the product's signature feature.
- **Streaming animation:** Sections fade in progressively as Claude generates them
- **Loading states:** Multi-stage progress indicator ("Pulling market data... Searching recent news... Stress-testing thesis...")
- **Demo/example state:** Pre-populated on first load so the app never looks empty

### Claude Code Design Resources
- **Frontend Design Skill:** `/mnt/skills/public/frontend-design/SKILL.md` — forces bold aesthetic direction, distinctive typography, avoids AI slop
- **21st.dev component library:** Community-driven registry of production React components (Tailwind + Radix UI). Install via `claude-frontend-skills-pack` CLAUDE.md
- **UI Skills CLI:** `npx ui-skills add baseline-ui` — post-generation polish pass to remove generic AI aesthetics

---

## 9. Milestones

### M1 — "It thinks and streams" (one sitting, ~2-3 hours)
**Goal:** Type a thesis, watch a structured brief stream onto the screen.

- Next.js 14 + Tailwind scaffolded with CLAUDE.md and frontend-design skill referenced
- Form: subject input + thesis textarea + Generate Brief button
- API route calls Claude with tool use (structured output) + web search + streaming
- Response streams to screen section by section via SSE
- Counter-Brief section visually emphasized
- Demo pre-populated with a compelling example thesis
- No financial data API yet — Claude uses web search only

**Done when:** You can type "AAPL" + "I think Apple is overvalued because iPhone growth is slowing" and watch a structured, data-backed brief stream onto the screen with a conviction score, supporting evidence, risks, and a counter-brief that challenges your thesis.

### M2 — "It knows" (1-2 sessions)
**Goal:** Briefs include live financial data for stocks.

- Integrate Financial Modeling Prep API (free key, 250 calls/day)
- Auto-detect subject type (stock vs. asset class vs. commodity vs. market)
- Pull live data for stocks: price, P/E, EPS, revenue growth, margins, 52-week range
- Inject financial data into Claude prompt for stocks
- Display key metrics card above the brief (stocks only)
- Conviction sub-score breakdown displayed in grid
- Mock data caching for development (USE_MOCK=true env variable)

**Done when:** A stock brief includes real financial metrics and the analysis references specific current numbers.

### M3 — "It ships" (1-2 sessions)
**Goal:** Downloadable, shareable output.

- PDF generation via html2canvas + jsPDF
- Branded PDF header (The Briefing Room + date + subject)
- Download button on brief page
- Error handling: bad tickers, API failures, malformed responses → graceful error states
- Brief history sidebar with localStorage (CUT if behind schedule)

**Done when:** You can generate a brief and download a clean PDF to email your dad.

### M4 — "It impresses" (1 session, polish)
**Goal:** Demo-ready polish.

- Polished UI using frontend-design skill and /baseline-ui pass
- Loading animation with multi-stage progress messages
- Support for non-stock subjects (asset classes, commodities, markets) using macro prompt variant
- "Try an Example" button with 3-4 pre-built combos across asset types
- Any remaining UX polish

**Done when:** You can open the app in front of anyone — an interviewer, your dad, a friend — and it looks and feels like a professional product, not a homework assignment.

---

## 10. Deliberately Out of Scope

- User accounts / authentication
- Database (beyond localStorage)
- Portfolio tracking or multiple tickers at once
- Real-time streaming market data / WebSocket feeds
- Mobile optimization
- Backtesting or price predictions
- School terminal data (Bloomberg, Capital IQ, etc.)
- Email sending infrastructure (SendGrid, Resend, etc.)
- Comparison mode (multiple briefs side by side)
- Anything that turns this into Aurexus — this is a separate learning project
- @react-pdf/renderer (use html2canvas + jsPDF instead)
- Dark terminal emulator aesthetic (go for refined editorial instead)

---

## 11. Build Workflow

### Two-Window Setup
- **Window 1: Claude Code (terminal)** — the builder. Describe what you want in plain English. Claude Code writes code, creates files, runs dev server, fixes errors. Never edit code directly.
- **Window 2: Claude.ai conversation** — the product brain. Strategy decisions, debugging product problems, getting next prompts to feed Claude Code.

### CLAUDE.md File
Lives in project root. Claude Code reads it automatically every session. Contains:
- Project purpose and context
- Tech stack decisions
- Architecture conventions (data-strategies folder, prompts folder)
- Design direction (color palette, typography rules, aesthetic)
- Reference to frontend-design skill
- What NOT to do (no auth, no database, no over-engineering)

### Session Workflow
1. Open terminal → `cd ~/Projects/briefing-room`
2. Launch Claude Code → `claude`
3. Paste handoff prompt or describe next task
4. Watch Claude Code build → test in browser at localhost:3000
5. If broken → tell Claude Code what's wrong, paste error messages
6. If ugly → tell Claude Code to reference frontend-design skill
7. When milestone complete → `git add . && git commit -m "M1: done" && git push origin main`
8. Return to Claude.ai conversation for M2 prompt

### Billing
- **Claude Code building the app:** Uses Pro subscription (included in $20/month). Make sure ANTHROPIC_API_KEY env variable is NOT set when running Claude Code, or it will use API credits instead.
- **The app calling Claude API:** Uses API credits. This is a separate cost — the app itself makes API calls when generating briefs.
- **FMP API:** Free tier, 250 calls/day. Cache responses during development.

---

## 12. Key Design Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Structured output method | Tool use (not raw JSON prompt) | Reliable, no parsing failures, better interview talking point |
| Conviction scoring | Sub-scores + qualitative tier (not just 1-10) | Methodology > vibes. Shows finance thinking. |
| PDF generation | html2canvas + jsPDF | @react-pdf/renderer is a time sink with a separate layout engine |
| Streaming from M1 | Yes | Solves loading state, visually impressive, demo moment |
| TypeScript strict mode | Off (strict: false) | Prevents TS errors from becoming multi-hour rabbit holes |
| Email sharing | Cut entirely | PDF download is sufficient. Don't build SendGrid for a portfolio project. |
| Subject flexibility | Flexible input, not hardcoded ticker | Architecture supports stocks, asset classes, commodities, markets |
| Devil's advocate default | Always stress-test, never validate | This is the entire value proposition |
| Demo state | Pre-populated example | App should never look empty to a first-time visitor |
| Development data | Mock/cached FMP responses | Don't burn 250/day limit while debugging |

---

## 13. Claude Code Handoff Prompt (Milestone 1)

```
I'm building "The Briefing Room" — an AI-powered investment research desk. The user enters a subject (stock ticker, asset class, commodity, or market) and their investment thesis, and the app generates a structured, institutional-style research brief that stress-tests their thinking. It streams the response section by section.

Before writing any code, read the frontend design skill at /mnt/skills/public/frontend-design/SKILL.md and follow its guidelines for the UI.

Tech stack: Next.js 14 (App Router), Tailwind CSS, TypeScript (strict: false in tsconfig), Claude API via @anthropic-ai/sdk, streaming enabled.

Milestone 1 — what I need built now:

1. Initialize a Next.js 14 project with Tailwind in ~/Projects/briefing-room. Set strict: false in tsconfig.json.

2. Create a CLAUDE.md in the project root that references the frontend-design skill and describes this project's purpose, stack, and conventions.

3. Create the main page (app/page.tsx) with a dark, refined aesthetic — NOT a generic terminal theme. Think: clean typography, generous spacing, a color palette anchored in deep navy and warm gold accents. The form has two inputs: a "Subject" field (placeholder: "AAPL, Large-Cap Growth, Gold, Commercial Real Estate...") and a "Your Thesis" textarea (placeholder: "I think energy rips from here because..."). Plus a "Generate Brief" button. Pre-populate the form with a compelling example thesis (NVDA or similar) so first-time visitors see something real.

4. Create an API route at app/api/analyze/route.ts that:
   - Receives { subject, thesis } from the form
   - Calls the Anthropic API with streaming enabled (stream: true)
   - Uses model claude-sonnet-4-20250514
   - Enables the web_search_20250305 tool so Claude can search for current data and news
   - Uses tool use to force structured output. Define a tool called generate_research_brief with this schema:
     - thesis_summary: string (restate thesis in one sentence)
     - conviction: object with overall_tier (Strong/Moderate/Weak/Against) and four sub-scores (macro_alignment, valuation_support, catalyst_clarity, risk_reward — each has score 1-10 and rationale string)
     - supporting_evidence: array of 3-4 strings with specific data points
     - risk_factors: array of 3-4 specific risks
     - counter_brief: string — the single most important section. A direct, aggressive challenge to the weakest part of the thesis. This is the devil's advocate centerpiece.
     - bull_case: string (2-3 sentences)
     - bear_case: string (2-3 sentences)
     - bottom_line: string (2-3 sentence final assessment)
   - System prompt: "You are a senior equity research analyst at a top-tier investment bank. Your job is NOT to validate the investor's thesis — it is to stress-test it ruthlessly. If the thesis is weak, say so directly. Your conviction scores must reflect YOUR independent assessment, not the investor's enthusiasm. A bad thesis gets a low score and a clear explanation. The counter_brief is your most important output — find the single weakest link in their reasoning and dismantle it with specific evidence. Always search for recent news and data before forming your assessment. Use specific numbers and dates, never generic statements."
   - Stream the response back to the frontend using Server-Sent Events

5. Create a BriefDisplay component that renders the streamed brief below the form. Each section should fade in as it arrives. The counter_brief section should be visually distinct — different background, prominent placement, maybe a contrasting accent color — this is the feature that makes the product unique.

6. Create a ConvictionBadge component that shows the overall tier (Strong/Moderate/Weak/Against with appropriate color coding) and the four sub-scores in a clean grid below it.

Architecture note: Structure lib/ with a data-strategies/ folder and a prompts/ folder. Even though M1 only uses web search (no financial API yet), set up the routing pattern so that adding FMP data for stocks in M2 is just adding a file, not refactoring. Create a lib/data-strategies/index.ts that exports a getDataForSubject(subject) function, and a lib/prompts/index.ts that exports a getSystemPrompt(subjectType) function. For M1, both return defaults.

Environment: My Anthropic API key is set as ANTHROPIC_API_KEY. Create a .env.local that references it.

Don't: Don't add auth. Don't add a database. Don't add FMP integration yet (that's M2). Don't over-polish the UI in this milestone — get the streaming brief working and visible first, then we'll refine the design. Don't use Inter, Roboto, or generic system fonts.

Start by scaffolding the project, then build the API route with streaming + tool use, then the form and display components. I want to type a thesis and watch a structured brief stream onto the screen by the end of this session.
```

---

## 14. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| PDF generation becomes a time sink | High | Use html2canvas + jsPDF, not @react-pdf/renderer. Browser print-to-PDF as fallback. |
| Claude returns malformed structured output | Medium | Tool use forces schema compliance. Add defensive parsing as backup. |
| FMP free tier rate limits during dev | High | Cache responses locally. USE_MOCK=true env variable. |
| TypeScript errors slow down Claude Code | Medium | Set strict: false. Don't chase TS warnings that have no user impact. |
| Streaming implementation is complex | Medium | Build from M1 so it's not retrofitted. Use Next.js native SSE support. |
| Frontend looks generic / "AI slop" | Medium | Reference frontend-design skill. Use 21st.dev components. Run /baseline-ui pass. |
| Scope creep into Aurexus territory | Low | Hard boundary: no auth, no portfolio tracking, no multi-ticker. |
| Momentum loss from boring build work | Medium | M1 produces visible result in one sitting. Keep the fun loop tight. |

---

## 15. Future Possibilities (Post-v1, NOT in scope)

These are ideas that the architecture should not preclude, but should NOT be built during the 1-4 week timeline:

- Comparison mode (two theses side by side)
- Historical brief tracking with a real database
- Sector/industry analysis mode
- Integration with brokerage APIs for portfolio-aware analysis
- Mobile app or PWA
- Shareable brief links (unique URLs)
- Weekly market digest (automated brief generation on a schedule)
- Voice input for thesis (speech-to-text)

---

*This document is the single source of truth for The Briefing Room project. If conversation context is lost, this spec contains everything needed to continue building.*
