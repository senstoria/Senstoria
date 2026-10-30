/**
 * Sprint 2 — Data layer: single source of truth over Firestore.
 *
 * Rules this module enforces (BR-01, plan §5.2):
 * - Wear counts come ONLY from wear_logs. There is no stored counter.
 * - A Log Wear writes the wear log AND updates the bottle's remaining_ml
 *   in ONE Firestore transaction (signed-in users). The two writes never
 *   happen separately, so a failed write can never leave counts changed
 *   while the log is missing (or vice versa).
 * - Every new wear log carries `client_op_id`, and the wear-log
 *   document id is derived from it. A retry with the same idempotency
 *   key finds the existing document inside the transaction and writes
 *   nothing, so double-clicks and retries can never duplicate a log.
 *   (Firestore transactions cannot run queries, so the check is a
 *   document read, not a query.)
 * - Offline persistence is intentionally NOT enabled: an offline Log Wear
 *   fails honestly (error + retry) instead of changing numbers as if
 *   recorded. Firestore is cache for reads, never a source of truth for
 *   writes that have not been confirmed.
 * - Wishlist and compare are per-account subcollections
 *   (`wishlist/{uid}/items`, `compare/{uid}/items`), never bottle records
 *   (BR-03). They are NOT counted as owned.
 * - Affiliate clicks are read (admin-only) here, never written from the
 *   client: only the /go Function writes `affiliate_clicks`.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { db, BackendNotConfiguredError } from './firebase.ts';
import type { BottleState, WearLogState } from './derivedCalculations.ts';

function requireDb(): Firestore {
  if (!db) throw new BackendNotConfiguredError();
  return db;
}

/** Idempotency key for a wear-log write. Stable across retries of one action. */
export function newClientOpId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `op_${crypto.randomUUID()}`;
  }
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

/** Pure wear computation shared by the transaction and the logged-out path. */
export function planWear(
  bottle: BottleState,
  mlUsed: number
): { newRemainingMl: number; newStatus: 'in_use' | 'finished' } {
  const newRemainingMl = Math.max(0, Number((bottle.remaining_ml - mlUsed).toFixed(1)));
  return { newRemainingMl, newStatus: newRemainingMl === 0 ? 'finished' : 'in_use' };
}

export interface WearInput {
  bottleId: string;
  perfumeId: string;
  sprays: number;
  mlUsed: number;
  compliments?: number;
  mood?: string;
  occasion?: string;
  weather?: string;
  note?: string;
  /** Caller-supplied idempotency key; generated when omitted. */
  clientOpId?: string;
}

export interface WearResult {
  wearLog: WearLogState;
  updatedBottle: BottleState;
  /** True when the op id was already recorded (retry/double-submit). */
  deduped: boolean;
}

/**
 * Transactional Log Wear for signed-in users. Reads the bottle, checks for
 * an existing wear log with the same client_op_id, then writes the log and
 * updates the bottle atomically. Throws on any failure — callers must show
 * an honest error + retry and must NOT update displayed numbers.
 */
/**
 * Pure core of the Log Wear transaction, factored out so the decision
 * logic (dedup vs write, server-based volume math) is unit-testable
 * without a Firestore instance. The transaction below calls this after
 * reading the bottle and the op id's document; the unit test drives it
 * against an in-memory store with the same assertions as the load test.
 */
