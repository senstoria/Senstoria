import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeSharedBottleStats,
  computeCollectionSummary,
  computeDiaryStats,
  calculateTryItFirstTotals,
  type BottleState,
  type WearLogState,
} from './derivedCalculations.ts';
import {
  planWear,
  resolveWearWrite,
  logWearTransaction,
  goUrl,
  type WearInput,
} from './dataLayer.ts';
import { BackendNotConfiguredError } from './firebase.ts';

const PERFUMES = [
  {
    id: 'prf_001',
    primary_family: 'Woody',
    top_notes: 'Bergamot',
    heart_notes: 'Cedarwood',
    base_notes: 'Sandalwood',
    heat_suitability: 4,
    concentration: 'EDP',
  },
  {
    id: 'prf_003',
    primary_family: 'Floral',
    top_notes: 'Rose',
    heart_notes: 'Jasmine',
    base_notes: 'Musk',
    heat_suitability: 5,
    concentration: 'EDT',
  },
];

function bottle(id: string, perfumeId: string, remainingMl: number): BottleState {
  return { id, perfume_id: perfumeId, status: 'in_use', size_ml: 50, remaining_ml: remainingMl, ml_per_wear: 0.5 };
}

function wear(id: string, bottleId: string, perfumeId: string, opId: string, deletedAt: string | null = null): WearLogState {
  return {
    id,
    bottle_id: bottleId,
    perfume_id: perfumeId,
    worn_at: '2026-10-20T10:00:00Z',
    sprays: 3,
    ml_used: 0.5,
    client_op_id: opId,
    deleted_at: deletedAt,
  };
}

describe('Sprint 2: logs win (BR-01)', () => {
  it('counts come only from wear_logs; deleted logs never count', () => {
    const bottles = [bottle('bot_001', 'prf_001', 31), bottle('bot_002', 'prf_003', 42.5)];
    const logs = [
      wear('w1', 'bot_001', 'prf_001', 'op_1'),
      wear('w2', 'bot_001', 'prf_001', 'op_2'),
      wear('w3', 'bot_002', 'prf_003', 'op_3'),
      wear('w4', 'bot_001', 'prf_001', 'op_4', '2026-10-21T00:00:00Z'), // soft-deleted
    ];
    const stats = computeSharedBottleStats(bottles, PERFUMES, logs);
    assert.strictEqual(stats.perBottleTimesWorn['bot_001'], 2);
    assert.strictEqual(stats.perBottleTimesWorn['bot_002'], 1);
    assert.strictEqual(stats.totalWearsCount, 3);
    assert.strictEqual(stats.mostWorn.count, 2);
    const summary = computeCollectionSummary(bottles, logs, []);
    assert.strictEqual(summary.totalWearsCount, 3);
    const diary = computeDiaryStats(logs, []);
    assert.strictEqual(diary.totalWears, 3);
    assert.strictEqual(diary.mostWornPerfumeId, 'prf_001');
    assert.strictEqual(diary.mostWornCount, 2);
  });

  it('a bottle with no logs shows 0, never a stored counter', () => {
    const bottles = [bottle('bot_001', 'prf_001', 50)];
    const stats = computeSharedBottleStats(bottles, PERFUMES, []);
    assert.strictEqual(stats.perBottleTimesWorn['bot_001'], 0);
    assert.strictEqual(stats.totalWearsCount, 0);
  });

  it('planWear decrements and finishes at zero', () => {
    const r1 = planWear(bottle('b', 'prf_001', 31), 0.5);
    assert.deepStrictEqual(r1, { newRemainingMl: 30.5, newStatus: 'in_use' });
    const r2 = planWear(bottle('b', 'prf_001', 0.5), 0.5);
    assert.deepStrictEqual(r2, { newRemainingMl: 0, newStatus: 'finished' });
  });

  it('calculateTryItFirstTotals centralizes quote math', () => {
    // pricePerMl 7780, size 5 -> fair 38900; shipping 15000 -> total 53900.
    const t = calculateTryItFirstTotals(7780, 5, 15000);
    assert.strictEqual(t.shippingCost, 15000);
    assert.strictEqual(t.totalOrderPrice, t.fairDecantPrice + 15000);
    assert.ok(t.fairDecantPrice > 0);
  });

  it('goUrl builds a relative /go URL by default', () => {
    assert.strictEqual(goUrl('prf_001', 'shopee', 'repurchase_sheet'), '/go/prf_001?platform=shopee&src=repurchase_sheet');
    assert.strictEqual(goUrl('prf_001', 'tokopedia', 'catalog_card'), '/go/prf_001?platform=tokopedia&src=catalog_card');
  });
});

