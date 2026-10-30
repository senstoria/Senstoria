/**
 * Sprint 7 — UU PDP data portability & erasure (Pasal 7 & 8).
 *
 * Two halves:
 *  1. EXPORT: assemble everything Senstoria stores about the signed-in user
 *     — server Firestore documents (rules-allowed owner reads) plus the
 *     device-local snapshot the app already exported — into one JSON
 *     document the user can download. Every section is labelled with its
 *     provenance (`server` vs `local_device`) so the user can tell what
 *     came from where.
 *  2. DELETE: remove every user-linked server document (owner deletes are
 *     allowed by firestore.rules for users/bottles/wear_logs/scent_stories/
 *     reviews/wishlist/compare) and then attempt Firebase Auth deletion.
 *
 * HONEST LIMITS (also stated in the Privacy page, §5):
 *  - Waitlist entries are NOT included in either half: they are keyed by a
 *    SHA-256 hash of (email|perfume|size), readable only by admins, and
 *    cannot be enumerated from the client. Erasing them needs an admin
 *    Function (recorded as tech debt, not silently pretended).
 *  - Affiliate clicks carry no user id (Sprint 2 design), so there is
 *    nothing user-linked to export or delete there.
 *  - Auth deletion requires a recent login (Firebase rule). When the
 *    session is too old, deleteUser fails with `auth/requires-recent-login`
 *    and the caller must ask the user to sign in again and retry — the
 *    Firestore documents are already deleted at that point, which the
 *    outcome reports honestly instead of claiming full deletion.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

export interface ServerExportData {
  user_document: Record<string, unknown> | null;
  bottles: unknown[];
  wear_logs: unknown[];
  scent_stories: unknown[];
  reviews: unknown[];
  wishlist: unknown[];
  compare: unknown[];
}

/** Empty server section: used when the user is signed out or no backend is configured. */
export const EMPTY_SERVER_EXPORT: ServerExportData = {
  user_document: null,
  bottles: [],
  wear_logs: [],
  scent_stories: [],
  reviews: [],
  wishlist: [],
  compare: [],
};

const OWNED_COLLECTIONS = ['bottles', 'wear_logs', 'scent_stories', 'reviews'] as const;

async function fetchOwnedCollection(
  db: Firestore,
  collectionName: string,
  uid: string,
): Promise<unknown[]> {
  const snap = await getDocs(
    query(collection(db, collectionName), where('user_id', '==', uid)),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchSubcollection(
  db: Firestore,
  parent: string,
  uid: string,
): Promise<unknown[]> {
  const snap = await getDocs(collection(db, parent, uid, 'items'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Read every user-linked server document. Throws on any read failure. */
export async function fetchServerExportData(
  db: Firestore,
  uid: string,
): Promise<ServerExportData> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const [bottles, wear_logs, scent_stories, reviews, wishlist, compare] =
    await Promise.all([
      fetchOwnedCollection(db, 'bottles', uid),
      fetchOwnedCollection(db, 'wear_logs', uid),
      fetchOwnedCollection(db, 'scent_stories', uid),
      fetchOwnedCollection(db, 'reviews', uid),
      fetchSubcollection(db, 'wishlist', uid),
      fetchSubcollection(db, 'compare', uid),
    ]);
  return {
    user_document: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null,
    bottles,
    wear_logs,
    scent_stories,
    reviews,
    wishlist,
    compare,
  };
}

/**
 * Pure assembler: merge the server export with the device-local snapshot
 * into one labelled document. Unit-tested; no I/O here.
 */
export function assembleExportDocument(
  server: ServerExportData,
  local: Record<string, unknown>,
  userEmail: string | null,
): Record<string, unknown> {
  return {
    meta: {
      app: 'Senstoria',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      regulation_compliance: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)',
      ...(userEmail ? { user_email: userEmail } : {}),
      provenance_note:
        'Sections labelled "server" come from Senstoria Firestore; sections labelled "local_device" come from this browser only. Waitlist entries are not included: they are hash-keyed and admin-read-only (see Privacy §5). Affiliate clicks carry no user id and are not user-linked data.',
    },
    server,
    local_device: local,
  };
}

export interface DeleteOutcome {
  /** Number of server documents actually deleted. */
  serverDocsDeleted: number;
  /** True only when the Firebase Auth user was deleted. */
  authDeleted: boolean;
  /** True when Auth deletion failed because the session is too old. */
  needsRelogin: boolean;
  /** Machine code of any failure (never a secret or PII). */
  errorCode?: string;
}

/**
 * Delete every user-linked server document in batches of 400 (below the
 * Firestore 500-write batch limit). Returns the deleted count. Throws on
 * any batch failure so the caller can report honestly instead of claiming
 * success.
 */
export async function deleteAllUserServerData(
  db: Firestore,
  uid: string,
): Promise<number> {
  const refs: { ref: ReturnType<typeof doc> }[] = [];
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (userSnap.exists()) refs.push({ ref: userSnap.ref });
  for (const name of OWNED_COLLECTIONS) {
    const snap = await getDocs(
      query(collection(db, name), where('user_id', '==', uid)),
    );
    for (const d of snap.docs) refs.push({ ref: d.ref });
  }
  for (const parent of ['wishlist', 'compare'] as const) {
    const snap = await getDocs(collection(db, parent, uid, 'items'));
    for (const d of snap.docs) refs.push({ ref: d.ref });
  }
  let deleted = 0;
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    for (const { ref } of refs.slice(i, i + 400)) batch.delete(ref);
    await batch.commit();
    deleted += Math.min(400, refs.length - i);
  }
  return deleted;
}

/** Attempt Firebase Auth user deletion, classifying the recent-login case. */
export async function deleteAuthAccount(auth: Auth): Promise<DeleteOutcome> {
  const current = auth.currentUser;
  if (!current) {
    return { serverDocsDeleted: 0, authDeleted: false, needsRelogin: true };
  }
  try {
    await deleteUser(current);
    return { serverDocsDeleted: 0, authDeleted: true, needsRelogin: false };
  } catch (err) {
    const code =
      err instanceof Object && 'code' in err ? String((err as { code: unknown }).code) : 'unknown';
    if (code === 'auth/requires-recent-login') {
      return { serverDocsDeleted: 0, authDeleted: false, needsRelogin: true, errorCode: code };
    }
    return { serverDocsDeleted: 0, authDeleted: false, needsRelogin: false, errorCode: code };
  }
}
