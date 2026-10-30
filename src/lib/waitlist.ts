/**
 * Sprint 4 — Try It First waitlist client.
 *
 * The ONLY waitlist write path: POST to the `waitlist` Cloud Function, which
 * stores the entry in Firestore (client writes to `waitlist_entries` are
 * denied by the rules). The localStorage-only waitlist path is deleted.
 *
 * Base URL: `VITE_FUNCTIONS_BASE_URL` when set (the deployed Functions
 * origin, e.g. https://asia-southeast2-senstoria-app.cloudfunctions.net);
 * otherwise a relative URL, which works when the SPA is served from
 * Firebase Hosting (firebase.json rewrites /waitlist -> waitlist function).
 * On Vercel without the env var the call 404s and the caller must render an
 * honest error state — never a fake success.
 */
export type WaitlistSizeMl = 2 | 5 | 10;
export type WaitlistNotificationPref = 'email' | 'whatsapp' | 'both';

export interface WaitlistSubmitInput {
  email: string;
  perfume_id: string;
  size_ml: WaitlistSizeMl;
  whatsapp_number?: string;
  notification_pref?: WaitlistNotificationPref;
}

export type WaitlistSubmitResult =
  | { ok: true; already: boolean; status: string; emailSent: boolean }
  | { ok: false; error: 'validation' | 'backend' | 'rate_limited' | 'unknown'; errors?: string[] };

function functionsBase(): string {
  const raw = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_FUNCTIONS_BASE_URL;
  return (raw ?? '').replace(/\/+$/, '');
}

export async function submitWaitlist(input: WaitlistSubmitInput): Promise<WaitlistSubmitResult> {
  const url = `${functionsBase()}/waitlist`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: 'backend' };
  }
  if (res.status === 429) return { ok: false, error: 'rate_limited' };
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: 'backend' };
  }
  if (!res.ok) {
    if (res.status === 400 && Array.isArray(data.errors)) {
      return { ok: false, error: 'validation', errors: data.errors as string[] };
    }
    return { ok: false, error: 'backend' };
  }
  return {
    ok: true,
    already: data.already === true,
    status: typeof data.status === 'string' ? data.status : 'pending_confirm',
    emailSent: data.emailSent === true,
  };
}
