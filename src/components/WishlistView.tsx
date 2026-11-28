import React, { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { translations, fmt, formatCurrency, type Locale } from '../lib/i18n.ts';
import type { SeedPerfume } from '../data/seedPerfumes.ts';
import { Bottle } from './Bottle.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { EmptyState } from './EmptyState.tsx';
import {
  WISHLIST_SIZES,
  getRememberedSize,
  loadSizeMemory,
  rememberSize,
  resolveWishlistPerfumes,
  saveSizeMemory,
} from '../lib/wishlistN5.ts';

interface WishlistViewProps {
  wishlistIds: string[];
  perfumes: SeedPerfume[];
  onRemoveWishlist: (perfumeId: string) => void;
  onSelectPerfume: (id: string) => void;
  onNavigateToCatalog: () => void;
  onNavigateToLibrary: () => void;
  /** Tambah botol langsung dari sheet (E2): ukuran sudah dipilih di sheet. */
  onAddBottleToLibrary: (perfumeId: string, sizeMl: number) => void;
  locale: Locale;
}

/**
 * Fase N5 (E1–E2 + P3): Wishlist sebagai layar penuh pola Favourites Nike.
 * Sebelumnya wishlist hanya berupa hati di kartu; layar ini yang mengelolanya.
 * Tetap layar (bukan tab) sampai keputusan slot tab. Status BR-03
 * dipertahankan: wishlist bukan owned dan tidak dihitung (tidak ada logika
 * hitung yang disentuh di sini — daftar hanya dibaca dari wishlistIds).
 * Kartu memakai identitas kartu Katalog (U-03): panel foto 1:1 + brand +
 * nama + harga di bawah foto — bedanya dengan Katalog, harga referensi
 * DITAMPILKAN di sini (rencana E1 harfiah), karena ini layar Wishlist,
 * bukan grid Katalog (J-12/P8 hanya melarang harga di Katalog).
 */
export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  perfumes,
  onRemoveWishlist,
  onSelectPerfume,
  onNavigateToCatalog,
  onNavigateToLibrary,
  onAddBottleToLibrary,
  locale,
}) => {
  const t = translations[locale];
  const wishlistPerfumes = resolveWishlistPerfumes(wishlistIds, perfumes);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sheetPerfume, setSheetPerfume] = useState<SeedPerfume | null>(null);
  const [selectedSize, setSelectedSize] = useState<number>(50);
  const [sizeMemory, setSizeMemory] = useState(() => loadSizeMemory());

  // Daftar habis saat mode Edit → keluar dari mode Edit (tidak ada yang diedit).
  useEffect(() => {
    if (wishlistPerfumes.length === 0 && isEditMode) setIsEditMode(false);
  }, [wishlistPerfumes.length, isEditMode]);

  const openSizeSheet = (perfume: SeedPerfume) => {
    setSelectedSize(getRememberedSize(sizeMemory, perfume.id, perfume.reference_price_size_ml || 50));
    setSheetPerfume(perfume);
  };

  const chooseSize = (size: number) => {
    if (!sheetPerfume) return;
    setSelectedSize(size);
    // E2: ukuran terakhir yang dipilih diingat per parfum — disimpan saat
    // dipilih, bukan hanya saat ditambahkan, supaya tetap ingat bila sheet
    // ditutup tanpa menambah botol.
    const next = rememberSize(sizeMemory, sheetPerfume.id, size);
    setSizeMemory(next);
    saveSizeMemory(next);
  };

  const addToLibrary = () => {
    if (!sheetPerfume) return;
    onAddBottleToLibrary(sheetPerfume.id, selectedSize);
    setSheetPerfume(null);
  };

  return (
    <div data-testid="wishlist-screen" className="space-y-6">
      {/* Kembali ke Lemari — pola tombol kembali Detail (bukan tab). */}
      <button
        type="button"
        onClick={onNavigateToLibrary}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.wishlistView.backToLibrary}</span>
      </button>

      {/* Header: judul + Edit (mockup 07-wishlist: h1 36px + tombol Edit). */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[36px] leading-[40px] font-extrabold tracking-[-0.02em] text-ink">
          {t.wishlistView.title}
        </h1>
        {wishlistPerfumes.length > 0 && (
          <button
            type="button"
            data-testid="wishlist-edit-toggle"
            aria-pressed={isEditMode}
            onClick={() => setIsEditMode(v => !v)}
            className="min-h-[44px] min-w-[44px] px-2 text-[14px] font-bold text-ink hover:text-secondary transition"
          >
            {isEditMode ? t.wishlistView.done : t.wishlistView.edit}
          </button>
        )}
      </div>

      {wishlistPerfumes.length === 0 ? (
        <div data-testid="wishlist-empty">
          <EmptyState
            title={t.wishlistView.emptyTitle}
            body={t.libraryView.wewangianYangMenarikMinatmuDanInginK}
            ctaLabel={t.wishlistView.exploreCatalog}
            onCtaClick={onNavigateToCatalog}
            iconType="shelf"
          />
        </div>
      ) : (
        <div
          data-testid="wishlist-grid"
          aria-label={t.wishlistView.title}
          className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4"
        >
          {wishlistPerfumes.map(perfume => {
            const removeLabel = fmt(t.wishlistView.removeFromWishlist, `${perfume.brand} ${perfume.name}`);
            return (
              <article key={perfume.id} className="flex flex-col space-y-3 break-inside-avoid animate-card-enter">
                {/* Panel foto 1:1 — identitas kartu Katalog (U-03). */}
                <div
                  role="button"
                  tabIndex={isEditMode ? -1 : 0}
                  aria-label={`${perfume.brand} ${perfume.name}`}
                  onClick={() => { if (!isEditMode) onSelectPerfume(perfume.id); }}
                  onKeyDown={e => {
                    if (isEditMode) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPerfume(perfume.id);
                    }
                  }}
                  className="aspect-square w-full bg-gray-100 flex items-center justify-center relative cursor-pointer group p-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {perfume.image_url ? (
                    <img
                      src={perfume.image_url}
                      alt={`${perfume.brand} ${perfume.name}`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Bottle
                      fragranceId={perfume.id}
                      name={perfume.name}
                      brand={perfume.brand}
                      size="sm"
                      showFill={false}
                    />
                  )}
                  {/* Mode Edit: tombol × hitam di tiap kartu (E1, W-82 sebagian).
                      Hit area 44px (aturan sentuh) dengan lingkaran visual 32px. */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveWishlist(perfume.id);
                      }}
                      title={removeLabel}
                      aria-label={removeLabel}
                      className="absolute top-2 right-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-[0.97] transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center">
                        <X className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </button>
                  )}
                </div>

                {/* Nama + brand + harga di bawah foto (E1). */}
                <div className="min-w-0 space-y-1">
                  <span className="block text-[14px] leading-[20px] text-ink">
                    {perfume.brand}
                  </span>
                  <h3 className="text-[20px] leading-[26px] font-bold text-ink line-clamp-2">
                    <button
                      type="button"
                      onClick={() => { if (!isEditMode) onSelectPerfume(perfume.id); }}
                      className="cursor-pointer hover:underline text-left"
                    >
                      {perfume.name}
                    </button>
                  </h3>
                  <p className="text-[14px] leading-[20px] font-semibold text-ink tabular-nums">
                    {formatCurrency(perfume.reference_price_idr, locale)}
                  </p>
                </div>

                {/* Aksi utama kartu (disembunyikan saat mode Edit — di sana
                    × yang bekerja). Membuka size sheet (E2). */}
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => openSizeSheet(perfume)}
                    className="w-full min-h-[44px] py-2.5 bg-bar hover:bg-ink text-paper text-xs font-semibold transition cursor-pointer rounded-full"
                  >
                    {t.wishlistView.addToLibrary}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── FASE N5 (E2): SIZE SHEET DARI WISHLIST ── */}
      <BottomSheetOrModal
        isOpen={!!sheetPerfume}
        onClose={() => setSheetPerfume(null)}
        locale={locale}
        title={sheetPerfume ? fmt(t.wishlistView.sizeSheetTitle, `${sheetPerfume.brand} ${sheetPerfume.name}`) : ''}
        subtitle={t.wishlistView.sizeSheetSubtitle}
        maxWidth="max-w-md"
      >
        <div data-testid="wishlist-size-sheet" className="space-y-3">
          <div className="flex gap-2" role="group" aria-label={t.wishlistView.sizeSheetTitle}>
            {WISHLIST_SIZES.map(size => (
              <button
                key={size}
                type="button"
                aria-pressed={selectedSize === size}
                onClick={() => chooseSize(size)}
                className={`flex-1 min-h-[48px] rounded-full border text-[14px] font-medium transition ${selectedSize === size ? 'bg-bar text-paper border-bar' : 'border-border bg-card text-ink hover:border-bar'}`}
              >
                {size} ml
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={addToLibrary}
            className="w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full transition"
          >
            {t.wishlistView.addToLibrary}
          </button>
        </div>
      </BottomSheetOrModal>
    </div>
  );
};
