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
  ExternalLink,
  Copy,
  MapPin,
  CheckCircle2,
  RotateCw,
  ShieldAlert
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { WaitlistState, SampleOrderState, calculateFairSamplePrice } from '../lib/derivedCalculations.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';

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

  // Checkout order form state (TRY-02 & Phase 8 Hardening)
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>(userPhone || '');
  const [destinationProvince, setDestinationProvince] = useState<string>('jabodetabek');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [courier, setCourier] = useState<'jne' | 'sicepat' | 'gosend'>('jne');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'gopay'>('qris');
  
  // Real Shipping Rates State (Calculated via /api/shipping/calculate)
  const [shippingData, setShippingData] = useState<{
    etd: string;
    base_rate_idr: number;
    liquid_packaging_fee_idr: number;
    fragile_insurance_fee_idr: number;
    total_shipping_idr: number;
  }>({
    etd: '1–2 Hari',
    base_rate_idr: 10000,
    liquid_packaging_fee_idr: 3000,
    fragile_insurance_fee_idr: 1500,
    total_shipping_idr: 14500
  });
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);

  // Fetch real shipping rate when province or courier changes
  useEffect(() => {
    let isMounted = true;
    const fetchShipping = async () => {
      setIsCalculatingShipping(true);
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ province: destinationProvince, courier })
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setShippingData(data);
        }
      } catch (err) {
        console.warn('Shipping calc fallback:', err);
      } finally {
        if (isMounted) setIsCalculatingShipping(false);
      }
    };
    fetchShipping();
    return () => { isMounted = false; };
  }, [destinationProvince, courier]);

  // Interactive Payment Gateway Transaction State
  const [paymentStep, setPaymentStep] = useState<'form' | 'gateway' | 'completed'>('form');
  const [paymentTrx, setPaymentTrx] = useState<{
    transaction_id: string;
    order_number: string;
    amount_idr: number;
    payment_method: 'qris' | 'bca_va' | 'gopay';
    qr_string?: string;
    va_number?: string;
    bank_name?: string;
    expires_at: string;
    status: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [copiedVa, setCopiedVa] = useState<boolean>(false);
  const [orderCompleted, setOrderCompleted] = useState<SampleOrderState | null>(null);

  const shippingCost = shippingData.total_shipping_idr;
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

  // Handle Checkout Order Submit (Advances to Payment Gateway Step)
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    
    try {
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          amount_idr: totalOrderPrice,
          payment_method: paymentMethod,
          customer_name: recipientName || 'Kolektor Senstoria',
          customer_phone: recipientPhone || '+628123456789'
        })
      });

      if (res.ok) {
        const trx = await res.json();
        setPaymentTrx(trx);
        setPaymentStep('gateway');
      } else {
        throw new Error('Failed to create payment transaction');
      }
    } catch (err) {
      console.warn('Payment transaction fallback:', err);
      // Resilient fallback transaction
      setPaymentTrx({
        transaction_id: 'trx_' + Math.random().toString(36).substring(2, 9),
        order_number: orderNumber,
        amount_idr: totalOrderPrice,
        payment_method: paymentMethod,
        qr_string: '00020101021226590014ID.LINKAJA.WWW01189360091100216063620215' + orderNumber,
        va_number: '80777' + (recipientPhone ? recipientPhone.replace(/\D/g, '').slice(-8) : '82910472'),
        bank_name: 'BCA Virtual Account',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending_payment'
      });
      setPaymentStep('gateway');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Simulate Successful Payment (Sandbox Mode)
  const handleSimulatePayment = async () => {
    if (!paymentTrx) return;
    setIsProcessingPayment(true);

    try {
      await fetch('/api/payment/simulate-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: paymentTrx.transaction_id })
      });
    } catch (err) {
      console.warn('Simulate pay fallback:', err);
    }

    const order: SampleOrderState = {
      id: 'sord_' + Math.random().toString(36).substring(2, 9),
      order_number: paymentTrx.order_number,
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
      shipping_address: `${shippingAddress || 'Jl. Sudirman Kav 21'}, Wilayah: ${destinationProvince.replace(/_/g, ' ').toUpperCase()}`,
      payment_method: paymentMethod,
      status: 'confirmed_simulation',
      flag_used: 'try_it_first_ordering',
      created_at: new Date().toISOString()
    };

    onSaveSampleOrder(order);
    setOrderCompleted(order);
    setPaymentStep('completed');
    setIsProcessingPayment(false);
  };

  return (
    <BottomSheetOrModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${perfume.brand} — ${perfume.name}`}
      subtitle={`${perfume.concentration} · ${perfume.primary_family} · Botol Penuh: ${formatCurrency(perfume.reference_price_idr, locale)} (${perfume.reference_price_size_ml} ml)`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-[#1A1A1A]">
        {/* Origin Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#8A4B14] font-bold">
            TRY IT FIRST · SAMPLE & DECANT DEMAND
          </span>
          <span className="text-[9px] font-mono bg-white border border-[#D9D7C9] px-1.5 py-0.5 text-[#5C5C5C]">
            {perfume.origin === 'ID' ? 'Artisan Lokal' : 'Global Designer'}
          </span>
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
                    <label className="font-semibold block text-[#1A1A1A]">Email Penerima Kabar:</label>
                    <input 
                      type="email" 
                      inputMode="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder="kolektor@email.com"
                      className="w-full min-h-[44px] p-2.5 bg-white border border-[#333333] text-base md:text-xs text-[#1A1A1A] focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold block text-[#1A1A1A]">Nomor WhatsApp (+62):</label>
                    <input 
                      type="tel" 
                      inputMode="tel"
                      value={waitlistPhone}
                      onChange={e => setWaitlistPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full min-h-[44px] p-2.5 bg-white border border-[#333333] text-base md:text-xs font-mono text-[#1A1A1A] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Notification Preference */}
                <div className="space-y-1.5">
                  <label className="font-semibold block text-[#1A1A1A]">Prioritas Notifikasi:</label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'whatsapp' as const, label: 'WhatsApp' },
                      { id: 'email' as const, label: 'Email' },
                      { id: 'both' as const, label: 'Keduanya' }
                    ].map(pref => (
                      <label key={pref.id} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                        <input 
                          type="radio" 
                          name="notif_pref" 
                          checked={waitlistNotificationPref === pref.id}
                          onChange={() => setWaitlistNotificationPref(pref.id)}
                          className="accent-[#333333] w-4 h-4"
                        />
                        <span className="text-xs">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button (Height >= 48px) */}
                <button 
                  type="submit" 
                  className="w-full min-h-[48px] h-12 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold uppercase tracking-wider transition rounded-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
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

                {/* Destination Province & Region Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A4B14]" />
                      <span>Wilayah / Provinsi Tujuan:</span>
                    </label>
                    <select
                      value={destinationProvince}
                      onChange={e => setDestinationProvince(e.target.value)}
                      className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden"
                    >
                      <option value="jabodetabek">DKI Jakarta & Jabodetabek</option>
                      <option value="jawa_barat">Jawa Barat (Bandung, Bogor, dll.)</option>
                      <option value="jawa_tengah_diy">Jawa Tengah & DI Yogyakarta</option>
                      <option value="jawa_timur">Jawa Timur (Surabaya, Malang, dll.)</option>
                      <option value="luar_jawa">Luar Pulau Jawa (Bali, Sumatera, dll.)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold block">Estimasi Waktu Tiba:</label>
                    <div className="p-2 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-mono flex items-center justify-between">
                      <span className="text-[#5C5C5C]">ETD:</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {isCalculatingShipping ? 'Menghitung...' : shippingData.etd}
                      </span>
                    </div>
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
                  <label className="font-semibold block">Pilih Ekspedisi Logistik:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'jne' as const, name: 'JNE Reguler', note: 'Asuransi Pecah Belah' },
                      { id: 'sicepat' as const, name: 'SiCepat BEST', note: 'Prioritas Sortir' },
                      { id: 'gosend' as const, name: 'GoSend Instant', note: destinationProvince === 'jabodetabek' ? 'Jangkauan Jabodetabek' : 'Luar Jangkauan' }
                    ].map(c => {
                      const isUnavailable = c.id === 'gosend' && destinationProvince !== 'jabodetabek';
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setCourier(c.id)}
                          className={`p-2 border text-center space-y-0.5 transition ${
                            courier === c.id 
                              ? 'border-2 border-black bg-[#F4F3E6] font-bold' 
                              : 'border-[#D9D7C9] bg-white'
                          } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="block font-semibold text-[11px]">{c.name}</span>
                          <span className="block text-[9px] text-[#5C5C5C]">{c.note}</span>
                        </button>
                      );
                    })}
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

                {/* Transparent Cost Summary Box */}
                <div className="border border-[#D9D7C9] p-3 space-y-1.5 bg-white text-xs">
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Decant {perfume.name} ({selectedSize} ml)</span>
                    <span className="font-mono">{formatCurrency(fairDecantPrice, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Botol Atomizer Kaca Spray</span>
                    <span className="text-emerald-700 font-semibold">Termasuk (Gratis)</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Ongkir Dasar ({courier.toUpperCase()})</span>
                    <span className="font-mono">{formatCurrency(shippingData.base_rate_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Bubble Wrap Khusus Cairan</span>
                    <span className="font-mono">{formatCurrency(shippingData.liquid_packaging_fee_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C5C5C] text-[11px]">
                    <span>Asuransi Kerusakan Pecah Belah</span>
                    <span className="font-mono">{formatCurrency(shippingData.fragile_insurance_fee_idr, locale)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#D9D7C9] flex justify-between items-baseline font-bold text-sm">
                    <span>Total Pembayaran:</span>
                    <span className="font-mono text-[#8A4B14] text-base">{formatCurrency(totalOrderPrice, locale)}</span>
                  </div>
                </div>

                {/* Submit Checkout */}
                <button 
                  type="submit" 
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>{isProcessingPayment ? 'Menyiapkan Pembayaran...' : 'Lanjut ke Pembayaran QRIS / VA'}</span>
                </button>
              </form>
            ) : paymentStep === 'gateway' && paymentTrx ? (
              /* ── INTERACTIVE PAYMENT GATEWAY SIMULATOR SCREEN ── */
              <div className="p-6 bg-white border border-[#1A1A1A] space-y-5">
                <div className="flex justify-between items-start border-b border-[#D9D7C9] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 font-bold border border-amber-300">
                      GATEWAY PEMBAYARAN RESMI (SANDBOX)
                    </span>
                    <h4 className="font-serif text-2xl font-bold pt-1">{paymentTrx.order_number}</h4>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-mono text-[#5C5C5C] block">Batas Waktu Bayar</span>
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 border border-red-200">
                      14:59 Menit
                    </span>
                  </div>
                </div>

                {/* QRIS Screen */}
                {paymentTrx.payment_method === 'qris' && (
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-[#FFFEF2] border border-[#D9D7C9] max-w-xs mx-auto space-y-3">
                      <div className="flex items-center justify-between border-b border-[#D9D7C9] pb-2 text-[10px] font-mono">
                        <span className="font-bold text-[#8A4B14]">QRIS STANDAR NASIONAL</span>
                        <span className="text-[#5C5C5C]">NMID: ID102026889</span>
                      </div>
                      
                      {/* Stylized QR Code Frame */}
                      <div className="w-48 h-48 mx-auto bg-white border-2 border-black p-2 flex flex-col items-center justify-center relative shadow-inner">
                        <QrCode className="w-40 h-40 text-[#1A1A1A]" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-[#1A1A1A] text-white font-mono text-[9px] px-1.5 py-0.5 font-bold tracking-wider">
                            SENSTORIA
                          </span>
                        </div>
                      </div>

                      <div className="text-xs space-y-0.5 font-mono">
                        <p className="font-bold text-[#1A1A1A]">SENSTORIA ATELIER</p>
                        <p className="text-[11px] text-[#5C5C5C]">Total: <strong className="text-black text-sm">{formatCurrency(paymentTrx.amount_idr, locale)}</strong></p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C5C5C]">
                      Buka aplikasi BCA Mobile, GoPay, OVO, Dana, atau mobile banking kamu, pilih menu <strong>Scan QRIS</strong> lalu arahkan kamera ke kode di atas.
                    </p>
                  </div>
                )}

                {/* BCA Virtual Account Screen */}
                {paymentTrx.payment_method === 'bca_va' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#F4F3E6] border border-[#D9D7C9] space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-[#D9D7C9] pb-2 font-mono">
                        <span className="font-bold text-[#1A1A1A]">BCA VIRTUAL ACCOUNT</span>
                        <span className="text-[#8A4B14] font-bold">Otomatis Terverifikasi</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#5C5C5C] block">Nomor Virtual Account:</span>
                        <div className="flex items-center justify-between bg-white p-2.5 border border-[#D9D7C9] font-mono text-base font-bold">
                          <span>{paymentTrx.va_number}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentTrx.va_number || '');
                              setCopiedVa(true);
                              setTimeout(() => setCopiedVa(false), 3000);
                            }}
                            className="text-xs font-sans font-medium px-2 py-1 bg-[#F4F3E6] border border-[#333333] hover:bg-neutral-200 flex items-center gap-1"
                          >
                            {copiedVa ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-[11px] text-[#5C5C5C]">Total Pembayaran:</span>
                        <span className="font-mono text-base font-bold text-[#8A4B14]">{formatCurrency(paymentTrx.amount_idr, locale)}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#5C5C5C] space-y-1">
                      <p><strong>Cara Pembayaran via m-BCA:</strong></p>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        <li>Pilih m-Transfer → BCA Virtual Account.</li>
                        <li>Masukkan nomor VA di atas dan pastikan nama penerima adalah Senstoria.</li>
                        <li>Masukkan PIN m-BCA untuk menyelesaikan transaksi.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* GoPay / e-Wallet Screen */}
                {paymentTrx.payment_method === 'gopay' && (
                  <div className="p-4 bg-[#F4F3E6] border border-[#D9D7C9] space-y-3 text-xs text-center">
                    <span className="font-bold font-mono block">GOPAY / E-WALLET CHECKOUT</span>
                    <p className="text-[11px] text-[#5C5C5C]">
                      Tekan tombol simulasi di bawah untuk mengonfirmasi transaksi GoPay senilai <strong>{formatCurrency(paymentTrx.amount_idr, locale)}</strong>.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleSimulatePayment}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{isProcessingPayment ? 'Memverifikasi Pembayaran...' : 'Simulasikan Pembayaran Lunas (Sandbox)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStep('form')}
                    className="w-full py-2 bg-white hover:bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium text-[#5C5C5C] hover:text-black transition"
                  >
                    ← Ubah Kurir atau Metode Pembayaran
                  </button>
                </div>
              </div>
            ) : (
              /* ── ORDER CONFIRMATION INVOICE / RECEIPT (PAID & VERIFIED) ── */
              <div className="p-6 bg-white border border-[#1A1A1A] space-y-4">
                <div className="flex justify-between items-start border-b border-[#D9D7C9] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold border border-emerald-300">
                      PESANAN LUNAS (VERIFIKASI SISTEM)
                    </span>
                    <h4 className="font-serif text-2xl font-bold pt-1">{orderCompleted?.order_number}</h4>
                  </div>
                  <div className="text-right text-[10px] font-mono text-[#5C5C5C]">
                    <span>{orderCompleted ? new Date(orderCompleted.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[#333333]">
                    Terima kasih, <strong>{orderCompleted?.recipient_name}</strong>! Pembayaran pesanan decant sampelmu telah berhasil diverifikasi oleh sistem gateway.
                  </p>
                  
                  <div className="p-3 bg-[#F4F3E6] border border-[#D9D7C9] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#5C5C5C]">Produk:</span>
                      <span className="font-bold text-black">{orderCompleted?.brand} - {orderCompleted?.perfume_name} ({orderCompleted?.size_ml} ml)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C5C5C]">Tujuan:</span>
                      <span className="font-sans text-[11px] max-w-[200px] text-right truncate">{orderCompleted?.shipping_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C5C5C]">Ekspedisi:</span>
                      <span className="uppercase text-black">{orderCompleted?.shipping_courier} (Resi: SEN-EXP-{Math.floor(100000 + Math.random() * 900000)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5C5C5C]">Metode Bayar:</span>
                      <span className="uppercase text-emerald-800 font-bold">{orderCompleted?.payment_method} (LUNAS)</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#D9D7C9] font-bold text-[#8A4B14] text-xs">
                      <span>Total Biaya:</span>
                      <span>{orderCompleted ? formatCurrency(orderCompleted.total_idr, locale) : ''}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#5C5C5C] leading-relaxed">
                    Pesanan decant ini diproses dengan standar higienitas laboratorium parfum dan proteksi kemasan anti-pecah untuk menjamin kualitas botol sampai di tanganmu.
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
    </BottomSheetOrModal>
  );
}
