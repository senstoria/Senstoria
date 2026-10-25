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
      <div className="space-y-5 text-[#000000]">
        {/* Origin Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] uppercase font-mono tracking-widest text-[#5c5c5c] font-medium">
            TRY IT FIRST · SAMPLE & DECANT DEMAND
          </span>
          <span className="text-[12px] font-mono bg-[#fffef2] border border-[#d9d7c9] px-2 py-0.5 text-[#5c5c5c]">
            {perfume.origin === 'ID' ? 'Artisan Lokal' : 'Global Designer'}
          </span>
        </div>

        {/* ── FEATURE FLAG CONTROLLER ── */}
        <div className="bg-[#f4f3e6] border border-[#d9d7c9] p-3 text-[12px] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-[12px] text-[#000000]">FEATURE FLAG:</span>
              <code className="text-[12px] font-mono bg-[#fffef2] px-1.5 py-0.5 border border-[#d9d7c9]">try_it_first_ordering</code>
            </div>
            <p className="text-[12px] text-[#5c5c5c]">
              {featureFlagOrdering 
                ? 'Aktif: Stub checkout pemesanan decant dibuka untuk pengujian simulasi.' 
                : 'Nonaktif: Sistem hanya mengumpulkan demand agregat pada daftar tunggu.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFeatureFlagOrdering(prev => !prev)}
            className={`px-3 py-1.5 border text-[12px] font-medium flex items-center gap-1.5 transition shrink-0 ${
              featureFlagOrdering 
                ? 'bg-[#333333] text-[#fffef2] border-[#333333]' 
                : 'bg-[#fffef2] text-[#5c5c5c] border-[#8a8a8a] hover:bg-[#f4f3e6]'
            }`}
          >
            {featureFlagOrdering ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#fffef2]" />
                <span>Flag: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-[#8a8a8a]" />
                <span>Flag: OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Switcher if Flag is ON */}
        {featureFlagOrdering && (
          <div className="flex border-b border-[#d9d7c9] text-[12px]">
            <button
              onClick={() => { setActiveTab('checkout'); setOrderCompleted(null); }}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition ${
                activeTab === 'checkout'
                  ? 'border-[#000000] text-[#000000]'
                  : 'border-transparent text-[#5c5c5c] hover:text-[#000000]'
              }`}
            >
              Pesan Sampel Langsung (Beta)
            </button>
            <button
              onClick={() => { setActiveTab('waitlist'); setWaitlistSuccess(false); }}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition ${
                activeTab === 'waitlist'
                  ? 'border-[#000000] text-[#000000]'
                  : 'border-transparent text-[#5c5c5c] hover:text-[#000000]'
              }`}
            >
              Daftar Tunggu Batch
            </button>
          </div>
        )}

        {/* MODE 1: WAITLIST DEMAND CAPTURE */}
        {activeTab === 'waitlist' && (
          <div>
            {!waitlistSuccess ? (
              <form onSubmit={handleWaitlistSubmit} className="space-y-5 text-[12px]">
                
                {/* Size Selection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="font-medium block text-[#000000]">Pilih Ukuran Decant yang Diminati:</label>
                    <span className="text-[12px] text-[#5c5c5c] font-mono">Estimasi harga wajar</span>
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
                          className={`p-3 border cursor-pointer transition text-center space-y-1 ${
                            isSelected ? 'border-[#333333] bg-[#f4f3e6] font-medium' : 'border-[#d9d7c9] bg-[#fffef2] hover:bg-[#f4f3e6]'
                          }`}
                        >
                          <span className="block font-medium text-[#000000]">{item.label}</span>
                          <span className="block text-[12px] text-[#5c5c5c]">{item.desc}</span>
                          <span className="block text-[12px] font-mono tabular-nums text-[#000000] font-medium">
                            {formatCurrency(price, locale)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Willingness to Pay */}
                <div className="space-y-1.5">
                  <label className="font-medium block text-[#000000]">
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
                        className={`p-2.5 border cursor-pointer text-center text-[12px] transition flex items-center justify-center gap-1.5 ${
                          waitlistWillingness === w.id ? 'border-[#333333] bg-[#f4f3e6] font-medium text-[#000000]' : 'border-[#d9d7c9] bg-[#fffef2] text-[#5c5c5c]'
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
                    <label className="font-medium text-[#000000]">Estimasi Harga Wajar yang Bersedia Dibayar:</label>
                    <span className="font-mono tabular-nums text-[14px] font-medium text-[#000000]">
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
                  <div className="flex justify-between text-[12px] text-[#5c5c5c] font-mono tabular-nums">
                    <span>Hemat</span>
                    <span>Saran: {formatCurrency(fairDecantPrice, locale)}</span>
                    <span>Premium</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium block text-[#000000]">Email Penerima Kabar:</label>
                    <input 
                      type="email" 
                      inputMode="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder="kolektor@email.com"
                      className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] text-[12px] text-[#000000] focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-[#000000]">Nomor WhatsApp (+62):</label>
                    <input 
                      type="tel" 
                      inputMode="tel"
                      value={waitlistPhone}
                      onChange={e => setWaitlistPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full min-h-[44px] p-2.5 bg-[#fffef2] border border-[#8a8a8a] text-[12px] font-mono text-[#000000] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Notification Preference */}
                <div className="space-y-1.5">
                  <label className="font-medium block text-[#000000]">Prioritas Notifikasi:</label>
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
                        <span className="text-[12px] text-[#000000]">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full min-h-[48px] h-12 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[14px] font-medium transition focus:outline-hidden"
                >
                  Daftar Antrean Sampel ({selectedSize} ml)
                </button>
              </form>
            ) : (
              <div className="p-6 bg-[#f4f3e6] border border-[#d9d7c9] text-center space-y-3">
                <div className="w-12 h-12 bg-[#333333] text-[#fffef2] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-serif text-[24px] leading-[32px] font-normal text-[#000000]">Permintaan Sampel Tercatat!</h4>
                <p className="text-[12px] text-[#5c5c5c] max-w-sm mx-auto leading-relaxed">
                  Kami telah mencatat minatmu untuk decant <strong>{perfume.name} ({selectedSize} ml)</strong>. Tim kurator Senstoria akan mengabari melalui {waitlistNotificationPref === 'whatsapp' ? 'WhatsApp' : 'Email'} saat kuota batch terpenuhi.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium"
                  >
                    Tutup Jendela
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: FLAGGED ORDER CHECKOUT STUB */}
        {activeTab === 'checkout' && featureFlagOrdering && (
          <div>
            {!orderCompleted ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-[12px]">
                
                {/* Size & Pricing Breakdown */}
                <div className="bg-[#f4f3e6] p-3.5 border border-[#d9d7c9] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[12px] text-[#000000]">Format Sampel:</span>
                    <span className="font-mono tabular-nums text-[#000000] font-medium">{selectedSize} ml Atomizer Kaca</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 5, 10] as const).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-1.5 border text-center transition ${
                          selectedSize === sz ? 'bg-[#333333] text-[#fffef2] border-[#333333] font-medium' : 'bg-[#fffef2] border-[#d9d7c9] text-[#000000]'
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
                    <label className="font-medium block text-[#000000]">Nama Penerima:</label>
                    <input 
                      type="text" 
                      required
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full p-2 bg-[#fffef2] border border-[#8a8a8a] text-[12px] focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-[#000000]">Nomor WhatsApp:</label>
                    <input 
                      type="tel" 
                      required
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full p-2 bg-[#fffef2] border border-[#8a8a8a] text-[12px] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Destination Province & Region Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium block flex items-center gap-1.5 text-[#000000]">
                      <MapPin className="w-3.5 h-3.5 text-[#333333]" />
                      <span>Wilayah / Provinsi Tujuan:</span>
                    </label>
                    <select
                      value={destinationProvince}
                      onChange={e => setDestinationProvince(e.target.value)}
                      className="w-full p-2 bg-[#fffef2] border border-[#8a8a8a] text-[12px] focus:outline-hidden"
                    >
                      <option value="jabodetabek">DKI Jakarta & Jabodetabek</option>
                      <option value="jawa_barat">Jawa Barat (Bandung, Bogor, dll.)</option>
                      <option value="jawa_tengah_diy">Jawa Tengah & DI Yogyakarta</option>
                      <option value="jawa_timur">Jawa Timur (Surabaya, Malang, dll.)</option>
                      <option value="luar_jawa">Luar Pulau Jawa (Bali, Sumatera, dll.)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-[#000000]">Estimasi Waktu Tiba:</label>
                    <div className="p-2 bg-[#f4f3e6] border border-[#d9d7c9] text-[12px] font-mono flex items-center justify-between">
                      <span className="text-[#5c5c5c]">ETD:</span>
                      <span className="font-medium text-[#000000]">
                        {isCalculatingShipping ? 'Menghitung...' : shippingData.etd}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-1">
                  <label className="font-medium block text-[#000000]">Alamat Pengiriman Lengkap (Indonesia):</label>
                  <textarea 
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan, 12190"
                    className="w-full p-2 bg-[#fffef2] border border-[#8a8a8a] text-[12px] focus:outline-hidden resize-none"
                  />
                </div>

                {/* Courier Selection */}
                <div className="space-y-1">
                  <label className="font-medium block text-[#000000]">Pilih Ekspedisi Logistik:</label>
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
                              ? 'border-[#333333] bg-[#f4f3e6] font-medium' 
                              : 'border-[#d9d7c9] bg-[#fffef2]'
                          } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="block font-medium text-[12px] text-[#000000]">{c.name}</span>
                          <span className="block text-[12px] text-[#5c5c5c]">{c.note}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-1">
                  <label className="font-medium block text-[#000000]">Metode Pembayaran:</label>
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
                            paymentMethod === pm.id ? 'border-[#333333] bg-[#f4f3e6] font-medium' : 'border-[#d9d7c9] bg-[#fffef2]'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto text-[#000000]" />
                          <span className="block text-[12px] text-[#000000]">{pm.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transparent Cost Summary Box */}
                <div className="border border-[#d9d7c9] p-3 space-y-1.5 bg-[#fffef2] text-[12px]">
                  <div className="flex justify-between text-[#5c5c5c]">
                    <span>Decant {perfume.name} ({selectedSize} ml)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(fairDecantPrice, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c5c]">
                    <span>Botol Atomizer Kaca Spray</span>
                    <span className="text-[#000000] font-medium">Termasuk (Gratis)</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c5c]">
                    <span>Ongkir Dasar ({courier.toUpperCase()})</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.base_rate_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c5c]">
                    <span>Bubble Wrap Khusus Cairan</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.liquid_packaging_fee_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-[#5c5c5c]">
                    <span>Asuransi Kerusakan Pecah Belah</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.fragile_insurance_fee_idr, locale)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#d9d7c9] flex justify-between items-baseline font-medium text-[14px]">
                    <span className="text-[#000000]">Total Pembayaran:</span>
                    <span className="font-mono tabular-nums text-[#000000] text-[16px]">{formatCurrency(totalOrderPrice, locale)}</span>
                  </div>
                </div>

                {/* Submit Checkout */}
                <button 
                  type="submit" 
                  disabled={isProcessingPayment}
                  className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[14px] font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-[#fffef2]" />
                  <span>{isProcessingPayment ? 'Menyiapkan Pembayaran...' : 'Lanjutkan ke Pembayaran QRIS / VA'}</span>
                </button>
              </form>
            ) : paymentStep === 'gateway' && paymentTrx ? (
              /* INTERACTIVE PAYMENT GATEWAY SIMULATOR SCREEN */
              <div className="p-6 bg-[#fffef2] border border-[#333333] space-y-5">
                <div className="flex justify-between items-start border-b border-[#d9d7c9] pb-3">
                  <div>
                    <span className="text-[12px] font-mono uppercase bg-[#f4f3e6] text-[#000000] px-2 py-0.5 font-medium border border-[#d9d7c9]">
                      GATEWAY PEMBAYARAN RESMI (SANDBOX)
                    </span>
                    <h4 className="font-serif text-[24px] leading-[32px] font-normal pt-1 text-[#000000]">{paymentTrx.order_number}</h4>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[12px] font-mono text-[#5c5c5c] block">Batas Waktu Bayar</span>
                    <span className="text-[12px] font-mono font-medium text-[#b3261e] bg-[#f4f3e6] px-2 py-0.5 border border-[#d9d7c9]">
                      14:59 Menit
                    </span>
                  </div>
                </div>

                {/* QRIS Screen */}
                {paymentTrx.payment_method === 'qris' && (
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-[#fffef2] border border-[#d9d7c9] max-w-xs mx-auto space-y-3">
                      <div className="flex items-center justify-between border-b border-[#d9d7c9] pb-2 text-[12px] font-mono">
                        <span className="font-medium text-[#000000]">QRIS STANDAR NASIONAL</span>
                        <span className="text-[#5c5c5c]">NMID: ID102026889</span>
                      </div>
                      
                      <div className="w-48 h-48 mx-auto bg-[#fffef2] border-2 border-[#333333] p-2 flex flex-col items-center justify-center relative">
                        <QrCode className="w-40 h-40 text-[#000000]" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-[#333333] text-[#fffef2] font-mono text-[12px] px-2 py-0.5 font-medium tracking-wider">
                            SENSTORIA
                          </span>
                        </div>
                      </div>

                      <div className="text-[12px] space-y-0.5 font-mono tabular-nums">
                        <p className="font-medium text-[#000000]">SENSTORIA ATELIER</p>
                        <p className="text-[12px] text-[#5c5c5c]">Total: <strong className="text-[#000000]">{formatCurrency(paymentTrx.amount_idr, locale)}</strong></p>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#5c5c5c]">
                      Buka aplikasi BCA Mobile, GoPay, OVO, Dana, atau mobile banking kamu, pilih menu <strong>Scan QRIS</strong> lalu arahkan kamera ke kode di atas.
                    </p>
                  </div>
                )}

                {/* BCA Virtual Account Screen */}
                {paymentTrx.payment_method === 'bca_va' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#f4f3e6] border border-[#d9d7c9] space-y-3 text-[12px]">
                      <div className="flex justify-between items-center border-b border-[#d9d7c9] pb-2 font-mono">
                        <span className="font-medium text-[#000000]">BCA VIRTUAL ACCOUNT</span>
                        <span className="text-[#5c5c5c]">Otomatis Terverifikasi</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[12px] text-[#5c5c5c] block">Nomor Virtual Account:</span>
                        <div className="flex items-center justify-between bg-[#fffef2] p-2.5 border border-[#d9d7c9] font-mono text-[14px] font-medium text-[#000000]">
                          <span>{paymentTrx.va_number}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentTrx.va_number || '');
                              setCopiedVa(true);
                              setTimeout(() => setCopiedVa(false), 3000);
                            }}
                            className="text-[12px] font-sans font-medium px-2 py-1 bg-[#f4f3e6] border border-[#8a8a8a] hover:bg-[#fffef2] flex items-center gap-1"
                          >
                            {copiedVa ? <Check className="w-3.5 h-3.5 text-[#000000]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-[12px] text-[#5c5c5c]">Total Pembayaran:</span>
                        <span className="font-mono tabular-nums text-[16px] font-medium text-[#000000]">{formatCurrency(paymentTrx.amount_idr, locale)}</span>
                      </div>
                    </div>
                    <div className="text-[12px] text-[#5c5c5c] space-y-1">
                      <p><strong className="text-[#000000]">Cara Pembayaran via m-BCA:</strong></p>
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
                  <div className="p-4 bg-[#f4f3e6] border border-[#d9d7c9] space-y-3 text-[12px] text-center">
                    <span className="font-medium font-mono block text-[#000000]">GOPAY / E-WALLET CHECKOUT</span>
                    <p className="text-[12px] text-[#5c5c5c]">
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
                    className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#fffef2]" />
                    <span>{isProcessingPayment ? 'Memverifikasi Pembayaran...' : 'Simulasikan Pembayaran Lunas (Sandbox)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStep('form')}
                    className="w-full py-2 bg-[#fffef2] hover:bg-[#f4f3e6] border border-[#8a8a8a] text-[12px] font-medium text-[#5c5c5c] hover:text-[#000000] transition"
                  >
                    ← Ubah Kurir atau Metode Pembayaran
                  </button>
                </div>
              </div>
            ) : (
              /* ORDER CONFIRMATION INVOICE / RECEIPT */
              <div className="p-6 bg-[#fffef2] border border-[#333333] space-y-4">
                <div className="flex justify-between items-start border-b border-[#d9d7c9] pb-3">
                  <div>
                    <span className="text-[12px] font-mono uppercase bg-[#f4f3e6] text-[#000000] px-2 py-0.5 font-medium border border-[#d9d7c9]">
                      PESANAN LUNAS (VERIFIKASI SISTEM)
                    </span>
                    <h4 className="font-serif text-[24px] leading-[32px] font-normal pt-1 text-[#000000]">{orderCompleted?.order_number}</h4>
                  </div>
                  <div className="text-right text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                    <span>{orderCompleted ? new Date(orderCompleted.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="space-y-2 text-[12px]">
                  <p className="text-[#333333]">
                    Terima kasih, <strong>{orderCompleted?.recipient_name}</strong>! Pembayaran pesanan decant sampelmu telah berhasil diverifikasi oleh sistem gateway.
                  </p>
                  
                  <div className="p-3 bg-[#f4f3e6] border border-[#d9d7c9] space-y-1.5 font-mono text-[12px] tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-[#5c5c5c]">Produk:</span>
                      <span className="font-medium text-[#000000]">{orderCompleted?.brand} - {orderCompleted?.perfume_name} ({orderCompleted?.size_ml} ml)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c5c5c]">Tujuan:</span>
                      <span className="font-sans text-[12px] max-w-[200px] text-right truncate text-[#000000]">{orderCompleted?.shipping_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c5c5c]">Ekspedisi:</span>
                      <span className="uppercase text-[#000000]">{orderCompleted?.shipping_courier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c5c5c]">Metode Bayar:</span>
                      <span className="uppercase text-[#000000] font-medium">{orderCompleted?.payment_method} (LUNAS)</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#d9d7c9] font-medium text-[#000000] text-[14px]">
                      <span>Total Biaya:</span>
                      <span>{orderCompleted ? formatCurrency(orderCompleted.total_idr, locale) : ''}</span>
                    </div>
                  </div>

                  <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
                    Pesanan decant ini diproses dengan standar higienitas laboratorium parfum dan proteksi kemasan anti-pecah untuk menjamin kualitas botol sampai di tanganmu.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[12px] font-medium"
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
