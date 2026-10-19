# Senstoria Architecture & System Design

## 1. System Overview
Senstoria is a mobile-first, bilingual (English & Bahasa Indonesia) fragrance discovery platform and digital shelf application for the Indonesian market.

### Core Problems Solved
1. **Choice Overload**: Overwhelming fragrance SKUs, influencer hype, and difficulty articulating notes, seasonal performance, and daily suitability.
2. **Blind-Buy Risk ("Takut Zonk")**: Inability to smell perfume online before committing Rp 300.000–Rp 3.000.000+.

### Core Loop
1. User catalogues fragrances (Currently Wearing, Wishlist, Favorites, Memories).
2. Scent DNA is calculated deterministically from collection notes and wear history.
3. Scent Finder questionnaire scores matches across 6 weighted dimensions.
4. User compares side-by-side (max 3) and reviews transparent breakdown with "Possible mismatch" warnings.
5. User tests first (Try It First sample waitlist) or buys via tracked affiliate links (Shopee, Tokopedia).
6. User logs wears and writes Scent Stories, continuously sharpening recommendations.

---

## 2. Stack Specification

- **Frontend**: React 19 SPA with TypeScript, Tailwind CSS v4, Lucide icons, Motion for micro-interactions.
- **Backend / API**: Express 4 with TypeScript (`server.ts` running on Node.js 22), providing server-side API proxying and security isolation.
- **Database**: Cloud SQL PostgreSQL with Drizzle ORM, with native check constraints for invariants (I1–I8).
- **AI / LLM Integration**: Server-side `@google/genai` (Gemini 2.5 Flash), strictly used for rephrasing structured match evidence into natural conversational prose. Never selects products or calculates scores.
- **Internationalization (i18n)**: Fully typed bilingual dictionaries (English and Bahasa Indonesia, using informal-polite *kamu*).
- **Affiliate & Redirect Architecture**: `/go/:id?platform=shopee|tokopedia&src=...` internal redirect route with domain allowlist, bot filtering, and click tracking.

---

## 3. Navigation & Route Map

### Public Routes
- `/`: Visitor Landing page with hero, 3-step value proposition, honesty principles, sample catalog strip.
- `/catalog`: Browsable perfume catalog with multi-facet filters (Family, Brand, Market Tier, Concentration, Origin: ID/INT), sorting, and search.
- `/perfumes/:slug`: Product Detail page with note pyramid (top/heart/base), longevity/sillage specs, community ratings, and affiliate buy buttons.
- `/compare?ids=a,b,c`: Dedicated compare view (up to 3 perfumes) with sticky compare tray.
- `/finder`: Scent Finder 7-step questionnaire with session autosave.
- `/finder/results/:sessionId`: Match results with deterministic Match Score, 6-dimension breakdown, and "Possible mismatch".
- `/try`: Try It First sample waitlist (2ml vial, 5ml decant, 10ml travel spray) with price indication and willingness-to-pay capture.
- `/go/:id`: Outbound affiliate 302 redirect with click logging and fallback page.
- `/about`, `/support/faq`, `/support/contact`, `/privacy`, `/terms`, `/affiliate-disclosure`: Informational, legal, and support pages.

### Authenticated Member Routes
- `/`: Authenticated Home dashboard (Today's Wear rotation, Collection Glance, Scent DNA preview, Low-bottle alert).
- `/onboarding`: First-run setup (language, add 3–5 initial perfumes, taste preferences).
- `/library`: Visual shelf with 4 tabs (Currently Wearing with fill level %, Wishlist, Favorites, Memories / Scent Archive).
- `/journal`: Wear logs, timeline, and written Scent Stories.
- `/journal/stories/new`: Scent Story rich composer with draft autosave.
- `/settings`: Profile, language switch, notification consent matrix, data export, account deletion.

### Admin Routes (Protected + 2FA)
- `/admin`: Dashboard with counted affiliate clicks, quiz funnel drop-off, catalog CRUD, review moderation queue, sample waitlist demand, and feature flag management.

---

## 4. Third-Party Integrations & Resilience

| Service | Purpose | Fallback / Guardrail |
| :--- | :--- | :--- |
| **Shopee & Tokopedia** | Affiliate monetization | Domain allowlist on `/go/:id`. If link is missing or inactive, shows `/go` fallback page with alternate platform and Try It First waitlist. |
| **Fragella API (or Curated Seed)** | Perfume metadata sync | All client reads hit PostgreSQL only. Background sync only. Seeded data flagged with `is_sample` until verified. |
| **Gemini 2.5 Flash** | Explanation rephrasing | If API is slow (>1.5s) or fails, ships deterministic template explanations immediately without blocking UI. |
| **WhatsApp OTP / Gateway** | Mobile login & alerts (flagged) | Feature-flagged (`whatsapp_otp`). Development prints code to console. Fallback to Email authentication. |
| **Open-Meteo API** | Weather-based discovery | Free public weather API. If geolocation is denied or unavailable, defaults to user-selected Indonesian city or tropical climate fallback. |
