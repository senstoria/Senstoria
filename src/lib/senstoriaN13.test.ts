// Fase N13 (P11) — tes logika berbagi cerita opt-in.
// Token acak + format, aturan G15 → nama tampil/tidak, pencabutan
// (lewat parse), validasi cerita min. 20 karakter, path /s/<token>.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_SHAREABLE_STORY_CHARS,
  generateShareToken,
  isShareToken,
  isShareableStory,
  resolveSharedDisplayName,
  sharedStoryUrl,
  parseSharedStoryPath,
  buildSharedStoryDoc,
  parseSharedStory,
  type SharedStoryDoc,
} from './storySharingN13.ts';
import type { StoryState } from './derivedCalculations.ts';

const baseStory = (over: Partial<StoryState> = {}): StoryState => ({
  id: 'story_test1',
  user_id: 'user_1',
  user_name: 'Ja’far',
  perfume_id: 'prf_013',
  title: 'Malam di Jakarta',
  body: 'Aroma ini mengingatkanku pada malam hujan pertama.',
  status: 'published',
  story_date: '2026-11-28',
  created_at: '2026-11-28T10:00:00.000Z',
  ...over,
});

test('Fase N13 — token: 43 karakter URL-safe, tidak bisa ditebak', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const token = generateShareToken();
    assert.equal(token.length, 43, `panjang token ${token.length}`);
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(isShareToken(token));
    assert.ok(!seen.has(token), `token duplikat: ${token}`);
    seen.add(token);
  }
  // Token bukan turunan id cerita / user_id.
  const token = generateShareToken();
  assert.ok(!token.includes('story_test1'));
  assert.ok(!token.includes('user_1'));
});

test('Fase N13 — token: sumber acak injeksi tetap berbentuk benar', () => {
  const token = generateShareToken(() => new Uint8Array(32).fill(7));
  assert.equal(token.length, 43);
  assert.ok(isShareToken(token));
  // 32 byte identik → base64url yang deterministik, bukan string kosong.
  assert.notEqual(token, '');
});

test('Fase N13 — isShareToken menolak bentuk yang salah', () => {
  assert.equal(isShareToken(''), false);
  assert.equal(isShareToken('short'), false);
  assert.equal(isShareToken('a'.repeat(42)), false);
  assert.equal(isShareToken('a'.repeat(44)), false);
  assert.equal(isShareToken('abc+def/ghi=' + 'a'.repeat(31)), false);
  assert.equal(isShareToken(null), false);
  assert.equal(isShareToken(123), false);
});

test('Fase N13 — isShareableStory: hanya cerita tertulis published >= 20 karakter', () => {
  assert.equal(isShareableStory(baseStory()), true);
  assert.equal(isShareableStory(baseStory({ status: 'draft' })), false);
  assert.equal(isShareableStory(baseStory({ body: 'Terlalu pendek.' })), false);
  assert.equal(isShareableStory(baseStory({ body: '12345678901234567890' })), true); // tepat 20
  assert.equal(isShareableStory(baseStory({ body: '1234567890123456789' })), false); // 19
  assert.equal(isShareableStory(baseStory({ body: '   ' })), false);
  assert.equal(isShareableStory(baseStory({ deleted_at: '2026-11-28T00:00:00.000Z' })), false);
  assert.equal(isShareableStory(null), false);
  assert.equal(isShareableStory(undefined), false);
  assert.equal(MIN_SHAREABLE_STORY_CHARS, 20);
});

test('Fase N13 — G15: Privat TIDAK PERNAH menampilkan nama', () => {
  assert.equal(resolveSharedDisplayName('private', 'Ja’far'), null);
  assert.equal(resolveSharedDisplayName('private', ''), null);
  assert.equal(resolveSharedDisplayName('private', null), null);
  assert.equal(resolveSharedDisplayName('everyone', 'Ja’far'), 'Ja’far');
  assert.equal(resolveSharedDisplayName('members', 'Ja’far'), 'Ja’far');
  assert.equal(resolveSharedDisplayName('everyone', '  '), null);
  assert.equal(resolveSharedDisplayName('everyone', null), null);
  assert.equal(resolveSharedDisplayName('members', '  Rani  '), 'Rani');
});

