# Senstoria Architectural Decision Records (ADR)

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

### D-04: Aesthetic Direction — Editorial Cream
- **Decision**: Direction A (Editorial Cream): Warm ivory `#FFFEF2`, charcoal `#333333`, serif headlines, zero static pill tags, generous spatial breathing room.
- **Rationale**: Aligns with luxury apothecary perfumery (Aesop, Le Labo, Byredo) while maintaining WCAG AA contrast.

### D-05: Stack Selection for AI Studio Environment
- **Decision**: React 19 + Vite + Express TypeScript on Node.js 22, with Cloud SQL PostgreSQL and Drizzle ORM.
- **Rationale**: Provides instant dev container boot, hot reloading, safe server-side API proxying for Gemini, and native PostgreSQL check constraint enforcement.

### D-06: Deterministic Scoring Formula
- **Decision**: 6-dimension deterministic engine with versioned weights:
  - Notes & Family: 25%
  - Climate Suitability: 20%
  - Occasion Fit: 20%
  - Longevity: 15%
  - Gender Style: 10%
  - Budget Band: 10%
  - Evidence shrinkage factor: `0.80 + 0.20 * (W / 100)`.
  - Max ceiling: 96% (scores never display 97-100% to reflect sensory humility).
  - Derived attribute cap: 0.85 until verified by >=5 real wearer reviews.
- **Rationale**: Explainable, testable in CI, and immune to commercial pay-to-rank bias.

### D-07: LLM Scope & Guardrails
- **Decision**: Gemini 2.5 Flash is strictly used server-side to rephrase verified evidence into natural conversational Bahasa Indonesia or English.
- **Rationale**: Zero hallucination risk for product recommendations; all recommended perfumes are guaranteed to exist in the database.

### D-08: Authentication Phasing
- **Decision**: Email and password with verification link first. WhatsApp OTP and Google Sign-in architected behind feature flags (`whatsapp_otp`, `google_login`).
- **Rationale**: Reduces 3rd-party vendor blocking during initial development while maintaining a production-ready path.

### D-09: Affiliate Redirect Architecture
- **Decision**: Outbound buy clicks pass through `/go/:id?platform=shopee|tokopedia&src=...`.
- **Rationale**: Enables accurate internal click attribution, domain allowlisting (preventing open redirect vulnerabilities), and transparent commission disclosure.
