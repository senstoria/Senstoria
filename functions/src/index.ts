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

/* ── Sprint 4: Try It First waitlist backend (double opt-in, TRY-02/05) ──
 * POST /waitlist (function `waitlist`): validates, dedups by deterministic
 * doc id, stores a `pending_confirm` entry, and — ONLY if WAITLIST_SMTP_*
 * and WAITLIST_CONFIRM_URL are configured — sends the confirmation email.
 * The response always reports the honest `emailSent` boolean; the UI must
 * never claim an email was sent when it was not.
 * GET /waitlist/confirm (function `waitlistConfirm`): verifies the token
 * hash + expiry and flips `pending_confirm` -> `active`, returning a small
 * server-rendered HTML page (works from any mail client, no SPA needed).
 * Deploy (FOUNDER console action — Blaze required, same as /go):
 *   firebase deploy --only functions:waitlist,functions:waitlistConfirm
 * then set WAITLIST_CONFIRM_URL to the deployed confirm URL (or the
 * Firebase Hosting URL + /waitlist/confirm, see firebase.json rewrites).
 */
import {
  validateWaitlistInput,
  waitlistDocId,
  createPendingEntry,
  confirmEntry,
  resendConfirmation,
  isPublishedPerfume,
  buildConfirmationLink,
  type WaitlistEntry,
  type WaitlistInput,
} from './waitlistLogic.js';
import { getMailTransport, logOnlyTransport } from './mailTransport.js';

const waitlistLimiter = new InMemoryRateLimiter(10, 60_000);

function waitlistClientIp(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req.socket.remoteAddress ||
    'unknown';
}

function waitlistPage(title: string, body: string, status = 200): { status: number; html: string } {
  return {
    status,
    html: `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Senstoria</title></head><body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#1a1a1a"><h1>${title}</h1><p>${body}</p><p><a href="/">Kembali ke Senstoria</a></p></body></html>`,
  };
}

