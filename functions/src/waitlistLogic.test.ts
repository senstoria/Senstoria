import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateWaitlistInput,
  waitlistDocId,
  createPendingEntry,
  confirmEntry,
  buildConfirmationLink,
  hashConfirmationToken,
  countConfirmedDemand,
  countPendingDemand,
  WAITLIST_TOKEN_TTL_MS,
  type WaitlistEntry,
} from './waitlistLogic.js';

describe('Sprint 4 waitlist backend logic', () => {
  it('validation rejects bad email, missing perfume, bad size', () => {
    assert.deepStrictEqual(
      validateWaitlistInput({ email: 'not-an-email', perfume_id: 'prf_013', size_ml: 5 }),
      ['invalid_email']
    );
    assert.deepStrictEqual(
      validateWaitlistInput({ email: 'a@b.co', perfume_id: '', size_ml: 5 }),
      ['missing_perfume_id']
    );
    assert.deepStrictEqual(
      validateWaitlistInput({ email: 'a@b.co', perfume_id: 'prf_013', size_ml: 7 as never }),
      ['invalid_size_ml']
    );
    assert.deepStrictEqual(
      validateWaitlistInput({ email: 'A@B.CO', perfume_id: 'prf_013', size_ml: 2 }),
      []
    );
  });

  it('dedup: 2 identical submits produce the same doc id (email normalized)', () => {
    const a = waitlistDocId('Kolektor@Senstoria.id ', 'prf_013', 5);
    const b = waitlistDocId('kolektor@senstoria.id', 'prf_013', 5);
    assert.strictEqual(a, b);
    assert.notStrictEqual(a, waitlistDocId('kolektor@senstoria.id', 'prf_013', 2));
    assert.notStrictEqual(a, waitlistDocId('kolektor@senstoria.id', 'prf_014', 5));
    assert.notStrictEqual(a, waitlistDocId('other@senstoria.id', 'prf_013', 5));
  });

  it('new entry is pending_confirm with a hashed (never raw) token and 7-day expiry', () => {
    const now = Date.now();
    const { entry, token } = createPendingEntry(
      { email: 'kolektor@senstoria.id', perfume_id: 'prf_013', size_ml: 5 },
      now
    );
    assert.strictEqual(entry.status, 'pending_confirm');
    assert.strictEqual(entry.token_hash, hashConfirmationToken(token));
    assert.notStrictEqual(entry.token_hash, token);
    assert.strictEqual(entry.token_expires_at_ms, now + WAITLIST_TOKEN_TTL_MS);
    assert.strictEqual(entry.confirmed_at_ms, null);
    assert.strictEqual(entry.id, waitlistDocId('kolektor@senstoria.id', 'prf_013', 5));
  });

  it('confirmation link carries id + token; confirming flips status and clears the token', () => {
    const now = Date.now();
    const { entry, token } = createPendingEntry(
      { email: 'kolektor@senstoria.id', perfume_id: 'prf_014', size_ml: 10 },
      now
    );
    const link = buildConfirmationLink('https://example.invalid/waitlist/confirm', entry.id, token);
    assert.ok(link.includes(`id=${entry.id}`));
    assert.ok(link.includes(`token=${token}`));
    const res = confirmEntry(entry, token, now + 1000);
    assert.strictEqual(res.ok, true);
    if (res.ok) {
      assert.strictEqual(res.entry.status, 'active');
      assert.strictEqual(res.entry.token_hash, null);
      assert.strictEqual(res.entry.confirmed_at_ms, now + 1000);
    }
  });

  it('wrong token, expired token, and re-confirm are all rejected', () => {
    const now = Date.now();
    const { entry, token } = createPendingEntry(
      { email: 'kolektor@senstoria.id', perfume_id: 'prf_013', size_ml: 2 },
      now
    );
    assert.deepStrictEqual(confirmEntry(entry, 'wrong-token', now).ok, false);
    const expired = confirmEntry(entry, token, now + WAITLIST_TOKEN_TTL_MS + 1);
    assert.strictEqual(expired.ok, false);
    if (!expired.ok) assert.strictEqual(expired.reason, 'expired');
    const confirmed = confirmEntry(entry, token, now + 1000);
    assert.strictEqual(confirmed.ok, true);
    if (confirmed.ok) {
      const again = confirmEntry(confirmed.entry, token, now + 2000);
      assert.strictEqual(again.ok, false);
      if (!again.ok) assert.strictEqual(again.reason, 'already_confirmed');
    }
  });

  it('confirmed-demand counts exclude pending_confirm entries', () => {
    const entries: Pick<WaitlistEntry, 'status'>[] = [
      { status: 'pending_confirm' },
      { status: 'pending_confirm' },
      { status: 'active' },
      { status: 'notified' },
      { status: 'withdrawn' },
    ];
    assert.strictEqual(countConfirmedDemand(entries), 2);
    assert.strictEqual(countPendingDemand(entries), 2);
  });
});
