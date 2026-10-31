export type CanonicalOccasionTag = 'office' | 'casual' | 'daily' | 'date_night' | 'formal' | 'night_out' | 'sport';

export type DataStatus = 'draft' | 'verified' | 'published' | 'archived';

export interface SeedPerfume {
  id: string;
  slug: string;
  name: string;
  brand: string;
  concentration: 'EDC' | 'EDT' | 'EDP' | 'Parfum' | 'Extrait';
  release_year?: number;
  gender_label: 'feminine' | 'masculine' | 'unisex' | 'unknown';
  // Family is a brand-stated fact, not a curator guess. When the brand's
  // official page does not state a family, the field stays absent and the
  // UI hides the family line (never a placeholder, never guessed).
  primary_family?: string;
  secondary_family?: string;
  origin: 'ID' | 'INT';
  // Verified brand country (canonical brands.country). Present only when
  // verified from an official brand source; absent means "not verified yet"
  // and the perfume must NOT match any Brand Origin filter selection.
  // CatalogView falls back to 'Indonesia' for origin 'ID' rows, because
  // 'ID' already classifies the brand as Indonesian local.
  brand_country?: string;
  market_tier: 'mass' | 'designer' | 'niche' | 'indie';
  reference_price_idr: number;
  reference_price_size_ml: number;
  price_is_sample: boolean;
  price_checked_date?: string; // ISO date; only for verified official prices
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  // Curator estimate 1-5. Absent when not stated by the brand: the climate
  // dimension then scores as NoData (never guessed).
  heat_suitability?: number; // 1 to 5
  longevity_expected_band: '<2h' | '2-4h' | '4-6h' | '6-8h' | '8h+' | 'unknown';
  projection_expected: number; // 1 to 4
  description_id: string;
  description_en: string;
  // Brand-stated performance claim. Empty when no brand claim is verified:
  // the detail view hides the brand-claims box (never a placeholder).
  brand_claims?: string;
  sample_candidate: boolean;
  // Retired in Sprint 2: the Buy flow uses goUrl() + perfume_offers, not
  // these fields. Kept as empty strings so no seed row carries a link that
  // looks like an affiliate link; draft rows must carry no affiliate link.
  shopee_url: string;
  tokopedia_url: string;
  // Canonical catalog status (Sprint 3). Only 'published' rows appear in
  // the production catalog, Finder, compare, and detail entry points.
  data_status: DataStatus;
  source_official_url?: string;
  source_checked_date?: string; // ISO date of the official-site check
  // Founder/curator sign-off. Empty until countersigned at the gate: the
  // verification record lives in the Sprint 3 gate log, not in this field.
  verified_by?: string;
  // Canonical occasion tags (schema vocabulary). Absent when the brand
  // does not state usage occasions: the occasion dimension then scores as
  // NoData (never inferred from concentration/projection/family).
  occasion_tags?: CanonicalOccasionTag[];
  // Perfumer, shown only when verified from an official source.
  perfumer?: string;
  // Manual-only cover photo (work 6/32): a downscaled JPEG data URL chosen
  // in the manual-add form. This is NOT a canonical catalog image_url and
  // must never be used for catalog perfumes. Manual perfumes are stored
  // only in the user's device localStorage (see App.tsx), so this photo is
  // device-local too: it is never uploaded to Firebase Storage (the repo
  // has no Storage upload path) and never synced to a server.
  cover_image_data_url?: string;
}

