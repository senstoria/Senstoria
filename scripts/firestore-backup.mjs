#!/usr/bin/env node
/**
 * Sprint 7 — Firestore backup (emulator-runnable, dependency-free).
 *
 * EMULATOR (the only mode this script executes):
 *   node scripts/firestore-backup.mjs --emulator-host 127.0.0.1:8080 \
 *     --project demo-sprint7 --out backups/senstoria-YYYY-MM-DD.json
 *
 * Reads every document of the Senstoria collections (including the
 * per-user wishlist/compare subcollections) through the Firestore REST
 * API and writes one JSON file in Firestore REST field format.
 *
 * LIVE (founder step — this script deliberately does NOT do it):
 *   A live export needs GCP credentials this script must never hold.
 *   Run the gcloud command from docs/RUNBOOK.md §2 instead, or use the
 *   Firebase Console → Firestore → Import/Export.
 *
 * The emulator token `Bearer owner` bypasses rules ONLY on the local
 * emulator; it is meaningless against real Firestore.
 */

import { writeFileSync } from 'node:fs';

const TOP_COLLECTIONS = [
  'users',
  'bottles',
  'wear_logs',
  'scent_stories',
  'reviews',
  'perfumes',
  'waitlist_entries',
  'affiliate_clicks',
];

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

if (arg('live') !== undefined || process.argv.includes('--live')) {
  console.error('Refusing live export from this script. See docs/RUNBOOK.md §2 for the founder gcloud command.');
  process.exit(2);
}

const host = arg('emulator-host');
const project = arg('project');
const out = arg('out');
if (!host || !project || !out) {
  console.error('Usage: node scripts/firestore-backup.mjs --emulator-host HOST:PORT --project PROJECT --out FILE.json');
  process.exit(2);
}

const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const headers = { Authorization: 'Bearer owner' };

async function listDocuments(path) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${base}/${path}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`list ${path} failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents ?? []) {
      const id = d.name.split('/').pop();
      docs.push({ id, fields: d.fields ?? {} });
    }
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);
  return docs;
}

const documents = {};
for (const coll of TOP_COLLECTIONS) {
  documents[coll] = await listDocuments(coll);
}
// Per-user subcollections, discovered from the users collection.
const userIds = documents.users.map(d => d.id);
for (const uid of userIds) {
  for (const sub of ['wishlist', 'compare']) {
    const path = `${sub}/${uid}/items`;
    try {
      documents[path] = await listDocuments(path);
    } catch {
      documents[path] = [];
    }
  }
}

const counts = Object.fromEntries(Object.entries(documents).map(([k, v]) => [k, v.length]));
const backup = {
  meta: {
    app: 'Senstoria',
    kind: 'firestore-backup',
    format: 'rest-fields-v1',
    project,
    exported_at: new Date().toISOString(),
    collections: counts,
    total_documents: Object.values(counts).reduce((a, b) => a + b, 0),
  },
  documents,
};
writeFileSync(out, JSON.stringify(backup, null, 2));
console.log(`Backup written: ${out} (${backup.meta.total_documents} documents)`);
console.log(JSON.stringify(counts));
