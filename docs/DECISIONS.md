# Senstoria Architectural Decision Records (ADR)

> **Status dokumen (28 Oktober 2026, Sprint 5).** Ditulis ulang setelah
> Audit Tahap 1. Keputusan lama yang didasarkan pada sistem yang tidak
> ada (PostgreSQL, Express, Gemini, WhatsApp OTP) dikoreksi atau ditandai
> kedaluwarsa. Keputusan D-01–D-09 di bawah memakai penomoran PRD §16
> (decision log), bukan penomoran dokumen lama. Keputusan visual Sprint 6
> memakai penomoran D-V1–D-V8 dari proposal yang disetujui founder.

## Decision Log

### D-01: Brand Identity & Name
- **Decision**: The product name is **Senstoria**. The future in-house brand (Stage 4) is designated **parfumlab**.
- **Rationale**: Senstoria evokes sensory storytelling and memory, suited for a trusted fragrance companion.

### D-02: Core Strategy — "Memory First"
- **Decision**: Senstoria prioritizes digital collection memory (Library, Journal, Wear Logs) over immediate marketplace push.
- **Rationale**: An accurate scent memory engine provides the authentic data foundation that powers reliable recommendations.

### D-03: Four Shelves Semantics & BR-02
- **Decision**: 4 shelves: Currently Wearing (sealed/in_use), Wishlist, Favorites, Memories (finished/remembered). Remaining % indicator is strictly rendered on Currently Wearing bottles and nowhere else.
- **Rationale**: Prevents nonsensical fill levels on wishlists or finished memories.

### D-04: Aesthetic Direction — Editorial Cream (corrected)
- **Decision**: Calm/editorial monochrome. Paper `#fffef2`, surface `#f4f3e6`, ink `#000000`, bar `#333333`, secondary text `#595959`. Fonts: Hanken Grotesk + Newsreader. (The old claim of ivory `#FFFEF2` with Cormorant Garamond + Plus Jakarta Sans was false: the code uses Hanken Grotesk + Newsreader, and `#fffef2` lowercase is the same paper value.)
- **Rationale**: Luxury apothecary character (Aesop-like) with measured WCAG AA contrast. Visual-token changes require audit evidence (founder delegation, 28 Okt 2026).

### D-05: Stack — SPA Vite + Firebase (corrected, supersedes "Express + PostgreSQL")
- **Decision**: React 19 + Vite + TypeScript SPA, Tailwind CSS v4, hosted on Vercel; Firebase Auth + Firestore for accounts/data. No Express server runs in deployment; no PostgreSQL exists. `server.ts` in the repo is dead code for deployment purposes.
- **Rationale**: Verified against the actual repo and deployment (Audit Tahap 1, 28 Okt 2026). Framework decision Q20 remains formally open in the PRD, but the running code is SPA + Firebase.

### D-06: Deterministic Scoring Formula (implementation unverified in part)
- **Decision**: 6-dimension deterministic engine with versioned weights: Notes & Family 25%, Climate 20%, Occasion 20%, Longevity 15%, Gender 10%, Budget 10%. Calibration: ceiling 96%, conflict cap 79, shrinkage `0.80 + 0.20 * (W / 100)`, derived-attribute cap 0.85 until ≥5 real wearer reviews.
- **Status**: weights verified in code. Ceiling/shrinkage/derived-cap were claimed in old docs but **not found implemented** in the 28 Okt 2026 audit. **TODO (Sprint 3):** verify and implement calibration honestly.
- **Rationale**: Explainable, testable in CI, immune to commercial pay-to-rank bias.

### D-07: LLM Scope & Guardrails (not implemented)
- **Decision**: No LLM is integrated. If one is added later, it may strictly rephrase verified structured evidence into natural prose; it must never select products or calculate scores.
- **Rationale**: Zero hallucination risk for recommendations. The old claim that "Gemini 2.5 Flash is used server-side" was false — no such call exists in code. UI must say "taste matching", not "AI/ML", until a trained model really runs (BR-10).

### D-08: Authentication Phasing (corrected)
- **Decision**: Email + password with email verification first (Firebase Auth, Sprint 1 branch, unmerged). WhatsApp OTP tab was removed in Sprint 1; no Google Sign-in exists. Age gate 18+ enforced at signup.
- **Status**: signup currently fails with a generic error (Sprint 1 gate open; diagnosis postponed by the founder). Production `main` still uses demo auth.
- **Rationale**: Reduces 3rd-party vendor blocking while keeping a real-auth path.

### D-09: Affiliate Redirect Architecture (designed, not implemented)
- **Decision**: Outbound buy clicks pass through `/go?src=...` with domain allowlist and click logging, plus disclosure on Buy buttons.
- **Status**: design approved and verified compliant (Tokopedia/Shopee affiliate programs accept website media). **Not implemented**: `/go` 404s on Vercel; no click logging exists. **TODO (Sprint 2).**

### D-V1–D-V8: Visual decisions (approved by founder, 28 Okt 2026 21:09 WIB)
- **D-V1** (Sprint 5/6): consolidate DNA visualisation — bars in Home/Library, radar only in quiz results; ScentWheel/ScentAura deleted in Sprint 5 (proven unrendered). **Open conflict:** the radar's only live render is Library; whether it stays, is deleted, or moves into Finder results is undecided — removal stopped, awaiting founder decision.
- **D-V2** (Sprint 5, done): citrus deep `#A67C00` → `#7A5C00` in `FAMILY_DISPLAY_ID` — the only new colour value.
- **D-V3** (Sprint 5, done): secondary text `#595959`; `#8a8a8a` border only.
- **D-V4** (Sprint 5, done): 12px typography floor.
- **D-V5** (Sprint 6): shell/breakpoints — not Sprint 5 scope.
- **D-V6** (Sprint 5, done): global radius/shadow override removed; deliberate radius/shadow tokens.
- **D-V7** (Sprint 6): sheet/modal pattern — not Sprint 5 scope (modal-close retest included).
- **D-V8** (process): Sprint 5 first, then Sprint 6, each with its own gate; branch from `sprint-1/firebase-auth`, rebase when PR #2 merges.

### Catalogue architecture (approved by founder, 25 Okt 2026)
- Hybrid: international perfumes via live licensed-API lookup; local perfumes via manual Senstoria canonical records linked to marketplace offers (price/purchase link only — marketplace data must never determine Finder ranking, BR-09). Licensed APIs are a curation reference/checker, never a bulk-seed source. Empty fields stay empty, never guessed.
