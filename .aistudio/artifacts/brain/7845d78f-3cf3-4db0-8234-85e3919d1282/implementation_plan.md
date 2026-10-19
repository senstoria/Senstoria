# Senstoria: Fragrance Discovery & Collection Platform (Phase 0 Plan)

Senstoria is an editorial, bilingual (English & Bahasa Indonesia) fragrance discovery and digital collection platform tailored for the Indonesian market. It enables fragrance lovers to catalogue what they own, log daily wears and scent memories, build a personalized "Scent DNA", and receive honest, explainable recommendations backed by tracked affiliate links and sample waitlists.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and design baselines have been confirmed through Phase 1 clarification:

- **Aesthetic Direction**: **Editorial Cream** (Aesop-inspired warm paper `#FFFEF2`, charcoal `#333333`, typography in serif display + clean sans body, generous whitespace, zero pill clutter).
- **Application Stack**: **React + Vite + Express TypeScript** on Node.js. Server-side proxy handles Gemini API calls securely and implements the `/go/:id` affiliate click logging and 302 redirects.
- **Database Persistence**: **Cloud SQL PostgreSQL with Drizzle ORM**, providing schema constraints, check constraints (e.g. `0 <= remaining_ml <= size_ml`), and ACID transactions for collection tracking and logs.
- **Authentication Priority**: **Email and password first** with email verification, with WhatsApp OTP and Google OAuth architected behind feature flags (`whatsapp_otp`, `google_login`) and a simulated OTP console provider in development.

***

## 1. Overview & Core Concept

### What It Does
1. **Digital Library**: A multi-shelf collection (Currently Wearing, Wishlist, Favorites, Scent Archive / Memories) tracking bottle size, fill level, and purchase history with single-source-of-truth semantics.
2. **Scent Diary & Wear Log**: 1-tap wear logging with remaining mL auto-decrement, longevity tracking, compliment counter, and rich narrative Scent Stories.
3. **Scent DNA Engine**: Collection analytics revealing olfactive family distribution, top notes, preferred intensity, and season/climate fit.
4. **Scent Finder (Quiz)**: A 7-step core questionnaire evaluating 6 deterministic dimensions (Notes & Family, Climate, Occasion, Longevity, Gender, Budget) with transparent scoring breakdowns and "Possible Mismatch" warnings.
5. **Honest Affiliate Catalog**: Browsable fragrance catalog with Indonesian and international market tiers, transparent "Sample Data" labels, and direct Shopee/Tokopedia outbound redirect logging (`/go/:id`).
6. **Try It First**: Demand capture waitlist for 2ml vials, 5ml decants, and 10ml travel sprays, preparing for future sample fulfillment.

### Target Personas (Indonesian Context)
- **Raka ("The Curious Beginner", 20)**: Student or early career, tight budget (<Rp 500k), seeks safe scents for dates and interviews without wasting money on blind-buy regrets ("Takut zonk").
- **Dinda ("The Enthusiast", 28)**: Working professional with 10+ bottles and decants, seeks deep note breakdowns, skin performance tracking, and unhyped discoveries.
- **Bagas ("The Occasion & Gift Buyer", 32)**: Time-poor, buys 1–3 times a year for Lebaran or weddings, needs fast recommendations with clear reasons ("Kenapa cocok").

***

## 2. User Experience & Visual Design

### The Three UI Directions & Trade-Off Analysis

| Direction | Palette & Mood | Strengths | Trade-Offs |
| :--- | :--- | :--- | :--- |
| **A. Editorial Cream** *(Chosen)* | Background `#FFFEF2`, Charcoal `#333333`, Text `#2B2B2B`, Muted `#6B6B63`, Accent `#8A4B14`. High-contrast luxury serif headings, generous whitespace. | Calm, literary, timeless Aesop-like feel. Products and scent notes become the focal hero. High legibility. | Requires strict whitespace and restraint to avoid looking empty on large desktop monitors. |
| **B. Moody Library** | Deep espresso `#1A1715`, Charcoal `#262320`, Warm Amber `#D97706`, Cream text `#F5F2EB`. Bookshelf motif. | Intimate, sensory, atmospheric; excellent for evening fragrance discovery. | Lower daylight readability on mobile outdoor screens; heavier visual presence. |
| **C. Botanical Apothecary** | Cream `#FAF8F2`, Olive Green `#556B2F`, Earthy Ochre `#C28B38`, Charcoal text `#1F2421`. | Natural, artisanal, friendly; resonates with younger eco-conscious demographic. | Can feel rustic or herbal rather than luxury and modern perfumery. |

