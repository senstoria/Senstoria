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
  Users, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Clock,
  ToggleLeft,
  ToggleRight,
  Filter,
  Download,
  Cpu,
  ClipboardList,
  Share2
} from 'lucide-react';
import { type PerfumeDoc, type CatalogSource, validatePerfumeForSave, validatePublish, PublishValidationError } from '../lib/catalog.ts';
import type { CanonicalOccasionTag } from '../data/seedPerfumes.ts';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import { ReviewState, WaitlistState } from '../lib/derivedCalculations.ts';
import { fetchAllWaitlistEntriesForAdmin, fetchAllSalesOrdersForAdmin, updateSalesOrderStatus, updateSalesOrderTracking, fetchAllSharedStoriesForAdmin, revokeSharedStory } from '../lib/firebase.ts';
import { nextAdminStatuses, type SalesOrder, type SalesOrderStatus } from '../lib/salesN12.ts';
import type { SharedStoryDoc } from '../lib/storySharingN13.ts';
import { Locale, formatCurrency, formatScoreOutOfFive, translations, fmt } from '../lib/i18n.ts';

interface AdminDashboardViewProps {
  // P1: katalog admin membaca PerfumeDoc (semua status) dari Firestore
  // /perfumes, bukan SeedPerfume dari file seed. Semua handler katalog
  // mengembalikan Promise: sukses (toast/state) HANYA setelah server
  // mengonfirmasi — pemanggil wajib await dan menangani penolakan.
  perfumes: PerfumeDoc[];
  onAddPerfume: (perfume: PerfumeDoc) => Promise<void>;
  onUpdatePerfume: (perfume: PerfumeDoc) => Promise<void>;
  onDeletePerfume: (perfumeId: string) => Promise<void>;
  onPublishPerfume: (perfumeId: string) => Promise<void>;
  onUnpublishPerfume: (perfumeId: string) => Promise<void>;
  // Dari mana katalog yang ditampilkan berasal (label jujur transisi).
  catalogSource: CatalogSource;
  catalogMigratedCount?: number;
  catalogSeedTotal?: number;
  catalogDeletedCount?: number;
  reviews: ReviewState[];
  onApproveReview: (reviewId: string) => void;
  onRejectReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  adminClicks: { totalCounted: number; clicks: any[] };
  adminClicksLoaded: boolean;
  adminClicksError: boolean;
  onRefreshClicks: () => void;
  featureFlags: Record<string, boolean>;
  adminEmail?: string;
  locale: Locale;
  onCloseAdmin: () => void;
  onSelectPerfume?: (perfumeId: string) => void;
}

