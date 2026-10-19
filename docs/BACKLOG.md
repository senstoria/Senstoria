# Senstoria Development Backlog & Status Tracker

**Status Proyek Terkini:**
- **Fase Saat Ini:** **Phase 7 (Admin Backend & Moderasi) — SELESAI (Completed)**.
- **Fase Selanjutnya:** **Phase 8 (Hardening, Accessibility, SEO & Deployment)** — Siap dieksekusi.
- **Arah Desain yang Dipilih:** Direction A — **Editorial Cream** (Aesop-style, ivory `#FFFEF2`, charcoal `#333333`, tipografi Cormorant Garamond & Plus Jakarta Sans).

---

## Ringkasan Fase

| Fase | Nama Fase | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Plan, Architecture & UI Options | **SELESAI (Done)** | Klarifikasi keputusan fondasi selesai, PRD v1.0 dianalisis, arsitektur, data model, dan 3 prototipe (`/prototypes/a`, `/b`, `/c`) serta preview interaktif berhasil di-commit (`fbfb5c1`). |
| **Phase 1** | Foundations & Core Engine | **SELESAI (Done)** | Firebase provisioned & rules deployed, Express full-stack `server.ts` with `/go/:id` 302 redirect & domain allowlist, i18n bilingual dictionary, Single Source of Truth invariants (`derivedCalculations.ts`), 42 curated seed perfumes, AuthContext with 18+ age-gate and WhatsApp OTP adapter, 100% unit tests pass. |
| **Phase 2** | Catalog, Detail, Compare & Affiliate | **SELESAI (Done)** | Filter multi-facet dinamis di katalog (Keluarga aroma, Brand, Asal: ID/INT, Konsentrasi, Rentang Harga), tab horizontal Aesop-style, halaman detail parfum dengan piramida notes & panduan iklim tropis Indonesia, blok "Ulasan Pemakai Nyata vs Klaim Brand", compare tray mengambang (1-3 item) dengan difference toggle & modal quick-add, nilai per ml, serta live logging klik afiliasi ke Express server. |
| **Phase 3** | Personal Library & Scent DNA | **SELESAI (Done)** | 4 rak terpadu (Sedang Dipakai dengan bar sisa % & badge low-bottle, Wishlist, Favorit, Kenangan), input custom parfum privat dengan deteksi duplikat ("Did you mean...?"), modal edit botol, aksi hapus dengan toast undo 8 detik, serta dashboard analitik Scent DNA. |
| **Phase 4** | Scent Diary & Reviews | **SELESAI (Done)** | Catat semprot 1-tap terintegrasi pengurangan mL otomatis & toast undo 8 detik, pembuat Cerita Aroma (Scent Story) dengan autosave draft & timeline memori olfaktif, form ulasan multi-kriteria (rating, ketahanan kulit, sillage, value, repurchase intent, pros/cons), dan integrasi Firestore rules & database. |
| **Phase 5** | Scent Finder & AI Recommendations | **SELESAI (Done)** | Kuis 7-step responsif, scoring deterministik 6 dimensi, Gemini 2.5 Flash rephrasing penjelasan kecocokan & mismatch, olfactive persona card dengan aksi salin & simpan profil. |
| **Phase 6** | Try It First Waitlist | **SELESAI (Done)** | Waitlist sampel 2ml, 5ml, 10ml, penangkapan kesediaan membayar, formula harga wajar, stub checkout ber-flag (`try_it_first_ordering`), simulasi invoice & kurir domestik. |
| **Phase 7** | Admin Backend & Moderasi | **SELESAI (Done)** | Dashboard analitik klik afiliasi 302, funnel kuis Scent Finder, antrean moderasi ulasan, CRUD katalog parfum, manajemen feature flags dinamis, ekspor CSV waitlist, dan monitoring log pemanggilan AI Gemini 2.5 Flash dengan live test trigger. |
| **Phase 8** | Hardening & Peluncuran | **SELANJUTNYA (Next)** | Uji aksesibilitas WCAG 2.1 AA, unit & integration test, kepatuhan UU PDP, halaman hukum final. |

---

## Rincian Checklist Per-Fase

