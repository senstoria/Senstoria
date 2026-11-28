/**
 * Fase N12 (gerbang S3) — Penjualan full-size: logika murni, tanpa DOM,
 * bisa diuji node:test.
 *
 * Keputusan founder yang terkunci (28 Nov 2026 15:13 WIB):
 * 1. Pembayaran Midtrans. 2. Kurir JNE + J&T, ongkir live via RajaOngkir,
 *    seluruh Indonesia. 3. Harga sudah termasuk pajak; tanpa baris PPN
 *    terpisah sampai PKP — pajak yang sudah termasuk ditampilkan sebagai
 *    informasi (11/111 dari subtotal), bukan ditambahkan. 4. Pesanan di
 *    Firestore koleksi `orders` (pembeli baca milik sendiri, admin baca
 *    semua). 5. Admin pesanan: Baru → Dibayar → Dikirim → Selesai / Batal.
 * 6. Retur hanya rusak/salah, 7 hari sejak diterima; tanpa retur berubah
 *    pikiran.
 *
 * KEJUJURAN (bukan hiasan):
 * - Midtrans & RajaOngkir BELUM punya kunci (founder belum mendaftar).
 *   Keduanya ter-gate lewat env (`VITE_MIDTRANS_CLIENT_KEY` +
 *   `VITE_MIDTRANS_TOKEN_ENDPOINT`, `VITE_SHIPPING_RATES_ENDPOINT`):
 *   tanpa kunci, checkout TIDAK membuat pesanan berbayar dan TIDAK
 *   menampilkan sukses palsu. Tanpa endpoint ongkir, ongkir TIDAK
 *   ditebak — deliveryIdr null dan total null sampai ada angka nyata.
 * - TIDAK ADA data stok di katalog — tidak ada angka stok di mana pun.
 * - TIDAK ADA kode promo demo (NIKE10 ditolak): promo divalidasi ke
 *   koleksi Firestore `promo_codes` (kosong secara default → kode apa
 *   pun "tidak ditemukan"). TIDAK ADA keypad kartu kustom (F5 ditolak):
 *   pembayaran lewat Midtrans (hosted), bukan input kartu buatan sendiri.
 * - Harga HANYA dari seed nyata (prf_013 Rp633.215/100ml, prf_014
 *   Rp279.000/30ml). Satu ukuran per parfum — ukuran jual adalah ukuran
 *   referensi seed.
 */
import type { SeedPerfume } from '../data/seedPerfumes.ts';

/* ══════════════════════ Bag (keranjang belanja) ══════════════════════ */

/** Kunci localStorage Bag (tamu boleh mengisi; checkout butuh akun). */
export const SALES_BAG_KEY = 'senstoria_bag_v1';

/** Jumlah per baris di Bag (sheet F2: 1–4, sama seperti keranjang decant). */
export const SALES_BAG_QUANTITIES = [1, 2, 3, 4] as const;

export interface SalesBagItem {
  /** Id parfum katalog (published). Satu ukuran jual = ukuran referensi. */
  perfumeId: string;
  /** Jumlah, selalu 1–4 (F2). */
  quantity: number;
}

export type SalesBag = SalesBagItem[];

function clampBagQuantity(q: unknown): number {
  const n = typeof q === 'number' && Number.isFinite(q) ? Math.floor(q) : 1;
  return Math.min(4, Math.max(1, n));
}

/**
 * Validasi Bag dari storage: baris yang parfumnya tidak dikenal atau
 * bentuknya rusak dibuang — tidak pernah menampilkan parfum karangan.
 * Duplikat digabung (jumlah dijumlah, dibatasi 4).
 */
export function parseSalesBag(raw: unknown, knownPerfumeIds: Set<string> | string[]): SalesBagItem[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(knownPerfumeIds);
  const merged = new Map<string, SalesBagItem>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const { perfumeId, quantity } = entry as Record<string, unknown>;
    if (typeof perfumeId !== 'string' || !known.has(perfumeId)) continue;
    const existing = merged.get(perfumeId);
    if (existing) {
      existing.quantity = Math.min(4, existing.quantity + clampBagQuantity(quantity));
    } else {
      merged.set(perfumeId, { perfumeId, quantity: clampBagQuantity(quantity) });
    }
  }
  return [...merged.values()];
}

