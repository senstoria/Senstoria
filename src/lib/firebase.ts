import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  increment,
  type Firestore
} from 'firebase/firestore';
import { BottleState, WearLogState, StoryState, ReviewState, WaitlistState } from './derivedCalculations.ts';
import {
  canTransitionOrder,
  normalizePromoCode,
  parsePromoCode,
  parseSalesOrder,
  type NewSalesOrderDoc,
  type PromoCode,
  type SalesOrder,
  type SalesOrderStatus,
} from './salesN12.ts';
import {
  parseSharedStory,
  type SharedStoryDoc,
} from './storySharingN13.ts';
import { sanitizeErrorText } from './errorReport.ts';
import { logAdminAction, ADMIN_ACTIONS } from './adminAudit.ts';

/**
 * Sprint 1 — Firebase configuration comes ONLY from environment variables.
 * The AI Studio applet config (firebase-applet-config.json) was deleted:
 * production must never point at an applet-managed project.
 *
 * Required (Vercel → Environment Variables, set by the founder):
 *   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 *   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
 * Optional: VITE_FIREBASE_MEASUREMENT_ID
 *
 * When any required variable is missing the app runs WITHOUT a backend:
 * auth and db are null, and every helper below throws a typed error instead
 * of pretending a write succeeded. Callers must surface that error honestly.
 */
// Sprint 2: read env defensively. Under Vite import.meta.env always
// exists; under plain Node test runners (tsx) it is undefined, and the
// module must degrade to "backend not configured" instead of crashing
// at import time.
const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const firebaseConfig = {
  apiKey: viteEnv.VITE_FIREBASE_API_KEY,
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: viteEnv.VITE_FIREBASE_APP_ID,
  measurementId: viteEnv.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseProjectId: string | null = firebaseConfig.projectId ?? null;

let app: FirebaseApp | null = null;
if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Default database of the Senstoria-owned project. No custom databaseId:
// the applet project's custom database no longer exists in this codebase.
export const db: Firestore | null = app ? getFirestore(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('Firebase belum terkonfigurasi. Backend belum terhubung — data tidak disimpan ke server.');
    this.name = 'BackendNotConfiguredError';
  }
}

function requireDb(): Firestore {
  if (!db) throw new BackendNotConfiguredError();
  return db;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Sprint 7: the thrown/logged error must never carry PII. The old code
  // embedded the user's email address in errInfo; only the uid (needed to
  // debug owner-rule failures) and the sanitized message are kept.
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: null,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', sanitizeErrorText(JSON.stringify(errInfo)));
  throw new Error(sanitizeErrorText(JSON.stringify(errInfo)));
}

/**
 * Persists user's shelf bottles to Firestore
 */
