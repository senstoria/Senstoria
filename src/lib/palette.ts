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
 * Nike Fase 1 (26 Nov 2026, adopsi penuh arah Nike, keputusan founder
 * 15:46 WIB; font Archivo — OFL, keputusan founder 16:01 WIB):
 * monokrom hitam-putih-abu-abu, latar putih #FFFFFF, ink hitam
 * #000000, muted gray-600 #767676 (4,54:1 di atas putih — lulus AA,
 * margin tipis; JANGAN pakai muted di atas gray-100: 4,17:1, gagal).
 * DEVIASI kontras yang dicatat (diterima founder): success teks
 * #32862B 4,58:1 (bukan Nike 500 #2AA147 3,34:1 — gagal AA);
 * warning teks #D94601 hanya teks besar/bold (4,35:1; #FC5100
 * 3,32:1 hanya ikon/badge besar); gray-500 #8C8C8C 3,36:1 DILARANG
 * untuk teks biasa. Token accent biru #2D46C2 DIHAPUS di Nike Fase 3
 * (26 Nov 2026) bersama seluruh pemakaian class latar aksen.
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
  /** Skala abu-abu Nike. gray-400/500 hanya dekoratif / teks besar. */
  gray100: '#F5F5F5',
  gray200: '#EAEAEA',
  gray300: '#CDCDCD',
  gray400: '#BABABA',
  gray500: '#8C8C8C',
  gray600: '#767676',
  /** Teks sekunder/muted — lulus AA 4,54:1 di atas ground putih. */
  secondary: '#767676',
  muted: '#767676',
  /** Teks di atas latar gelap (putih murni, 21:1 di atas hitam). */
  onDark: '#FFFFFF',
  /** Satu warna border (Nike gray-200). */
  border: '#EAEAEA',
  hairline: '#EAEAEA',
  /** Ring fokus hitam. */
  focus: '#000000',
  /** Status (deviasi kontras yang dicatat — lihat komentar di atas). */
  success: '#32862B',
  /** Nike success 500 — ikon/status besar saja, bukan teks biasa. */
  successBright: '#2AA147',
  /** Nike warning 600 — teks besar/bold saja (4,35:1). */
  warning: '#D94601',
  /** Nike warning 500 — ikon/badge besar saja, bukan teks biasa. */
  warningBright: '#FC5100',
  error: '#CA462A',
  /** Tab bar (tetap mengambang — pengecualian founder): pill putih;
      bar putih. */
  tab: '#FFFFFF',
  tabBar: '#FFFFFF',
} as const;