export const waitlist = onRequest({ region: 'asia-southeast2', cors: true }, async (req, res) => {
  res.set('X-Robots-Tag', 'noindex');
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!waitlistLimiter.allow(waitlistClientIp(req))) {
    res.status(429).json({ ok: false, error: 'rate_limited' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const input: WaitlistInput = {
    email: typeof body.email === 'string' ? body.email : '',
    perfume_id: typeof body.perfume_id === 'string' ? body.perfume_id : '',
    size_ml: body.size_ml as WaitlistInput['size_ml'],
    ...(typeof body.whatsapp_number === 'string' && body.whatsapp_number ? { whatsapp_number: body.whatsapp_number } : {}),
    ...(typeof body.notification_pref === 'string' ? { notification_pref: body.notification_pref as WaitlistInput['notification_pref'] } : {}),
  };
  const errors = validateWaitlistInput(input);
  if (errors.length > 0) {
    res.status(400).json({ ok: false, errors });
    return;
  }
  // Sprint 7 (Sprint 4 follow-up): Function-side published-catalog
  // validation. A waitlist entry for a draft or unknown perfume must never
  // be created — the client list is not a trust boundary.
  const perfumeSnap = await db.collection('perfumes').doc(input.perfume_id.trim()).get();
  if (!perfumeSnap.exists || !isPublishedPerfume(perfumeSnap.data() as { data_status?: string })) {
    res.status(404).json({ ok: false, error: 'perfume_not_available' });
    return;
  }
  const id = waitlistDocId(input.email, input.perfume_id, input.size_ml);
  const ref = db.collection('waitlist_entries').doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    // Dedup: identical submit returns the existing entry WITHOUT overwriting
    // its status and WITHOUT re-sending a confirmation email.
    const existing = snap.data() as { status?: string } | undefined;
    res.status(200).json({ ok: true, already: true, entryId: id, status: existing?.status ?? 'pending_confirm', emailSent: false });
    return;
  }
  const now = Date.now();
  const { entry, token } = createPendingEntry(input, now);
  await ref.set({
    ...entry,
    created_at: FieldValue.serverTimestamp(),
    confirmed_at: null,
  });
  let emailSent = false;
  const confirmBase = process.env.WAITLIST_CONFIRM_URL;
  if (confirmBase) {
    const transport = getMailTransport() ?? logOnlyTransport();
    emailSent = await transport.sendConfirmation(entry.email, buildConfirmationLink(confirmBase, id, token));
  } else {
    console.log('[waitlist] WAITLIST_CONFIRM_URL not configured — confirmation email NOT sent; entry stays pending_confirm');
  }
  res.status(200).json({ ok: true, already: false, entryId: id, status: 'pending_confirm', emailSent });
});

export const waitlistConfirm = onRequest({ region: 'asia-southeast2', cors: false }, async (req, res) => {
  res.set('X-Robots-Tag', 'noindex');
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!id || !token) {
    const page = waitlistPage('Tautan tidak lengkap', 'Tautan konfirmasi ini tidak memuat data yang diperlukan. Silakan daftar ulang lewat halaman Try It First.', 400);
    res.status(page.status).send(page.html);
    return;
  }
  const ref = db.collection('waitlist_entries').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    const page = waitlistPage('Entri tidak ditemukan', 'Entri daftar tunggu ini tidak ditemukan. Mungkin sudah dihapus atau tautannya salah.', 404);
    res.status(page.status).send(page.html);
    return;
  }
  const data = snap.data() as Record<string, unknown>;
  const entry: WaitlistEntry = {
    id: snap.id,
    email: typeof data.email === 'string' ? data.email : '',
    perfume_id: typeof data.perfume_id === 'string' ? data.perfume_id : '',
    size_ml: data.size_ml as WaitlistEntry['size_ml'],
    status: data.status as WaitlistEntry['status'],
    token_hash: typeof data.token_hash === 'string' ? data.token_hash : null,
    token_expires_at_ms: typeof data.token_expires_at_ms === 'number' ? data.token_expires_at_ms : null,
    created_at_ms: typeof data.created_at_ms === 'number' ? data.created_at_ms : 0,
    confirmed_at_ms: typeof data.confirmed_at_ms === 'number' ? data.confirmed_at_ms : null,
  };
  const result = confirmEntry(entry, token, Date.now());
  if (!result.ok) {
    if (result.reason === 'already_confirmed') {
      const page = waitlistPage('Sudah terkonfirmasi', 'Pendaftaran kamu sudah terkonfirmasi sebelumnya. Kami akan memberi kabar saat batch Try It First dibuka.');
      res.status(page.status).send(page.html);
      return;
    }
    if (result.reason === 'expired') {
      const page = waitlistPage('Tautan kedaluwarsa', 'Tautan konfirmasi ini sudah lewat 7 hari. Silakan daftar ulang lewat halaman Try It First untuk menerima tautan baru.', 410);
      res.status(page.status).send(page.html);
      return;
    }
    const page = waitlistPage('Tautan tidak valid', 'Tautan konfirmasi ini tidak valid. Silakan daftar ulang lewat halaman Try It First.', 400);
    res.status(page.status).send(page.html);
    return;
  }
  await ref.update({
    status: 'active',
    token_hash: null,
    token_expires_at_ms: null,
    confirmed_at: FieldValue.serverTimestamp(),
    confirmed_at_ms: result.entry.confirmed_at_ms,
  });
  const page = waitlistPage('Pendaftaran terkonfirmasi', 'Terima kasih! Minat kamu sudah terkonfirmasi dan dihitung sebagai permintaan terkonfirmasi. Kami akan memberi kabar saat batch Try It First dibuka.');
  res.status(page.status).send(page.html);
});

