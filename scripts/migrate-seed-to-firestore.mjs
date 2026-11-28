#!/usr/bin/env node
/**
 * P1 Admin v1 — Migrasi satu kali seed → Firestore /perfumes.
 *
 * Menulis 36 baris seed (14 published + 22 draft) ke koleksi `/perfumes`
 * dengan data_status dan verified_by dipertahankan. Dijalankan OLEH FOUNDER
 * dari komputer yang aman (kunci service account tidak pernah masuk repo).
 *
 *   DRY-RUN (default — TIDAK MENULIS APA PUN, tidak butuh kredensial):
 *     npx tsx scripts/migrate-seed-to-firestore.mjs
 *     npx tsx scripts/migrate-seed-to-firestore.mjs --dry-run
 *
 *   LIVE (menulis ke Firestore; butuh firebase-admin + service account):
 *     npm install firebase-admin        # sekali, bila belum ada
 *     npx tsx scripts/migrate-seed-to-firestore.mjs --live \
 *       --service-account /path/ke/service-account.json
 *   atau dengan GOOGLE_APPLICATION_CREDENTIALS yang sudah di-set.
 *
 *   LIVE ke emulator (tanpa kredensial live):
 *     npx tsx scripts/migrate-seed-to-firestore.mjs --live \
 *       --emulator-host 127.0.0.1:8080 --project demo-senstoria
 *
 * Idempotent: dokumen yang sudah ada DILEWATI (tidak ditimpa), kecuali
 * flag --force. Jalankan ulang dengan aman setelah membuat parfum baru di
 * admin pra-migrasi — baris baru itu dilewati, sisanya tetap dimigrasikan.
 *
 * Rollback (hapus dokumen hasil migrasi — hanya id seed, butuh konfirmasi):
 *     npx tsx scripts/migrate-seed-to-firestore.mjs --live --rollback --confirm \
 *       --service-account /path/ke/service-account.json
 *
 * Lihat runbook lengkap: docs/admin-catalog-migration-runbook.md
 */
import { SEED_PERFUMES } from '../src/data/seedPerfumes.ts';
import { seedToPerfumeDoc } from '../src/lib/catalog.ts';

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

/**
 * Rencana migrasi murni (diuji unit di src/lib/catalogFirestore.test.ts
 * lewat import file ini): untuk tiap baris seed, tentukan create / skip /
 * overwrite berdasarkan id yang sudah ada di Firestore.
 */
export function buildMigrationPlan(seedPerfumes, existingIds, force = false) {
  const plan = [];
  for (const seed of seedPerfumes) {
    const doc = seedToPerfumeDoc(seed);
    const exists = existingIds.has(doc.id);
    plan.push({
      id: doc.id,
      name: `${doc.brand} — ${doc.name}`,
      data_status: doc.data_status,
      action: exists ? (force ? 'overwrite' : 'skip') : 'create',
    });
  }
  return plan;
}

function printPlan(plan) {
  const byAction = (a) => plan.filter((p) => p.action === a);
  const byStatus = (s) => plan.filter((p) => p.data_status === s);
  console.log(`\nRencana migrasi seed → /perfumes (${plan.length} baris seed):`);
  console.log(`  published: ${byStatus('published').length} | draft: ${byStatus('draft').length} | review: ${byStatus('review').length}`);
  console.log(`  akan dibuat: ${byAction('create').length} | dilewati (sudah ada): ${byAction('skip').length} | ditimpa (--force): ${byAction('overwrite').length}`);
  for (const p of byAction('create').slice(0, 5)) {
    console.log(`    + ${p.id} [${p.data_status}] ${p.name}`);
  }
  if (byAction('create').length > 5) {
    console.log(`    … dan ${byAction('create').length - 5} lagi`);
  }
  if (byAction('skip').length > 0) {
    console.log(`  dilewati: ${byAction('skip').map((p) => p.id).join(', ')}`);
  }
}

