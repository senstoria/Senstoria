# Senstoria Data Model & Entity Specifications

## 1. Relational Entities (Cloud SQL PostgreSQL + Drizzle ORM)

### Identity & Consent
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'editor', 'admin')),
  nickname TEXT,
  locale TEXT NOT NULL DEFAULT 'id' CHECK (locale IN ('en', 'id')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  age_gate_passed_at TIMESTAMPTZ,
  age_band TEXT,
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'enthusiast')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_deletion', 'deleted')),
  email_verified_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  climate TEXT DEFAULT 'hot-humid',
  budget_min_idr INTEGER DEFAULT 0,
  budget_max_idr INTEGER DEFAULT 1500000,
  gender_style TEXT DEFAULT 'unisex' CHECK (gender_style IN ('feminine', 'masculine', 'unisex', 'any')),
  disliked_note_ids TEXT[],
  default_ml_per_wear NUMERIC(3, 1) DEFAULT 0.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  anon_id TEXT,
  subject TEXT NOT NULL CHECK (subject IN ('terms', 'privacy', 'marketing_email', 'marketing_whatsapp', 'push', 'analytics', 'waitlist_notice')),
  granted BOOLEAN NOT NULL,
  policy_version TEXT NOT NULL,
  text_version TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Catalog
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  is_local BOOLEAN NOT NULL DEFAULT false,
  market_tier TEXT NOT NULL CHECK (market_tier IN ('mass', 'designer', 'niche', 'indie')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE olfactive_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_id TEXT NOT NULL,
  description_en TEXT,
  description_id TEXT
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name_en TEXT NOT NULL,
  display_name_id TEXT NOT NULL,
  note_group TEXT NOT NULL, -- e.g. citrus, floral, woody, amber, musk, spice
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE perfumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_id UUID NOT NULL REFERENCES brands(id),
  concentration TEXT NOT NULL CHECK (concentration IN ('EDC', 'EDT', 'EDP', 'Parfum', 'Extrait')),
  release_year INTEGER,
  gender_label TEXT NOT NULL CHECK (gender_label IN ('feminine', 'masculine', 'unisex')),
  primary_family_id UUID NOT NULL REFERENCES olfactive_families(id),
  secondary_family_id UUID REFERENCES olfactive_families(id),
  origin TEXT NOT NULL DEFAULT 'INT' CHECK (origin IN ('ID', 'INT')),
  market_tier TEXT NOT NULL CHECK (market_tier IN ('mass', 'designer', 'niche', 'indie')),
  reference_price_idr INTEGER,
  reference_price_size_ml INTEGER DEFAULT 50,
  price_updated_at TIMESTAMPTZ,
  price_is_sample BOOLEAN NOT NULL DEFAULT true,
  rating_seed NUMERIC(2, 1),
  rating_seed_count INTEGER DEFAULT 0,
  rating_is_sample BOOLEAN NOT NULL DEFAULT true,
  heat_suitability INTEGER CHECK (heat_suitability BETWEEN 1 AND 5),
  day_night_lean TEXT CHECK (day_night_lean IN ('day', 'night', 'both')),
  longevity_expected_band TEXT CHECK (longevity_expected_band IN ('<2h', '2-4h', '4-6h', '6-8h', '8h+')),
  projection_expected INTEGER CHECK (projection_expected BETWEEN 1 AND 4),
  brand_claims TEXT,
  image_url TEXT,
  source TEXT NOT NULL DEFAULT 'curated_seed' CHECK (source IN ('fragella', 'admin', 'user_manual', 'curated_seed')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'merged')),
  canonical_id UUID REFERENCES perfumes(id),
  sample_candidate BOOLEAN NOT NULL DEFAULT false,
  owner_user_id UUID REFERENCES users(id), -- For private user-created perfumes
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE perfume_notes (
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  layer TEXT NOT NULL CHECK (layer IN ('top', 'heart', 'base')),
  PRIMARY KEY (perfume_id, note_id, layer)
);
```

### Personal Collection & Journal
```sql
CREATE TABLE library_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  is_wishlisted BOOLEAN NOT NULL DEFAULT false,
  wishlisted_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  favorite_reason TEXT,
  is_remembered BOOLEAN NOT NULL DEFAULT false,
  remembered_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, perfume_id)
);

CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sealed' CHECK (status IN ('sealed', 'in_use', 'finished')),
  format TEXT NOT NULL DEFAULT 'full' CHECK (format IN ('full', 'decant', 'travel', 'vial')),
  size_ml INTEGER NOT NULL CHECK (size_ml > 0),
  remaining_ml NUMERIC(6, 1) NOT NULL,
  ml_per_wear NUMERIC(3, 1) NOT NULL DEFAULT 0.5,
  price_idr INTEGER,
  purchased_on DATE,
  acquisition_path TEXT CHECK (acquisition_path IN ('blind_bought', 'sampled_first', 'gift', 'other')),
  finished_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_remaining_bounds CHECK (remaining_ml >= 0 AND remaining_ml <= size_ml),
  CONSTRAINT check_finished_zero CHECK (status != 'finished' OR remaining_ml = 0)
);

CREATE TABLE bottle_level_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  delta_ml NUMERIC(6, 1) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('initial', 'wear', 'wear_undo', 'manual', 'finish', 'reopen')),
  wear_log_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wear_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  worn_on DATE NOT NULL,
  compliments INTEGER DEFAULT 0 CHECK (compliments >= 0),
  longevity_hours NUMERIC(3, 1) CHECK (longevity_hours <= 24),
  mood TEXT,
  occasion TEXT,
  weather_context TEXT,
  note TEXT,
  client_op_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_op_id)
);

CREATE TABLE scent_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  wear_log_id UUID REFERENCES wear_logs(id),
  title TEXT,
  body TEXT NOT NULL,
  mood TEXT,
  occasion TEXT,
  tags TEXT[],
  story_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Reviews & Recommendations
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  overall_stars INTEGER NOT NULL CHECK (overall_stars BETWEEN 1 AND 5),
  longevity_band TEXT NOT NULL CHECK (longevity_band IN ('<2h', '2-4h', '4-6h', '6-8h', '8h+')),
  sillage INTEGER NOT NULL CHECK (sillage BETWEEN 1 AND 4),
  value_rating INTEGER NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
  would_repurchase TEXT NOT NULL CHECK (would_repurchase IN ('yes', 'maybe', 'no')),
  purchase_path TEXT NOT NULL CHECK (purchase_path IN ('blind_bought', 'sampled_first', 'gift', 'other')),
  text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'held', 'rejected', 'hidden')),
  moderation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, perfume_id)
);
```

### Affiliate & Monetization
```sql
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('shopee', 'tokopedia')),
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (perfume_id, platform)
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id TEXT NOT NULL UNIQUE,
  link_id UUID REFERENCES affiliate_links(id),
  perfume_id UUID NOT NULL REFERENCES perfumes(id),
  platform TEXT NOT NULL,
  src TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  anon_id TEXT,
  quiz_session_id TEXT,
  match_score_shown INTEGER,
  locale TEXT NOT NULL,
  device_class TEXT NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  counted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,
  perfume_id UUID NOT NULL REFERENCES perfumes(id),
  size_ml INTEGER NOT NULL CHECK (size_ml IN (2, 5, 10)),
  willingness TEXT NOT NULL CHECK (willingness IN ('yes', 'maybe', 'no')),
  fair_price_idr INTEGER,
  whatsapp_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_confirm', 'active', 'withdrawn', 'notified')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, perfume_id, size_ml)
);
```

---

## 2. Invariants Enforced (I1–I8)

1. **I1 (Level Ledger)**: `remaining_ml = size_ml + SUM(bottle_level_event.delta_ml)`.
2. **I2 (Volume Bounds)**: `0 <= remaining_ml <= size_ml`; `status = finished` requires `remaining_ml = 0`.
3. **I3 (Library Bottles Count)**: `Total Library Bottles` equals count of non-deleted bottles with status `sealed` or `in_use`.
4. **I4 (Wishlist Exclusion)**: Wishlist is a flag, not a bottle; it never contributes to bottle counts or valuation.
5. **I5 (One Review Rule)**: Exactly one review per user per perfume; public aggregates include published reviews only.
6. **I6 (Wears vs Stories Separation)**: Quick wear logs and written Scent Stories are counted strictly separately.
7. **I7 (Affiliate Click Reconciliation)**: Counted clicks in analytics dashboards must reconcile 100% with `affiliate_click.counted = true`.
8. **I8 (Sample Data Isolation)**: Seeded ratings or prices flagged with `is_sample = true` are never blended with real community aggregates.
