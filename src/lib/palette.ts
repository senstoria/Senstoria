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
 * DUA WARNA SAJA (27 Nov 2026, perintah founder 13:14 WIB:
 * "ubah senstoria menjadi 2 warna #ffffff dan #000000").
 * Semua token — abu-abu Nike, secondary/muted, border/hairline,
 * success/warning/error — dipetakan ke #FFFFFF atau #000000.
 * Nama token dipertahankan supaya pemakai tidak berubah. Token
 * accent biru sudah DIHAPUS di Nike Fase 3 (26 Nov 2026).
 * Tint data Luma (mist/tan/sand/sage/stone/warm) DIHAPUS di fase ini — inventarisasi 26 Nov 2026
 * membuktikan nol pemakai PALETTE.* di seluruh src/.
 */
export const PALETTE = {
  /** Latar putih (ground = paper). */
  ground: '#FFFFFF',
  paper: '#FFFFFF',
  surface: '#FFFFFF',
  app: '#FFFFFF',
  /** Satu material kartu (putih, sudut 0, tanpa border/bayangan). */
  card: '#FFFFFF',
  ink: '#000000',
  bar: '#000000',
  /** Tombol pill hitam + teks di atasnya. */
  pill: '#000000',
  pillText: '#FFFFFF',
  /** Skala abu-abu Nike DIHAPUS (27 Nov 2026, dua warna saja):
      gray-100 putih, sisanya hitam. Nama dipertahankan. */
  gray100: '#FFFFFF',
  gray200: '#000000',
  gray300: '#000000',
  gray400: '#000000',
  gray500: '#000000',
  gray600: '#000000',
  /** Teks sekunder/muted — kini hitam penuh (21:1 di atas putih). */
  secondary: '#000000',
  muted: '#000000',
  /** Teks di atas latar gelap (putih murni, 21:1 di atas hitam). */
  onDark: '#FFFFFF',
  /** Satu warna border: hitam (dulu gray-200). */
  border: '#000000',
  hairline: '#000000',
  /** Ring fokus hitam. */
  focus: '#000000',
  /** Status DIHAPUS (27 Nov 2026, dua warna saja): success,
      warning, error semuanya hitam — makna hanya dari teks/ikon. */
  success: '#000000',
  /** Dulu Nike success 500 — kini hitam (dua warna saja). */
  successBright: '#000000',
  /** Dulu Nike warning 600 — kini hitam (dua warna saja). */
  warning: '#000000',
  /** Dulu Nike warning 500 — kini hitam (dua warna saja). */
  warningBright: '#000000',
  error: '#000000',
  /** Tab bar (tetap mengambang — pengecualian founder): pill putih;
      bar putih. */
  tab: '#FFFFFF',
  tabBar: '#FFFFFF',
} as const;
