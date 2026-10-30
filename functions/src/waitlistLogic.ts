/**
 * Sprint 4 — Try It First waitlist backend logic (PURE, unit-tested).
 *
 * Design (plan Sprint 4, TRY-02/05 double opt-in):
 * - One entry per (email, perfume_id, size_ml): the Firestore doc id is a
 *   deterministic SHA-256 of the normalized triple, so two identical submits
 *   write the SAME doc (dedup by construction, not by a read-then-write race
 *   window — the handler uses set-with-merge semantics that never overwrite
 *   an already-confirmed status).
 * - Double opt-in: a new entry starts `pending_confirm` with a confirmation
 *   token. Only the SHA-256 hash of the token is stored; the raw token
 *   travels only in the confirmation link sent to the registrant's email.
 *   Tokens expire after 7 days. Confirming flips `pending_confirm` -> `active`.
 * - Demand honesty: `countConfirmedDemand` counts ONLY `active` (and
 *   `notified`, which is a confirmed entry whose batch opened) — never
 *   `pending_confirm`. Admin demand counts must use this function.
 * - No prices anywhere in this module (D-04: Q13 undecided; the waitlist
 *   flow shows "Harga diumumkan saat peluncuran" and no numbers).
 */
import { createHash, randomBytes } from 'node:crypto';

export type WaitlistSizeMl = 2 | 5 | 10;
export type WaitlistStatus = 'pending_confirm' | 'active' | 'withdrawn' | 'notified';
export type WaitlistNotificationPref = 'email' | 'whatsapp' | 'both';

export interface WaitlistInput {
  email: string;
  perfume_id: string;
  size_ml: WaitlistSizeMl;
  whatsapp_number?: string;
  notification_pref?: WaitlistNotificationPref;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  perfume_id: string;
  size_ml: WaitlistSizeMl;
  whatsapp_number?: string;
  notification_pref?: WaitlistNotificationPref;
  status: WaitlistStatus;
  token_hash: string | null;
  token_expires_at_ms: number | null;
  created_at_ms: number;
  confirmed_at_ms: number | null;
}

export const WAITLIST_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateWaitlistInput(input: WaitlistInput): string[] {
  const errors: string[] = [];
  const email = normalizeEmail(input.email ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('invalid_email');
  if (!input.perfume_id || typeof input.perfume_id !== 'string' || !input.perfume_id.trim()) {
    errors.push('missing_perfume_id');
  }
  if (input.size_ml !== 2 && input.size_ml !== 5 && input.size_ml !== 10) {
    errors.push('invalid_size_ml');
  }
  if (input.notification_pref !== undefined &&
      input.notification_pref !== 'email' &&
      input.notification_pref !== 'whatsapp' &&
      input.notification_pref !== 'both') {
    errors.push('invalid_notification_pref');
  }
  return errors;
}

/** Deterministic dedup id: same (email, perfume, size) -> same id. */
export function waitlistDocId(email: string, perfume_id: string, size_ml: WaitlistSizeMl): string {
  return createHash('sha256')
    .update(`${normalizeEmail(email)}|${perfume_id.trim()}|${size_ml}`)
    .digest('hex');
}

export function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashConfirmationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildConfirmationLink(baseUrl: string, entryId: string, token: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}?id=${encodeURIComponent(entryId)}&token=${encodeURIComponent(token)}`;
}

export function createPendingEntry(input: WaitlistInput, nowMs: number): { entry: WaitlistEntry; token: string } {
  const token = generateConfirmationToken();
  const entry: WaitlistEntry = {
    id: waitlistDocId(input.email, input.perfume_id, input.size_ml),
    email: normalizeEmail(input.email),
    perfume_id: input.perfume_id.trim(),
    size_ml: input.size_ml,
    ...(input.whatsapp_number ? { whatsapp_number: input.whatsapp_number.trim() } : {}),
    ...(input.notification_pref ? { notification_pref: input.notification_pref } : {}),
    status: 'pending_confirm',
    token_hash: hashConfirmationToken(token),
    token_expires_at_ms: nowMs + WAITLIST_TOKEN_TTL_MS,
    created_at_ms: nowMs,
    confirmed_at_ms: null,
  };
  return { entry, token };
}

export type ConfirmResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; reason: 'already_confirmed' | 'invalid_token' | 'expired' | 'wrong_status' };

export function confirmEntry(entry: WaitlistEntry, token: string, nowMs: number): ConfirmResult {
  if (entry.status === 'active' || entry.status === 'notified') {
    return { ok: false, reason: 'already_confirmed' };
  }
  if (entry.status !== 'pending_confirm') {
    return { ok: false, reason: 'wrong_status' };
  }
  if (!entry.token_hash || hashConfirmationToken(token) !== entry.token_hash) {
    return { ok: false, reason: 'invalid_token' };
  }
  if (entry.token_expires_at_ms === null || nowMs > entry.token_expires_at_ms) {
    return { ok: false, reason: 'expired' };
  }
  const confirmed: WaitlistEntry = {
    ...entry,
    status: 'active',
    token_hash: null,
    token_expires_at_ms: null,
    confirmed_at_ms: nowMs,
  };
  return { ok: true, entry: confirmed };
}

/** Confirmed demand ONLY: pending_confirm entries are never counted. */
export function countConfirmedDemand(entries: Pick<WaitlistEntry, 'status'>[]): number {
  return entries.filter(e => e.status === 'active' || e.status === 'notified').length;
}

export function countPendingDemand(entries: Pick<WaitlistEntry, 'status'>[]): number {
  return entries.filter(e => e.status === 'pending_confirm').length;
}