/** Jumlah total unit di Bag (dipakai badge tombol Bag di header). */
export function salesBagUnitCount(items: SalesBag): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Tambah ke Bag: baris yang sama digabung (jumlah dijumlah, dibatasi 4). */
export function addToSalesBag(items: SalesBag, perfumeId: string, quantity: number): SalesBag {
  const qty = clampBagQuantity(quantity);
  const existing = items.find(item => item.perfumeId === perfumeId);
  if (existing) {
    return items.map(item =>
      item.perfumeId === perfumeId
        ? { ...item, quantity: Math.min(4, item.quantity + qty) }
        : item,
    );
  }
  return [...items, { perfumeId, quantity: qty }];
}

/** Ubah jumlah satu baris (sheet F2); jumlah selalu dijaga 1–4. */
export function setSalesBagQuantity(items: SalesBag, perfumeId: string, quantity: number): SalesBag {
  return items.map(item =>
    item.perfumeId === perfumeId ? { ...item, quantity: clampBagQuantity(quantity) } : item,
  );
}

/** Hapus satu baris dari Bag ("Hapus" di sheet F2 / × di baris). */
export function removeFromSalesBag(items: SalesBag, perfumeId: string): SalesBag {
  return items.filter(item => item.perfumeId !== perfumeId);
}

export interface SalesStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): SalesStorageLike | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    return null;
  }
  return null;
}

/** Muat Bag dari storage (tamu); rusak/tidak dikenal → []. */
export function loadSalesBag(storage: SalesStorageLike | null = defaultStorage(), knownPerfumeIds: Set<string> | string[]): SalesBag {
  if (!storage) return [];
  try {
    const raw = storage.getItem(SALES_BAG_KEY);
    if (!raw) return [];
    return parseSalesBag(JSON.parse(raw), knownPerfumeIds);
  } catch {
    return [];
  }
}

/** Simpan Bag ke storage (tamu). */
export function saveSalesBag(items: SalesBag, storage: SalesStorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(SALES_BAG_KEY, JSON.stringify(items));
  } catch {
    // Storage penuh/tidak tersedia — Bag tetap hidup di memori sesi.
  }
}

/**
 * Parfum untuk tiap baris Bag, sesuai urutan baris; baris yang parfumnya
 * tidak lagi published dibuang (tidak pernah menampilkan parfum karangan).
 */
export function resolveSalesBagPerfumes(items: SalesBag, perfumes: SeedPerfume[]): Array<{ item: SalesBagItem; perfume: SeedPerfume }> {
  const byId = new Map(perfumes.map(p => [p.id, p]));
  const out: Array<{ item: SalesBagItem; perfume: SeedPerfume }> = [];
  for (const item of items) {
    const perfume = byId.get(item.perfumeId);
    if (perfume) out.push({ item, perfume });
  }
  return out;
}

/* ══════════════════════ Kurir & pengiriman ══════════════════════ */

export const SALES_COURIERS = ['jne', 'jnt'] as const;
export type SalesCourier = (typeof SALES_COURIERS)[number];

export const SALES_DELIVERY_METHODS = ['standard', 'express'] as const;
export type SalesDeliveryMethod = (typeof SALES_DELIVERY_METHODS)[number];

/**
 * Estimasi tiba PERKIRAAN umum kurir (bukan janji): Standard 2–5 hari
 * kerja, Express 1–2 hari kerja. Angka pasti hanya datang dari
 * RajaOngkir saat live — sampai saat itu UI selalu memakai kata
 * "Perkiraan" dan tidak pernah menampilkan tanggal tiba yang pasti.
 */
export const DELIVERY_ESTIMATES: Record<SalesDeliveryMethod, { minDays: number; maxDays: number }> = {
  standard: { minDays: 2, maxDays: 5 },
  express: { minDays: 1, maxDays: 2 },
};

