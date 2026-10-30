import { describe, it } from 'node:test';
import assert from 'node:assert';
import { type WaitlistState } from './derivedCalculations.ts';

describe('Try It First waitlist (Sprint 4): backend entry shape, no prices', () => {
  it('WaitlistState carries the double opt-in vocabulary and no price fields', () => {
    const pending: WaitlistState = {
      id: 'wait_123',
      email: 'kolektor@senstoria.id',
      perfume_id: 'prf_013',
      perfume_name: 'The Perfection',
      brand: 'HMNS',
      size_ml: 5,
      whatsapp_number: '+628123456789',
      notification_pref: 'whatsapp',
      status: 'pending_confirm',
      created_at: new Date().toISOString()
    };
    const confirmed: WaitlistState = {
      ...pending,
      id: 'wait_124',
      status: 'active',
      confirmed_at: new Date().toISOString()
    };

    assert.strictEqual(pending.size_ml, 5);
    assert.strictEqual(pending.status, 'pending_confirm');
    assert.strictEqual(confirmed.status, 'active');
    // No price fields exist on the shape (D-04: Q13 undecided).
    assert.strictEqual('fair_price_idr' in pending, false);
    assert.strictEqual('willingness' in pending, false);
    // Confirmed demand excludes pending entries.
    const entries = [pending, confirmed];
    assert.strictEqual(entries.filter(e => e.status === 'active' || e.status === 'notified').length, 1);
  });
});
