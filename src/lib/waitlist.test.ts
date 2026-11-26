import { describe, it } from 'node:test';
import assert from 'node:assert';
import { submitWaitlist, WAITLIST_TIMEOUT_MS } from './waitlist.ts';

describe('Tahap 2 — B-08: timeout submit waitlist (AbortController)', () => {
  it('permintaan yang menggantung dibatalkan dengan error timeout', async () => {
    const originalFetch = globalThis.fetch;
    // Tiruan fetch yang menggantung selamanya TAPI menghormati sinyal
    // abort — persis seperti fetch asli saat AbortController memutusnya.
    (globalThis as unknown as { fetch: typeof fetch }).fetch = ((
      _url: string,
      init?: RequestInit,
    ) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      })) as typeof fetch;
    try {
      const started = Date.now();
      const result = await submitWaitlist(
        { email: 'kolektor@senstoria.id', perfume_id: 'prf_013', size_ml: 5 },
        { timeoutMs: 50 },
      );
      const elapsed = Date.now() - started;
      assert.deepStrictEqual(result, { ok: false, error: 'timeout' });
      // Selesai karena timeout, bukan karena menunggu selamanya.
      assert.ok(elapsed < 5000, `selesai dalam ${elapsed}ms`);
      assert.ok(elapsed >= 40, `timeout tidak terlalu cepat: ${elapsed}ms`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('batas default 20 detik, dalam rentang 15–30 detik yang diminta', () => {
    assert.ok(WAITLIST_TIMEOUT_MS >= 15_000 && WAITLIST_TIMEOUT_MS <= 30_000);
    assert.strictEqual(WAITLIST_TIMEOUT_MS, 20_000);
  });
});
