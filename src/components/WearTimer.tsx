import { useEffect, useState } from 'react';
import type { WearLogState } from '../lib/derivedCalculations.ts';
import type { Locale } from '../lib/i18n.ts';

export function WearTimer({ wearLogs, locale }: { wearLogs: WearLogState[]; locale: Locale }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  let start = -Infinity;
  for (const wear of wearLogs) {
    // Older date-only logs have no recorded start time.
    if (wear.worn_at?.length <= 10) continue;
    const timestamp = Date.parse(wear.worn_at);
    if (timestamp >= midnight.getTime() && timestamp <= now) {
      start = Math.max(start, timestamp);
    }
  }
  if (!Number.isFinite(start)) return null;

  const elapsed = Math.floor((now - start) / 1000);
  const clock = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60]
    .map(unit => String(unit).padStart(2, '0')).join(':');
  const startLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit', minute: '2-digit',
  }).format(start);

  return (
    <section data-testid="home-wear-timer" className="rounded-hero bg-surface p-5 text-ink">
      <h2 className="font-bold">{locale === 'id' ? 'Sedang dipakai' : 'Currently wearing'}</h2>
      <p className="text-sm text-secondary">
        {locale === 'id' ? 'Mulai pukul' : 'Started at'}{' '}
        <time dateTime={new Date(start).toISOString()}>{startLabel}</time>
      </p>
      <p role="timer" className="mt-2 text-3xl font-extrabold tabular-nums">{clock}</p>
    </section>
  );
}