/** Kode pos Indonesia: tepat 5 digit angka. */
export function isValidPostalCode(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

export interface ShippingAddressInput {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

/**
 * Validasi alamat pengiriman — mengembalikan nama field yang tidak valid
 * (kosong = valid). Telepon: minimal 9 digit angka (boleh diawali +).
 */
export function validateShippingAddress(input: ShippingAddressInput): string[] {
  const invalid: string[] = [];
  if (input.recipientName.trim().length < 2) invalid.push('recipientName');
  const digits = input.phone.replace(/[^0-9]/g, '');
  if (digits.length < 9) invalid.push('phone');
  if (input.address.trim().length < 10) invalid.push('address');
  if (input.city.trim().length < 2) invalid.push('city');
  if (!isValidPostalCode(input.postalCode)) invalid.push('postalCode');
  return invalid;
}

/* ══════════════════════ Kode promo ══════════════════════ */

export interface PromoCode {
  code: string;
  discountType: 'percent' | 'fixed';
  /** Persen (1–100) bila percent; rupiah bila fixed. */
  discountValue: number;
  active: boolean;
  /** Subtotal minimum (Rp) agar promo berlaku; 0/absen = tanpa minimum. */
  minSubtotalIdr?: number;
}

/** Normalisasi kode promo: trim + huruf besar. */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Validasi satu dokumen promo_codes dari Firestore; rusak → null. */
export function parsePromoCode(raw: unknown): PromoCode | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.code !== 'string' || normalizePromoCode(p.code) === '') return null;
  if (p.discountType !== 'percent' && p.discountType !== 'fixed') return null;
  if (typeof p.discountValue !== 'number' || !Number.isFinite(p.discountValue) || p.discountValue <= 0) return null;
  if (p.discountType === 'percent' && p.discountValue > 100) return null;
  if (typeof p.active !== 'boolean') return null;
  if (p.minSubtotalIdr !== undefined && (typeof p.minSubtotalIdr !== 'number' || p.minSubtotalIdr < 0)) return null;
  return {
    code: normalizePromoCode(p.code),
    discountType: p.discountType,
    discountValue: p.discountValue,
    active: p.active,
    ...(typeof p.minSubtotalIdr === 'number' ? { minSubtotalIdr: p.minSubtotalIdr } : {}),
  };
}

/**
 * Diskon promo dari subtotal (Rp, dibulatkan ke rupiah terdekat).
 * Tidak pernah melebihi subtotal; promo nonaktif / di bawah minimum → 0.
 */
export function computePromoDiscount(subtotalIdr: number, promo: PromoCode | null): number {
  if (!promo || !promo.active) return 0;
  if (promo.minSubtotalIdr !== undefined && subtotalIdr < promo.minSubtotalIdr) return 0;
  const raw = promo.discountType === 'percent'
    ? Math.round((subtotalIdr * promo.discountValue) / 100)
    : Math.round(promo.discountValue);
  return Math.min(subtotalIdr, Math.max(0, raw));
}

/* ══════════════════════ Total & pajak ══════════════════════ */

export interface SalesTotals {
  /** Jumlah harga baris sebelum diskon. */
  subtotalIdr: number;
  /** Diskon promo (0 bila tanpa promo). */
  discountIdr: number;
  /** Subtotal setelah diskon — dasar hitung pajak termasuk. */
  discountedSubtotalIdr: number;
  /**
   * Pajak yang SUDAH termasuk dalam harga (11/111 dari subtotal setelah
   * diskon, dibulatkan). BUKAN tambahan — total tidak pernah menambah
   * pajak ini lagi. PPN 11% termasuk adalah kebijakan founder sampai PKP.
   */
  taxIncludedIdr: number;
  /** Ongkir (Rp) — null bila belum ada angka nyata dari RajaOngkir. */
  deliveryIdr: number | null;
  /** Total bayar — null bila ongkir belum diketahui (jangan ditebak). */
  totalIdr: number | null;
}

/**
 * Hitung rincian Bag/checkout. Aritmetika harus benar (F8):
 * total = (subtotal − diskon) + ongkir; pajak hanya informasi.
 */
export function computeSalesTotals(
  lines: Array<{ unitPriceIdr: number; quantity: number }>,
  deliveryIdr: number | null,
  promo: PromoCode | null = null,
): SalesTotals {
  const subtotalIdr = lines.reduce((sum, line) => sum + line.unitPriceIdr * line.quantity, 0);
  const discountIdr = computePromoDiscount(subtotalIdr, promo);
  const discountedSubtotalIdr = subtotalIdr - discountIdr;
  const taxIncludedIdr = Math.round((discountedSubtotalIdr * 11) / 111);
  const totalIdr = deliveryIdr === null ? null : discountedSubtotalIdr + deliveryIdr;
  return { subtotalIdr, discountIdr, discountedSubtotalIdr, taxIncludedIdr, deliveryIdr, totalIdr };
}

/* ══════════════════════ Nomor pesanan ══════════════════════ */

