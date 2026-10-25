import React, { useState, useEffect } from 'react';
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
  Search, 
  Check, 
  ChevronRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { BottleState, WearLogState, StoryState, ReviewState, computeDiaryStats } from '../lib/derivedCalculations.ts';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency, translations } from '../lib/i18n.ts';
import { MOOD_OPTIONS, OCCASION_OPTIONS, WEATHER_OPTIONS, LONGEVITY_BANDS, SILLAGE_OPTIONS } from '../data/seedDiaryData.ts';
import { EmptyState } from './EmptyState.tsx';

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
}

interface DateGroup<T> {
  dateLabel: string;
  items: T[];
}

function groupTimelineByDate<T extends { worn_on?: string; story_date?: string; created_at?: string }>(
  items: T[],
  locale: Locale,
  dateField: 'worn_on' | 'story_date'
): DateGroup<T>[] {
  const groups: { [key: string]: T[] } = {};
  items.forEach(item => {
    const raw = (item as any)[dateField] || (item as any).created_at || '2026-10-18';
    const d = new Date(raw);
    const key = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '2026-10-18';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const d = new Date(key + 'T12:00:00Z');
      const dateLabel = d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return {
        dateLabel,
        items: groups[key]
      };
    });
}

export function ScentDiaryView({
  bottles,
  perfumes,
  wearLogs,
  stories,
  reviews,
  onLogWearDetail,
  onDeleteWearLog,
  onSaveStory,
  onDeleteStory,
  onOpenReviewModal,
  onSelectPerfume,
  onNavigateToLibrary,
  currentUserId,
  currentUserName,
  locale
}: ScentDiaryViewProps) {
  const t = translations[locale];
  const [activeTab, setActiveTab] = useState<'wear_logs' | 'stories' | 'reviews'>('wear_logs');
  const [filterPerfumeId, setFilterPerfumeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active bottles available for wearing
  const activeBottles = bottles.filter(b => !b.deleted_at && (b.status === 'in_use' || b.status === 'sealed') && b.remaining_ml > 0);

  // Quick Logger State
  const [selectedBottleId, setSelectedBottleId] = useState<string>(activeBottles[0]?.id || '');
  const [spraysCount, setSpraysCount] = useState<number>(3);
  const [selectedMood, setSelectedMood] = useState<string>(MOOD_OPTIONS[0]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>(OCCASION_OPTIONS[0]);
  const [selectedWeather, setSelectedWeather] = useState<string>(WEATHER_OPTIONS[0]);
  const [complimentReceived, setComplimentReceived] = useState<boolean>(false);
  const [wearNote, setWearNote] = useState<string>('');
  const [quickLogSuccess, setQuickLogSuccess] = useState<boolean>(false);

  // Scent Story Editor State & Draft Autosave (Phase 4 requirement)
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState<boolean>(false);
  const [storyPerfumeId, setStoryPerfumeId] = useState<string>(activeBottles[0]?.perfume_id || perfumes[0]?.id || 'prf_001');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyBody, setStoryBody] = useState<string>('');
  const [storyMood, setStoryMood] = useState<string>(MOOD_OPTIONS[0]);
  const [storyOccasion, setStoryOccasion] = useState<string>(OCCASION_OPTIONS[0]);
  const [storyWeather, setStoryWeather] = useState<string>(WEATHER_OPTIONS[2]); // Hujan Sejuk
  const [storyTagsInput, setStoryTagsInput] = useState<string>('');
  const [isStoryPublic, setIsStoryPublic] = useState<boolean>(true);
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
      title: storyTitle.trim() || (locale === 'id' ? 'Catatan Aroma' : 'Scent Memory'),
      body: storyBody.trim(),
      mood: storyMood,
      occasion: storyOccasion,
      weather: storyWeather,
      tags: tags.length > 0 ? tags : undefined,
      story_date: new Date().toISOString().split('T')[0],
      status,
      is_public: isStoryPublic,
      likes_count: 0,
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
      setStoryTitle(`${perfume.name} — ${wear.mood || 'Aroma Hari Ini'}`);
    }
    setActiveTab('stories');
    setIsStoryEditorOpen(true);
  };

  // Statistics
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

  const mostWornPerfume = perfumes.find(p => p.id === diaryStats.mostWornPerfumeId);

  return (
    <div className="space-y-8 pb-16">
      
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9d7c9] pb-6">
        <div className="space-y-1">
          <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
            {locale === 'id' ? 'Buku Harian Aroma & Memori' : 'Scent Diary & Journal'}
          </span>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] text-[#000000] font-normal">
            {locale === 'id' ? 'Buku Harian Semprot & Cerita Aroma' : 'Scent Diary & Memory Stories'}
          </h2>
          <p className="text-[16px] leading-[24px] text-[#5c5c5c] max-w-2xl">
            {locale === 'id'
              ? 'Catat semprotan 1-tap otomatis mengurangi sisa cairan botol, rangkai cerita aroma yang terikat kenangan dengan autosave draft, dan bagikan ulasan multi-kriteria jujur.'
              : 'Log daily wears with 1-tap auto volume decrement, craft scent memories with draft autosaving, and contribute honest multi-criteria evaluations.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('stories');
              setIsStoryEditorOpen(true);
            }}
            className="min-h-[48px] px-5 py-2.5 bg-[#fffef2] border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000] flex items-center gap-2 transition"
          >
            <Edit3 className="w-4 h-4 text-[#333333]" />
            <span>{locale === 'id' ? 'Tulis Cerita' : 'Pen Story'}</span>
          </button>

          <button
            onClick={() => onOpenReviewModal()}
            className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
          >
            <Star className="w-4 h-4 text-[#fffef2]" />
            <span>{locale === 'id' ? 'Tulis Ulasan Baru' : 'Write Review'}</span>
          </button>
        </div>
      </div>

      {/* ── STATS GLANCE CARDS (Numbers first, decoration never) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
        
        {/* Total Wears */}
        <div className="bg-[#fffef2] p-5 border border-[#d9d7c9] h-full flex flex-col justify-between space-y-3">
          <p className="font-serif text-[40px] md:text-[48px] leading-none font-normal text-[#000000] tabular-nums">
            {diaryStats.totalWears}
          </p>
          <div>
            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Total Semprot' : 'Logged Wears'}
            </span>
            <span className="text-[12px] text-[#5c5c5c] font-mono tabular-nums">
              {activeBottles.length} {locale === 'id' ? 'botol aktif di lemari' : 'active bottles'}
            </span>
          </div>
        </div>

        {/* Compliments */}
        <div className="bg-[#fffef2] p-5 border border-[#d9d7c9] h-full flex flex-col justify-between space-y-3">
          <p className="font-serif text-[40px] md:text-[48px] leading-none font-normal text-[#000000] tabular-nums">
            {diaryStats.totalCompliments}
          </p>
          <div>
            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Pujian Diterima' : 'Compliments'}
            </span>
            <span className="text-[12px] text-[#5c5c5c] font-mono tabular-nums">
              {locale === 'id' ? 'Pencatatan spontan' : 'Spontaneous compliments'}
            </span>
          </div>
        </div>

        {/* Most Worn Perfume */}
        <div className="bg-[#fffef2] p-5 border border-[#d9d7c9] h-full flex flex-col justify-between space-y-3">
          <p className="font-serif text-[40px] md:text-[48px] leading-none font-normal text-[#000000] tabular-nums">
            {diaryStats.mostWornCount}
          </p>
          <div>
            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Rotasi Teratas' : 'Top Signature'}
            </span>
            <span className="text-[12px] text-[#5c5c5c] font-mono truncate block">
              {mostWornPerfume ? `${mostWornPerfume.brand} — ${mostWornPerfume.name}` : 'Belum ada data'}
            </span>
          </div>
        </div>

        {/* Stories Penned */}
        <div className="bg-[#fffef2] p-5 border border-[#d9d7c9] h-full flex flex-col justify-between space-y-3">
          <p className="font-serif text-[40px] md:text-[48px] leading-none font-normal text-[#000000] tabular-nums">
            {diaryStats.totalStories}
          </p>
          <div>
            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium block">
              {locale === 'id' ? 'Cerita Tersimpan' : 'Stories Penned'}
            </span>
            <span className="text-[12px] text-[#5c5c5c] font-mono">
              {diaryStats.dominantMood ? `Mood: ${diaryStats.dominantMood}` : 'Arsip memori olfaktif'}
            </span>
          </div>
        </div>

      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-[#d9d7c9] text-[12px]">
        <button
          onClick={() => setActiveTab('wear_logs')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] ${
            activeTab === 'wear_logs'
              ? 'border-[#333333] text-[#000000]'
              : 'border-transparent text-[#5c5c5c] hover:text-[#000000]'
          }`}
        >
          <Droplet className="w-4 h-4 text-[#333333]" />
          <span>{locale === 'id' ? '1. Log Pemakaian Harian' : '1. Daily Wear Logs'}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({wearLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] ${
            activeTab === 'stories'
              ? 'border-[#333333] text-[#000000]'
              : 'border-transparent text-[#5c5c5c] hover:text-[#000000]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#333333]" />
          <span>{locale === 'id' ? '2. Cerita Aroma & Memori' : '2. Scent Stories & Memories'}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 min-h-[44px] ${
            activeTab === 'reviews'
              ? 'border-[#333333] text-[#000000]'
              : 'border-transparent text-[#5c5c5c] hover:text-[#000000]'
          }`}
        >
          <Star className="w-4 h-4 text-[#333333]" />
          <span>{locale === 'id' ? '3. Ulasan Multi-Kriteria' : '3. Multi-Criteria Reviews'}</span>
          <span className="font-mono tabular-nums text-[12px] opacity-75">({reviews.length})</span>
        </button>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffef2] p-3 border border-[#d9d7c9] text-[12px]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-[#5c5c5c]">
            <Search className="w-4 h-4 text-[#5c5c5c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={locale === 'id' ? 'Cari di buku harian & cerita...' : 'Search diary and stories...'}
              className="bg-transparent outline-none text-[12px] text-[#000000] w-48 sm:w-64"
            />
          </div>

          <span className="text-[#d9d7c9] hidden sm:inline">|</span>

          {/* Perfume Filter dropdown */}
          <select
            value={filterPerfumeId}
            onChange={e => setFilterPerfumeId(e.target.value)}
            className="bg-transparent border border-[#8a8a8a] p-1.5 text-[12px] text-[#000000] outline-none min-h-[36px]"
          >
            <option value="all">{locale === 'id' ? 'Semua Parfum' : 'All Fragrances'}</option>
            {perfumes.map(p => (
              <option key={p.id} value={p.id}>
                {p.brand} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[12px] text-[#5c5c5c] font-mono tabular-nums">
          {activeTab === 'wear_logs' && `${filteredWearLogs.length} catatan semprot`}
          {activeTab === 'stories' && `${filteredStories.length} cerita`}
          {activeTab === 'reviews' && `${filteredReviews.length} ulasan`}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: WEAR LOGS & QUICK LOGGER                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'wear_logs' && (
        <div className="space-y-6">
          
          {/* 1-Tap Quick Logger Card */}
          <div id="quick-logger-card" className="bg-[#fffef2] border border-[#333333] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#d9d7c9] pb-3">
              <div className="space-y-0.5">
                <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                  {locale === 'id' ? 'Aksi Cepat Pemakaian' : 'Quick Wear Logger'}
                </span>
                <h3 className="font-sans text-[20px] font-medium text-[#000000]">
                  {locale === 'id' ? 'Catat Semprotan Hari Ini' : "Log Today's Scent"}
                </h3>
              </div>
              <span className="text-[12px] font-mono tabular-nums text-[#5c5c5c]">
                -0.5 ml per log · Undo 8 detik
              </span>
            </div>

            {activeBottles.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-[#fffef2] border border-[#d9d7c9]">
                <p className="text-[14px] text-[#5c5c5c]">
                  {locale === 'id' 
                    ? 'Belum ada botol aktif di lemari koleksimu. Tambahkan botol terlebih dahulu untuk mencatat semprotan harian.' 
                    : 'No active bottles in your library. Add a bottle to start logging wears.'}
                </p>
                <button
                  onClick={onNavigateToLibrary}
                  className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium"
                >
                  {locale === 'id' ? 'Buka Lemari Koleksi' : 'Open Library'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickLogSubmit} className="space-y-4 text-[12px]">
                
                {quickLogSuccess && (
                  <div className="p-3 bg-[#f4f3e6] border border-[#333333] text-[#000000] text-[12px] font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#000000]" />
                    <span>
                      {locale === 'id' 
                        ? 'Semprotan berhasil dicatat ke buku harian! Volume botol otomatis dikurangi.' 
                        : 'Wear logged! Volume automatically decremented.'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Bottle selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Pilih Botol yang Dipakai' : 'Select Bottle'}
                    </label>
                    <select
                      value={selectedBottleId}
                      onChange={e => setSelectedBottleId(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
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
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Jumlah Semprotan' : 'Sprays Count'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { count: 1, label: '1–2 (Ringan)' },
                        { count: 3, label: '3–4 (Standar)' },
                        { count: 5, label: '5+ (Penuh)' }
                      ].map(item => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setSpraysCount(item.count)}
                          className={`min-h-[44px] py-2 text-[12px] border font-medium transition ${
                            spraysCount === item.count
                              ? 'bg-[#333333] text-[#fffef2] border-[#333333]'
                              : 'bg-[#fffef2] border-[#8a8a8a] text-[#000000] hover:border-[#333333]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Suasana Hati (Mood)' : 'Mood Tag'}
                    </label>
                    <select
                      value={selectedMood}
                      onChange={e => setSelectedMood(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {MOOD_OPTIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Second row: Occasion, Weather, Compliment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  
                  {/* Occasion */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Konteks / Acara' : 'Occasion'}
                    </label>
                    <select
                      value={selectedOccasion}
                      onChange={e => setSelectedOccasion(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {OCCASION_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Weather */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Cuaca / Ruangan' : 'Weather / Setting'}
                    </label>
                    <select
                      value={selectedWeather}
                      onChange={e => setSelectedWeather(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {WEATHER_OPTIONS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Compliment Checkbox */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 bg-[#fffef2] border border-[#8a8a8a] cursor-pointer hover:border-[#333333] transition min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={complimentReceived}
                        onChange={e => setComplimentReceived(e.target.checked)}
                        className="accent-[#333333] w-4 h-4"
                      />
                      <Heart className="w-4 h-4 text-[#333333]" />
                      <span className="font-medium text-[12px] text-[#000000]">
                        {locale === 'id' ? 'Dapat pujian / compliment (+1)' : 'Got a compliment (+1)'}
                      </span>
                    </label>
                  </div>

                </div>

                {/* Optional Quick Note */}
                <div className="space-y-1 pt-1">
                  <input
                    type="text"
                    value={wearNote}
                    onChange={e => setWearNote(e.target.value)}
                    placeholder={locale === 'id' ? 'Catatan singkat (opsional: misal "Aromanya tetap harum walau naik ojol siang")' : 'Quick note (optional)'}
                    className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] focus:border-[#333333] outline-none min-h-[44px]"
                    maxLength={140}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] font-medium text-[14px] flex items-center gap-2 transition"
                  >
                    <Droplet className="w-4 h-4" />
                    <span>{locale === 'id' ? 'Simpan ke Buku Harian (-0.5 ml)' : 'Save to Diary (-0.5 ml)'}</span>
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* Wear Logs Timeline List */}
          <div className="space-y-4">
            <h3 className="font-sans text-[20px] font-medium text-[#000000]">
              {locale === 'id' ? 'Riwayat Semprot Terkini' : 'Recent Wear History'}
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
                <div className="p-8 text-center bg-[#fffef2] border border-[#d9d7c9] space-y-2">
                  <Droplet className="w-8 h-8 text-[#5c5c5c] mx-auto opacity-40" />
                  <p className="text-[14px] text-[#5c5c5c]">
                    {locale === 'id' ? 'Belum ada catatan pemakaian yang cocok dengan filter.' : 'No wear logs matching your filter.'}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {groupTimelineByDate(filteredWearLogs, locale, 'worn_on').map(group => (
                  <div key={group.dateLabel} className="space-y-2">
                    <h4 className="font-serif text-[20px] md:text-[24px] font-normal text-[#000000] border-b border-[#d9d7c9] pb-2 pt-4 first:pt-0">
                      {group.dateLabel}
                    </h4>
                    <div className="divide-y divide-[#d9d7c9] border border-[#d9d7c9] bg-white">
                      {group.items.map(wear => {
                        const perfume = perfumes.find(p => p.id === wear.perfume_id);
                        const timeStr = new Date(wear.worn_on).toLocaleTimeString(locale === 'id' ? 'id-ID' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={wear.id}
                            className="p-3 md:px-4 md:py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 hover:bg-[#f4f3e6]/60 transition text-xs"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="font-mono text-[12px] text-[#5c5c5c] shrink-0 tabular-nums">
                                {timeStr}
                              </span>
                              <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium shrink-0">
                                  {perfume?.brand || 'Brand'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => perfume && onSelectPerfume(perfume.id)}
                                  className="text-[14px] font-medium text-[#000000] hover:underline truncate cursor-pointer text-left"
                                >
                                  {perfume?.name || 'Fragrance'}
                                </button>
                              </div>
                              <span className="hidden sm:inline font-mono text-[12px] text-[#5c5c5c] shrink-0">
                                {wear.sprays_count || 3}x (-{wear.ml_decremented || 0.5}ml)
                              </span>
                              {wear.mood && (
                                <span className="hidden md:inline text-[12px] px-2 py-0.5 bg-[#f4f3e6] border border-[#d9d7c9] text-[#333333] shrink-0">
                                  {wear.mood}
                                </span>
                              )}
                              {wear.compliments ? (
                                <span className="hidden lg:flex items-center gap-1 text-[12px] text-[#000000] font-mono font-medium shrink-0">
                                  <Heart className="w-3 h-3 text-[#333333]" />
                                  +{wear.compliments}
                                </span>
                              ) : null}
                              {wear.note && (
                                <span className="hidden xl:inline text-[12px] text-[#5c5c5c] italic truncate max-w-xs">
                                  “{wear.note}”
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartStoryFromWear(wear)}
                                className="text-[12px] font-medium text-[#000000] hover:underline px-2 py-1 cursor-pointer"
                              >
                                + {locale === 'id' ? 'Jadikan Cerita' : 'Pen Story'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteWearLog(wear.id)}
                                className="p-1.5 text-[#8a8a8a] hover:text-[#b3261e] transition cursor-pointer"
                                title="Hapus log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
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
      {/* TAB 2: SCENT STORIES & MEMORIES (WITH AUTOSAVE DRAFT)           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          
          {/* Draft Autosave notification banner */}
          {draftSavedNotice && (
            <div className="p-3 bg-[#f4f3e6] border border-[#8a8a8a] text-[#000000] text-[12px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Edit3 className="w-3.5 h-3.5 text-[#333333]" />
                {draftSavedNotice}
              </span>
              {!isStoryEditorOpen && (
                <button
                  onClick={() => setIsStoryEditorOpen(true)}
                  className="font-bold underline text-[12px] text-[#000000]"
                >
                  {locale === 'id' ? 'Buka Editor Draft →' : 'Open Draft →'}
                </button>
              )}
            </div>
          )}

          {/* New Story Editor Trigger / Form */}
          {!isStoryEditorOpen ? (
            <div className="bg-[#fffef2] border border-[#333333] p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-sans text-[20px] font-medium text-[#000000]">
                  {locale === 'id' ? 'Abadikan Memori & Cerita Aromamu' : 'Capture Your Scent Memories'}
                </h3>
                <p className="text-[14px] text-[#5c5c5c] max-w-xl">
                  {locale === 'id'
                    ? 'Aroma memiliki kaitan paling erat dengan memori dan emosi. Tuliskan momen spesial saat kamu memakai parfum tertentu—draft akan tersimpan otomatis saat mengetik.'
                    : 'Fragrances are deeply intertwined with emotion and memory. Craft your personal olfactory memoir with real-time draft autosaving.'}
                </p>
              </div>

              <button
                onClick={() => setIsStoryEditorOpen(true)}
                className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'id' ? 'Mulai Menulis Cerita' : 'Write Scent Story'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#fffef2] border border-[#333333] p-6 md:p-8 space-y-6 relative">
              <div className="flex items-center justify-between border-b border-[#d9d7c9] pb-4">
                <div className="space-y-1">
                  <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                    {locale === 'id' ? 'Pembuat Cerita Aroma' : 'Scent Story Publisher'}
                  </span>
                  <h3 className="font-sans text-[20px] font-medium text-[#000000]">
                    {locale === 'id' ? 'Tulis Catatan Memori Olfaktif' : 'Pen Scent Story'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-mono text-[#5c5c5c]">
                    {draftState === 'saving'
                      ? (locale === 'id' ? 'Menyimpan…' : 'Saving…')
                      : (locale === 'id' ? 'Tersimpan' : 'Saved')}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-[12px]">
                
                {/* Perfume picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Parfum yang Terikat Cerita Ini' : 'Fragrance Subject'}
                    </label>
                    <select
                      value={storyPerfumeId}
                      onChange={e => setStoryPerfumeId(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {perfumes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.brand} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Story Title */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Judul Cerita' : 'Story Title'}
                    </label>
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={e => {
                        setStoryTitle(e.target.value);
                        handleStoryBodyChange(storyBody);
                      }}
                      placeholder={locale === 'id' ? 'Contoh: Hujan Sore di Kemang & Hangatnya Vanilla' : 'Story title'}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2.5 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Mood, Occasion, Weather */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block text-[#000000]">{locale === 'id' ? 'Suasana Hati' : 'Mood'}</label>
                    <select
                      value={storyMood}
                      onChange={e => setStoryMood(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block text-[#000000]">{locale === 'id' ? 'Konteks Acara' : 'Occasion'}</label>
                    <select
                      value={storyOccasion}
                      onChange={e => setStoryOccasion(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block text-[#000000]">{locale === 'id' ? 'Cuaca / Tempat' : 'Weather'}</label>
                    <select
                      value={storyWeather}
                      onChange={e => setStoryWeather(e.target.value)}
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    >
                      {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Body narrative with autosave */}
                <div className="space-y-1.5">
                  <label className="font-semibold block flex justify-between items-center text-[#000000]">
                    <span>{locale === 'id' ? 'Kisah & Narasi Memori' : 'Story Narrative'}</span>
                    <span className="font-mono tabular-nums text-[12px] text-[#5c5c5c]">
                      {storyBody.trim().length} karakter (minimal 20 karakter untuk publikasi)
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={storyBody}
                    onChange={e => handleStoryBodyChange(e.target.value)}
                    placeholder={locale === 'id' ? 'Ceritakan suasana hari itu, siapa yang ada bersamamu, bagaimana aroma ini berbaur dengan udara sekitar...' : 'Narrate your memory...'}
                    className="w-full bg-[#fffef2] border border-[#8a8a8a] p-3 text-[14px] leading-relaxed outline-none focus:border-[#333333] text-[#000000]"
                  />
                </div>

                {/* Tags and visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold block text-[#000000]">
                      {locale === 'id' ? 'Tag Momen (Pisahkan koma)' : 'Tags (Comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={storyTagsInput}
                      onChange={e => setStoryTagsInput(e.target.value)}
                      placeholder="Kemang, Hujan, Senja, Kencan, Nostalgia"
                      className="w-full bg-[#fffef2] border border-[#8a8a8a] p-2 text-[14px] text-[#000000] outline-none min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-[#fffef2] border border-[#8a8a8a] cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={isStoryPublic}
                        onChange={e => setIsStoryPublic(e.target.checked)}
                        className="accent-[#333333] w-4 h-4"
                      />
                      <span className="font-medium text-[12px] text-[#000000]">
                        {locale === 'id' ? 'Tampilkan di Linimasa Komunitas Senstoria' : 'Share to Community Timeline'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d9d7c9]">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('senstoria_story_draft');
                      setStoryTitle('');
                      setStoryBody('');
                      setIsStoryEditorOpen(false);
                      setDraftSavedNotice(null);
                    }}
                    className="min-h-[48px] text-[12px] text-[#b3261e] hover:underline px-2"
                  >
                    {locale === 'id' ? 'Buang Draft' : 'Discard Draft'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePublishStory('draft')}
                      className="min-h-[48px] px-5 py-2 border border-[#8a8a8a] hover:border-[#333333] text-[14px] font-medium text-[#000000]"
                    >
                      {locale === 'id' ? 'Simpan Sebagai Draft' : 'Save as Draft'}
                    </button>

                    <button
                      type="button"
                      disabled={storyBody.trim().length < 20}
                      onClick={() => handlePublishStory('published')}
                      className={`min-h-[48px] px-6 py-2 bg-[#333333] text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition ${
                        storyBody.trim().length < 20 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{locale === 'id' ? 'Publikasikan Cerita' : 'Publish Story'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stories Timeline Feed */}
          <div className="space-y-4">
            <h3 className="font-sans text-[20px] font-medium text-[#000000]">
              {locale === 'id' ? 'Linimasa Cerita & Memori Aroma' : 'Scent Memory Timeline'}
            </h3>

            {filteredStories.length === 0 ? (
              <div className="p-8 text-center bg-[#fffef2] border border-[#d9d7c9] space-y-2">
                <BookOpen className="w-8 h-8 text-[#5c5c5c] mx-auto opacity-40" />
                <p className="text-[14px] text-[#5c5c5c]">
                  {locale === 'id' ? 'Belum ada cerita yang cocok dengan filter pencarian.' : 'No scent stories found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupTimelineByDate(filteredStories, locale, 'story_date').map(group => (
                  <div key={group.dateLabel} className="space-y-4">
                    <h4 className="font-serif text-[22px] md:text-[26px] font-normal text-[#000000] border-b border-[#d9d7c9] pb-2 pt-2">
                      {group.dateLabel}
                    </h4>
                    <div className="space-y-4">
                      {group.items.map(story => {
                        const perfume = perfumes.find(p => p.id === story.perfume_id);

                        return (
                          <article
                            key={story.id}
                            className="w-full bg-white border border-[#d9d7c9] p-6 md:p-8 space-y-4 hover:border-[#333333] transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9d7c9] pb-3 text-xs text-[#5c5c5c]">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold uppercase tracking-wider text-[#000000]">{perfume?.brand}</span>
                                {perfume && (
                                  <>
                                    <span>·</span>
                                    <button 
                                      type="button"
                                      onClick={() => onSelectPerfume(perfume.id)}
                                      className="font-medium hover:underline text-[#000000] cursor-pointer"
                                    >
                                      {perfume.name}
                                    </button>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {story.mood && (
                                  <span className="bg-[#f4f3e6] px-2 py-0.5 border border-[#d9d7c9] font-medium text-[#000000] text-[12px]">
                                    {story.mood}
                                  </span>
                                )}
                                {story.occasion && (
                                  <span className="border border-[#d9d7c9] px-2 py-0.5 text-[#5c5c5c] text-[12px]">
                                    {story.occasion}
                                  </span>
                                )}
                              </div>
                            </div>

                            {story.title && (
                              <h4 className="font-serif text-[22px] md:text-[26px] leading-[30px] md:leading-[34px] font-normal text-[#000000]">
                                {story.title}
                              </h4>
                            )}

                            {/* Generous reading body: font-size >= 16px, line-height 1.6 */}
                            <p className="text-[16px] md:text-[18px] leading-[1.6] text-[#1a1a1a] font-serif whitespace-pre-line">
                              {story.body}
                            </p>

                            {story.tags && story.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {story.tags.map(t => (
                                  <span key={t} className="text-[12px] font-mono text-[#5c5c5c] bg-[#f4f3e6] border border-[#d9d7c9] px-2 py-0.5">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="pt-3 border-t border-[#d9d7c9] flex items-center justify-between text-[12px] text-[#5c5c5c]">
                              <span className="font-mono">@{story.user_name || 'senstoria'}</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => onDeleteStory(story.id)}
                                  className="p-2 text-[#8a8a8a] hover:text-[#b3261e] transition cursor-pointer"
                                  title="Hapus cerita"
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
          
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#fffef2] border border-[#333333] p-5">
            <div className="space-y-1">
              <span className="text-[12px] font-mono uppercase tracking-widest text-[#5c5c5c] font-medium block">
                {locale === 'id' ? 'Evaluasi Komunitas Independen' : 'Independent Reviews'}
              </span>
              <h3 className="font-sans text-[20px] font-medium text-[#000000]">
                {locale === 'id' ? 'Ulasan Multi-Kriteria Terverifikasi' : 'Multi-Criteria Reviews Hub'}
              </h3>
              <p className="text-[14px] text-[#5c5c5c]">
                {locale === 'id'
                  ? 'Bebas sponsor komersial. Data ketahanan nyata kulit, sillage, dan niat beli ulang dari anggota terverifikasi.'
                  : 'Zero commercial bias. Real longevity, projection, and repurchase data from verified wearers.'}
              </p>
            </div>

            <button
              onClick={() => onOpenReviewModal()}
              className="min-h-[48px] px-6 py-2.5 bg-[#333333] hover:bg-black text-[#fffef2] text-[14px] font-medium flex items-center gap-2 transition"
            >
              <Star className="w-4 h-4 text-[#fffef2]" />
              <span>{locale === 'id' ? 'Tulis Ulasan Baru' : 'Write Review'}</span>
            </button>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center bg-[#fffef2] border border-[#d9d7c9] space-y-2">
              <Star className="w-8 h-8 text-[#5c5c5c] mx-auto opacity-40" />
              <p className="text-[14px] text-[#5c5c5c]">
                {locale === 'id' ? 'Belum ada ulasan yang sesuai dengan filter.' : 'No reviews match your filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(rev => {
                const perfume = perfumes.find(p => p.id === rev.perfume_id);

                return (
                  <div
                    key={rev.id}
                    className="bg-[#fffef2] border border-[#d9d7c9] p-5 md:p-6 space-y-4 hover:border-[#333333] transition"
                  >
                    {/* Review Top Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d9d7c9] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-[#000000]">{rev.user_name}</span>
                          {rev.user_badge && (
                            <span className="bg-[#f4f3e6] text-[#000000] border border-[#d9d7c9] text-[12px] font-mono px-2 py-0.5">
                              ✓ {rev.user_badge}
                            </span>
                          )}
                        </div>
                        {perfume && (
                          <p 
                            onClick={() => onSelectPerfume(perfume.id)}
                            className="font-sans text-[18px] leading-[24px] font-medium text-[#000000] hover:underline cursor-pointer pt-0.5"
                          >
                            {perfume.brand} — {perfume.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#f4f3e6] px-3 py-1.5 border border-[#d9d7c9]">
                        <Star className="w-4 h-4 fill-[#333333] text-[#333333]" />
                        <span className="font-mono tabular-nums text-[14px] font-bold text-[#000000]">{rev.rating.toFixed(1)}</span>
                        <span className="text-[12px] text-[#5c5c5c]">/ 5.0</span>
                      </div>
                    </div>

                    {/* Multi-Criteria Spec Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] bg-[#f4f3e6] p-3 border border-[#d9d7c9]">
                      <div>
                        <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block">Daya Tahan Kulit</span>
                        <span className="font-semibold text-[#000000]">{rev.longevity_band}</span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block">Proyeksi (Sillage)</span>
                        <span className="font-semibold capitalize text-[#000000]">{rev.sillage}</span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block">Beli Ulang</span>
                        <span className="font-semibold text-[#000000]">
                          {rev.repurchase_intent === 'yes_definitely' ? '✓ Pasti Beli Lagi' : 'Mungkin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[12px] uppercase font-medium text-[#5c5c5c] block">Format Pemakaian</span>
                        <span className="font-semibold text-[#000000]">
                          {rev.format_used === 'full_bottle' ? 'Botol Penuh' : 'Decant / Sample'}
                        </span>
                      </div>
                    </div>

                    {/* Headline & Body Text */}
                    <div className="space-y-1.5 text-[14px]">
                      <h4 className="font-sans text-[16px] font-medium text-[#000000]">{rev.title}</h4>
                      <p className="text-[#333333] leading-relaxed">
                        {rev.review_text}
                      </p>
                    </div>

                    {/* Pros & Cons chips */}
                    {(rev.pros || rev.cons) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] pt-1">
                        {rev.pros && rev.pros.length > 0 && (
                          <div className="space-y-1 bg-[#f4f3e6] p-3 border border-[#d9d7c9]">
                            <span className="text-[12px] font-bold text-[#000000] uppercase block">+ Kelebihan:</span>
                            <ul className="text-[12px] text-[#333333] space-y-0.5">
                              {rev.pros.map((p, i) => <li key={i}>• {p}</li>)}
                            </ul>
                          </div>
                        )}
                        {rev.cons && rev.cons.length > 0 && (
                          <div className="space-y-1 bg-[#f4f3e6] p-3 border border-[#d9d7c9]">
                            <span className="text-[12px] font-bold text-[#b3261e] uppercase block">- Kekurangan:</span>
                            <ul className="text-[12px] text-[#333333] space-y-0.5">
                              {rev.cons.map((c, i) => <li key={i}>• {c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / Helpful button (secondary action) */}
                    <div className="flex items-center justify-between text-[12px] text-[#5c5c5c] pt-2 border-t border-[#d9d7c9]">
                      <span className="font-mono tabular-nums">
                        {new Date(rev.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>

                      <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f4f3e6] hover:border-[#333333] border border-[#d9d7c9] text-[12px] font-medium text-[#000000] transition min-h-[44px]">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#333333]" />
                        <span>Membantu ({rev.helpful_count || 12})</span>
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
      <div className="lg:hidden fixed bottom-20 left-0 right-0 px-4 py-2 z-30 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            setActiveTab('wear_logs');
            const elem = document.getElementById('quick-logger-card');
            if (elem) {
              elem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="pointer-events-auto w-full min-h-[48px] bg-[#333333] hover:bg-black text-[#fffef2] text-sm font-medium shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition"
        >
          <Droplet className="w-4 h-4" />
          <span>{locale === 'id' ? 'Catat Semprotan Hari Ini' : "Log Today's Wear"}</span>
        </button>
      </div>

    </div>
  );
}
