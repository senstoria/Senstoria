/**
 * Sprint 2 — /go Cloud Function (Firebase Functions v2, onRequest).
 *
 * Thin wrapper only: all redirect decisions live in goLogic.ts (pure and
 * unit-tested). This file wires HTTP + Firestore and nothing else.
 *
 * Deploy (FOUNDER console action — requires the Blaze plan):
 *   1. Firebase Console → Upgrade to Blaze (no cost cap set; Q30).
 *   2. `firebase use senstoria-app` (no .firebaserc is committed on purpose).
 *   3. `firebase deploy --only functions:go,firestore:rules,firestore:indexes`
 *      from the repo root (functions/ builds with `npm run build`).
 *   4. Point the SPA at the Function: set Vercel env `VITE_GO_BASE_URL` to
 *      the deployed Function URL
 *      (https://asia-southeast2-senstoria-app.cloudfunctions.net/go),
 *      or serve the SPA from Firebase Hosting (firebase.json rewrite
 *      /go/** → go covers the relative default).
 * Until step 4, /go links on the Vercel deployment cannot reach the
 * Function — the client still builds relative /go URLs by default.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  resolveGo,
  InMemoryRateLimiter,
  type GoDataStore,
} from './goLogic.js';

initializeApp();
const db = getFirestore();
const limiter = new InMemoryRateLimiter();

const store: GoDataStore = {
  async getPerfume(id) {
    const snap = await db.collection('perfumes').doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as { name?: string; slug?: string; data_status?: string };
    return { id: snap.id, name: data.name ?? data.slug ?? snap.id, data_status: data.data_status ?? '' };
  },
  async getOffer(perfumeId, platform) {
    const snap = await db
      .collection('perfume_offers')
      .where('perfume_id', '==', perfumeId)
      .where('platform', '==', platform)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0].data() as { perfume_id?: string; platform?: string; offer_url?: string };
    return {
      perfume_id: data.perfume_id ?? perfumeId,
      platform: data.platform ?? platform,
      offer_url: data.offer_url ?? '',
    };
  },
  async writeClick(row) {
    try {
      // Server timestamp is canonical; the client reader accepts both
      // Timestamp and ISO strings.
      await db
        .collection('affiliate_clicks')
        .doc(row.click_id)
        .set({ ...row, created_at: FieldValue.serverTimestamp() });
    } catch (err) {
      // The redirect still succeeds (see goLogic.ts); the failure is
      // visible in Function logs, never silently dropped.
      console.error('affiliate_clicks write failed', err);
    }
  },
};

export const go = onRequest({ region: 'asia-southeast2', cors: false }, async (req, res) => {
  res.set('X-Robots-Tag', 'noindex');
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req.socket.remoteAddress ||
    'unknown';
  if (!limiter.allow(ip)) {
    res.status(429).send('Too many requests');
    return;
  }
  // With the Hosting rewrite /go/** → go, req.path is the original path.
  // Also accept ?id= as a fallback for direct Function URLs.
  const segments = req.path.split('/').filter(Boolean);
  const perfumeId =
    segments.length >= 2 && segments[0] === 'go'
      ? decodeURIComponent(segments[1])
      : typeof req.query.id === 'string'
        ? req.query.id
        : '';
  const outcome = await resolveGo(
    {
      perfumeId,
      platform: typeof req.query.platform === 'string' ? req.query.platform : null,
      src: typeof req.query.src === 'string' ? req.query.src : null,
    },
    store
  );
  if (outcome.status === 302 && outcome.location) {
    res.redirect(302, outcome.location);
    return;
  }
  res.status(outcome.status).send(outcome.body ?? 'Error');
});
