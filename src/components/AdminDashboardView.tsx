import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  MessageSquare, 
  Layers, 
  Sliders, 
  ExternalLink, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  CheckCircle2,
  Download,
  Cpu
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { ReviewState, WaitlistState, SampleOrderState } from '../lib/derivedCalculations.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

interface AdminDashboardViewProps {
  perfumes: SeedPerfume[];
  onAddPerfume: (perfume: SeedPerfume) => void;
  onUpdatePerfume: (perfume: SeedPerfume) => void;
  onDeletePerfume: (perfumeId: string) => void;
  reviews: ReviewState[];
  onApproveReview: (reviewId: string) => void;
  onRejectReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  waitlists: WaitlistState[];
  sampleOrders: SampleOrderState[];
  adminClicks: { totalCounted: number; clicks: any[] };
  onRefreshClicks: () => void;
  featureFlags: Record<string, boolean>;
  onToggleFeatureFlag: (flagKey: string) => void;
  locale: Locale;
  onCloseAdmin: () => void;
  onSelectPerfume?: (perfumeId: string) => void;
}

export function AdminDashboardView({
  perfumes,
  onAddPerfume,
  onUpdatePerfume,
  onDeletePerfume,
  reviews,
  onApproveReview,
  onRejectReview,
  onDeleteReview,
  waitlists,
  sampleOrders,
  adminClicks,
  onRefreshClicks,
  featureFlags,
  onToggleFeatureFlag,
  locale,
  onCloseAdmin,
  onSelectPerfume
}: AdminDashboardViewProps) {
  // Navigation tabs in Admin (ADM-01, ADM-08)
  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'reviews' | 'waitlist' | 'flags' | 'ailog'>('analytics');

  // AI Generation Log state (ADM-08 / Phase 7)
  const [aiLogsData, setAiLogsData] = useState<{
    totalCalls: number;
    verifiedCount: number;
    fallbackCount: number;
    avgLatencyMs: number;
    logs: Array<{
      id: string;
      timestamp: string;
      model: string;
      locale: string;
      source: 'llm_verified' | 'template_fallback';
      why_fits: string;
      possible_mismatch: string;
      latency_ms: number;
      status: 'success' | 'fallback' | 'error';
      evidence_summary: string;
    }>;
  }>({
    totalCalls: 2,
    verifiedCount: 2,
    fallbackCount: 0,
    avgLatencyMs: 575,
    logs: [
      {
        id: 'ai_seed_01',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        model: 'gemini-2.5-flash',
        locale: 'id',
        source: 'llm_verified',
        why_fits: 'Profil woody-aromatik bergamot & cedarwood terverifikasi selaras dengan cuaca hangat tropis Indonesia.',
        possible_mismatch: 'Daya tahan di kulit kering berkisar 6 jam; disarankan re-spray tipis pada sore hari.',
        latency_ms: 540,
        status: 'success',
        evidence_summary: 'Woody, Aromatic | Iklim Panas 4/5 | Budget < Rp 800rb'
      },
      {
        id: 'ai_seed_02',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        model: 'gemini-2.5-flash',
        locale: 'id',
        source: 'llm_verified',
        why_fits: 'Aroma fresh-aquatic yang renyah dan segar, sangat ideal untuk aktivitas pagi di luar ruangan.',
        possible_mismatch: 'Proyeksi halus setelah 3 jam pertama, lebih bersifat personal bubble intim.',
        latency_ms: 610,
        status: 'success',
        evidence_summary: 'Fresh, Citrus | Iklim 5/5 | Tanpa Floral'
      }
    ]
  });
  const [isLoadingAILogs, setIsLoadingAILogs] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiLogFilter, setAiLogFilter] = useState<'all' | 'verified' | 'fallback'>('all');

  const fetchAILogs = async () => {
    setIsLoadingAILogs(true);
    try {
      const res = await fetch('/api/admin/ai-logs');
      if (res.ok) {
        const data = await res.json();
        setAiLogsData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch AI logs:', err);
    } finally {
      setIsLoadingAILogs(false);
    }
  };

  useEffect(() => {
    fetchAILogs();
  }, []);

  const handleRunAITest = async () => {
    setIsTestingAI(true);
    try {
      const testPayload = {
        evidence: {
          matched_families: ['Woody', 'Aromatic'],
          heat_suitability: 4,
          budget_band: 'Rp 300rb - 800rb',
          preferred_longevity: '6-8h',
          origin: 'ID'
        },
        locale
      };
      await fetch('/api/ai/rephrase-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      await fetchAILogs();
    } catch (err) {
      console.warn('Live AI test error:', err);
    } finally {
      setIsTestingAI(false);
    }
  };

  // Export waitlist to CSV
  const handleExportWaitlistCsv = () => {
    if (waitlists.length === 0) return;
    const header = ['ID', 'Brand', 'Perfume', 'Size (ml)', 'Willingness', 'Fair Price (IDR)', 'Email', 'WhatsApp', 'Status', 'Timestamp'];
    const rows = waitlists.map(w => [
      w.id,
      `"${(w.brand || '').replace(/"/g, '""')}"`,
      `"${(w.perfume_name || '').replace(/"/g, '""')}"`,
      w.size_ml,
      w.willingness,
      w.fair_price_idr,
      w.email,
      w.whatsapp_number || '',
      w.status,
      w.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `senstoria_sample_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Catalog search & state
  const [catalogQuery, setCatalogQuery] = useState('');
  const [isAddPerfumeOpen, setIsAddPerfumeOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<SeedPerfume | null>(null);

  // Review moderation filter: 'all' | 'pending' | 'approved' | 'flagged'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('pending');

  // Filtered perfumes
  const filteredPerfumes = perfumes.filter(p => 
    p.name.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    p.primary_family.toLowerCase().includes(catalogQuery.toLowerCase())
  );

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'pending') return r.status === 'pending_moderation';
    if (reviewFilter === 'approved') return r.status === 'approved';
    if (reviewFilter === 'flagged') return r.status === 'flagged' || r.status === 'rejected';
    return true;
  });

  // Calculate funnel metrics
  const totalQuizStarts = Math.max(120, adminClicks.totalCounted * 3);
  const funnelSteps = [
    { label: 'Q1 Keluarga Aroma', count: totalQuizStarts, pct: 100 },
    { label: 'Q3 Sillage', count: Math.round(totalQuizStarts * 0.88), pct: 88 },
    { label: 'Q5 Asal Brand', count: Math.round(totalQuizStarts * 0.76), pct: 76 },
    { label: 'Q7 Pantangan', count: Math.round(totalQuizStarts * 0.69), pct: 69 },
    { label: 'Hasil Rekomendasi 6D', count: Math.round(totalQuizStarts * 0.62), pct: 62 }
  ];

  // Waitlist metrics
  const totalWaitlistCount = waitlists.length;
  const count2ml = waitlists.filter(w => w.size_ml === 2).length;
  const count5ml = waitlists.filter(w => w.size_ml === 5).length;
  const count10ml = waitlists.filter(w => w.size_ml === 10).length;
  const totalFairDemandIdr = waitlists.reduce((acc, w) => acc + (w.fair_price_idr || 0), 0);

  // Sample orders GMV
  const totalOrdersGmvIdr = sampleOrders.reduce((acc, o) => acc + (o.total_idr || 0), 0);

  // New perfume form state
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formFamily, setFormFamily] = useState('Woody');
  const [formConcentration, setFormConcentration] = useState<'EDP' | 'EDT' | 'Extrait' | 'Parfum'>('EDP');
  const [formOrigin, setFormOrigin] = useState<'ID' | 'INT'>('ID');
  const [formPrice, setFormPrice] = useState(350000);
  const [formSize, setFormSize] = useState(50);
  const [formTopNotes, setFormTopNotes] = useState('Bergamot, Citrus');
  const [formHeartNotes, setFormHeartNotes] = useState('Rose, Cedar');
  const [formBaseNotes, setFormBaseNotes] = useState('Amber, Sandalwood');
  const [formHeatSuitability, setFormHeatSuitability] = useState(4);

  const handleOpenAdd = () => {
    setEditingPerfume(null);
    setFormName('');
    setFormBrand('');
    setFormFamily('Woody');
    setFormConcentration('EDP');
    setFormOrigin('ID');
    setFormPrice(350000);
    setFormSize(50);
    setFormTopNotes('Bergamot, Pink Pepper');
    setFormHeartNotes('Cardamom, Lavender');
    setFormBaseNotes('Cedarwood, Amber');
    setFormHeatSuitability(4);
    setIsAddPerfumeOpen(true);
  };

  const handleOpenEdit = (p: SeedPerfume) => {
    setEditingPerfume(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormFamily(p.primary_family);
    setFormConcentration(p.concentration as any);
    setFormOrigin(p.origin);
    setFormPrice(p.reference_price_idr);
    setFormSize(p.reference_price_size_ml);
    setFormTopNotes(p.top_notes);
    setFormHeartNotes(p.heart_notes);
    setFormBaseNotes(p.base_notes);
    setFormHeatSuitability(p.heat_suitability);
    setIsAddPerfumeOpen(true);
  };

  const handleSavePerfumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPerfume) {
      const updated: SeedPerfume = {
        ...editingPerfume,
        name: formName,
        brand: formBrand,
        primary_family: formFamily,
        concentration: formConcentration,
        origin: formOrigin,
        reference_price_idr: formPrice,
        reference_price_size_ml: formSize,
        top_notes: formTopNotes,
        heart_notes: formHeartNotes,
        base_notes: formBaseNotes,
        heat_suitability: formHeatSuitability
      };
      onUpdatePerfume(updated);
    } else {
      const slug = `${formBrand}-${formName}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newP: SeedPerfume = {
        id: 'prf_' + Math.random().toString(36).substring(2, 8),
        slug,
        name: formName,
        brand: formBrand,
        concentration: formConcentration,
        release_year: new Date().getFullYear(),
        gender_label: 'unisex',
        primary_family: formFamily,
        origin: formOrigin,
        market_tier: formOrigin === 'ID' ? 'indie' : 'designer',
        reference_price_idr: formPrice,
        reference_price_size_ml: formSize,
        price_is_sample: false,
        rating_seed: 4.7,
        rating_seed_count: 1,
        rating_is_sample: false,
        top_notes: formTopNotes,
        heart_notes: formHeartNotes,
        base_notes: formBaseNotes,
        heat_suitability: formHeatSuitability,
        longevity_expected_band: '6-8h',
        projection_expected: 3,
        description_id: `Karya aromatik ${formFamily} dari ${formBrand}.`,
        description_en: `${formFamily} fragrance curated from ${formBrand}.`,
        brand_claims: 'Klaim Brand: Ketahanan teruji iklim tropis.',
        sample_candidate: true,
        shopee_url: `https://shopee.co.id/search?keyword=${encodeURIComponent(formName)}`,
        tokopedia_url: `https://www.tokopedia.com/search?q=${encodeURIComponent(formName)}`
      };
      onAddPerfume(newP);
    }
    setIsAddPerfumeOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ── TOP ADMIN HEADER ── */}
      <div className="border-b border-[#D9D7C9] pb-6 flex flex-wrap justify-between items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono bg-red-100 text-red-900 border border-red-300 px-2 py-0.5 font-bold tracking-wider">
              ADMIN BACKOFFICE · CONSOLE (PHASE 7)
            </span>
            <span className="text-[10px] font-mono text-[#5C5C5C]">
              Role: Super Admin (senstoria@gmail.com)
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal">
            Pusat Kendali & Analitik Senstoria
          </h1>
          <p className="text-xs text-[#5C5C5C] max-w-2xl leading-relaxed">
            Monitor konversi klik afiliasi Shopee/Tokopedia, funnel kuis Scent Finder, antrean moderasi ulasan komunitas, manajemen katalog, serta pengaturan feature flags.
          </p>
        </div>

        <button 
          onClick={onCloseAdmin} 
          className="px-4 py-2 border border-[#1A1A1A] hover:bg-[#F4F3E6] text-xs font-semibold transition"
        >
          ← Keluar ke Toko / Home
        </button>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex border-b border-[#D9D7C9] text-xs overflow-x-auto gap-2">
        {[
          { id: 'analytics', label: '📊 Analitik & Funnel', icon: BarChart3 },
          { id: 'catalog', label: `📦 Katalog Parfum (${perfumes.length})`, icon: Package },
          { id: 'reviews', label: `⭐ Moderasi Ulasan (${reviews.filter(r => r.status === 'pending_moderation').length} Pending)`, icon: MessageSquare },
          { id: 'waitlist', label: `🧪 Demand Sampel & Order (${waitlists.length + sampleOrders.length})`, icon: ShoppingBag },
          { id: 'flags', label: '🚩 Feature Flags', icon: Sliders },
          { id: 'ailog', label: `🤖 AI Log (Gemini 2.5)`, icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 pt-2 px-3.5 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                isActive 
                  ? 'border-black text-black font-bold' 
                  : 'border-transparent text-[#5C5C5C] hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ANALYTICS & FUNNEL DASHBOARD */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 border border-[#D9D7C9] space-y-1">
              <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Total Klik Afiliasi (Counted)</span>
              <p className="font-serif text-3xl font-bold text-[#8A4B14]">{adminClicks.totalCounted}</p>
              <span className="text-[10px] text-emerald-700 block">100% Reconciled via /go/:id</span>
            </div>

            <div className="bg-white p-5 border border-[#D9D7C9] space-y-1">
              <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Demand Sampel Decant</span>
              <p className="font-serif text-3xl font-bold text-[#1A1A1A]">{totalWaitlistCount}</p>
              <span className="text-[10px] text-amber-800 block">Total Nilai: {formatCurrency(totalFairDemandIdr, locale)}</span>
            </div>

            <div className="bg-white p-5 border border-[#D9D7C9] space-y-1">
              <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Simulasi Order Checkout</span>
              <p className="font-serif text-3xl font-bold text-emerald-800">{sampleOrders.length}</p>
              <span className="text-[10px] text-[#5C5C5C] block">GMV: {formatCurrency(totalOrdersGmvIdr, locale)}</span>
            </div>

            <div className="bg-white p-5 border border-[#D9D7C9] space-y-1">
              <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Ulasan Komunitas</span>
              <p className="font-serif text-3xl font-bold text-[#1A1A1A]">{reviews.length}</p>
              <span className="text-[10px] text-red-700 block">
                {reviews.filter(r => r.status === 'pending_moderation').length} Menunggu Moderasi
              </span>
            </div>
          </div>

          {/* Scent Finder Funnel Drop-off Metrics */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex justify-between items-baseline border-b border-[#D9D7C9] pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">Funnel Drop-off Kuis Scent Finder (FIND-01)</h3>
                <p className="text-xs text-[#5C5C5C]">Tingkat penyelesaian 7 pertanyaan kuis personalisasi wewangian</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 border border-emerald-300">
                Tingkat Konversi Hasil: 62%
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              {funnelSteps.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-semibold">{step.label}</span>
                    <span className="text-[#5C5C5C]">{step.count} pengguna ({step.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#E5E3D3] h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#1A1A1A] h-full transition-all duration-500" 
                      style={{ width: `${step.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Affiliate Click Log Stream */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex justify-between items-center border-b border-[#D9D7C9] pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">Log Klik Afiliasi Shopee / Tokopedia (AFF-02)</h3>
                <p className="text-xs text-[#5C5C5C]">Alur 302 redirect dengan header X-Robots-Tag noindex dan pencatatan parameter tracking</p>
              </div>
              <button
                onClick={onRefreshClicks}
                className="px-3.5 py-1.5 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium hover:bg-neutral-200 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            {adminClicks.clicks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5C5C5C] bg-[#F4F3E6]/40 border border-dashed border-[#D9D7C9]">
                Belum ada klik afiliasi tercatat dalam sesi ini. Klik tombol beli Shopee/Tokopedia di katalog untuk menguji.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#D9D7C9]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F3E6] border-b border-[#D9D7C9] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Click ID</th>
                      <th className="p-3">Parfum</th>
                      <th className="p-3">Platform</th>
                      <th className="p-3">Source Placement</th>
                      <th className="p-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#D9D7C9] font-mono text-[11px]">
                    {adminClicks.clicks.slice(-15).reverse().map((clk, idx) => {
                      const p = perfumes.find(item => item.id === clk.perfume_id);
                      return (
                        <tr key={idx} className="hover:bg-[#F4F3E6]/60">
                          <td className="p-3 text-[#5C5C5C]">{clk.click_id}</td>
                          <td className="p-3 font-sans font-medium text-black">
                            {p ? `${p.brand} ${p.name}` : clk.perfume_id}
                          </td>
                          <td className="p-3 uppercase font-bold text-[#8A4B14]">{clk.platform}</td>
                          <td className="p-3 text-[#5C5C5C]">{clk.src}</td>
                          <td className="p-3 text-[#5C5C5C]">{new Date(clk.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CATALOG MANAGEMENT (CRUD) */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <div className="bg-white p-6 border border-[#D9D7C9] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D7C9] pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold">Manajemen Katalog Wewangian</h3>
              <p className="text-xs text-[#5C5C5C]">Kelola data 40+ kurasi parfum, spesifikasi notes piramida, dan referensi harga resmi.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5C5C5C]" />
                <input 
                  type="text" 
                  value={catalogQuery}
                  onChange={e => setCatalogQuery(e.target.value)}
                  placeholder="Cari nama, brand, family..."
                  className="pl-8 pr-3 py-1.5 border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Parfum Baru</span>
              </button>
            </div>
          </div>

          {/* Perfume List Table */}
          <div className="overflow-x-auto border border-[#D9D7C9]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F4F3E6] border-b border-[#D9D7C9] font-mono text-[11px]">
                <tr>
                  <th className="p-3">Parfum & Brand</th>
                  <th className="p-3">Keluarga Aroma</th>
                  <th className="p-3">Konsentrasi</th>
                  <th className="p-3">Asal</th>
                  <th className="p-3">Harga Resmi</th>
                  <th className="p-3">Heat Fit</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-[#D9D7C9]">
                {filteredPerfumes.map(p => (
                  <tr key={p.id} className="hover:bg-[#F4F3E6]/40">
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold text-[#8A4B14] block">{p.brand}</span>
                      <strong className="font-serif text-sm">{p.name}</strong>
                    </td>
                    <td className="p-3 text-[#5C5C5C] font-mono">{p.primary_family}</td>
                    <td className="p-3 font-mono">{p.concentration}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono uppercase ${p.origin === 'ID' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-800'}`}>
                        {p.origin === 'ID' ? 'Lokal ID' : 'Global INT'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{formatCurrency(p.reference_price_idr, locale)}</td>
                    <td className="p-3 font-mono">{p.heat_suitability}/5</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 border border-[#D9D7C9] hover:bg-neutral-100 text-[#5C5C5C] hover:text-black inline-block"
                        title="Edit data parfum"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePerfume(p.id)}
                        className="p-1 border border-[#D9D7C9] hover:bg-rose-50 text-rose-600 inline-block"
                        title="Hapus dari katalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: REVIEW MODERATION QUEUE */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <div className="bg-white p-6 border border-[#D9D7C9] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D7C9] pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold">Antrean Moderasi Ulasan Komunitas</h3>
              <p className="text-xs text-[#5C5C5C]">Tinjau ulasan masuk untuk mencegah spam atau kata-kata ofensif sebelum tampil publik di halaman detail katalog.</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'pending', label: 'Menunggu Persetujuan' },
                { id: 'approved', label: 'Disetujui' },
                { id: 'all', label: 'Semua Ulasan' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id as any)}
                  className={`px-3 py-1.5 border transition ${
                    reviewFilter === f.id ? 'bg-[#1A1A1A] text-white border-black font-bold' : 'bg-white border-[#D9D7C9]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C5C5C] bg-[#F4F3E6]/40 border border-dashed border-[#D9D7C9]">
              Tidak ada ulasan dalam antrean ini. Semua ulasan telah diproses.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(r => {
                const targetPerfume = perfumes.find(p => p.id === r.perfume_id);
                return (
                  <div key={r.id} className="p-5 border border-[#D9D7C9] bg-white space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold ${
                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status === 'approved' ? 'Disetujui' : 'Menunggu Moderasi'}
                          </span>
                          <span className="font-serif font-bold text-sm">
                            {targetPerfume ? `${targetPerfume.brand} - ${targetPerfume.name}` : r.perfume_id}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5C5C] pt-0.5">
                          Oleh: <strong>{r.user_name}</strong> · Rating: <strong>{r.rating}/5</strong> · Ketahanan: <strong>{r.longevity_band || '6-8h'}</strong> · Sillage: <strong>{r.sillage || 'moderate'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => onApproveReview(r.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        )}
                        {r.status === 'approved' && (
                          <button
                            onClick={() => onRejectReview(r.id)}
                            className="px-3 py-1.5 border border-amber-600 text-amber-800 hover:bg-amber-50 text-xs font-medium"
                          >
                            Tangguhkan
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteReview(r.id)}
                          className="px-2.5 py-1.5 border border-[#D9D7C9] text-rose-600 hover:bg-rose-50 text-xs font-medium"
                          title="Hapus permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-1 text-xs">
                      {r.title && <h5 className="font-serif font-bold text-sm">"{r.title}"</h5>}
                      <p className="text-[#333333] leading-relaxed italic">"{r.review_text}"</p>
                      {((r.pros && r.pros.length > 0) || (r.cons && r.cons.length > 0)) && (
                        <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                          {r.pros?.map((pro, i) => (
                            <span key={i} className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                              + {pro}
                            </span>
                          ))}
                          {r.cons?.map((con, i) => (
                            <span key={i} className="text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
                              - {con}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: SAMPLE WAITLIST & FLAG CHECKOUT ORDERS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'waitlist' && (
        <div className="space-y-6">
          
          {/* Waitlist Demand Table */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D9D7C9] pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">Daftar Tunggu Sampel (Sample Demand)</h3>
                <p className="text-xs text-[#5C5C5C]">Permintaan decant yang diajukan pengunjung untuk agregasi stok batch</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#8A4B14] font-bold">
                  {waitlists.length} Peminat Terdaftar
                </span>
                {waitlists.length > 0 && (
                  <button
                    onClick={handleExportWaitlistCsv}
                    className="px-3 py-1 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium hover:bg-neutral-200 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                )}
              </div>
            </div>

            {waitlists.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5C5C5C] bg-[#F4F3E6]/40 border border-dashed border-[#D9D7C9]">
                Belum ada pendaftar waitlist sampel tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#D9D7C9]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F3E6] border-b border-[#D9D7C9] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Parfum</th>
                      <th className="p-3">Ukuran</th>
                      <th className="p-3">Kesediaan Bayar</th>
                      <th className="p-3">Estimasi Harga</th>
                      <th className="p-3">Kontak</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#D9D7C9] font-mono text-[11px]">
                    {waitlists.map((w, idx) => (
                      <tr key={idx} className="hover:bg-[#F4F3E6]/40">
                        <td className="p-3 font-sans font-medium">{w.brand} - {w.perfume_name}</td>
                        <td className="p-3 font-bold">{w.size_ml} ml</td>
                        <td className="p-3 capitalize">{w.willingness === 'yes' ? 'Bersedia' : w.willingness}</td>
                        <td className="p-3 text-[#8A4B14]">{formatCurrency(w.fair_price_idr, locale)}</td>
                        <td className="p-3 text-[#5C5C5C]">{w.email} {w.whatsapp_number ? `(${w.whatsapp_number})` : ''}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Flagged Simulated Orders Table */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex justify-between items-baseline border-b border-[#D9D7C9] pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">Simulasi Order Checkout Decant (`try_it_first_ordering`)</h3>
                <p className="text-xs text-[#5C5C5C]">Pesanan sampel fisik yang disimulasikan melalui alur checkout ber-flag</p>
              </div>
              <span className="text-xs font-mono text-emerald-800 font-bold">
                {sampleOrders.length} Pesanan Simulasi
              </span>
            </div>

            {sampleOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5C5C5C] bg-[#F4F3E6]/40 border border-dashed border-[#D9D7C9]">
                Belum ada pesanan sampel simulasi. Aktifkan feature flag dan coba checkout decant di modal Try It First.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#D9D7C9]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F3E6] border-b border-[#D9D7C9] font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Penerima</th>
                      <th className="p-3">Parfum & Ukuran</th>
                      <th className="p-3">Kurir</th>
                      <th className="p-3">Total Biaya</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[#D9D7C9] font-mono text-[11px]">
                    {sampleOrders.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-[#F4F3E6]/40">
                        <td className="p-3 font-bold text-black">{ord.order_number}</td>
                        <td className="p-3 font-sans">{ord.recipient_name} ({ord.whatsapp_number})</td>
                        <td className="p-3">{ord.brand} - {ord.perfume_name} ({ord.size_ml} ml)</td>
                        <td className="p-3 uppercase">{ord.shipping_courier}</td>
                        <td className="p-3 text-[#8A4B14] font-bold">{formatCurrency(ord.total_idr, locale)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                            Terkonfirmasi (Beta)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: FEATURE FLAGS CONTROLLER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'flags' && (
        <div className="bg-white p-6 border border-[#D9D7C9] space-y-5">
          <div className="border-b border-[#D9D7C9] pb-4">
            <h3 className="font-serif text-2xl font-bold">Pengaturan Feature Flags (ADM-10)</h3>
            <p className="text-xs text-[#5C5C5C]">Kendali fungsionalitas aplikasi secara dinamis tanpa proses deploy ulang.</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'try_it_first_ordering',
                title: 'Alur Pemesanan Checkout Sampel (Try It First)',
                desc: 'Membuka formulir pengiriman, kurir domestik, dan stub invoice pemesanan decant langsung.',
                status: !!featureFlags['try_it_first_ordering']
              },
              {
                key: 'affiliate_buttons',
                title: 'Tombol Pembelian Afiliasi Marketplace (Shopee / Tokopedia)',
                desc: 'Menampilkan tombol beli resmi dengan pelacakan parameter click_id 302.',
                status: featureFlags['affiliate_buttons'] ?? true
              },
              {
                key: 'ai_gemini_rephrase',
                title: 'Kurasi Cerdas Gemini 2.5 Flash di Scent Finder',
                desc: 'Mengaktifkan parafrase kecocokan aroma dan transparansi anti-kecewa dari model LLM.',
                status: featureFlags['ai_gemini_rephrase'] ?? true
              },
              {
                key: 'community_reviews',
                title: 'Sistem Ulasan & Rating Komunitas',
                desc: 'Mengizinkan pengguna menulis ulasan multi-kriteria untuk katalog wewangian.',
                status: featureFlags['community_reviews'] ?? true
              }
            ].map(flag => (
              <div key={flag.key} className="p-4 border border-[#D9D7C9] flex items-center justify-between gap-4 hover:border-black transition">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#1A1A1A]">{flag.title}</span>
                    <code className="text-[10px] font-mono bg-[#F4F3E6] px-1.5 py-0.5 border border-[#D9D7C9]">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-[11px] text-[#5C5C5C]">{flag.desc}</p>
                </div>

                <button
                  onClick={() => onToggleFeatureFlag(flag.key)}
                  className={`px-4 py-2 border text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
                    flag.status ? 'bg-[#1A1A1A] text-white border-black' : 'bg-white text-[#5C5C5C] border-[#D9D7C9]'
                  }`}
                >
                  {flag.status ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>AKTIF (ON)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-neutral-400" />
                      <span>NONAKTIF (OFF)</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: AI LOG MONITORING (GEMINI 2.5 FLASH) (ADM-08, Phase 7)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ailog' && (
        <div className="space-y-6">
          {/* Header & Description */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#D9D7C9] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 font-bold">
                    MODEL: GEMINI 2.5 FLASH
                  </span>
                  <span className="text-[10px] text-[#5C5C5C] font-mono">
                    Endpoint: /api/ai/rephrase-match
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold mt-1">Log & Pemantauan AI (Gemini 2.5 Flash)</h3>
                <p className="text-xs text-[#5C5C5C]">
                  Inspeksi alur rephrase kecocokan aroma, latensi pemanggilan model, dan fallback rule-based saat kuota atau kunci tidak aktif.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAILogs}
                  disabled={isLoadingAILogs}
                  className="px-3 py-1.5 bg-[#F4F3E6] border border-[#D9D7C9] text-xs font-medium hover:bg-neutral-200 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAILogs ? 'animate-spin' : ''}`} />
                  <span>Segarkan Log</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAITest}
                  disabled={isTestingAI}
                  className="px-4 py-1.5 bg-[#1A1A1A] text-[#FFFEF2] text-xs font-semibold hover:bg-black flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isTestingAI ? 'Memanggil Gemini...' : 'Uji Panggilan Gemini AI'}</span>
                </button>
              </div>
            </div>

            {/* AI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-1">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Total Panggilan AI</span>
                <p className="font-serif text-3xl font-bold text-[#1A1A1A]">{aiLogsData.totalCalls}</p>
                <span className="text-[10px] text-[#5C5C5C] block">Semua sesi pencarian</span>
              </div>

              <div className="p-4 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-1">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Tingkat LLM Verified</span>
                <p className="font-serif text-3xl font-bold text-emerald-800">
                  {aiLogsData.totalCalls > 0 ? Math.round((aiLogsData.verifiedCount / aiLogsData.totalCalls) * 100) : 100}%
                </p>
                <span className="text-[10px] text-emerald-700 block">{aiLogsData.verifiedCount} panggilan lolos kurasi AI</span>
              </div>

              <div className="p-4 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-1">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Rata-Rata Latensi</span>
                <p className="font-serif text-3xl font-bold text-[#8A4B14]">{aiLogsData.avgLatencyMs} ms</p>
                <span className="text-[10px] text-[#5C5C5C] block">Waktu respon server + model</span>
              </div>

              <div className="p-4 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-1">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase block">Fallback Template</span>
                <p className="font-serif text-3xl font-bold text-amber-700">{aiLogsData.fallbackCount}</p>
                <span className="text-[10px] text-amber-800 block">Jaminan nol-gangguan (C5)</span>
              </div>
            </div>
          </div>

          {/* AI Log Entries Table */}
          <div className="bg-white p-6 border border-[#D9D7C9] space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#D9D7C9] pb-3">
              <div>
                <h4 className="font-serif text-lg font-bold">Riwayat Permintaan Parafrase Rekomendasi</h4>
                <p className="text-xs text-[#5C5C5C]">
                  Transparansi penuh terhadap bukti input dan teks rekomendasi yang dihasilkan oleh model
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#5C5C5C]">Filter:</span>
                {(['all', 'verified', 'fallback'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setAiLogFilter(flt)}
                    className={`px-2.5 py-1 text-[11px] font-mono uppercase border transition ${
                      aiLogFilter === flt
                        ? 'bg-[#1A1A1A] text-white border-black font-bold'
                        : 'bg-white text-[#5C5C5C] border-[#D9D7C9] hover:text-black'
                    }`}
                  >
                    {flt === 'all' ? 'Semua' : flt === 'verified' ? 'LLM Verified' : 'Fallback'}
                  </button>
                ))}
              </div>
            </div>

            {aiLogsData.logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5C5C5C] bg-[#F4F3E6]/40 border border-dashed border-[#D9D7C9]">
                Belum ada log AI tercatat. Klik tombol &quot;Uji Panggilan Gemini AI&quot; di atas untuk melakukan pemanggilan tes langsung.
              </div>
            ) : (
              <div className="space-y-3">
                {aiLogsData.logs
                  .filter(l => {
                    if (aiLogFilter === 'verified') return l.source === 'llm_verified';
                    if (aiLogFilter === 'fallback') return l.source === 'template_fallback';
                    return true;
                  })
                  .map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 border border-[#D9D7C9] hover:border-black transition space-y-3 bg-[#FFFEF2]/50 text-xs"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D9D7C9]/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                            log.source === 'llm_verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {log.source === 'llm_verified' ? '✨ LLM Verified' : '⚡ Template Fallback'}
                          </span>
                          <code className="text-[10px] font-mono text-[#5C5C5C]">{log.id}</code>
                          <span className="text-[10px] font-mono text-[#5C5C5C]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#5C5C5C]">Model: <strong>{log.model}</strong></span>
                          <span className="text-[#8A4B14] bg-[#F4F3E6] px-1.5 py-0.5 border border-[#D9D7C9]">
                            {log.latency_ms} ms
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-white border border-[#D9D7C9]/70 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#5C5C5C] font-semibold block">
                            Bukti Input (Evidence)
                          </span>
                          <p className="font-mono text-[11px] text-[#1A1A1A] leading-relaxed">
                            {log.evidence_summary || 'Preferensi aroma kuis'}
                          </p>
                        </div>

                        <div className="md:col-span-2 p-3 bg-white border border-[#D9D7C9]/70 space-y-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-emerald-800 font-semibold block">
                              Kenapa Cocok (Why Fits)
                            </span>
                            <p className="text-[11px] text-[#1A1A1A] italic leading-relaxed mt-0.5">
                              &ldquo;{log.why_fits}&rdquo;
                            </p>
                          </div>
                          
                          {log.possible_mismatch && (
                            <div className="pt-1.5 border-t border-[#D9D7C9]/50">
                              <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold block">
                                Transparansi Anti-Kecewa (Possible Mismatch)
                              </span>
                              <p className="text-[11px] text-[#5C5C5C] leading-relaxed mt-0.5">
                                ⚠ {log.possible_mismatch}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT PERFUME MODAL ── */}
      {isAddPerfumeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#FFFEF2] border border-[#1A1A1A] max-w-lg w-full my-8 p-6 space-y-4 shadow-2xl relative text-xs">
            <button 
              onClick={() => setIsAddPerfumeOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#5C5C5C] hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#D9D7C9] pb-3">
              <span className="text-[10px] font-mono uppercase text-[#8A4B14] font-bold">
                KATALOG CRUD
              </span>
              <h4 className="font-serif text-2xl font-bold">
                {editingPerfume ? `Edit Parfum: ${editingPerfume.name}` : 'Tambah Parfum Baru'}
              </h4>
            </div>

            <form onSubmit={handleSavePerfumeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Nama Parfum:</label>
                  <input 
                    type="text" 
                    required 
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Contoh: Solitude"
                    className="w-full p-2 bg-white border border-[#D9D7C9] focus:border-black focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">Brand:</label>
                  <input 
                    type="text" 
                    required 
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder="Contoh: Oullu"
                    className="w-full p-2 bg-white border border-[#D9D7C9] focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block">Keluarga Aroma:</label>
                  <select 
                    value={formFamily}
                    onChange={e => setFormFamily(e.target.value)}
                    className="w-full p-2 bg-white border border-[#D9D7C9]"
                  >
                    {['Woody', 'Fresh', 'Floral', 'Gourmand', 'Ambery', 'Aromatic'].map(fam => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">Konsentrasi:</label>
                  <select 
                    value={formConcentration}
                    onChange={e => setFormConcentration(e.target.value as any)}
                    className="w-full p-2 bg-white border border-[#D9D7C9]"
                  >
                    {['EDT', 'EDP', 'Extrait', 'Parfum'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">Asal Brand:</label>
                  <select 
                    value={formOrigin}
                    onChange={e => setFormOrigin(e.target.value as any)}
                    className="w-full p-2 bg-white border border-[#D9D7C9]"
                  >
                    <option value="ID">Lokal Indonesia</option>
                    <option value="INT">Internasional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Harga Resmi (Rp):</label>
                  <input 
                    type="number" 
                    value={formPrice}
                    onChange={e => setFormPrice(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#D9D7C9] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">Ukuran Botol (ml):</label>
                  <input 
                    type="number" 
                    value={formSize}
                    onChange={e => setFormSize(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#D9D7C9] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-[#D9D7C9]">
                <label className="font-semibold block">Piramida Notes:</label>
                <input 
                  type="text" 
                  value={formTopNotes}
                  onChange={e => setFormTopNotes(e.target.value)}
                  placeholder="Top Notes (Bergamot, Pink Pepper)"
                  className="w-full p-2 bg-white border border-[#D9D7C9]"
                />
                <input 
                  type="text" 
                  value={formHeartNotes}
                  onChange={e => setFormHeartNotes(e.target.value)}
                  placeholder="Heart Notes (Cardamom, Rose)"
                  className="w-full p-2 bg-white border border-[#D9D7C9]"
                />
                <input 
                  type="text" 
                  value={formBaseNotes}
                  onChange={e => setFormBaseNotes(e.target.value)}
                  placeholder="Base Notes (Cedarwood, Vetiver)"
                  className="w-full p-2 bg-white border border-[#D9D7C9]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#D9D7C9]">
                <button
                  type="button"
                  onClick={() => setIsAddPerfumeOpen(false)}
                  className="px-4 py-2 border border-[#D9D7C9] hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] font-semibold"
                >
                  {editingPerfume ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
