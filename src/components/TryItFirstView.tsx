import React, { useState } from 'react';
import { translations, fmt, Locale, formatCurrency } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';

export interface DecantProduct {
  id: string;
  perfumeId?: string;
  name: string;
  brand: string;
  family: string;
  origin: 'ID' | 'INT';
  fullBottlePrice: number;
  availableSizes: {
    sizeMl: number;
    label: string;
    price: number;
  }[];
  dominantNotes: string[];
  description: string;
}

const OFFICIAL_DECANTS: DecantProduct[] = [
  {
    id: 'hmns-orgasm',
    perfumeId: 'prf_001',
    name: 'Orgasm',
    brand: 'HMNS',
    family: 'floral',
    origin: 'ID',
    fullBottlePrice: 385000,
    dominantNotes: ['Melati', 'Apel Merah', 'Mawar', 'Vanila'],
    description: 'Aroma floral gourmand lokal dengan kehangatan vanila dan semerbak kelopak bunga segar.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 35000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 75000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 135000 }
    ]
  },
  {
    id: 'saff-loui',
    perfumeId: 'prf_002',
    name: 'Loui',
    brand: 'Saff & Co',
    family: 'aquatic',
    origin: 'ID',
    fullBottlePrice: 249000,
    dominantNotes: ['Jeruk Nipis', 'Bunga Teratai', 'Cedarwood'],
    description: 'Kesegaran embun pagi tropis yang bersih dan membangkitkan suasana hati seketika.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 29000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 59000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 99000 }
    ]
  },
  {
    id: 'mykonos-matcha-latte',
    perfumeId: 'prf_007',
    name: 'Matcha Latte',
    brand: 'Mykonos',
    family: 'gourmand',
    origin: 'ID',
    fullBottlePrice: 279000,
    dominantNotes: ['Teh Hijau', 'Susu Hangat', 'Vanila', 'Cokelat Putih'],
    description: 'Sensasi creamy matcha hangat yang menenangkan untuk menemani sore hari.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 32000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 68000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 115000 }
    ]
  },
  {
    id: 'alchemist-pink-laundry',
    perfumeId: 'prf_006',
    name: 'Pink Laundry',
    brand: 'Alchemist Fragrance',
    family: 'floral',
    origin: 'ID',
    fullBottlePrice: 289000,
    dominantNotes: ['Chamomile', 'Melati', 'Sandalwood'],
    description: 'Aroma cucian linen bersih yang baru dijemur di bawah sinar matahari pagi berangin sepoi.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 32000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 65000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 119000 }
    ]
  },
  {
    id: 'le-labo-santal-33',
    perfumeId: 'prf_008',
    name: 'Santal 33',
    brand: 'Le Labo',
    family: 'woody',
    origin: 'INT',
    fullBottlePrice: 4200000,
    dominantNotes: ['Australian Sandalwood', 'Cardamom', 'Cedarwood', 'Leather'],
    description: 'Aroma kayu ikonik dunia dengan nuansa rempah hangat dan kulit halus bernuansa tenang.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 95000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 215000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 395000 }
    ]
  },
  {
    id: 'diptyque-philosykos',
    perfumeId: 'prf_009',
    name: 'Philosykos',
    brand: 'Diptyque',
    family: 'green',
    origin: 'INT',
    fullBottlePrice: 2850000,
    dominantNotes: ['Daun Ara', 'Susu Kelapa', 'Cedarwood'],
    description: 'Kesegaran rindang pohon buah ara Mediterania di bawah semilir angin musim panas.',
    availableSizes: [
      { sizeMl: 2, label: '2ml Vial (±30 semprot)', price: 95000 },
      { sizeMl: 5, label: '5ml Decant (±75 semprot)', price: 215000 },
      { sizeMl: 10, label: '10ml Travel (±150 semprot)', price: 395000 }
    ]
  }
];

interface TryItFirstViewProps {
  locale?: Locale;
  onSelectPerfume?: (id: string) => void;
  onOpenWaitlist?: (perfumeId: string) => void;
}

