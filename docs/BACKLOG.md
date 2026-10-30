# Senstoria Development Backlog & Status Tracker

> **Status dokumen (28 Oktober 2026, Sprint 5).** Dokumen ini ditulis ulang
> setelah Audit Menyeluruh Tahap 1 (28 Okt 2026). Klaim "Phase 8 selesai"
> dan "100% siap produksi" pada versi sebelumnya adalah **salah** dan telah
> dihapus. Status di bawah adalah kenyataan yang terverifikasi terhadap
> repo dan deployment. Rencana yang berlaku adalah Rencana Rombak Tahap 2
> (8 sprint) yang disetujui founder 28 Okt 2026.

**Arah desain:** calm/editorial, monokrom. Palet: paper `#fffef2`, bar
`#333333`, ink `#000000`. Tipografi: Hanken Grotesk + Newsreader
(bukan Cormorant Garamond / Plus Jakarta Sans seperti klaim lama).

---

## Status per Sprint (Rencana Rombak Tahap 2)

| Sprint | Ruang lingkup | Status |
| :--- | :--- | :--- |
| **Sprint 0** | Rekonsiliasi dua codebase, porting modul derived-value dari ekspor AI Studio | **SELESAI & MERGED** (merge `2f764ab`, produksi Vercel READY) |
| **Sprint 1** | Firebase Auth asli + Rules v1 + gating UI publik | **DI GATE, BELUM MERGE** (draft PR #2; signup gagal — diagnosis ditunda founder; merge diblokir sampai signup berfungsi) |
| **Sprint 2** | Satu sumber kebenaran + `/go` Function | **TODO** |
| **Sprint 3** | Finder/katalog/kejujuran (kalibrasi, seed terverifikasi, hapus angka fiktif) | **TODO** |
| **Sprint 4** | Buang permukaan terlarang + legal + backend waitlist | **TODO** |
| **Sprint 5** | i18n penuh + token visual + kebersihan kode | **BERJALAN** (branch `sprint-5/i18n-tokens`, draft PR, belum merge) |
| **Sprint 6** | UI refresh mobile-first + desktop (D-V5, D-V7) | **TODO** (proposal visual D-V1–D-V8 disetujui) |
| **Sprint 7** | Kepercayaan & siap beta tertutup | **TODO** |

---

## Kenyataan yang terverifikasi (28 Okt 2026)

- **Katalog:** 12 parfum seed (`src/data/seedPerfumes.ts`), berlabel data contoh. Bukan 40/42.
- **Auth:** `main` = demo auth (localStorage, password diabaikan, OTP menerima kode apa pun). Auth Firebase asli hanya ada di branch Sprint 1, belum merge, dan signup-nya gagal.
- **`/go` dan `/api/*`:** Function `/go` asli ada di `functions/` sejak
  Sprint 2 (redirect + click logging + disclosure) — TETAPI belum
  di-deploy (Blaze + deploy + `VITE_GO_BASE_URL` masih langkah founder),
  jadi redirect live belum bisa pass di produksi. Klaim "128 klik, 100%
  reconciled" yang lama sudah dihapus sejak Sprint 2; Admin kini memakai
  hitungan `affiliate_clicks` nyata.
- **Scoring Finder:** mesin 6 dimensi deterministik + kalibrasi D-06
  (ceiling 96, shrinkage, derived-cap 0.85, conflict cap) diimplementasikan
  penuh di Sprint 3; satu sistem angka di semua layar.
- **Scent DNA:** profil kosong yang jujur sejak Sprint 7 (fallback fabrikasi
  40/30/20/10 dihapus — F-08 ditutup); radar di hasil Finder (Sprint 6),
  dihapus dari Library; empty state di bawah 3 parfum.
- **i18n:** kunci simetris ID/EN (Sprint 5); `html lang` mengikuti locale;
  locale kini persisten di localStorage (Sprint 7).
- **Token visual:** `@theme` di `src/index.css`; kontras §4.1 ≥ 6,07:1.
- **Test (Sprint 7):** 83 test root + 20 test functions, lulus semua.
  `tsc` bersih. Bundle: chunk utama 962 kB / gzip 279 kB — target mentah
  <1.000 kB TERCAPAI setelah CatalogView di-lazy-load (Sprint 7).
- **Dokumen lama yang salah** (telah dihapus dari dokumen ini): PostgreSQL/Drizzle, server Express berjalan, 42 parfum, Gemini 2.5 Flash, WhatsApp OTP, Open-Meteo, "100% siap produksi", font Cormorant/Plus Jakarta Sans, rute URL `/catalog` dll. (aplikasi memakai navigasi view-state, bukan router).
- **File yang dihapus dari repo di Sprint 5** (arsip di luar repo): `prototypes/` (3 prototipe HTML statis), `.aistudio/` (implementation plan AI Studio).

## Keputusan founder yang masih terbuka

- D-01 codebase kanonik (GitHub kanonik + porting ZIP — default yang dijalankan Sprint 0; AI Studio beku).
- D-02 proyek Firebase baru milik Senstoria (`senstoria-app`) — selesai dibuat founder; konfigurasi hanya via env var Vercel.
- Q8 entitas hukum & Q30 cost ceiling — ditunda founder (17:49 WIB 28 Okt 2026).
- Radar/D-V1: radar tetap di Library, dihapus, atau dipindah ke hasil Finder.
- W-1: wishlist 2 + compare 2 tampil default di preview Sprint 1 — diduga state localStorage profil bersama; butuh uji profil bersih.