export const SEED_PERFUMES: SeedPerfume[] = [
  {
    id: 'prf_001',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'hmns-orgasm',
    name: 'Orgasm',
    brand: 'HMNS',
    concentration: 'EDP',
    release_year: 2019,
    gender_label: 'feminine',
    primary_family: 'Floral Ambery',
    secondary_family: 'Fruity',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 325000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Red Apple, Peach',
    heart_notes: 'Rose, Jasmine, Peony',
    base_notes: 'Amber, Vanilla, Warm Musk',
    heat_suitability: 4,
    longevity_expected_band: '6-8h',
    projection_expected: 3,
    description_id: 'Aroma floral manis dengan sentuhan apel merah renyah dan dasar vanilla-amber yang menggoda, dirancang khusus untuk kenyamanan iklim tropis.',
    description_en: 'Sweet floral opening with crisp red apple, flourishing into romantic peony and settling on a sensual vanilla-amber foundation.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_002',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'hmns-farhampton',
    name: 'Farhampton',
    brand: 'HMNS',
    concentration: 'Extrait',
    release_year: 2020,
    gender_label: 'unisex',
    primary_family: 'Aromatic Ambery',
    secondary_family: 'Woody',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 375000,
    reference_price_size_ml: 100,
    price_is_sample: true,
    top_notes: 'Bergamot, Ripe Fruit',
    heart_notes: 'Lavender, Orange Blossom',
    base_notes: 'Amber, Cedarwood, Tonka Bean',
    heat_suitability: 3,
    longevity_expected_band: '8h+',
    projection_expected: 4,
    description_id: 'Formulasi Pure Extrait yang maskulin dan elegan dengan lavender menenangkan serta amber kayu tahan banting.',
    description_en: 'Rich extrait concentration balancing zesty bergamot with aromatic French lavender and warm, commanding amber cedar.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_003',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'oullu-arcanum',
    name: 'Arcanum',
    brand: 'Oullu',
    concentration: 'EDP',
    release_year: 2021,
    gender_label: 'unisex',
    primary_family: 'Woody Gourmand',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 389000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Nutmeg, Licorice, Bergamot',
    heart_notes: 'Dark Cacao, Cedarwood',
    base_notes: 'Amber, Bourbon Vanilla, Soft Musk',
    heat_suitability: 3,
    longevity_expected_band: '6-8h',
    projection_expected: 2,
    description_id: 'Perpaduan rempah pala dan cokelat hitam pekat dengan nuansa misterius yang hangat dan intim.',
    description_en: 'An enigmatic blend of nutmeg spice and dark chocolate heart enveloped by rich smoky bourbon vanilla.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_004',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'carl-claire-black-orchid',
    name: 'Black Orchid',
    brand: 'Carl & Claire',
    concentration: 'EDP',
    release_year: 2020,
    gender_label: 'feminine',
    primary_family: 'Floral Woody',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 279000,
    reference_price_size_ml: 30,
    price_is_sample: true,
    top_notes: 'Blackcurrant, Truffle, Gardenia',
    heart_notes: 'Black Orchid, Lotus, Warm Spices',
    base_notes: 'Patchouli, Sandalwood, Dark Chocolate',
    heat_suitability: 2,
    longevity_expected_band: '6-8h',
    projection_expected: 3,
    description_id: 'Keharuman mewah anggrek hitam dengan sentuhan cokelat gelap dan kayu nilam Indonesia.',
    description_en: 'Sensual floral mystery dominated by opulent black orchid, earthy Indonesian patchouli, and cocoa accords.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_005',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'alien-objects-xandu',
    name: 'Xandu',
    brand: 'Alien Objects',
    concentration: 'Extrait',
    release_year: 2022,
    gender_label: 'unisex',
    primary_family: 'Woody Smoky',
    origin: 'ID',
    market_tier: 'niche',
    reference_price_idr: 650000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Wild Saffron, Thyme, Raspberry',
    heart_notes: 'Olibanum Incense, Night Jasmine',
    base_notes: 'Kalimantan Agarwood (Oud), Raw Leather, Amber',
    heat_suitability: 2,
    longevity_expected_band: '8h+',
    projection_expected: 4,
    description_id: 'Mahakarya artisan perfumery lokal Indonesia dengan gaharu Kalimantan murni berbalut safron pedas dan kulit mewah.',
    description_en: 'Artisanal Indonesian craft pairing wild Kalimantan agarwood with saffron and raw suede leather.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_006',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'kahf-revered-oud',
    name: 'Revered Oud',
    brand: 'Kahf',
    concentration: 'EDT',
    release_year: 2021,
    gender_label: 'masculine',
    primary_family: 'Woody Ambery',
    origin: 'ID',
    market_tier: 'mass',
    reference_price_idr: 78000,
    reference_price_size_ml: 100,
    price_is_sample: true,
    top_notes: 'Rose, Fruity Accords, Lemon',
    heart_notes: 'Amber, Gourmand Accords',
    base_notes: 'Agarwood (Oud), Vanilla, Cedarwood',
    heat_suitability: 4,
    longevity_expected_band: '4-6h',
    projection_expected: 2,
    description_id: 'Aroma oud yang ramah untuk pemula dan penggunaan harian santai di iklim tropis, dengan harga terjangkau.',
    description_en: 'An accessible, smooth daily oud tailored for tropical heat and everyday casual wear.',
    brand_claims: '',
    sample_candidate: false,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_007',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'saff-co-sotb',
    name: 'S.O.T.B',
    brand: 'SAFF & Co.',
    concentration: 'Extrait',
    release_year: 2021,
    gender_label: 'unisex',
    primary_family: 'Floral Ambery',
    secondary_family: 'Fresh',
    origin: 'ID',
    market_tier: 'indie',
    reference_price_idr: 249000,
    reference_price_size_ml: 30,
    price_is_sample: true,
    top_notes: 'Mandarin, Galbanum, Ylang-Ylang',
    heart_notes: 'Tuberose, Jasmine, Orange Blossom',
    base_notes: 'Vanilla, Tonka Bean, Cedarwood',
    heat_suitability: 4,
    longevity_expected_band: '6-8h',
    projection_expected: 4,
    description_id: 'Wewangian musim panas tropis yang menyegarkan dengan sentuhan bunga sedap malam dan vanila hangat di pantai.',
    description_en: 'Sun-drenched tropical summer in a bottle with creamy tuberose and radiant solar citrus.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_008',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'formless-paperweight',
    name: 'Paperweight',
    brand: 'Formless',
    concentration: 'EDP',
    release_year: 2023,
    gender_label: 'unisex',
    primary_family: 'Woody Aromatic',
    origin: 'ID',
    market_tier: 'niche',
    reference_price_idr: 495000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Black Pepper, Cardamom',
    heart_notes: 'Papyrus, Dry Cedar, Orris',
    base_notes: 'Vetiver, Cashmere Wood, White Musk',
    heat_suitability: 4,
    longevity_expected_band: '6-8h',
    projection_expected: 2,
    description_id: 'Aroma kertas buku tua, kayu cedar kering, dan rempah halus, diciptakan bagi pecinta suasana tenang dan membaca.',
    description_en: 'Quiet contemplation inspired by aged paper, dry cedar bookshelves, and soothing black pepper.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_009',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'le-labo-santal-33',
    name: 'Santal 33',
    brand: 'Le Labo',
    concentration: 'EDP',
    release_year: 2011,
    gender_label: 'unisex',
    primary_family: 'Woody Aromatic',
    origin: 'INT',
    market_tier: 'niche',
    reference_price_idr: 3400000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Violet Accord, Cardamom',
    heart_notes: 'Iris, Papyrus, Ambrox',
    base_notes: 'Cedarwood, Australian Sandalwood, Leather',
    heat_suitability: 3,
    longevity_expected_band: '8h+',
    projection_expected: 4,
    description_id: 'Ikon modern wewangian kayu cendana dengan sentuhan kulit dan violet yang sangat khas di seluruh dunia.',
    description_en: 'An iconic cult fragrance capturing the smoky spirit of the American West through Australian sandalwood and crisp cardamom.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_010',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'maison-margiela-jazz-club',
    name: 'Jazz Club',
    brand: 'Maison Margiela',
    concentration: 'EDT',
    release_year: 2013,
    gender_label: 'unisex',
    primary_family: 'Woody Ambery',
    origin: 'INT',
    market_tier: 'designer',
    reference_price_idr: 2150000,
    reference_price_size_ml: 100,
    price_is_sample: true,
    top_notes: 'Pink Pepper, Neroli, Lemon',
    heart_notes: 'Rum Absolute, Clary Sage, Java Vetiver',
    base_notes: 'Tobacco Leaf, Vanilla Bean, Styrax',
    heat_suitability: 2,
    longevity_expected_band: '6-8h',
    projection_expected: 3,
    description_id: 'Kenangan suasana klub jazz intim di Brooklyn dengan aroma koktail rum manis, cerutu tembakau, dan sofa kulit tua.',
    description_en: 'Heady evening ambiance recalling cigars, rum cocktails, and smooth leather armchairs.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_011',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'diptyque-philosykos',
    name: 'Philosykos',
    brand: 'Diptyque',
    concentration: 'EDT',
    release_year: 1996,
    gender_label: 'unisex',
    primary_family: 'Fresh Green',
    secondary_family: 'Woody',
    origin: 'INT',
    market_tier: 'niche',
    reference_price_idr: 2400000,
    reference_price_size_ml: 100,
    price_is_sample: true,
    top_notes: 'Fig Leaf, Fig Fruit',
    heart_notes: 'Green Notes, Coconut',
    base_notes: 'Fig Tree Wood, Cedar, Black Pepper',
    heat_suitability: 5,
    longevity_expected_band: '4-6h',
    projection_expected: 2,
    description_id: 'Penghormatan alami untuk seluruh bagian pohon buah ara: daun hijau segar, getah buah manis, dan kulit kayunya yang hangat.',
    description_en: 'An ode to the whole fig tree: green freshness of leaves, milky sap of fruit, and bark warmed by the Mediterranean sun.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_012',
    data_status: 'draft',
    source_official_url: '',
    source_checked_date: '',
    slug: 'aesop-hwyl',
    name: 'Hwyl',
    brand: 'Aesop',
    concentration: 'EDP',
    release_year: 2017,
    gender_label: 'unisex',
    primary_family: 'Woody Smoky',
    origin: 'INT',
    market_tier: 'niche',
    reference_price_idr: 2100000,
    reference_price_size_ml: 50,
    price_is_sample: true,
    top_notes: 'Spices, Thyme',
    heart_notes: 'Cypress, Japanese Hinoki Wood',
    base_notes: 'Vetiver, Cedarwood, Oakmoss, Frankincense',
    heat_suitability: 3,
    longevity_expected_band: '6-8h',
    projection_expected: 2,
    description_id: 'Sensasi berjalan di tengah hutan cemara Hinoki Jepang yang berkabut dengan ketenangan dupa meditatif.',
    description_en: 'An evocative woodland fragrance evoking Japanese Hinoki greenery and silent mossy earth.',
    brand_claims: '',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: ''
  },
  {
    id: 'prf_013',
    slug: 'hmns-the-perfection',
    name: 'The Perfection',
    brand: 'HMNS',
    concentration: 'EDP',
    gender_label: 'unknown',
    origin: 'ID',
    brand_country: 'Indonesia',
    market_tier: 'indie',
    reference_price_idr: 633215,
    reference_price_size_ml: 100,
    price_is_sample: false,
    price_checked_date: '2026-10-30',
    top_notes: 'Bergamot, Elemi, Indonesian Clove, Nutmeg',
    heart_notes: 'Lavender, Tagetes, Lily of the Valley, Green Pear',
    base_notes: 'Driftwood, Sandalwood, Leather, Musk',
    longevity_expected_band: '4-6h',
    projection_expected: 2,
    description_id: 'Eau de Parfum 100 ml dari HMNS. Dirancang bersama Christian Sugiono.',
    description_en: 'Eau de Parfum 100 ml from HMNS. Designed with Christian Sugiono.',
    brand_claims: 'Klaim Brand: Ketahanan 4–6 jam, sillage Medium, proyeksi ±2 m.',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: '',
    data_status: 'published',
    source_official_url: 'https://hmnsperfume.com/products/hmns-perfume-the-perfection',
    source_checked_date: '2026-10-30',
    verified_by: ''
  },
  {
    id: 'prf_014',
    slug: 'carl-claire-enchantee',
    name: 'Enchantée',
    brand: 'Carl & Claire',
    concentration: 'EDP',
    gender_label: 'feminine',
    primary_family: 'Floral',
    origin: 'ID',
    brand_country: 'Indonesia',
    market_tier: 'indie',
    reference_price_idr: 279000,
    reference_price_size_ml: 30,
    price_is_sample: false,
    price_checked_date: '2026-10-30',
    top_notes: 'Citrus, Ginger, Peach',
    heart_notes: 'White Flowers, Jasmine, Tuberose, Heliotrope',
    base_notes: 'Ambrette, Musk, Gourmand',
    longevity_expected_band: '8h+',
    projection_expected: 4,
    description_id: 'Eau de Parfum 30 ml kolaborasi Carl & Claire dengan Emily in Paris. Aroma floral feminin.',
    description_en: 'Eau de Parfum 30 ml from the Carl & Claire × Emily in Paris collaboration. A feminine floral scent.',
    brand_claims: 'Klaim Brand: Ketahanan hingga 8–10 jam, sillage Medium, proyeksi 5/5 (skala brand).',
    sample_candidate: true,
    shopee_url: '',
    tokopedia_url: '',
    data_status: 'published',
    source_official_url: 'https://www.carlandclaire.com/products/carl-claire-emily-in-paris-enchantee-edp-30ml',
    source_checked_date: '2026-10-30',
    verified_by: '',
    occasion_tags: ['formal', 'casual']
  }
];

// Canonical catalog choke point (Sprint 3): ONLY published rows reach the
// production catalog, Finder, compare, and detail entry points. Draft rows
// remain in SEED_PERFUMES for admin review and labelled demo fixtures only.
export const PUBLISHED_PERFUMES: SeedPerfume[] = SEED_PERFUMES.filter(
  p => p.data_status === 'published'
);
