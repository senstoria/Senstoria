# Skema unggah foto produk katalog + pengisian detail (pekerjaan 9/32)

Status: DRAFT PR, belum di-merge, belum di-deploy. Skema ini dirancang
untuk katalog Senstoria; bagian yang butuh aktivasi backend ditandai
jelas dan TIDAK diklaim sudah jalan.

## 1. Prinsip foto (mengikat)

- Kartu Catalog dan hero Product Detail menampilkan foto REAL hanya bila
  `image_url` kanonik terverifikasi tersedia.
- Bila `image_url` kosong, UI memakai ilustrasi `Bottle` sebagai fallback
  yang jujur — ilustrasi itu TIDAK PERNAH disajikan sebagai foto real.
- Foto tidak boleh ditebak, diambil dari thumbnail marketplace, atau dari
  hasil pencarian gambar tanpa verifikasi sumber.
- Foto produk katalog TIDAK SAMA dengan `cover_image_data_url` manual
  (pekerjaan 6/32): yang manual hanya tersimpan di localStorage perangkat
  pengguna dan tidak pernah diunggah ke server.

## 2. Field data (sudah ada di kode branch ini)

Di `src/data/seedPerfumes.ts`, tipe `SeedPerfume` mendapat:

| Field | Isi | Wajib |
|---|---|---|
| `image_url` | URL https foto produk (official brand / brand-supplied) | Bila foto diklaim real |
| `image_source` | URL sumber foto (mis. halaman produk resmi brand) | Bila `image_url` diisi |
| `image_checked_date` | Tanggal ISO verifikasi foto + sumber | Bila `image_url` diisi |

Render: `CatalogView.tsx` (kartu) dan `ProductDetailView.tsx` (hero)
memakai `<img>` bila `image_url` ada, dan `Bottle` bila tidak ada.

## 3. Status foto katalog terbit saat branch ini dibuat

- HMNS The Perfection (`prf_013`, published): TIDAK punya foto real —
  `image_url` kosong, kartu + detail memakai ilustrasi fallback.
- Carl & Claire Enchantée (`prf_014`, published): TIDAK punya foto real —
  `image_url` kosong, kartu + detail memakai ilustrasi fallback.
- Tidak ada URL foto yang dikarang untuk keduanya. Foto real baru ada
  bila kurator mengisi ketiga field di atas dari sumber resmi brand dan
  melewati review PR.

## 4. Alur unggah / pengisian (yang bisa dilakukan sekarang)

1. Kurator memperoleh foto dari sumber resmi brand (halaman produk
   resmi, atau file yang dikirim brand) dan mencatat `image_source`.
2. Kurator mengisi `image_url`, `image_source`, `image_checked_date`
   pada baris seed parfum itu, bersamaan dengan seluruh detail lain
   (lihat §5), dalam satu PR.
3. Reviewer PR memeriksa: foto memang produk itu (bukan varian lain),
   sumbernya resmi, URL-nya https dan masih hidup, dan tidak ada klaim
   yang ditebak.
4. Setelah merge, foto tampil di kartu dan detail. Bila URL mati,
   `image_url` dikosongkan kembali (fallback ilustrasi) sampai foto
   pengganti terverifikasi — jangan biarkan gambar rusak tampil.

## 5. Checklist pengisian semua detail lainnya (per parfum)

Setiap baris katalog harus diisi dari sumber resmi brand, dan field yang
tidak dinyatakan brand dibiarkan kosong (bukan ditebak):

- Identitas: `name`, `brand`, `slug`, `concentration`.
- Asal brand: `origin` + `brand_country` (hanya bila terverifikasi).
- Keluarga: `primary_family`, `secondary_family` (bila dinyatakan brand).
- Notes: `top_notes`, `heart_notes`, `base_notes`.
- Gender: `gender_label`; tahun rilis: `release_year` (bila diketahui).
- Occasion: `occasion_tags` (hanya tag yang dinyatakan brand).
- Performa: `longevity_expected_band`, `projection_expected`,
  `heat_suitability` (bila dinyatakan brand), `brand_claims` (bila ada).
- Deskripsi: `description_id`, `description_en`.
- Harga: `reference_price_idr`, `reference_price_size_ml`,
  `price_is_sample` (true = data contoh, wajib dilabeli),
  `price_checked_date` (hanya untuk harga resmi terverifikasi).
- Sumber + gate: `source_official_url`, `source_checked_date`,
  `data_status` (`published` hanya setelah gate Sprint 3).
- Foto: `image_url`, `image_source`, `image_checked_date` (§2–§4).

## 6. Yang MASIH butuh aktivasi backend (bukan bagian PR ini)

Repo ini TIDAK punya jalur upload server: `firebase.ts` hanya membawa
nilai konfigurasi `storageBucket`, tidak ada `getStorage`/`uploadBytes`
di mana pun, dan foto manual pun hanya localStorage. Maka "unggah file"
ke server BELUM bisa dilakukan dari aplikasi sampai founder memutuskan
dan mengaktifkan:

1. Firebase Storage di console (bucket + rules: tulis hanya admin/
   kurator, baca publik untuk foto katalog).
2. Endpoint/UI admin untuk mengunggah file, memvalidasi (format JPEG/
   PNG/WebP, ukuran maks, rasio), dan menulis `image_url` hasil upload
   ke record kanonik.
3. Aturan moderasi: foto yang diunggah pengguna umum TIDAK langsung
   menjadi foto katalog — hanya foto kurator/admin yang lolos review.

Sampai ketiga hal itu ada, satu-satunya jalur foto katalog yang jalan
adalah §4 (referensi URL terverifikasi lewat seed + review PR).
Keputusan yang masih butuh founder: (a) aktifkan Storage sekarang atau
tunda sampai katalog lebih besar; (b) apakah foto boleh di-host di CDN
Senstoria sendiri atau cukup referensi URL resmi brand; (c) siapa yang
menjadi kurator/admin pengunggah.

## 7. Konflik yang dilaporkan, bukan diputuskan di PR ini

Tombol compare per kartu: PR #28 sudah membuat tombol itu HANYA muncul
saat mode Product Comparison aktif. Spesifikasi item 9 ditulis sebelum
PR #28 di-merge. PR ini MEMPERTAHANKAN perilaku PR #28 (tombol compare
tetap ada, hanya saat mode aktif) dan TIDAK menghapus mekanisme mode
compare. Founder perlu memutuskan: hapus tombol compare sepenuhnya
(sehingga mode compare menjadi tanpa guna) atau pertahankan saat mode
aktif. Keputusan itu di luar PR ini.
