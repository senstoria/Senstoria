import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Droplet, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Package, 
  QrCode, 
  Clock, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { WaitlistState, SampleOrderState, calculateFairSamplePrice } from '../lib/derivedCalculations.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

interface TryItFirstModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfume: SeedPerfume;
  userEmail?: string;
  userPhone?: string;
  userId?: string;
  locale: Locale;
  initialFeatureFlagOrdering?: boolean;
  onSaveWaitlist: (entry: WaitlistState) => void;
  onSaveSampleOrder: (order: SampleOrderState) => void;
}

export function TryItFirstModal({
  isOpen,
  onClose,
  perfume,
  userEmail = '',
  userPhone = '',
  userId,
  locale,
  initialFeatureFlagOrdering = false,
  onSaveWaitlist,
  onSaveSampleOrder
}: TryItFirstModalProps) {
  // Feature flag state (TRY-02)
  const [featureFlagOrdering, setFeatureFlagOrdering] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('senstoria_flag_try_it_first_ordering');
      return saved !== null ? JSON.parse(saved) : initialFeatureFlagOrdering;
    } catch {
      return initialFeatureFlagOrdering;
    }
  });

  // Active tab inside modal: 'waitlist' or 'checkout'
  const [activeTab, setActiveTab] = useState<'waitlist' | 'checkout'>(
    featureFlagOrdering ? 'checkout' : 'waitlist'
  );

  // Sync tab when flag changes
  useEffect(() => {
    try {
      localStorage.setItem('senstoria_flag_try_it_first_ordering', JSON.stringify(featureFlagOrdering));
    } catch {
      // ignore
    }
    if (!featureFlagOrdering && activeTab === 'checkout') {
      setActiveTab('waitlist');
    }
  }, [featureFlagOrdering, activeTab]);

  // Price calculations
  const pricePerMl = Math.round(perfume.reference_price_idr / (perfume.reference_price_size_ml || 50));
  const [selectedSize, setSelectedSize] = useState<2 | 5 | 10>(5);
  const fairDecantPrice = calculateFairSamplePrice(pricePerMl, selectedSize);

  // Waitlist form state
  const [waitlistWillingness, setWaitlistWillingness] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [waitlistFairPrice, setWaitlistFairPrice] = useState<number>(fairDecantPrice);
  const [waitlistEmail, setWaitlistEmail] = useState<string>(userEmail || '');
  const [waitlistPhone, setWaitlistPhone] = useState<string>(userPhone || '');
  const [waitlistNotificationPref, setWaitlistNotificationPref] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [waitlistSuccess, setWaitlistSuccess] = useState<boolean>(false);

  // Update suggested fair price when size changes
  useEffect(() => {
    setWaitlistFairPrice(calculateFairSamplePrice(pricePerMl, selectedSize));
  }, [selectedSize, pricePerMl]);

  // Checkout order stub form state (TRY-02)
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>(userPhone || '');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [courier, setCourier] = useState<'jne' | 'sicepat' | 'gosend'>('jne');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'gopay'>('qris');
  const [orderCompleted, setOrderCompleted] = useState<SampleOrderState | null>(null);

  const courierCosts = {
    jne: 12000,
    sicepat: 15000,
    gosend: 25000
  };

  const shippingCost = courierCosts[courier];
  const totalOrderPrice = fairDecantPrice + shippingCost;

  if (!isOpen) return null;

  // Handle Waitlist Submit
  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: WaitlistState = {
      id: 'wait_' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      email: waitlistEmail || 'collector@example.com',
      perfume_id: perfume.id,
      perfume_name: perfume.name,
      brand: perfume.brand,
      size_ml: selectedSize,
      willingness: waitlistWillingness,
      fair_price_idr: waitlistFairPrice,
      whatsapp_number: waitlistPhone,
      notification_pref: waitlistNotificationPref,
      status: 'active',
      created_at: new Date().toISOString()
    };

    onSaveWaitlist(entry);
    setWaitlistSuccess(true);
  };

  // Handle Checkout Order Stub Submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const order: SampleOrderState = {
      id: 'sord_' + Math.random().toString(36).substring(2, 9),
      order_number: orderNumber,
      user_id: userId,
      perfume_id: perfume.id,
      perfume_name: perfume.name,
      brand: perfume.brand,
      size_ml: selectedSize,
      sample_price_idr: fairDecantPrice,
      shipping_courier: courier,
      shipping_cost_idr: shippingCost,
      total_idr: totalOrderPrice,
      recipient_name: recipientName || 'Kolektor Senstoria',
      whatsapp_number: recipientPhone || '+628123456789',
      shipping_address: shippingAddress || 'Jl. Sudirman Kav 21, Jakarta Selatan',
      payment_method: paymentMethod,
      status: 'confirmed_simulation',
      flag_used: 'try_it_first_ordering',
      created_at: new Date().toISOString()
    };

    onSaveSampleOrder(order);
    setOrderCompleted(order);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#FFFEF2] border border-[#1A1A1A] max-w-lg w-full my-8 p-6 md:p-8 space-y-6 shadow-2xl relative text-[#1A1A1A]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#5C5C5C] hover:text-black border border-transparent hover:border-[#D9D7C9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Perfume Snapshot */}
        <div className="border-b border-[#D9D7C9] pb-4 space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#8A4B14] font-bold">
              TRY IT FIRST · SAMPLE & DECANT DEMAND
            </span>
            <span className="text-[9px] font-mono bg-white border border-[#D9D7C9] px-1.5 py-0.5 text-[#5C5C5C]">
              {perfume.origin === 'ID' ? 'Artisan Lokal' : 'Global Designer'}
            </span>
          </div>

          <h3 className="font-serif text-2xl md:text-3xl font-normal">
            {perfume.brand} — {perfume.name}
          </h3>

          <p className="text-xs text-[#5C5C5C]">
            {perfume.concentration} · {perfume.primary_family} · Botol Penuh: {formatCurrency(perfume.reference_price_idr, locale)} ({perfume.reference_price_size_ml} ml)
          </p>
        </div>

        {/* ── FEATURE FLAG CONTROLLER (TRY-02) ── */}
        <div className="bg-[#F4F3E6] border border-[#D9D7C9] p-3 text-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[10px] text-[#8A4B14]">FEATURE FLAG:</span>
              <code className="text-[10px] font-mono bg-white px-1.5 py-0.5 border border-[#D9D7C9]">try_it_first_ordering</code>
            </div>
            <p className="text-[11px] text-[#5C5C5C]">
              {featureFlagOrdering 
                ? 'Aktif: Stub checkout pemesanan decant dibuka untuk pengujian simulasi.' 
                : 'Nonaktif: Sistem hanya mengumpulkan demand agregat pada daftar tunggu.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFeatureFlagOrdering(prev => !prev)}
            className={`px-3 py-1.5 border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              featureFlagOrdering 
                ? 'bg-[#1A1A1A] text-white border-black' 
                : 'bg-white text-[#5C5C5C] border-[#D9D7C9] hover:bg-neutral-100'
            }`}
          >
            {featureFlagOrdering ? (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-400" />
                <span>Flag: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-neutral-400" />
                <span>Flag: OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Switcher if Flag is ON */}
        {featureFlagOrdering && (
          <div className="flex border-b border-[#D9D7C9] text-xs">
            <button
              onClick={() => { setActiveTab('checkout'); setOrderCompleted(null); }}
              className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${
                activeTab === 'checkout'
                  ? 'border-black text-black font-bold'
                  : 'border-transparent text-[#5C5C5C] hover:text-black'
              }`}
            >
              🛒 Pesan Sampel Langsung (Beta)
            </button>
            <button
              onClick={() => { setActiveTab('waitlist'); setWaitlistSuccess(false); }}
              className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${
                activeTab === 'waitlist'
                  ? 'border-black text-black font-bold'
                  : 'border-transparent text-[#5C5C5C] hover:text-black'
              }`}
            >
              📋 Daftar Tunggu Batch
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODE 1: WAITLIST DEMAND CAPTURE (Default when Flag OFF or Tab waitlist) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'waitlist' && (
          <div>
            {!waitlistSuccess ? (
              <form onSubmit={handleWaitlistSubmit} className="space-y-5 text-xs">
                
                {/* Size Selection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="font-semibold block">Pilih Ukuran Decant yang Diminati:</label>
                    <span className="text-[10px] text-[#8A4B14] font-mono">Estimasi harga wajar</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: 2 as const, label: '2 ml Vial', desc: '~30 semprot' },
                      { size: 5 as const, label: '5 ml Decant', desc: '~75 semprot' },
                      { size: 10 as const, label: '10 ml Travel', desc: '~150 semprot' }
                    ].map(item => {
                      const price = calculateFairSamplePrice(pricePerMl, item.size);
                      const isSelected = selectedSize === item.size;
                      return (
                        <div
                          key={item.size}
                          onClick={() => setSelectedSize(item.size)}
                          className={`p-2.5 border cursor-pointer transition text-center space-y-0.5 ${
                            isSelected ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white hover:bg-[#F4F3E6]'
                          }`}
                        >
                          <span className="block font-semibold">{item.label}</span>
                          <span className="block text-[10px] text-[#5C5C5C]">{item.desc}</span>
                          <span className="block text-[11px] font-mono text-[#8A4B14] font-bold">
                            {formatCurrency(price, locale)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Willingness to Pay */}
                <div className="space-y-1.5">
                  <label className="font-semibold block">
                    Apakah kamu bersedia membayar harga decant asli jika batch dibuka?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'yes' as const, label: 'Ya, Bersedia' },
                      { id: 'maybe' as const, label: 'Mungkin / Ragu' },
                      { id: 'no' as const, label: 'Hanya Coba Gratis' }
                    ].map(w => (
                      <label 
                        key={w.id} 
                        className={`p-2 border cursor-pointer text-center text-xs transition flex items-center justify-center gap-1.5 ${
                          waitlistWillingness === w.id ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="willingness" 
                          checked={waitlistWillingness === w.id} 
                          onChange={() => setWaitlistWillingness(w.id)}
                          className="sr-only"
                        />
                        <span>{w.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fair Price Slider/Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold">Estimasi Harga Wajar yang Bersedia Dibayar:</label>
                    <span className="font-mono text-sm font-bold text-[#8A4B14]">
                      {formatCurrency(waitlistFairPrice, locale)}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min={Math.max(15000, fairDecantPrice - 20000)}
                    max={fairDecantPrice + 35000}
                    step={5000}
                    value={waitlistFairPrice}
                    onChange={e => setWaitlistFairPrice(Number(e.target.value))}
                    className="w-full accent-[#333333]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5C5C5C] font-mono">
                    <span>Hemat</span>
                    <span>Saran Standar: {formatCurrency(fairDecantPrice, locale)}</span>
                    <span>Premium</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block">Email Penerima Kabar:</label>
                    <input 
                      type="email" 
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder="kolektor@email.com"
                      className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold block">Nomor WhatsApp (+62):</label>
                    <input 
                      type="tel" 
                      value={waitlistPhone}
                      onChange={e => setWaitlistPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full p-2 bg-white border border-[#D9D7C9] text-xs font-mono focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Notification Preference */}
                <div className="space-y-1">
                  <label className="font-semibold block">Prioritas Notifikasi:</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'whatsapp' as const, label: 'WhatsApp' },
                      { id: 'email' as const, label: 'Email' },
                      { id: 'both' as const, label: 'Keduanya' }
                    ].map(pref => (
                      <label key={pref.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="notif_pref" 
                          checked={waitlistNotificationPref === pref.id}
                          onChange={() => setWaitlistNotificationPref(pref.id)}
                          className="accent-[#333333]"
                        />
                        <span>{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold uppercase tracking-wider transition"
                >
                  Gabung Daftar Tunggu Sampel ({selectedSize} ml)
                </button>
              </form>
            ) : (
              <div className="p-6 bg-[#F4F3E6] border border-[#D9D7C9] text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-serif text-2xl font-bold">Permintaan Sampel Tercatat!</h4>
                <p className="text-xs text-[#5C5C5C] max-w-sm mx-auto leading-relaxed">
                  Kami telah mencatat minatmu untuk decant <strong>{perfume.name} ({selectedSize} ml)</strong>. Tim kurator Senstoria akan mengabari melalui {waitlistNotificationPref === 'whatsapp' ? 'WhatsApp' : 'Email'} saat kuota batch terpenuhi.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODE 2: FLAGGED ORDER CHECKOUT STUB (When Flag is ON & Tab checkout) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'checkout' && featureFlagOrdering && (
          <div>
            {!orderCompleted ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                
                {/* Size & Pricing Breakdown */}
                <div className="bg-[#F4F3E6] p-3.5 border border-[#D9D7C9] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Format Sampel:</span>
                    <span className="font-mono text-[#8A4B14] font-bold">{selectedSize} ml Atomizer Kaca</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 5, 10] as const).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-1.5 border text-center transition ${
                          selectedSize === sz ? 'bg-[#1A1A1A] text-white border-black font-bold' : 'bg-white border-[#D9D7C9]'
                        }`}
                      >
                        {sz} ml ({formatCurrency(calculateFairSamplePrice(pricePerMl, sz), locale)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block">Nama Penerima:</label>
                    <input 
                      type="text" 
                      required
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold block">Nomor WhatsApp:</label>
                    <input 
                      type="tel" 
                      required
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full p-2 bg-white border border-[#D9D7C9] text-xs font-mono focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-1">
                  <label className="font-semibold block">Alamat Pengiriman Lengkap (Indonesia):</label>
                  <textarea 
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan, 12190"
                    className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden resize-none"
                  />
                </div>

                {/* Courier Selection */}
                <div className="space-y-1">
                  <label className="font-semibold block">Pilih Kurir Pengiriman:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'jne' as const, name: 'JNE Reguler', time: '2–3 hari', cost: 12000 },
                      { id: 'sicepat' as const, name: 'SiCepat BEST', time: '1–2 hari', cost: 15000 },
                      { id: 'gosend' as const, name: 'GoSend Instant', time: 'Hari ini', cost: 25000 }
                    ].map(c => (
                      <div
                        key={c.id}
                        onClick={() => setCourier(c.id)}
                        className={`p-2 border cursor-pointer text-center space-y-0.5 transition ${
                          courier === c.id ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white'
                        }`}
                      >
                        <span className="block font-semibold text-[11px]">{c.name}</span>
                        <span className="block text-[10px] text-[#5C5C5C]">{c.time}</span>
                        <span className="block text-[11px] font-mono text-[#8A4B14]">{formatCurrency(c.cost, locale)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-1">
                  <label className="font-semibold block">Metode Pembayaran:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'qris' as const, name: 'QRIS Instan', icon: QrCode },
                      { id: 'bca_va' as const, name: 'Transfer BCA VA', icon: CreditCard },
                      { id: 'gopay' as const, name: 'GoPay / e-Wallet', icon: Package }
                    ].map(pm => {
                      const Icon = pm.icon;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-2 border cursor-pointer text-center space-y-1 transition ${
                            paymentMethod === pm.id ? 'border-2 border-black bg-[#F4F3E6] font-bold' : 'border-[#D9D7C9] bg-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto text-[#5C5C5C]" />
                          <span className="block text-[10px]">{pm.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost Summary Box */}
                <div className="border border-[#D9D7C9] p-3 space-y-1.5 bg-white">
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Decant {perfume.name} ({selectedSize} ml)</span>
                    <span className="font-mono">{formatCurrency(fairDecantPrice, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Botol Atomizer Kaca & Packaging Aman</span>
                    <span className="text-emerald-700 font-semibold">Gratis</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Ongkir ({courier.toUpperCase()})</span>
                    <span className="font-mono">{formatCurrency(shippingCost, locale)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#D9D7C9] flex justify-between items-baseline font-bold text-sm">
                    <span>Total Pembayaran:</span>
                    <span className="font-mono text-[#8A4B14] text-base">{formatCurrency(totalOrderPrice, locale)}</span>
                  </div>
                </div>

                {/* Submit Checkout */}
                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Konfirmasi Pesanan Sampel (Simulasi Resmi)</span>
                </button>
              </form>
            ) : (
              /* ORDER CONFIRMATION INVOICE / RECEIPT */
              <div className="p-6 bg-white border border-[#1A1A1A] space-y-4">
                <div className="flex justify-between items-start border-b border-[#D9D7C9] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold border border-emerald-300">
                      PESANAN TERKONFIRMASI (SIMULASI)
                    </span>
                    <h4 className="font-serif text-2xl font-bold pt-1">{orderCompleted.order_number}</h4>
                  </div>
                  <div className="text-right text-[10px] font-mono text-[#5C5C5C]">
                    <span>{new Date(orderCompleted.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[#333333]">
                    Terima kasih, <strong>{orderCompleted.recipient_name}</strong>! Pesanan decant sampelmu telah dicatat dalam sistem simulasi Try It First.
                  </p>
                  
                  <div className="p-3 bg-[#F4F3E6] border border-[#D9D7C9] space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Produk:</span>
                      <span className="font-bold">{orderCompleted.brand} - {orderCompleted.perfume_name} ({orderCompleted.size_ml} ml)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kurir:</span>
                      <span className="uppercase">{orderCompleted.shipping_courier} (Resi: SEN-EXP-{Math.floor(100000 + Math.random() * 900000)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode Bayar:</span>
                      <span className="uppercase">{orderCompleted.payment_method}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#D9D7C9] font-bold text-[#8A4B14]">
                      <span>Total Biaya:</span>
                      <span>{formatCurrency(orderCompleted.total_idr, locale)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#5C5C5C] leading-relaxed">
                    Catatan: Fitur ini beroperasi di bawah feature flag <code className="bg-neutral-100 px-1">try_it_first_ordering</code> untuk menguji alur konversi dan permintaan sampel riil.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold"
                  >
                    Tutup & Kembali
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
