/**
 * Sprint 1 — Firestore Rules v1 matrix (§5.5 + extras), via the Firestore
 * emulator REST API.
 *
 * Why REST: the JS SDK path (rules-unit-testing) cannot talk to the emulator
 * in this sandbox — the SDK's HTTP/2 stream fails with RST_STREAM "Protocol
 * error" and the client goes offline, for both Node 24 and Bun, with and
 * without proxy env vars. The emulator itself is healthy (direct jar run,
 * --host 127.0.0.1): REST over HTTP/1.1 enforces the same rules engine.
 * Auth is via unsigned JWTs (alg=none), which the emulator decodes without
 * signature verification; "Bearer owner" bypasses rules for seeding only.
 *
 * Run: emulator must be running (direct jar, --rules firestore.rules),
 * then: node rules-rest.test.mjs
 * Exit code 0 = every case passed.
 */
const BASE = 'http://127.0.0.1:8080/v1/projects/demo-sprint1-rules/databases/(default)/documents';

function b64url(s) {
  return Buffer.from(s).toString('base64url');
}
function token(claims) {
  return `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}.`;
}
const TOK = {
  owner: token({ sub: 'owner-1', email: 'owner@example.com' }),
  other: token({ sub: 'other-1', email: 'other@example.com' }),
  admin: token({ sub: 'admin-1', email: 'admin@example.com', admin: true }),
  newuser: token({ sub: 'new-user-9', email: 'new@example.com' }),
  ownerToken: 'owner',
};
const ANON = null;

function enc(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number') return { doubleValue: v };
  throw new Error(`unsupported value type ${typeof v}`);
}
const fields = (obj) => ({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, enc(v)])) });

async function req(method, path, { token: tok = ANON, body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

const getDoc = (coll, id, tok) => req('GET', `/${coll}/${id}`, { token: tok });
const putDoc = (coll, id, obj, tok) => req('PATCH', `/${coll}/${id}`, { token: tok, body: fields(obj) });
const delDoc = (coll, id, tok) => req('DELETE', `/${coll}/${id}`, { token: tok });
// Sprint 2: subcollection documents (wishlist/{uid}/items/{perfumeId}).
const putSubDoc = (path, obj, tok) => req('PATCH', `/${path}`, { token: tok, body: fields(obj) });
const getSubDoc = (path, tok) => req('GET', `/${path}`, { token: tok });
const delSubDoc = (path, tok) => req('DELETE', `/${path}`, { token: tok });
async function runQuery(coll, whereClause, tok) {
  const q = { structuredQuery: { from: [{ collectionId: coll }] } };
  if (whereClause) q.structuredQuery.where = whereClause;
  return req('POST', ':runQuery', { token: tok, body: q });
}
const fieldEq = (field, value) => ({
  fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: enc(value) },
});

let passed = 0;
const failures = [];
async function expect(name, promise, allowed) {
  try {
    const { status } = await promise;
    const ok = allowed ? status >= 200 && status < 300 : status === 403 || status === 401;
    if (ok) {
      passed++;
      console.log(`PASS ${name} [${status}]`);
    } else {
      failures.push(name);
      console.log(`FAIL ${name}: expected ${allowed ? '2xx' : '403'}, got ${status}`);
    }
  } catch (e) {
    failures.push(name);
    console.log(`FAIL ${name}: ${e.message}`);
  }
}

// ---- Seed (rules bypassed, owner token) ----
const seed = [
  ['perfumes', 'pub-1', { data_status: 'published', name: 'Published One' }],
  ['perfumes', 'draft-1', { data_status: 'draft', name: 'Draft One' }],
  ['bottles', 'b1', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 31, status: 'in_use' }],
  ['wear_logs', 'w1', { user_id: 'owner-1', bottle_id: 'b1', perfume_id: 'pub-1', client_op_id: 'op-1', sprays: 2 }],
  ['scent_stories', 's1', { user_id: 'owner-1', body: 'A story with enough length here.', is_published: false }],
  ['reviews', 'r-approved', { user_id: 'other-1', perfume_id: 'pub-1', rating: 5, status: 'approved', helpful_count: 0 }],
  ['reviews', 'r-pending', { user_id: 'other-1', perfume_id: 'pub-1', rating: 4, status: 'pending_moderation', helpful_count: 0 }],
  ['users', 'owner-1', { email: 'owner@example.com', consent_version: '1.0' }],
  ['users', 'other-1', { email: 'other@example.com', consent_version: '1.0' }],
];
for (const [coll, id, obj] of seed) {
  const r = await putDoc(coll, id, obj, TOK.ownerToken);
  if (r.status < 200 || r.status >= 300) throw new Error(`seed ${coll}/${id} failed: ${r.status} ${r.body}`);
}
console.log('seed: ok');

