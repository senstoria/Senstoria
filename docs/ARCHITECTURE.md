# Senstoria Architecture & System Design

> **Status dokumen (28 Oktober 2026, Sprint 5).** Dokumen ini ditulis ulang
> setelah Audit Menyeluruh Tahap 1 (28 Okt 2026) membuktikan dokumen
> sebelumnya tidak sesuai kenyataan: tidak ada PostgreSQL, tidak ada server
> Express yang berjalan, tidak ada 42 parfum, dan tidak ada integrasi
> Gemini/WhatsApp. Hanya klaim yang terverifikasi terhadap kode dan
> deployment yang dinyatakan di sini. Bagian yang bergantung pada Sprint
> 2–4 ditandai **TODO** eksplisit dan bukan klaim.

## 1. System Overview

Senstoria is a mobile-first, bilingual (English & Bahasa Indonesia) personal
fragrance library and discovery web app for the Indonesian market.
Positioning: "memory first", honesty over hype, personal over popular.

### Core loop (as implemented in code)

1. User catalogues fragrances into a per-bottle Library (Currently Wearing,
   Wishlist, Favorites, Memories).
2. Scent DNA is calculated deterministically from collection notes and wear
   history (`src/lib/derivedCalculations.ts` — the single derived-value
   module, BR-01).
3. Scent Finder questionnaire scores matches across 6 weighted dimensions
   (`src/lib/scentScoring.ts`).
4. User compares side-by-side (max 3) and reads an explainable breakdown
   with "Possible mismatch" warnings.
5. User joins the Try It First waitlist (sample demand capture only) or uses
   affiliate buy buttons. **TODO (Sprint 2):** the `/go` redirect does not
   work — see §4.
6. User logs wears and writes Scent Stories; Journal is private in Stage 1
   (BR-05).

## 2. Stack Specification (verified)

- **Frontend**: React 19 SPA with TypeScript, Vite, Tailwind CSS v4
  (CSS-first; design tokens as `@theme` in `src/index.css`), Lucide icons,
  Recharts (Admin charts + Scent DNA radar, both code-split).
- **Navigation**: view-state navigation in `src/App.tsx`. There is no
  client-side router and no URL routes (`/catalog`, `/perfumes/:slug`,
  `/finder`, `/go` do not exist as routes).
- **Backend / API**: none running. `server.ts` exists in the repo but is
  not executed by the Vercel deployment; `/go` and `/api/*` return 404 on
  production. **TODO (Sprint 2):** `/go` as a Vercel Function with click
  logging + disclosure.
- **Database**: Cloud Firestore (project `senstoria-app`, location
  `asia-southeast2`). `firestore.rules` (Rules v1) exists in the repo and
  was emulator-verified 46/46 in Sprint 1; production behaviour is
  untested (Sprint 1 gate). No PostgreSQL/Drizzle code exists in this repo.
- **Auth**: Firebase Authentication, Email/Password only, on branch
  `sprint-1/firebase-auth` (draft PR #2, **not merged**). Signup is
  currently **blocked**: real-account signup fails with a generic error
  and creates no user (Sprint 1 gate, diagnosis postponed by the founder).
  `main` still runs Sprint 0 code with demo auth (localStorage, password
  ignored) — do not describe it as real auth.
- **AI / LLM**: none integrated. No Gemini (or other LLM) call exists in
  code. Stage 1 scoring is deterministic; an LLM may only rephrase
  validated structured explanations in the future (BR-10). The UI must
  not claim "AI/ML" until a trained model really runs.
- **Internationalization (i18n)**: fully typed bilingual dictionaries in
  `src/lib/i18n.ts` (924 keys, symmetric ID/EN as of Sprint 5), informal-
  polite *kamu* register, `html lang` follows locale, date/number
  formatting per locale.
- **Design tokens**: paper `#fffef2`, surface `#f4f3e6`, ink `#000000`,
  bar `#333333`, secondary text `#595959`, on-dark `#d9d7c9`, border
  `#8a8a8a` (border only), hairline `#d9d7c9`, accent `#8A4B14`,
  success `#1e6b3a`, warning `#9a3412`, error `#b3261e`. Fonts: Hanken
  Grotesk (sans) + Newsreader (serif). Radius 0 for cards/panels/buttons,
  2px for chips/badges, 999px only for dots/avatars/FAB; one soft shadow
  for sheet/modal/toast only. Typography floor 12px. All §4.1 text pairs
  measure ≥ 6.07:1 (WCAG); family deep-on-tint labels ≥ 5.30:1.
  Constraint for Sprint 6: ink text on leather mid (`#7A655B`) fails
  (3.84:1) — use paper text (5.39:1) on that fill.
- **Catalog data**: 12 seed perfumes in `src/data/seedPerfumes.ts`,
  labelled sample data. The canonical 44-column catalog schema is a
  design document in the rebuild plan, not yet implemented in code.
  **TODO (Sprint 3):** verified local seeds + Finder/catalog honesty.
- **Tests**: 41 unit tests, 7 suites (`bun run test`), all passing on
  this branch. `tsc --noEmit` clean. Initial JS chunk 1,220 kB / gzip
  345 kB (target <1,000 kB / <300 kB **not met** — Admin, Finder, and
  chart code are split out; further splitting is Sprint 6/7 work).

## 3. Surfaces in code (not routes)

Home, Library, Journal (Scent Diary), Catalog, Product Detail, Compare
(max 3, with floating Compare Tray), Scent Finder (7-step quiz + results),
Try It First (waitlist modal + view), Admin Dashboard (gated by
`isAdmin` in the Sprint 1 branch; exposed publicly in Sprint 0 code),
Legal modal (5 tabs), BottomSheetOrModal sheet pattern.

**Forbidden in Stage 1 (removed in Sprint 4, still present in code):**
CommunityView, AchievementBadges/gamification, public likes/comments,
trending, price alerts. Do not build on these surfaces.

## 4. Third-Party Integrations & Reality

| Service | Purpose | Actual state |
| :--- | :--- | :--- |
| **Shopee & Tokopedia** | Affiliate monetization | Seed records carry `shopee_url` / `tokopedia_url` (placeholder links). No working redirect, no click logging. **TODO Sprint 2.** |
| **Fragella / Scento APIs** | Perfume metadata reference | No API integration in code. Licensed APIs may be used only as live lookup / curation reference, never bulk-seed (Fragella ToS §3.3). |
| **Gemini 2.5 Flash** | Explanation rephrasing | Not integrated. **TODO (post-Sprint 3, only if approved).** |
| **WhatsApp OTP** | Mobile login | Removed in Sprint 1. No OTP code exists in the app. |
| **Open-Meteo / weather** | Weather-based discovery | Not integrated. |
| **Firebase** | Auth + Firestore | Sprint 1 branch only; project `senstoria-app`. Config via Vercel env vars only, never committed. |
| **Vercel** | Hosting | Production `senstoria-ten.vercel.app` serves `main` (Sprint 0). |

## 5. Open gates (not architecture claims)

- Sprint 1 gate: signup diagnosis, account-test phases 2–3, W-1 decision,
  admin bootstrap, Q8+Q30, PR #2 merge decision.
- Sprint 2: single source of truth + `/go` Function.
- Sprint 3: Finder/catalog honesty (calibration, seed verification,
  fabricated-number removal).
- Sprint 4: forbidden-surface removal + legal + waitlist backend.
- Sprint 6: UI refresh (shell/breakpoints, sheet/modal pattern).
- Sprint 7: trust & closed-beta readiness.
- Radar/D-V1 decision (open): the radar's only live render is Library;
  whether it stays, is deleted, or moves into Finder results is undecided.
