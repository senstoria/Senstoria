# Runbook — Migrasi Katalog Seed → Firestore `/perfumes` (Admin v1 P1)

- Status: **belum dijalankan ke Firestore live.** Semua perintah `--live` di bawah ini adalah langkah founder.
- Keputusan dasar: Q1 diputuskan founder 28 Nov 2026 21:54 WIB — katalog pindah ke Firestore `/perfumes`; file seed jadi sumber migrasi satu kali, bukan lagi sumber kebenaran. Publish jadi tombol di admin.
- Kode terkait: `src/lib/catalog.ts` (data layer), `src/App.tsx` (pemuatan + transisi), `src/components/AdminDashboardView.tsx` (tab katalog + publish), `scripts/migrate-seed-to-firestore.mjs` (skrip ini).

## 0. Yang harus dipahami dulu — rancangan transisi pra-migrasi

Sebelum migrasi, `/perfumes` masih kosong. Aplikasi TIDAK langsung menampilkan katalog kosong; ia memakai strategi transisi yang jujur (lihat header `src/lib/catalog.ts`):

1. Saat muat, aplikasi membandingkan isi `/perfumes` dengan seed (36 id).
2. Bila **semua** id seed sudah ada di Firestore → migrasi dianggap selesai, seed **tidak dipakai sama sekali** (sumber `firestore`).
3. Bila `/perfumes` kosong atau belum lengkap → aplikasi **menggabungkan** seed + dokumen Firestore (dokumen Firestore menang per id) dan menandai sumbernya **`seed-pre-migration`**. Penanda ini tampil di tab katalog admin sebagai banner + jumlah baris yang sudah termigrasi (`N/36`). Katalog publik tetap berfungsi, tapi tidak ada yang bisa mengira datanya berasal dari Firestore.
4. Setelah migrasi terverifikasi (§5), jalur seed **dimatikan** dengan mengubah `SEED_FALLBACK_ENABLED` menjadi `false` di `src/lib/catalog.ts` (lewat PR). Setelah itu `/perfumes` kosong berarti katalog kosong + keadaan error yang jujur.

**Peringatan:** JANGAN membuat/mengedit parfum di admin sebelum migrasi selesai — atau jalankan migrasi lagi setelahnya. Tulis admin ke Firestore yang belum lengkap akan membuat hitungan "migrasi belum lengkap" bertambah, dan baris seed yang sudah ditulis admin akan dilewati migrasi (idempotent). Itu aman, tapi membingungkan bila tidak disadari.

## 1. Prasyarat

- [ ] Kode P1 sudah di-merge dan ter-deploy (atau sedang diuji di preview): data layer, tab katalog baru, dan skrip migrasi.
- [ ] Founder login sebagai admin (custom claim `admin: true` sudah terpasang — lihat `scripts/set-admin-claim.mjs`).
- [ ] Rules `/perfumes` sudah ter-publish (founder-only): baca publik hanya `data_status == 'published'`, tulis hanya admin. Verifikasi di `firestore.rules:60` — sudah ada di main `01fda81`, TAPI pastikan rules yang ter-publish di Firebase Console sama dengan yang di repo (track P0 / founder yang mem-publish).
- [ ] Kunci service account Firebase (Project Settings → Service accounts → Generate new private key) ada di komputer founder. **Tidak pernah dikirim lewat chat/repo.**
- [ ] `firebase-admin` terinstal sekali di repo ini (`npm install firebase-admin`) — hanya dibutuhkan untuk mode `--live`.
- [ ] Backup: ekspor koleksi yang ada dulu bila `/perfumes` sudah berisi dokumen (lihat `scripts/firestore-backup.mjs` / Firebase Console → Import/Export).

## 2. Perintah

Dari root repo, branch kerja yang berisi kode P1:

```bash
# 0. DRY-RUN — default, TIDAK MENULIS APA PUN, tidak butuh kredensial.
#    Selalu jalankan ini dulu dan baca rencananya.
npx tsx scripts/migrate-seed-to-firestore.mjs

# 1. LIVE — menulis 36 dokumen ke /perfumes.
npx tsx scripts/migrate-seed-to-firestore.mjs --live \
  --service-account /path/ke/service-account.json

#    Tanpa --service-account, skrip memakai GOOGLE_APPLICATION_CREDENTIALS.
#    Ke emulator (tanpa kredensial live):
npx tsx scripts/migrate-seed-to-firestore.mjs --live \
  --emulator-host 127.0.0.1:8080 --project demo-senstoria

# 2. Ulangi dengan aman (idempotent): dokumen yang sudah ada dilewati.
npx tsx scripts/migrate-seed-to-firestore.mjs --live \
  --service-account /path/ke/service-account.json

# 3. Timpa ulang dokumen yang sudah ada (HANYA bila seed berubah setelah migrasi):
npx tsx scripts/migrate-seed-to-firestore.mjs --live --force \
  --service-account /path/ke/service-account.json

# 4. Migrasi satu baris saja (mis. perbaikan satu seed):
npx tsx scripts/migrate-seed-to-firestore.mjs --live --only prf_023 \
  --service-account /path/ke/service-account.json
```

## 3. Apa yang ditulis

- Satu dokumen per baris seed, id dokumen = id seed (`prf_001` … `prf_036`).
- `data_status` dipertahankan: **14 published + 22 draft** (tidak ada `review` di seed saat ini).
- `verified_by` dipertahankan (12 baris internasional: `'Ja'far Assegaff'`).
- Foto: `photo_url` = `image_url` seed, `photo_verified` = true hanya bila seed punya `image_url` + `image_checked_date`.
- Field yang TIDAK ditulis ulang oleh migrasi: `perfume_offers` (B-5 ditahan — tidak disentuh), koleksi lain, dan dokumen `/perfumes` yang id-nya bukan id seed (tidak dihapus, tidak diubah).

