/**
 * Sprint 7 — error reporting hygiene.
 *
 * Senstoria wires NO third-party error or analytics service. The only error
 * reporting path is this module: sanitized messages to the browser console
 * (and, on the server, to Firebase Functions logs via the same rules).
 *
 * Sanitization rules — applied to every string before it leaves the client:
 *  - Email addresses become `[redacted-email]`.
 *  - URL query values for secret-bearing keys (key, token, auth, password,
 *    secret, code, api_key, apikey, access_token, id_token) become
 *    `[redacted]`. Firebase API keys appear in sign-in URLs, so this rule
 *    also covers `accounts:signUp?key=...` style URLs.
 *  - `Authorization: ...` header values become `[redacted]`.
 *  - Long opaque tokens (32+ URL-safe characters) outside normal words
 *    become `[redacted-token]`.
 * Error CODES (e.g. `auth/invalid-credential`, `permission-denied`) are safe
 * and are kept — they are what support needs, without the payload.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_PARAM_RE =
  /([?&#](?:key|token|auth|password|secret|code|api_key|apikey|access_token|id_token|session)=)[^&#\s"']*/gi;
const AUTH_HEADER_RE = /(authorization:\s*\S+\s+)([^\s,;]+)/gi;
const LONG_TOKEN_RE = /\b[A-Za-z0-9_-]{32,}\b/g;

export function sanitizeErrorText(text: string): string {
  return text
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(SECRET_PARAM_RE, '$1[redacted]')
    .replace(AUTH_HEADER_RE, '$1[redacted]')
    .replace(LONG_TOKEN_RE, '[redacted-token]');
}

export interface SanitizedError {
  code: string;
  message: string;
}

/** Reduce any thrown value to a safe { code, message } pair. */
export function sanitizeError(err: unknown): SanitizedError {
  if (err instanceof Error) {
    const code =
      'code' in err && typeof (err as { code: unknown }).code === 'string'
        ? (err as { code: string }).code
        : 'unknown';
    return { code, message: sanitizeErrorText(err.message) };
  }
  return { code: 'unknown', message: sanitizeErrorText(String(err)) };
}

/**
 * The ONLY console error path for operational errors. Never call
 * console.error with a raw error object elsewhere in new code.
 */
export function reportError(context: string, err: unknown): void {
  const safe = sanitizeError(err);
  console.error(`[Senstoria:${context}] ${safe.code}: ${safe.message}`);
}
