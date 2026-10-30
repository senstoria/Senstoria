# Senstoria Runbook — Backup, Rollback, Re-seed, Monitoring

> **Status (Sprint 7, 30 Oktober 2026).** Dokumen ini adalah prosedur
> operasional, bukan klaim bahwa semuanya sudah berjalan. Yang SUDAH
> teruji di Sprint 7: backup/restore lewat emulator (simulasi, lihat §2.3
> dan §3.3). Yang MASIH langkah founder (belum dieksekusi): upgrade
> Blaze, deploy Functions, publish rules, dan jadwal backup live (§2.2,
> §6). Jangan mengklaim jadwal backup live aktif sebelum founder
> menyelesaikan §6 dan ada bukti ekspor pertama di Cloud Storage.

## 1. Gambaran sistem

| Lapisan | Lokasi | Rollback |
|---|---|---|
| SPA (Vercel) | Proyek `senstoria`, domain `senstoria-ten.vercel.app` | Redeploy deployment sebelumnya (§3.1) |
| Firestore rules | Firebase Console → Firestore → Rules (proyek `senstoria-app`) | Tempel ulang versi sebelumnya dari GitHub (§3.2) |
| Cloud Functions | `asia-southeast2`: `go`, `waitlist`, `waitlistConfirm`, `waitlistResend` | Deploy ulang dari commit sebelumnya (§3.1) |
| Data Firestore | Proyek `senstoria-app`, lokasi `asia-southeast2` | Import backup (§3.3) |

Sumber kebenaran kode: repo GitHub `senstoria/Senstoria`, branch `main`.
Jangan pernah mengedit rules, Function, atau data langsung di Console
tanpa mencatatnya di repo/commit berikutnya — Console drift adalah
penyebab kesenjangan deployment Sprint 2–4.

## 2. Backup Firestore terjadwal

### 2.1 Prinsip

- Cadangkan SEMUA koleksi: `users`, `bottles`, `wear_logs`,
  `scent_stories`, `reviews`, `perfumes`, `waitlist_entries`,
  `affiliate_clicks`, plus subkoleksi `wishlist/{uid}/items` dan
  `compare/{uid}/items`.
- Frekuensi yang disarankan: **harian, 03:00 WIB** (di luar jam sibuk),
  retensi **30 hari** di bucket khusus (bukan bucket aplikasi).
- Backup berisi data pribadi pengguna: bucket HARUS private, tanpa akses
  publik, dan enkripsi default Google Cloud sudah cukup — jangan pernah
  mengunduh backup ke laptop lalu membagikannya.
- Uji restore minimal **sebulan sekali** ke emulator (§3.3), bukan ke
  produksi.

### 2.2 Mengaktifkan jadwal (langkah founder, Console + CLI)

1. Upgrade proyek Firebase ke paket **Blaze** (Firebase Console →
   pojok kiri bawah → Upgrade). Tanpa Blaze, ekspor terjadwal tidak
   bisa memakai Cloud Scheduler.
2. Buat bucket khusus (sekali saja):
   `gcloud storage buckets create gs://senstoria-app-backups --location=asia-southeast2 --uniform-bucket-level-access`
3. Buat jadwal ekspor harian (Cloud Scheduler memanggil ekspor):
   `gcloud scheduler jobs create http senstoria-firestore-backup-daily --schedule="0 3 * * *" --time-zone="Asia/Jakarta" --uri="https://firestore.googleapis.com/v1/projects/senstoria-app/databases/(default):export" --http-method=POST --oauth-service-account-email=<SERVICE_ACCOUNT_EMAIL> --message-body='{"outputUriPrefix":"gs://senstoria-app-backups/daily"}'`
   Ganti `<SERVICE_ACCOUNT_EMAIL>` dengan service account proyek yang
   punya peran `roles/datastore.importExportAdmin`. (Service account
   dibuat di IAM & Admin → Service Accounts; jangan memakai key pribadi
   founder.)
4. Verifikasi: keesokan harinya, buka Cloud Storage →
   `senstoria-app-backups/daily` — harus ada folder bertanggal baru.
   Bila tidak ada, cek Cloud Scheduler → job → Logs.
5. Alternatif tanpa Scheduler (manual, tetap sah): kapan pun, jalankan
   `gcloud firestore export gs://senstoria-app-backups/manual-YYYY-MM-DD --project=senstoria-app`
   dan catat tanggalnya di log operasional.

### 2.3 Backup/restore emulator (teruji Sprint 7, skrip repo)

Skrip ini HANYA untuk emulator — skrip menolak `--live` dengan sengaja:

```bash
# Backup dari emulator yang sedang jalan (port 8080):
node scripts/firestore-backup.mjs --emulator-host 127.0.0.1:8080 \
  --project demo-sprint7 --out backups/senstoria-2026-10-30.json
# Restore ke emulator kosong (simulasi):
node scripts/firestore-restore.mjs --emulator-host 127.0.0.1:8080 \
  --project demo-sprint7-restore --in backups/senstoria-2026-10-30.json
```

Hasil simulasi Sprint 7 dicatat di laporan gate Sprint 7 (jumlah dokumen
sebelum/sesudah, dan perbandingan isi). Bila angka tidak sama persis,
JANGAN lanjut ke langkah live — laporkan sebagai defect.

## 3. Rollback

### 3.1 Rollback deploy (SPA + Functions)

- **SPA (Vercel):** Vercel Dashboard → proyek `senstoria` →
  Deployments → pilih deployment terakhir yang sehat → ⋯ →
  **Redeploy**. Jangan "Promote" deployment preview yang belum
  di-smoke-test.