### Design Tokens (Direction A: Editorial Cream)
- `--bg`: `#FFFEF2` (Warm ivory canvas)
- `--surface`: `#F4F3E6` (Sunken cards, filter bars, table headers)
- `--bar`: `#333333` (Charcoal top bar, solid buttons, primary contrast borders)
- `--on-bar`: `#FFFEF2` (High-contrast text on dark buttons)
- `--ink`: `#1A1A1A` (Primary typography, 20.7:1 contrast on `--bg`)
- `--ink-muted`: `#5C5C5C` (Captions, secondary notes, 6.6:1 contrast)
- `--line`: `#8A8A8A` (Interactive control borders, 3.4:1 contrast)
- `--hairline`: `#D9D7C9` (Subtle dividers between sections)
- `--accent-amber`: `#8A4B14` (Warm amber accent for Scent DNA highlights)
- `--accent-olive`: `#7F8F3F` (Natural fresh note indicator)
- `--error`: `#B3261E` (Validation error text and indicators)

### Typographic Discipline
- **Headings (H1/H2)**: Cormorant Garamond / Playfair Display (Serif, elegant, tracking-normal, min 24px).
- **Body & Controls**: Plus Jakarta Sans / Inter (Clean geometric sans, tabular numbers for prices and mL).
- **Metadata**: Unboxed inline text separated by `·` (No colored pill badges).

### Responsive Viewport & Touch Ergonomics
- **Mobile (360px–430px)**: Bottom navigation bar (`Home`, `Library`, `Journal`, `Catalog`, `Finder`), minimum 44px tap targets, thumb-zone CTAs, bottom sheet dialogs.
- **Desktop (1024px–1440px)**: 3-zone top bar contract (Brand Wordmark — Navigation Links — Action), multi-column catalog grid, side-by-side compare matrices.

***

## 3. Key Product Decisions & Cross-Cutting Rules