export function AdminDashboardView({
  perfumes,
  onAddPerfume,
  onUpdatePerfume,
  onDeletePerfume,
  onPublishPerfume,
  onUnpublishPerfume,
  catalogSource,
  catalogMigratedCount,
  catalogSeedTotal,
  catalogDeletedCount,
  reviews,
  onApproveReview,
  onRejectReview,
  onDeleteReview,
  adminClicks,
  adminClicksLoaded,
  adminClicksError,
  onRefreshClicks,
  featureFlags,
  adminEmail,
  locale,
  onCloseAdmin,
  onSelectPerfume
}: AdminDashboardViewProps) {
  // Navigation tabs in Admin (ADM-01, ADM-08)
  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'reviews' | 'waitlist' | 'flags' | 'orders' | 'shared'>('analytics');

  // Export waitlist to CSV (Firestore entries, Sprint 4; no prices)
  const handleExportWaitlistCsv = () => {
    if (waitlistEntries.length === 0) return;
    const header = ['ID', 'Perfume ID', 'Size (ml)', 'Email', 'WhatsApp', 'Notification', 'Status', 'Timestamp'];
    const rows = waitlistEntries.map(w => [
      w.id,
      w.perfume_id,
      w.size_ml,
      w.email,
      w.whatsapp_number || '',
      w.notification_pref || '',
      w.status,
      w.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `senstoria_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Catalog search & state
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'all' | 'draft' | 'review' | 'published'>('all');
  const [isAddPerfumeOpen, setIsAddPerfumeOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<PerfumeDoc | null>(null);
  // P1: keadaan aksi katalog — error TIDAK PERNAH ditelan; gagal berarti
  // keadaan dipulihkan (tidak ada perubahan state) + pesan + bisa coba lagi.
  const [catalogActionError, setCatalogActionError] = useState<string | null>(null);
  const [publishErrors, setPublishErrors] = useState<{ id: string; reasons: { field: string; message: string }[] } | null>(null);
  const [busyPerfumeId, setBusyPerfumeId] = useState<string | null>(null);

  // P1 — terbitkan / tarik dari publik. Publish yang gagal validasi
  // menampilkan alasan PER FIELD; gagal server menampilkan pesan + bisa coba lagi.
  const handlePublishClick = async (p: PerfumeDoc) => {
    if (busyPerfumeId) return;
    setPublishErrors(null);
    setCatalogActionError(null);
    setBusyPerfumeId(p.id);
    try {
      await onPublishPerfume(p.id);
    } catch (err) {
      if (err instanceof PublishValidationError) {
        setPublishErrors({ id: p.id, reasons: err.reasons });
      } else {
        setCatalogActionError(err instanceof Error ? err.message : 'Gagal menerbitkan parfum. Coba lagi.');
      }
    } finally {
      setBusyPerfumeId(null);
    }
  };

  const handleUnpublishClick = async (p: PerfumeDoc) => {
    if (busyPerfumeId) return;
    setPublishErrors(null);
    setCatalogActionError(null);
    setBusyPerfumeId(p.id);
    try {
      await onUnpublishPerfume(p.id);
    } catch (err) {
      setCatalogActionError(err instanceof Error ? err.message : 'Gagal menarik parfum dari publik. Coba lagi.');
    } finally {
      setBusyPerfumeId(null);
    }
  };

  // Review moderation filter: 'all' | 'pending' | 'approved' | 'flagged'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('pending');
  // Fase N10 (W-20): hapus parfum/ulasan selalu minta konfirmasi dulu.
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'perfume' | 'review'; id: string; label: string } | null>(null);

  // Filtered perfumes (pencarian + filter status P1)
  const filteredPerfumes = perfumes.filter(p => {
    if (catalogStatusFilter !== 'all' && p.data_status !== catalogStatusFilter) return false;
    return p.name.toLowerCase().includes(catalogQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(catalogQuery.toLowerCase()) ||
      (p.primary_family || '').toLowerCase().includes(catalogQuery.toLowerCase());
  });

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

  // Sprint 4: waitlist demand comes from Firestore (admin read), never from
  // localStorage props. Only active/notified count as confirmed demand.
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistState[]>([]);
  const [waitlistLoaded, setWaitlistLoaded] = useState(false);
  const [waitlistError, setWaitlistError] = useState(false);
  useEffect(() => {
    fetchAllWaitlistEntriesForAdmin()
      .then(entries => { setWaitlistEntries(entries); setWaitlistLoaded(true); })
      .catch(() => { setWaitlistError(true); setWaitlistLoaded(true); });
  }, []);

  // Fase N12 (gerbang S3): pesanan full-size untuk Admin — dari Firestore,
  // terbaru dulu. Status dimajukan mengikuti alur Baru → Dibayar →
  // Dikirim → Selesai / Batal (updateSalesOrderStatus menolak transisi
  // yang tidak valid; rules menolaknya juga).
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesOrdersLoaded, setSalesOrdersLoaded] = useState(false);
  const [salesOrdersError, setSalesOrdersError] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [trackingSavedId, setTrackingSavedId] = useState<string | null>(null);
  useEffect(() => {
    fetchAllSalesOrdersForAdmin()
      .then(orders => { setSalesOrders(orders); setSalesOrdersLoaded(true); })
      .catch(() => { setSalesOrdersError(true); setSalesOrdersLoaded(true); });
  }, []);

  // Fase N13 (P11): cerita yang dibagikan untuk Admin — dari Firestore,
  // terbaru dulu. Admin bisa mencabut tautan apa pun (revoked satu arah);
  // laporan dari halaman publik terlihat sebagai angka di kolom Laporan.
  const [sharedStories, setSharedStories] = useState<SharedStoryDoc[]>([]);
  const [sharedLoaded, setSharedLoaded] = useState(false);
  const [sharedError, setSharedError] = useState(false);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  useEffect(() => {
    fetchAllSharedStoriesForAdmin()
      .then(stories => { setSharedStories(stories); setSharedLoaded(true); })
      .catch(() => { setSharedError(true); setSharedLoaded(true); });
  }, []);

  const handleRevokeSharedStory = async (story: SharedStoryDoc) => {
    if (story.revoked || revokingToken) return;
    setRevokingToken(story.token);
    try {
      await revokeSharedStory(story.token);
      setSharedStories(prev => prev.map(s => s.token === story.token
        ? { ...s, revoked: true, revoked_at: new Date().toISOString() }
        : s));
    } catch {
      setSharedError(true);
    } finally {
      setRevokingToken(null);
    }
  };

  const orderStatusLabel = (status: SalesOrderStatus): string => {
    const ot = translations[locale].ordersView;
    return status === 'baru' ? ot.statusBaru
      : status === 'dibayar' ? ot.statusDibayar
      : status === 'dikirim' ? ot.statusDikirim
      : status === 'selesai' ? ot.statusSelesai
      : ot.statusBatal;
  };

  const handleAdvanceOrder = async (order: SalesOrder, next: SalesOrderStatus) => {
    setUpdatingOrderId(order.id);
    const now = new Date().toISOString();
    const extra: Partial<Pick<SalesOrder, 'paid_at' | 'shipped_at' | 'cancelled_at'>> = {};
    if (next === 'dibayar') extra.paid_at = now;
    if (next === 'dikirim') extra.shipped_at = now;
    if (next === 'batal') extra.cancelled_at = now;
    try {
      await updateSalesOrderStatus(order.id, order.status, next, extra);
      setSalesOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next, updated_at: now, ...extra } : o));
    } catch {
      setSalesOrdersError(true);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveTracking = async (order: SalesOrder) => {
    const value = (trackingDrafts[order.id] ?? order.tracking_number ?? '').trim();
    try {
      await updateSalesOrderTracking(order.id, value);
      setSalesOrders(prev => prev.map(o => o.id === order.id ? { ...o, tracking_number: value } : o));
      setTrackingSavedId(order.id);
    } catch {
      setSalesOrdersError(true);
    }
  };
  const totalWaitlistCount = waitlistEntries.length;
  const confirmedWaitlistCount = waitlistEntries.filter(w => w.status === 'active' || w.status === 'notified').length;
  const pendingWaitlistCount = waitlistEntries.filter(w => w.status === 'pending_confirm').length;

  // ── Form parfum (P1) ──────────────────────────────────────────────
  // TIDAK ADA default fabrikasi: field kosong disimpan kosong.
  // - gender: '' → 'unknown' (nilai kosong yang jujur, bukan 'unisex')
  // - longevity: dipertahankan dari baris lama; baris baru 'unknown' —
  //   longevity resmi HANYA dari agregasi review customer (n>=5), bukan
  //   dari form dan bukan klaim brand.
  // - projection: '' → 0 ("belum ada data", tampil 0/4 — bukan klaim 3/4)
  // - deskripsi: teks kosong, bukan template "Karya aromatik …"
  // - shopee_url/tokopedia_url: SELALU '' — offer ditahan (B-5), tidak ada
  //   URL pencarian yang menyamar sebagai offer.
  // - release_year/market_tier/family/dll: kosong bila tidak diketahui.
  // Validasi simpan: nama, brand, konsentrasi wajib; market_tier wajib
  // karena tampil publik tanpa nilai 'unknown' (lihat catalog.ts).
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formFamily, setFormFamily] = useState('');
  const [formSecondaryFamily, setFormSecondaryFamily] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formSeason, setFormSeason] = useState('');
  const [formOccasionTags, setFormOccasionTags] = useState<CanonicalOccasionTag[]>([]);
  const [formConcentration, setFormConcentration] = useState('');
  const [formOrigin, setFormOrigin] = useState<'ID' | 'INT'>('ID');
  const [formMarketTier, setFormMarketTier] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formReleaseYear, setFormReleaseYear] = useState('');
  const [formPerfumer, setFormPerfumer] = useState('');
  const [formTopNotes, setFormTopNotes] = useState('');
  const [formHeartNotes, setFormHeartNotes] = useState('');
  const [formBaseNotes, setFormBaseNotes] = useState('');
  const [formHeatSuitability, setFormHeatSuitability] = useState('');
  const [formProjection, setFormProjection] = useState('');
  const [formDescriptionId, setFormDescriptionId] = useState('');
  const [formDescriptionEn, setFormDescriptionEn] = useState('');
  const [formBrandClaims, setFormBrandClaims] = useState('');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formSourceDate, setFormSourceDate] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPhotoChecklist, setFormPhotoChecklist] = useState({ ratio: false, background: false, rounded: false, cover: false });
  const [formSampleCandidate, setFormSampleCandidate] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSaveError, setFormSaveError] = useState<string | null>(null);
  const [savingPerfume, setSavingPerfume] = useState(false);

  const resetFormState = () => {
    setFormName('');
    setFormBrand('');
    setFormFamily('');
    setFormSecondaryFamily('');
    setFormGender('');
    setFormSeason('');
    setFormOccasionTags([]);
    setFormConcentration('');
    setFormOrigin('ID');
    setFormMarketTier('');
    setFormPrice('');
    setFormSize('');
    setFormReleaseYear('');
    setFormPerfumer('');
    setFormTopNotes('');
    setFormHeartNotes('');
    setFormBaseNotes('');
    setFormHeatSuitability('');
    setFormProjection('');
    setFormDescriptionId('');
    setFormDescriptionEn('');
    setFormBrandClaims('');
    setFormSourceUrl('');
    setFormSourceDate('');
    setFormPhotoUrl('');
    setFormPhotoChecklist({ ratio: false, background: false, rounded: false, cover: false });
    setFormSampleCandidate(false);
    setFormErrors({});
    setFormSaveError(null);
  };

  const handleOpenAdd = () => {
    setEditingPerfume(null);
    resetFormState();
    setIsAddPerfumeOpen(true);
  };

  const handleOpenEdit = (p: PerfumeDoc) => {
    setEditingPerfume(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormFamily(p.primary_family ?? '');
    setFormSecondaryFamily(p.secondary_family ?? '');
    setFormGender(p.gender_label === 'unknown' ? '' : p.gender_label);
    setFormSeason(p.season ?? '');
    setFormOccasionTags(p.occasion_tags ?? []);
    setFormConcentration(p.concentration);
    setFormOrigin(p.origin);
    setFormMarketTier(p.market_tier ?? '');
    setFormPrice(p.reference_price_idr ? String(p.reference_price_idr) : '');
    setFormSize(p.reference_price_size_ml ? String(p.reference_price_size_ml) : '');
    setFormReleaseYear(p.release_year ? String(p.release_year) : '');
    setFormPerfumer(p.perfumer ?? '');
    setFormTopNotes(p.top_notes);
    setFormHeartNotes(p.heart_notes);
    setFormBaseNotes(p.base_notes);
    setFormHeatSuitability(p.heat_suitability ? String(p.heat_suitability) : '');
    setFormProjection(p.projection_expected ? String(p.projection_expected) : '');
    setFormDescriptionId(p.description_id);
    setFormDescriptionEn(p.description_en);
    setFormBrandClaims(p.brand_claims ?? '');
    setFormSourceUrl(p.source_official_url ?? '');
    setFormSourceDate(p.source_checked_date ?? '');
    setFormPhotoUrl(p.photo_url ?? p.image_url ?? '');
    setFormPhotoChecklist({
      ratio: Boolean(p.photo_verified),
      background: Boolean(p.photo_verified),
      rounded: Boolean(p.photo_verified),
      cover: Boolean(p.photo_verified),
    });
    setFormSampleCandidate(p.sample_candidate);
    setFormErrors({});
    setFormSaveError(null);
    setIsAddPerfumeOpen(true);
  };

  const handleSavePerfumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPerfume) return;
    // Foto terverifikasi hanya bila keempat poin checklist dicentang.
    const photoVerified =
      formPhotoUrl.trim() !== '' &&
      formPhotoChecklist.ratio && formPhotoChecklist.background &&
      formPhotoChecklist.rounded && formPhotoChecklist.cover;
    const doc: PerfumeDoc = {
      ...(editingPerfume ?? {}),
      id: editingPerfume ? editingPerfume.id : 'prf_' + Math.random().toString(36).substring(2, 8),
      slug: editingPerfume
        ? editingPerfume.slug
        : `${formBrand}-${formName}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: formName.trim(),
      brand: formBrand.trim(),
      concentration: formConcentration as PerfumeDoc['concentration'],
      ...(formReleaseYear.trim() ? { release_year: Number(formReleaseYear) } : { release_year: undefined }),
      gender_label: (formGender || 'unknown') as PerfumeDoc['gender_label'],
      primary_family: formFamily.trim() || undefined,
      secondary_family: formSecondaryFamily.trim() || undefined,
      origin: formOrigin,
      ...(formMarketTier ? { market_tier: formMarketTier as NonNullable<PerfumeDoc['market_tier']> } : { market_tier: undefined }),
      // Harga kosong = 0 (placeholder "harga belum terverifikasi", sesuai
      // keputusan founder 28 Nov 17:09 untuk 12 baris terbit) — bukan harga.
      reference_price_idr: formPrice.trim() === '' ? 0 : Number(formPrice),
      reference_price_size_ml: formSize.trim() === '' ? 0 : Number(formSize),
      price_is_sample: false,
      top_notes: formTopNotes.trim(),
      heart_notes: formHeartNotes.trim(),
      base_notes: formBaseNotes.trim(),
      ...(formHeatSuitability ? { heat_suitability: Number(formHeatSuitability) } : { heat_suitability: undefined }),
      longevity_expected_band: editingPerfume ? editingPerfume.longevity_expected_band : 'unknown',
      projection_expected: formProjection.trim() === '' ? 0 : Number(formProjection),
      description_id: formDescriptionId.trim(),
      description_en: formDescriptionEn.trim(),
      brand_claims: formBrandClaims.trim() || undefined,
      sample_candidate: formSampleCandidate,
      // B-5 ditahan: tidak ada offer baru di v1 — selalu kosong.
      shopee_url: '',
      tokopedia_url: '',
      data_status: editingPerfume ? editingPerfume.data_status : 'draft',
      source_official_url: formSourceUrl.trim() || undefined,
      source_checked_date: formSourceDate || undefined,
      verified_by: editingPerfume?.verified_by,
      ...(formPhotoUrl.trim()
        ? { photo_url: formPhotoUrl.trim(), photo_verified: photoVerified }
        : { photo_url: undefined, photo_verified: false }),
      ...(formSeason ? { season: formSeason } : { season: undefined }),
      ...(formOccasionTags.length > 0 ? { occasion_tags: formOccasionTags } : { occasion_tags: undefined }),
      ...(formPerfumer.trim() ? { perfumer: formPerfumer.trim() } : { perfumer: undefined }),
    } as PerfumeDoc;

    // Validasi simpan dulu (nama/brand/konsentrasi/tier) — alasan per field.
    const reasons = validatePerfumeForSave(doc);
    if (reasons.length > 0) {
      const errors: Record<string, string> = {};
      for (const r of reasons) errors[r.field] = r.message;
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormSaveError(null);
    setSavingPerfume(true);
    try {
      // Modal HANYA ditutup setelah server mengonfirmasi.
      if (editingPerfume) await onUpdatePerfume(doc);
      else await onAddPerfume(doc);
      setIsAddPerfumeOpen(false);
      setEditingPerfume(null);
    } catch (err) {
      setFormSaveError(err instanceof Error ? err.message : 'Gagal menyimpan parfum. Periksa koneksi lalu coba lagi.');
    } finally {
      setSavingPerfume(false);
    }
  };

  const OCCASION_OPTIONS: { id: CanonicalOccasionTag; label: string }[] = [
    { id: 'office', label: 'Kantor' },
    { id: 'casual', label: 'Santai' },
    { id: 'daily', label: 'Harian' },
    { id: 'date_night', label: 'Kencan' },
    { id: 'formal', label: 'Formal' },
    { id: 'night_out', label: 'Malam' },
    { id: 'sport', label: 'Olahraga' },
  ];

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
            <span className="text-[12px] uppercase font-mono bg-white text-error border border-error px-2 py-0.5 font-bold tracking-wider">
              ADMIN BACKOFFICE · CONSOLE (PHASE 7)
            </span>
            <span className="text-[12px] font-mono text-secondary">
              Role: Super Admin{adminEmail ? ` (${adminEmail})` : ''}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl">
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
          { id: 'waitlist', label: fmt(translations[locale].admin.tabWaitlist, waitlistEntries.length), icon: ShoppingBag },
          { id: 'orders', label: fmt(translations[locale].admin.tabOrders, salesOrders.length), icon: ClipboardList },
          { id: 'shared', label: fmt(translations[locale].admin.tabShared, sharedStories.filter(s => !s.revoked).length), icon: Share2 },
          { id: 'flags', label: translations[locale].admin.tabFlags, icon: Sliders },
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
              <p className="font-display text-3xl font-bold text-bar">{adminClicks.totalCounted}</p>
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
              <p className="font-display text-3xl font-bold text-bar">{totalWaitlistCount}</p>
              <span className="text-[12px] text-warning block">{fmt(translations[locale].admin.waitlistConfirmed, confirmedWaitlistCount)}</span>
            </div>

            <div className="bg-white p-5 border border-hairline space-y-1">
              <span className="text-[12px] font-mono text-secondary uppercase block">{translations[locale].admin.statReviews}</span>
              <p className="font-display text-3xl font-bold text-bar">{reviews.length}</p>
              <span className="text-[12px] text-error block">
                {fmt(translations[locale].admin.statPendingReviews, reviews.filter(r => r.status === 'pending_moderation').length)}
              </span>
            </div>
          </div>

          {/* Scent Finder Funnel Drop-off Metrics */}
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex justify-between items-baseline border-b border-hairline pb-3">
              <div>
                <h2 className="font-display text-xl font-bold">{translations[locale].admin.funnelTitle}</h2>
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
                      className="bg-bar h-full w-full origin-left transition-transform duration-400" 
                      style={{ transform: `scaleX(${step.pct / 100})` }}
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
                <h2 className="font-display text-xl font-bold">{translations[locale].admin.clicksTitle}</h2>
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
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
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
                        <tr key={idx} className="hover:bg-surface">
                          <td className="p-3 text-secondary">{clk.click_id}</td>
                          <td className="p-3 font-sans font-medium text-ink">
                            {p ? `${p.brand} ${p.name}` : clk.perfume_id}
                          </td>
                          <td className="p-3 uppercase font-bold text-bar">{clk.platform}</td>
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
              <h2 className="font-display text-2xl font-bold">{translations[locale].admin.catalogTitle}</h2>
              <p className="text-xs text-secondary">{translations[locale].admin.catalogSubtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-secondary" />
                <input 
                  type="text" 
                  value={catalogQuery}
                  aria-label={translations[locale].admin.catalogSearch}
                  name="catalog-search"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setCatalogQuery(e.target.value)}
                  placeholder={translations[locale].admin.catalogSearch}
                  className="pl-8 pr-3 py-1.5 border border-hairline text-xs focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
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

          {/* P1 — label sumber katalog yang jujur (transisi pra-migrasi).
              'seed-pre-migration' berarti /perfumes masih kosong/belum
              lengkap dan tabel di bawah ini memakai seed — BUKAN data
              Firestore. Lihat docs/admin-catalog-migration-runbook.md. */}
          <div className={`p-3 border text-xs leading-relaxed ${
            catalogSource === 'firestore'
              ? 'bg-white border-hairline text-secondary'
              : 'bg-white border-warning text-ink'
          }`}>
            {catalogSource === 'loading' && (
              <span>Memuat katalog dari Firestore /perfumes…</span>
            )}
            {catalogSource === 'firestore' && (
              <span>
                <strong>Sumber katalog: Firestore /perfumes (live).</strong>
                {' '}Seed tidak lagi dipakai.
                {typeof catalogDeletedCount === 'number' && catalogDeletedCount > 0 && (
                  <> {catalogDeletedCount} parfum diarsip (soft-delete) — tidak tampil di tabel; pulihkan lewat Firestore Console.</>
                )}
              </span>
            )}
            {catalogSource === 'seed-pre-migration' && (
              <span>
                <strong>Sumber katalog: seed pra-migrasi.</strong>
                {' '}Koleksi /perfumes masih kosong atau belum lengkap
                {typeof catalogMigratedCount === 'number' && typeof catalogSeedTotal === 'number' && (
                  <> ({catalogMigratedCount}/{catalogSeedTotal} baris sudah termigrasi)</>
                )}
                {' '}— tabel di bawah ini memakai file seed, BUKAN Firestore. Jalankan migrasi
                (docs/admin-catalog-migration-runbook.md) agar publish/admin menulis ke sumber yang benar.
              </span>
            )}
            {catalogSource === 'error' && (
              <span>
                <strong>Gagal memuat /perfumes.</strong>
                {' '}Tabel di bawah ini memakai seed sebagai cadangan. Periksa koneksi/claim admin lalu muat ulang halaman.
              </span>
            )}
          </div>

          {catalogActionError && (
            <div className="p-3 border border-error bg-white text-error text-xs leading-relaxed" role="alert">
              {catalogActionError}
            </div>
          )}

          {publishErrors && (
            <div className="p-3 border border-warning bg-white text-xs leading-relaxed" role="alert">
              <strong>Parfum belum bisa diterbitkan — lengkapi dulu:</strong>
              <ul className="list-disc pl-5 pt-1 space-y-0.5">
                {publishErrors.reasons.map(r => (
                  <li key={r.field}>{r.message}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPublishErrors(null)}
                className="mt-2 underline"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {([
              { id: 'all', label: `Semua (${perfumes.length})` },
              { id: 'draft', label: `Draft (${perfumes.filter(p => p.data_status === 'draft').length})` },
              { id: 'review', label: `Review (${perfumes.filter(p => p.data_status === 'review').length})` },
              { id: 'published', label: `Published (${perfumes.filter(p => p.data_status === 'published').length})` },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setCatalogStatusFilter(f.id)}
                className={`px-3 py-1.5 border transition ${
                  catalogStatusFilter === f.id ? 'bg-bar text-paper border-ink font-bold' : 'bg-white border-hairline'
                }`}
              >
                {f.label}
              </button>
            ))}
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
                  <th className="p-3">Status</th>
                  <th className="p-3">Foto</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-hairline">
                {filteredPerfumes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-secondary">
                      Tidak ada parfum dengan filter ini.
                    </td>
                  </tr>
                )}
                {filteredPerfumes.map(p => (
                  <tr key={p.id} className="hover:bg-surface">
                    <td className="p-3">
                      <span className="text-[12px] uppercase font-bold text-bar block">{p.brand}</span>
                      <strong className="font-display text-sm">{p.name}</strong>
                    </td>
                    <td className="p-3 text-secondary font-mono">{p.primary_family || '–'}</td>
                    <td className="p-3 font-mono">{p.concentration}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[12px] font-mono uppercase ${p.origin === 'ID' ? 'bg-ink text-paper' : 'bg-surface text-bar'}`}>
                        {p.origin === 'ID' ? 'Lokal ID' : 'Global INT'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{formatCurrency(p.reference_price_idr, locale)}</td>
                    <td className="p-3 font-mono">{formatScoreOutOfFive(p.heat_suitability, '–')}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 text-[12px] font-mono uppercase font-bold ${
                        p.data_status === 'published' ? 'bg-ink text-paper'
                        : p.data_status === 'review' ? 'bg-white text-ink border border-ink'
                        : 'bg-surface text-secondary'
                      }`}>
                        {p.data_status === 'published' ? 'Published' : p.data_status === 'review' ? 'Review' : 'Draft'}
                      </span>
                      {p.data_status === 'published' && p.verified_by && (
                        <span className="block text-[11px] text-secondary pt-0.5">oleh {p.verified_by}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {(p.photo_url || p.image_url) ? (
                        <span className="text-success font-medium">Foto ✓{p.photo_verified ? ' terverifikasi' : ''}</span>
                      ) : (
                        <span className="text-secondary">Foto belum ada</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      {p.data_status !== 'published' && (
                        <button
                          onClick={() => handlePublishClick(p)}
                          disabled={busyPerfumeId === p.id}
                          className="px-2 py-1 bg-bar hover:bg-ink text-paper text-[11px] font-semibold inline-block disabled:opacity-50"
                          title="Terbitkan ke katalog publik (validasi dulu)"
                        >
                          {busyPerfumeId === p.id ? '…' : 'Publish'}
                        </button>
                      )}
                      {p.data_status === 'published' && (
                        <button
                          onClick={() => handleUnpublishClick(p)}
                          disabled={busyPerfumeId === p.id}
                          className="px-2 py-1 border border-warning text-warning hover:bg-white text-[11px] font-medium inline-block disabled:opacity-50"
                          title="Tarik dari katalog publik (kembali ke draft)"
                        >
                          {busyPerfumeId === p.id ? '…' : 'Unpublish'}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 border border-hairline hover:bg-surface text-secondary hover:text-ink inline-block"
                        title={translations[locale].admin.editPerfumeTitle}
                        aria-label={translations[locale].admin.editPerfumeTitle}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDelete({ kind: 'perfume', id: p.id, label: `${p.brand} — ${p.name}` })}
                        className="p-1 border border-hairline hover:bg-white text-error inline-block"
                        title={translations[locale].admin.deletePerfumeTitle}
                        aria-label={translations[locale].admin.deletePerfumeTitle}
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
              <h2 className="font-display text-2xl font-bold">{translations[locale].admin.reviewsTitle}</h2>
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
            <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
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
                            r.status === 'approved' ? 'bg-ink text-paper' : 'bg-white text-ink border border-ink'
                          }`}>
                            {r.status === 'approved' ? translations[locale].admin.reviewApproved : translations[locale].admin.reviewPendingBadge}
                          </span>
                          <span className="font-display font-bold text-sm">
                            {targetPerfume ? `${targetPerfume.brand} - ${targetPerfume.name}` : r.perfume_id}
                          </span>
                        </div>
                        <p className="text-xs text-secondary pt-0.5">
                          {translations[locale].admin.reviewBy} <strong>{r.user_name}</strong> · Rating: <strong>{r.rating}/5</strong> · {translations[locale].admin.reviewLongevity} <strong>{r.longevity_band || '–'}</strong> · Sillage: <strong>{r.sillage || '–'}</strong>
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
                            className="px-3 py-1.5 border border-warning text-warning hover:bg-white text-xs font-medium"
                          >
                            {translations[locale].admin.suspend}
                          </button>
                        )}
                        <button
                          onClick={() => setPendingDelete({
                            kind: 'review',
                            id: r.id,
                            label: targetPerfume
                              ? `${translations[locale].admin.confirmDeleteReviewLabel} ${targetPerfume.brand} — ${targetPerfume.name} (${r.user_name})`
                              : `${translations[locale].admin.confirmDeleteReviewLabel} ${r.perfume_id} (${r.user_name})`,
                          })}
                          className="px-2.5 py-1.5 border border-hairline text-error hover:bg-white text-xs font-medium"
                          title={translations[locale].admin.deletePermanentTitle}
                          aria-label={translations[locale].admin.deletePermanentTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-surface border border-hairline space-y-1 text-xs">
                      {r.title && <h5 className="font-display font-bold text-sm">"{r.title}"</h5>}
                      <p className="text-bar leading-relaxed italic">"{r.review_text}"</p>
                      {((r.pros && r.pros.length > 0) || (r.cons && r.cons.length > 0)) && (
                        <div className="pt-2 flex flex-wrap gap-2 text-[12px] font-mono">
                          {r.pros?.map((pro, i) => (
                            <span key={i} className="text-success bg-white px-2 py-0.5 border border-success">
                              + {pro}
                            </span>
                          ))}
                          {r.cons?.map((con, i) => (
                            <span key={i} className="text-warning bg-white px-2 py-0.5 border border-warning">
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
      {/* TAB 4: WAITLIST DEMAND (Firestore, Sprint 4) */}
      {activeTab === 'waitlist' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-hairline pb-3">
              <div>
                <h2 className="font-display text-xl font-bold">{translations[locale].admin.waitlistTitle}</h2>
                <p className="text-xs text-secondary">{translations[locale].admin.waitlistSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-bar font-bold">
                  {fmt(translations[locale].admin.registeredCount, waitlistEntries.length)}
                </span>
                {waitlistEntries.length > 0 && (
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

            <div className="flex flex-wrap gap-4 text-xs">
              <span className="text-success font-medium">{fmt(translations[locale].admin.waitlistConfirmed, confirmedWaitlistCount)}</span>
              <span className="text-warning font-medium">{fmt(translations[locale].admin.waitlistPending, pendingWaitlistCount)}</span>
            </div>

            {!waitlistLoaded ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.waitlistLoading}
              </div>
            ) : waitlistError ? (
              <div className="p-8 text-center text-xs text-error bg-surface border border-dashed border-hairline">
                {translations[locale].admin.waitlistLoadError}
              </div>
            ) : waitlistEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.waitlistEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thPerfume}</th>
                      <th className="p-3">{translations[locale].admin.thSize}</th>
                      <th className="p-3">{translations[locale].admin.thContact}</th>
                      <th className="p-3">{translations[locale].admin.thStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline font-mono text-[12px]">
                    {waitlistEntries.map((w) => {
                      const perfume = perfumes.find(p => p.id === w.perfume_id);
                      const confirmed = w.status === 'active' || w.status === 'notified';
                      return (
                        <tr key={w.id} className="hover:bg-surface">
                          <td className="p-3 font-sans font-medium">{perfume ? `${perfume.brand} - ${perfume.name}` : w.perfume_id}</td>
                          <td className="p-3 font-bold">{w.size_ml} ml</td>
                          <td className="p-3 text-secondary">{w.email}{w.whatsapp_number ? ` (${w.whatsapp_number})` : ''}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[12px] font-bold ${confirmed ? 'bg-ink text-paper' : w.status === 'pending_confirm' ? 'bg-white text-ink border border-ink' : 'bg-surface text-secondary'}`}>
                              {w.status}
                            </span>
                          </td>
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

      {/* TAB 5: FEATURE FLAGS CONTROLLER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="border-b border-hairline pb-3">
              <h2 className="font-display text-xl font-bold">{translations[locale].admin.ordersTitle}</h2>
              <p className="text-xs text-secondary">{translations[locale].admin.ordersSubtitle}</p>
            </div>

            {!salesOrdersLoaded ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.ordersLoading}
              </div>
            ) : salesOrdersError ? (
              <div className="p-8 text-center text-xs text-error bg-surface border border-dashed border-hairline">
                {translations[locale].admin.ordersLoadError}
              </div>
            ) : salesOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.ordersEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thOrder}</th>
                      <th className="p-3">{translations[locale].admin.thBuyer}</th>
                      <th className="p-3">{translations[locale].admin.thItems}</th>
                      <th className="p-3">{translations[locale].admin.thTotal}</th>
                      <th className="p-3">{translations[locale].admin.thOrderStatus}</th>
                      <th className="p-3">{translations[locale].admin.thDate}</th>
                      <th className="p-3">{translations[locale].admin.trackingPlaceholder}</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline text-[12px]">
                    {salesOrders.map(order => {
                      const next = nextAdminStatuses(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-surface align-top">
                          <td className="p-3 font-mono font-bold">{order.order_number}</td>
                          <td className="p-3 text-secondary">{order.buyer_email}</td>
                          <td className="p-3">
                            {order.items.map(item => (
                              <span key={item.perfume_id} className="block">
                                {item.brand} {item.name} × {item.quantity}
                              </span>
                            ))}
                            <span className="block text-secondary">
                              {order.shipping.courier.toUpperCase()} · {order.shipping.method}
                            </span>
                          </td>
                          <td className="p-3 font-mono">{formatCurrency(order.total_idr, locale)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[12px] font-bold ${order.status === 'batal' ? 'bg-error text-paper' : order.status === 'selesai' ? 'bg-ink text-paper' : 'bg-surface text-ink border border-ink'}`}>
                              {orderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-secondary">{order.created_at.slice(0, 10)}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={trackingDrafts[order.id] ?? order.tracking_number ?? ''}
                              onChange={e => {
                                setTrackingDrafts(d => ({ ...d, [order.id]: e.target.value }));
                                setTrackingSavedId(null);
                              }}
                              onBlur={() => handleSaveTracking(order)}
                              placeholder={translations[locale].admin.trackingPlaceholder}
                              aria-label={`${translations[locale].admin.trackingPlaceholder} ${order.order_number}`}
                              className="w-32 min-h-[44px] border border-border bg-paper px-2 text-[12px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                            />
                            {trackingSavedId === order.id && (
                              <span className="block text-[11px] text-success mt-1">{translations[locale].admin.trackingSaved}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1.5">
                              {next.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => handleAdvanceOrder(order, s)}
                                  className="min-h-[36px] px-3 bg-bar hover:bg-ink disabled:opacity-50 text-paper text-[12px] font-bold transition whitespace-nowrap cursor-pointer"
                                >
                                  {fmt(translations[locale].admin.advanceButton, orderStatusLabel(s))}
                                </button>
                              ))}
                            </div>
                          </td>
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

      {/* TAB: CERITA YANG DIBAGIKAN (Fase N13, P11) */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'shared' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-hairline space-y-4">
            <div className="border-b border-hairline pb-3">
              <h2 className="font-display text-xl font-bold">{translations[locale].admin.sharedTitle}</h2>
              <p className="text-xs text-secondary">{translations[locale].admin.sharedSubtitle}</p>
            </div>

            {!sharedLoaded ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.sharedLoading}
              </div>
            ) : sharedError ? (
              <div className="p-8 text-center text-xs text-error bg-surface border border-dashed border-hairline">
                {translations[locale].admin.sharedLoadError}
              </div>
            ) : sharedStories.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary bg-surface border border-dashed border-hairline">
                {translations[locale].admin.sharedEmpty}
              </div>
            ) : (
              <div className="overflow-x-auto border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-hairline font-mono text-[12px]">
                    <tr>
                      <th className="p-3">{translations[locale].admin.thStory}</th>
                      <th className="p-3">{translations[locale].admin.thAuthor}</th>
                      <th className="p-3">{translations[locale].admin.thSharedStatus}</th>
                      <th className="p-3">{translations[locale].admin.thReports}</th>
                      <th className="p-3">{translations[locale].admin.thSharedDate}</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-hairline text-[12px]">
                    {sharedStories.map(story => (
                      <tr key={story.token} className="hover:bg-surface align-top">
                        <td className="p-3">
                          <span className="block font-bold">{story.title || '—'}</span>
                          <span className="block text-secondary">{story.perfume_brand} · {story.perfume_name}</span>
                          <span className="block text-secondary">
                            {story.body.length > 120 ? `${story.body.slice(0, 120)}…` : story.body}
                          </span>
                        </td>
                        <td className="p-3 text-secondary">{story.display_name ?? '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[12px] font-bold ${story.revoked ? 'bg-error text-paper' : 'bg-ink text-paper'}`}>
                            {story.revoked ? translations[locale].admin.sharedRevoked : translations[locale].admin.sharedActive}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{story.report_count}</td>
                        <td className="p-3 font-mono text-secondary">{story.created_at.slice(0, 10)}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            disabled={story.revoked || revokingToken === story.token}
                            onClick={() => void handleRevokeSharedStory(story)}
                            className="min-h-[44px] px-3 bg-bar hover:bg-ink disabled:opacity-50 text-paper text-[12px] font-bold transition whitespace-nowrap cursor-pointer"
                          >
                            {translations[locale].admin.revokeSharedButton}
                          </button>
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

      {/* TAB 5: FEATURE FLAGS CONTROLLER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'flags' && (
        <div className="bg-white p-6 border border-hairline space-y-5">
          <div className="border-b border-hairline pb-4">
            <h2 className="font-display text-2xl font-bold">{translations[locale].admin.flagsTitle}</h2>
            <p className="text-xs text-secondary">{translations[locale].admin.flagsSubtitle}</p>
            <p className="text-xs text-secondary">{translations[locale].admin.flagsReadOnlyNote}</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'affiliate_buttons',
                title: 'Tombol Pembelian Afiliasi Marketplace (Shopee / Tokopedia)',
                desc: 'Menampilkan tombol beli resmi dengan pelacakan parameter click_id 302.',
                status: featureFlags['affiliate_buttons'] ?? true
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

                <span
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
                </span>
              </div>
            ))}
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
              <span className="text-[12px] font-mono uppercase text-bar font-bold">
                {translations[locale].admin.crudKicker}
              </span>
              <h4 className="font-display text-2xl font-bold">
                {editingPerfume ? fmt(translations[locale].admin.formEditTitle, editingPerfume.name) : translations[locale].admin.formAddTitle}
              </h4>
            </div>

            <form onSubmit={handleSavePerfumeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-name" className="font-semibold block">{translations[locale].admin.formName} *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    id="admin-perfume-name"
                    name="perfume-name"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={translations[locale].admin.formNameExample}
                    className="w-full p-2 bg-white border border-hairline focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                  />
                  {formErrors.name && <p className="text-error text-[11px]">{formErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-brand" className="font-semibold block">{translations[locale].admin.formBrand} *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    id="admin-perfume-brand"
                    name="perfume-brand"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormBrand(e.target.value)}
                    placeholder={translations[locale].admin.formBrandExample}
                    className="w-full p-2 bg-white border border-hairline focus:border-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
                  />
                  {formErrors.brand && <p className="text-error text-[11px]">{formErrors.brand}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-family" className="font-semibold block">{translations[locale].admin.formFamily}</label>
                  <input
                    type="text"
                    value={formFamily}
                    id="admin-perfume-family"
                    name="perfume-family"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormFamily(e.target.value)}
                    placeholder="mis. Woody"
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-family-secondary" className="font-semibold block">Family sekunder</label>
                  <input
                    type="text"
                    value={formSecondaryFamily}
                    id="admin-perfume-family-secondary"
                    name="perfume-family-secondary"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormSecondaryFamily(e.target.value)}
                    placeholder="mis. Fruity — kosong bila belum ada"
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-gender" className="font-semibold block">Gender</label>
                  <select
                    value={formGender}
                    id="admin-perfume-gender"
                    name="perfume-gender"
                    onChange={e => setFormGender(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— belum ada data —</option>
                    <option value="feminine">Feminine</option>
                    <option value="masculine">Masculine</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-season" className="font-semibold block">Musim</label>
                  <select
                    value={formSeason}
                    id="admin-perfume-season"
                    name="perfume-season"
                    onChange={e => setFormSeason(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— belum ada data —</option>
                    <option value="all-season">Sepanjang tahun</option>
                    <option value="spring">Semi</option>
                    <option value="summer">Panas</option>
                    <option value="autumn">Gugur</option>
                    <option value="winter">Dingin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-concentration" className="font-semibold block">{translations[locale].admin.formConcentration} *</label>
                  <select
                    value={formConcentration}
                    id="admin-perfume-concentration"
                    name="perfume-concentration"
                    onChange={e => setFormConcentration(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— pilih —</option>
                    {['EDC', 'EDT', 'EDP', 'Parfum', 'Extrait'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formErrors.concentration && <p className="text-error text-[11px]">{formErrors.concentration}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-origin" className="font-semibold block">{translations[locale].admin.formOrigin}</label>
                  <select
                    value={formOrigin}
                    id="admin-perfume-origin"
                    name="perfume-origin"
                    onChange={e => setFormOrigin(e.target.value as any)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="ID">{translations[locale].admin.formOriginLocal}</option>
                    <option value="INT">{translations[locale].admin.formOriginIntl}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-tier" className="font-semibold block">Market tier *</label>
                  <select
                    value={formMarketTier}
                    id="admin-perfume-tier"
                    name="perfume-tier"
                    onChange={e => setFormMarketTier(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— pilih —</option>
                    {['mass', 'designer', 'niche', 'indie'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {formErrors.market_tier && <p className="text-error text-[11px]">{formErrors.market_tier}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-year" className="font-semibold block">Tahun rilis</label>
                  <input
                    type="number"
                    value={formReleaseYear}
                    id="admin-perfume-year"
                    name="perfume-year"
                    onChange={e => setFormReleaseYear(e.target.value)}
                    placeholder="kosong bila belum tahu"
                    className="w-full p-2 bg-white border border-hairline font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-price" className="font-semibold block">{translations[locale].admin.formPrice}</label>
                  <input
                    type="number"
                    value={formPrice}
                    id="admin-perfume-price"
                    name="perfume-price"
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="kosong = Rp0 (harga belum terverifikasi)"
                    className="w-full p-2 bg-white border border-hairline font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-size" className="font-semibold block">{translations[locale].admin.formSize}</label>
                  <input
                    type="number"
                    value={formSize}
                    id="admin-perfume-size"
                    name="perfume-size"
                    onChange={e => setFormSize(e.target.value)}
                    placeholder="ml — kosong bila belum ada"
                    className="w-full p-2 bg-white border border-hairline font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-perfume-perfumer" className="font-semibold block">Perfumer</label>
                <input
                  type="text"
                  value={formPerfumer}
                  id="admin-perfume-perfumer"
                  name="perfume-perfumer"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setFormPerfumer(e.target.value)}
                  placeholder="kosong bila belum terverifikasi dari sumber resmi"
                  className="w-full p-2 bg-white border border-hairline"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <label className="font-semibold block">{translations[locale].admin.formNotes}</label>
                <input
                  type="text"
                  value={formTopNotes}
                  aria-label={translations[locale].admin.formNotesTopExample}
                  name="notes-top"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setFormTopNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesTopExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
                <input
                  type="text"
                  value={formHeartNotes}
                  aria-label={translations[locale].admin.formNotesHeartExample}
                  name="notes-heart"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setFormHeartNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesHeartExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
                <input
                  type="text"
                  value={formBaseNotes}
                  aria-label={translations[locale].admin.formNotesBaseExample}
                  name="notes-base"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setFormBaseNotes(e.target.value)}
                  placeholder={translations[locale].admin.formNotesBaseExample}
                  className="w-full p-2 bg-white border border-hairline"
                />
                <p className="text-[11px] text-secondary">Notes + family + sumber resmi wajib terisi sebelum Publish.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-heat" className="font-semibold block">Kecocokan iklim panas (1–5)</label>
                  <select
                    value={formHeatSuitability}
                    id="admin-perfume-heat"
                    name="perfume-heat"
                    onChange={e => setFormHeatSuitability(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— belum ada data —</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-projection" className="font-semibold block">Projection / Sillage (1–4)</label>
                  <select
                    value={formProjection}
                    id="admin-perfume-projection"
                    name="perfume-projection"
                    onChange={e => setFormProjection(e.target.value)}
                    className="w-full p-2 bg-white border border-hairline"
                  >
                    <option value="">— belum ada data —</option>
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <span className="font-semibold block">Occasion</span>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map(o => (
                    <label key={o.id} className="flex items-center gap-1.5 border border-hairline px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formOccasionTags.includes(o.id)}
                        onChange={e => setFormOccasionTags(prev =>
                          e.target.checked ? [...prev, o.id] : prev.filter(t => t !== o.id),
                        )}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-desc-id" className="font-semibold block">Deskripsi (ID) — asli, bukan template</label>
                  <textarea
                    value={formDescriptionId}
                    id="admin-perfume-desc-id"
                    name="perfume-desc-id"
                    rows={2}
                    onChange={e => setFormDescriptionId(e.target.value)}
                    placeholder="Tulis deskripsi sendiri, atau kosongkan bila belum ada."
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-desc-en" className="font-semibold block">Deskripsi (EN) — asli, bukan template</label>
                  <textarea
                    value={formDescriptionEn}
                    id="admin-perfume-desc-en"
                    name="perfume-desc-en"
                    rows={2}
                    onChange={e => setFormDescriptionEn(e.target.value)}
                    placeholder="Write the description yourself, or leave empty."
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-claims" className="font-semibold block">Klaim brand (hanya bila terverifikasi)</label>
                  <input
                    type="text"
                    value={formBrandClaims}
                    id="admin-perfume-claims"
                    name="perfume-claims"
                    autoComplete="off"
                    onChange={e => setFormBrandClaims(e.target.value)}
                    placeholder="kosong bila tidak ada klaim terverifikasi"
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <span className="font-semibold block">Sumber resmi &amp; verifikasi</span>
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-source-url" className="font-semibold block">URL sumber resmi * (wajib sebelum Publish)</label>
                  <input
                    type="url"
                    value={formSourceUrl}
                    id="admin-perfume-source-url"
                    name="perfume-source-url"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormSourceUrl(e.target.value)}
                    placeholder="https://situs-resmi-brand.com/produk"
                    className="w-full p-2 bg-white border border-hairline"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="admin-perfume-source-date" className="font-semibold block">Tanggal cek sumber</label>
                    <input
                      type="date"
                      value={formSourceDate}
                      id="admin-perfume-source-date"
                      name="perfume-source-date"
                      onChange={e => setFormSourceDate(e.target.value)}
                      className="w-full p-2 bg-white border border-hairline"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold block">Diverifikasi oleh</span>
                    <p className="p-2 bg-surface border border-hairline text-secondary">
                      {editingPerfume?.verified_by
                        ? `${editingPerfume.verified_by} (diperbarui saat Publish berikutnya)`
                        : 'Belum diverifikasi — dicatat saat Publish.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-hairline">
                <span className="font-semibold block">Foto produk</span>
                {(formPhotoUrl.trim() || editingPerfume?.image_url) ? (
                  <div className="flex gap-3 items-start">
                    <div className="w-20 h-20 shrink-0 bg-white rounded-[22px] overflow-hidden border border-hairline">
                      <img
                        src={formPhotoUrl.trim() || editingPerfume?.image_url || ''}
                        alt={`Foto ${formName || editingPerfume?.name || 'parfum'}`}
                        className="h-full w-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Pratinjau panel 1:1, latar putih, rounded 22px, object-cover — sama seperti katalog publik.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-secondary">Foto belum ada — katalog menampilkan ilustrasi Botol, bukan foto.</p>
                )}
                <div className="space-y-1">
                  <label htmlFor="admin-perfume-photo-url" className="font-semibold block">URL foto (bukan hasil pencarian/marketplace)</label>
                  <input
                    type="url"
                    value={formPhotoUrl}
                    id="admin-perfume-photo-url"
                    name="perfume-photo-url"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setFormPhotoUrl(e.target.value)}
                    placeholder="https://situs-resmi-brand.com/foto-produk.jpg"
                    className="w-full p-2 bg-white border border-hairline"
                  />
                  <p className="text-[11px] text-secondary">Upload file ditunda sampai keputusan Blaze — v1 hanya foto via URL + checklist verifikasi.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold block">Checklist verifikasi foto (semua wajib dicentang agar foto ditandai terverifikasi)</span>
                  {([
                    { key: 'ratio', label: 'Rasio 1:1' },
                    { key: 'background', label: 'Latar putih penuh' },
                    { key: 'rounded', label: 'Sudut rounded 22px' },
                    { key: 'cover', label: 'Foto mengisi panel (object-cover)' },
                  ] as const).map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formPhotoChecklist[item.key]}
                        onChange={e => setFormPhotoChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-hairline">
                <input
                  type="checkbox"
                  checked={formSampleCandidate}
                  onChange={e => setFormSampleCandidate(e.target.checked)}
                />
                Kandidat sample (Try It First)
              </label>

              {formSaveError && (
                <div className="p-3 border border-error bg-white text-error text-xs leading-relaxed" role="alert">
                  {formSaveError}
                </div>
              )}

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
                  disabled={savingPerfume}
                  className="px-6 py-2 bg-bar hover:bg-ink text-paper font-semibold disabled:opacity-50"
                >
                  {savingPerfume ? 'Menyimpan…' : editingPerfume ? translations[locale].admin.formSave : translations[locale].admin.formAdd}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fase N10 (W-20): hapus parfum/ulasan minta konfirmasi dulu.
          Tombol hapus di tabel hanya membuka dialog ini; penghapusan
          terjadi di onConfirm, tidak di klik pertama. */}
      <BottomSheetOrModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        locale={locale}
        title={pendingDelete ? fmt(translations[locale].admin.confirmDeleteTitle, pendingDelete.label) : ''}
        subtitle={pendingDelete
          ? pendingDelete.kind === 'perfume'
            ? fmt(translations[locale].admin.confirmDeleteBodyPerfume, pendingDelete.label)
            : translations[locale].admin.confirmDeleteBodyReview
          : ''}
        maxWidth="max-w-md"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="min-h-[44px] flex-1 border border-bar py-2 text-sm font-medium"
          >
            {translations[locale].admin.confirmDeleteCancel}
          </button>
          <button
            type="button"
            data-testid="admin-confirm-delete"
            onClick={async () => {
              if (!pendingDelete) return;
              if (pendingDelete.kind === 'perfume') {
                // P1: hapus = soft-delete ke server; modal hanya ditutup
                // setelah server mengonfirmasi. Gagal = keadaan dipulihkan
                // (baris tetap ada) + pesan di tab katalog + bisa coba lagi.
                const id = pendingDelete.id;
                setPendingDelete(null);
                try {
                  await onDeletePerfume(id);
                } catch (err) {
                  setCatalogActionError(err instanceof Error ? err.message : 'Gagal menghapus parfum. Coba lagi.');
                }
                return;
              }
              onDeleteReview(pendingDelete.id);
              setPendingDelete(null);
            }}
            className="min-h-[44px] flex-1 bg-error py-2 text-sm font-medium text-paper"
          >
            {translations[locale].admin.confirmDeleteButton}
          </button>
        </div>
      </BottomSheetOrModal>

    </div>
  );
}
