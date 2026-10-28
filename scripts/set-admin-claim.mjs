#!/usr/bin/env node
/**
 * Sprint 1 — one-time admin bootstrap (§5.4).
 *
 * Sets the Firebase custom claim `admin: true` on ONE existing, email-verified
 * user. Run by the FOUNDER from a safe local environment — never in the app,
 * never from the browser, never with the key shared in chat.
 *
 * Prerequisites (founder only):
 *   1. The user already created an account through the Senstoria sign-up UI
 *      and verified their email.
 *   2. A Firebase service-account key JSON downloaded from
 *      Firebase Console → Project Settings → Service accounts
 *      → "Generate new private key". Keep the file local; never commit it.
 *   3. `npm install firebase-admin` once, in this directory.
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>
 *
 * The UID is visible in Firebase Console → Authentication → Users.
 * The script prints the UID and the time it ran. Record both in the
 * Sprint 1 gate log. After it runs, the user must sign out and sign back
 * in (fresh ID token) before Admin Console appears.
 *
 * There is no UI path to this action and no self-promotion: a second admin
 * can only be added by repeating this founder-run step.
 */
import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';

const [uid, keyPath] = process.argv.slice(2);
if (!uid || !keyPath) {
  console.error('Usage: node scripts/set-admin-claim.mjs <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>');
  process.exit(2);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const user = await admin.auth().getUser(uid);
if (!user.emailVerified) {
  console.error(`Refusing: user ${uid} (${user.email}) has NOT verified their email. Verify first, then re-run.`);
  process.exit(1);
}

await admin.auth().setCustomUserClaims(uid, { admin: true });
console.log(`OK: admin claim set for ${uid} (${user.email}) at ${new Date().toISOString()}`);
console.log('The user must sign out and sign back in for the claim to take effect.');
process.exit(0);
