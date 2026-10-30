/**
 * Sprint 2 — emulator load test (NOT a unit test): writes 50 sequential
 * wear logs to the Firestore emulator via REST with the owner's JWT
 * (rules enforced, not bypassed), then re-fetches and asserts exact
 * counts through the shared derived module. Also proves the delete
 * consistency rule: soft-deleting one log drops every count by exactly
 * one after a re-fetch ("one refresh").
 *
 * Run: emulator must be running (direct jar, --rules firestore.rules,
 * project demo-sprint1-rules), then: tsx scripts/sprint2-emu-load-test.ts
 * Exit code 0 = all assertions passed.
 */
import assert from 'node:assert';
import {
  computeSharedBottleStats,
  computeCollectionSummary,
  computeDiaryStats,
  type BottleState,
  type WearLogState,
} from '../src/lib/derivedCalculations.ts';

const BASE = 'http://127.0.0.1:8080/v1/projects/demo-sprint1-rules/databases/(default)/documents';

function b64url(s: string) {
  return Buffer.from(s).toString('base64url');
}
const ownerJwt =
  `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.` +
  `${b64url(JSON.stringify({ sub: 'owner-1', email: 'owner@example.com' }))}.`;
const ownerBypass = 'owner'; // emulator "Bearer owner" bypasses rules (seeding only)

function enc(v: unknown): Record<string, unknown> {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number') return { doubleValue: v };
  throw new Error(`unsupported ${typeof v}`);
}
const fields = (obj: Record<string, unknown>) => ({
  fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, enc(v)])),
});

async function req(method: string, path: string, tok: string | null, body?: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

function dec(docFields: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(docFields)) {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('doubleValue' in v) out[k] = v.doubleValue;
    else if ('booleanValue' in v) out[k] = v.booleanValue;
    else if ('nullValue' in v) out[k] = null;
  }
  return out;
}

async function fetchWearLogs(): Promise<Array<Record<string, unknown>>> {
  const { status, body } = await req(
    'POST',
    ':runQuery',
    ownerJwt,
    {
      structuredQuery: {
        from: [{ collectionId: 'wear_logs' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'user_id' },
            op: 'EQUAL',
            value: { stringValue: 'owner-1' },
          },
        },
      },
    }
  );
  assert.strictEqual(status, 200, `runQuery failed: ${status} ${body}`);
  const rows = JSON.parse(body) as Array<{ document?: { name: string; fields: Record<string, Record<string, unknown>> } }>;
  return rows
    .filter((r) => r.document)
    .map((r) => ({ id: r.document!.name.split('/').pop()!, ...dec(r.document!.fields) }));
}

const bottle: BottleState = {
  id: 'b-load',
  user_id: 'owner-1',
  perfume_id: 'pub-1',
  status: 'in_use',
  size_ml: 50,
  remaining_ml: 25,
};
const PERFUMES = [
  {
    id: 'pub-1',
    primary_family: 'Woody',
    top_notes: 'Bergamot',
    heart_notes: 'Cedarwood',
    base_notes: 'Sandalwood',
    heat_suitability: 4,
    concentration: 'EDP',
  },
];

// Seed the bottle (rules bypass, seeding only).
const seed = await req('PATCH', '/bottles/b-load', ownerBypass, fields({
  user_id: 'owner-1', perfume_id: 'pub-1', size_ml: 50, remaining_ml: 25, status: 'in_use',
}));
assert.ok(seed.status >= 200 && seed.status < 300, `seed bottle failed: ${seed.status} ${seed.body}`);

// 50 sequential canonical creates through the OWNER JWT (rules enforced).
for (let i = 0; i < 50; i++) {
  const r = await req('PATCH', `/wear_logs/wl_${i}`, ownerJwt, fields({
    user_id: 'owner-1',
    bottle_id: 'b-load',
    perfume_id: 'pub-1',
    client_op_id: `op-load-${i}`,
    sprays: 3,
    worn_at: '2026-10-30T06:00:00Z',
    ml_used: 0.5,
  }));
  assert.ok(r.status >= 200 && r.status < 300, `wear log ${i} failed: ${r.status} ${r.body}`);
}
console.log('50 sequential wear-log writes: ok (rules-enforced, owner JWT)');

// Re-fetch ("one refresh") and count through the shared module.
let logs = await fetchWearLogs();
const loadLogs = logs.filter((l) => String(l.id).startsWith('wl_'));
assert.strictEqual(loadLogs.length, 50);
assert.strictEqual(new Set(loadLogs.map((l) => l.id)).size, 50);
assert.strictEqual(new Set(loadLogs.map((l) => l.client_op_id)).size, 50);
const stats = computeSharedBottleStats([bottle], PERFUMES, loadLogs as unknown as WearLogState[]);
const summary = computeCollectionSummary([bottle], loadLogs as unknown as WearLogState[], []);
const diary = computeDiaryStats(loadLogs as unknown as WearLogState[], []);
assert.strictEqual(stats.perBottleTimesWorn['b-load'], 50);
assert.strictEqual(stats.totalWearsCount, 50);
assert.strictEqual(summary.totalWearsCount, 50);
assert.strictEqual(diary.totalWears, 50);
console.log('counts after refresh: per-bottle 50, total 50, diary 50 — exact, zero duplicates');

// Re-write one log with the same doc id (doc-id idempotency): count must not move.
const dup = await req('PATCH', '/wear_logs/wl_0', ownerJwt, fields({
  user_id: 'owner-1',
  bottle_id: 'b-load',
  perfume_id: 'pub-1',
  client_op_id: 'op-load-0',
  sprays: 3,
  worn_at: '2026-10-30T06:00:00Z',
  ml_used: 0.5,
}));
assert.ok(dup.status >= 200 && dup.status < 300);
logs = await fetchWearLogs();
assert.strictEqual(logs.filter((l) => String(l.id).startsWith('wl_')).length, 50);
console.log('same-doc-id rewrite: count still 50 (no duplicate)');

// Soft-delete one log, re-fetch: every count drops by exactly one.
const del = await req('PATCH', '/wear_logs/wl_0', ownerJwt, fields({
  deleted_at: '2026-10-30T07:00:00Z',
}));
assert.ok(del.status >= 200 && del.status < 300);
logs = await fetchWearLogs();
const active = logs.filter((l) => String(l.id).startsWith('wl_') && !l.deleted_at);
assert.strictEqual(active.length, 49);
const stats2 = computeSharedBottleStats([bottle], PERFUMES, active as unknown as WearLogState[]);
const summary2 = computeCollectionSummary([bottle], active as unknown as WearLogState[], []);
const diary2 = computeDiaryStats(active as unknown as WearLogState[], []);
assert.strictEqual(stats2.perBottleTimesWorn['b-load'], 49);
assert.strictEqual(stats2.totalWearsCount, 49);
assert.strictEqual(summary2.totalWearsCount, 49);
assert.strictEqual(diary2.totalWears, 49);
console.log('after soft-deleting 1 log + refresh: per-bottle 49, total 49, diary 49 — consistent');
console.log('LOAD TEST: PASS');
