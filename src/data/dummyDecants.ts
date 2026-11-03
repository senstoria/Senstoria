/**
 * DUMMY decant preview data — Try It First redesign, founder 3 Nov 2026
 * 09:05 WIB: "bikin decant product card dummy untuk saat ini".
 *
 * HONESTY LINES (do not weaken):
 * - These are NOT real stock, prices, or offers. They exist only so the
 *   new Try It First card / search / status-filter UI can be previewed.
 * - They are NOT read from Firestore, NOT taken from the published seed
 *   catalog as offers, and NEVER mixed into any real aggregate, count,
 *   valuation, or waitlist entry. Each card only resolves its base
 *   perfume (brand/name/photo fallback/notes) from PUBLISHED_PERFUMES
 *   for display; the decant itself (size + status) is dummy-only.
 * - REAL decant data is still Waitlist / Coming Soon under the founder
 *   gate of 2 Nov 2026 (all real decants Waitlist/Coming Soon; Stage 2
 *   follow-ups deliberately skipped 2 Nov 2026 12:05 WIB; Q13 decant
 *   prices undecided). This file changes NO real status.
 * - The "Interest" button on a dummy card opens the REAL waitlist modal
 *   (TryItFirstModal) for the base perfume, sizes 5/10 ml, no price —
 *   that flow already exists. "Buy" and "Pre-Order" on dummy cards must
 *   NEVER complete a purchase, create an order, or open a checkout:
 *   TryItFirstView shows an honest dummy-preview notice instead.
 */
export type DummyDecantStatus = 'inStock' | 'upcoming' | 'waitlist';

export interface DummyDecant {
  /** Dummy-only id; never a perfume id, never a Firestore id. */
  id: string;
  /** Published perfume this dummy card is based on (display + waitlist modal). */
  basePerfumeId: 'prf_013' | 'prf_014';
  /** Decant size in ml (founder decant sizes are 5 ml & 10 ml only). */
  sizeMl: 5 | 10;
  /** Dummy preview status — drives the card button, nothing else. */
  status: DummyDecantStatus;
}

export const DUMMY_DECANTS: DummyDecant[] = [
  // HMNS The Perfection, 5 ml — dummy In-Stock → "Buy" (notice only).
  { id: 'dmy_dec_01', basePerfumeId: 'prf_013', sizeMl: 5, status: 'inStock' },
  // Carl & Claire Enchantée, 5 ml — dummy Upcoming → "Pre-Order" (notice only).
  { id: 'dmy_dec_02', basePerfumeId: 'prf_014', sizeMl: 5, status: 'upcoming' },
  // HMNS The Perfection, 10 ml — dummy Waitlist → "Interest" (real modal).
  { id: 'dmy_dec_03', basePerfumeId: 'prf_013', sizeMl: 10, status: 'waitlist' },
  // Carl & Claire Enchantée, 10 ml — dummy Waitlist → "Interest" (real modal).
  { id: 'dmy_dec_04', basePerfumeId: 'prf_014', sizeMl: 10, status: 'waitlist' },
];
