#!/usr/bin/env node
/**
 * Sprint 7 — Firestore restore (emulator-runnable, dependency-free).
 *
 * Restores a backup file produced by scripts/firestore-backup.mjs into an
 * EMULATOR project (default target is a fresh, empty emulator — the safe
 * simulation path). It OVERWRITES documents with the same id in the
 * target, so NEVER point it at a live project without the founder's
 * explicit confirmation and a fresh backup taken first (RUNBOOK §3).
 *
 *   node scripts/firestore-restore.mjs --emulator-host 127.0.0.1:8080 \
 *     --project demo-sprint7-restore --in backups/senstoria-YYYY-MM-DD.json
 *
 * Live restores use `gcloud firestore import` (RUNBOOK §3) — this script
 * refuses --live outright.
 */

import { readFileSync } from 'node:fs';

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

if (process.argv.includes('--live')) {
  console.error('Refusing live restore from this script. See docs/RUNBOOK.md §3 for the founder gcloud command.');
  process.exit(2);
}

const host = arg('emulator-host');
const project = arg('project');
const input = arg('in');
if (!host || !project || !input) {
  console.error('Usage: node scripts/firestore-restore.mjs --emulator-host HOST:PORT --project PROJECT --in FILE.json');
  process.exit(2);
}

const backup = JSON.parse(readFileSync(input, 'utf8'));
if (backup.meta?.kind !== 'firestore-backup') {
  console.error('Not a Senstoria firestore-backup file.');
  process.exit(2);
}

const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

let restored = 0;
for (const [path, docs] of Object.entries(backup.documents)) {
  for (const doc of docs) {
    const url = `${base}/${path}?documentId=${encodeURIComponent(doc.id)}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ fields: doc.fields }) });
    if (!res.ok) throw new Error(`restore ${path}/${doc.id} failed: ${res.status} ${await res.text()}`);
    restored++;
  }
}
console.log(`Restore complete: ${restored} documents into project ${project}`);
