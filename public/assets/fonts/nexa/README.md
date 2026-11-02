# Nexa Pro webfonts — LICENSE GATE — DO NOT MERGE WITHOUT THESE FILES

**Status: DRAFT PR Tahap 6 — JANGAN di-merge sampai file-file di bawah ini
ditempatkan di direktori ini DAN diverifikasi.**

## Yang harus ditempatkan di sini (dari paket Web Fontfabric berlisensi)

Wajib (dirujuk langsung oleh `@font-face` di `src/index.css`):

- `nexa-regular.woff2` + `nexa-regular.woff` — Nexa Regular, berat 400
- `nexa-regular-italic.woff2` + `nexa-regular-italic.woff` — Nexa Regular Italic, berat 400
- `nexa-book.woff2` + `nexa-book.woff` — Nexa Book, dipakai untuk berat 500
- `nexa-bold.woff2` + `nexa-bold.woff` — Nexa Bold, dipakai untuk berat 600 DAN 700
  (600 tidak punya file berbeda; satu file Bold dipakai untuk kedua berat)

Bila paket lisensi juga menyediakan italic Book/Bold dan kutipan tebal-italic
membutuhkannya, tambahkan file-file itu DAN deklarasi `@font-face`-nya
bersamaan — jangan menambahkan file tanpa deklarasi, atau sebaliknya.

## Yang TIDAK BOLEH ditempatkan di sini

- File OTF desktop, file trial/demo, atau file dari situs unduhan gratis
  (termasuk paket Befonts "Personal Use Only" dan Nexa lama tanpa lisensi
  yang sempat diunggah founder pada 2 Nov 2026). File-file itu BUKAN
  bukti lisensi Web dan TIDAK BOLEH dipakai di situs komersial Senstoria.
- File hasil konversi OTF trial menjadi woff/woff2 — konversi tidak
  mengubah lisensi menjadi sah.

## Verifikasi sebelum merge (wajib dicatat di PR)

1. Nama keluarga di metadata file = `Nexa Pro` (bila paket menamai
   keluarga berbeda, ubah nama di `@font-face` dan token `--font-*`
   di `src/index.css` secara bersamaan).
2. `usWeightClass` Book benar-benar 500 — bila ternyata 400, pemetaan
   500 → Book di bodi PR dan `@font-face` harus direvisi sebelum merge.
3. Domain di dokumen lisensi mencakup domain produksi Senstoria.
4. Jenis lisensi (Annual vs Perpetual) dan tier pageview dicatat di PR.
5. Sampai file-file ini ada, situs memakai fallback sans — preview draft
   ini membuktikan layout/token/warna/grid, BUKAN rendering Nexa asli.
