/**
 * PALETTE — nilai token warna sebagai konstanta JS.
 *
 * Dipakai HANYA di konteks yang tidak bisa memakai class Tailwind:
 * atribut SVG inline (Bottle.tsx) dan props Recharts (AdminDashboardView,
 * ScentDnaRadarChart). Di semua tempat lain, pakai class token
 * (bg-paper, text-secondary, …) dari @theme di src/index.css.
 *
 * Nilai di sini HARUS sama dengan @theme di src/index.css. Jangan tambah
 * nilai baru di sini — palet data final adalah keputusan Sprint 6.
 */
export const PALETTE = {
  /** Arah C (30 Okt 2026, PR Home-only): near-neutral terang. */
  paper: '#ffffff',
  surface: '#f4f4f4',
  /** Satu material kartu (baru, arah C); dipakai Home di PR ini. */
  card: '#ffffff',
  ink: '#000000',
  bar: '#333333',
  /** Teks sekunder (D-V3). Nilai lama #5c5c5c diganti #595959. */
  secondary: '#595959',
  /** Teks di atas latar gelap; juga nilai hairline. */
  onDark: '#d9d7c9',
  /** Hanya border non-teks; jangan dipakai sebagai warna teks. */
  border: '#8a8a8a',
  /** Arah C: netral, decoupled dari onDark. */
  hairline: '#e5e5e5',
  accent: '#8A4B14',
  success: '#1e6b3a',
  warning: '#9a3412',
  error: '#b3261e',
  /** Tint data (nilai lama, dipertahankan). */
  mist: '#EAE8D9',
  tan: '#C28B58',
  sand: '#E6C687',
  sage: '#5A6B5C',
  stone: '#E5E3D3',
  warm: '#A89F91',
} as const;