- **Functions:** dari clone repo yang bersih, checkout commit yang
  sehat, lalu:
  `firebase use senstoria-app`
  `firebase deploy --only functions:go,functions:waitlist,functions:waitlistConfirm,functions:waitlistResend`
  (Nama function `waitlistResend` hanya ada sejak Sprint 7; untuk
  rollback ke commit pra-Sprint 7, hilangkan namanya dari daftar.)
- Setelah rollback apa pun: smoke-test 6 rute (Home, Katalog, Detail,
  Finder, Legal, Admin-gate) sebelum mengumumkan selesai.

### 3.2 Rollback rules

1. GitHub → repo `senstoria/Senstoria` → branch `main` (atau commit
   sehat) → buka `firestore.rules` → **Raw** → salin seluruh isi.
2. Firebase Console → Firestore → tab **Rules** → tempel verbatim →
   **Publish**.
3. JANGAN tekan "Develop and Test" — tombol itu tidak mem-publish.
4. Verifikasi: buat akun uji baru dan simpan satu botol — bila gagal
   dengan `permission-denied`, rules yang ter-publish bukan versi repo.

### 3.3 Rollback data

1. Ambil backup terbaru SEBELUM insiden (jangan backup yang dibuat
   setelah data rusak).
2. `gcloud firestore import gs://senstoria-app-backups/daily/<FOLDER_TANGGAL> --project=senstoria-app`
3. Import menimpa dokumen dengan id yang sama; dokumen yang dibuat
   setelah backup TIDAK terhapus otomatis — bila insiden melibatkan
   dokumen baru yang korup, hapus dokumen itu manual lewat Console
   setelah import.
4. Beri tahu pengguna yang terdampak lewat email DPO bila data mereka
   berubah (UU PDP: transparansi insiden).

## 4. Re-seed katalog yang aman

1. Sumber seed HANYA file kanonik di repo (`Senstoria_Seed_Kanonik_*`)
   dan situs resmi brand — tidak pernah dari API parfum (lisensi §3.3
   Fragella melarang penyimpanan massal; Scento melarang wholesale
   copying).
2. Hanya baris dengan `status=published` dan `verified_by` terisi yang
   boleh masuk produksi. Baris draft TIDAK tampil di katalog, Finder,
   maupun waitlist (Function menolak `perfume_not_available`).
3. Setelah seed: hitung katalog di Admin (harus sama dengan jumlah
   baris published), buka satu Product Detail, jalankan satu Finder —
   ketiganya harus konsisten (satu sistem angka, Sprint 3).
4. Jangan pernah mengisi field kosong dengan tebakan — field kosong
   tetap kosong dan dirender sebagai "belum tercatat".

## 5. Monitoring error (tanpa PII, tanpa secret)

- Tidak ada Sentry/Bugsnag/Analytics pihak ketiga yang ter-wire.
  Satu-satunya jalur laporan error adalah `src/lib/errorReport.ts`:
  `reportError(context, err)` — email disamarkan menjadi
  `[redacted-email]`, parameter rahasia di URL menjadi `[redacted]`,
  token panjang menjadi `[redacted-token]`. Kode error Firebase
  (mis. `permission-denied`) dipertahankan karena aman dan berguna.
- `handleFirestoreError` di `src/lib/firebase.ts` TIDAK lagi menyertakan
  alamat email pengguna (Sprint 7) — hanya uid, jenis operasi, dan path.
- Yang dipantau manual tiap minggu (founder, 10 menit):
  - Vercel → Deployments: ada deployment FAILED?
  - Firebase Console → Functions → Logs: ada error `permission-denied`
    berulang (tanda rules salah) atau `rate_limited` melonjak (tanda
    abuse)?
  - Admin → Analitik: klik afiliasi tercatat (angka nyata, bukan 128
    lama)?
- Bila menambahkan layanan monitoring baru di masa depan: layanan itu
  HARUS di-disclose di Privacy §5 SEBELUM diaktifkan, dan payload-nya
  harus lewat sanitizer yang sama. Menambahkan tracker diam-diam
  melanggar janji Privacy dan UU PDP.

## 6. Checklist deploy founder yang masih tertunda (Sprint 2–4 + 7)

1. Publish `firestore.rules` dari `main` ke Console (PALING MENDESAK —
   signup baru saat ini ditolak di langkah setDoc).
2. Upgrade Blaze.
3. `firebase deploy --only functions:go,firestore:rules,firestore:indexes`
   lalu deploy `functions:waitlist,functions:waitlistConfirm,functions:waitlistResend`.
4. Set env Vercel: `VITE_GO_BASE_URL` (URL Function `go` ter-deploy)
   dan `VITE_FUNCTIONS_BASE_URL` (basis Functions waitlist).
5. Set env Functions: `WAITLIST_SMTP_HOST/PORT/USER/PASS/FROM` dan
   `WAITLIST_CONFIRM_URL`.
6. Aktifkan jadwal backup (§2.2) dan verifikasi ekspor pertama.
7. Daftar afiliasi Tokopedia + Shopee; isi `perfume_offers` per
   parfum/platform.
8. Setelah 1–7: uji signup akun baru end-to-end di produksi (founder).

## 7. Kontak

- DPO: `dpo@senstoria.id` (maksimal 3×24 jam kerja untuk permintaan data).
- Repo: `https://github.com/senstoria/Senstoria`.
- Dokumen ini diperbarui tiap sprint yang mengubah operasional; versi
  ini: Sprint 7, 30 Oktober 2026.
