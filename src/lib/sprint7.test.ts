import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  assembleExportDocument,
  type ServerExportData,
} from './dataPortability.ts';
import {
  sanitizeErrorText,
  sanitizeError,
} from './errorReport.ts';

const EMPTY_SERVER: ServerExportData = {
  user_document: null,
  bottles: [],
  wear_logs: [],
  scent_stories: [],
  reviews: [],
  wishlist: [],
  compare: [],
};

describe('Sprint 7: UU PDP export assembly', () => {
  it('labels server vs local_device provenance and keeps the regulation note', () => {
    const server: ServerExportData = {
      ...EMPTY_SERVER,
      user_document: { id: 'u1', email: 'a@b.co' },
      bottles: [{ id: 'b1' }],
    };
    const doc = assembleExportDocument(server, { local_bottles: [] }, 'a@b.co');
    assert.strictEqual((doc.meta as { app: string }).app, 'Senstoria');
    assert.ok(String((doc.meta as { provenance_note: string }).provenance_note).includes('Waitlist'));
    assert.deepStrictEqual(
      (doc.server as ServerExportData).bottles,
      [{ id: 'b1' }],
    );
    assert.deepStrictEqual(doc.local_device, { local_bottles: [] });
  });

  it('omits user_email from meta when the user is anonymous', () => {
    const doc = assembleExportDocument(EMPTY_SERVER, {}, null);
    assert.ok(!('user_email' in (doc.meta as Record<string, unknown>)));
  });
});

describe('Sprint 7: error sanitization (no PII or secrets leave the client)', () => {
  it('redacts email addresses', () => {
    assert.strictEqual(
      sanitizeErrorText('failed for jafar@example.com today'),
      'failed for [redacted-email] today',
    );
  });

  it('redacts secret-bearing URL parameters but keeps the URL shape', () => {
    const out = sanitizeErrorText(
      'POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD9xyz failed',
    );
    assert.ok(out.includes('accounts:signUp?key=[redacted]'));
    assert.ok(!out.includes('AIzaSyD9xyz'));
  });

  it('redacts Authorization headers and long opaque tokens', () => {
    assert.strictEqual(
      sanitizeErrorText('Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456'),
      'Authorization: Bearer [redacted]',
    );
    assert.strictEqual(
      sanitizeErrorText('token abcdefghijklmnopqrstuvwxyz1234567890 end'),
      'token [redacted-token] end',
    );
  });

  it('keeps ordinary text and error codes untouched', () => {
    assert.strictEqual(sanitizeErrorText('permission-denied on bottles/b1'), 'permission-denied on bottles/b1');
    const safe = sanitizeError(Object.assign(new Error('oops'), { code: 'auth/invalid-credential' }));
    assert.strictEqual(safe.code, 'auth/invalid-credential');
    assert.strictEqual(safe.message, 'oops');
  });
});