async function initAdminDb() {
  let admin;
  try {
    admin = await import('firebase-admin');
  } catch {
    console.error(
      '\nERROR: paket firebase-admin belum terinstal.\n' +
        'Jalankan `npm install firebase-admin` sekali di repo ini, lalu ulangi perintah --live.',
    );
    process.exit(1);
  }
  const { initializeApp, cert, applicationDefault } = admin;
  const { getFirestore } = await import('firebase-admin/firestore');
  const emulatorHost = arg('emulator-host');
  if (emulatorHost) process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  const serviceAccountPath = arg('service-account');
  const projectId = arg('project');
  try {
    if (serviceAccountPath) {
      const { readFileSync } = await import('node:fs');
      initializeApp({ credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8'))), projectId });
    } else {
      initializeApp({ credential: applicationDefault(), projectId });
    }
  } catch (err) {
    console.error('\nERROR: gagal inisialisasi firebase-admin:', err instanceof Error ? err.message : err);
    console.error('Isi GOOGLE_APPLICATION_CREDENTIALS atau beri --service-account <path>.');
    process.exit(1);
  }
  return getFirestore();
}

async function listExistingIds(db) {
  const snap = await db.collection('perfumes').select().get();
  return new Set(snap.docs.map((d) => d.id));
}

async function countByStatus(db) {
  const snap = await db.collection('perfumes').get();
  const counts = { published: 0, draft: 0, review: 0, deleted: 0, other: 0 };
  for (const d of snap.docs) {
    const s = d.data()?.data_status;
    if (s in counts) counts[s] += 1;
    else counts.other += 1;
  }
  return { total: snap.size, ...counts };
}

async function main() {
  const live = hasFlag('live');
  const force = hasFlag('force');
  const rollback = hasFlag('rollback');
  const onlyId = arg('only');

  const seeds = onlyId ? SEED_PERFUMES.filter((p) => p.id === onlyId) : SEED_PERFUMES;
  if (onlyId && seeds.length === 0) {
    console.error(`\nERROR: id seed '${onlyId}' tidak ditemukan.`);
    process.exit(1);
  }

  if (rollback) {
    if (!live || !hasFlag('confirm')) {
      console.error('\nERROR: rollback butuh --live --rollback --confirm (sengaja dibuat eksplisit).');
      process.exit(1);
    }
    const db = await initAdminDb();
    const docs = seeds.map(seedToPerfumeDoc);
    console.log(`\nRollback: menghapus ${docs.length} dokumen seed dari /perfumes …`);
    let deleted = 0;
    let missing = 0;
    for (const d of docs) {
      const ref = db.collection('perfumes').doc(d.id);
      const snap = await ref.get();
      if (!snap.exists) {
        missing += 1;
        continue;
      }
      await ref.delete();
      deleted += 1;
      console.log(`  - ${d.id} ${d.brand} — ${d.name}`);
    }
    console.log(`\nSelesai: dihapus ${deleted}, sudah tidak ada ${missing}.`);
    console.log('Setelah rollback, katalog kembali memakai seed pra-migrasi (sumber seed-pre-migration).');
    return;
  }

  if (!live) {
    // DRY-RUN: tidak menyentuh Firebase sama sekali.
    const plan = buildMigrationPlan(seeds, new Set(), force);
    printPlan(plan);
    console.log('\n[DRY-RUN] Tidak ada yang ditulis. Tambahkan --live untuk menulis ke Firestore.');
    console.log('Contoh 3 dokumen yang akan ditulis:');
    for (const seed of seeds.slice(0, 3)) {
      console.log(JSON.stringify(seedToPerfumeDoc(seed), null, 2));
    }
    return;
  }

  const db = await initAdminDb();
  const existingIds = await listExistingIds(db);
  const plan = buildMigrationPlan(seeds, existingIds, force);
  printPlan(plan);

  let created = 0;
  let overwritten = 0;
  let skipped = 0;
  for (const item of plan) {
    if (item.action === 'skip') {
      skipped += 1;
      continue;
    }
    const seed = seeds.find((s) => s.id === item.id);
    const docData = seedToPerfumeDoc(seed);
    await db.collection('perfumes').doc(docData.id).set(docData);
    if (item.action === 'overwrite') overwritten += 1;
    else created += 1;
    console.log(`  ${item.action === 'overwrite' ? '↻' : '+'} ${docData.id} [${docData.data_status}] ${docData.brand} — ${docData.name}`);
  }
  const counts = await countByStatus(db);
  console.log(`\nSelesai: dibuat ${created}, ditimpa ${overwritten}, dilewati ${skipped}.`);
  console.log(
    `Verifikasi hitungan /perfumes sekarang: total ${counts.total} ` +
      `(published ${counts.published}, draft ${counts.draft}, review ${counts.review}, deleted ${counts.deleted}, lain ${counts.other}).`,
  );
  console.log('Bandingkan dengan seed: 36 total (14 published, 22 draft). Lanjutkan ke runbook §4.');
}

const isMain = process.argv[1]?.endsWith('migrate-seed-to-firestore.mjs');
if (isMain) {
  main().catch((err) => {
    console.error('\nERROR migrasi:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