### Product Rules (Binding Constraints)
- **BR-01 (Single Source of Truth)**: A single bottle record (`size_ml`, `remaining_ml`, `status`) is the sole source for bottle counts, remaining percentage, and collection valuation across Home, Library, and Journal.
- **BR-02 (Remaining % Rule)**: Fill level (%) and remaining mL indicators appear **only** for bottles with status `Currently Wearing` (`sealed` or `in_use`). They NEVER appear on Wishlist, Favorites, Memories, Catalog, or Journal.
- **BR-03 (Wishlist Semantics)**: Wishlist items are flags on perfumes (not bottles), carry no size or fill level, and are excluded from bottle totals and valuation.
- **BR-04 (Favorite Flag)**: Favorite is a flag on owned or remembered perfumes, never double-counting bottle totals.
- **BR-05 (Journal Counting)**: Only published Scent Stories (>= 20 characters) count as "Journal Stories". Quick wear logs count separately as "Wears".
- **BR-06 (Sample Data Honesty)**: Seeded data (ratings, review counts, prices) is explicitly badged with "Data contoh / Sample data" until replaced by >=5 verified user reviews.
- **BR-07 (Affiliate Integrity & No Pay-to-Rank)**: Outbound links route through `/go/:id?platform=shopee|tokopedia&src=...`. Transparent affiliate disclosures appear alongside all buy buttons. Commission or sponsorship NEVER alters Match Scores or ranking.
- **BR-08 (Stage Honesty)**: Try It First functions strictly as a waitlist and demand capture tool in Stage 1; no fake "In stock" or checkout claims are displayed.
- **BR-10 (Deterministic Match Engine)**: A single versioned config file governs the 6 scoring dimensions (Notes & Family 25, Climate 20, Occasion 20, Longevity 15, Gender 10, Budget 10). The LLM is used strictly to rephrase verified evidence, never to choose products or compute scores.
- **BR-12 (Complete Bilingual i18n)**: English and Bahasa Indonesia (informal-polite *kamu*) with URL prefixes (`/en`, `/id`) or locale state, persistence, and zero untranslated strings.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │     Public Views      │  │     Member Views     │  │   Admin Views    │  │
│  │  • Visitor Landing    │  │  • Home Dashboard    │  │  • Catalog CRUD  │  │
│  │  • Catalog & Detail   │  │  • Library (4 Shelves│  │  • Affiliate Log │  │
│  │  • Scent Finder Quiz  │  │  • Scent Diary & Log │  │  • Quiz Funnel   │  │
│  │  • Compare (Max 3)    │  │  • Scent DNA Card    │  │  • Moderation Q  │  │
│  │  • Try It First Wait  │  │  • Account Settings  │  │  • Feature Flags │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│              │                         │                       │            │
│              └─────────────────────────┼───────────────────────┘            │
│                                        ▼                                    │
│                    ┌───────────────────────────────────────┐                │
│                    │     Shared Domain Engine (Client)     │                │
│                    │  • Scent DNA Aggregator (REC-01)      │                │
│                    │  • Deterministic Matcher (REC-02)     │                │
│                    │  • Derived Count Invariants (XC-01)   │                │
│                    │  • i18n Dictionary (EN / ID)          │                │
│                    └───────────────────┬───────────────────┘                │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         │ HTTP REST / JSON
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS BACKEND SERVER                            │
│                                                                             │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │   Auth & Sessions    │  │  Affiliate Engine   │  │  AI Proxy & Logic  │  │
│  │  • Email/Password    │  │  • Route: /go/:id   │  │  • Gemini SDK      │  │
│  │  • Session Tokens    │  │  • Domain Allowlist │  │  • Structured JSON │  │
│  │  • OTP Adapter Stub  │  │  • Click Logger     │  │  • Template Fallbk │  │
│  │  • Role Check (RBAC) │  │  • 302 Redirect     │  │  • Validation Pass │  │
│  └──────────┬───────────┘  └──────────┬──────────┘  └─────────┬──────────┘  │
│             │                         │                       │             │
│             └─────────────────────────┼───────────────────────┘             │
│                                       ▼                                     │
│                     ┌───────────────────────────────────┐                   │
│                     │       Drizzle ORM Repository      │                   │
│                     │   • Invariant Check Constraints   │                   │
│                     │   • Connection Pool (Object Meth) │                   │
│                     └─────────────────┬─────────────────┘                   │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │ PostgreSQL Driver
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUD SQL POSTGRESQL DATABASE                        │
│                                                                             │
│  [users] ──── [profiles] ──── [consent_records]                             │
│     │                                                                       │
│     ├─────── [bottles] ────── [bottle_level_events]                         │
│     ├─────── [library_entries] (wishlist/favorites/memories)                │
│     ├─────── [wear_logs] ──── [scent_stories] ──── [reminders]              │
│     └─────── [reviews] ────── [review_reports]                              │
│                                                                             │
│  [perfumes] ──┬── [brands]                                                  │
│               ├── [perfume_notes] ──── [notes]                              │
│               ├── [perfume_families] ── [olfactive_families]                │
│               └── [affiliate_links] ── [affiliate_clicks]                   │
│                                                                             │
│  [quiz_sessions] ── [quiz_results] ── [waitlist_entries]                    │
│  [audit_logs] ────── [feature_flags] ── [ai_usage_logs]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Relational Entities & Invariants
- `users`: `id`, `email`, `password_hash`, `role` (`user`|`admin`), `nickname`, `locale` (`en`|`id`), `age_gate_passed_at`, `status`.
- `perfumes`: `id`, `slug`, `name`, `brand_id`, `concentration`, `release_year`, `primary_family_id`, `origin` (`ID`|`INT`), `market_tier` (`mass`|`designer`|`niche`|`indie`), `reference_price_idr`, `rating_seed`, `price_is_sample`, `rating_is_sample`.
- `bottles`: `id`, `user_id`, `perfume_id`, `status` (`sealed`|`in_use`|`finished`), `format` (`full`|`decant`|`travel`|`vial`), `size_ml`, `remaining_ml`, `ml_per_wear`, `price_idr`.
  - **Invariant I1**: `remaining_ml = size_ml + sum(bottle_level_events.delta_ml)`.
  - **Invariant I2**: `0 <= remaining_ml <= size_ml`; `status = finished` implies `remaining_ml = 0`.
- `library_entries`: `id`, `user_id`, `perfume_id`, `is_wishlisted`, `is_favorite`, `favorite_reason`, `is_remembered`.
- `wear_logs`: `id`, `user_id`, `bottle_id`, `perfume_id`, `worn_on`, `compliments`, `longevity_hours`, `mood`, `occasion`.
- `scent_stories`: `id`, `user_id`, `perfume_id`, `wear_log_id`, `title`, `body`, `status` (`draft`|`published`).
- `affiliate_links`: `id`, `perfume_id`, `platform` (`shopee`|`tokopedia`), `url`, `is_active`.
- `affiliate_clicks`: `id`, `click_id`, `link_id`, `perfume_id`, `platform`, `src`, `user_id`, `anon_id`, `counted`, `created_at`.
- `waitlist_entries`: `id`, `email`, `perfume_id`, `size_ml`, `willingness`, `fair_price_idr`, `whatsapp_number`, `status`.

***

## 5. Phased Delivery Roadmap

### Phase 0: Foundations & Plan Alignment *(Current Phase)*
- [x] Review full PRD v1.0, data model, business rules, and Indonesian market requirements.
- [x] Complete interactive clarification on aesthetic, stack, database, and auth priority.
- [x] Deliver architectural blueprint and detailed plan artifact (`implementation_plan.md`).
- [ ] Receive user confirmation to proceed to Phase 1.

### Phase 1: Foundations & Core Shell
- Scaffold Express full-stack architecture with TypeScript, Tailwind v4 design tokens for Editorial Cream, and bilingual i18n dictionaries (EN/ID).
- Set up Cloud SQL PostgreSQL database schema with Drizzle ORM and testable invariant constraints (I1-I8).
- Implement email/password auth flow, session tokens, role checks, and dev OTP adapter.
- Deliver interactive clickable prototypes for the 3 visual directions (`/prototypes/a`, `/prototypes/b`, `/prototypes/c`).
- Seed 40+ curated Indonesian and international fragrances with clearly labeled sample data.

### Phase 2: Catalog, Product Detail, Compare & Affiliate Redirect
- Browsable catalog with search, filters (family, brand, concentration, market tier, local vs international), and sort.
- Rich Product Detail pages (`/perfumes/:slug`) with note pyramid, longevity/sillage specs, and community ratings.
- Compare matrix (max 3 items) with sticky persistence and mobile-scrollable table.
- Secure `/go/:id` redirect route with click logging, domain allowlisting, and visible affiliate disclosures.

### Phase 3: Personal Library, Custom Fragrance Add & Scent DNA
- Visual shelf with 4 distinct tabs (Currently Wearing with % fill bar, Wishlist, Favorites, Scent Archive / Memories).
- Autocomplete add-from-catalog and private manual add for unlisted perfumes with duplicate detection.
- Scent DNA dashboard: olfactive family distribution, dominant notes, and collection metrics.

### Phase 4: Scent Diary, Wear Logs, Compliments & Reviews
- 1-tap wear logging with auto-decrement of remaining mL and undo toast (8 seconds).
- Scent Story publisher with autosave drafts and mood/occasion tagging.
- Extended review form (longevity, sillage, value, repurchase intent) and moderation queue.

### Phase 5: Scent Finder, Taste Profile & AI Recommendations
- [x] 7-step responsive Scent Finder questionnaire with autosave and "Not sure" handling.
- [x] Deterministic 6-dimension scoring engine with score calibration (FIND-05).
- [x] Server-side Gemini 2.5 Flash integration for rephrasing structured evidence into natural Bahasa/English explanations.
- [x] "Why this fits you" citations and mandatory "Possible mismatch" transparency.

### Phase 6: Try It First (Sample Waitlist)
- [x] Sample demand waitlist for 2ml, 5ml, and 10ml sizes with willingness-to-pay capture.
- [x] Flagged order checkout stub (`try_it_first_ordering`).

### Phase 7: Admin Panel & Moderation
- [x] Dashboard with affiliate click analytics, quiz funnel drop-off metrics, and waitlist demand.
- [x] Catalog management CRUD (Add, Edit, Delete with validation), review moderation queue, and feature flag toggles.
- [x] Gemini 2.5 Flash AI Request & Generation Log tracking (`/api/admin/ai-logs`) with latency, status, evidence, and interactive test trigger.
- [x] Waitlist demand export to CSV for batch procurement.

### Phase 8: Hardening, Polish & Launch Readiness
- WCAG 2.1 AA accessibility pass (keyboard navigation, visible focus rings, screen reader labels).
- Unit tests for scoring engine and invariants; integration tests for auth and affiliate redirects.
- PDP Law compliance verification, data export, and legal policy pages.
