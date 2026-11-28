import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_REMINDERS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
  type NotificationReminder,
} from '../lib/profileN6.ts';

interface NotificationsViewProps {
  onBack: () => void;
  onToast: (message: string) => void;
  locale: Locale;
}

/**
 * Fase N6 (G7 + P12): Preferensi Notifikasi. BUKAN price alert (C2 tetap
 * ditolak) — toggle "Parfum baru terbit" + radio pengingat 1 minggu /
 * 1 hari / 15 menit. Fase N12 (gerbang S3 dibuka): toggle "Update
 * pesanan" DIAKTIFKAN — pengguna bisa memilih diberi tahu saat status
 * pesanan berubah (pemberitahuan tampil sebagai baris Inbox; belum ada
 * push notification server). Disimpan ke localStorage saat "Konfirmasi"
 * (bukan backend — belum ada endpoint preferensi notifikasi).
 */
export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, onToast, locale }) => {
  const t = translations[locale];
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());

  const reminderLabels: Record<NotificationReminder, string> = {
    week: t.notificationsView.reminderWeek,
    day: t.notificationsView.reminderDay,
    '15min': t.notificationsView.reminderMinutes,
  };

  const confirm = () => {
    saveNotificationPrefs(prefs);
    onToast(t.notificationsView.saved);
  };

  return (
    <div data-testid="notifications-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.notificationsView.backToSettings}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.notificationsView.title}
      </h1>
      <p className="text-[14px] leading-[20px] text-secondary">{t.notificationsView.intro}</p>

      {/* Toggle: Parfum baru terbit. */}
      <div className="flex items-center justify-between gap-4 border-b border-hairline py-4 min-h-[48px]">
        <span className="text-[14px] leading-[20px] font-bold text-ink">{t.notificationsView.newReleases}</span>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.newReleases}
          aria-label={t.notificationsView.newReleases}
          onClick={() => setPrefs(p => ({ ...p, newReleases: !p.newReleases }))}
          className={`relative w-12 h-7 rounded-full transition flex-none cursor-pointer ${prefs.newReleases ? 'bg-ink' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-6 h-6 rounded-full bg-white shadow transition-transform ${prefs.newReleases ? 'translate-x-5' : 'translate-x-0'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Toggle: Update pesanan — AKTIF sejak gerbang S3 dibuka (Fase N12). */}
      <div className="border-b border-hairline py-4 min-h-[48px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[14px] leading-[20px] font-bold text-ink">{t.notificationsView.orderUpdates}</span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.orderUpdates}
            aria-label={t.notificationsView.orderUpdates}
            onClick={() => setPrefs(p => ({ ...p, orderUpdates: !p.orderUpdates }))}
            className={`relative w-12 h-7 rounded-full transition flex-none cursor-pointer ${prefs.orderUpdates ? 'bg-ink' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-6 h-6 rounded-full bg-white shadow transition-transform ${prefs.orderUpdates ? 'translate-x-5' : 'translate-x-0'}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <p className="text-[13px] leading-[18px] text-muted mt-1">{t.notificationsView.orderUpdatesNote}</p>
      </div>

      {/* Radio pengingat. */}
      <fieldset>
        <legend className="text-[14px] leading-[20px] font-bold text-ink">{t.notificationsView.reminderLabel}</legend>
        <div className="flex flex-col gap-2 mt-3" role="radiogroup" aria-label={t.notificationsView.reminderLabel}>
          {NOTIFICATION_REMINDERS.map(r => {
            const selected = prefs.reminder === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPrefs(p => ({ ...p, reminder: r }))}
                className={`flex items-center justify-between min-h-[48px] rounded-full border px-5 text-[14px] font-bold transition cursor-pointer ${selected ? 'bg-bar text-paper border-bar' : 'border-border bg-paper text-ink hover:border-bar'}`}
              >
                <span>{reminderLabels[r]}</span>
                <span
                  className="w-[20px] h-[20px] rounded-full border-2 border-current inline-flex items-center justify-center flex-none"
                  aria-hidden="true"
                >
                  <span className={`w-[10px] h-[10px] rounded-full bg-current ${selected ? 'opacity-100' : 'opacity-0'}`} />
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="text-[13px] leading-[18px] text-muted">{t.notificationsView.phoneNote}</p>

      <button
        type="button"
        onClick={confirm}
        className="w-full min-h-[48px] rounded-full bg-bar hover:bg-ink text-paper text-[14px] font-bold transition active:scale-[0.97] cursor-pointer"
      >
        {t.notificationsView.confirm}
      </button>
    </div>
  );
};