/**
 * Nomor pesanan deterministik: SNS-YYYYMMDD-XXXX, XXXX = 4 karakter
 * pertama id dokumen Firestore (huruf besar). Satu nomor yang konsisten
 * di semua layar (F8 — tiga nomor berbeda di Figma tidak diwarisi).
 * Input yang sama selalu menghasilkan nomor yang sama.
 */
export function buildOrderNumber(date: Date, docId: string): string {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = docId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase().padEnd(4, '0');
  return `SNS-${y}${m}${d}-${suffix}`;
}

export function isValidOrderNumber(value: unknown): value is string {
  return typeof value === 'string' && /^SNS-\d{8}-[A-Z0-9]{4}$/.test(value);
}

/* ══════════════════════ Pesanan & status ══════════════════════ */

export type SalesOrderStatus = 'baru' | 'dibayar' | 'dikirim' | 'selesai' | 'batal';

export const ORDER_STATUSES: SalesOrderStatus[] = ['baru', 'dibayar', 'dikirim', 'selesai', 'batal'];

/**
 * Mesin status pesanan (keputusan founder): Baru → Dibayar → Dikirim →
 * Selesai / Batal. Batal hanya dari Baru/Dibayar. Tidak ada jalan kembali
 * dari Selesai/Batal.
 */
export const ORDER_STATUS_FLOW: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  baru: ['dibayar', 'batal'],
  dibayar: ['dikirim', 'batal'],
  dikirim: ['selesai'],
  selesai: [],
  batal: [],
};

export function canTransitionOrder(from: SalesOrderStatus, to: SalesOrderStatus): boolean {
  return ORDER_STATUS_FLOW[from]?.includes(to) ?? false;
}

/** Pembeli boleh membatalkan pesanannya sendiri hanya sebelum dikirim. */
export function canBuyerCancelOrder(status: SalesOrderStatus): boolean {
  return status === 'baru' || status === 'dibayar';
}

/** Status yang boleh dipilih admin dari status saat ini. */
export function nextAdminStatuses(status: SalesOrderStatus): SalesOrderStatus[] {
  return [...(ORDER_STATUS_FLOW[status] ?? [])];
}

export interface SalesOrderItem {
  perfume_id: string;
  brand: string;
  name: string;
  size_ml: number;
  unit_price_idr: number;
  quantity: number;
  line_total_idr: number;
}

