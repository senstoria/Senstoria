/**
 * Checklist item 2 (26 Nov 2026) — kejujuran pesan auth.
 *
 * - Pesan unverified dulu menjanjikan kontrol kirim-ulang "di bawah"
 *   yang tidak ada di halaman mana pun. Kini kontrolnya nyata
 *   (AuthContext.resendVerification + tombol di AuthPageView), dan
 *   pesannya merujuk ke tombol itu di kedua bahasa.
 * - Error login TIDAK membedakan email-tak-dikenal dari kata-sandi-
 *   salah: Firebase mengembalikan auth/invalid-credential untuk
 *   keduanya (perlindungan enumerasi email), dan kode lawas
 *   auth/user-not-found / auth/wrong-password dipetakan ke pesan
 *   generik yang sama supaya UI tidak pernah membocorkan apakah
 *   sebuah email terdaftar.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { messageFor } from '../context/AuthContext.tsx';
import { translations } from './i18n.ts';

test('AUTH-02a: invalid-credential, wrong-password, dan user-not-found memetakan ke SATU pesan generik (id)', () => {
  const generic = translations.id.authErrors.invalid_credential;
  assert.equal(messageFor('auth/invalid-credential', 'id'), generic);
  assert.equal(messageFor('auth/wrong-password', 'id'), generic);
  assert.equal(messageFor('auth/user-not-found', 'id'), generic);
});

test('AUTH-02b: invalid-credential, wrong-password, dan user-not-found memetakan ke SATU pesan generik (en)', () => {
  const generic = translations.en.authErrors.invalid_credential;
  assert.equal(messageFor('auth/invalid-credential', 'en'), generic);
  assert.equal(messageFor('auth/wrong-password', 'en'), generic);
  assert.equal(messageFor('auth/user-not-found', 'en'), generic);
});

test('AUTH-02c: pesan generik tidak pernah menyebut email tidak ditemukan', () => {
  assert.ok(!translations.id.authErrors.invalid_credential.toLowerCase().includes('tidak ditemukan'));
  assert.ok(!translations.en.authErrors.invalid_credential.toLowerCase().includes('not found'));
  assert.ok(!('user_not_found' in translations.id.authErrors));
  assert.ok(!('user_not_found' in translations.en.authErrors));
});

test('AUTH-02d: pesan unverified merujuk ke kirim-ulang di bawah, di kedua bahasa', () => {
  assert.ok(translations.id.authErrors.unverified.includes('kirim ulang di bawah'));
  assert.ok(translations.en.authErrors.unverified.includes('resend below'));
});

test('AUTH-02e: kunci kirim-ulang ada dan tidak kosong di kedua bahasa', () => {
  for (const locale of ['id', 'en'] as const) {
    assert.ok(translations[locale].authModal.resendVerification.length > 0);
    assert.ok(translations[locale].authModal.verificationResent.length > 0);
  }
});