## 4. Cara verifikasi

Lakukan semua, berurutan, sebelum menyatakan migrasi selesai:

1. **Hitungan Firestore vs seed.** Skrip `--live` mencetak hitungan akhir. Harus sama:
   - `/perfumes`: total **36** (published **14**, draft **22**, review 0, deleted 0).
   - Bila ada selisih, JANGAN lanjut — lihat §6.
2. **Cek 3 dokumen contoh di Firebase Console → Firestore → perfumes:**
   - `prf_001` (HMNS Orgasm): `data_status` = `draft`.
   - `prf_013` (HMNS The Perfection): `data_status` = `published`, `verified_by` = `Ja'far Assegaff`.
   - `prf_023` (HMNS Essence of the Sun): `data_status` = `draft`.
   - Ketiganya harus punya `slug`, `name`, `brand`, `concentration`, dan notes.
3. **Cek tab katalog admin** (login sebagai admin → Admin → Katalog):
   - Banner sumber harus berubah menjadi **"Sumber katalog: Firestore /perfumes (live)"** — bukan lagi `seed-pre-migration`.
   - Tabel menampilkan 36 baris; filter status `published` = 14, `draft` = 22.
4. **Cek katalog publik** (tanpa login, atau sebagai pengguna biasa):
   - Katalog menampilkan **14** parfum published; tidak ada satupun dari 22 draft yang muncul.
   - Buka satu Detail published dan satu hasil Finder — datanya sama dengan sebelum migrasi (nama, notes, harga).
5. **Uji tulis admin sekali (opsional tapi dianjurkan):** edit satu draft (mis. tambah secondary family), simpan, reload — perubahan tetap ada. Terbitkan satu draft yang sudah lengkap (notes + family + sumber resmi terisi), lalu periksa tampil di katalog publik; tarik lagi (Unpublish) dan periksa hilang dari publik.

## 5. Setelah migrasi terverifikasi — matikan jalur seed

1. Di `src/lib/catalog.ts`, ubah `SEED_FALLBACK_ENABLED` dari `true` menjadi `false`, lewat PR seperti biasa (tambah tes tidak diperlukan — perilaku fallback sudah tercakup tes transisi di `catalogFirestore.test.ts`).
2. Deploy. Verifikasi ulang §4 langkah 3–4: banner admin tetap `firestore`, katalog publik tetap 14.
3. Setelah langkah ini, `seedPerfumes.ts` resmi hanya arsip migrasi. Perubahan katalog selanjutnya HANYA lewat tombol admin (atau migrasi ulang dengan `--force` untuk satu baris, §2 langkah 4).
4. Jangan hapus `seedPerfumes.ts` dari repo — ia tetap dipakai tes (`catalogFirestore.test.ts` mengunci baseline 36 baris) dan sebagai referensi rollback.

## 6. Rollback

Bila migrasi salah (mis. seed yang salah termigrasi, atau founder memutuskan kembali ke seed):

```bash
# Menghapus HANYA dokumen yang id-nya ada di seed (36 id). Butuh --confirm eksplisit.
npx tsx scripts/migrate-seed-to-firestore.mjs --live --rollback --confirm \
  --service-account /path/ke/service-account.json
```

- Setelah rollback, aplikasi kembali ke sumber `seed-pre-migration` (banner admin memberi tahu) — katalog publik tetap tampil dari seed, tidak kosong.
- Rollback TIDAK mengembalikan edit admin yang dibuat SETELAH migrasi (edit itu menimpa dokumen hasil migrasi; rollback menghapus dokumennya termasuk edit tersebut). Bila ada edit penting pasca-migrasi, catat dulu sebelum rollback.
- Bila yang salah hanya satu baris, lebih aman perbaiki baris itu lewat admin (edit) atau `--only <id> --force` daripada rollback penuh.

## 7. Masalah yang mungkin muncul

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| Skrip `--live` gagal: `firebase-admin belum terinstal` | Paket belum diinstal | `npm install firebase-admin` sekali, ulangi |
| Skrip `--live` gagal: kredensial | Service account salah / env belum di-set | Periksa path `--service-account` / `GOOGLE_APPLICATION_CREDENTIALS` |
| Hitungan total > 36 | Ada dokumen `/perfumes` di luar seed (mis. dibuat admin pra-migrasi) | Itu normal — bandingkan per id seed; dokumen non-seed tidak dihapus migrasi |
| Hitungan total < 36 | Migrasi terpotong / sebagian id dilewati | Jalankan ulang tanpa `--force` (idempotent, hanya mengisi yang kurang) |
| Banner admin tetap `seed-pre-migration` setelah migrasi | Ada id seed yang belum ada di Firestore (lihat hitungan) | Jalankan ulang migrasi; periksa id yang hilang di output skrip |
| Katalog publik kosong setelah migrasi | Rules belum ter-publish / `data_status` salah | Periksa rules di Console; periksa 3 dokumen contoh (§4.2) |
| Toast "berhasil" muncul tapi data tidak berubah | Tulis admin gagal di server (rules/claim) | Periksa console browser + claim admin; toast sukses HANYA muncul setelah server konfirmasi — bila muncul tanpa perubahan, itu bug, laporkan dengan pesan errornya |