export interface SalesOrderShipping {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  courier: SalesCourier;
  method: SalesDeliveryMethod;
  estimated_days_min: number;
  estimated_days_max: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  user_id: string;
  buyer_email: string;
  items: SalesOrderItem[];
  subtotal_idr: number;
  discount_idr: number;
  promo_code: string | null;
  tax_included_idr: number;
  delivery_idr: number;
  total_idr: number;
  currency: 'IDR';
  status: SalesOrderStatus;
  payment_provider: 'midtrans';
  midtrans_transaction_id: string | null;
  tracking_number: string | null;
  shipping: SalesOrderShipping;
  billing_same_as_shipping: boolean;
  /** Alamat penagihan bila berbeda dari alamat pengiriman (F6); null bila sama. */
  billing_address: ShippingAddressInput | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

/** Data dokumen pesanan baru (tanpa id — id dibuat Firestore saat simpan). */
export type NewSalesOrderDoc = Omit<SalesOrder, 'id'>;

export interface BuildOrderDocInput {
  orderNumber: string;
  userId: string;
  buyerEmail: string;
  items: SalesOrderItem[];
  totals: SalesTotals;
  promoCode: string | null;
  shipping: SalesOrderShipping;
  billingSameAsShipping: boolean;
  billingAddress?: ShippingAddressInput | null;
  nowIso: string;
}

/**
 * Bangun dokumen pesanan dari data checkout yang sudah tervalidasi.
 * Mengembalikan null bila ongkir belum diketahui — pesanan TIDAK BOLEH
 * dibuat tanpa total akhir yang nyata (total null = jangan buat pesanan).
 */
export function buildOrderDoc(input: BuildOrderDocInput): NewSalesOrderDoc | null {
  if (input.totals.deliveryIdr === null || input.totals.totalIdr === null) return null;
  if (input.items.length === 0) return null;
  if (!isValidOrderNumber(input.orderNumber)) return null;
  return {
    order_number: input.orderNumber,
    user_id: input.userId,
    buyer_email: input.buyerEmail,
    items: input.items,
    subtotal_idr: input.totals.subtotalIdr,
    discount_idr: input.totals.discountIdr,
    promo_code: input.promoCode,
    tax_included_idr: input.totals.taxIncludedIdr,
    delivery_idr: input.totals.deliveryIdr,
    total_idr: input.totals.totalIdr,
    currency: 'IDR',
    status: 'baru',
    payment_provider: 'midtrans',
    midtrans_transaction_id: null,
    tracking_number: null,
    shipping: input.shipping,
    billing_same_as_shipping: input.billingSameAsShipping,
    billing_address: input.billingSameAsShipping ? null : (input.billingAddress ?? null),
    created_at: input.nowIso,
    updated_at: input.nowIso,
    paid_at: null,
    shipped_at: null,
    cancelled_at: null,
    cancel_reason: null,
  };
}

/**
 * Validasi satu dokumen `orders` dari Firestore; rusak/tidak lengkap →
 * null (tidak pernah menampilkan pesanan karangan).
 */
export function parseSalesOrder(raw: unknown): SalesOrder | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id === '') return null;
  if (!isValidOrderNumber(o.order_number)) return null;
  if (typeof o.user_id !== 'string' || o.user_id === '') return null;
  if (typeof o.buyer_email !== 'string' || o.buyer_email === '') return null;
  if (!Array.isArray(o.items) || o.items.length === 0) return null;
  for (const item of o.items as Record<string, unknown>[]) {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.perfume_id !== 'string' || typeof item.name !== 'string' || typeof item.brand !== 'string') return null;
    if (typeof item.size_ml !== 'number' || typeof item.unit_price_idr !== 'number' || typeof item.quantity !== 'number' || typeof item.line_total_idr !== 'number') return null;
  }
  const nums = ['subtotal_idr', 'discount_idr', 'tax_included_idr', 'delivery_idr', 'total_idr'] as const;
  for (const k of nums) {
    if (typeof o[k] !== 'number' || !Number.isFinite(o[k] as number) || (o[k] as number) < 0) return null;
  }
  if (!ORDER_STATUSES.includes(o.status as SalesOrderStatus)) return null;
  if (o.payment_provider !== 'midtrans') return null;
  if (typeof o.created_at !== 'string' || typeof o.updated_at !== 'string') return null;
  const shipping = o.shipping as Record<string, unknown> | undefined;
  if (!shipping || typeof shipping !== 'object') return null;
  if (!SALES_COURIERS.includes(shipping.courier as SalesCourier)) return null;
  if (!SALES_DELIVERY_METHODS.includes(shipping.method as SalesDeliveryMethod)) return null;
  // Alamat penagihan: null (sama dengan pengiriman) atau objek alamat lengkap.
  if (o.billing_address !== null && o.billing_address !== undefined) {
    const b = o.billing_address as Record<string, unknown>;
    if (typeof b !== 'object' || Array.isArray(b)) return null;
    for (const k of ['recipientName', 'phone', 'address', 'city', 'postalCode']) {
      if (typeof b[k] !== 'string' || (b[k] as string).trim() === '') return null;
    }
  }
  return o as unknown as SalesOrder;
}

/* ══════════════════════ Gate Midtrans & RajaOngkir ══════════════════════ */

/**
 * Midtrans terkonfigurasi hanya bila ADA client key DAN endpoint server
 * pembuat token Snap. Client key saja tidak cukup: token transaksi
 * dibuat di server (server key tidak pernah masuk ke client). Tanpa
 * keduanya, tombol pembayaran NONAKTIF — tidak ada pembayaran pura-pura.
 * Kunci dibaca dari env oleh pemanggil (bukan di-hardcode di sini).
 */
export function isMidtransConfigured(
  clientKey: string | undefined | null,
  tokenEndpoint: string | undefined | null,
): boolean {
  return Boolean(clientKey && clientKey.trim() && tokenEndpoint && tokenEndpoint.trim());
}

/**
 * Ongkir live terkonfigurasi hanya bila ADA endpoint server tarif
 * (RajaOngkir dipanggil dari server — API key tidak pernah masuk ke
 * client). Tanpa endpoint, ongkir tidak diketahui dan tidak ditebak.
 */
export function isShippingRatesConfigured(ratesEndpoint: string | undefined | null): boolean {
  return Boolean(ratesEndpoint && ratesEndpoint.trim());
}

