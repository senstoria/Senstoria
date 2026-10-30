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
import { Locale, formatCurrency, translations, fmt } from '../lib/i18n.ts';
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
      subtitle={`${perfume.concentration} · ${perfume.primary_family} · ${fmt(translations[locale].tryItFirstModal.fullBottle, formatCurrency(perfume.reference_price_idr, locale), perfume.reference_price_size_ml)}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-ink">
        {/* Origin Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] uppercase font-mono tracking-widest text-secondary font-medium">
            {translations[locale].tryItFirstModal.kicker}
          </span>
          <span className="text-[12px] font-mono bg-paper border border-hairline px-2 py-0.5 text-secondary">
            {perfume.origin === 'ID' ? translations[locale].tryItFirstModal.originLocal : translations[locale].tryItFirstModal.originGlobal}
          </span>
        </div>

        {/* ── FEATURE FLAG CONTROLLER ── */}
        <div className="bg-surface border border-hairline p-3 text-[12px] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-[12px] text-ink">FEATURE FLAG:</span>
              <code className="text-[12px] font-mono bg-paper px-1.5 py-0.5 border border-hairline">try_it_first_ordering</code>
            </div>
            <p className="text-[12px] text-secondary">
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
                ? 'bg-bar text-paper border-bar' 
                : 'bg-paper text-secondary border-border hover:bg-surface'
            }`}
          >
            {featureFlagOrdering ? (
              <>
                <ToggleRight className="w-4 h-4 text-paper" />
                <span>Flag: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-secondary" />
                <span>Flag: OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Switcher if Flag is ON */}
        {featureFlagOrdering && (
          <div className="flex border-b border-hairline text-[12px]">
            <button
              onClick={() => { setActiveTab('checkout'); setOrderCompleted(null); }}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition ${
                activeTab === 'checkout'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-secondary hover:text-ink'
              }`}
            >
              Pesan Sampel Langsung (Beta)
            </button>
            <button
              onClick={() => { setActiveTab('waitlist'); setWaitlistSuccess(false); }}
              className={`flex-1 py-2 font-medium text-center border-b-2 transition ${
                activeTab === 'waitlist'
                  ? 'border-ink text-ink'
                  : 'border-transparent text-secondary hover:text-ink'
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
                    <label className="font-medium block text-ink">{translations[locale].tryItFirstModal.sizeHeading}</label>
                    <span className="text-[12px] text-secondary font-mono">{translations[locale].tryItFirstModal.fairPriceEstimate}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: 2 as const, label: translations[locale].tryItFirstModal.sizeLabel2, desc: translations[locale].tryItFirstModal.sizeDesc2 },
                      { size: 5 as const, label: translations[locale].tryItFirstModal.sizeLabel5, desc: translations[locale].tryItFirstModal.sizeDesc5 },
                      { size: 10 as const, label: translations[locale].tryItFirstModal.sizeLabel10, desc: translations[locale].tryItFirstModal.sizeDesc10 }
                    ].map(item => {
                      const price = calculateFairSamplePrice(pricePerMl, item.size);
                      const isSelected = selectedSize === item.size;
                      return (
                        <div
                          key={item.size}
                          onClick={() => setSelectedSize(item.size)}
                          className={`p-3 border cursor-pointer transition text-center space-y-1 ${
                            isSelected ? 'border-bar bg-surface font-medium' : 'border-hairline bg-paper hover:bg-surface'
                          }`}
                        >
                          <span className="block font-medium text-ink">{item.label}</span>
                          <span className="block text-[12px] text-secondary">{item.desc}</span>
                          <span className="block text-[12px] font-mono tabular-nums text-ink font-medium">
                            {formatCurrency(price, locale)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Willingness to Pay */}
                <div className="space-y-1.5">
                  <label className="font-medium block text-ink">
                    {translations[locale].tryItFirstModal.willingnessHeading}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'yes' as const, label: translations[locale].tryItFirstModal.willingnessYes },
                      { id: 'maybe' as const, label: translations[locale].tryItFirstModal.willingnessMaybe },
                      { id: 'no' as const, label: translations[locale].tryItFirstModal.willingnessNo }
                    ].map(w => (
                      <label 
                        key={w.id} 
                        className={`p-2.5 border cursor-pointer text-center text-[12px] transition flex items-center justify-center gap-1.5 ${
                          waitlistWillingness === w.id ? 'border-bar bg-surface font-medium text-ink' : 'border-hairline bg-paper text-secondary'
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
                    <label className="font-medium text-ink">{translations[locale].tryItFirstModal.fairPriceLabel}</label>
                    <span className="font-mono tabular-nums text-[14px] font-medium text-ink">
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
                    className="w-full accent-bar"
                  />
                  <div className="flex justify-between text-[12px] text-secondary font-mono tabular-nums">
                    <span>{translations[locale].tryItFirstModal.sliderLow}</span>
                    <span>{fmt(translations[locale].tryItFirstModal.sliderSuggestion, formatCurrency(fairDecantPrice, locale))}</span>
                    <span>{translations[locale].tryItFirstModal.sliderHigh}</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium block text-ink">{translations[locale].tryItFirstModal.emailLabel}</label>
                    <input 
                      type="email" 
                      inputMode="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder={translations[locale].tryItFirstModal.emailPlaceholder}
                      className="w-full min-h-[44px] p-2.5 bg-paper border border-border text-[12px] text-ink focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-ink">{translations[locale].tryItFirstModal.phoneLabel}</label>
                    <input 
                      type="tel" 
                      inputMode="tel"
                      value={waitlistPhone}
                      onChange={e => setWaitlistPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full min-h-[44px] p-2.5 bg-paper border border-border text-[12px] font-mono text-ink focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Notification Preference */}
                <div className="space-y-1.5">
                  <label className="font-medium block text-ink">{translations[locale].tryItFirstModal.notifHeading}</label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'whatsapp' as const, label: translations[locale].tryItFirstModal.notifWhatsapp },
                      { id: 'email' as const, label: translations[locale].tryItFirstModal.notifEmail },
                      { id: 'both' as const, label: translations[locale].tryItFirstModal.notifBoth }
                    ].map(pref => (
                      <label key={pref.id} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                        <input 
                          type="radio" 
                          name="notif_pref" 
                          checked={waitlistNotificationPref === pref.id} 
                          onChange={() => setWaitlistNotificationPref(pref.id)}
                          className="accent-bar w-4 h-4"
                        />
                        <span className="text-[12px] text-ink">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full min-h-[48px] h-12 bg-bar hover:bg-ink text-paper text-[14px] font-medium transition focus:outline-hidden"
                >
                  {fmt(translations[locale].tryItFirstModal.submitWaitlist, selectedSize)}
                </button>
              </form>
            ) : (
              <div className="p-6 bg-surface border border-hairline text-center space-y-3">
                <div className="w-12 h-12 bg-bar text-paper flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-serif text-[24px] leading-[32px] font-normal text-ink">{translations[locale].tryItFirstModal.successTitle}</h4>
                <p className="text-[12px] text-secondary max-w-sm mx-auto leading-relaxed">
                  {translations[locale].tryItFirstModal.successBodyBefore}<strong>{perfume.name} ({selectedSize} ml)</strong>{fmt(translations[locale].tryItFirstModal.successBodyAfter, waitlistNotificationPref === 'whatsapp' ? 'WhatsApp' : 'Email')}
                </p>
                <div className="pt-2">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium"
                  >
                    {translations[locale].tryItFirstModal.closeWindow}
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
                <div className="bg-surface p-3.5 border border-hairline space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[12px] text-ink">Format Sampel:</span>
                    <span className="font-mono tabular-nums text-ink font-medium">{selectedSize} ml Atomizer Kaca</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 5, 10] as const).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`py-1.5 border text-center transition ${
                          selectedSize === sz ? 'bg-bar text-paper border-bar font-medium' : 'bg-paper border-hairline text-ink'
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
                    <label className="font-medium block text-ink">Nama Penerima:</label>
                    <input 
                      type="text" 
                      required
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full p-2 bg-paper border border-border text-[12px] focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-ink">Nomor WhatsApp:</label>
                    <input 
                      type="tel" 
                      required
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+628123456789"
                      className="w-full p-2 bg-paper border border-border text-[12px] font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Destination Province & Region Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium block flex items-center gap-1.5 text-ink">
                      <MapPin className="w-3.5 h-3.5 text-bar" />
                      <span>Wilayah / Provinsi Tujuan:</span>
                    </label>
                    <select
                      value={destinationProvince}
                      onChange={e => setDestinationProvince(e.target.value)}
                      className="w-full p-2 bg-paper border border-border text-[12px] focus:outline-hidden"
                    >
                      <option value="jabodetabek">DKI Jakarta & Jabodetabek</option>
                      <option value="jawa_barat">Jawa Barat (Bandung, Bogor, dll.)</option>
                      <option value="jawa_tengah_diy">Jawa Tengah & DI Yogyakarta</option>
                      <option value="jawa_timur">Jawa Timur (Surabaya, Malang, dll.)</option>
                      <option value="luar_jawa">Luar Pulau Jawa (Bali, Sumatera, dll.)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium block text-ink">Estimasi Waktu Tiba:</label>
                    <div className="p-2 bg-surface border border-hairline text-[12px] font-mono flex items-center justify-between">
                      <span className="text-secondary">ETD:</span>
                      <span className="font-medium text-ink">
                        {isCalculatingShipping ? 'Menghitung...' : shippingData.etd}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-1">
                  <label className="font-medium block text-ink">Alamat Pengiriman Lengkap (Indonesia):</label>
                  <textarea 
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan, 12190"
                    className="w-full p-2 bg-paper border border-border text-[12px] focus:outline-hidden resize-none"
                  />
                </div>

                {/* Courier Selection */}
                <div className="space-y-1">
                  <label className="font-medium block text-ink">Pilih Ekspedisi Logistik:</label>
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
                              ? 'border-bar bg-surface font-medium' 
                              : 'border-hairline bg-paper'
                          } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="block font-medium text-[12px] text-ink">{c.name}</span>
                          <span className="block text-[12px] text-secondary">{c.note}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-1">
                  <label className="font-medium block text-ink">Metode Pembayaran:</label>
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
                            paymentMethod === pm.id ? 'border-bar bg-surface font-medium' : 'border-hairline bg-paper'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto text-ink" />
                          <span className="block text-[12px] text-ink">{pm.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transparent Cost Summary Box */}
                <div className="border border-hairline p-3 space-y-1.5 bg-paper text-[12px]">
                  <div className="flex justify-between text-secondary">
                    <span>Decant {perfume.name} ({selectedSize} ml)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(fairDecantPrice, locale)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Botol Atomizer Kaca Spray</span>
                    <span className="text-ink font-medium">Termasuk (Gratis)</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Ongkir Dasar ({courier.toUpperCase()})</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.base_rate_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Bubble Wrap Khusus Cairan</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.liquid_packaging_fee_idr, locale)}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Asuransi Kerusakan Pecah Belah</span>
                    <span className="font-mono tabular-nums">{formatCurrency(shippingData.fragile_insurance_fee_idr, locale)}</span>
                  </div>
                  <div className="pt-2 border-t border-hairline flex justify-between items-baseline font-medium text-[14px]">
                    <span className="text-ink">Total Pembayaran:</span>
                    <span className="font-mono tabular-nums text-ink text-[16px]">{formatCurrency(totalOrderPrice, locale)}</span>
                  </div>
                </div>

                {/* Submit Checkout */}
                <button 
                  type="submit" 
                  disabled={isProcessingPayment}
                  className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-[14px] font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-paper" />
                  <span>{isProcessingPayment ? 'Menyiapkan Pembayaran...' : 'Lanjutkan ke Pembayaran QRIS / VA'}</span>
                </button>
              </form>
            ) : paymentStep === 'gateway' && paymentTrx ? (
              /* INTERACTIVE PAYMENT GATEWAY SIMULATOR SCREEN */
              <div className="p-6 bg-paper border border-bar space-y-5">
                <div className="flex justify-between items-start border-b border-hairline pb-3">
                  <div>
                    <span className="text-[12px] font-mono uppercase bg-surface text-ink px-2 py-0.5 font-medium border border-hairline">
                      GATEWAY PEMBAYARAN RESMI (SANDBOX)
                    </span>
                    <h4 className="font-serif text-[24px] leading-[32px] font-normal pt-1 text-ink">{paymentTrx.order_number}</h4>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[12px] font-mono text-secondary block">Batas Waktu Bayar</span>
                    <span className="text-[12px] font-mono font-medium text-error bg-surface px-2 py-0.5 border border-hairline">
                      14:59 Menit
                    </span>
                  </div>
                </div>

                {/* QRIS Screen */}
                {paymentTrx.payment_method === 'qris' && (
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-paper border border-hairline max-w-xs mx-auto space-y-3">
                      <div className="flex items-center justify-between border-b border-hairline pb-2 text-[12px] font-mono">
                        <span className="font-medium text-ink">QRIS STANDAR NASIONAL</span>
                        <span className="text-secondary">NMID: ID102026889</span>
                      </div>
                      
                      <div className="w-48 h-48 mx-auto bg-paper border-2 border-bar p-2 flex flex-col items-center justify-center relative">
                        <QrCode className="w-40 h-40 text-ink" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-bar text-paper font-mono text-[12px] px-2 py-0.5 font-medium tracking-wider">
                            SENSTORIA
                          </span>
                        </div>
                      </div>

                      <div className="text-[12px] space-y-0.5 font-mono tabular-nums">
                        <p className="font-medium text-ink">SENSTORIA ATELIER</p>
                        <p className="text-[12px] text-secondary">Total: <strong className="text-ink">{formatCurrency(paymentTrx.amount_idr, locale)}</strong></p>
                      </div>
                    </div>
                    <p className="text-[12px] text-secondary">
                      Buka aplikasi BCA Mobile, GoPay, OVO, Dana, atau mobile banking kamu, pilih menu <strong>Scan QRIS</strong> lalu arahkan kamera ke kode di atas.
                    </p>
                  </div>
                )}

                {/* BCA Virtual Account Screen */}
                {paymentTrx.payment_method === 'bca_va' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-surface border border-hairline space-y-3 text-[12px]">
                      <div className="flex justify-between items-center border-b border-hairline pb-2 font-mono">
                        <span className="font-medium text-ink">BCA VIRTUAL ACCOUNT</span>
                        <span className="text-secondary">Otomatis Terverifikasi</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[12px] text-secondary block">Nomor Virtual Account:</span>
                        <div className="flex items-center justify-between bg-paper p-2.5 border border-hairline font-mono text-[14px] font-medium text-ink">
                          <span>{paymentTrx.va_number}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentTrx.va_number || '');
                              setCopiedVa(true);
                              setTimeout(() => setCopiedVa(false), 3000);
                            }}
                            className="text-[12px] font-sans font-medium px-2 py-1 bg-surface border border-border hover:bg-paper flex items-center gap-1"
                          >
                            {copiedVa ? <Check className="w-3.5 h-3.5 text-ink" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-[12px] text-secondary">Total Pembayaran:</span>
                        <span className="font-mono tabular-nums text-[16px] font-medium text-ink">{formatCurrency(paymentTrx.amount_idr, locale)}</span>
                      </div>
                    </div>
                    <div className="text-[12px] text-secondary space-y-1">
                      <p><strong className="text-ink">Cara Pembayaran via m-BCA:</strong></p>
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
                  <div className="p-4 bg-surface border border-hairline space-y-3 text-[12px] text-center">
                    <span className="font-medium font-mono block text-ink">GOPAY / E-WALLET CHECKOUT</span>
                    <p className="text-[12px] text-secondary">
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
                    className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-[12px] font-medium uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-paper" />
                    <span>{isProcessingPayment ? 'Memverifikasi Pembayaran...' : 'Simulasikan Pembayaran Lunas (Sandbox)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStep('form')}
                    className="w-full py-2 bg-paper hover:bg-surface border border-border text-[12px] font-medium text-secondary hover:text-ink transition"
                  >
                    ← Ubah Kurir atau Metode Pembayaran
                  </button>
                </div>
              </div>
            ) : (
              /* ORDER CONFIRMATION INVOICE / RECEIPT */
              <div className="p-6 bg-paper border border-bar space-y-4">
                <div className="flex justify-between items-start border-b border-hairline pb-3">
                  <div>
                    <span className="text-[12px] font-mono uppercase bg-surface text-ink px-2 py-0.5 font-medium border border-hairline">
                      PESANAN LUNAS (VERIFIKASI SISTEM)
                    </span>
                    <h4 className="font-serif text-[24px] leading-[32px] font-normal pt-1 text-ink">{orderCompleted?.order_number}</h4>
                  </div>
                  <div className="text-right text-[12px] font-mono tabular-nums text-secondary">
                    <span>{orderCompleted ? new Date(orderCompleted.created_at).toLocaleDateString(translations[locale].app.idId) : ''}</span>
                  </div>
                </div>

                <div className="space-y-2 text-[12px]">
                  <p className="text-bar">
                    Terima kasih, <strong>{orderCompleted?.recipient_name}</strong>! Pembayaran pesanan decant sampelmu telah berhasil diverifikasi oleh sistem gateway.
                  </p>
                  
                  <div className="p-3 bg-surface border border-hairline space-y-1.5 font-mono text-[12px] tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-secondary">Produk:</span>
                      <span className="font-medium text-ink">{orderCompleted?.brand} - {orderCompleted?.perfume_name} ({orderCompleted?.size_ml} ml)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Tujuan:</span>
                      <span className="font-sans text-[12px] max-w-[200px] text-right truncate text-ink">{orderCompleted?.shipping_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Ekspedisi:</span>
                      <span className="uppercase text-ink">{orderCompleted?.shipping_courier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Metode Bayar:</span>
                      <span className="uppercase text-ink font-medium">{orderCompleted?.payment_method} (LUNAS)</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-hairline font-medium text-ink text-[14px]">
                      <span>Total Biaya:</span>
                      <span>{orderCompleted ? formatCurrency(orderCompleted.total_idr, locale) : ''}</span>
                    </div>
                  </div>

                  <p className="text-[12px] text-secondary leading-relaxed">
                    Pesanan decant ini diproses dengan standar higienitas laboratorium parfum dan proteksi kemasan anti-pecah untuk menjamin kualitas botol sampai di tanganmu.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-bar hover:bg-ink text-paper text-[12px] font-medium"
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
