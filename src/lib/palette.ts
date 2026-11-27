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
 * WARNA CERAH, FASE C1 (27 Nov 2026, keputusan founder 18:08–18:09 WIB:
 * adopsi arah cerah, dosis A hero imersif, serif Fraunces untuk
 * headline display, mark "G" kembali berwarna). Membalikkan perintah
 * dua warna 27 Nov 13:14 WIB (PR #79) — ground krem, field pastel,
 * warna semantik kembali, tint keluarga §4.4 proposal. Kontras:
 * ink hitam 19,27:1 di atas ground krem; teks semantik 7,09–8,72:1
 * di atas putih (6,51–8,01:1 di atas krem) — semuanya lolos AA.
 * Tint pendamping semantik (`*-bright`) memakai field pastel §4
 * se-hue-nya karena §4.3 tidak memberi hex untuk tint (lihat
 * index.css). Token aksen biru tetap DIHAPUS (Nike Fase 3).
 * Tint keluarga di FAMILY_DISPLAY_ID (src/lib/scentNotesDict.ts)
 * TIDAK diubah di fase ini — record itu saat ini tidak dipakai
 * komponen mana pun, dan §4.4 hanya memberi 5 tint untuk 15 kunci
 * keluarga (pemetaan per kunci diputuskan saat tint dipakai di C2).
 */
export const PALETTE = {
  /** Ground krem (menggantikan putih murni). */
  ground: '#F7F5F0',
  paper: '#F7F5F0',
  /** Surface / card netral tetap putih (untuk kartu teks). */
  surface: '#FFFFFF',
  app: '#F7F5F0',
  /** Satu material kartu (putih, sudut 0, tanpa border/bayangan). */
  card: '#FFFFFF',
  ink: '#000000',
  bar: '#000000',
  /** Tombol pill hitam + teks di atasnya. */
  pill: '#000000',
  pillText: '#FFFFFF',
  /** Skala abu-abu Nike (Fase C1: TIDAK dipulihkan — proposal §4
      tidak mendefinisikan abu-abu): gray-100 putih = permukaan
      netral, sisanya hitam = ink. Nama dipertahankan. */
  gray100: '#FFFFFF',
  gray200: '#000000',
  gray300: '#000000',
  gray400: '#000000',
  gray500: '#000000',
  gray600: '#000000',
  /** Teks sekunder/muted — tetap hitam penuh (19,27:1 di atas krem). */
  secondary: '#000000',
  muted: '#000000',
  /** Teks di atas latar gelap (putih murni, 21:1 di atas hitam). */
  onDark: '#FFFFFF',
  /** Satu warna border: hitam. */
  border: '#000000',
  hairline: '#000000',
  /** Ring fokus hitam. */
  focus: '#000000',
  /** Status KEMBALI (Fase C1, proposal §4.3): teks semantik gelap,
      selalu ditemani kata + ikon. `*-bright` = tint field pendamping
      (latar; teks hitam 16,75–17,83:1 di atasnya). */
  success: '#166534',
  /** Tint hijau pendamping success = Sage (§4.4). */
  successBright: '#E4EBE0',
  /** Teks warning gelap. */
  warning: '#92400E',
  /** Tint amber pendamping warning = Peach (§4.1). */
  warningBright: '#F8EADF',
  error: '#991B1B',
  /** Tint merah pendamping error = Blush (§4.4). */
  errorBright: '#F6E3E0',
  /** Teks info gelap (baru di C1 — §4.3). */
  info: '#1E40AF',
  /** Tint biru pendamping info = biru lembut (§4.1). */
  infoBright: '#DCE6FB',
  /** Field pastel (§4.1) — wilayah warna yang disengaja. */
  fieldPeriwinkle: '#E9ECF5',
  fieldBlue: '#DCE6FB',
  fieldLavender: '#E9E4F8',
  fieldPeach: '#F8EADF',
  fieldCream: '#F6EFEA',
  /** Tint keluarga aroma (§4.4) — field dengan teks hitam (~17:1). */
  familyMist: '#E2EBF2',
  familySage: '#E4EBE0',
  familySand: '#F0E8D8',
  familyBlush: '#F6E3E0',
  familyLavender: '#E9E4F8',
  /** Tab bar (tetap mengambang — pengecualian founder): pill putih;
      bar putih. */
  tab: '#FFFFFF',
  tabBar: '#FFFFFF',
} as const;
