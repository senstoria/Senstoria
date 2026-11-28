import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Droplet, 
  Heart, 
  Flame, 
  Plus, 
  Calendar, 
  Clock, 
  Sun, 
  CloudRain, 
  Smile, 
  Briefcase, 
  Tag, 
  Trash2, 
  Edit3, 
  ThumbsUp, 
  Star, 
  Lock,
  Search, 
  Check, 
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Share2,
  Link2,
  XCircle
} from 'lucide-react';
import { 
  BottleState, 
  WearLogState, 
  StoryState, 
  ReviewState, 
  computeDiaryStats,
  computeSharedBottleStats
} from '../lib/derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency, translations, fmt, optionLabel } from '../lib/i18n.ts';
import { isShareableStory, sharedStoryUrl, type SharedStoryDoc } from '../lib/storySharingN13.ts';
import type { ProfileVisibility } from '../lib/profileN6.ts';
import { EmptyState } from './EmptyState.tsx';
import { BottomSheetOrModal } from './BottomSheetOrModal.tsx';
import type { StatePreview } from '../lib/statePreview.ts';
import { useDelayedFlag } from '../lib/statePreview.ts';
import { ViewEmptyResults, ViewError, ViewSkeleton } from './StateViews.tsx';

interface ScentDiaryViewProps {
  bottles: BottleState[];
  perfumes: SeedPerfume[];
  wearLogs: WearLogState[];
  stories: StoryState[];
  reviews: ReviewState[];
  onLogWearDetail: (data: {
    bottleId: string;
    spraysCount: number;
    mood: string;
    occasion: string;
    weather: string;
    compliments: number;
    note: string;
  }) => void;
  onDeleteWearLog: (id: string) => void;
  onSaveStory: (story: StoryState) => void;
  onDeleteStory: (id: string) => void;
  onOpenReviewModal: (perfumeId?: string) => void;
  onSelectPerfume: (perfumeId: string) => void;
  onNavigateToLibrary: () => void;
  currentUserId?: string;
  currentUserName?: string;
  locale: Locale;
  // Fase N13 (P11): berbagi cerita opt-in. `sharedByStoryId` memetakan
  // id cerita → dokumen shared_stories AKTIF (revoked disaring di App).
  // Hanya cerita tertulis milik sendiri yang bisa dibagikan; wear log
  // tidak pernah mendapat tombol bagikan (tab terpisah, tanpa tombol).
  sharedByStoryId?: Record<string, SharedStoryDoc>;
  profileVisibility?: ProfileVisibility;
  onShareStory?: (story: StoryState) => Promise<boolean>;
  onRevokeShare?: (token: string) => void;
  onCopyShareLink?: (token: string) => void;
  // Tahap 2 (§4): keadaan layar lewat `?state=…` + jalan keluarnya.
  // loading → skeleton Jurnal; error → panel ViewError; empty → data
  // dianggap kosong (EmptyState alami tiap tab); empty-filter → panel
  // hasil kosong; destructive → konfirmasi hapus cerita pertama
  // (hapus cerita tidak bisa diurungkan, jadi konfirmasi menyebut nama
  // parfumnya); offline tidak berlaku di sini.
  previewState?: StatePreview | null;
  onClearPreview?: () => void;
}

interface DateGroup<T> {
  /** ISO date key (YYYY-MM-DD, UTC — same basis as the grouping). */
  key: string;
  dateLabel: string;
  items: T[];
}

