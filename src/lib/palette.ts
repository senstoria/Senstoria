/**
 * PALETTE — nilai token warna sebagai konstanta JS.
 *
 * Dipakai HANYA di konteks yang tidak bisa memakai class Tailwind:
 * atribut SVG inline (Bottle.tsx) dan props Recharts (AdminDashboardView,
 * ScentDnaRadarChart). Di semua tempat lain, pakai class token
 * (bg-paper, text-secondary, …) dari @theme di src/index.css.
 *
 * Nilai di sini HARUS sama dengan @theme di src/index.css.
 *
 * FONDASI TOKEN NIKE, FASE N1 (27 Nov 2026, keputusan gerbang N0
 * 19:46–19:51 WIB: T1 ground putih Nike, Y1 Display 52px, Y2 Fraunces +
 * Archivo, S6 hati hitam, Y5 satu suara Fraunces, J-12/P8 harga hanya
 * di Detail). Rencana `Senstoria_Rombak_Total_UI_UX_Rencana_2026-11-27.md`
 * §5.5 + §7 Fase N1; nilai v2 dari `work/rombak-total/nike/
 * NIKE_INVENTORY.md` §3.1 (frame Colors `52:18616` + Typography
 * `2:9073`, studi penuh 26 Nov 2026). Nilai v1 rencana adopsi 26 Nov
 * (#2AA147/#FC5100/#CA462A, gray #EAEAEA/#CDCDCD/#BABABA/#8C8C8C/
 * #767676) TERBUKTI SALAH di studi — jangan dipakai.
 *
 * Keputusan struktur T2 (deviasi dari penamaan token clone):
 * token semantik dasar (`success`/`warning`/`error`) menyimpan nilai
 * TEKS GELAP deviasi clone (#067647/#B54708/#B42318, lulus AA),
 * BUKAN nilai 500 — karena ~15 pemakaian `text-*` di komponen dan
 * 2 tombol `bg-*` berteks putih (AdminDashboardView, LegalModal)
 * akan menjadi 2,35–3,76:1 bila memakai 500. Nilai 500 tersedia
 * sebagai `*-500` (hanya ikon/isian/label besar/status — tidak
 * pernah sebagai teks). Bila fase komponen nanti mengalihkan semua
 * teks ke `*-text`, token dasar boleh dipindah ke 500; keputusan
 * itu milik fase komponen, bukan N1.
 *
 * Ground putih #FFFFFF (T1 — revert ground krem C1 #F7F5F0).
 * Field = gray-100 #F5F5F5 (T4); token field pastel C1 DIHAPUS
 * (0 pemakaian di JSX). Token `*-bright` C1 DIHAPUS (0 pemakaian
 * di JSX; nilainya adalah field pastel yang dihapus) — digantikan
 * skala 100/800 Nike yang terdokumentasi (hanya Success 100/800
 * yang tercatat di inventaris; tint Warning/Error 100 TIDAK
 * tercatat — jangan dikarang, tunggu verifikasi duplikat Figma).
 * Info #1E40AF dipertahankan (teks gelap C1, 8,72:1 — Nike tidak
 * punya semantik info). Aksen biru TIDAK ditambahkan (T8: rencana
 * mengusulkan #0B57D0 untuk "hari ini / tindakan / tautan" tapi
 * statusnya masih menunggu keputusan founder; "Hari Ini" adalah
 * Fase N2). Token `wishlist` #000000 adalah warna hati wishlist
 * terisi (S6) — Catalog/Library sudah hitam (fill-bar); Detail
 * (ProductDetailView:289/292/366, via text-error + fill-current)
 * beralih ke token ini di Fase N4 (perubahan komponen, di luar
 * lingkup N1); sampai saat itu hati Detail me-render merah gelap
 * #B42318 (bukan lagi #991B1B).
 * Tint keluarga DIPERTAHANKAN (T5) dengan pemetaan 15 kunci →
 * 5 tint berdasarkan suhu/rumpun warna (lihat komentar di bawah) —
 * tint adalah field pucat (~17:1), bukan kartu warna pekat seperti
 * arah Taman yang ditolak founder 19:01 WIB.
 *
 * FASE F1 — ARAH G "ETALASE PREMIUM" (28 Nov 2026, founder memilih
 * arah G 16:19 WIB, perintah "Mulai F1 — Token" 16:35 WIB;
 * spesifikasi `Senstoria_Spesifikasi_Arah_G_Etalase_Premium_2026-11-28.md`
 * §1 + §10 poin 1): ink #000000 → #070404 (nyaris hitam Sneaker,
 * 20,42:1 di atas putih); bar + pill ikut #070404 (satu near-black
 * untuk teks, tombol utama, dan tab bar — peran ink di spesifikasi
 * G §1); muted #525252 → #767676 (teks sekunder G, 4,54:1 di atas
 * putih — lulus AA, menggantikan #B4B4B3); token baru `photo`
 * #E4E4E4 (latar foto produk/hero/banner — nilai sama dengan
 * gray200, nama semantik untuk F2/F3), `warm` #574645 (sekunder
 * hangat, 8,87:1 di atas putih), `brick` #AF5349 (aksen bata —
 * aksen KECIL saja, bukan tombol utama; putih di atasnya 5,05:1),
 * `stone` #B4B4B3 (token NON-TEKS saja — watermark dekoratif,
 * divider, state nonaktif; 2,08:1 di atas putih GAGAL AA dan TIDAK
 * PERNAH dipakai sebagai teks di atas putih; di atas hitam 9,84:1).
 * Keterbatasan yang dikunci tes: muted #767676 di atas gray-100
 * #F5F5F5 hanya 4,17:1 (di bawah AA) — teks muted TIDAK BOLEH
 * diletakkan di atas gray-100. Skala abu-abu Nike (gray100–800),
 * secondary #6B6B6B, semantik, dan tint keluarga TIDAK berubah.
 */