export async function saveBottleToFirestore(userId: string, bottle: BottleState) {
  const firestore = requireDb();
  const path = `bottles/${bottle.id}`;
  try {
    await setDoc(doc(firestore, 'bottles', bottle.id), {
      ...bottle,
      user_id: userId,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches user's bottles from Firestore
 */
export async function fetchUserBottlesFromFirestore(userId: string): Promise<BottleState[]> {
  const firestore = requireDb();
  const path = 'bottles';
  try {
    const q = query(collection(firestore, 'bottles'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    // Sprint 2: soft-deleted bottles are excluded client-side (no new
    // composite index needed). Errors THROW so the sync banner fires —
    // a failed fetch must never masquerade as an empty library.
    return snapshot.docs
      .map(d => d.data() as BottleState)
      .filter(b => !b.deleted_at);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Saves a wear log to Firestore
 */
export async function saveWearLogToFirestore(userId: string, wearLog: WearLogState) {
  const firestore = requireDb();
  const path = `wear_logs/${wearLog.id}`;
  try {
    await setDoc(doc(firestore, 'wear_logs', wearLog.id), {
      ...wearLog,
      user_id: userId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches wear logs for a given user from Firestore
 */
export async function fetchUserWearLogsFromFirestore(userId: string): Promise<WearLogState[]> {
  const firestore = requireDb();
  const path = 'wear_logs';
  try {
    const q = query(collection(firestore, 'wear_logs'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    // Sprint 2: soft-deleted wear logs never count (logs win, deleted
    // logs excluded). Errors THROW so the sync banner fires.
    return snapshot.docs
      .map(d => d.data() as WearLogState)
      .filter(w => !w.deleted_at);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Saves a Scent Story to Firestore
 */
export async function saveStoryToFirestore(userId: string, story: StoryState) {
  const firestore = requireDb();
  const path = `scent_stories/${story.id}`;
  try {
    await setDoc(doc(firestore, 'scent_stories', story.id), {
      ...story,
      user_id: userId,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches Scent Stories for a user from Firestore
 */
export async function fetchUserStoriesFromFirestore(userId: string): Promise<StoryState[]> {
  const firestore = requireDb();
  const path = 'scent_stories';
  try {
    const q = query(collection(firestore, 'scent_stories'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as StoryState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a perfume review to Firestore
 */
export async function saveReviewToFirestore(userId: string, review: ReviewState) {
  const firestore = requireDb();
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(firestore, 'reviews', review.id), {
      ...review,
      user_id: userId,
      created_at: review.created_at || new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches reviews for a given perfume from Firestore
 */
export async function fetchReviewsForPerfumeFromFirestore(perfumeId: string): Promise<ReviewState[]> {
  const firestore = requireDb();
  const path = 'reviews';
  try {
    const q = query(collection(firestore, 'reviews'), where('perfume_id', '==', perfumeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ReviewState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Fetches all approved reviews from Firestore
 */
export async function fetchAllApprovedReviewsFromFirestore(): Promise<ReviewState[]> {
  const firestore = requireDb();
  const path = 'reviews';
  try {
    const q = query(collection(firestore, 'reviews'), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ReviewState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Admin moderation: change a review's status in Firestore (approved /
 * rejected / back to pending_moderation). Rules allow admin updates freely;
 * the public display (approved-only filter) flips on the next data sync.
 */
export async function updateReviewStatus(reviewId: string, status: ReviewState['status']): Promise<void> {
  const firestore = requireDb();
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(firestore, 'reviews', reviewId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Admin moderation: SOFT-delete a review from Firestore (P0 Admin v1,
 * spek §3.5/§6: hapus bersifat soft-delete/arsip dulu; hard-delete hanya
 * aksi kedua yang tercatat — aksi kedua itu BELUM ADA di v1, jadi tidak
 * ada jalur hard-delete dari client).
 *
 * Soft-delete = status 'rejected' + deleted_at + deleted_by. Status
 * 'deleted' BELUM ADA di union ReviewState (derivedCalculations.ts)
 * dan 'rejected' sudah disembunyikan dari publik (tampilan publik
 * hanya status 'approved'), jadi tidak ada perubahan tipe atau
 * perubahan filter publik. Dokumen tetap ada di Firestore dan bisa
 * dipulihkan dari konsol memakai before_summary di audit log
 * (status asal tercatat saat aksi). Pemanggil (App.tsx) mencatat
 * audit 'review.soft_delete' setelah tulis ini berhasil.
 */
export async function softDeleteReviewForAdmin(reviewId: string, actorUid: string): Promise<void> {
  const firestore = requireDb();
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(firestore, 'reviews', reviewId), {
      status: 'rejected',
      deleted_at: new Date().toISOString(),
      deleted_by: actorUid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Admin moderation queue: all reviews (any status). Rules allow admin list.
 */
export async function fetchAllReviewsForAdmin(): Promise<ReviewState[]> {
  const firestore = requireDb();
  const path = 'reviews';
  try {
    const snapshot = await getDocs(collection(firestore, 'reviews'));
    return snapshot.docs.map(d => d.data() as ReviewState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Fetches all waitlist entries from Firestore for Admin demand review.
 * Rules allow admin reads of waitlist_entries; the client never writes here.
 * Demand honesty: callers must distinguish pending_confirm from confirmed
 * (active/notified) entries — see waitlistLogic.countConfirmedDemand.
 */
export async function fetchAllWaitlistEntriesForAdmin(): Promise<WaitlistState[]> {
  const firestore = requireDb();
  const path = 'waitlist_entries';
  try {
    const snapshot = await getDocs(collection(firestore, 'waitlist_entries'));
    return snapshot.docs.map(d => d.data() as WaitlistState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/* ══════════════════════════════════════════════════════════════════
   Fase N12 (gerbang S3) — Pesanan full-size (koleksi `orders`).
   Pesanan hanya dibuat dari checkout setelah pembayaran nyata lewat
   Midtrans (status awal 'baru', lalu 'dibayar' saat Snap sukses).
   Tanpa kunci Midtrans, pemanggil TIDAK PERNAH memanggil
   createSalesOrder — tidak ada pesanan berbayar palsu.
   ══════════════════════════════════════════════════════════════════ */

/**
 * Id dokumen pesanan baru (dibuat client-side, tanpa menulis). Nomor
 * pesanan deterministik diturunkan dari id ini SEBELUM dokumen
 * disimpan, supaya nomor yang sama dipakai di semua layar (F8).
 */
export function newSalesOrderId(): string {
  const firestore = requireDb();
  return doc(collection(firestore, 'orders')).id;
}

/**
 * Simpan dokumen pesanan baru (status 'baru') dengan id yang sudah
 * ditentukan pemanggil. Pemanggil WAJIB mengisi order_number dari
 * buildOrderNumber(id) sebelum memanggil ini. Fungsi ini TIDAK
 * PERNAH dipanggil tanpa pembayaran nyata yang menyusul — tanpa kunci
 * Midtrans, checkout tidak mencapai titik ini.
 */
export async function createSalesOrder(orderId: string, order: NewSalesOrderDoc): Promise<void> {
  const firestore = requireDb();
  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(firestore, 'orders', orderId), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Ubah status pesanan mengikuti mesin status (salesN12.ts).
 * Transisi yang tidak valid ditolak di client — rules Firestore
 * menolaknya juga. `extra` hanya boleh berisi field yang diizinkan
 * rules (paid_at / shipped_at / cancelled_at / cancel_reason /
 * tracking_number / midtrans_transaction_id).
 */
export async function updateSalesOrderStatus(
  orderId: string,
  fromStatus: SalesOrderStatus,
  toStatus: SalesOrderStatus,
  extra: Partial<Pick<SalesOrder, 'paid_at' | 'shipped_at' | 'cancelled_at' | 'cancel_reason' | 'tracking_number' | 'midtrans_transaction_id'>> = {},
): Promise<void> {
  if (!canTransitionOrder(fromStatus, toStatus)) {
    throw new Error(`Transisi status pesanan tidak valid: ${fromStatus} → ${toStatus}.`);
  }
  const firestore = requireDb();
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(firestore, 'orders', orderId), {
      status: toStatus,
      updated_at: new Date().toISOString(),
      ...extra,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Admin: tulis nomor resi tanpa mengubah status. Rules mengizinkan
 * update admin yang hanya mengubah tracking_number + updated_at.
 */
export async function updateSalesOrderTracking(orderId: string, trackingNumber: string): Promise<void> {
  const firestore = requireDb();
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(firestore, 'orders', orderId), {
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/** Pesanan milik satu pembeli (terbaru dulu); dokumen rusak dibuang. */
export async function fetchUserSalesOrders(userId: string): Promise<SalesOrder[]> {
  const firestore = requireDb();
  const path = 'orders';
  try {
    // Tanpa orderBy di query (where + orderBy butuh composite index):
    // urutkan di client berdasarkan created_at.
    const q = query(collection(firestore, 'orders'), where('user_id', '==', userId), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => parseSalesOrder({ ...d.data(), id: d.id }))
      .filter((o): o is SalesOrder => o !== null)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/** Semua pesanan untuk Admin (terbaru dulu, maks 100). */
export async function fetchAllSalesOrdersForAdmin(): Promise<SalesOrder[]> {
  const firestore = requireDb();
  const path = 'orders';
  try {
    const q = query(collection(firestore, 'orders'), orderBy('created_at', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => parseSalesOrder({ ...d.data(), id: d.id }))
      .filter((o): o is SalesOrder => o !== null);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Validasi kode promo ke koleksi `promo_codes` (F4 — tanpa kode demo).
 * Koleksi kosong secara default → kode apa pun mengembalikan null
 * ("Kode tidak ditemukan"). Bila rules belum mengizinkan baca
 * promo_codes, query gagal dan hasilnya juga null — tidak pernah
 * menampilkan diskon yang tidak terverifikasi.
 */
export async function validatePromoCode(code: string): Promise<PromoCode | null> {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;
  try {
    const firestore = requireDb();
    const q = query(collection(firestore, 'promo_codes'), where('code', '==', normalized), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return parsePromoCode(snapshot.docs[0].data());
  } catch {
    // Backend belum terkonfigurasi / rules belum mengizinkan baca /
    // koleksi kosong: hasilnya sama — kode tidak terverifikasi, jadi
    // tidak pernah menampilkan diskon.
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Fase N13 (P11) — berbagi satu Scent Story opt-in.
// Koleksi `shared_stories` TERPISAH dari Jurnal (Jurnal tetap privat).
// Id dokumen ADALAH token acak: membaca lewat tautan adalah satu `get`
// per-dokumen — tidak pernah `list` publik. display_name sudah diputuskan
// pemanggil dari G15 saat dibagikan (null bila Privat); fungsi-fungsi
// di sini TIDAK PERNAH menulis ulang nama.
// ═══════════════════════════════════════════════════════════════════

/**
 * Simpan dokumen cerita yang dibagikan (id dokumen = token).
 * Pemanggil WAJIB membangun dokumen lewat buildSharedStoryDoc —
 * token acak, isi >= 20 karakter, revoked false, report_count 0.
 */
export async function createSharedStory(docData: SharedStoryDoc): Promise<void> {
  const firestore = requireDb();
  const path = `shared_stories/${docData.token}`;
  try {
    await setDoc(doc(firestore, 'shared_stories', docData.token), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Baca satu cerita yang dibagikan lewat token — TANPA akun.
 * Mengembalikan null bila token tidak ada, dokumen rusak, atau
 * backend belum terkonfigurasi. TIDAK PERNAH melempar untuk token
 * asing: halaman publik menampilkan "tidak ditemukan", bukan crash.
 */
export async function fetchSharedStoryByToken(token: string): Promise<SharedStoryDoc | null> {
  try {
    const firestore = requireDb();
    const snap = await getDoc(doc(firestore, 'shared_stories', token));
    if (!snap.exists()) return null;
    return parseSharedStory({ ...snap.data(), id: snap.id });
  } catch {
    return null;
  }
}

/** Cerita yang dibagikan satu pemilik (terbaru dulu); dokumen rusak dibuang. */
export async function fetchUserSharedStories(userId: string): Promise<SharedStoryDoc[]> {
  const firestore = requireDb();
  const path = 'shared_stories';
  try {
    // Tanpa orderBy di query (where + orderBy butuh composite index):
    // urutkan di client berdasarkan created_at (pola yang sama dengan N12).
    const q = query(collection(firestore, 'shared_stories'), where('user_id', '==', userId), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => parseSharedStory({ ...d.data(), id: d.id }))
      .filter((s): s is SharedStoryDoc => s !== null)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Berhenti bagikan: revoked = true (satu arah — pemilik TIDAK bisa
 * mengaktifkan kembali tautan yang sama; rules menolaknya juga).
 * Dipakai pemilik (tautannya sendiri) maupun admin (tautan siapa pun).
 */
export async function revokeSharedStory(token: string): Promise<void> {
  const firestore = requireDb();
  const path = `shared_stories/${token}`;
  try {
    await updateDoc(doc(firestore, 'shared_stories', token), {
      revoked: true,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Admin revoke shared story + audit (P0 Admin v1). Sama dengan
 * revokeSharedStory, ditambah entri 'shared_story.revoke' ke
 * admin_actions setelah revoke berhasil. Dipakai AdminDashboardView
 * (handleRevokeSharedStory) — ganti satu baris pemanggilan ke fungsi
 * ini. Mengembalikan true bila audit tercatat, false bila audit gagal
 * (revoke sendiri tetap berlaku; pemanggil tampilkan toast peringatan
 * bila false — keputusan audit-gagal di src/lib/adminAudit.ts).
 * Pemilik yang mencabut tautannya sendiri tetap memakai
 * revokeSharedStory TANPA audit (bukan aksi admin).
 */
export async function revokeSharedStoryForAdmin(token: string, actorUid: string): Promise<boolean> {
  await revokeSharedStory(token);
  return logAdminAction(
    db,
    actorUid,
    ADMIN_ACTIONS.sharedStoryRevoke,
    'shared_story',
    token,
    'revoked:false',
    'revoked:true',
    'success',
  );
}

/** Semua cerita yang dibagikan untuk Admin (terbaru dulu, maks 100). */
export async function fetchAllSharedStoriesForAdmin(): Promise<SharedStoryDoc[]> {
  const firestore = requireDb();
  const path = 'shared_stories';
  try {
    const q = query(collection(firestore, 'shared_stories'), orderBy('created_at', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => parseSharedStory({ ...d.data(), id: d.id }))
      .filter((s): s is SharedStoryDoc => s !== null);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Laporkan cerita dari halaman publik — TANPA akun. Satu-satunya
 * tulis publik ke koleksi ini: report_count +1 dan reported_at.
 * Rules mengizinkan HANYA dua field itu dan HANYA pada tautan aktif;
 * laporan TIDAK PERNAH mencabut tautan (itu wewenang pemilik/admin).
 * Mengembalikan false bila pelaporan gagal — pemanggil menampilkan
 * pesan jujur, bukan "laporan diterima" palsu.
 */
export async function reportSharedStory(token: string): Promise<boolean> {
  try {
    const firestore = requireDb();
    await updateDoc(doc(firestore, 'shared_stories', token), {
      report_count: increment(1),
      reported_at: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}