export interface ShippingQuote {
  costIdr: number;
  etaDaysMin: number;
  etaDaysMax: number;
}

/**
 * Minta tarif ongkir ke endpoint server. Gagal apa pun (endpoint mati,
 * respons rusak, biaya bukan angka) → null — pemanggil menampilkan
 * "ongkir akan dihitung", bukan angka tebakan.
 */
export async function fetchShippingQuote(
  endpoint: string,
  request: { postalCode: string; courier: SalesCourier; method: SalesDeliveryMethod; weightGrams: number },
): Promise<ShippingQuote | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const d = data as Record<string, unknown>;
    if (typeof d.costIdr !== 'number' || !Number.isFinite(d.costIdr) || d.costIdr < 0) return null;
    if (typeof d.etaDaysMin !== 'number' || typeof d.etaDaysMax !== 'number') return null;
    return { costIdr: Math.round(d.costIdr), etaDaysMin: d.etaDaysMin, etaDaysMax: d.etaDaysMax };
  } catch {
    return null;
  }
}

/** Minta token transaksi Snap ke endpoint server; gagal → null. */
export async function requestMidtransToken(
  endpoint: string,
  payload: { orderId: string; grossAmountIdr: number; buyerEmail: string },
): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const token = (data as Record<string, unknown>).token;
    return typeof token === 'string' && token !== '' ? token : null;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

/**
 * Muat Snap.js Midtrans (satu kali). Mengembalikan true hanya bila
 * `window.snap` benar-benar tersedia sesudahnya.
 */
export function loadMidtransSnap(clientKey: string, isProduction: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(false);
  if (window.snap) return Promise.resolve(true);
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve(typeof window.snap !== 'undefined');
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/* ══════════════════════ Struk ══════════════════════ */

/**
 * Teks struk pesanan (diunduh lewat "Simpan Struk", F8). Isinya hanya
 * data pesanan nyata — nomor, tanggal, item, rincian, alamat, kurir,
 * kebijakan retur. Tidak ada angka yang dikarang.
 */
export function buildReceiptText(order: SalesOrder, locale: 'id' | 'en'): string {
  const id = locale === 'id';
  const lines: string[] = [];
  lines.push('SENSTORIA');
  lines.push(id ? `Struk Pesanan ${order.order_number}` : `Order Receipt ${order.order_number}`);
  lines.push(`${id ? 'Tanggal' : 'Date'}: ${order.created_at.slice(0, 10)}`);
  lines.push(`${id ? 'Status' : 'Status'}: ${order.status}`);
  lines.push('');
  for (const item of order.items) {
    lines.push(`${item.brand} ${item.name} — ${item.size_ml} ml × ${item.quantity} = Rp ${item.line_total_idr.toLocaleString('id-ID')}`);
  }
  lines.push('');
  lines.push(`${id ? 'Subtotal' : 'Subtotal'}: Rp ${order.subtotal_idr.toLocaleString('id-ID')}`);
  if (order.discount_idr > 0) {
    lines.push(`${id ? 'Diskon' : 'Discount'}${order.promo_code ? ` (${order.promo_code})` : ''}: -Rp ${order.discount_idr.toLocaleString('id-ID')}`);
  }
  lines.push(`${id ? 'Termasuk pajak' : 'Tax included'}: Rp ${order.tax_included_idr.toLocaleString('id-ID')}`);
  lines.push(`${id ? 'Ongkir' : 'Delivery'} (${order.shipping.courier.toUpperCase()}): Rp ${order.delivery_idr.toLocaleString('id-ID')}`);
  lines.push(`${id ? 'Total' : 'Total'}: Rp ${order.total_idr.toLocaleString('id-ID')}`);
  lines.push('');
  lines.push(`${id ? 'Dikirim ke' : 'Ship to'}: ${order.shipping.recipient_name}, ${order.shipping.address}, ${order.shipping.city} ${order.shipping.postal_code}`);
  if (order.tracking_number) {
    lines.push(`${id ? 'No. resi' : 'Tracking no.'}: ${order.tracking_number}`);
  }
  lines.push('');
  lines.push(
    id
      ? 'Retur hanya untuk barang rusak/salah, 7 hari sejak diterima.'
      : 'Returns only for damaged/wrong items, within 7 days of delivery.',
  );
  return lines.join('\n');
}