export const TryItFirstView: React.FC<TryItFirstViewProps> = ({
  locale = 'id',
  onSelectPerfume,
  onOpenWaitlist
}) => {
  const [selectedProduct, setSelectedProduct] = useState<DecantProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<number>(5);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState<'ALL' | 'ID' | 'INT'>('ALL');

  const isId = locale === 'id';

  const filteredDecants = OFFICIAL_DECANTS.filter((d) => {
    if (filterOrigin === 'ALL') return true;
    return d.origin === filterOrigin;
  });

  const handleOpenOrderModal = (product: DecantProduct, sizeMl: number) => {
    if (onOpenWaitlist && product.perfumeId) {
      onOpenWaitlist(product.perfumeId);
      return;
    }
    setSelectedProduct(product);
    setSelectedSize(sizeMl);
    setSubmitted(false);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-10">
      {/* Editorial Header */}
      <div className="space-y-3 border-b border-hairline pb-8">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-secondary font-semibold">
            {translations[locale].tryItFirstView.layananResmiSenstoria}
          </p>
          <span className="text-xs text-secondary">·</span>
          <span className="border border-border text-bar px-2 py-0.5 text-xs font-mono">
            {translations[locale].sampleDataBadge}
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-bar font-normal leading-tight">
          {translations[locale].tryItFirstView.cobaDuluSebelumMemutuskanBotolPenuh}
        </h1>
        <p className="text-sm text-secondary max-w-2xl leading-relaxed">
          {translations[locale].tryItFirstView.hindariPenyesalanBlindBuySenstoriaMen}
        </p>
      </div>

      {/* Value Pillars (3 Minimal Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface border border-hairline space-y-2">
          <span className="text-xs font-mono font-bold text-bar block">01</span>
          <h2 className="text-base font-serif font-bold text-bar">
            {translations[locale].tryItFirstView.n100KeaslianTerverifikasi}
          </h2>
          <p className="text-xs text-secondary leading-relaxed">
            {translations[locale].tryItFirstView.hanyaMenggunakanBotolAsliDariDistribu}
          </p>
        </div>

        <div className="p-6 bg-surface border border-hairline space-y-2">
          <span className="text-xs font-mono font-bold text-bar block">02</span>
          <h2 className="text-base font-serif font-bold text-bar">
            {translations[locale].tryItFirstView.wadahKacaSterilKedapUdara}
          </h2>
          <p className="text-xs text-secondary leading-relaxed">
            {translations[locale].tryItFirstView.dipindahkanDenganPipetSterilKeDalamB}
          </p>
        </div>

        <div className="p-6 bg-surface border border-hairline space-y-2">
          <span className="text-xs font-mono font-bold text-bar block">03</span>
          <h2 className="text-base font-serif font-bold text-bar">
            {translations[locale].tryItFirstView.ujiKulitNyata37Hari}
          </h2>
          <p className="text-xs text-secondary leading-relaxed">
            {translations[locale].tryItFirstView.cukupUntukMengamatiPerformaSillageLon}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-hairline pb-4 gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'ID', 'INT'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterOrigin(mode)}
              className={`px-4 py-2 text-xs font-medium border transition-colors ${
                filterOrigin === mode
                  ? 'bg-bar text-paper border-bar'
                  : 'bg-white text-secondary border-hairline hover:text-bar'
              }`}
            >
              {mode === 'ALL' 
                ? (translations[locale].tryItFirstView.semuaDecant)
                : mode === 'ID' 
                  ? (translations[locale].tryItFirstView.parfumLokal) 
                  : (translations[locale].tryItFirstView.parfumInternasional)}
            </button>
          ))}
        </div>
        <span className="text-xs text-secondary">
          {filteredDecants.length} {translations[locale].tryItFirstView.parfumDecantTersedia}
        </span>
      </div>

      {/* Decant Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecants.map((item) => (
          <div
            key={item.id}
            className="flex flex-col bg-white border border-hairline overflow-hidden"
          >
            {/* Visual Aura Stage with Bottle */}
            <div className="p-8 flex items-center justify-center min-h-[200px] bg-surface border-b border-hairline">
              <Bottle
                fragranceId={item.id}
                name={item.name}
                brand={item.brand}
                family={item.family}
                size="md"
              />
            </div>

            {/* Product Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <span className="font-mono uppercase tracking-wider text-secondary">
                    {item.brand} {item.origin === 'ID' && translations[locale].tryItFirstView.localBadge}
                  </span>
                  <span className="text-secondary">
                    {translations[locale].tryItFirstView.botolPenuh}: {formatCurrency(item.fullBottlePrice, locale)}
                  </span>
                </div>
                
                <h3 
                  onClick={() => item.perfumeId && onSelectPerfume?.(item.perfumeId)}
                  className={`text-xl font-serif text-bar ${item.perfumeId ? 'cursor-pointer hover:underline' : ''}`}
                >
                  {item.name}
                </h3>
                
                <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Dominant notes inline */}
              <div className="text-xs text-secondary space-x-1">
                <span className="font-medium text-bar">{translations[locale].tryItFirstView.aromaUtama}</span>
                <span>{item.dominantNotes.join(' · ')}</span>
              </div>

              {/* Available Sizes & Actions */}
              <div className="pt-3 border-t border-hairline space-y-2">
                <span className="text-xs font-semibold text-bar block">
                  {translations[locale].tryItFirstView.pilihanDecant}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {item.availableSizes.map((sz) => (
                    <button
                      key={sz.sizeMl}
                      onClick={() => handleOpenOrderModal(item, sz.sizeMl)}
                      className="p-2 border border-border hover:bg-surface transition text-left flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-bar">
                        {sz.sizeMl}ml
                      </span>
                      <span className="text-xs font-mono text-secondary mt-1">
                        {formatCurrency(sz.price, locale)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for direct waitlist confirmation */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="bg-paper border border-bar max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-hairline pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-secondary block">
                  {selectedProduct.brand}
                </span>
                <h3 className="text-2xl font-serif text-bar">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs font-mono border border-bar px-2 py-1 hover:bg-surface"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm font-semibold text-bar">
                  {translations[locale].tryItFirstView.permintaanCobaDuluTercatat}
                </p>
                <p className="text-xs text-secondary leading-relaxed">
                  {fmt(translations[locale].tryItFirstView.timSenstoriaAkanMengabariKetersediaan, selectedProduct.name, selectedSize)}
                </p>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2.5 bg-bar text-paper text-xs font-medium hover:bg-ink transition"
                >
                  {translations[locale].compareView.tutup}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-bar block">
                    {translations[locale].tryItFirstView.pilihUkuranDecant}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.availableSizes.map((sz) => (
                      <button
                        type="button"
                        key={sz.sizeMl}
                        onClick={() => setSelectedSize(sz.sizeMl)}
                        className={`p-2 border text-left text-xs ${
                          selectedSize === sz.sizeMl
                            ? 'bg-bar text-paper border-bar'
                            : 'bg-white border-border text-bar'
                        }`}
                      >
                        <span className="block font-semibold">{sz.sizeMl}ml</span>
                        <span className="block font-mono text-xs">{formatCurrency(sz.price, locale)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-bar block">
                    {translations[locale].tryItFirstView.nomorWhatsapp}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+628123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-white border border-bar text-xs font-mono focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-bar block">
                    {translations[locale].tryItFirstView.emailOpsional}
                  </label>
                  <input
                    type="email"
                    placeholder={translations[locale].tryItFirstView.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-bar text-xs font-mono focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                <p className="text-xs text-secondary leading-relaxed">
                  {translations[locale].tryItFirstView.layananCobaDuluSenstoriaMenyediakanDe}
                </p>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 border border-border text-xs hover:bg-surface"
                  >
                    {translations[locale].review.batal}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-bar text-paper text-xs font-medium hover:bg-ink transition"
                  >
                    {translations[locale].tryItFirstView.daftarAntreanDecant}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
