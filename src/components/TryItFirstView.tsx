import React, { useState } from 'react';
import { translations, fmt, Locale } from '../lib/i18n.ts';
import { PUBLISHED_PERFUMES, SeedPerfume } from '../data/seedPerfumes.ts';

interface TryItFirstViewProps {
  locale: Locale;
  onSelectPerfume: (id: string) => void;
  onOpenWaitlist: (perfumeId: string) => void;
}

type TryItFirstTab = 'feed' | 'inStock' | 'upcoming' | 'waitlist';

/**
 * Tahap 5 — Try It First Feed gaya SNKRS, di bawah keputusan founder
 * 2 Nov 2026 08:31 WIB: "Jual decant tapi semua masih di kategori
 * Waitlist Coming Soon."
 *
 * Struktur persis sesuai klarifikasi founder 2 Nov 2026 08:32 WIB, tanpa
 * kategori lain: Feed (halaman utama) + In Stock + Upcoming + Waitlist.
 *
 * Kejujuran yang dijaga di sini (bukan janji stok/tanggal/angka):
 * - Feed: daftar parfum published + Detail + Daftar Antrean (modal yang
 *   sudah ada), tiap penawaran decant berlabel Waitlist / Coming Soon.
 * - In Stock: state kosong jujur — belum ada decant tersedia, tidak ada
 *   stok, harga, atau tombol beli decant apa pun.
 * - Upcoming: kategori Coming Soon — daftar decant yang masih Waitlist /
 *   Coming Soon (parfum published), tanpa tanggal, tanpa angka, tanpa
 *   klaim kuota/pesanan terpenuhi. Penjelasan dua syarat pindah ke
 *   In Stock (kuota terpenuhi DAN full bottle dipesan dari brand)
 *   dinyatakan sebagai syarat, bukan sebagai status yang sudah tercapai.
 * - Waitlist: panel penjelasan jujur — entri user TIDAK ditampilkan
 *   karena tidak ada endpoint entri-sendiri dan firestore.rules menolak
 *   baca client (admin only). Tidak ada daftar, jumlah, atau progres
 *   palsu; CTA kembali ke Feed untuk daftar.
 * - Countdown: TIDAK ADA angka countdown di sini — tidak ada kuota dan
 *   tidak ada endpoint agregat publik. Countdown nyata butuh keputusan
 *   kuota + endpoint agregat privacy-safe sebagai pekerjaan lanjutan.
 * - Tidak ada harga decant di mana pun (Q13 undecided; catatan lama
 *   "Harga diumumkan saat peluncuran" dipertahankan).
 * - Navigasi header dan view SPA tidak berubah (bukan route URL baru);
 *   owned-gating di luar view ini tidak diubah.
 */
export function TryItFirstView({ locale, onSelectPerfume, onOpenWaitlist }: TryItFirstViewProps) {
  const t = translations[locale].tryItFirstView;
  const perfumes = PUBLISHED_PERFUMES;
  const [tab, setTab] = useState<TryItFirstTab>('feed');

  const pillars = [
    { title: t.pillar1Title, body: t.pillar1Body },
    { title: t.pillar2Title, body: t.pillar2Body },
    { title: t.pillar3Title, body: t.pillar3Body },
  ];

  const tabs: { id: TryItFirstTab; label: string }[] = [
    { id: 'feed', label: t.tabFeed },
    { id: 'inStock', label: t.tabInStock },
    { id: 'upcoming', label: t.tabUpcoming },
    { id: 'waitlist', label: t.tabWaitlist },
  ];

  const renderPerfumeCard = (p: SeedPerfume) => (
    <div key={p.id} className="p-4 bg-paper border border-hairline space-y-3">
      <div className="space-y-1">
        <p className="font-medium text-ink">{p.name}</p>
        <p className="text-xs text-secondary">{p.brand}</p>
        {p.top_notes && (
          <p className="text-xs text-secondary">{t.notesLabel} {p.top_notes}</p>
        )}
        <p className="text-xs text-secondary">{t.priceNote}</p>
        <p>
          <span className="inline-block px-2 py-1 bg-bar text-paper font-mono text-xs">
            {t.decantComingSoonLabel}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectPerfume(p.id)}
          className="px-4 py-2.5 border border-hairline hover:border-secondary text-sm transition min-h-[44px]"
        >
          {t.detailButton}
        </button>
        <button
          type="button"
          onClick={() => onOpenWaitlist(p.id)}
          className="px-4 py-2.5 bg-bar hover:bg-ink text-paper text-sm font-medium transition min-h-[44px]"
        >
          {t.joinButton}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-hairline pb-6">
        <p className="font-mono text-xs text-secondary uppercase">{t.kicker}</p>
        <h1 className="font-serif text-3xl md:text-4xl text-bar font-normal leading-tight">{t.title}</h1>
        <p className="text-sm text-secondary max-w-2xl leading-relaxed">{t.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.tabListLabel}>
        {tabs.map(tabDef => (
          <button
            key={tabDef.id}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.id}
            onClick={() => setTab(tabDef.id)}
            className={`px-4 py-2.5 text-sm transition min-h-[44px] ${
              tab === tabDef.id
                ? 'bg-bar text-paper font-medium'
                : 'bg-card border border-hairline text-secondary hover:border-ink hover:text-ink'
            }`}
          >
            {tabDef.label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map(p => (
              <div key={p.title} className="p-4 bg-surface border border-hairline space-y-2">
                <p className="font-medium text-ink">{p.title}</p>
                <p className="text-sm text-secondary leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-secondary">
              {perfumes.length === 0 ? t.emptyCatalog : fmt(t.publishedCount, String(perfumes.length))}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {perfumes.map(renderPerfumeCard)}
            </div>
          </div>
        </div>
      )}

      {tab === 'inStock' && (
        <div className="space-y-3 p-4 bg-surface border border-hairline">
          <p className="font-medium text-ink">{t.inStockEmptyTitle}</p>
          <p className="text-sm text-secondary leading-relaxed">{t.inStockEmptyBody}</p>
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="space-y-4">
          <p className="text-sm text-secondary max-w-2xl leading-relaxed">{t.upcomingIntro}</p>
          <p className="text-sm text-secondary">
            {perfumes.length === 0 ? t.emptyCatalog : fmt(t.publishedCount, String(perfumes.length))}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {perfumes.map(renderPerfumeCard)}
          </div>
        </div>
      )}

      {tab === 'waitlist' && (
        <div className="space-y-3 p-4 bg-surface border border-hairline">
          <p className="font-medium text-ink">{t.waitlistTitle}</p>
          <p className="text-sm text-secondary leading-relaxed">{t.waitlistBody}</p>
          <button
            type="button"
            onClick={() => setTab('feed')}
            className="px-4 py-2.5 bg-bar hover:bg-ink text-paper text-sm font-medium transition min-h-[44px]"
          >
            {t.waitlistBackButton}
          </button>
        </div>
      )}
    </div>
  );
}
