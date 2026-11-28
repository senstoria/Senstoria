# Admin Break-Glass — Memulihkan Akses Admin Senstoria

- Berlaku untuk: Admin v1 (satu admin — founder; custom claim `admin: true`).
- Spek: `Senstoria_Spek_Admin_v1_2026-11-28.md` §2, §4; review A9.
- Script: `scripts/set-admin-claim.mjs` (hanya founder, dari komputer founder).

## ⚠️ Aturan kunci — baca dulu

- **File kunci service account Firebase HANYA ada di komputer founder.**
  Tidak pernah di-commit ke repo, tidak pernah dikirim lewat chat/email,
  tidak pernah diunggah ke layanan apa pun. Siapa pun yang memegang file
  itu bisa menjadi admin — perlakukan seperti kata sandi utama.
- Tidak ada admin kedua diam-diam. Menambah admin adalah keputusan
  founder; prosedurnya sama (jalankan script untuk UID lain), bukan
  lewat UI atau lewat field profil (`role`/`isAdmin` di dokumen user
  BUKAN sumber otorisasi — rules hanya membaca custom claim).
- Publish Firestore Rules tetap founder-only (lihat § "Publish rules").

## Kapan prosedur ini dipakai

1. **Claim hilang** — konsol admin tidak muncul / tulis admin ditolak
   (`permission-denied`) padahal sebelumnya bisa. Penyebab umum: claim
   ditimpa (mis. ada yang menjalankan `setCustomUserClaims` tanpa
   `admin: true`), atau login memakai akun yang salah.
2. **Akun terkunci** — lupa kata sandi, atau akun dinonaktifkan.
3. **Perangkat hilang** — laptop/HP founder hilang atau dipakai orang lain:
   cabut sesi dulu, baru pulihkan akses dari perangkat baru.

## 0. Periksa dulu (jangan langsung set claim)

| Gejala | Periksa |
|---|---|
| Konsol admin hilang | Pastikan login dengan akun founder yang benar (cek email di Profil). Claim hanya berlaku setelah token ID baru — keluar lalu masuk lagi, atau paksa refresh token. |
| Tulis admin ditolak | Buka Firebase Console → Firestore → Rules: pastikan rules P0 (termasuk `admin_actions`) sudah ter-publish. Rules yang belum ter-publish = tulis ditolak walau claim ada. |
| Claim dicabut orang lain | Hanya pemegang kunci service account yang bisa mengubah claim. Bila ini terjadi, kunci sudah bocor — ikuti "Kunci bocor / hilang" di bawah. |

## 1. Memasang kembali claim admin (claim hilang)

Prasyarat: akun sudah terdaftar lewat UI sign-up Senstoria dan email
sudah terverifikasi (script MENOLAK akun yang belum verifikasi), plus
file kunci service account di komputer founder.

```bash
# Dari repo Senstoria (komputer founder saja):
node scripts/set-admin-claim.mjs <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>
```

- `USER_UID`: Firebase Console → Authentication → Users → klik akun
  founder → salin User UID.
- `PATH_TO_SERVICE_ACCOUNT_JSON`: path lokal file kunci, mis.
  `~/Senstoria-Admin/service-account.json`. Jangan mengetik isi file
  ke mana pun.
- Output sukses: `OK: admin claim set for <uid> (<email>) at <waktu>`.
  Catat UID + waktu di gate log.

Setelah itu founder **wajib keluar lalu masuk lagi** (claim baru hanya
masuk ke token ID yang baru diterbitkan). Verifikasi: konsol admin
muncul, dan satu tulis admin berhasil (mis. setujui satu review
pending — harus tercatat di `admin_actions`).

## 2. Mencabut claim admin (uji negatif / darurat)

```bash
node -e "import('firebase-admin/app').then(async ({initializeApp, cert}) => {
  const {getAuth} = await import('firebase-admin/auth');
  const {readFileSync} = await import('node:fs');
  initializeApp({credential: cert(JSON.parse(readFileSync(process.argv[2], 'utf8')))});
  await getAuth().setCustomUserClaims(process.argv[1], {admin: false});
  console.log('OK: admin claim dicabut untuk', process.argv[1]);
})" <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>
```

