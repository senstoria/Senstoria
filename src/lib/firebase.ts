import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BottleState, WearLogState, StoryState, ReviewState, WaitlistState, SampleOrderState } from './derivedCalculations.ts';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId for custom database provisioned
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test per skill guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
    }
  }
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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
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
  const path = `bottles/${bottle.id}`;
  try {
    await setDoc(doc(db, 'bottles', bottle.id), {
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
  const path = 'bottles';
  try {
    const q = query(collection(db, 'bottles'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as BottleState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a wear log to Firestore
 */
export async function saveWearLogToFirestore(userId: string, wearLog: WearLogState) {
  const path = `wear_logs/${wearLog.id}`;
  try {
    await setDoc(doc(db, 'wear_logs', wearLog.id), {
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
  const path = 'wear_logs';
  try {
    const q = query(collection(db, 'wear_logs'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as WearLogState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a Scent Story to Firestore
 */
export async function saveStoryToFirestore(userId: string, story: StoryState) {
  const path = `scent_stories/${story.id}`;
  try {
    await setDoc(doc(db, 'scent_stories', story.id), {
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
  const path = 'scent_stories';
  try {
    const q = query(collection(db, 'scent_stories'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as StoryState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Fetches published community Scent Stories from Firestore
 */
export async function fetchPublishedStoriesFromFirestore(): Promise<StoryState[]> {
  const path = 'scent_stories';
  try {
    const q = query(collection(db, 'scent_stories'), where('status', '==', 'published'));
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
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, 'reviews', review.id), {
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
  const path = 'reviews';
  try {
    const q = query(collection(db, 'reviews'), where('perfume_id', '==', perfumeId));
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
  const path = 'reviews';
  try {
    const q = query(collection(db, 'reviews'), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ReviewState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a waitlist demand capture entry to Firestore
 */
export async function saveWaitlistEntryToFirestore(userId: string | undefined, entry: WaitlistState): Promise<void> {
  const path = `waitlist_entries/${entry.id}`;
  try {
    await setDoc(doc(db, 'waitlist_entries', entry.id), {
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
  const path = 'waitlist_entries';
  try {
    const q = query(collection(db, 'waitlist_entries'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as WaitlistState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Saves a simulated sample order under feature flag try_it_first_ordering
 */
export async function saveSampleOrderToFirestore(userId: string | undefined, order: SampleOrderState): Promise<void> {
  const path = `sample_orders/${order.id}`;
  try {
    await setDoc(doc(db, 'sample_orders', order.id), {
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
  const path = 'sample_orders';
  try {
    const q = query(collection(db, 'sample_orders'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as SampleOrderState);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