// ---- §5.5 matrix ----
await expect('anon read published perfume ALLOW', getDoc('perfumes', 'pub-1', ANON), true);
await expect('anon read draft perfume DENY', getDoc('perfumes', 'draft-1', ANON), false);
await expect('anon read others bottles DENY', getDoc('bottles', 'b1', ANON), false);
await expect('anon read others wear_logs DENY', getDoc('wear_logs', 'w1', ANON), false);
await expect('anon read others stories DENY', getDoc('scent_stories', 's1', ANON), false);
await expect('owner read own bottle ALLOW', getDoc('bottles', 'b1', TOK.owner), true);
await expect('owner create valid bottle ALLOW', putDoc('bottles', 'b2', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 10, status: 'sealed' }, TOK.owner), true);
await expect('owner create bottle remaining>size DENY', putDoc('bottles', 'b3', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 60, status: 'in_use' }, TOK.owner), false);
await expect('owner create bottle negative remaining DENY', putDoc('bottles', 'b4', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: -1, status: 'in_use' }, TOK.owner), false);
await expect('owner create bottle size 0 DENY', putDoc('bottles', 'b5', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 0, remaining_ml: 0, status: 'in_use' }, TOK.owner), false);
await expect('other read owner bottle DENY', getDoc('bottles', 'b1', TOK.other), false);
await expect('other update owner bottle DENY', putDoc('bottles', 'b1', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 5, status: 'in_use' }, TOK.other), false);
await expect('owner update own bottle ALLOW', putDoc('bottles', 'b1', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 25, status: 'in_use' }, TOK.owner), true);
await expect('anon list reviews no filter DENY', runQuery('reviews', null, ANON), false);
await expect('anon list reviews status=approved ALLOW', runQuery('reviews', fieldEq('status', 'approved'), ANON), true);
await expect('anon get pending_moderation review DENY', getDoc('reviews', 'r-pending', ANON), false);
await expect('anon get approved review ALLOW', getDoc('reviews', 'r-approved', ANON), true);
await expect('non-admin write perfumes DENY', putDoc('perfumes', 'pub-2', { data_status: 'published' }, TOK.owner), false);
await expect('admin write perfumes ALLOW', putDoc('perfumes', 'pub-2', { data_status: 'published' }, TOK.admin), true);
await expect('non-admin write feature_flags DENY', putDoc('feature_flags', 'f1', { key: 'x', enabled: true }, TOK.owner), false);
await expect('admin write feature_flags ALLOW', putDoc('feature_flags', 'f1', { key: 'x', enabled: true }, TOK.admin), true);
await expect('anon read feature_flags DENY', getDoc('feature_flags', 'f1', ANON), false);
await expect('client create affiliate_clicks DENY (anon)', putDoc('affiliate_clicks', 'c1', { click_id: 'c1' }, ANON), false);
await expect('client create affiliate_clicks DENY (authed)', putDoc('affiliate_clicks', 'c2', { click_id: 'c2' }, TOK.owner), false);
await expect('anon read other user doc DENY', getDoc('users', 'owner-1', ANON), false);
await expect('owner read own user doc ALLOW', getDoc('users', 'owner-1', TOK.owner), true);
await expect('list bottles without user filter DENY', runQuery('bottles', null, TOK.owner), false);
await expect('list bottles with user filter ALLOW', runQuery('bottles', fieldEq('user_id', 'owner-1'), TOK.owner), true);