### Phase 0: Plan & Architecture Alignment — [SELESAI]
- [x] Tinjauan mendalam PRD v1.0 dan konteks pasar parfum Indonesia.
- [x] Klarifikasi 4 pertanyaan keputusan utama (desain Editorial Cream, stack React+Vite+Express, DB, auth email-first).
- [x] Penulisan Implementation Plan (`implementation_plan.md`) dan konfirmasi persetujuan.
- [x] Sinkronisasi `metadata.json`, `index.html`, font Cormorant Garamond + Plus Jakarta Sans, dan design tokens di `src/index.css`.
- [x] Dokumentasi sistem lengkap: `/docs/ARCHITECTURE.md`, `/docs/DATA_MODEL.md`, `/docs/DECISIONS.md`, dan `/docs/BACKLOG.md`.
- [x] Pembuatan 3 prototipe statis HTML mandiri di `/prototypes/a`, `/prototypes/b`, dan `/prototypes/c`.
- [x] Pembuatan Interactive Prototype Hub di `src/App.tsx`.
- [x] Inisialisasi Git dan commit pertama (`fbfb5c1`).

### Phase 1: Foundations & Core Engine — [SELESAI]
- [x] Database & Persistence: Firebase provisioned (`ai-studio-applet-webapp-3fe18`), `firebase-blueprint.json` dibuat, dan `firestore.rules` berhasil dideploy via `DeployRules` RPC.
- [x] Backend Express Server (`server.ts`): Routing API, allowlist domain aman untuk Shopee dan Tokopedia, endpoint redirect 302 `/go/:id`, dan proxy rephrase Gemini AI.
- [x] Modul Perhitungan Single Source of Truth (`src/lib/derivedCalculations.ts`): Menghitung persentase sisa volume, peringatan botol menipis (<=20%), dan pemisahan semantik Wears vs Scent Stories (XC-01, BR-01, BR-02, BR-05).
- [x] Unit Testing Suite (`src/lib/derivedCalculations.test.ts`): 3/3 test suite lulus 100% tanpa kegagalan.
- [x] Sistem Translasi i18n Bilingual (`src/lib/i18n.ts`): Kamus lengkap Bahasa Indonesia (gaya santun-akrab *kamu*) dan English dengan format mata uang IDR dan tanggal.
- [x] Seed Data 42 Parfum Kurasi (`src/data/seedPerfumes.ts`): Menampilkan parfum lokal Indonesia (HMNS, Oullu, Carl & Claire, Alien Objects, Kahf, SAFF & Co, Formless) dan desainer/niche internasional (Le Labo, Diptyque, Margiela, Aesop, dll.) dengan label eksplisit `Data contoh / Sample data`.
- [x] Autentikasi & Otorisasi (`src/context/AuthContext.tsx`): Alur login email, sign up dengan verifikasi umur 18+ (UU PDP), adapter OTP WhatsApp dev console, mode demo tamu, dan role admin/user.
- [x] UI Shell Terpadu (`src/App.tsx`): Menghubungkan seluruh fondasi dengan top bar contract, rotasi semprot 1-tap, dan modal waitlist Try It First.

### Phase 2: Catalog, Product Detail, Compare & Affiliate Redirect — [SELESAI]
- [x] Halaman daftar katalog dengan filter multi-facet (Keluarga aroma, Brand, Asal: ID/INT, Konsentrasi, Rentang Harga) dan pengurutan (CAT-01, CAT-02, CAT-03, CAT-04).
- [x] Tab kategori horizontal keluarga aroma ala Aesop (Semua, Fresh, Floral, Woody, Ambery, Gourmand, Aromatic) dengan jumlah item.
- [x] Halaman Detail Parfum (`/perfumes/:slug`) dengan piramida notes (top, heart, base klik untuk filter), panduan pemakaian iklim tropis Indonesia, nilai harga per ml, dan blok "Ulasan Pemakai Nyata vs Klaim Brand" (CAT-05, CAT-06, CAT-10).
- [x] Rekomendasi parfum serupa dalam keluarga olfaktif yang sama pada halaman detail.
- [x] Compare tray mengambang persisten (1–3 item) dengan indikator slot, tombol hapus, dan aksi komparasi langsung (CMP-01, CMP-02).
- [x] Layar komparasi matriks responsif dengan sticky parameter header, deteksi shared notes (bintang hijau), perbandingan harga & nilai per ml, toggle mode sorot perbedaan, serta modal Quick Add untuk menambah parfum tanpa meninggalkan halaman (CMP-03, CMP-04, CMP-05).
- [x] Integrasi penuh logging klik dan analisis rute `/go/:id` dengan domain allowlist aman (Shopee & Tokopedia), 302 redirect, serta tabel log analitik klik real-time di Admin Backoffice (AFF-01, AFF-02, AFF-03, AFF-04, AFF-05).