function groupTimelineByDate<T extends { worn_at?: string; story_date?: string; created_at?: string }>(
  items: T[],
  locale: Locale,
  dateField: 'worn_at' | 'story_date'
): DateGroup<T>[] {
  const groups: { [key: string]: T[] } = {};
  items.forEach(item => {
    const raw = item[dateField] || item.created_at;
    const d = raw ? new Date(raw) : null;
    const key = d && Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const d = new Date(key + 'T12:00:00Z');
      const dateLabel = key ? d.toLocaleDateString(translations[locale].app.idId, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : (locale === 'id' ? 'Tanggal tidak tercatat' : 'Date unavailable');
      return {
        key,
        dateLabel,
        items: groups[key]
      };
    });
}

export function ScentDiaryView({
  bottles,
  perfumes,
  wearLogs: wearLogsProp,
  stories: storiesProp,
  reviews: reviewsProp,
  onLogWearDetail,
  onDeleteWearLog,
  onSaveStory,
  onDeleteStory,
  onOpenReviewModal,
  onSelectPerfume,
  onNavigateToLibrary,
  currentUserId,
  currentUserName,
  locale,
  previewState = null,
  onClearPreview,
  sharedByStoryId = {},
  profileVisibility = 'private',
  onShareStory,
  onRevokeShare,
  onCopyShareLink,
}: ScentDiaryViewProps) {
  const t = translations[locale];
  // Tahap 2 (§4): `?state=empty` — jurnal kosong: data diperlakukan
  // sebagai kosong, sehingga EmptyState alami tiap tab yang tampil.
  const wearLogs = previewState === 'empty' ? [] : wearLogsProp;
  const stories = previewState === 'empty' ? [] : storiesProp;
  const reviews = previewState === 'empty' ? [] : reviewsProp;
  // Tahap 2 (§4): skeleton baru muncul bila loading melebihi ~300ms.
  const showLoadingSkeleton = useDelayedFlag(previewState === 'loading');
  // Tahap 2 (§4): hapus cerita TIDAK bisa diurungkan — sebelum menghapus,
  // pengguna harus mengonfirmasi dengan nama parfumnya. Sebelum Tahap 2,
  // tombol hapus langsung menghapus tanpa konfirmasi apa pun.
  const [pendingDeleteStory, setPendingDeleteStory] = useState<StoryState | null>(null);
  // Fase N13 (P11): sheet konfirmasi berbagi + sheet konfirmasi berhenti
  // bagikan. `sharingStoryId` menandai tombol Bagikan yang sedang
  // menulis dokumen (anti double-tap — satu cerita satu tautan).
  const [shareSheetStory, setShareSheetStory] = useState<StoryState | null>(null);
  const [revokeConfirmStory, setRevokeConfirmStory] = useState<StoryState | null>(null);
  const [sharingStoryId, setSharingStoryId] = useState<string | null>(null);
  // `?state=destructive`: buka konfirmasi hapus cerita pertama. Efek ini
  // juga berjalan saat data cerita datang belakangan (mis. mode demo
  // diaktifkan setelah Jurnal dimuat): `stories` ada di deps, dan ref
  // menjaga dialog hanya dibuka sekali — tidak terbuka lagi setelah
  // Batal/Hapus.
  const pendingDeleteStoryOpenedRef = useRef(false);
  useEffect(() => {
    if (previewState !== 'destructive' || pendingDeleteStoryOpenedRef.current) return;
    if (stories.length === 0) return;
    pendingDeleteStoryOpenedRef.current = true;
    setPendingDeleteStory(stories[0]);
  }, [previewState, stories]);
  const [activeTab, setActiveTab] = useState<'wear_logs' | 'stories' | 'reviews'>('wear_logs');
  const [filterPerfumeId, setFilterPerfumeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active bottles available for wearing
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed') && b.remaining_ml > 0);

  // Dropdown options only: published rows, plus any perfume the user
  // actually has data for (a bottle, wear log, story, or review), so
  // existing entries never lose their label. Draft rows with no user
  // data stay out of both dropdowns below. Entry rendering lookups
  // (perfumes.find(...)) intentionally keep using the full prop.
  const dropdownPerfumes = React.useMemo(() => {
    return perfumes.filter(p =>
      p.data_status === 'published' ||
      bottles.some(b => b.perfume_id === p.id) ||
      wearLogs.some(w => w.perfume_id === p.id) ||
      stories.some(s => s.perfume_id === p.id) ||
      reviews.some(r => r.perfume_id === p.id)
    );
  }, [perfumes, bottles, wearLogs, stories, reviews]);

  // Quick Logger State
  const [selectedBottleId, setSelectedBottleId] = useState<string>(activeBottles[0]?.id || '');
  const [spraysCount, setSpraysCount] = useState<number>(3);
  const [selectedMood, setSelectedMood] = useState<string>(translations[locale].diaryOptions.moods[0].value);
  const [selectedOccasion, setSelectedOccasion] = useState<string>(translations[locale].diaryOptions.occasions[0].value);
  const [selectedWeather, setSelectedWeather] = useState<string>(translations[locale].diaryOptions.weathers[0].value);
  const [complimentReceived, setComplimentReceived] = useState<boolean>(false);
  const [wearNote, setWearNote] = useState<string>('');
  const [quickLogSuccess, setQuickLogSuccess] = useState<boolean>(false);

  // Scent Story Editor State & Draft Autosave (Phase 4 requirement)
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState<boolean>(false);
  const [storyPerfumeId, setStoryPerfumeId] = useState<string>(activeBottles[0]?.perfume_id || dropdownPerfumes[0]?.id || 'prf_001');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyBody, setStoryBody] = useState<string>('');
  const [storyMood, setStoryMood] = useState<string>(translations[locale].diaryOptions.moods[0].value);
  const [storyOccasion, setStoryOccasion] = useState<string>(translations[locale].diaryOptions.occasions[0].value);
  const [storyWeather, setStoryWeather] = useState<string>(translations[locale].diaryOptions.weathers[2].value); // Hujan Sejuk
  const [storyTagsInput, setStoryTagsInput] = useState<string>('');
  const [draftState, setDraftState] = useState<'saving' | 'saved'>('saved');
  const [draftSavedNotice, setDraftSavedNotice] = useState<string | null>(null);
  const autosaveTimerRef = React.useRef<any>(null);

  // Restore autosaved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('senstoria_story_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.body || parsed.title) {
          setStoryTitle(parsed.title || '');
          setStoryBody(parsed.body || '');
          if (parsed.perfume_id) setStoryPerfumeId(parsed.perfume_id);
          if (parsed.mood) setStoryMood(parsed.mood);
          if (parsed.occasion) setStoryOccasion(parsed.occasion);
          if (parsed.tags) setStoryTagsInput(parsed.tags.join(', '));
          setDraftState('saved');
        }
      }
    } catch {
      // Ignore draft read errors
    }
  }, [locale]);

  // Autosave story draft on change with calm state (Saving… / Saved)
  const handleStoryBodyChange = (val: string) => {
    setStoryBody(val);
    setDraftState('saving');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      try {
        const draftObj = {
          title: storyTitle,
          body: val,
          perfume_id: storyPerfumeId,
          mood: storyMood,
          occasion: storyOccasion,
          tags: storyTagsInput.split(',').map(s => s.trim()).filter(Boolean),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('senstoria_story_draft', JSON.stringify(draftObj));
        setDraftState('saved');
      } catch {
        // Ignore draft save error
      }
    }, 400);
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottleId) return;

    onLogWearDetail({
      bottleId: selectedBottleId,
      spraysCount,
      mood: selectedMood,
      occasion: selectedOccasion,
      weather: selectedWeather,
      compliments: complimentReceived ? 1 : 0,
      note: wearNote.trim()
    });

    setWearNote('');
    setComplimentReceived(false);
    setQuickLogSuccess(true);
    setTimeout(() => setQuickLogSuccess(false), 2500);
  };

  const handlePublishStory = (status: 'published' | 'draft') => {
    if (!storyBody.trim()) return;

    const tags = storyTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const newStory: StoryState = {
      id: 'story_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: currentUserId || 'usr_senstoria',
      user_name: currentUserName || 'senstoria',
      perfume_id: storyPerfumeId,
      title: storyTitle.trim() || (translations[locale].diaryView.catatanAroma),
      body: storyBody.trim(),
      mood: storyMood,
      occasion: storyOccasion,
      weather: storyWeather,
      tags: tags.length > 0 ? tags : undefined,
      story_date: new Date().toISOString().split('T')[0],
      status,
      created_at: new Date().toISOString()
    };

    onSaveStory(newStory);
    localStorage.removeItem('senstoria_story_draft');
    setDraftSavedNotice(null);
    setStoryTitle('');
    setStoryBody('');
    setStoryTagsInput('');
    setIsStoryEditorOpen(false);
  };

  // Pre-fill story editor from a wear log
  const handleStartStoryFromWear = (wear: WearLogState) => {
    setStoryPerfumeId(wear.perfume_id);
    if (wear.mood) setStoryMood(wear.mood);
    if (wear.occasion) setStoryOccasion(wear.occasion);
    if (wear.weather) setStoryWeather(wear.weather);
    if (wear.note) {
      setStoryBody(wear.note + '\n\n');
    }
    const perfume = perfumes.find(p => p.id === wear.perfume_id);
    if (perfume) {
      setStoryTitle(`${perfume.name} — ${wear.mood || translations[locale].diaryView.defaultStoryTitle}`);
    }
    setActiveTab('stories');
    setIsStoryEditorOpen(true);
  };

  // Shared Derived Stats from Bottle Records strictly
  const sharedBottleStats = React.useMemo(() => computeSharedBottleStats(bottles, perfumes, wearLogs), [bottles, perfumes, wearLogs]);
  const diaryStats = computeDiaryStats(wearLogs, stories);

  // Filtered wear logs
  const filteredWearLogs = wearLogs.filter(w => {
    if (w.deleted_at) return false;
    if (filterPerfumeId !== 'all' && w.perfume_id !== filterPerfumeId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const perf = perfumes.find(p => p.id === w.perfume_id);
      const nameMatch = perf?.name.toLowerCase().includes(q) || perf?.brand.toLowerCase().includes(q);
      const noteMatch = w.note?.toLowerCase().includes(q);
      const moodMatch = w.mood?.toLowerCase().includes(q);
      return nameMatch || noteMatch || moodMatch;
    }
    return true;
  });

  const latestWear = filteredWearLogs.reduce<WearLogState | undefined>((latest, wear) => {
    const time = Date.parse(wear.worn_at);
    if (!Number.isFinite(time)) return latest;
    return !latest || time > Date.parse(latest.worn_at) ? wear : latest;
  }, undefined);
  const featuredPerfume = perfumes.find(perfume => perfume.id === latestWear?.perfume_id);

  // Filtered stories
  const filteredStories = stories.filter(s => {
    if (s.deleted_at) return false;
    if (filterPerfumeId !== 'all' && s.perfume_id !== filterPerfumeId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const perf = perfumes.find(p => p.id === s.perfume_id);
      const nameMatch = perf?.name.toLowerCase().includes(q) || perf?.brand.toLowerCase().includes(q);
      const titleMatch = s.title?.toLowerCase().includes(q);
      const bodyMatch = s.body.toLowerCase().includes(q);
      return nameMatch || titleMatch || bodyMatch;
    }
    return true;
  });

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (filterPerfumeId !== 'all' && r.perfume_id !== filterPerfumeId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const perf = perfumes.find(p => p.id === r.perfume_id);
      const nameMatch = perf?.name.toLowerCase().includes(q) || perf?.brand.toLowerCase().includes(q);
      const textMatch = r.review_text.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
      return nameMatch || textMatch;
    }
    return true;
  });

  const displayedMostWornPerfume = filterPerfumeId !== 'all' 
    ? perfumes.find(p => p.id === filterPerfumeId) 
    : perfumes.find(p => p.id === sharedBottleStats.mostWorn.perfumeId);

  const displayedMostWornCount = filterPerfumeId !== 'all'
    ? (sharedBottleStats.perPerfumeTimesWorn[filterPerfumeId] ?? 0)
    : sharedBottleStats.mostWorn.count;

  // Tahap 2 (§4): keadaan lewat `?state=…`. Diletakkan setelah semua
  // hook di atas, sebelum return, supaya urutan hook tidak berubah.
  if (previewState === 'loading' && showLoadingSkeleton) {
    return <ViewSkeleton locale={locale} layout="diary" />;
  }
  if (previewState === 'error') {
    return <ViewError locale={locale} onRetry={onClearPreview ?? (() => {})} />;
  }
  if (previewState === 'empty-filter') {
    return <ViewEmptyResults locale={locale} onClear={onClearPreview ?? (() => {})} />;
  }

  // Fase N10 (B1): satu grup tanggal = tanggal besar + entri-entri.
  // Dipakai bersama oleh seksi "Hari Ini" (hari ini, tanggal besar) dan
  // "Arsip" (grup-grup lama) supaya keduanya dirender identik.
  const renderWearGroup = (group: DateGroup<WearLogState>, bigDate: boolean) => (
    <div key={group.key} className="space-y-2">
      <h4 className={bigDate
                          ? 'font-display text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] font-extrabold tracking-[-0.02em] text-ink border-b border-hairline pb-2 pt-4 first:pt-0'
                          : 'font-display text-[20px] md:text-[24px] font-normal text-ink border-b border-hairline pb-2 pt-4 first:pt-0'}>
        {group.dateLabel}
      </h4>
      <div className="relative ml-2 space-y-3 rounded-l-[2rem] border-l-2 border-warm/40 py-3 pl-4">
        {group.items.map(wear => {
          const perfume = perfumes.find(p => p.id === wear.perfume_id);
          const timeStr = wear.worn_at?.length > 10 && Number.isFinite(Date.parse(wear.worn_at))
            ? new Date(wear.worn_at).toLocaleTimeString(translations[locale].app.idId, {
            hour: '2-digit',
            minute: '2-digit'
          }) : null;

          return (
            <div
              key={wear.id}
              className="relative rounded-2xl border border-hairline bg-card before:absolute before:-left-[23px] before:top-5 before:size-3 before:rounded-full before:border-2 before:border-white before:bg-warm p-3 md:px-4 md:py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 hover:bg-surface transition text-xs"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {timeStr && (
                  <time dateTime={wear.worn_at} className="font-mono text-xs text-secondary shrink-0 tabular-nums">{timeStr}</time>
                )}
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="label-caption shrink-0">
                    {perfume?.brand || 'Brand'}
                  </span>
                  <button
                    type="button"
                    onClick={() => perfume && onSelectPerfume(perfume.id)}
                    className="text-[14px] font-medium text-ink hover:underline truncate cursor-pointer text-left min-h-11 min-w-11 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {perfume?.name || 'Fragrance'}
                  </button>
                </div>
                <span className="hidden sm:inline font-mono text-[12px] text-secondary shrink-0">
                  {wear.sprays != null && `${wear.sprays}×`}
                  {wear.ml_used != null && ` (−${wear.ml_used} ml)`}
                </span>
                {wear.mood && (
                  <span className="hidden md:inline text-[12px] px-2 py-0.5 bg-surface border border-hairline text-bar shrink-0">
                    {optionLabel(translations[locale].diaryOptions.moods, wear.mood)}
                  </span>
                )}
                {wear.compliments ? (
                  <span className="hidden lg:flex items-center gap-1 text-[12px] text-ink font-mono font-medium shrink-0">
                    <Heart className="w-3 h-3 text-bar" />
                    +{wear.compliments}
                  </span>
                ) : null}
                {wear.note && (
                  <span className="hidden xl:inline text-[12px] text-secondary italic truncate max-w-xs">
                    “{wear.note}”
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartStoryFromWear(wear)}
                  className="text-[12px] font-medium text-ink hover:underline px-2 py-1 min-h-[44px] cursor-pointer"
                >
                  + {translations[locale].diaryView.jadikanCerita}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteWearLog(wear.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary hover:text-error transition cursor-pointer"
                  title={translations[locale].diaryView.deleteLogTitle}
                  aria-label={translations[locale].diaryView.deleteLogTitle}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 md:space-y-12 pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-8">
        <div className="space-y-1">
          <span className="label-caption block">
            {translations[locale].diaryView.bukuHarianAromaMemori}
          </span>
          <h2 className="font-display text-[36px] md:text-[44px] leading-[44px] md:leading-[52px] text-ink">
            {translations[locale].diaryView.bukuHarianSemprotCeritaAroma}
          </h2>
          <p className="text-[16px] leading-[24px] text-secondary max-w-2xl">
            {translations[locale].diaryView.catatSemprotan1TapOtomatisMengurangi}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('stories');
              setIsStoryEditorOpen(true);
            }}
            className="min-h-[48px] px-5 py-2.5 bg-paper border border-border hover:border-bar text-[14px] font-medium text-ink flex items-center gap-2 transition"
          >
            <Edit3 className="w-4 h-4 text-bar" />
            <span>{translations[locale].diaryView.tulisCerita}</span>
          </button>

          <button
            onClick={() => onOpenReviewModal()}
            className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition rounded-full"
          >
            <Star className="w-4 h-4 text-paper" />
            <span>{translations[locale].diaryView.tulisUlasanBaru}</span>
          </button>
        </div>
      </div>

      {/* ── STATS GLANCE (Nike Fase 2: baris angka Archivo tebal di
          atas putih — bukan lagi kartu, dan kartu biru pertama
          dihapus. Angka dan label tidak berubah.) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
        
        {/* Total Wears */}
        <div className="h-full flex flex-col justify-between space-y-1">
          <p key={sharedBottleStats.totalWearsCount} className="display-md text-ink animate-num-change">
            {sharedBottleStats.totalWearsCount}
          </p>
          <div>
            <span className="label-caption block">
              {translations[locale].home.wearsLabel}
            </span>
            <span className="text-[12px] text-secondary font-mono tabular-nums">
              {activeBottles.length} {translations[locale].diaryView.botolAktifDiLemari}
            </span>
          </div>
        </div>

        {/* Compliments */}
        <div className="h-full flex flex-col justify-between space-y-1">
          <p key={diaryStats.totalCompliments} className="display-md text-ink animate-num-change">
            {diaryStats.totalCompliments}
          </p>
          <div>
            <span className="label-caption block">
              {translations[locale].diaryView.pujianDiterima}
            </span>
            <span className="text-[12px] text-secondary font-mono tabular-nums">
              {translations[locale].diaryView.pencatatanSpontan}
            </span>
          </div>
        </div>

        {/* Most Worn Perfume */}
        <div className="h-full flex flex-col justify-between space-y-1">
          <p key={displayedMostWornCount} className="display-md text-ink animate-num-change">
            {displayedMostWornCount}
          </p>
          <div>
            <span className="label-caption block">
              {translations[locale].diaryView.rotasiTeratas}
            </span>
            <span className="text-[12px] text-secondary font-mono truncate block">
              {displayedMostWornPerfume ? `${displayedMostWornPerfume.brand} — ${displayedMostWornPerfume.name}` : translations[locale].diaryView.noDataYet}
            </span>
          </div>
        </div>

        {/* Stories Penned */}
        <div className="h-full flex flex-col justify-between space-y-1">
          <p key={diaryStats.totalStories} className="display-md text-ink animate-num-change">
            {diaryStats.totalStories}
          </p>
          <div>
            <span className="label-caption block">
              {translations[locale].diaryView.ceritaTersimpan}
            </span>
            <span className="text-[12px] text-secondary font-mono">
              {diaryStats.dominantMood ? `Mood: ${diaryStats.dominantMood}` : 'Arsip memori olfaktif'}
            </span>
          </div>
        </div>

      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-hairline text-[12px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('wear_logs')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus ${
            activeTab === 'wear_logs'
              ? 'border-bar text-ink'
              : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          <Droplet className="w-4 h-4 text-bar" />
          <span>{translations[locale].diaryView.n1LogPemakaianHarian}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({wearLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus ${
            activeTab === 'stories'
              ? 'border-bar text-ink'
              : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4 text-bar" />
          <span>{translations[locale].diaryView.n2CeritaAromaMemori}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus ${
            activeTab === 'reviews'
              ? 'border-bar text-ink'
              : 'border-transparent text-secondary hover:text-ink'
          }`}
        >
          <Star className="w-4 h-4 text-bar" />
          <span>{translations[locale].diaryView.n3UlasanMultiKriteria}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({reviews.length})</span>
          <span className="text-[12px] font-mono font-medium bg-surface border border-hairline px-1.5 py-0.5 text-ink flex items-center gap-1">
            <Lock className="w-3 h-3" aria-hidden="true" />
            {translations[locale].diaryView.privateBadge}
          </span>
        </button>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 md:p-4 border border-hairline text-[12px]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-secondary">
            <Search className="w-4 h-4 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              aria-label={translations[locale].diaryView.cariDiBukuHarianCerita}
              name="diary-search"
              autoComplete="off"
              spellCheck={false}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={translations[locale].diaryView.cariDiBukuHarianCerita}
              className="bg-transparent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus text-[12px] text-ink w-48 sm:w-64"
            />
          </div>

          <span className="text-ondark hidden sm:inline">|</span>

          {/* Perfume Filter dropdown */}
          <select
            value={filterPerfumeId}
            aria-label={translations[locale].diary.filterByPerfume}
            id="diary-filter-perfume"
            name="filter-perfume"
            onChange={e => setFilterPerfumeId(e.target.value)}
            className="bg-transparent border border-border p-1.5 text-[12px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
          >
            <option value="all">{translations[locale].diaryView.semuaParfum}</option>
            {dropdownPerfumes.map(p => (
              <option key={p.id} value={p.id}>
                {p.brand} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[12px] text-secondary font-mono tabular-nums">
          {activeTab === 'wear_logs' && fmt(translations[locale].diaryView.wearLogCount, filteredWearLogs.length)}
          {activeTab === 'stories' && fmt(translations[locale].diaryView.storyCount, filteredStories.length)}
          {activeTab === 'reviews' && fmt(translations[locale].diaryView.reviewCount, filteredReviews.length)}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: WEAR LOGS & QUICK LOGGER                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'wear_logs' && (
        <div className="space-y-6">
          
          {/* 1-Tap Quick Logger Card */}
          <div id="quick-logger-card" className="bg-card border border-bar p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="space-y-0.5">
                <span className="label-caption block">
                  {translations[locale].diaryView.aksiCepatPemakaian}
                </span>
                <h3 className="font-sans text-[20px] font-medium text-ink">
                  {translations[locale].diaryView.catatSemprotanHariIni}
                </h3>
              </div>
              <span className="text-[12px] font-mono tabular-nums text-secondary">
                {translations[locale].diaryView.quickLogHint}
              </span>
            </div>

            {activeBottles.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-card border border-hairline">
                <p className="text-[14px] text-secondary">
                  {translations[locale].diaryView.belumAdaBotolAktifDiLemariKoleksimu}
                </p>
                <button
                  onClick={onNavigateToLibrary}
                  className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium rounded-full"
                >
                  {translations[locale].diaryView.bukaLemariKoleksi}
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickLogSubmit} className="space-y-4 text-[12px]">
                
                {quickLogSuccess && (
                  <div className="p-3 bg-surface border border-bar text-ink text-[12px] font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-ink" />
                    <span>
                      {translations[locale].diaryView.semprotanBerhasilDicatatKeBukuHarian}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Bottle selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="diary-log-bottle" className="font-semibold block text-ink">
                      {translations[locale].diaryView.pilihBotolYangDipakai}
                    </label>
                    <select
                      value={selectedBottleId}
                      id="diary-log-bottle"
                      name="log-bottle"
                      onChange={e => setSelectedBottleId(e.target.value)}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {activeBottles.map(b => {
                        const perf = perfumes.find(p => p.id === b.perfume_id);
                        return (
                          <option key={b.id} value={b.id}>
                            {perf?.brand} — {perf?.name} ({b.remaining_ml} / {b.size_ml} ml)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Spray intensity */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-ink">
                      {translations[locale].diaryView.jumlahSemprotan}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {translations[locale].diaryOptions.sprayCounts.map(item => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setSpraysCount(item.count)}
                          className={`min-h-[44px] py-2 text-[12px] border font-medium transition ${
                            spraysCount === item.count
                              ? 'bg-bar text-paper border-bar'
                              : 'bg-paper border-border text-ink hover:border-bar'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="diary-log-mood" className="font-semibold block text-ink">
                      {translations[locale].diary.moodLabel}
                    </label>
                    <select
                      value={selectedMood}
                      id="diary-log-mood"
                      name="log-mood"
                      onChange={e => setSelectedMood(e.target.value)}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.moods.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Second row: Occasion, Weather, Compliment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  
                  {/* Occasion */}
                  <div className="space-y-1.5">
                    <label htmlFor="diary-log-occasion" className="font-semibold block text-ink">
                      {translations[locale].diaryView.konteksAcara}
                    </label>
                    <select
                      value={selectedOccasion}
                      id="diary-log-occasion"
                      name="log-occasion"
                      onChange={e => setSelectedOccasion(e.target.value)}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.occasions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Weather */}
                  <div className="space-y-1.5">
                    <label htmlFor="diary-log-weather" className="font-semibold block text-ink">
                      {translations[locale].diaryView.cuacaRuangan}
                    </label>
                    <select
                      value={selectedWeather}
                      id="diary-log-weather"
                      name="log-weather"
                      onChange={e => setSelectedWeather(e.target.value)}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.weathers.map(w => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Compliment Checkbox */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 bg-paper border border-border cursor-pointer hover:border-bar transition min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={complimentReceived}
                        onChange={e => setComplimentReceived(e.target.checked)}
                        className="accent-bar w-4 h-4"
                      />
                      <Heart className="w-4 h-4 text-bar" />
                      <span className="font-medium text-[12px] text-ink">
                        {translations[locale].diaryView.dapatPujianCompliment1}
                      </span>
                    </label>
                  </div>

                </div>

                {/* Optional Quick Note */}
                <div className="space-y-1 pt-1">
                  <input
                    type="text"
                    value={wearNote}
                    aria-label={translations[locale].diaryView.catatanSingkatOpsionalMisalAromanyaTe}
                    name="wear-note"
                    autoComplete="off"
                    spellCheck={true}
                    onChange={e => setWearNote(e.target.value)}
                    placeholder={translations[locale].diaryView.catatanSingkatOpsionalMisalAromanyaTe}
                    className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:border-bar focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    maxLength={140}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper font-medium text-[14px] flex items-center gap-2 transition rounded-full"
                  >
                    <Droplet className="w-4 h-4" />
                    <span>{translations[locale].diaryView.simpanKeBukuHarian05Ml}</span>
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* Wear Logs Timeline List */}
          <div className="space-y-4">
            <h3 className="font-sans text-[20px] font-medium text-ink">
              {translations[locale].diaryView.riwayatSemprotTerkini}
            </h3>

            {filteredWearLogs.length === 0 ? (
              wearLogs.length === 0 ? (
                <EmptyState
                  title={t.emptyStates.diaryTitle}
                  body={t.emptyStates.diaryBody}
                  ctaLabel={t.emptyStates.diaryCtaLog}
                  onCtaClick={() => {
                    const elem = document.getElementById('quick-logger-card');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  secondaryCtaLabel={t.emptyStates.diaryCtaStory}
                  onSecondaryCtaClick={() => setActiveTab('stories')}
                  iconType="diary"
                />
              ) : (
                <div className="p-8 text-center bg-card border border-hairline space-y-2">
                  <Droplet className="w-8 h-8 text-secondary mx-auto opacity-40" />
                  <p className="text-[14px] text-secondary">
                    {translations[locale].diaryView.belumAdaCatatanPemakaianYangCocokDen}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6" data-testid="journal-timeline">
                {latestWear && (
                  <section data-testid="journal-highlight" className="flex items-start gap-4 rounded-hero bg-surface p-5 text-ink">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-warm">
                      <Droplet className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-warm">
                        {locale === 'id' ? 'Sorotan · Pemakaian terakhir' : 'Highlight · Latest wear'}
                      </h4>
                      {featuredPerfume && <p className="break-words font-bold">{featuredPerfume.name}</p>}
                      <time className="block text-sm text-secondary" dateTime={latestWear.worn_at}>
                        {new Intl.DateTimeFormat(translations[locale].app.idId, {
                          dateStyle: 'medium',
                          ...(latestWear.worn_at.length > 10 ? { timeStyle: 'short' } : { timeZone: 'UTC' }),
                        }).format(new Date(latestWear.worn_at))}
                      </time>
                      {latestWear.note && <p className="break-words text-sm">{latestWear.note}</p>}
                    </div>
                  </section>
                )}
                {(() => {
                  const groups = groupTimelineByDate(filteredWearLogs, locale, 'worn_at');
                  for (const group of groups) {
                    group.items.sort((a, b) => (Date.parse(b.worn_at) || 0) - (Date.parse(a.worn_at) || 0));
                  }
                  // Basis tanggal UTC yang sama dengan pengelompokan di atas.
                  const todayKey = new Date().toISOString().slice(0, 10);
                  const todayGroup = groups.find(g => g.key === todayKey);
                  const archiveGroups = groups.filter(g => g.key !== todayKey);
                  return (
                    <>
                      {/* Hari Ini — satu entri hari ini di atas. */}
                      <section className="space-y-2" aria-label={t.diaryView.todayHeading}>
                        <h3 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.02em] text-ink border-b border-hairline pb-2">
                          {t.diaryView.todayHeading}
                        </h3>
                        {todayGroup ? (
                          renderWearGroup(todayGroup, true)
                        ) : (
                          <p className="text-[14px] text-secondary">{t.diaryView.noEntryToday}</p>
                        )}
                      </section>
                      {/* Arsip — entri-entri sebelumnya. */}
                      {archiveGroups.length > 0 && (
                        <section className="space-y-6" aria-label={t.diaryView.archiveHeading}>
                          <h3 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.02em] text-ink border-b border-hairline pb-2">
                            {t.diaryView.archiveHeading}
                          </h3>
                          {archiveGroups.map(g => renderWearGroup(g, false))}
                        </section>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SCENT STORIES & MEMORIES (WITH AUTOSAVE DRAFT)           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          
          {/* Draft Autosave notification banner */}
          {draftSavedNotice && (
            <div className="p-3 bg-surface border border-border text-ink text-[12px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Edit3 className="w-3.5 h-3.5 text-bar" />
                {draftSavedNotice}
              </span>
              {!isStoryEditorOpen && (
                <button
                  onClick={() => setIsStoryEditorOpen(true)}
                  className="font-bold underline text-[12px] text-ink"
                >
                  {translations[locale].diaryView.bukaEditorDraft}
                </button>
              )}
            </div>
          )}

          {/* New Story Editor Trigger / Form */}
          {!isStoryEditorOpen ? (
            <div className="bg-card border border-bar p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-sans text-[20px] font-medium text-ink">
                  {translations[locale].diaryView.abadikanMemoriCeritaAromamu}
                </h3>
                <p className="text-[14px] text-secondary max-w-xl">
                  {translations[locale].diaryView.aromaMemilikiKaitanPalingEratDenganM}
                </p>
              </div>

              <button
                onClick={() => setIsStoryEditorOpen(true)}
                className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition rounded-full"
              >
                <Plus className="w-4 h-4" />
                <span>{translations[locale].diaryView.mulaiMenulisCerita}</span>
              </button>
            </div>
          ) : (
            <div className="bg-card border border-bar p-6 md:p-8 space-y-6 relative">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="space-y-1">
                  <span className="label-caption block">
                    {translations[locale].diaryView.pembuatCeritaAroma}
                  </span>
                  <h3 className="font-sans text-[20px] font-medium text-ink">
                    {translations[locale].diaryView.tulisCatatanMemoriOlfaktif}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-mono text-secondary">
                    {draftState === 'saving'
                      ? (translations[locale].diaryView.menyimpan)
                      : (translations[locale].diaryView.tersimpan)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-[12px]">
                
                {/* Perfume picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="diary-story-perfume" className="font-semibold block text-ink">
                      {translations[locale].diaryView.parfumYangTerikatCeritaIni}
                    </label>
                    <select
                      value={storyPerfumeId}
                      id="diary-story-perfume"
                      name="story-perfume"
                      onChange={e => setStoryPerfumeId(e.target.value)}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {dropdownPerfumes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.brand} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Story Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="diary-story-title" className="font-semibold block text-ink">
                      {translations[locale].diaryView.judulCerita}
                    </label>
                    <input
                      type="text"
                      value={storyTitle}
                      id="diary-story-title"
                      name="story-title"
                      autoComplete="off"
                      spellCheck={true}
                      onChange={e => {
                        setStoryTitle(e.target.value);
                        handleStoryBodyChange(storyBody);
                      }}
                      placeholder={translations[locale].diaryView.contohHujanSoreDiKemangHangatnyaVani}
                      className="w-full bg-paper border border-border p-2.5 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Mood, Occasion, Weather */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="diary-story-mood" className="font-semibold block text-ink">{translations[locale].diaryView.suasanaHati}</label>
                    <select
                      value={storyMood}
                      id="diary-story-mood"
                      name="story-mood"
                      onChange={e => setStoryMood(e.target.value)}
                      className="w-full bg-paper border border-border p-2 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.moods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="diary-story-occasion" className="font-semibold block text-ink">{translations[locale].diaryView.konteksAcara2}</label>
                    <select
                      value={storyOccasion}
                      id="diary-story-occasion"
                      name="story-occasion"
                      onChange={e => setStoryOccasion(e.target.value)}
                      className="w-full bg-paper border border-border p-2 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.occasions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="diary-story-weather" className="font-semibold block text-ink">{translations[locale].diaryView.cuacaTempat}</label>
                    <select
                      value={storyWeather}
                      id="diary-story-weather"
                      name="story-weather"
                      onChange={e => setStoryWeather(e.target.value)}
                      className="w-full bg-paper border border-border p-2 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    >
                      {translations[locale].diaryOptions.weathers.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Body narrative with autosave */}
                <div className="space-y-1.5">
                  <label htmlFor="diary-story-body" className="font-semibold block flex justify-between items-center text-ink">
                    <span>{translations[locale].diaryView.kisahNarasiMemori}</span>
                    <span className="font-mono tabular-nums text-[12px] text-secondary">
                      {fmt(translations[locale].diaryView.storyLengthHint, storyBody.trim().length)}
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={storyBody}
                    id="diary-story-body"
                    name="story-body"
                    spellCheck={true}
                    onChange={e => handleStoryBodyChange(e.target.value)}
                    placeholder={translations[locale].diaryView.ceritakanSuasanaHariItuSiapaYangAda}
                    className="w-full bg-paper border border-border p-3 text-[14px] leading-relaxed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus focus:border-bar text-ink"
                  />
                </div>

                {/* Tags and visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="diary-story-tags" className="font-semibold block text-ink">
                      {translations[locale].diaryView.tagMomenPisahkanKoma}
                    </label>
                    <input
                      type="text"
                      value={storyTagsInput}
                      id="diary-story-tags"
                      name="story-tags"
                      autoComplete="off"
                      spellCheck={false}
                      onChange={e => setStoryTagsInput(e.target.value)}
                      placeholder={translations[locale].diaryView.tagPlaceholder}
                      className="w-full bg-paper border border-border p-2 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus min-h-[44px]"
                    />
                  </div>

                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('senstoria_story_draft');
                      setStoryTitle('');
                      setStoryBody('');
                      setIsStoryEditorOpen(false);
                      setDraftSavedNotice(null);
                    }}
                    className="min-h-[48px] text-[12px] text-error hover:underline px-2"
                  >
                    {translations[locale].diaryView.buangDraft}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePublishStory('draft')}
                      className="min-h-[48px] px-5 py-2 border border-border hover:border-bar text-[14px] font-medium text-ink"
                    >
                      {translations[locale].diary.saveDraftAction}
                    </button>

                    <button
                      type="button"
                      disabled={storyBody.trim().length < 20}
                      onClick={() => handlePublishStory('published')}
                      className={`min-h-[48px] px-6 py-2 bg-bar text-paper text-[14px] font-medium flex items-center gap-2 transition rounded-full ${
                        storyBody.trim().length < 20 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{translations[locale].diaryView.publikasikanCerita}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stories Timeline Feed */}
          <div className="space-y-4">
            <h3 className="font-sans text-[20px] font-medium text-ink">
              {translations[locale].diaryView.linimasaCeritaMemoriAroma}
            </h3>

            {filteredStories.length === 0 ? (
              <div className="p-8 text-center bg-card border border-hairline space-y-2">
                <BookOpen className="w-8 h-8 text-secondary mx-auto opacity-40" />
                <p className="text-[14px] text-secondary">
                  {translations[locale].diaryView.belumAdaCeritaYangCocokDenganFilter}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupTimelineByDate(filteredStories, locale, 'story_date').map(group => (
                  <div key={group.dateLabel} className="space-y-4">
                    <h4 className="font-display text-[24px] md:text-[28px] font-normal text-ink border-b border-hairline pb-3 pt-4">
                      {group.dateLabel}
                    </h4>
                    <div className="relative ml-2 space-y-4 rounded-l-[2rem] border-l-2 border-warm/40 py-3 pl-4">
                      {group.items.map(story => {
                        const perfume = perfumes.find(p => p.id === story.perfume_id);
                        // Fase N13 (P11): hanya cerita tertulis milik
                        // sendiri yang bisa dibagikan; tautan aktif
                        // ditandai "Dibagikan" + salin + berhenti bagikan.
                        // Tamu (tanpa currentUserId) tidak pernah melihat
                        // tombol bagikan — berbagi butuh akun, dan tombol
                        // yang selalu gagal adalah kebohongan UI.
                        const shareable = isShareableStory(story) && Boolean(currentUserId) && Boolean(onShareStory);
                        const activeShare = sharedByStoryId[story.id];

                        return (
                          <article
                            key={story.id}
                            className="relative w-full rounded-2xl bg-card border border-hairline p-5 md:p-10 space-y-5 hover:border-bar transition before:absolute before:-left-[23px] before:top-5 before:size-3 before:rounded-full before:border-2 before:border-white before:bg-warm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3 text-xs text-secondary">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold uppercase tracking-wider text-ink">{perfume?.brand}</span>
                                {perfume && (
                                  <>
                                    <span>·</span>
                                    <button 
                                      type="button"
                                      onClick={() => onSelectPerfume(perfume.id)}
                                      className="inline-flex min-h-11 min-w-11 items-center font-medium hover:underline text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                                    >
                                      {perfume.name}
                                    </button>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {story.mood && (
                                  <span className="bg-surface px-2 py-0.5 border border-hairline font-medium text-ink text-[12px]">
                                    {optionLabel(translations[locale].diaryOptions.moods, story.mood)}
                                  </span>
                                )}
                                {story.occasion && (
                                  <span className="border border-hairline px-2 py-0.5 text-secondary text-[12px]">
                                    {optionLabel(translations[locale].diaryOptions.occasions, story.occasion)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {story.title && (
                              <h4 className="font-display text-[24px] md:text-[30px] leading-[32px] md:leading-[38px] font-normal text-ink">
                                {story.title}
                              </h4>
                            )}

                            {/* Generous reading body: font-size >= 16px, line-height 1.6 */}
                            <p className="text-[16px] md:text-[18px] leading-[1.75] text-bar font-display whitespace-pre-line">
                              {story.body}
                            </p>

                            {story.tags && story.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {story.tags.map(t => (
                                  <span key={t} className="text-[12px] font-mono text-secondary bg-surface border border-hairline px-2 py-0.5">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2 text-[12px] text-secondary">
                              <span className="font-mono">@{story.user_name || 'senstoria'}</span>
                              <div className="flex flex-wrap items-center gap-1">
                                {activeShare ? (
                                  <>
                                    <span
                                      data-testid={`story-shared-badge-${story.id}`}
                                      className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[12px] font-medium text-ink"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-ink" aria-hidden="true" />
                                      {t.shareStory.sharedBadge}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onCopyShareLink?.(activeShare.token)}
                                      className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[12px] font-medium text-ink hover:underline cursor-pointer"
                                    >
                                      <Link2 className="w-4 h-4" aria-hidden="true" />
                                      {t.shareStory.copyLink}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRevokeConfirmStory(story)}
                                      className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[12px] font-medium text-secondary hover:text-error cursor-pointer"
                                    >
                                      <XCircle className="w-4 h-4" aria-hidden="true" />
                                      {t.shareStory.stopSharing}
                                    </button>
                                  </>
                                ) : shareable ? (
                                  <button
                                    type="button"
                                    onClick={() => setShareSheetStory(story)}
                                    data-testid={`story-share-button-${story.id}`}
                                    className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[12px] font-medium text-ink hover:underline cursor-pointer"
                                  >
                                    <Share2 className="w-4 h-4" aria-hidden="true" />
                                    {t.shareStory.shareButton}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteStory(story)}
                                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-secondary hover:text-error transition cursor-pointer"
                                  title={translations[locale].diaryView.deleteStoryTitle}
                                  aria-label={translations[locale].diaryView.deleteStoryTitle}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: COMMUNITY REVIEWS & MULTI-CRITERIA HUB                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-bar p-5 md:p-6">
            <div className="space-y-1">
              <span className="label-caption block">
                {translations[locale].diaryView.evaluasiKomunitasIndependen}
              </span>
              <h3 className="font-sans text-[20px] font-medium text-ink">
                {translations[locale].diaryView.ulasanMultiKriteriaTerverifikasi}
              </h3>
              <p className="text-[14px] text-secondary">
                {translations[locale].diaryView.bebasSponsorKomersialDataKetahananNya}
              </p>
            </div>

            <button
              onClick={() => onOpenReviewModal()}
              className="min-h-[48px] px-6 py-2.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium flex items-center gap-2 transition rounded-full"
            >
              <Star className="w-4 h-4 text-paper" />
              <span>{translations[locale].diaryView.tulisUlasanBaru}</span>
            </button>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center bg-card border border-hairline space-y-2">
              <Star className="w-8 h-8 text-secondary mx-auto opacity-40" />
              <p className="text-[14px] text-secondary">
                {translations[locale].diaryView.belumAdaUlasanYangSesuaiDenganFilter}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(rev => {
                const perfume = perfumes.find(p => p.id === rev.perfume_id);

                return (
                  <div
                    key={rev.id}
                    className="bg-card border border-hairline p-5 md:p-8 space-y-5 hover:border-bar transition"
                  >
                    {/* Review Top Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-ink">{rev.user_name}</span>
                          {rev.user_badge && (
                            <span className="bg-surface text-ink border border-hairline text-[12px] font-mono px-2 py-0.5">
                              ✓ {rev.user_badge}
                            </span>
                          )}
                        </div>
                        {perfume && (
                          <p 
                            onClick={() => onSelectPerfume(perfume.id)}
                            className="font-sans text-[18px] leading-[24px] font-medium text-ink hover:underline cursor-pointer pt-0.5"
                          >
                            {perfume.brand} — {perfume.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 border border-hairline">
                        <Star className="w-4 h-4 fill-bar text-bar" />
                        <span className="font-mono tabular-nums text-[14px] font-bold text-ink">{rev.rating.toFixed(1)}</span>
                        <span className="text-[12px] text-secondary">/ 5.0</span>
                      </div>
                    </div>

                    {/* Multi-Criteria Spec Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] bg-surface p-3 border border-hairline">
                      <div>
                        <span className="text-[12px] uppercase font-medium text-secondary block">{translations[locale].diaryView.skinLongevityLabel}</span>
                        <span className="font-semibold text-ink">{rev.longevity_band}</span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-secondary block">Proyeksi (Sillage)</span>
                        <span className="font-semibold capitalize text-ink">{rev.sillage}</span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-secondary block">{translations[locale].diaryView.repurchaseLabel}</span>
                        <span className="font-semibold text-ink">
                          {rev.repurchase_intent === 'yes_definitely' ? translations[locale].diaryView.repurchaseYes : translations[locale].diaryView.repurchaseMaybe}
                        </span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-secondary block">{translations[locale].diaryView.usageFormatLabel}</span>
                        <span className="font-semibold text-ink">
                          {rev.format_used === 'full_bottle' ? translations[locale].diaryView.fullBottle : translations[locale].diaryView.decantSample}
                        </span>
                      </div>
                    </div>

                    {/* Headline & Body Text */}
                    <div className="space-y-1.5 text-[14px]">
                      <h4 className="font-sans text-[16px] font-medium text-ink">{rev.title}</h4>
                      <p className="text-bar leading-relaxed">
                        {rev.review_text}
                      </p>
                    </div>

                    {/* Pros & Cons chips */}
                    {(rev.pros || rev.cons) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] pt-1">
                        {rev.pros && rev.pros.length > 0 && (
                          <div className="space-y-1 bg-surface p-3 border border-hairline">
                            <span className="text-[12px] font-bold text-ink uppercase block">{translations[locale].diaryView.prosLabel}</span>
                            <ul className="text-[12px] text-bar space-y-0.5">
                              {rev.pros.map((p, i) => <li key={i}>• {p}</li>)}
                            </ul>
                          </div>
                        )}
                        {rev.cons && rev.cons.length > 0 && (
                          <div className="space-y-1 bg-surface p-3 border border-hairline">
                            <span className="text-[12px] font-bold text-error uppercase block">{translations[locale].diaryView.consLabel}</span>
                            <ul className="text-[12px] text-bar space-y-0.5">
                              {rev.cons.map((c, i) => <li key={i}>• {c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / Helpful button (secondary action) */}
                    <div className="flex items-center justify-between text-[12px] text-secondary pt-2 border-t border-hairline">
                      <span className="font-mono tabular-nums">
                        {new Date(rev.created_at).toLocaleDateString(translations[locale].app.idId, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>

                      <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface hover:border-bar border border-hairline text-[12px] font-medium text-ink transition min-h-[44px]">
                        <ThumbsUp className="w-3.5 h-3.5 text-bar" />
                        <span>{fmt(translations[locale].diaryView.helpfulCount, rev.helpful_count ?? 0)}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ── PERSISTENT QUICK LOG WEAR BUTTON ON MOBILE (Above bottom nav bar) ── */}
      <div className="lg:hidden fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] left-0 right-0 px-4 py-2 z-30 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            setActiveTab('wear_logs');
            const elem = document.getElementById('quick-logger-card');
            if (elem) {
              elem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="pointer-events-auto w-full min-h-[48px] bg-bar hover:bg-ink text-paper text-sm font-medium shadow-sheet flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition rounded-full"
        >
          <Droplet className="w-4 h-4" />
          <span>{translations[locale].diaryView.catatSemprotanHariIni2}</span>
        </button>
      </div>

      {/* Tahap 2 (§4): konfirmasi hapus cerita — menyebut nama parfumnya,
          karena hapus cerita tidak bisa diurungkan (berbeda dengan hapus
          log pemakaian dan hapus botol yang punya toast undo 8 detik). */}
      {(() => {
        const story = pendingDeleteStory;
        if (!story) return null;
        const perfume = perfumes.find(p => p.id === story.perfume_id);
        const name = perfume ? `${perfume.brand} ${perfume.name}` : story.title || '';
        return (
          <BottomSheetOrModal
            isOpen
            onClose={() => setPendingDeleteStory(null)}
            locale={locale}
            title={t.diaryView.hapusCeritaJudul}
            subtitle={fmt(t.diaryView.hapusCeritaIsiNama, name)}
            maxWidth="max-w-md"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteStory(null)}
                className="min-h-[44px] flex-1 border border-bar py-2 text-sm font-medium cursor-pointer"
              >
                {translations[locale].app.hapusBotolBatal}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStory(story.id);
                  setPendingDeleteStory(null);
                }}
                className="min-h-[44px] flex-1 bg-bar py-2 text-sm font-medium text-paper rounded-full cursor-pointer"
              >
                {t.diaryView.deleteStoryTitle}
              </button>
            </div>
          </BottomSheetOrModal>
        );
      })()}

      {/* Fase N13 (P11): sheet konfirmasi berbagi — menjelaskan APA yang
          dibagikan (isi + parfum + tanggal + apakah nama tampil, sesuai
          G15) dan bahwa penerima tidak diketahui: tautan bisa diteruskan
          siapa saja. Tombol Bagikan menulis dokumen lalu membuka share
          sheet HP (di App); gagal → sheet tetap terbuka + toast error. */}
      {(() => {
        const story = shareSheetStory;
        if (!story) return null;
        const perfume = perfumes.find(p => p.id === story.perfume_id);
        const nameLine = profileVisibility === 'private'
          ? t.shareStory.sheetNameHidden
          : fmt(t.shareStory.sheetNameShown, currentUserName || 'senstoria');
        const busy = sharingStoryId === story.id;
        return (
          <BottomSheetOrModal
            isOpen
            onClose={() => { if (!busy) setShareSheetStory(null); }}
            locale={locale}
            title={t.shareStory.sheetTitle}
            maxWidth="max-w-md"
          >
            <div className="space-y-4 text-[14px] leading-[20px] text-ink">
              <p className="text-secondary">{t.shareStory.sheetIntro}</p>
              <div className="border border-hairline bg-surface p-4 space-y-2">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-secondary">{t.shareStory.sheetShowsLabel}</p>
                {story.title && <p className="font-display text-[18px] leading-[24px]">{story.title}</p>}
                <p className="text-[12px] text-secondary">
                  {perfume ? `${perfume.brand} · ${perfume.name}` : ''}{perfume && story.story_date ? ' · ' : ''}{story.story_date ?? ''}
                </p>
                <p className="whitespace-pre-line">{story.body}</p>
                <p className="text-[12px] text-secondary">{nameLine}</p>
              </div>
              <p className="text-[13px] leading-[18px] text-secondary">{t.shareStory.sheetJournalNote}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShareSheetStory(null)}
                  className="min-h-[44px] flex-1 border border-bar py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  {t.shareStory.cancel}
                </button>
                <button
                  type="button"
                  disabled={busy || !onShareStory}
                  onClick={async () => {
                    if (!onShareStory) return;
                    setSharingStoryId(story.id);
                    const ok = await onShareStory(story);
                    setSharingStoryId(null);
                    if (ok) setShareSheetStory(null);
                  }}
                  className="min-h-[44px] flex-1 bg-bar py-2 text-sm font-medium text-paper rounded-full cursor-pointer disabled:opacity-50"
                >
                  {busy ? t.shareStory.sharing : t.shareStory.shareAction}
                </button>
              </div>
            </div>
          </BottomSheetOrModal>
        );
      })()}

      {/* Fase N13 (P11): konfirmasi berhenti bagikan — tautan langsung
          mati dan tidak bisa diaktifkan lagi. */}
      {(() => {
        const story = revokeConfirmStory;
        if (!story) return null;
        const activeShare = sharedByStoryId[story.id];
        if (!activeShare) return null;
        return (
          <BottomSheetOrModal
            isOpen
            onClose={() => setRevokeConfirmStory(null)}
            locale={locale}
            title={t.shareStory.stopSharingTitle}
            subtitle={t.shareStory.stopSharingBody}
            maxWidth="max-w-md"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRevokeConfirmStory(null)}
                className="min-h-[44px] flex-1 border border-bar py-2 text-sm font-medium cursor-pointer"
              >
                {t.shareStory.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRevokeShare?.(activeShare.token);
                  setRevokeConfirmStory(null);
                }}
                className="min-h-[44px] flex-1 bg-bar py-2 text-sm font-medium text-paper rounded-full cursor-pointer"
              >
                {t.shareStory.stopSharingConfirm}
              </button>
            </div>
          </BottomSheetOrModal>
        );
      })()}

    </div>
  );
}
