import type { Locale } from './i18n.ts';

/**
 * Deteksi bahasa dari browser (Fase N11, W-19). Senstoria hanya punya
 * dua locale — 'id' dan 'en' — jadi pemetaannya eksplisit dan jujur:
 * apa pun yang diawali 'en' (en, en-US, en-GB, …) → 'en'; sisanya
 * (id, id-ID, atau bahasa lain yang tidak didukung) → 'id'.
 * Tidak pernah menebak locale ketiga; tidak pernah melempar.
 */
export function detectLocale(navigatorLanguage: string | undefined | null): Locale {
  if (typeof navigatorLanguage === 'string' && navigatorLanguage.trim() !== '') {
    const lang = navigatorLanguage.trim().toLowerCase();
    if (lang === 'en' || lang.startsWith('en-') || lang.startsWith('en_')) return 'en';
  }
  return 'id';
}

/**
 * Locale awal aplikasi: locale yang TERSIMPAN menang — deteksi browser
 * hanya dipakai bila pengguna belum pernah memilih (W-19: deteksi
 * tidak boleh menimpa pilihan eksplisit pengguna).
 */
export function resolveInitialLocale(
  stored: string | null | undefined,
  navigatorLanguage: string | undefined | null
): Locale {
  if (stored === 'en' || stored === 'id') return stored;
  return detectLocale(navigatorLanguage);
}