// ---- Sprint 1 extras ----
await expect('review create rating 6 DENY', putDoc('reviews', 'rx1', { user_id: 'owner-1', perfume_id: 'pub-1', rating: 6, status: 'pending_moderation' }, TOK.owner), false);
await expect('review create status approved DENY (no self-approve)', putDoc('reviews', 'rx2', { user_id: 'owner-1', perfume_id: 'pub-1', rating: 5, status: 'approved' }, TOK.owner), false);
await expect('review create valid pending_moderation ALLOW', putDoc('reviews', 'rx3', { user_id: 'owner-1', perfume_id: 'pub-1', rating: 5, status: 'pending_moderation', helpful_count: 0 }, TOK.owner), true);
await expect('review create helpful_count>0 DENY', putDoc('reviews', 'rx4', { user_id: 'owner-1', perfume_id: 'pub-1', rating: 5, status: 'pending_moderation', helpful_count: 8 }, TOK.owner), false);

// ---- Sprint 4: moderation vocabulary + admin list/update ----
// Order matters: owner cases run while r-pending is still pending_moderation;
// the admin approval runs last because it flips the seeded doc to approved.
await expect('admin list reviews ALLOW (sees pending queue)', runQuery('reviews', null, TOK.admin), true);
await expect('owner update keeping pending_moderation ALLOW', putDoc('reviews', 'r-pending', { user_id: 'other-1', perfume_id: 'pub-1', rating: 4, status: 'pending_moderation', helpful_count: 0 }, TOK.other), true);
await expect('owner update to approved DENY (no self-approve)', putDoc('reviews', 'r-pending', { user_id: 'other-1', perfume_id: 'pub-1', rating: 4, status: 'approved', helpful_count: 0 }, TOK.other), false);
await expect('admin update pending_moderation -> approved ALLOW', putDoc('reviews', 'r-pending', { user_id: 'other-1', perfume_id: 'pub-1', rating: 4, status: 'approved', helpful_count: 0 }, TOK.admin), true);
await expect('admin update approved -> rejected ALLOW', putDoc('reviews', 'r-pending', { user_id: 'other-1', perfume_id: 'pub-1', rating: 4, status: 'rejected', helpful_count: 0 }, TOK.admin), true);
await expect('story create is_published true DENY', putDoc('scent_stories', 's2', { user_id: 'owner-1', body: 'Another story with enough length.', is_published: true }, TOK.owner), false);
await expect('story create private ALLOW', putDoc('scent_stories', 's3', { user_id: 'owner-1', body: 'Another story with enough length.', is_published: false }, TOK.owner), true);
await expect('waitlist create DENY (anon)', putDoc('waitlist_entries', 'w1', { email: 'a@b.co' }, ANON), false);
await expect('waitlist create DENY (authed)', putDoc('waitlist_entries', 'w2', { email: 'owner@example.com' }, TOK.owner), false);
await expect('users create with birth_date field DENY', putDoc('users', 'new-bd', { email: 'other@example.com', consent_version: '1.0', birth_date: '2000-01-01' }, TOK.other), false);
await expect('users create email != token email DENY', putDoc('users', 'new-email', { email: 'someone-else@example.com', consent_version: '1.0' }, TOK.other), false);
await expect('users create valid ALLOW (no age boolean required)', putDoc('users', 'new-user-9', { email: 'new@example.com', consent_version: '1.0' }, TOK.newuser), true);
await expect('wear_log create sprays 0 DENY', putDoc('wear_logs', 'w2', { user_id: 'owner-1', bottle_id: 'b1', perfume_id: 'pub-1', client_op_id: 'op-2', sprays: 0 }, TOK.owner), false);
await expect('wear_log create valid ALLOW', putDoc('wear_logs', 'w3', { user_id: 'owner-1', bottle_id: 'b1', perfume_id: 'pub-1', client_op_id: 'op-3', sprays: 1 }, TOK.owner), true);
await expect('sample_orders create DENY', putDoc('sample_orders', 'o1', { order_number: 'ORD-1' }, TOK.owner), false);
await expect('admin read draft perfume ALLOW', getDoc('perfumes', 'draft-1', TOK.admin), true);
await expect('non-admin read feature_flags DENY', getDoc('feature_flags', 'f1', TOK.owner), false);
await expect('owner delete own bottle ALLOW', delDoc('bottles', 'b2', TOK.owner), true);
await expect('other delete owner bottle DENY', delDoc('bottles', 'b1', TOK.other), false);

