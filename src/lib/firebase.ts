import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  query,
  where,
  type Firestore
} from 'firebase/firestore';
import { BottleState, WearLogState, StoryState, ReviewState, WaitlistState, SampleOrderState } from './derivedCalculations.ts';

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
 * Saves a waitlist demand capture entry to Firestore.
 * NOTE (Sprint 4): client-side waitlist writes are denied by Rules v1;
 * entries must go through a server Function with double opt-in. This helper
 * is kept for the Function-side call path only and fails closed without a backend.
 */
export async function saveWaitlistEntryToFirestore(userId: string | undefined, entry: WaitlistState): Promise<void> {
  const firestore = requireDb();
  const path = `waitlist_entries/${entry.id}`;
  try {
    await setDoc(doc(firestore, 'waitlist_entries', entry.id), {
      ...entry,
      user_id: userId || 'anonymous',
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches waitlist entries for a user from Firestore
 */
export async function fetchUserWaitlistEntriesFromFirestore(userId: string): Promise<WaitlistState[]> {
  const firestore = requireDb();
  const path = 'waitlist_entries';
  try {
    const q = query(collection(firestore, 'waitlist_entries'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as WaitlistState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a simulated sample order under feature flag try_it_first_ordering.
 * NOTE (Sprint 4): the payment simulator is deleted; client writes to
 * sample_orders are denied by Rules v1. Kept only so existing imports compile.
 */
export async function saveSampleOrderToFirestore(userId: string | undefined, order: SampleOrderState): Promise<void> {
  const firestore = requireDb();
  const path = `sample_orders/${order.id}`;
  try {
    await setDoc(doc(firestore, 'sample_orders', order.id), {
      ...order,
      user_id: userId || 'anonymous',
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches sample orders for a user from Firestore
 */
export async function fetchUserSampleOrdersFromFirestore(userId: string): Promise<SampleOrderState[]> {
  const firestore = requireDb();
  const path = 'sample_orders';
  try {
    const q = query(collection(firestore, 'sample_orders'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as SampleOrderState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