/* ── Sprint 7: resend confirmation email ───────────────────────────────
 * POST /waitlist/resend (function `waitlistResend`): re-sends the
 * double-opt-in link for a still-pending entry. Issues a FRESH token (the
 * old link dies) with a fresh 7-day expiry, guarded by a 15-minute
 * per-entry cooldown (anti-spam) and the same published-catalog check as
 * create. Already-confirmed entries return 200 with already:true and NO
 * email (mirroring the create dedup response). The response reports the
 * honest `emailSent` boolean, same as create.
 * Deploy (FOUNDER console action — Blaze required, same as /go):
 *   firebase deploy --only functions:waitlist,functions:waitlistConfirm,functions:waitlistResend
 */
export const waitlistResend = onRequest({ region: 'asia-southeast2', cors: true }, async (req, res) => {
  res.set('X-Robots-Tag', 'noindex');
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  if (!waitlistLimiter.allow(waitlistClientIp(req))) {
    res.status(429).json({ ok: false, error: 'rate_limited' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const input: WaitlistInput = {
    email: typeof body.email === 'string' ? body.email : '',
    perfume_id: typeof body.perfume_id === 'string' ? body.perfume_id : '',
    size_ml: body.size_ml as WaitlistInput['size_ml'],
  };
  const errors = validateWaitlistInput(input);
  if (errors.length > 0) {
    res.status(400).json({ ok: false, errors });
    return;
  }
  const id = waitlistDocId(input.email, input.perfume_id, input.size_ml);
  const ref = db.collection('waitlist_entries').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    res.status(404).json({ ok: false, error: 'entry_not_found' });
    return;
  }
  const data = snap.data() as Record<string, unknown>;
  const entry: WaitlistEntry = {
    id,
    email: typeof data.email === 'string' ? data.email : '',
    perfume_id: typeof data.perfume_id === 'string' ? data.perfume_id : '',
    size_ml: data.size_ml as WaitlistEntry['size_ml'],
    status: data.status as WaitlistEntry['status'],
    token_hash: typeof data.token_hash === 'string' ? data.token_hash : null,
    token_expires_at_ms: typeof data.token_expires_at_ms === 'number' ? data.token_expires_at_ms : null,
    created_at_ms: typeof data.created_at_ms === 'number' ? data.created_at_ms : 0,
    confirmed_at_ms: typeof data.confirmed_at_ms === 'number' ? data.confirmed_at_ms : null,
    ...(typeof data.last_resend_at_ms === 'number' ? { last_resend_at_ms: data.last_resend_at_ms } : {}),
  };
  const perfumeSnap = await db.collection('perfumes').doc(entry.perfume_id).get();
  if (!perfumeSnap.exists || !isPublishedPerfume(perfumeSnap.data() as { data_status?: string })) {
    res.status(404).json({ ok: false, error: 'perfume_not_available' });
    return;
  }
  const result = resendConfirmation(entry, Date.now());
  if (!result.ok) {
    if (result.reason === 'already_confirmed') {
      res.status(200).json({ ok: true, already: true, entryId: id, status: 'active', emailSent: false });
      return;
    }
    const status = result.reason === 'too_soon' ? 429 : result.reason === 'expired' ? 410 : 400;
    res.status(status).json({
      ok: false,
      error: result.reason,
      ...(result.retryAfterMs !== undefined ? { retryAfterMs: result.retryAfterMs } : {}),
    });
    return;
  }
  await ref.update({
    token_hash: result.entry.token_hash,
    token_expires_at_ms: result.entry.token_expires_at_ms,
    last_resend_at_ms: result.entry.last_resend_at_ms,
  });
  let emailSent = false;
  const confirmBase = process.env.WAITLIST_CONFIRM_URL;
  if (confirmBase) {
    const transport = getMailTransport() ?? logOnlyTransport();
    emailSent = await transport.sendConfirmation(entry.email, buildConfirmationLink(confirmBase, id, result.token));
  } else {
    console.log('[waitlistResend] WAITLIST_CONFIRM_URL not configured — confirmation email NOT sent; entry stays pending_confirm');
  }
  await ref.update({ emailSent });
  res.status(200).json({ ok: true, entryId: id, status: 'pending_confirm', emailSent });
});
