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
  Download,
  Cpu
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { ReviewState, WaitlistState, SampleOrderState } from '../lib/derivedCalculations.ts';
import { Locale, formatCurrency, formatScoreOutOfFive, translations, fmt } from '../lib/i18n.ts';

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
  adminClicksLoaded: boolean;
  adminClicksError: boolean;
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
  adminClicksLoaded,
  adminClicksError,
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
    (p.primary_family || '').toLowerCase().includes(catalogQuery.toLowerCase())
  );

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'pending') return r.status === 'pending_moderation';
    if (reviewFilter === 'approved') return r.status === 'approved';
    if (reviewFilter === 'flagged') return r.status === 'flagged' || r.status === 'rejected';
    return true;
  });

  // Sprint 2: the Finder funnel previously showed fabricated counts (a
  // 120 floor plus fixed 88/76/69/62% steps). No funnel instrumentation
  // exists yet, so the section renders an honest "not enough data" state
  // instead of invented numbers (real funnel instrumentation: Sprint 7).
  const funnelSteps: Array<{ label: string; count: number; pct: number }> = [];

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
    setFormFamily(p.primary_family ?? '');
    setFormConcentration(p.concentration as any);
    setFormOrigin(p.origin);
    setFormPrice(p.reference_price_idr);
    setFormSize(p.reference_price_size_ml);
    setFormTopNotes(p.top_notes);
    setFormHeartNotes(p.heart_notes);
    setFormBaseNotes(p.base_notes);
    setFormHeatSuitability(p.heat_suitability ?? 3);
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
        data_status: 'draft',
        source_official_url: '',
        source_checked_date: '',
        verified_by: '',
        top_notes: formTopNotes,
        heart_notes: formHeartNotes,
        base_notes: formBaseNotes,
        heat_suitability: formHeatSuitability,
        longevity_expected_band: '6-8h',
        projection_expected: 3,
        description_id: `Karya aromatik ${formFamily} dari ${formBrand}.`,
        description_en: `${formFamily} fragrance curated from ${formBrand}.`,
        brand_claims: '',
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
      <div className="border-b border-hairline pb-6 flex flex-wrap justify-between items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/senstoria-logo.png" 
              alt="Senstoria" 
              className="h-6 w-auto object-contain"
            />
            <span className="text-[12px] uppercase font-mono bg-error/10 text-error border border-error px-2 py-0.5 font-bold tracking-wider">
              ADMIN BACKOFFICE · CONSOLE (PHASE 7)
            </span>
            <span className="text-[12px] font-mono text-secondary">
              Role: Super Admin (senstoria@gmail.com)
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal">
            {translations[locale].admin.headerTitle}
          </h1>
          <p className="text-xs text-secondary max-w-2xl leading-relaxed">
            {translations[locale].admin.headerSubtitle}
          </p>
        </div>

        <button 
          onClick={onCloseAdmin} 
          className="px-4 py-2 border border-bar hover:bg-surface text-xs font-semibold transition"
        >
          {translations[locale].admin.exitShop}
        </button>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex border-b border-hairline text-xs overflow-x-auto gap-2">
        {[
          { id: 'analytics', label: translations[locale].admin.tabAnalytics, icon: BarChart3 },
          { id: 'catalog', label: fmt(translations[locale].admin.tabCatalog, perfumes.length), icon: Package },
          { id: 'reviews', label: fmt(translations[locale].admin.tabReviews, reviews.filter(r => r.status === 'pending_moderation').length), icon: MessageSquare },
          { id: 'waitlist', label: fmt(translations[locale].admin.tabWaitlist, waitlists.length + sampleOrders.length), icon: ShoppingBag },
          { id: 'flags', label: translations[locale].admin.tabFlags, icon: Sliders },
          { id: 'ailog', label: translations[locale].admin.tabAiLog, icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 pt-2 px-3.5 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                isActive 
                  ? 'border-ink text-ink font-bold' 
                  : 'border-transparent text-secondary hover:text-ink'
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
            <div className="bg-white p-5 border border-hairline space-y-1">
              <span className="text-[12px] font-mono text-secondary uppercase block">{translations[locale].admin.statClicks}</span>
              <p className="font-serif text-3xl font-bold text-accent">{adminClicks.totalCounted}</p>
              <span className="text-[12px] text-secondary block">
                {adminClicksError
                  ? translations[locale].app.gagalMenyimpanPerubahanCobaLagi
                  : adminClicksLoaded
                    ? translations[locale].admin.clicksFromServer
                    : translations[locale].common.loading}
              </span>
            </div>

            <div className="bg-white p-5 border border-hairline space-y-1">
              <span className="text-[12px] font-mono text-secondary uppercase block">{translations[locale].admin.statWaitlistDemand}</span>
              <p className="font-serif text-3xl font-bold text-bar">{totalWaitlistCount}</p>
              <span className="text-[12px] text-warning block">{fmt(translations[locale].admin.statTotalValue, formatCurrency(totalFairDemandIdr, locale))}</span>
            </div>

            <div className="bg-white p-5 border border-hairline space-y-1">
              <span className="text-[12px] font-mono text-secondary uppercase block">{translations[locale].admin.statSimOrders}</span>
              <p className="font-serif text-3xl font-bold text-success">{sampleOrders.length}</p>
              <span className="text-[12px] text-secondary block">{fmt(translations[locale].admin.statGmv, formatCurrency(totalOrdersGmvIdr, locale))}</span>
            </div>

            <div className="bg-white p-5 border border-hairline space-y-1">
              <span className="text-[12px] font-mono text-secondary uppercase block">{translations[locale].admin.statReviews}</span>
              <p className="font-serif text-3xl font-bold text-bar">{reviews.length}</p>
              <span className="text-[12px] text-error block">
                {fmt(translations[locale].admin.statPendingReviews, reviews.filter(r => r.status === 'pending_moderation').length)}
              </span>
            </div>
          </div>

          {/* Scent Finder Funnel Drop-off Metrics */}
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex justify-between items-baseline border-b border-hairline pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">{translations[locale].admin.funnelTitle}</h3>
                <p className="text-xs text-secondary">{translations[locale].admin.funnelSubtitle}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <p className="text-xs text-secondary">{translations[locale].admin.dataBelumCukup}</p>
              {funnelSteps.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-mono text-[12px]">
                    <span className="font-semibold">{step.label}</span>
                    <span className="text-secondary">{fmt(translations[locale].admin.funnelStepCount, step.count, step.pct)}</span>
                  </div>
                  <div className="w-full bg-stone h-2.5 overflow-hidden">
                    <div 
                      className="bg-bar h-full transition-all duration-500" 
                      style={{ width: `${step.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── VISUALISASI DATA (Sprint 2: honest state) ── */}
          {/* The monthly-wear and growth charts previously rendered
              hard-coded series (Mei–Okt). No monthly aggregation exists
              yet, so both charts are replaced by an honest "not enough
              data" state until real aggregation lands (Sprint 7). */}
          <div className="bg-white p-6 border border-hairline space-y-4">
            <p className="text-xs text-secondary">{translations[locale].admin.dataBelumCukup}</p>
          </div>

          {/* Real-time Affiliate Click Log Stream */}
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex justify-between items-center border-b border-hairline pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">{translations[locale].admin.clicksTitle}</h3>
                <p className="text-xs text-secondary">{translations[locale].admin.clicksSubtitle}</p>
              </div>
              <button
                onClick={onRefreshClicks}
                className="px-3.5 py-1.5 bg-surface border border-hairline text-xs font-medium hover:bg-surface flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{translations[locale].admin.refresh}</span>
              </button>
            </div>

            {adminClicks.clicks.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface/40 border border-dashed border-hairline">
                {translations[locale].admin.clicksEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thClickId}</th>
                      <th className="p-3">{translations[locale].admin.thPerfume}</th>
                      <th className="p-3">Platform</th>
                      <th className="p-3">{translations[locale].admin.thSource}</th>
                      <th className="p-3">{translations[locale].admin.thTime}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline font-mono text-[12px]">
                    {adminClicks.clicks.slice(-15).reverse().map((clk, idx) => {
                      const p = perfumes.find(item => item.id === clk.perfume_id);
                      return (
                        <tr key={idx} className="hover:bg-surface/60">
                          <td className="p-3 text-secondary">{clk.click_id}</td>
                          <td className="p-3 font-sans font-medium text-ink">
                            {p ? `${p.brand} ${p.name}` : clk.perfume_id}
                          </td>
                          <td className="p-3 uppercase font-bold text-accent">{clk.platform}</td>
                          <td className="p-3 text-secondary">{clk.src}</td>
                          <td className="p-3 text-secondary">{new Date(clk.timestamp).toLocaleTimeString(translations[locale].app.idId)}</td>
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
        <div className="bg-white p-6 border border-hairline space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold">{translations[locale].admin.catalogTitle}</h3>
              <p className="text-xs text-secondary">{translations[locale].admin.catalogSubtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-secondary" />
                <input 
                  type="text" 
                  value={catalogQuery}
                  onChange={e => setCatalogQuery(e.target.value)}
                  placeholder={translations[locale].admin.catalogSearch}
                  className="pl-8 pr-3 py-1.5 border border-hairline text-xs focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-bar hover:bg-ink text-paper text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{translations[locale].admin.formAddTitle}</span>
              </button>
            </div>
          </div>

          {/* Perfume List Table */}
          <div className="overflow-x-auto border border-hairline">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                <tr>
                  <th className="p-3">{translations[locale].admin.thPerfumeBrand}</th>
                  <th className="p-3">{translations[locale].catalogView.familyHeading}</th>
                  <th className="p-3">Konsentrasi</th>
                  <th className="p-3">Asal</th>
                  <th className="p-3">{translations[locale].admin.thOfficialPrice}</th>
                  <th className="p-3">{translations[locale].admin.thHeatFit}</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-hairline">
                {filteredPerfumes.map(p => (
                  <tr key={p.id} className="hover:bg-surface/40">
                    <td className="p-3">
                      <span className="text-[12px] uppercase font-bold text-accent block">{p.brand}</span>
                      <strong className="font-serif text-sm">{p.name}</strong>
                    </td>
                    <td className="p-3 text-secondary font-mono">{p.primary_family}</td>
                    <td className="p-3 font-mono">{p.concentration}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[12px] font-mono uppercase ${p.origin === 'ID' ? 'bg-success/10 text-success' : 'bg-surface text-bar'}`}>
                        {p.origin === 'ID' ? 'Lokal ID' : 'Global INT'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{formatCurrency(p.reference_price_idr, locale)}</td>
                    <td className="p-3 font-mono">{formatScoreOutOfFive(p.heat_suitability, '–')}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 border border-hairline hover:bg-surface text-secondary hover:text-ink inline-block"
                        title={translations[locale].admin.editPerfumeTitle}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePerfume(p.id)}
                        className="p-1 border border-hairline hover:bg-error/10 text-error inline-block"
                        title={translations[locale].admin.deletePerfumeTitle}
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
        <div className="bg-white p-6 border border-hairline space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold">{translations[locale].admin.reviewsTitle}</h3>
              <p className="text-xs text-secondary">{translations[locale].admin.reviewsSubtitle}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'pending', label: translations[locale].admin.filterPending },
                { id: 'approved', label: translations[locale].admin.reviewApproved },
                { id: 'all', label: translations[locale].admin.filterAll }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id as any)}
                  className={`px-3 py-1.5 border transition ${
                    reviewFilter === f.id ? 'bg-bar text-paper border-ink font-bold' : 'bg-white border-hairline'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary bg-surface/40 border border-dashed border-hairline">
              {translations[locale].admin.reviewsEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(r => {
                const targetPerfume = perfumes.find(p => p.id === r.perfume_id);
                return (
                  <div key={r.id} className="p-5 border border-hairline bg-white space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[12px] font-mono uppercase font-bold ${
                            r.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning text-warning'
                          }`}>
                            {r.status === 'approved' ? translations[locale].admin.reviewApproved : translations[locale].admin.reviewPendingBadge}
                          </span>
                          <span className="font-serif font-bold text-sm">
                            {targetPerfume ? `${targetPerfume.brand} - ${targetPerfume.name}` : r.perfume_id}
                          </span>
                        </div>
                        <p className="text-xs text-secondary pt-0.5">
                          {translations[locale].admin.reviewBy} <strong>{r.user_name}</strong> · Rating: <strong>{r.rating}/5</strong> · {translations[locale].admin.reviewLongevity} <strong>{r.longevity_band || '6-8h'}</strong> · Sillage: <strong>{r.sillage || 'moderate'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => onApproveReview(r.id)}
                            className="px-3 py-1.5 bg-success hover:bg-success text-paper text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{translations[locale].admin.approve}</span>
                          </button>
                        )}
                        {r.status === 'approved' && (
                          <button
                            onClick={() => onRejectReview(r.id)}
                            className="px-3 py-1.5 border border-warning text-warning hover:bg-warning/10 text-xs font-medium"
                          >
                            {translations[locale].admin.suspend}
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteReview(r.id)}
                          className="px-2.5 py-1.5 border border-hairline text-error hover:bg-error/10 text-xs font-medium"
                          title={translations[locale].admin.deletePermanentTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-surface/60 border border-hairline space-y-1 text-xs">
                      {r.title && <h5 className="font-serif font-bold text-sm">"{r.title}"</h5>}
                      <p className="text-bar leading-relaxed italic">"{r.review_text}"</p>
                      {((r.pros && r.pros.length > 0) || (r.cons && r.cons.length > 0)) && (
                        <div className="pt-2 flex flex-wrap gap-2 text-[12px] font-mono">
                          {r.pros?.map((pro, i) => (
                            <span key={i} className="text-success bg-success/5 px-2 py-0.5 border border-success">
                              + {pro}
                            </span>
                          ))}
                          {r.cons?.map((con, i) => (
                            <span key={i} className="text-warning bg-warning/10 px-2 py-0.5 border border-warning">
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
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-hairline pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">{translations[locale].admin.waitlistTitle}</h3>
                <p className="text-xs text-secondary">{translations[locale].admin.waitlistSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-accent font-bold">
                  {fmt(translations[locale].admin.registeredCount, waitlists.length)}
                </span>
                {waitlists.length > 0 && (
                  <button
                    onClick={handleExportWaitlistCsv}
                    className="px-3 py-1 bg-surface border border-hairline text-xs font-medium hover:bg-surface flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{translations[locale].admin.exportCsv}</span>
                  </button>
                )}
              </div>
            </div>

            {waitlists.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface/40 border border-dashed border-hairline">
                {translations[locale].admin.waitlistEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thPerfume}</th>
                      <th className="p-3">{translations[locale].admin.thSize}</th>
                      <th className="p-3">{translations[locale].admin.thWillingness}</th>
                      <th className="p-3">{translations[locale].admin.thPriceEstimate}</th>
                      <th className="p-3">{translations[locale].admin.thContact}</th>
                      <th className="p-3">{translations[locale].admin.thStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline font-mono text-[12px]">
                    {waitlists.map((w, idx) => (
                      <tr key={idx} className="hover:bg-surface/40">
                        <td className="p-3 font-sans font-medium">{w.brand} - {w.perfume_name}</td>
                        <td className="p-3 font-bold">{w.size_ml} ml</td>
                        <td className="p-3 capitalize">{w.willingness === 'yes' ? 'Bersedia' : w.willingness}</td>
                        <td className="p-3 text-accent">{formatCurrency(w.fair_price_idr, locale)}</td>
                        <td className="p-3 text-secondary">{w.email} {w.whatsapp_number ? `(${w.whatsapp_number})` : ''}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[12px] bg-success/10 text-success font-bold">
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
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex justify-between items-baseline border-b border-hairline pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold">{translations[locale].admin.ordersTitle}</h3>
                <p className="text-xs text-secondary">{translations[locale].admin.ordersSubtitle}</p>
              </div>
              <span className="text-xs font-mono text-success font-bold">
                {sampleOrders.length} Pesanan Simulasi
              </span>
            </div>

            {sampleOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface/40 border border-dashed border-hairline">
                {translations[locale].admin.ordersEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thOrderNo}</th>
                      <th className="p-3">{translations[locale].admin.thRecipient}</th>
                      <th className="p-3">{translations[locale].admin.thPerfumeSize}</th>
                      <th className="p-3">{translations[locale].admin.thCourier}</th>
                      <th className="p-3">{translations[locale].admin.thTotalCost}</th>
                      <th className="p-3">{translations[locale].admin.thStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline font-mono text-[12px]">
                    {sampleOrders.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-surface/40">
                        <td className="p-3 font-bold text-ink">{ord.order_number}</td>
                        <td className="p-3 font-sans">{ord.recipient_name} ({ord.whatsapp_number})</td>
                        <td className="p-3">{ord.brand} - {ord.perfume_name} ({ord.size_ml} ml)</td>
                        <td className="p-3 uppercase">{ord.shipping_courier}</td>
                        <td className="p-3 text-accent font-bold">{formatCurrency(ord.total_idr, locale)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[12px] bg-success/10 text-success font-bold">
                            {translations[locale].admin.orderConfirmed}
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
        <div className="bg-white p-6 border border-hairline space-y-5">
          <div className="border-b border-hairline pb-4">
            <h3 className="font-serif text-2xl font-bold">{translations[locale].admin.flagsTitle}</h3>
            <p className="text-xs text-secondary">{translations[locale].admin.flagsSubtitle}</p>
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
              <div key={flag.key} className="p-4 border border-hairline flex items-center justify-between gap-4 hover:border-ink transition">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-bar">{flag.title}</span>
                    <code className="text-[12px] font-mono bg-surface px-1.5 py-0.5 border border-hairline">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-[12px] text-secondary">{flag.desc}</p>
                </div>

                <button
                  onClick={() => onToggleFeatureFlag(flag.key)}
                  className={`px-4 py-2 border text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
                    flag.status ? 'bg-bar text-paper border-ink' : 'bg-white text-secondary border-hairline'
                  }`}
                >
                  {flag.status ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-success" />
                      <span>AKTIF (ON)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-secondary" />
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
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-hairline pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono uppercase bg-success/10 text-success border border-success px-2 py-0.5 font-bold">
                    MODEL: GEMINI 2.5 FLASH
                  </span>
                  <span className="text-[12px] text-secondary font-mono">
                    Endpoint: /api/ai/rephrase-match
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold mt-1">{translations[locale].admin.aiTitle}</h3>
                <p className="text-xs text-secondary">
                  {translations[locale].admin.aiSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAILogs}
                  disabled={isLoadingAILogs}
                  className="px-3 py-1.5 bg-surface border border-hairline text-xs font-medium hover:bg-surface flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAILogs ? 'animate-spin' : ''}`} />
                  <span>{translations[locale].admin.aiRefresh}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAITest}
                  disabled={isTestingAI}
                  className="px-4 py-1.5 bg-bar text-paper text-xs font-semibold hover:bg-ink flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                  <span>{isTestingAI ? translations[locale].admin.aiCalling : translations[locale].admin.aiTestCall}</span>
                </button>
              </div>
            </div>

            {/* AI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="p-4 bg-surface/60 border border-hairline space-y-1">
                <span className="text-[12px] font-mono text-secondary uppercase block">Total Panggilan AI</span>
                <p className="font-serif text-3xl font-bold text-bar">{aiLogsData.totalCalls}</p>
                <span className="text-[12px] text-secondary block">Semua sesi pencarian</span>
              </div>

              <div className="p-4 bg-surface/60 border border-hairline space-y-1">
                <span className="text-[12px] font-mono text-secondary uppercase block">Tingkat LLM Verified</span>
                <p className="font-serif text-3xl font-bold text-success">
                  {aiLogsData.totalCalls > 0 ? Math.round((aiLogsData.verifiedCount / aiLogsData.totalCalls) * 100) : 100}%
                </p>
                <span className="text-[12px] text-success block">{aiLogsData.verifiedCount} panggilan lolos kurasi AI</span>
              </div>

              <div className="p-4 bg-surface/60 border border-hairline space-y-1">
                <span className="text-[12px] font-mono text-secondary uppercase block">Rata-Rata Latensi</span>
                <p className="font-serif text-3xl font-bold text-accent">{aiLogsData.avgLatencyMs} ms</p>
                <span className="text-[12px] text-secondary block">Waktu respon server + model</span>
              </div>

              <div className="p-4 bg-surface/60 border border-hairline space-y-1">
                <span className="text-[12px] font-mono text-secondary uppercase block">Fallback Template</span>
                <p className="font-serif text-3xl font-bold text-warning">{aiLogsData.fallbackCount}</p>
                <span className="text-[12px] text-warning block">Jaminan nol-gangguan (C5)</span>
              </div>
            </div>
          </div>

          {/* AI Log Entries Table */}
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-hairline pb-3">
              <div>
                <h4 className="font-serif text-lg font-bold">Riwayat Permintaan Parafrase Rekomendasi</h4>
                <p className="text-xs text-secondary">
                  Transparansi penuh terhadap bukti input dan teks rekomendasi yang dihasilkan oleh model
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-secondary">{translations[locale].admin.aiFilterLabel}</span>
                {(['all', 'verified', 'fallback'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setAiLogFilter(flt)}
                    className={`px-2.5 py-1 text-[12px] font-mono uppercase border transition ${
                      aiLogFilter === flt
                        ? 'bg-bar text-paper border-ink font-bold'
                        : 'bg-white text-secondary border-hairline hover:text-ink'
                    }`}
                  >
                    {flt === 'all' ? translations[locale].admin.aiFilterAll : flt === 'verified' ? 'LLM Verified' : 'Fallback'}
                  </button>
                ))}
              </div>
            </div>

            {aiLogsData.logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface/40 border border-dashed border-hairline">
                {fmt(translations[locale].admin.aiEmpty, translations[locale].admin.aiTestCall)}
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
                      className="p-4 border border-hairline hover:border-ink transition space-y-3 bg-paper/50 text-xs"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-hairline/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[12px] font-mono font-bold uppercase border ${
                            log.source === 'llm_verified'
                              ? 'bg-success/5 text-success border-success'
                              : 'bg-warning/10 text-warning border-warning'
                          }`}>
                            {log.source === 'llm_verified' ? '✨ LLM Verified' : '⚡ Template Fallback'}
                          </span>
                          <code className="text-[12px] font-mono text-secondary">{log.id}</code>
                          <span className="text-[12px] font-mono text-secondary">
                            {new Date(log.timestamp).toLocaleTimeString(translations[locale].app.idId, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[12px]">
                          <span className="text-secondary">Model: <strong>{log.model}</strong></span>
                          <span className="text-accent bg-surface px-1.5 py-0.5 border border-hairline">
                            {log.latency_ms} ms
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-white border border-hairline/70 space-y-1">
                          <span className="text-[12px] font-mono uppercase text-secondary font-semibold block">
                            {translations[locale].admin.aiEvidence}
                          </span>
                          <p className="font-mono text-[12px] text-bar leading-relaxed">
                            {log.evidence_summary || 'Preferensi aroma kuis'}
                          </p>
                        </div>

                        <div className="md:col-span-2 p-3 bg-white border border-hairline/70 space-y-2">
                          <div>
                            <span className="text-[12px] font-mono uppercase text-success font-semibold block">
                              {translations[locale].admin.aiWhyFits}
                            </span>
                            <p className="text-[12px] text-bar italic leading-relaxed mt-0.5">
                              &ldquo;{log.why_fits}&rdquo;
                            </p>
                          </div>
                          
                          {log.possible_mismatch && (
                            <div className="pt-1.5 border-t border-hairline/50">
                              <span className="text-[12px] font-mono uppercase text-warning font-semibold block">
                                {translations[locale].admin.aiMismatch}
                              </span>
                              <p className="text-[12px] text-secondary leading-relaxed mt-0.5">
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
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-paper border border-bar max-w-lg w-full my-8 p-6 space-y-4 shadow-sheet relative text-xs">
            <button 
              onClick={() => setIsAddPerfumeOpen(false)}
              className="absolute top-4 right-4 p-1 text-secondary hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-hairline pb-3">
              <span className="text-[12px] font-mono uppercase text-accent font-bold">
                {translations[locale].admin.crudKicker}
              </span>
              <h4 className="font-serif text-2xl font-bold">
                {editingPerfume ? fmt(translations[locale].admin.formEditTitle, editingPerfume.name) : translations[locale].admin.formAddTitle}
              </h4>
            </div>

            <form onSubmit={handleSavePerfumeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formName}</label>
                  <input 
                    type="text" 
                    required 
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={translations[locale].admin.formNameExample}
                    className="w-full p-2 bg-white border border-hairline focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formBrand}</label>
                  <input 
                    type="text" 
                    required 
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder={translations[locale].admin.formBrandExample}
                    className="w-full p-2 bg-white border border-hairline focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formFamily}</label>
                  <select 
                    value={formFamily}
                    onChange={e => setFormFamily(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    {['Woody', 'Fresh', 'Floral', 'Gourmand', 'Ambery', 'Aromatic'].map(fam => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formConcentration}</label>
                  <select 
                    value={formConcentration}
                    onChange={e => setFormConcentration(e.target.value as any)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    {['EDT', 'EDP', 'Extrait', 'Parfum'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formOrigin}</label>
                  <select 
                    value={formOrigin}
                    onChange={e => setFormOrigin(e.target.value as any)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="ID">{translations[locale].admin.formOriginLocal}</option>
                    <option value="INT">{translations[locale].admin.formOriginIntl}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formPrice}</label>
                  <input 
                    type="number" 
                    value={formPrice}
                    onChange={e => setFormPrice(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-hairline font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].admin.formSize}</label>
                  <input 
                    type="number" 
                    value={formSize}
                    onChange={e => setFormSize(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-hairline font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <label className="font-semibold block">{translations[locale].admin.formNotes}</label>
                <input 
                  type="text" 
                  value={formTopNotes}
                  onChange={e => setFormTopNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesTopExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
                <input 
                  type="text" 
                  value={formHeartNotes}
                  onChange={e => setFormHeartNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesHeartExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
                <input 
                  type="text" 
                  value={formBaseNotes}
                  onChange={e => setFormBaseNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesBaseExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsAddPerfumeOpen(false)}
                  className="px-4 py-2 border border-hairline hover:bg-surface"
                >
                  {translations[locale].review.batal}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-bar hover:bg-ink text-paper font-semibold"
                >
                  {editingPerfume ? translations[locale].admin.formSave : translations[locale].admin.formAdd}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
