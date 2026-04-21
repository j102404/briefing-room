---
name: Briefing Room Architecture M2.5
description: Two-stage dossier+synthesizer pipeline replacing single-call Opus approach
type: project
---

M2.5 rebuild replaced the single Opus call with a Haiku 4.5 dossier stage + Sonnet 4.6 synthesizer stage. Branch: rebuild/dossier-synthesizer.

**Why:** Single-call M1/M2 approach was producing C/C/C+/D grade output. Root cause was architectural (14 conflicting prompt rules), not prompt-level. Two-stage pipeline separates evidence gathering from synthesis reasoning.

**How to apply:** When working on analysis quality, think in terms of dossier (evidence, quotes, claim IDs) vs synthesis (reasoning, scores, narrative). The key invariant is input_quality and thesis_quality are separate rubrics.

Key env vars: DOSSIER_MODEL, SYNTHESIZER_MODEL, SYNTHESIZER_THINKING, USE_DOSSIER_CACHE, USE_MOCK_FMP