export const PALETTE = {
  /** Ground putih Nike (T1 — revert krem C1). */
  ground: '#FFFFFF',
  paper: '#FFFFFF',
  /** Surface / card netral tetap putih (untuk kartu teks). */
  surface: '#FFFFFF',
  app: '#FFFFFF',
  /** Satu material kartu (putih, sudut 0, tanpa border/bayangan). */
  card: '#FFFFFF',
  /** Ink G = nyaris hitam #070404 (F1 — dulu #000000; 20,42:1 di atas
      putih). Peran: teks utama, judul, harga, tombol utama, tab bar,
      kotak ukuran terpilih (spesifikasi G §1). */
  ink: '#070404',
  /** Bar hitam = ink G (F1 — dulu #000000): tab bar + tombol utama
      memakai peran ink yang sama; satu near-black, bukan dua. */
  bar: '#070404',
  /** Tombol pill hitam + teks di atasnya (F1: #070404, sama dengan ink). */
  pill: '#070404',
  pillText: '#FFFFFF',
  /** Skala abu-abu Nike v2 (T3): 100 #F5F5F5, 200 #E4E4E4,
      300 #D2D2D2, 400 #A3A3A3, 500 #6B6B6B (teks sekunder,
      5,33:1 di atas putih — lulus AA), 600 #525252 (teks muted,
      7,81:1 — lulus AA), 700 #3F3F3F, 800 #262626. */
  gray100: '#F5F5F5',
  gray200: '#E4E4E4',
  gray300: '#D2D2D2',
  gray400: '#A3A3A3',
  gray500: '#6B6B6B',
  gray600: '#525252',
  gray700: '#3F3F3F',
  gray800: '#262626',
  /** Teks sekunder = gray-500 (5,33:1 di atas putih). */
  secondary: '#6B6B6B',
  /** Teks muted G = #767676 (F1 — dulu gray-600 #525252, 7,81:1).
      Teks sekunder arah G, 4,54:1 di atas putih (lulus AA, menggantikan
      #B4B4B3 yang 2,08:1). KETERBATASAN: di atas gray-100 #F5F5F5
      hanya 4,17:1 (di bawah AA) — teks muted TIDAK BOLEH diletakkan
      di atas gray-100 (dikunci tes HARD-05e). */
  muted: '#767676',
  /** Latar foto produk / hero Detail / banner (F1, spesifikasi G §1).
      Nilai sama dengan gray200 #E4E4E4 — nama semantik untuk F2/F3
      (ink di atasnya 16,06:1). */
  photo: '#E4E4E4',
  /** Sekunder hangat (F1, spesifikasi G §1): teks sekunder alternatif
      + nuansa sekunder, 8,87:1 di atas putih (6,98:1 di atas foto). */
  warm: '#574645',
  /** Aksen bata (F1, spesifikasi G §1): aksen KECIL saja — badge kecil,
      swatch produk — BUKAN tombol utama. Putih di atasnya 5,05:1. */
  brick: '#AF5349',
  /** Stone #B4B4B3 (F1, spesifikasi G §1): token NON-TEKS saja —
      watermark dekoratif, divider, state nonaktif. 2,08:1 di atas
      putih GAGAL AA — TIDAK PERNAH sebagai teks di atas putih
      (dikunci tes G1-02); di atas hitam 9,84:1. */
  stone: '#B4B4B3',
  /** Teks di atas latar gelap (putih murni, 21:1 di atas hitam). */
  onDark: '#FFFFFF',
  /** Satu warna border: hitam (tidak diubah di N1 — border abu-abu
      Nike adalah keputusan per layar di fase berikutnya). */
  border: '#000000',
  hairline: '#000000',
  /** Ring fokus hitam. */
  focus: '#000000',
  /** Status Nike v2 (T2). Token dasar = TEKS GELAP deviasi clone
      (lulus AA sebagai teks DAN sebagai latar tombol berteks putih);
      `*-500` = nilai Figma 500 (GAGAL AA sebagai teks: success
      2,62:1, warning 2,35:1, error 3,76:1 — hanya ikon/isian/
      label besar/status). `*-text` adalah alias eksplisit dari
      token dasar (kosakata clone) untuk pemakaian teks di fase
      komponen. */
  success: '#067647',
  /** Nilai Figma 500 — JANGAN PERNAH sebagai warna teks. */
  success500: '#12B76A',
  /** Tint sukses 100 (latar; teks hitam 18,45:1 di atasnya). */
  success100: '#D1FADF',
  /** Hijau sukses gelap 800. */
  success800: '#054F31',
  /** Alias teks sukses (sama dengan `success`). */
  successText: '#067647',
  /** Teks warning gelap. */
  warning: '#B54708',
  /** Nilai Figma 500 — JANGAN PERNAH sebagai warna teks. */
  warning500: '#F79009',
  /** Alias teks warning (sama dengan `warning`). */
  warningText: '#B54708',
  /** Teks error gelap (juga dipakai tombol hapus berteks putih:
      putih di atasnya 6,57:1). */
  error: '#B42318',
  /** Nilai Figma 500 — JANGAN PERNAH sebagai warna teks. */
  error500: '#F04438',
  /** Alias teks error (sama dengan `error`). */
  errorText: '#B42318',
  /** Teks info gelap (C1 — Nike tidak punya semantik info;
      8,72:1 di atas putih). */
  info: '#1E40AF',
  /** Tint keluarga aroma — field pucat dengan teks hitam (~17:1).
      Pemetaan 15 kunci FAMILY_DISPLAY_ID → 5 tint (berdasarkan
      suhu/rumpun warna; didokumentasikan, bukan ditebak diam-diam):
      Mist (dingin/air): aquatic, fresh. Sage (herbal/hijau):
      green, aromatic. Sand (hangat/tanah/manis): woody, amber,
      oriental, gourmand, leather, spicy, citrus. Blush (merah
      muda/buah): floral, fruity. Lavender (lembut/bubuk): musky,
      powdery. */
  familyMist: '#E2EBF2',
  familySage: '#E4EBE0',
  familySand: '#F0E8D8',
  familyBlush: '#F6E3E0',
  familyLavender: '#E9E4F8',
  /** Hati wishlist terisi = HITAM (S6, keputusan N0). Dipakai
      Catalog/Library (sudah, via fill-bar) dan Detail (Fase N4). */
  wishlist: '#000000',
  /** Tab bar (tetap mengambang — pengecualian founder): pill putih;
      bar putih. */
  tab: '#FFFFFF',
  tabBar: '#FFFFFF',
} as const;
