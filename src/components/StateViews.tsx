/**
 * Tahap 2 (26 Nov 2026) — komponen keadaan layar bersama (§4 spesifikasi).
 *
 * Dipakai oleh ketujuh layar utama lewat prop `previewState` (URL
 * `?state=…`) maupun oleh keadaan nyata layar itu sendiri. Setiap panel
 * memakai bahasa biasa, menyebut apa yang bisa dilakukan pengguna, dan
 * menyediakan jalan keluar (coba lagi / hapus filter / kembali) — tidak
 * ada keadaan buntu. Skeleton mengikuti layout asli tiap layar dan
 * memakai `animate-pulse`, yang dihormati `prefers-reduced-motion`
 * lewat aturan global di index.css (durasi 0.01ms).
 */
import React from 'react';
import { AlertCircle, PackageOpen, SearchX, WifiOff, X } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import type { StatePreview } from '../lib/statePreview.ts';
import { STATE_PREVIEW_VALUES } from '../lib/statePreview.ts';
import { fmt } from '../lib/i18n.ts';

export type SkeletonLayout =
  | 'home'
  | 'library'
  | 'diary'
  | 'catalog'
  | 'detail'
  | 'tryitfirst'
  | 'finder';

/** Blok skeleton: permukaan kartu + garis-garis yang meniru isi aslinya. */
function Skel({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-hairline ${className}`} />;
}

/** Skeleton per layar — bentuknya mengikuti layout asli layar itu. */
export function ViewSkeleton({
  locale,
  layout,
}: {
  locale: Locale;
  layout: SkeletonLayout;
}) {
  const t = translations[locale].stateViews;
  return (
    <div role="status" aria-label={t.loadingLabel} className="animate-pulse space-y-8">
      <span className="sr-only">{t.loadingLabel}</span>
      {layout === 'home' && (
        <>
          <div className="space-y-4">
            <Skel className="h-3 w-40" />
            <Skel className="h-9 w-4/5" />
            <Skel className="h-9 w-3/5" />
            <Skel className="h-4 w-full max-w-xl" />
            <div className="flex flex-wrap gap-3 pt-2">
              <Skel className="h-12 w-40 rounded-full" />
              <Skel className="h-12 w-40 rounded-full" />
              <Skel className="h-12 w-44" />
            </div>
          </div>
          <div className="bg-surface border border-hairline p-6 space-y-6">
            <div className="flex justify-between">
              <Skel className="h-3 w-32" />
              <Skel className="h-3 w-24" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skel className="h-11 w-full" />
              <Skel className="h-11 w-full" />
              <Skel className="h-11 w-full" />
            </div>
            <Skel className="h-24 w-full" />
          </div>
          <div className="bg-surface border border-hairline p-6 space-y-4">
            <Skel className="h-4 w-2/3" />
            <Skel className="h-4 w-1/2" />
          </div>
        </>
      )}
      {layout === 'library' && (
        <>
          <div className="space-y-3">
            <Skel className="h-7 w-56" />
            <Skel className="h-4 w-80 max-w-full" />
          </div>
          {[0, 1].map(i => (
            <div key={i} className="bg-surface border border-hairline p-5 flex gap-4">
              <Skel className="h-24 w-20 shrink-0" />
              <div className="flex-1 space-y-3">
                <Skel className="h-5 w-2/3" />
                <Skel className="h-4 w-1/2" />
                <Skel className="h-2 w-full" />
                <Skel className="h-12 w-full rounded-full" />
              </div>
            </div>
          ))}
        </>
      )}
      {layout === 'diary' && (
        <>
          <div className="flex gap-2">
            <Skel className="h-10 w-24 rounded-full" />
            <Skel className="h-10 w-24 rounded-full" />
            <Skel className="h-10 w-24 rounded-full" />
          </div>
          {[0, 1].map(i => (
            <div key={i} className="bg-surface border border-hairline p-5 space-y-3">
              <div className="flex justify-between">
                <Skel className="h-4 w-32" />
                <Skel className="h-4 w-20" />
              </div>
              <Skel className="h-4 w-full" />
              <Skel className="h-4 w-3/4" />
            </div>
          ))}
        </>
      )}
      {layout === 'catalog' && (
        <>
          <Skel className="h-12 w-full" />
          <div className="flex gap-2 overflow-hidden">
            <Skel className="h-8 w-24 shrink-0" />
            <Skel className="h-8 w-24 shrink-0" />
            <Skel className="h-8 w-24 shrink-0" />
            <Skel className="h-8 w-24 shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-surface border border-hairline p-4 space-y-3">
                <Skel className="h-32 w-full" />
                <Skel className="h-4 w-3/4" />
                <Skel className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </>
      )}
      {layout === 'detail' && (
        <>
          <div className="flex justify-between gap-3">
            <Skel className="h-4 w-32" />
            <Skel className="h-8 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 bg-surface border border-hairline p-8">
              <Skel className="h-64 w-full" />
            </div>
            <div className="md:col-span-7 space-y-4">
              <Skel className="h-3 w-32" />
              <Skel className="h-9 w-4/5" />
              <Skel className="h-4 w-full" />
              <Skel className="h-4 w-2/3" />
              <div className="flex gap-3 pt-2">
                <Skel className="h-12 w-40 rounded-full" />
                <Skel className="h-12 w-32" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Skel className="h-5 w-48" />
            <Skel className="h-4 w-full" />
            <Skel className="h-4 w-5/6" />
          </div>
        </>
      )}
      {layout === 'tryitfirst' && (
        <>
          <div className="space-y-3">
            <Skel className="h-7 w-56" />
            <Skel className="h-4 w-80 max-w-full" />
          </div>
          <Skel className="h-12 w-full" />
          <div className="flex gap-2 overflow-hidden">
            <Skel className="h-8 w-24 shrink-0" />
            <Skel className="h-8 w-24 shrink-0" />
            <Skel className="h-8 w-24 shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="bg-surface border border-hairline p-4 space-y-3">
                <Skel className="h-28 w-full" />
                <Skel className="h-4 w-3/4" />
                <Skel className="h-10 w-full rounded-full" />
              </div>
            ))}
          </div>
        </>
      )}
      {layout === 'finder' && (
        <div className="bg-surface border border-hairline p-6 md:p-8 space-y-6">
          <Skel className="h-3 w-40" />
          <Skel className="h-7 w-4/5" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <Skel key={i} className="h-12 w-full" />
            ))}
          </div>
          <Skel className="h-12 w-full rounded-full" />
        </div>
      )}
    </div>
  );
}

/** Keadaan error: kata biasa, input tidak hilang, tombol coba lagi. */
export function ViewError({ locale, onRetry }: { locale: Locale; onRetry: () => void }) {
  const t = translations[locale].stateViews;
  return (
    <div role="alert" className="border border-hairline bg-surface p-8 md:p-10 space-y-4 text-center">
      <AlertCircle className="w-8 h-8 text-secondary mx-auto" aria-hidden="true" />
      <p className="font-display text-[22px] leading-[28px] text-ink">{t.errorTitle}</p>
      <p className="text-[14px] leading-[22px] text-secondary max-w-md mx-auto">{t.errorBody}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] px-6 bg-bar hover:bg-ink text-paper text-sm font-medium rounded-full transition cursor-pointer"
      >
        {t.retryLabel}
      </button>
    </div>
  );
}

/** Keadaan kosong (hasil filter): tidak ada yang cocok + hapus filter. */
export function ViewEmptyResults({
  locale,
  query,
  onClear,
}: {
  locale: Locale;
  query?: string;
  onClear: () => void;
}) {
  const t = translations[locale].stateViews;
  return (
    <div className="border border-hairline bg-surface p-8 md:p-10 space-y-4 text-center">
      <SearchX className="w-8 h-8 text-secondary mx-auto" aria-hidden="true" />
      <p className="font-display text-[22px] leading-[28px] text-ink">{t.emptyFilterTitle}</p>
      <p className="text-[14px] leading-[22px] text-secondary max-w-md mx-auto">
        {query ? fmt(t.emptyFilterBodyQuery, query) : t.emptyFilterBody}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="min-h-[44px] px-6 border border-bar text-ink text-sm font-medium rounded-full transition hover:bg-surface cursor-pointer"
      >
        {t.clearFiltersLabel}
      </button>
    </div>
  );
}

/** Keadaan kosong (Detail): produk tidak ditemukan lewat tautan. */
export function ViewNotFound({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const t = translations[locale].stateViews;
  return (
    <div className="border border-hairline bg-surface p-8 md:p-10 space-y-4 text-center">
      <SearchX className="w-8 h-8 text-secondary mx-auto" aria-hidden="true" />
      <p className="font-display text-[22px] leading-[28px] text-ink">{t.notFoundTitle}</p>
      <p className="text-[14px] leading-[22px] text-secondary max-w-md mx-auto">{t.notFoundBody}</p>
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] px-6 bg-bar hover:bg-ink text-paper text-sm font-medium rounded-full transition cursor-pointer"
      >
        {t.backToCatalogLabel}
      </button>
    </div>
  );
}

/** Keadaan kosong (Beranda): lemari belum berisi botol apa pun. */
export function ViewEmptyHome({
  locale,
  onBrowseCatalog,
}: {
  locale: Locale;
  onBrowseCatalog: () => void;
}) {
  const t = translations[locale].stateViews;
  return (
    <div className="border border-hairline bg-surface p-8 md:p-10 space-y-4 text-center">
      <PackageOpen className="w-8 h-8 text-secondary mx-auto" aria-hidden="true" />
      <p className="font-display text-[22px] leading-[28px] text-ink">{t.emptyHomeTitle}</p>
      <p className="text-[14px] leading-[22px] text-secondary max-w-md mx-auto">{t.emptyHomeBody}</p>
      <button
        type="button"
        onClick={onBrowseCatalog}
        className="min-h-[44px] px-6 bg-bar hover:bg-ink text-paper text-sm font-medium rounded-full transition cursor-pointer"
      >
        {t.browseCatalogLabel}
      </button>
    </div>
  );
}

/** Banner offline: apa yang masih berfungsi + apa yang butuh koneksi. */
export function OfflineBanner({ locale }: { locale: Locale }) {
  const t = translations[locale].stateViews;
  return (
    <div
      role="status"
      className="flex items-start gap-3 border border-bar bg-surface p-4"
    >
      <WifiOff className="w-5 h-5 text-ink shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{t.offlineTitle}</p>
        <p className="text-[13px] leading-[20px] text-secondary mt-0.5">{t.offlineBody}</p>
      </div>
    </div>
  );
}

const PREVIEW_STATE_LABEL_KEY: Record<StatePreview, 'previewStateEmpty' | 'previewStateEmptyFilter' | 'previewStateLoading' | 'previewStateError' | 'previewStateOffline' | 'previewStateDestructive'> = {
  empty: 'previewStateEmpty',
  'empty-filter': 'previewStateEmptyFilter',
  loading: 'previewStateLoading',
  error: 'previewStateError',
  offline: 'previewStateOffline',
  destructive: 'previewStateDestructive',
};

/**
 * Bar kecil di atas konten saat `?state=…` aktif: menyebut keadaan yang
 * sedang dipratinjau, memberi jalan keluar, dan — supaya setiap keadaan
 * bisa dicapai dari layar mana pun, termasuk Finder yang bukan tab —
 * pemilih keadaan untuk berpindah keadaan tanpa memuat ulang. Bukan
 * bagian produk — hanya terlihat selama pratinjau.
 */
export function PreviewBar({
  locale,
  state,
  onExit,
  onStateChange,
}: {
  locale: Locale;
  state: StatePreview;
  onExit: () => void;
  onStateChange: (next: StatePreview) => void;
}) {
  const t = translations[locale].stateViews;
  return (
    <div className="flex items-center justify-between gap-3 bg-bar text-paper px-4 py-2">
      <p className="text-[13px] leading-[20px] min-w-0">
        <span className="font-medium">{t.previewBarLabel}: </span>
        <span>{t[PREVIEW_STATE_LABEL_KEY[state]]}</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <select
          aria-label={t.previewBarSelectLabel}
          value={state}
          onChange={e => onStateChange(e.target.value as StatePreview)}
          className="min-h-[44px] bg-transparent text-paper text-[13px] font-medium border border-paper/40 rounded-full px-3 cursor-pointer"
        >
          {STATE_PREVIEW_VALUES.map(v => (
            <option key={v} value={v}>
              {t[PREVIEW_STATE_LABEL_KEY[v]]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onExit}
          aria-label={t.previewBarExit}
          className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center gap-1.5 text-[13px] font-medium underline underline-offset-4 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t.previewBarExit}</span>
        </button>
      </div>
    </div>
  );
}
