// Fase N6 (G1, G2, G7, G8, G12, G13, G15, G16 + P1, P10, P12, P13):
// logika murni layar Profil/Settings/Bahasa — tanpa DOM, bisa diuji node:test.
import type { Locale } from './i18n.ts';

/**
 * G16: versi aplikasi. package.json masih "0.0.0" (default npm, bukan
 * versi nyata) dan task N6 hanya mengizinkan perubahan script test di
 * package.json — jadi versinya satu konstanta di sini, dicatat eksplisit.
 * Bila founder menetapkan mekanisme versi, konstanta ini yang diganti.
 */
export const APP_VERSION = '0.1.0';

/** P13 / G15: visibilitas profil — default Privat (Journal tetap privat). */
export type ProfileVisibility = 'everyone' | 'members' | 'private';

export const PROFILE_VISIBILITIES: readonly ProfileVisibility[] = ['everyone', 'members', 'private'] as const;

export const DEFAULT_VISIBILITY: ProfileVisibility = 'private';

export const VISIBILITY_STORAGE_KEY = 'senstoria_profile_visibility';

export function isProfileVisibility(value: unknown): value is ProfileVisibility {
  return value === 'everyone' || value === 'members' || value === 'private';
}

/** Baca visibilitas tersimpan; nilai asing/rusak → default Privat. */
export function loadVisibility(storage: SizeStorageLike | null = defaultStorage()): ProfileVisibility {
  if (!storage) return DEFAULT_VISIBILITY;
  try {
    const raw = storage.getItem(VISIBILITY_STORAGE_KEY);
    return isProfileVisibility(raw) ? raw : DEFAULT_VISIBILITY;
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

export function saveVisibility(value: ProfileVisibility, storage: SizeStorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(VISIBILITY_STORAGE_KEY, value);
  } catch {
    // Penyimpanan penuh/diblokir — pilihan tetap berlaku untuk sesi ini.
  }
}

/**
 * P12 / G7: preferensi notifikasi. BUKAN price alert (C2 tetap ditolak).
 * "Update pesanan" ditunda sampai S3 — nilainya selalu false sampai
 * penjualan dibuka; UI menampilkannya nonaktif dengan penjelasan.
 */
export type NotificationReminder = 'week' | 'day' | '15min';

export const NOTIFICATION_REMINDERS: readonly NotificationReminder[] = ['week', 'day', '15min'] as const;

export interface NotificationPrefs {
  newReleases: boolean;
  orderUpdates: boolean;
  reminder: NotificationReminder;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  newReleases: true,
  orderUpdates: false,
  reminder: 'day',
};

export const NOTIFICATION_PREFS_STORAGE_KEY = 'senstoria_notification_prefs';

export function isNotificationReminder(value: unknown): value is NotificationReminder {
  return value === 'week' || value === 'day' || value === '15min';
}

/** Baca preferensi tersimpan; field asing/rusak → default per field. */
export function loadNotificationPrefs(storage: SizeStorageLike | null = defaultStorage()): NotificationPrefs {
  if (!storage) return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    const raw = storage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_NOTIFICATION_PREFS };
    const p = parsed as Record<string, unknown>;
    return {
      newReleases: typeof p.newReleases === 'boolean' ? p.newReleases : DEFAULT_NOTIFICATION_PREFS.newReleases,
      // Fase N12 (gerbang S3 dibuka): orderUpdates kini dibaca dari
      // simpanan seperti field lain — penjualan sudah dibuka.
      orderUpdates: typeof p.orderUpdates === 'boolean' ? p.orderUpdates : DEFAULT_NOTIFICATION_PREFS.orderUpdates,
      reminder: isNotificationReminder(p.reminder) ? p.reminder : DEFAULT_NOTIFICATION_PREFS.reminder,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs, storage: SizeStorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Penyimpanan penuh/diblokir — preferensi tetap berlaku untuk sesi ini.
  }
}

export interface SizeStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): SizeStorageLike | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // localStorage tidak tersedia (mis. node:test) — pemanggil memakai
    // penyimpanan injeksi atau menerima nilai default.
  }
  return null;
}

/**
 * G1: "Member sejak {tahun}" — HANYA bila ISO creationTime tersedia.
 * Tahun di luar rentang wajar (sebelum Senstoria berdiri / masa depan)
 * dianggap tidak tersedia, bukan ditebak. Mengembalikan null bila tidak
 * ada tahun yang bisa ditampilkan.
 */
export function memberSinceYear(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const nowYear = new Date().getUTCFullYear();
  if (year < 2020 || year > nowYear) return null;
  return year;
}

/**
 * G1: inisial avatar 64px — satu huruf pertama nama, kapital.
 * Nama kosong → '' (pemanggil menampilkan ikon pengguna).
 */
export function initialFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed[0]!.toUpperCase();
}

/**
 * G12: label Akun Tertaut — hanya menampilkan status dari providerId
 * Firebase yang sebenarnya (providerData). 'password' = masuk via Email.
 * Provider tak dikenal → null (tidak ditampilkan, bukan ditebak).
 */
export function providerLabel(providerId: string): string | null {
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'apple.com') return 'Apple';
  if (providerId === 'password') return 'Email';
  return null;
}

/** Label bahasa aktif untuk baris Bahasa di Settings. */
export function languageLabel(locale: Locale): 'Bahasa Indonesia' | 'English' {
  return locale === 'id' ? 'Bahasa Indonesia' : 'English';
}
