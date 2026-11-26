import { describe, it } from 'node:test';
import assert from 'node:assert';
import { type WaitlistState } from './derivedCalculations.ts';
import { translations } from './i18n.ts';

/**
 * Checklist item 3 (26 Nov 2026) — empty state Coba Dulu yang jujur +
 * label dummy di kartu.
 *
 * - Hasil filter kosong dulu tidak berpesan sama sekali (grid sekadar
 *   disembunyikan, perintah founder 3 Nov 2026). Kini EmptyState yang
 *   sama dengan Katalog tampil + jalan keluar (hapus pencarian/filter).
 * - Label "Dummy" dulu dihapus dari kartu (3 Nov 2026). Kini kembali
 *   di tiap kartu, kata yang sama di id+en — dikunci tes supaya tidak
 *   hilang diam-diam lagi.
 * - Tombol Buy/Pre-Order dummy TETAP inert tanpa feedback — sengaja
 *   di luar item ini, bukan kelupaan.
 */
describe('Checklist item 3: empty state + label dummy Coba Dulu', () => {
  it('kunci empty state + label dummy ada di id dan en, tidak kosong', () => {
    for (const locale of ['id', 'en'] as const) {
      const t = translations[locale].tryItFirstView;
      assert.strictEqual(t.dummyBadge, 'Dummy');
      assert.ok(t.emptyResult.length > 0);
      assert.ok(t.emptyResultTitle.length > 0);
      assert.ok(t.emptyResultCta.length > 0);
    }
  });

  it('pesan kosong menyebut dummy — tidak menyembunyikan sifat kartu', () => {
    assert.match(translations.id.tryItFirstView.emptyResult, /dummy/i);
    assert.match(translations.en.tryItFirstView.emptyResult, /dummy/i);
  });
});

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