test('Fase N13 — buildSharedStoryDoc: nama diputuskan sekali dari G15', () => {
  const privat = buildSharedStoryDoc({
    story: baseStory(), userId: 'user_1', visibility: 'private',
    nickname: 'Ja’far', perfumeBrand: 'HMNS', perfumeName: 'The Perfection',
    nowIso: '2026-11-28T10:00:00.000Z',
  });
  assert.equal(privat.display_name, null);
  assert.equal(privat.revoked, false);
  assert.equal(privat.revoked_at, null);
  assert.equal(privat.report_count, 0);
  assert.equal(privat.reported_at, null);
  assert.equal(privat.story_id, 'story_test1');
  assert.equal(privat.user_id, 'user_1');
  assert.equal(privat.body, baseStory().body);
  assert.ok(isShareToken(privat.token));

  const publik = buildSharedStoryDoc({
    story: baseStory(), userId: 'user_1', visibility: 'everyone',
    nickname: 'Ja’far', perfumeBrand: 'HMNS', perfumeName: 'The Perfection',
    token: 'A'.repeat(43), nowIso: '2026-11-28T10:00:00.000Z',
  });
  assert.equal(publik.display_name, 'Ja’far');
  assert.equal(publik.token, 'A'.repeat(43));

  // Token dari pemanggil yang bentuknya salah → dibuatkan token baru.
  const fixed = buildSharedStoryDoc({
    story: baseStory(), userId: 'user_1', visibility: 'everyone',
    nickname: 'Ja’far', perfumeBrand: 'HMNS', perfumeName: 'The Perfection',
    token: 'story_test1', nowIso: '2026-11-28T10:00:00.000Z',
  });
  assert.ok(isShareToken(fixed.token));
  assert.notEqual(fixed.token, 'story_test1');
});

test('Fase N13 — sharedStoryUrl + parseSharedStoryPath', () => {
  const token = 'B'.repeat(43);
  assert.equal(sharedStoryUrl('https://senstoria.app', token), `https://senstoria.app/s/${token}`);
  assert.equal(sharedStoryUrl('https://senstoria.app/', token), `https://senstoria.app/s/${token}`);
  assert.equal(parseSharedStoryPath(`/s/${token}`), token);
  assert.equal(parseSharedStoryPath(`/s/${token}/`), token);
  // Segmen yang bentuknya bukan token sah tetap dikembalikan — halaman
  // berbagi yang menampilkan "tidak ditemukan", bukan Beranda diam-diam.
  assert.equal(parseSharedStoryPath('/s/short'), 'short');
  assert.equal(parseSharedStoryPath('/s/'), null);
  assert.equal(parseSharedStoryPath('/catalog/hmns-the-perfection'), null);
  assert.equal(parseSharedStoryPath('/'), null);
  assert.equal(parseSharedStoryPath(`/s/${token}/extra`), null);
});

test('Fase N13 — parseSharedStory: dokumen rusak dibuang', () => {
  const good: SharedStoryDoc = buildSharedStoryDoc({
    story: baseStory(), userId: 'user_1', visibility: 'everyone',
    nickname: 'Ja’far', perfumeBrand: 'HMNS', perfumeName: 'The Perfection',
    token: 'C'.repeat(43), nowIso: '2026-11-28T10:00:00.000Z',
  });
  const parsed = parseSharedStory({ ...good, id: 'C'.repeat(43) });
  assert.ok(parsed);
  assert.equal(parsed?.token, 'C'.repeat(43));
  assert.equal(parsed?.display_name, 'Ja’far');

  // Tanpa id pun sah (getDoc tanpa id eksplisit).
  assert.ok(parseSharedStory(good));

  // Token tidak cocok dengan id dokumen → buang.
  assert.equal(parseSharedStory({ ...good, id: 'D'.repeat(43) }), null);
  // Isi < 20 karakter → buang.
  assert.equal(parseSharedStory({ ...good, body: 'pendek' }), null);
  // revoked bukan boolean → buang.
  assert.equal(parseSharedStory({ ...good, revoked: 'no' }), null);
  // report_count negatif → buang.
  assert.equal(parseSharedStory({ ...good, report_count: -1 }), null);
  // display_name bukan string/null → buang.
  assert.equal(parseSharedStory({ ...good, display_name: 42 }), null);
  // Bukan objek → buang.
  assert.equal(parseSharedStory(null), null);
  assert.equal(parseSharedStory('teks'), null);
  assert.equal(parseSharedStory({}), null);
});