export function resolveWearWrite(
  existing: WearLogState | null,
  clientBottle: BottleState,
  serverBottle: BottleState,
  userId: string,
  input: WearInput,
  clientOpId: string,
  wearLogId: string
): { deduped: boolean; wearLog: WearLogState; updatedBottle: BottleState } {
  const { newRemainingMl, newStatus } = planWear(serverBottle, input.mlUsed);
  if (existing) {
    return {
      deduped: true,
      wearLog: existing,
      updatedBottle: { ...clientBottle, remaining_ml: serverBottle.remaining_ml, status: serverBottle.status },
    };
  }
  const wearLog: WearLogState = {
    id: wearLogId,
    user_id: userId,
    bottle_id: input.bottleId,
    perfume_id: input.perfumeId,
    worn_at: new Date().toISOString(),
    sprays: input.sprays,
    ml_used: input.mlUsed,
    compliments: input.compliments ?? 0,
    mood: input.mood,
    occasion: input.occasion,
    weather: input.weather,
    note: input.note,
    client_op_id: clientOpId,
    deleted_at: null,
  };
  return {
    deduped: false,
    wearLog,
    updatedBottle: { ...clientBottle, remaining_ml: newRemainingMl, status: newStatus },
  };
}

export async function logWearTransaction(
  userId: string,
  bottle: BottleState,
  input: WearInput
): Promise<WearResult> {
  const firestore = requireDb();
  const clientOpId = input.clientOpId ?? newClientOpId();
  // Deterministic document id from the idempotency key: the same op id
  // always addresses the same document, which is what makes retries safe.
  const wearLogId = `wear_${clientOpId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return runTransaction(firestore, async (tx) => {
    const bottleRef = doc(firestore, 'bottles', bottle.id);
    const wearLogRef = doc(firestore, 'wear_logs', wearLogId);
    const bottleSnap = await tx.get(bottleRef);
    if (!bottleSnap.exists()) {
      throw new Error('Bottle not found on server.');
    }
    const serverBottle = bottleSnap.data() as BottleState;
    if ((serverBottle.remaining_ml ?? 0) <= 0) {
      throw new Error('Bottle is empty on server.');
    }
    // Idempotency: if this op id's document already exists, the write
    // already landed (retry / double-submit). Return it, write nothing.
    const existingSnap = await tx.get(wearLogRef);
    const existing = existingSnap.exists()
      ? ({
          id: wearLogId,
          user_id: userId,
          bottle_id: (existingSnap.data() as DocumentData).bottle_id,
          perfume_id: (existingSnap.data() as DocumentData).perfume_id,
          worn_at:
            typeof (existingSnap.data() as DocumentData).worn_at === 'string'
              ? (existingSnap.data() as DocumentData).worn_at
              : new Date().toISOString(),
          sprays: (existingSnap.data() as DocumentData).sprays,
          ml_used: (existingSnap.data() as DocumentData).ml_used,
          compliments: (existingSnap.data() as DocumentData).compliments ?? 0,
          mood: (existingSnap.data() as DocumentData).mood,
          occasion: (existingSnap.data() as DocumentData).occasion,
          weather: (existingSnap.data() as DocumentData).weather,
          note: (existingSnap.data() as DocumentData).note,
          client_op_id: clientOpId,
          deleted_at: (existingSnap.data() as DocumentData).deleted_at ?? null,
        } as WearLogState)
      : null;
    const resolved = resolveWearWrite(existing, bottle, serverBottle, userId, input, clientOpId, wearLogId);
    if (resolved.deduped) return resolved;
    tx.set(wearLogRef, { ...resolved.wearLog, created_at: new Date().toISOString() });
    tx.update(bottleRef, {
      remaining_ml: resolved.updatedBottle.remaining_ml,
      status: resolved.updatedBottle.status,
      updated_at: new Date().toISOString(),
    });
    return resolved;
  });
}

export async function retractWearLogTransaction(
  userId: string,
  wearLogId: string,
  bottle: BottleState,
  prevRemainingMl: number,
  prevStatus: 'in_use' | 'sealed' | 'finished'
): Promise<BottleState> {
  const firestore = requireDb();
  return runTransaction(firestore, async (tx) => {
    const bottleRef = doc(firestore, 'bottles', bottle.id);
    tx.delete(doc(firestore, 'wear_logs', wearLogId));
    tx.update(bottleRef, { remaining_ml: prevRemainingMl, status: prevStatus, updated_at: new Date().toISOString() });
    return { ...bottle, remaining_ml: prevRemainingMl, status: prevStatus };
  });
}

/** Soft-delete a wear log (counts exclude deleted_at != null). Undo clears it. */
export async function softDeleteWearLogDoc(userId: string, wearLogId: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'wear_logs', wearLogId), { deleted_at: new Date().toISOString() });
}

export async function restoreWearLogDoc(userId: string, wearLogId: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'wear_logs', wearLogId), { deleted_at: null });
}

/** Soft-delete a bottle. Undo clears deleted_at. Never a one-click hard delete. */
export async function softDeleteBottleDoc(userId: string, bottleId: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'bottles', bottleId), { deleted_at: new Date().toISOString() });
}

export async function restoreBottleDoc(userId: string, bottleId: string): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'bottles', bottleId), { deleted_at: null });
}

/** Wishlist / compare persistence (per-account subcollections, BR-03). */
async function fetchIdCollection(userId: string, coll: 'wishlist' | 'compare'): Promise<string[]> {
  const firestore = requireDb();
  const snap = await getDocs(collection(firestore, coll, userId, 'items'));
  return snap.docs.map((d) => d.id);
}

async function setIdItem(userId: string, coll: 'wishlist' | 'compare', perfumeId: string): Promise<void> {
  const firestore = requireDb();
  await setDoc(doc(firestore, coll, userId, 'items', perfumeId), {
    perfume_id: perfumeId,
    created_at: new Date().toISOString(),
  });
}

async function removeIdItem(userId: string, coll: 'wishlist' | 'compare', perfumeId: string): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, coll, userId, 'items', perfumeId));
}

export const fetchWishlistIds = (userId: string) => fetchIdCollection(userId, 'wishlist');
export const fetchCompareIds = (userId: string) => fetchIdCollection(userId, 'compare');
export const addWishlistItem = (userId: string, perfumeId: string) => setIdItem(userId, 'wishlist', perfumeId);
export const removeWishlistItem = (userId: string, perfumeId: string) => removeIdItem(userId, 'wishlist', perfumeId);
export const addCompareItem = (userId: string, perfumeId: string) => setIdItem(userId, 'compare', perfumeId);
export const removeCompareItem = (userId: string, perfumeId: string) => removeIdItem(userId, 'compare', perfumeId);

/** Admin-only read of real affiliate_clicks rows (never client-written). */
export interface AffiliateClickRow {
  click_id: string;
  perfume_id: string;
  platform: string;
  src: string;
  destination_url?: string;
  offer_missing?: boolean;
  timestamp: string;
}

export async function fetchAffiliateClicksForAdmin(): Promise<AffiliateClickRow[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, 'affiliate_clicks'), orderBy('created_at', 'desc'), limit(100))
  );
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    const created = data.created_at;
    const timestamp =
      typeof created === 'string'
        ? created
        : typeof created?.toDate === 'function'
          ? created.toDate().toISOString()
          : new Date().toISOString();
    return {
      click_id: data.click_id ?? d.id,
      perfume_id: data.perfume_id ?? '',
      platform: data.platform ?? '',
      src: data.src ?? '',
      destination_url: data.destination_url,
      offer_missing: data.offer_missing === true,
      timestamp,
    };
  });
}

/**
 * /go URL builder. Default is a relative path (works with the Firebase
 * Hosting rewrite `/go/**` → the `go` Function, and with the Functions
 * emulator). `VITE_GO_BASE_URL` overrides it for direct Function URLs.
 * Never contains secrets — the Function URL is public by design.
 */
export function goUrl(perfumeId: string, platform: 'shopee' | 'tokopedia', src: string): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const base = env?.VITE_GO_BASE_URL ?? '';
  const cleanBase = base.replace(/\/$/, '');
  return `${cleanBase}/go/${encodeURIComponent(perfumeId)}?platform=${platform}&src=${encodeURIComponent(src)}`;
}