// ---- Sprint 2: wishlist/compare per-account rules + canonical wear-log fields ----
// Wishlist (BR-03): owner-only CRUD under wishlist/{uid}/items/{perfumeId}.
await expect('owner create wishlist item ALLOW', putSubDoc('wishlist/owner-1/items/prf_002', { perfume_id: 'prf_002' }, TOK.owner), true);
await expect('other create wishlist item under owner uid DENY', putSubDoc('wishlist/owner-1/items/prf_003', { perfume_id: 'prf_003' }, TOK.other), false);
await expect('anon read wishlist item DENY', getSubDoc('wishlist/owner-1/items/prf_002', ANON), false);
await expect('owner read own wishlist item ALLOW', getSubDoc('wishlist/owner-1/items/prf_002', TOK.owner), true);
await expect('other read owner wishlist item DENY', getSubDoc('wishlist/owner-1/items/prf_002', TOK.other), false);
await expect('owner delete own wishlist item ALLOW', delSubDoc('wishlist/owner-1/items/prf_002', TOK.owner), true);
// Compare: same owner-only shape, max 3 enforced in client code (not rules).
await expect('owner create compare item ALLOW', putSubDoc('compare/owner-1/items/prf_001', { perfume_id: 'prf_001' }, TOK.owner), true);
await expect('other create compare item under owner uid DENY', putSubDoc('compare/owner-1/items/prf_003', { perfume_id: 'prf_003' }, TOK.other), false);
await expect('anon read compare item DENY', getSubDoc('compare/owner-1/items/prf_001', ANON), false);
await expect('owner read own compare item ALLOW', getSubDoc('compare/owner-1/items/prf_001', TOK.owner), true);
// Wear logs: legacy field names are rejected — the client must write the
// canonical §5.2 names (sprays, not sprays_count), or create is denied.
await expect('wear_log create legacy sprays_count DENY', putDoc('wear_logs', 'w4', { user_id: 'owner-1', bottle_id: 'b1', perfume_id: 'pub-1', client_op_id: 'op-4', sprays_count: 3 }, TOK.owner), false);
await expect('wear_log create canonical worn_at/ml_used ALLOW', putDoc('wear_logs', 'w5', { user_id: 'owner-1', bottle_id: 'b1', perfume_id: 'pub-1', client_op_id: 'op-5', sprays: 3, worn_at: '2026-10-30T06:00:00Z', ml_used: 0.5 }, TOK.owner), true);
// Soft-delete: owner may flag own bottle/wear-log with deleted_at (update
// keeps bounds from the existing document, so this must stay ALLOW).
// NOTE: REST PATCH without an update mask replaces the document, so the
// harness sends the full merged document here; the real client uses
// updateDoc, which merges by construction (b1 currently: 50 ml, 25 ml
// remaining, in_use, after the earlier update case).
await expect('owner soft-delete own bottle ALLOW', putDoc('bottles', 'b1', { user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 25, status: 'in_use', deleted_at: '2026-10-30T06:00:00Z' }, TOK.owner), true);
await expect('owner soft-delete own wear log ALLOW', putDoc('wear_logs', 'w5', { deleted_at: '2026-10-30T06:00:00Z' }, TOK.owner), true);
await expect('other soft-delete owner bottle DENY', putDoc('bottles', 'b1', { deleted_at: '2026-10-30T06:00:00Z' }, TOK.other), false);

console.log(`\nRESULT: ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('Failed cases:', failures.join(' | '));
  process.exit(1);
}
