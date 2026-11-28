/**
 * P0 Admin v1 — audit log (spek §3.5, §4, §12 item 2).
 *
 * Setiap aksi admin yang sudah ada — moderasi review, revoke shared
 * story, ekspor CSV waitlist, majukan status pesanan — tercatat
 * append-only di koleksi `admin_actions`: aktor, aksi, target,
 * sebelum/sesudah ringkas, waktu (serverTimestamp), hasil. Akses log
 * hanya admin; tidak bisa diubah/dihapus dari client (lihat
 * firestore.rules — update/delete: if false).
 *
 * KEPUTUSAN — audit gagal ≠ aksi dibatalkan. Bila tulis audit gagal
 * (mis. rules admin_actions belum ter-publish, atau jaringan putus
 * di antara dua tulis), aksi moderasi yang SUDAH dikonfirmasi server
 * tetap berlaku; pemanggil WAJIB menampilkan toast PERINGATAN (bukan
 * toast sukses) + kegagalan dicatat di console. Alasan: membatalkan
 * (me-revert) tulis server yang sudah terkonfirmasi demi tulis kedua
 * yang gagal berisiko divergensi lokal/server yang lebih parah, dan
 * tampilan publik (approved-only) sudah berubah oleh tulis pertama.
 * Ini konsisten dengan spek §4 ("kegagalan dicatat tanpa menyatakan
 * mutasi berhasil") — tidak ada klaim sukses bila audit gagal, tapi
 * aksi yang sudah sah tidak diputarbalikkan secara diam-diam.
 * Perbaikan susulan: tampilkan riwayat admin_actions di admin + jalan
 * tulis-ulang entri audit yang gagal (P2).
 *
 * PRIVASI: beforeSummary / afterSummary HANYA boleh berisi ringkasan
 * status pendek (mis. "status:pending_moderation" → "status:approved").
 * JANGAN PERNAH menyalin isi jurnal, teks review, email, atau nomor
 * WhatsApp ke log (spek §3.5; ekspor CSV dicatat tanpa kontak).
 *
 * Skema dokumen admin_actions:
 *   actor_uid: string (== auth.uid pemanggil, ditegakkan rules)
 *   action: string (lihat ADMIN_ACTIONS)
 *   target_type: string, target_id: string
 *   before_summary / after_summary: string (ringkas, tanpa PII)
 *   result: 'success' | 'failure' (hasil AKSI yang diaudit)
 *   created_at: serverTimestamp
 *
 * WIRING YANG SUDAH JALAN (track ini):
 *   - moderasi review: src/App.tsx handleApproveReview /
 *     handleRejectReview / handleDeleteReview.
 * WIRING SUSULAN (call site ada di src/components/AdminDashboardView.tsx
 * — file itu di luar cakupan track ini; satu baris per call site):
 *   - revoke shared story (handleRevokeSharedStory): ganti
 *     `await revokeSharedStory(story.token)` dengan
 *     `await revokeSharedStoryForAdmin(story.token, adminUid)` dari
 *     src/lib/firebase.ts — wrapper itu sudah mengaudit.
 *   - ekspor CSV waitlist (handleExportWaitlistCsv): setelah
 *     link.click(), panggil
 *     `logAdminAction(db, adminUid, ADMIN_ACTIONS.waitlistExportCsv,
 *       'waitlist', 'all', `entries:${n}`, `exported:${n}`, 'success')`
 *     — tanpa email/WhatsApp di ringkasan. Butuh prop adminUid + db
 *     diteruskan dari App.tsx ke AdminDashboardView.
 *   - majukan status pesanan (handleAdvanceOrder) + simpan resi
 *     (handleSaveTracking): setelah updateSalesOrderStatus /
 *     updateSalesOrderTracking berhasil, panggil logAdminAction dengan
 *     ADMIN_ACTIONS.orderAdvance / orderTracking dan ringkasan
 *     `status:baru→dibayar`. Tab Orders tetap read-only sampai gerbang
 *     S3 dibuka (spek §14) — wiring audit tidak membuka fitur baru.
 */
import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore';

/** Nama aksi audit yang dikenal. Tambah nama baru di sini, bukan string lepas. */
export const ADMIN_ACTIONS = {
  reviewApprove: 'review.approve',
  reviewReject: 'review.reject',
  /** Soft-delete review (status 'rejected' + deleted_at/deleted_by). */
  reviewSoftDelete: 'review.soft_delete',
  sharedStoryRevoke: 'shared_story.revoke',
  waitlistExportCsv: 'waitlist.export_csv',
  orderAdvance: 'order.advance',
  orderTracking: 'order.tracking',
} as const;

export type AdminActionResult = 'success' | 'failure';

export interface AdminAuditEntry {
  actor_uid: string;
  action: string;
  target_type: string;
  target_id: string;
  before_summary: string;
  after_summary: string;
  result: AdminActionResult;
  created_at: unknown;
}

/**
 * Bentuk dokumen audit (pure — bisa diuji tanpa Firestore). created_at
 * memakai serverTimestamp supaya waktu berasal dari server, bukan jam
 * perangkat admin.
 */
export function buildAdminAuditEntry(
  actorUid: string,
  action: string,
  targetType: string,
  targetId: string,
  beforeSummary: string,
  afterSummary: string,
  result: AdminActionResult,
): AdminAuditEntry {
  return {
    actor_uid: actorUid,
    action,
    target_type: targetType,
    target_id: targetId,
    before_summary: beforeSummary,
    after_summary: afterSummary,
    result,
    created_at: serverTimestamp(),
  };
}

export type AdminAuditWriteFn = (db: Firestore, entry: AdminAuditEntry) => Promise<unknown>;

async function defaultWrite(db: Firestore, entry: AdminAuditEntry): Promise<unknown> {
  return addDoc(collection(db, 'admin_actions'), entry);
}

/**
 * Tulis satu entri audit. Mengembalikan true bila dokumen tercatat,
 * false bila tidak (db belum terkonfigurasi, actorUid kosong, atau
 * tulis Firestore gagal). TIDAK PERNAH throw — pemanggil memutuskan
 * tampilan (toast peringatan) dari nilai kembali, bukan dari exception.
 * Kegagalan selalu dicatat ke console.error dengan konteks aksi/target.
 *
 * @param writeFn seam uji: pemanggil produksi tidak mengisinya.
 */
export async function logAdminAction(
  db: Firestore | null | undefined,
  actorUid: string,
  action: string,
  targetType: string,
  targetId: string,
  beforeSummary: string,
  afterSummary: string,
  result: AdminActionResult,
  writeFn: AdminAuditWriteFn = defaultWrite,
): Promise<boolean> {
  if (!db) {
    console.error('Admin audit log gagal: Firestore belum terkonfigurasi.', { action, targetType, targetId });
    return false;
  }
  if (!actorUid) {
    console.error('Admin audit log gagal: actorUid kosong.', { action, targetType, targetId });
    return false;
  }
  try {
    await writeFn(db, buildAdminAuditEntry(actorUid, action, targetType, targetId, beforeSummary, afterSummary, result));
    return true;
  } catch (err) {
    console.error('Admin audit log gagal disimpan — aksi tetap berlaku, laporkan ke founder.', {
      action,
      targetType,
      targetId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
