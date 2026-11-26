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
 * Tahap 4 (26 Nov 2026, arah visual Luma): ground krem hangat, ink
 * coklat-hitam, muted hangat, aksen biru #2D46C2, pill hitam.
 * Success #2C6E31 adalah koreksi dari #3A8C4F (daftar Luma) karena
 * #3A8C4F hanya 4,10:1 di atas surface / 3,58:1 di atas ground —
 * di bawah AA 4,5:1 untuk teks biasa; #2C6E31 lulus 6,11:1 / 5,34:1.
 */
export const PALETTE = {
  /** Luma: latar krem hangat (ground = paper). */
  ground: '#F4EDE3',
  paper: '#F4EDE3',
  surface: '#FFFDF8',
  surfaceAlt: '#F6F1E9',
  app: '#EDE6D6',
  /** Satu material kartu. */
  card: '#FFFDF8',
  ink: '#1E1B18',
  bar: '#000000',
  /** Tombol pill hitam + teks di atasnya. */
  pill: '#000000',
  pillText: '#FFFFFF',
  accentText: '#FFFFFF',
  /** Teks sekunder/muted — lulus AA 6,13:1 di atas ground. */
  secondary: '#5E574D',
  muted: '#5E574D',
  /** Teks di atas latar gelap. */
  onDark: '#d9d7c9',
  /** Satu warna border (Luma). */
  border: '#E8E0D4',
  hairline: '#E8E0D4',
  /** Aksen biru: satu peran (aksi tambah + kartu colour-field + focus). */
  accent: '#2D46C2',
  focus: '#2D46C2',
  success: '#2C6E31',
  warning: '#9a3412',
  error: '#B42318',
  /** Tab bar Luma: pill putih; bar memakai paper (krem) agar pill
      putih tetap terbaca — lihat catatan di @theme. */
  tab: '#FFFFFF',
  tabBar: '#FFFFFF',
  /** Tint data (nilai lama, dipertahankan). */
  mist: '#EAE8D9',
  tan: '#C28B58',
  sand: '#E6C687',
  sage: '#5A6B5C',
  stone: '#E5E3D3',
  warm: '#A89F91',
} as const;
