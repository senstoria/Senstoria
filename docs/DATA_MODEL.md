# Senstoria Data Model & Entity Specifications

> **Status dokumen (28 Oktober 2026, Sprint 5).** Skema PostgreSQL pada
> versi sebelumnya dihapus: tidak ada PostgreSQL di repo ini. Dokumen ini
> menyatakan bentuk data yang benar-benar ada di kode hari ini, ditambah
> penanda **TODO** untuk skema Firestore yang dirancang di Rencana Rombak
> Tahap 2 §5 tetapi belum diimplementasikan. Jangan mengarang field yang
> belum ada di kode.

## 1. Bentuk data di kode hari ini

### 1.1 Seed katalog — `SeedPerfume` (`src/data/seedPerfumes.ts`)

12 record seed, berlabel data contoh (`price_is_sample`, `rating_is_sample`).
Field: `id`, `slug`, `name`, `brand`, `concentration` (`EDC | EDT | EDP |
Parfum | Extrait`), `release_year`, `gender_label`, `primary_family`,
`secondary_family?`, `origin` (`ID | INT`), `market_tier` (`mass |
designer | niche | indie`), `reference_price_idr`,
`reference_price_size_ml`, `price_is_sample`, `rating_seed`,
`rating_seed_count`, `rating_is_sample`, `top_notes`, `heart_notes`,
`base_notes` (string, bukan relasi), `heat_suitability` (1–5),
`longevity_expected_band`, `projection_expected` (1–4),
`description_id`, `description_en`, `brand_claims`, `sample_candidate`,
`shopee_url`, `tokopedia_url` (placeholder).

Skema kanonik 44 kolom (brands/perfumes/notes/perfume_notes/
perfume_offers, kosakata terkontrol) adalah dokumen desain di rencana
rombak, **belum** diimplementasikan. **TODO (Sprint 3):** seed lokal
terverifikasi + pemetaan Finder.

### 1.2 State turunan — `src/lib/derivedCalculations.ts`

Satu-satunya sumber kebenaran untuk nilai turunan (BR-01). Bentuk state:

- `BottleState`: `size_ml`, `remaining_ml`, `status`, dan field pendukung
  (`is_favorite`, `deleted_at`, ...). `% remaining` dihitung oleh
  `calculateRemainingPercentage` (HANYA ditampilkan di Currently Wearing
  + rotasi Home + alert botol menipis, BR-02).
- `WearLogState`, `StoryState` (Scent Stories tertulis — hanya ini yang
  dihitung sebagai Journal Stories, BR-05), `ReviewState`, `DiaryStats`,
  `ReviewSummary`, `WaitlistState`, `SampleOrderState`.
- `calculateFairSamplePrice(pricePerMl, sizeMl: 2 | 5 | 10)` untuk
  estimasi harga decant.

State aplikasi hari ini hidup di React state + localStorage (mode demo)
dan, di branch Sprint 1, mulai ditulis ke Firestore. Tidak ada tabel
relasional, tidak ada Drizzle, tidak ada migrasi.

### 1.3 Firestore — dirancang, belum diimplementasikan penuh

`firestore.rules` (Rules v1) ada di repo dan terverifikasi emulator 46/46
di Sprint 1. Koleksi, indeks, dan aturan penulisan Firestore mengikuti
spesifikasi §5 Rencana Rombak Tahap 2. **TODO (Sprint 2):** implementasi
satu sumber kebenaran Firestore (bottles/wears/stories/reviews/catalog)
dan penulisan ulang dokumen ini dari kode yang sudah mendarat.

### 1.4 Scoring — `src/lib/scentScoring.ts`

Input: jawaban kuis 7 langkah (notes & family, climate, occasion,
longevity, gender, budget, pantangan). Bobot terverifikasi di kode:
Notes & Family 25, Climate 20, Occasion 20, Longevity 15, Gender 10,
Budget 10. Field legacy `sillageFit`/`originFit` dihapus di Sprint 5
(tidak pernah dibaca). Kalibrasi D-06 (ceiling 96, shrinkage
`0.80 + 0.20 * (W/100)`, derived-cap 0.85) **belum terverifikasi
implementasinya** — **TODO (Sprint 3)**.

## 2. Aturan yang mengikat bentuk data (PRD §3.3, BR-01–BR-12)

- BR-01: record botol (`size_ml`, `remaining_ml`, `status`) adalah
  satu-satunya sumber untuk % remaining, counts, dan valuasi.
- BR-03: Wishlist bukan owned dan tidak dihitung dalam agregat koleksi.
- BR-05: hanya Scent Stories tertulis yang dihitung; wear log terpisah;
  Journal S1 privat.
- BR-06: data contoh wajib dilabeli dan tidak boleh dicampur ke agregat
  real; tidak ada angka kontradiktif di halaman yang sama.
- BR-09: tidak ada pay-to-rank; komisi tidak memengaruhi skor/ranking.
- BR-10: satu config scoring Finder; LLM hanya boleh memparafrase
  penjelasan terstruktur yang divalidasi.
- BR-12: seluruh string UI di `src/lib/i18n.ts`; tidak ada hard-coded
  string di komponen.

## 3. Yang TIDAK ada (jangan diasumsikan)

Tidak ada tabel `users`/`profiles`/`consent_records` di database mana
pun; tidak ada `password_hash` (Auth Firebase); tidak ada relasi
`perfume_notes`; tidak ada endpoint `/api/*` yang berjalan; tidak ada
penyimpanan klik `/go`. Semua itu adalah desain masa depan (Sprint 2–4)
atau fiksi dokumen lama.
