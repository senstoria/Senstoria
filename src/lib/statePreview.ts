/**
 * Tahap 2 (26 Nov 2026) — keadaan layar lewat URL `?state=…`.
 *
 * Enam keadaan §4 spesifikasi (kosong, kosong hasil filter, loading,
 * error, offline, destruktif) bisa dicapai lewat query string, misalnya
 * `/katalog?state=loading` atau `/pustaka?state=error`. Nilai yang tidak
 * dikenal diabaikan (null) — URL biasa tanpa `?state=` tidak berubah.
 *
 * Bukan rute fitur baru dan bukan state navigasi: ini hanya sakelar
 * pratinjau/uji untuk keadaan yang di layar nyata muncul dari data,
 * jaringan, atau tindakan pengguna. `?state=offline` memaksa banner
 * offline tampil; status koneksi nyata tetap dibaca lewat
 * `useOnlineStatus` (event online/offline browser).
 */
import { useEffect, useState } from 'react';

export const STATE_PREVIEW_VALUES = [
  'empty',
  'empty-filter',
  'loading',
  'error',
  'offline',
  'destructive',
] as const;

export type StatePreview = (typeof STATE_PREVIEW_VALUES)[number];

export function parseStatePreview(search: string): StatePreview | null {
  try {
    const value = new URLSearchParams(search).get('state');
    return (STATE_PREVIEW_VALUES as readonly string[]).includes(value ?? '')
      ? (value as StatePreview)
      : null;
  } catch {
    return null;
  }
}

/** True selama browser melaporkan koneksi online (event online/offline). */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return online;
}

/**
 * True 300ms setelah `active` menjadi true, false lagi saat `active`
 * false — aturan skeleton §4 spesifikasi: skeleton baru muncul bila
 * loading melebihi ~300ms, supaya muat cepat tidak berkedip. Dipakai
 * cabang loading `?state=loading` (Katalog dan Finder punya logika
 * 300ms-nya sendiri yang sudah ada).
 */
export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (!active) {
      setFlag(false);
      return;
    }
    const timer = setTimeout(() => setFlag(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return flag;
}