Jalankan dengan `firebase-admin` terinstal (`npm install firebase-admin`
sekali, di direktori yang sama). Setelah pencabutan, pengguna harus
keluar/masuk lagi; lalu uji negatif: tulis admin apa pun (mis. ubah
status review) HARUS gagal `permission-denied`, dan baca
`admin_actions` HARUS gagal. Bila masih berhasil, token lama belum
kedaluwarsa (maks. 1 jam) — tunggu dan uji lagi.

## 3. Akun terkunci (lupa kata sandi / akun dinonaktifkan)

1. Firebase Console → Authentication → Users → cari akun founder.
2. Bila lupa kata sandi: pakai "Lupa kata sandi" di layar login aplikasi
   (reset lewat email), atau kirim reset dari konsol. Jangan pernah
   meminta/mencatat kata sandi baru orang lain — founder yang mengisinya.
3. Bila akun dinonaktifkan (Disabled): aktifkan lagi dari konsol
   (menu pengguna → Enable). Lalu jalankan §1 bila claim ikut hilang.
4. Bila email belum terverifikasi: kirim ulang verifikasi dari layar
   login, klik tautan di inbox, lalu jalankan §1 (script menolak akun
   yang belum verifikasi).

## 4. Perangkat hilang / dicuri

1. **Cabut semua sesi akun founder** dari komputer founder yang aman:
   Firebase Console tidak punya tombol cabut sesi per pengguna — pakai
   Admin SDK (kunci service account, `firebase-admin` terinstal):

   ```bash
   node -e "import('firebase-admin/app').then(async ({initializeApp, cert}) => {
     const {getAuth} = await import('firebase-admin/auth');
     const {readFileSync} = await import('node:fs');
     initializeApp({credential: cert(JSON.parse(readFileSync(process.argv[2], 'utf8')))});
     await getAuth().revokeRefreshTokens(process.argv[1]);
     console.log('OK: semua refresh token dicabut untuk', process.argv[1]);
   })" <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>
   ```

   Token ID yang sudah terbit tetap berlaku sampai kedaluwarsa
   (maks. 1 jam); setelah itu perangkat hilang harus login ulang dan
   tidak bisa (kata sandi diganti di §3 bila perlu).
2. Ganti kata sandi akun founder.
3. Bila perangkat hilang menyimpan file kunci service account:
   anggap kunci BOCOR — ikuti "Kunci bocor / hilang" di bawah sebelum
   memulihkan akses.
4. Pulihkan akses dari perangkat baru: login → §1 bila claim hilang →
   verifikasi konsol admin + `admin_actions`.

## 5. Kunci service account bocor / hilang

1. Firebase Console → Project Settings → Service accounts →
   buat kunci baru ("Generate new private key"), simpan di komputer
   founder saja.
2. **Hapus kunci lama** dari daftar kunci di halaman yang sama
   (kunci yang bocor tetap berlaku sampai dihapus).
3. Bila kunci bocor ke publik (repo/chat): anggap claim admin sudah
   bisa dipasang siapa pun — periksa Authentication → Users apakah ada
   akun asing, cabut claim yang tidak dikenal (§2), dan periksa
   `admin_actions` untuk aksi yang tidak dikenal.

## 6. Publish rules (founder-only)

Rules baru (gerbang `user_id` + `admin_actions`) TIDAK aktif sebelum
di-publish. Hanya founder yang menjalankan ini, dari komputernya,
setelah login Firebase CLI sebagai pemilik proyek:

```bash
firebase deploy --only firestore:rules
```

Lalu verifikasi di Firebase Console → Firestore → Rules: tanggal
publikasi berubah dan isi cocok dengan `firestore.rules` di main.
Jangan publish dari mesin lain / akun lain. Uji negatif §2 setelah
publish pertama.

## 7. Yang TIDAK boleh dilakukan

- Menyimpan/mengirim file kunci lewat repo, chat, email, atau
  screenshot.
- Menambah admin kedua tanpa keputusan eksplisit founder.
- Memakai field `role`/`isAdmin` di dokumen user sebagai otorisasi.
- Mengklaim akses pulih sebelum verifikasi §1 (konsol muncul +
  tulis admin tercatat di `admin_actions`) berhasil.