describe('Sprint 2: transactional Log Wear (unit-level, same assertions as the load test)', () => {
  it('50 sequential wear ops produce exact counts with zero duplicates, incl. retried op ids', () => {
    // In-memory store standing in for Firestore documents.
    const store = new Map<string, WearLogState>();
    let serverBottle = bottle('bot_001', 'prf_001', 50);
    const clientBottle = { ...serverBottle };
    const input: WearInput = { bottleId: 'bot_001', perfumeId: 'prf_001', sprays: 3, mlUsed: 0.5 };
    let writes = 0;
    let dedupes = 0;
    for (let i = 0; i < 50; i++) {
      const opId = `op_load_${i}`;
      const docId = `wear_${opId}`;
      const resolved = resolveWearWrite(store.get(docId) ?? null, clientBottle, serverBottle, 'u1', input, opId, docId);
      assert.strictEqual(resolved.deduped, false);
      store.set(docId, resolved.wearLog);
      serverBottle = resolved.updatedBottle;
      writes++;
      // Retry the same op id: must dedupe, never write twice.
      const retry = resolveWearWrite(store.get(docId) ?? null, clientBottle, serverBottle, 'u1', input, opId, docId);
      assert.strictEqual(retry.deduped, true);
      assert.strictEqual(retry.wearLog.id, docId);
      dedupes++;
    }
    assert.strictEqual(writes, 50);
    assert.strictEqual(dedupes, 50);
    assert.strictEqual(store.size, 50);
    const logs = [...store.values()];
    const stats = computeSharedBottleStats([serverBottle], PERFUMES, logs);
    assert.strictEqual(stats.perBottleTimesWorn['bot_001'], 50);
    assert.strictEqual(stats.totalWearsCount, 50);
    assert.strictEqual(stats.mostWorn.count, 50);
    // 50 x 0.5 ml from 50 ml = 25 ml used, 25 ml left, still in use.
    assert.strictEqual(serverBottle.remaining_ml, 25);
    assert.strictEqual(serverBottle.status, 'in_use');
  });

  it('a retried op id after a completed write returns the original log unchanged', () => {
    const store = new Map<string, WearLogState>();
    const serverBottle = bottle('bot_001', 'prf_001', 50);
    const input: WearInput = { bottleId: 'bot_001', perfumeId: 'prf_001', sprays: 3, mlUsed: 0.5 };
    const first = resolveWearWrite(null, serverBottle, serverBottle, 'u1', input, 'op_dup', 'wear_op_dup');
    store.set('wear_op_dup', first.wearLog);
    const second = resolveWearWrite(store.get('wear_op_dup') ?? null, serverBottle, first.updatedBottle, 'u1', input, 'op_dup', 'wear_op_dup');
    assert.strictEqual(second.deduped, true);
    assert.strictEqual(second.wearLog.id, first.wearLog.id);
    assert.strictEqual(store.size, 1);
  });

  it('offline/unconfigured backend: the transaction throws before any state could be applied', async () => {
    // In this test environment there is no Firebase env, so db is null.
    // The App handler applies state ONLY after this await resolves, so a
    // throw here means displayed numbers never change as if recorded —
    // the handler then shows the honest error + retry toast.
    const input: WearInput = { bottleId: 'bot_001', perfumeId: 'prf_001', sprays: 3, mlUsed: 0.5 };
    await assert.rejects(
      logWearTransaction('u1', bottle('bot_001', 'prf_001', 50), input),
      BackendNotConfiguredError
    );
  });
});
