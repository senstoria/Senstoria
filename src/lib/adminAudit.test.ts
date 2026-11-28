import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ADMIN_ACTIONS,
  buildAdminAuditEntry,
  logAdminAction,
  type AdminAuditEntry,
} from './adminAudit.ts';
import type { Firestore } from 'firebase/firestore';

// Firestore tiruan: logAdminAction hanya meneruskannya ke writeFn,
// jadi keberhasilan tulis diuji lewat seam tanpa emulator/live.
const fakeDb = {} as Firestore;

describe('Admin audit log P0 (admin_actions, append-only)', () => {
  it('buildAdminAuditEntry: skema dokumen lengkap, created_at dari server', () => {
    const entry = buildAdminAuditEntry(
      'admin-1',
      ADMIN_ACTIONS.reviewApprove,
      'review',
      'rev_1',
      'status:pending_moderation',
      'status:approved',
      'success',
    );
    assert.strictEqual(entry.actor_uid, 'admin-1');
    assert.strictEqual(entry.action, 'review.approve');
    assert.strictEqual(entry.target_type, 'review');
    assert.strictEqual(entry.target_id, 'rev_1');
    assert.strictEqual(entry.before_summary, 'status:pending_moderation');
    assert.strictEqual(entry.after_summary, 'status:approved');
    assert.strictEqual(entry.result, 'success');
    // serverTimestamp() sentinel — ada, bukan jam perangkat.
    assert.ok(entry.created_at !== null && typeof entry.created_at === 'object');
    assert.deepStrictEqual(
      Object.keys(entry).sort(),
      ['action', 'actor_uid', 'after_summary', 'before_summary', 'created_at', 'result', 'target_id', 'target_type'],
    );
  });

  it('ADMIN_ACTIONS: nama aksi terdaftar, tanpa string lepas', () => {
    assert.strictEqual(ADMIN_ACTIONS.reviewApprove, 'review.approve');
    assert.strictEqual(ADMIN_ACTIONS.reviewReject, 'review.reject');
    assert.strictEqual(ADMIN_ACTIONS.reviewSoftDelete, 'review.soft_delete');
    assert.strictEqual(ADMIN_ACTIONS.sharedStoryRevoke, 'shared_story.revoke');
    assert.strictEqual(ADMIN_ACTIONS.waitlistExportCsv, 'waitlist.export_csv');
    assert.strictEqual(ADMIN_ACTIONS.orderAdvance, 'order.advance');
    assert.strictEqual(ADMIN_ACTIONS.orderTracking, 'order.tracking');
  });

  it('logAdminAction: tulis berhasil → true, dan meneruskan entri yang dibangun', async () => {
    let written: AdminAuditEntry | null = null;
    const ok = await logAdminAction(
      fakeDb,
      'admin-1',
      ADMIN_ACTIONS.reviewReject,
      'review',
      'rev_2',
      'status:pending_moderation',
      'status:rejected',
      'success',
      async (_db, entry) => {
        written = entry;
      },
    );
    assert.strictEqual(ok, true);
    assert.ok(written !== null);
    assert.strictEqual((written as AdminAuditEntry).actor_uid, 'admin-1');
    assert.strictEqual((written as AdminAuditEntry).action, 'review.reject');
    assert.strictEqual((written as AdminAuditEntry).target_id, 'rev_2');
  });

  it('logAdminAction: db null → false, tidak throw', async () => {
    const ok = await logAdminAction(null, 'admin-1', 'review.approve', 'review', 'rev_1', 'a', 'b', 'success');
    assert.strictEqual(ok, false);
  });

  it('logAdminAction: actorUid kosong → false, tidak throw', async () => {
    const ok = await logAdminAction(fakeDb, '', 'review.approve', 'review', 'rev_1', 'a', 'b', 'success');
    assert.strictEqual(ok, false);
  });

  it('logAdminAction: tulis gagal → false, tidak throw (pemanggil tampilkan toast peringatan)', async () => {
    const ok = await logAdminAction(fakeDb, 'admin-1', 'review.approve', 'review', 'rev_1', 'a', 'b', 'success', async () => {
      throw new Error('permission-denied');
    });
    assert.strictEqual(ok, false);
  });
});
