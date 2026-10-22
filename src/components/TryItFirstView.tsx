import React, { useState } from 'react';
import { Locale, formatCurrency } from '../lib/i18n.ts';
import { Bottle } from './Bottle.tsx';
import { ScentAura } from './ScentAura.tsx';

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
      <div className="space-y-3 border-b border-[#D9D7C9] pb-8">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-[#5C5C5C] font-semibold">
            {isId ? 'Layanan Resmi Senstoria' : 'Official Senstoria Service'}
          </p>
          <span className="text-xs text-[#5C5C5C]">·</span>
          <span className="border border-[#8A8A8A] text-[#1A1A1A] px-2 py-0.5 text-xs font-mono">
            {isId ? 'Data contoh' : 'Sample data'}
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-normal leading-tight">
          {isId ? 'Coba Dulu Sebelum Memutuskan Botol Penuh' : 'Try It First Before Committing to a Full Bottle'}
        </h1>
        <p className="text-sm text-[#5C5C5C] max-w-2xl leading-relaxed">
          {isId 
            ? 'Hindari penyesalan blind-buy. Senstoria menyediakan decant resmi dalam ukuran 2ml, 5ml, dan 10ml langsung dari botol asli untuk uji ketahanan di kulitmu selama 3-7 hari.'
            : 'Avoid blind-buy regrets. Senstoria provides official decants in 2ml, 5ml, and 10ml sizes taken directly from verified authentic bottles for 3-7 days of genuine skin testing.'}
        </p>
      </div>

      {/* Value Pillars (3 Minimal Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#F4F3E6] border border-[#D9D7C9] space-y-2">
          <span className="text-xs font-mono font-bold text-[#333333] block">01</span>
          <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
            {isId ? '100% Keaslian Terverifikasi' : '100% Verified Authenticity'}
          </h2>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            {isId 
              ? 'Hanya menggunakan botol asli dari distributor resmi atau produsen terdaftar. Tanpa pengencer atau bahan kimia tambahan.'
              : 'Sourced strictly from official brand distributors and licensed houses. No dilution or fillers.'}
          </p>
        </div>

        <div className="p-6 bg-[#F4F3E6] border border-[#D9D7C9] space-y-2">
          <span className="text-xs font-mono font-bold text-[#333333] block">02</span>
          <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
            {isId ? 'Wadah Kaca Steril Kedap Udara' : 'Sterile Airtight Glass Vials'}
          </h2>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            {isId
              ? 'Dipindahkan dengan pipet steril ke dalam botol kaca kedap udara untuk menjaga integritas piramida aroma.'
              : 'Decanted with sterile equipment into airtight glass vials to preserve top, heart, and base notes intact.'}
          </p>
        </div>

        <div className="p-6 bg-[#F4F3E6] border border-[#D9D7C9] space-y-2">
          <span className="text-xs font-mono font-bold text-[#333333] block">03</span>
          <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
            {isId ? 'Uji Kulit Nyata 3–7 Hari' : 'Real Skin Test (3–7 Days)'}
          </h2>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            {isId
              ? 'Cukup untuk mengamati performa sillage, longevity, dan reaksi aroma dengan suhu kulitmu dalam berbagai suasana.'
              : 'Enough sprays to evaluate sillage, longevity, and skin drydown in real Indonesian weather conditions.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#D9D7C9] pb-4 gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'ID', 'INT'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterOrigin(mode)}
              className={`px-4 py-2 text-xs font-medium border transition-colors ${
                filterOrigin === mode
                  ? 'bg-[#333333] text-[#FFFEF2] border-[#333333]'
                  : 'bg-white text-[#5C5C5C] border-[#D9D7C9] hover:text-[#1A1A1A]'
              }`}
            >
              {mode === 'ALL' 
                ? (isId ? 'Semua Decant' : 'All Decants')
                : mode === 'ID' 
                  ? (isId ? 'Parfum Lokal' : 'Local Indonesian') 
                  : (isId ? 'Parfum Internasional' : 'International')}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#5C5C5C]">
          {filteredDecants.length} {isId ? 'parfum decant tersedia' : 'decants available'}
        </span>
      </div>

      {/* Decant Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecants.map((item) => (
          <div
            key={item.id}
            className="flex flex-col bg-white border border-[#D9D7C9] overflow-hidden"
          >
            {/* Visual Aura Stage with Bottle */}
            <div className="p-8 flex items-center justify-center min-h-[200px] bg-[#F4F3E6] border-b border-[#D9D7C9]">
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
                  <span className="font-mono uppercase tracking-wider text-[#5C5C5C]">
                    {item.brand} {item.origin === 'ID' && '· Lokal'}
                  </span>
                  <span className="text-[#5C5C5C]">
                    {isId ? 'Botol penuh' : 'Full bottle'}: {formatCurrency(item.fullBottlePrice, locale)}
                  </span>
                </div>
                
                <h3 
                  onClick={() => item.perfumeId && onSelectPerfume?.(item.perfumeId)}
                  className={`text-xl font-serif text-[#1A1A1A] ${item.perfumeId ? 'cursor-pointer hover:underline' : ''}`}
                >
                  {item.name}
                </h3>
                
                <p className="text-xs text-[#5C5C5C] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Dominant notes inline */}
              <div className="text-xs text-[#5C5C5C] space-x-1">
                <span className="font-medium text-[#1A1A1A]">{isId ? 'Aroma utama:' : 'Main notes:'}</span>
                <span>{item.dominantNotes.join(' · ')}</span>
              </div>

              {/* Available Sizes & Actions */}
              <div className="pt-3 border-t border-[#D9D7C9] space-y-2">
                <span className="text-xs font-semibold text-[#1A1A1A] block">
                  {isId ? 'Pilihan Decant:' : 'Available Decant Sizes:'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {item.availableSizes.map((sz) => (
                    <button
                      key={sz.sizeMl}
                      onClick={() => handleOpenOrderModal(item, sz.sizeMl)}
                      className="p-2 border border-[#8A8A8A] hover:bg-[#F4F3E6] transition text-left flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        {sz.sizeMl}ml
                      </span>
                      <span className="text-xs font-mono text-[#5C5C5C] mt-1">
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#FFFEF2] border border-[#333333] max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-[#D9D7C9] pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-[#5C5C5C] block">
                  {selectedProduct.brand}
                </span>
                <h3 className="text-2xl font-serif text-[#1A1A1A]">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs font-mono border border-[#333333] px-2 py-1 hover:bg-[#F4F3E6]"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {isId ? 'Permintaan Coba Dulu Tercatat' : 'Decant Request Recorded'}
                </p>
                <p className="text-xs text-[#5C5C5C] leading-relaxed">
                  {isId
                    ? `Tim Senstoria akan mengabari ketersediaan batch decant ${selectedProduct.name} ukuran ${selectedSize}ml ke kontakmu.`
                    : `Senstoria team will notify you when the ${selectedProduct.name} (${selectedSize}ml) batch is ready for dispatch.`}
                </p>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2.5 bg-[#333333] text-[#FFFEF2] text-xs font-medium hover:bg-black transition"
                >
                  {isId ? 'Tutup' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1A1A1A] block">
                    {isId ? 'Pilih Ukuran Decant:' : 'Select Decant Size:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.availableSizes.map((sz) => (
                      <button
                        type="button"
                        key={sz.sizeMl}
                        onClick={() => setSelectedSize(sz.sizeMl)}
                        className={`p-2 border text-left text-xs ${
                          selectedSize === sz.sizeMl
                            ? 'bg-[#333333] text-[#FFFEF2] border-[#333333]'
                            : 'bg-white border-[#8A8A8A] text-[#1A1A1A]'
                        }`}
                      >
                        <span className="block font-semibold">{sz.sizeMl}ml</span>
                        <span className="block font-mono text-xs">{formatCurrency(sz.price, locale)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1A1A1A] block">
                    {isId ? 'Nomor WhatsApp:' : 'WhatsApp Number:'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+628123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#333333] text-xs font-mono focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1A1A1A] block">
                    {isId ? 'Email (opsional):' : 'Email (optional):'}
                  </label>
                  <input
                    type="email"
                    placeholder="kamu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#333333] text-xs font-mono focus:outline-hidden"
                  />
                </div>

                <p className="text-xs text-[#5C5C5C] leading-relaxed">
                  {isId
                    ? '* Layanan Coba Dulu Senstoria menyediakan decant original 100% dari botol terverifikasi.'
                    : '* Senstoria Try It First guarantees 100% genuine decants from authentic bottles.'}
                </p>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 border border-[#8A8A8A] text-xs hover:bg-[#F4F3E6]"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#333333] text-[#FFFEF2] text-xs font-medium hover:bg-black transition"
                  >
                    {isId ? 'Daftar Antrean Decant' : 'Join Decant Waitlist'}
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
