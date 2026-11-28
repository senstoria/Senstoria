import React, { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { EmptyState } from './EmptyState.tsx';

interface InboxViewProps {
  onBack: () => void;
  onNavigateToCatalog: () => void;
  locale: Locale;
}

/**
 * Fase N6 (G8 + P10): Inbox — pesan sistem NYATA saja.
 * - Satu baris permanen: "Selamat datang di Senstoria" → artikel
 *   sambutan. Artikel ditulis HANYA dari copy Senstoria yang sudah
 *   disetujui dan sudah ada di aplikasi (sumber per paragraf, di bawah)
 *   — tidak ada kalimat, angka, atau janji yang dikarang.
 * - Baris "Waitlist decant {nama parfum} terkonfirmasi" TIDAK DIBANGUN:
 *   firestore.rules (waitlist_entries) hanya mengizinkan baca oleh admin
 *   — client TIDAK BISA membaca entrinya sendiri (sengaja, hash-locked
 *   admin-only). Membangun baris itu butuh perubahan rules (founder-only)
 *   atau endpoint server; bukan ditebak dari localStorage.
 * - "Pesananmu telah dikirim" hanya nanti di S3 — tidak ada sekarang.
 * - Inbox kosong = empty state jujur (cabang ini tidak terjangkau selama
 *   baris sambutan permanen, tapi dipertahankan supaya tidak ada keadaan
 *   yang me-render layar kosong tanpa penjelasan).
 *
 * Sumber artikel sambutan (semuanya sudah ada di aplikasi):
 * P1 — tagline (i18n app.tagline): "Perpustakaan Aroma Pribadi &
 *      Pencari Selera".
 * P2 — hero subtitle Beranda (i18n home.heroSubtitle).
 * P3 — 3 langkah Beranda (i18n app.n1/n2/n3...): Finder → Lemari → Jurnal.
 * P4 — kebijakan privasi (i18n legal.privacyS4B): Jurnal privat.
 */
export const InboxView: React.FC<InboxViewProps> = ({ onBack, onNavigateToCatalog, locale }) => {
  const t = translations[locale];
  const [articleOpen, setArticleOpen] = useState(false);
  // Satu-satunya pesan sistem hari ini: sambutan. Daftar ini yang
  // menentukan empty state — bila suatu hari baris sambutan bisa dihapus,
  // daftar kosong me-render empty state jujur (G8/P10), bukan layar kosong.
  const messages: { id: string }[] = [{ id: 'welcome' }];

  if (articleOpen) {
    return (
      <div data-testid="inbox-article" className="space-y-6">
        <button
          type="button"
          onClick={() => setArticleOpen(false)}
          className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.inboxView.backToInbox}</span>
        </button>
        <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
          {t.inboxView.welcomeTitle}
        </h1>
        <div className="space-y-4">
          <p className="text-[14px] leading-[22px] text-ink">{t.inboxView.articleP1}</p>
          <p className="text-[14px] leading-[22px] text-ink">{t.inboxView.articleP2}</p>
          <p className="text-[14px] leading-[22px] text-ink">{t.inboxView.articleP3}</p>
          <p className="text-[14px] leading-[22px] text-ink">{t.inboxView.articleP4}</p>
        </div>
        <button
          type="button"
          onClick={onNavigateToCatalog}
          className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
        >
          {t.wishlistView.exploreCatalog}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="inbox-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.inboxView.backToProfile}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.inboxView.title}
      </h1>

      {messages.length === 0 ? (
        <EmptyState
          title={t.inboxView.emptyTitle}
          body={t.inboxView.emptyBody}
          ctaLabel={t.wishlistView.exploreCatalog}
          onCtaClick={onNavigateToCatalog}
          iconType="shelf"
        />
      ) : (
        <nav aria-label={t.inboxView.title}>
          <button
            type="button"
            data-testid="inbox-welcome-row"
            onClick={() => setArticleOpen(true)}
            className="flex w-full items-center justify-between gap-3 bg-paper border-b border-hairline py-4 text-left min-h-[48px] cursor-pointer"
          >
            <span className="min-w-0">
              <span className="block text-[14px] leading-[20px] font-bold text-ink">{t.inboxView.welcomeTitle}</span>
              <span className="block text-[13px] leading-[18px] text-muted">{t.inboxView.welcomeSub}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-secondary flex-none" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};
