/**
 * Sprint 4 — waitlist confirmation email transport.
 *
 * EMAIL HONESTY (critical): the transport is env-configured ONLY. If the
 * founder has not configured SMTP (WAITLIST_SMTP_HOST/PORT/USER/PASS/FROM),
 * getMailTransport() returns null and the handler reports emailSent: false —
 * the entry stays `pending_confirm` and the UI says so honestly. Nothing in
 * this module ever claims an email was sent when it was not.
 *
 * Founder step for live sending (console/env action, never in chat):
 *   firebase functions:config:set ... or set env vars on the deployed
 *   functions: WAITLIST_SMTP_HOST, WAITLIST_SMTP_PORT, WAITLIST_SMTP_USER,
 *   WAITLIST_SMTP_PASS, WAITLIST_SMTP_FROM, WAITLIST_CONFIRM_URL
 *   (the public base URL of the waitlistConfirm function, e.g. the Firebase
 *   Hosting URL + /waitlist/confirm once the firebase.json rewrite is live).
 */
import nodemailer, { type Transporter } from 'nodemailer';

export interface MailTransport {
  sendConfirmation(to: string, link: string): Promise<boolean>;
}

export function getMailTransport(): MailTransport | null {
  const host = process.env.WAITLIST_SMTP_HOST;
  const port = process.env.WAITLIST_SMTP_PORT;
  const user = process.env.WAITLIST_SMTP_USER;
  const pass = process.env.WAITLIST_SMTP_PASS;
  const from = process.env.WAITLIST_SMTP_FROM;
  if (!host || !port || !user || !pass || !from) return null;
  const transporter: Transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
  return {
    async sendConfirmation(to: string, link: string): Promise<boolean> {
      try {
        await transporter.sendMail({
          from,
          to,
          subject: 'Konfirmasi daftar tunggu Try It First — Senstoria',
          text: `Terima kasih sudah mendaftar di daftar tunggu Try It First Senstoria.\n\nKonfirmasi pendaftaran kamu dengan membuka tautan ini:\n${link}\n\nTautan berlaku 7 hari. Jika kamu tidak mendaftar, abaikan email ini.`,
          html: `<p>Terima kasih sudah mendaftar di daftar tunggu Try It First Senstoria.</p><p><a href="${link}">Konfirmasi pendaftaran kamu</a></p><p>Tautan berlaku 7 hari. Jika kamu tidak mendaftar, abaikan email ini.</p>`,
        });
        return true;
      } catch (err) {
        console.error('waitlist confirmation email failed', err);
        return false;
      }
    },
  };
}

/** Emulator/log fallback: prints the link for local verification, sends nothing. */
export function logOnlyTransport(): MailTransport {
  return {
    async sendConfirmation(to: string, link: string): Promise<boolean> {
      console.log(`[waitlist] confirmation link for ${to}: ${link} (no SMTP transport configured — email NOT sent)`);
      return false;
    },
  };
}