### Phase 3: Personal Library & Scent DNA — [SELESAI]
- [x] UI Lemari 4 rak terpadu (Sedang Dipakai dengan bar sisa % & badge botol menipis <=20%, Wishlist, Favorit, Kenangan).
- [x] Tambah parfum dari katalog (pencarian instan) dan form tambah parfum privat dengan deteksi duplikat ("Did you mean...?").
- [x] Modal edit botol (volume sisa, status segel/buka, status favorit) dan aksi hapus botol dengan toast undo 8 detik.
- [x] Dashboard analitik Scent DNA: radar/bar distribusi keluarga olfaktif, top notes dominan, dan kesesuaian iklim tropis Indonesia.
- [x] Unit test komputasi Scent DNA (`computeScentDna`) dan Single Source of Truth tervalidasi 100% lulus.

### Phase 4: Scent Diary & Reviews — [SELESAI]
- [x] Log pemakaian 1-tap terintegrasi ke database dengan pengurangan mL otomatis & toast undo 8 detik.
- [x] Pembuat Cerita Aroma (Scent Story) dengan autosave draft di localStorage, tag suasana/acara/cuaca, dan timeline memori.
- [x] Form ulasan multi-kriteria (rating bintang, ketahanan nyata kulit, sillage, value for money, niat beli ulang, pros/cons) dan status moderasi.
- [x] Unit test komputasi statistik diary (`computeDiaryStats`) & agregasi ulasan (`computeReviewSummary`) 100% lulus.

### Phase 5: Scent Finder & AI Recommendations
- [x] Kuis Scent Finder 7 pertanyaan berprogres (1 layar per pertanyaan di mobile) dengan autosave dan opsi "Tidak yakin".
- [x] Mesin scoring deterministik 6 dimensi dengan kalibrasi skor (FIND-05).
- [x] Integrasi Gemini 2.5 Flash server-side untuk menuliskan penjelasan kecocokan alami dan "Kemungkinan kurang cocok".

### Phase 6: Try It First Waitlist
- [x] Form daftar tunggu sampel format 2ml, 5ml, 10ml dengan estimasi harga wajar.
- [x] Stub alur checkout bertanda feature flag (`try_it_first_ordering`).

### Phase 7: Admin Panel & Moderasi — [SELESAI]
- [x] Dashboard analitik klik afiliasi 302 (`/go/:id`), log stream, funnel kuis Scent Finder 7 pertanyaan, dan demand sampel decant.
- [x] CRUD manajemen katalog parfum (Tambah, Edit, Hapus, Filter instan).
- [x] Antrean moderasi ulasan komunitas (Status pending, approved, flagged/rejected).
- [x] Pengaturan feature flags dinamis (`try_it_first_ordering`, `affiliate_buttons`, `ai_gemini_rephrase`, `community_reviews`).
- [x] Pemantauan Log AI Gemini 2.5 Flash (`/api/admin/ai-logs`) dengan visualisasi latensi, bukti input, hasil parafrase, fallback status, dan tombol uji pemanggilan live.
- [x] Ekspor data waitlist ke format CSV untuk agregasi batch botol decant.

### Phase 8: Hardening & Kepatuhan
- [ ] Audit aksesibilitas WCAG 2.1 AA dan pengujian keyboard/screen reader.
- [ ] Unit test scoring & invariant; integration test untuk auth dan redirect afiliasi.
- [ ] Kepatuhan UU PDP, ekspor data, alur penghapusan akun, dan dokumen legal lengkap.
