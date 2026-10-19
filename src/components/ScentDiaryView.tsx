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
import { Locale, formatCurrency } from '../lib/i18n.ts';
import { MOOD_OPTIONS, OCCASION_OPTIONS, WEATHER_OPTIONS, LONGEVITY_BANDS, SILLAGE_OPTIONS } from '../data/seedDiaryData.ts';

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
  const [draftSavedNotice, setDraftSavedNotice] = useState<string | null>(null);

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
          setDraftSavedNotice(locale === 'id' ? 'Draft tersimpan ditemukan' : 'Draft recovered');
        }
      }
    } catch {
      // Ignore draft read errors
    }
  }, [locale]);

  // Autosave story draft on change
  const handleStoryBodyChange = (val: string) => {
    setStoryBody(val);
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
      setDraftSavedNotice(locale === 'id' ? 'Draft tersimpan otomatis' : 'Draft autosaved');
    } catch {
      // Ignore draft save error
    }
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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D9D7C9] pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
            {locale === 'id' ? 'Buku Harian Aroma & Memori (Phase 4)' : 'Scent Diary & Journal (Phase 4)'}
          </span>
          <h1 className="font-serif text-4xl font-normal">
            {locale === 'id' ? 'Buku Harian Semprot & Cerita Aroma' : 'Scent Diary & Memory Stories'}
          </h1>
          <p className="text-xs text-[#5C5C5C] max-w-2xl leading-relaxed">
            {locale === 'id'
              ? 'Catat semprotan 1-tap otomatis mengurangi sisa cairan botol, rangkai cerita aroma yang terikat kenangan dengan autosave draft, dan bagikan ulasan multi-kriteria jujur.'
              : 'Log daily wears with 1-tap auto volume decrement, craft scent memories with draft autosaving, and contribute honest multi-criteria evaluations.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('stories');
              setIsStoryEditorOpen(true);
            }}
            className="px-4 py-2 bg-white border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8A4B14]" />
            <span>{locale === 'id' ? 'Tulis Cerita (+)' : 'Pen Story (+)'}</span>
          </button>

          <button
            onClick={() => onOpenReviewModal()}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>{locale === 'id' ? 'Tulis Ulasan' : 'Write Review'}</span>
          </button>
        </div>
      </div>

      {/* ── STATS GLANCE CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Total Wears */}
        <div className="bg-white p-4 border border-[#D9D7C9] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#5C5C5C]">
            <span>{locale === 'id' ? 'Total Semprot' : 'Logged Wears'}</span>
            <Droplet className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="font-serif text-3xl font-bold">{diaryStats.totalWears}</p>
          <span className="text-[11px] text-[#5C5C5C] block">
            {activeBottles.length} {locale === 'id' ? 'botol aktif di lemari' : 'active bottles'}
          </span>
        </div>

        {/* Compliments */}
        <div className="bg-white p-4 border border-[#D9D7C9] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#5C5C5C]">
            <span>{locale === 'id' ? 'Pujian Diterima' : 'Compliments'}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
          <p className="font-serif text-3xl font-bold">{diaryStats.totalCompliments}</p>
          <span className="text-[11px] text-[#5C5C5C] block">
            {locale === 'id' ? 'Dari rekan kerja & kerabat' : 'From colleagues & friends'}
          </span>
        </div>

        {/* Most Worn Perfume */}
        <div className="bg-white p-4 border border-[#D9D7C9] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#5C5C5C]">
            <span>{locale === 'id' ? 'Paling Sering Dipakai' : 'Top Signature'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="font-serif text-lg font-bold truncate">
            {mostWornPerfume ? mostWornPerfume.name : '—'}
          </p>
          <span className="text-[11px] text-[#5C5C5C] block truncate">
            {mostWornPerfume ? `${mostWornPerfume.brand} (${diaryStats.mostWornCount}x)` : 'Belum ada data'}
          </span>
        </div>

        {/* Stories Penned */}
        <div className="bg-white p-4 border border-[#D9D7C9] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#5C5C5C]">
            <span>{locale === 'id' ? 'Cerita Tersimpan' : 'Stories Penned'}</span>
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="font-serif text-3xl font-bold">{diaryStats.totalStories}</p>
          <span className="text-[11px] text-[#5C5C5C] block">
            {diaryStats.dominantMood ? `Mood: ${diaryStats.dominantMood}` : 'Arsip memori olfaktif'}
          </span>
        </div>

      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-[#D9D7C9] text-xs">
        <button
          onClick={() => setActiveTab('wear_logs')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'wear_logs'
              ? 'border-black text-black'
              : 'border-transparent text-[#5C5C5C] hover:text-black'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>{locale === 'id' ? '1. Log Pemakaian Harian' : '1. Daily Wear Logs'}</span>
          <span className="font-mono text-[11px] opacity-75">({wearLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'stories'
              ? 'border-black text-black'
              : 'border-transparent text-[#5C5C5C] hover:text-black'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{locale === 'id' ? '2. Cerita Aroma & Memori' : '2. Scent Stories & Memories'}</span>
          <span className="font-mono text-[11px] opacity-75">({stories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-black text-black'
              : 'border-transparent text-[#5C5C5C] hover:text-black'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>{locale === 'id' ? '3. Ulasan Multi-Kriteria' : '3. Multi-Criteria Reviews'}</span>
          <span className="font-mono text-[11px] opacity-75">({reviews.length})</span>
        </button>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#D9D7C9] text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-[#5C5C5C]">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={locale === 'id' ? 'Cari di buku harian & cerita...' : 'Search diary and stories...'}
              className="bg-transparent outline-none text-xs w-48 sm:w-64"
            />
          </div>

          <span className="text-[#D9D7C9] hidden sm:inline">|</span>

          {/* Perfume Filter dropdown */}
          <select
            value={filterPerfumeId}
            onChange={e => setFilterPerfumeId(e.target.value)}
            className="bg-transparent border border-[#D9D7C9] p-1.5 text-xs outline-none"
          >
            <option value="all">{locale === 'id' ? 'Semua Parfum' : 'All Fragrances'}</option>
            {perfumes.map(p => (
              <option key={p.id} value={p.id}>
                {p.brand} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-[#5C5C5C] font-mono">
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
          <div className="bg-[#FFFEF2] border border-[#333333] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D9D7C9] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
                  {locale === 'id' ? 'Quick Action Pemakaian' : 'Quick Wear Logger'}
                </span>
                <h3 className="font-serif text-xl font-bold">
                  {locale === 'id' ? 'Catat Semprotan Hari Ini' : "Log Today's Scent"}
                </h3>
              </div>
              <span className="text-[11px] text-[#5C5C5C]">
                -0.5 ml per log · Undo 8 detik
              </span>
            </div>

            {activeBottles.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-white border border-[#D9D7C9]">
                <p className="text-xs text-[#5C5C5C]">
                  {locale === 'id' 
                    ? 'Belum ada botol aktif di lemari koleksimu. Tambahkan botol terlebih dahulu untuk mencatat semprotan harian.' 
                    : 'No active bottles in your library. Add a bottle to start logging wears.'}
                </p>
                <button
                  onClick={onNavigateToLibrary}
                  className="px-4 py-2 bg-[#1A1A1A] text-[#FFFEF2] text-xs font-semibold"
                >
                  {locale === 'id' ? 'Buka Lemari Koleksi' : 'Open Library'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickLogSubmit} className="space-y-4 text-xs">
                
                {quickLogSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
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
                    <label className="font-semibold block text-[#1A1A1A]">
                      {locale === 'id' ? 'Pilih Botol yang Dipakai' : 'Select Bottle'}
                    </label>
                    <select
                      value={selectedBottleId}
                      onChange={e => setSelectedBottleId(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
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
                    <label className="font-semibold block text-[#1A1A1A]">
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
                          className={`py-2 text-[11px] border font-medium transition ${
                            spraysCount === item.count
                              ? 'bg-black text-[#FFFEF2] border-black'
                              : 'bg-white border-[#D9D7C9] hover:bg-[#F4F3E6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#1A1A1A]">
                      {locale === 'id' ? 'Suasana Hati (Mood)' : 'Mood Tag'}
                    </label>
                    <select
                      value={selectedMood}
                      onChange={e => setSelectedMood(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
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
                    <label className="font-semibold block text-[#1A1A1A]">
                      {locale === 'id' ? 'Konteks / Acara' : 'Occasion'}
                    </label>
                    <select
                      value={selectedOccasion}
                      onChange={e => setSelectedOccasion(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
                    >
                      {OCCASION_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Weather */}
                  <div className="space-y-1.5">
                    <label className="font-semibold block text-[#1A1A1A]">
                      {locale === 'id' ? 'Cuaca / Ruangan' : 'Weather / Setting'}
                    </label>
                    <select
                      value={selectedWeather}
                      onChange={e => setSelectedWeather(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
                    >
                      {WEATHER_OPTIONS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Compliment Checkbox */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 bg-white border border-[#D9D7C9] cursor-pointer hover:border-black transition">
                      <input
                        type="checkbox"
                        checked={complimentReceived}
                        onChange={e => setComplimentReceived(e.target.checked)}
                        className="accent-[#8A4B14] w-4 h-4"
                      />
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span className="font-semibold text-[11px]">
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
                    className="w-full bg-white border border-[#D9D7C9] p-2 text-xs focus:border-black outline-none"
                    maxLength={140}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#8A4B14] hover:bg-[#6e3b0f] text-[#FFFEF2] font-semibold text-xs flex items-center gap-2 transition"
                  >
                    <Droplet className="w-3.5 h-3.5" />
                    <span>{locale === 'id' ? 'Simpan ke Buku Harian (-0.5 ml)' : 'Save to Diary (-0.5 ml)'}</span>
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* Wear Logs Timeline List */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal">
              {locale === 'id' ? 'Riwayat Semprot Terkini' : 'Recent Wear History'}
            </h3>

            {filteredWearLogs.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#D9D7C9] space-y-2">
                <Droplet className="w-8 h-8 text-[#5C5C5C] mx-auto opacity-40" />
                <p className="text-xs text-[#5C5C5C]">
                  {locale === 'id' ? 'Belum ada catatan pemakaian yang cocok dengan filter.' : 'No wear logs matching your filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWearLogs.map(wear => {
                  const perfume = perfumes.find(p => p.id === wear.perfume_id);
                  const bottle = bottles.find(b => b.id === wear.bottle_id);
                  const wearDate = new Date(wear.worn_on).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={wear.id}
                      className="bg-white border border-[#D9D7C9] p-4 flex flex-wrap md:flex-nowrap items-start justify-between gap-4 hover:border-black transition"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#5C5C5C]">
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {wearDate}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-black">{perfume?.brand || 'Brand'}</span>
                          <span>·</span>
                          <span className="border border-neutral-300 px-1.5 py-0.2">
                            {wear.sprays_count || 3} semprot (-{wear.ml_decremented || 0.5}ml)
                          </span>
                          {wear.compliments ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 font-bold flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 fill-rose-600" />
                              +{wear.compliments} Pujian
                            </span>
                          ) : null}
                        </div>

                        <h4 
                          onClick={() => perfume && onSelectPerfume(perfume.id)}
                          className="font-serif text-lg font-bold hover:underline cursor-pointer"
                        >
                          {perfume ? perfume.name : 'Unknown Fragrance'}
                        </h4>

                        {/* Mood & Context Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {wear.mood && (
                            <span className="bg-[#F4F3E6] border border-[#D9D7C9] px-2 py-0.5 text-neutral-800">
                              Mood: <strong>{wear.mood}</strong>
                            </span>
                          )}
                          {wear.occasion && (
                            <span className="bg-[#F4F3E6] border border-[#D9D7C9] px-2 py-0.5 text-neutral-800">
                              {wear.occasion}
                            </span>
                          )}
                          {wear.weather && (
                            <span className="border border-neutral-200 px-2 py-0.5 text-[#5C5C5C]">
                              {wear.weather}
                            </span>
                          )}
                        </div>

                        {wear.note && (
                          <p className="text-xs text-[#5C5C5C] italic bg-[#FFFEF2] p-2 border-l-2 border-[#8A4B14]">
                            "{wear.note}"
                          </p>
                        )}
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        <button
                          onClick={() => handleStartStoryFromWear(wear)}
                          className="px-3 py-1.5 bg-[#F4F3E6] hover:bg-neutral-200 border border-[#D9D7C9] text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Tulis Cerita Aroma dari semprotan ini"
                        >
                          <BookOpen className="w-3 h-3 text-[#8A4B14]" />
                          <span>{locale === 'id' ? 'Jadikan Cerita' : 'Pen Story'}</span>
                        </button>

                        <button
                          onClick={() => onDeleteWearLog(wear.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition"
                          title="Hapus log pemakaian ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
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
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                {draftSavedNotice}
              </span>
              {!isStoryEditorOpen && (
                <button
                  onClick={() => setIsStoryEditorOpen(true)}
                  className="font-bold underline text-xs"
                >
                  {locale === 'id' ? 'Buka Editor Draft →' : 'Open Draft →'}
                </button>
              )}
            </div>
          )}

          {/* New Story Editor Trigger / Form */}
          {!isStoryEditorOpen ? (
            <div className="bg-[#FFFEF2] border border-[#333333] p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold">
                  {locale === 'id' ? 'Abadikan Memori & Cerita Aromamu' : 'Capture Your Scent Memories'}
                </h3>
                <p className="text-xs text-[#5C5C5C] max-w-xl">
                  {locale === 'id'
                    ? 'Aroma memiliki kaitan paling erat dengan memori dan emosi. Tuliskan momen spesial saat kamu memakai parfum tertentu—draft akan tersimpan otomatis saat mengetik.'
                    : 'Fragrances are deeply intertwined with emotion and memory. Craft your personal olfactory memoir with real-time draft autosaving.'}
                </p>
              </div>

              <button
                onClick={() => setIsStoryEditorOpen(true)}
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'id' ? 'Mulai Menulis Cerita' : 'Write Scent Story'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFEF2] border-2 border-[#1A1A1A] p-6 md:p-8 space-y-6 shadow-md relative">
              <div className="flex items-center justify-between border-b border-[#D9D7C9] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
                    {locale === 'id' ? 'Pembuat Cerita Aroma (Scent Story)' : 'Scent Story Publisher'}
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    {locale === 'id' ? 'Tulis Catatan Memori Olfaktif' : 'Pen Scent Story'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                    ✓ Autosave Aktif
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Perfume picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold block">
                      {locale === 'id' ? 'Parfum yang Terikat Cerita Ini' : 'Fragrance Subject'}
                    </label>
                    <select
                      value={storyPerfumeId}
                      onChange={e => setStoryPerfumeId(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs font-serif outline-none"
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
                    <label className="font-semibold block">
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
                      className="w-full bg-white border border-[#D9D7C9] p-2.5 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Mood, Occasion, Weather */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block">{locale === 'id' ? 'Suasana Hati' : 'Mood'}</label>
                    <select
                      value={storyMood}
                      onChange={e => setStoryMood(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2 text-xs outline-none"
                    >
                      {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block">{locale === 'id' ? 'Konteks Acara' : 'Occasion'}</label>
                    <select
                      value={storyOccasion}
                      onChange={e => setStoryOccasion(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2 text-xs outline-none"
                    >
                      {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block">{locale === 'id' ? 'Cuaca / Tempat' : 'Weather'}</label>
                    <select
                      value={storyWeather}
                      onChange={e => setStoryWeather(e.target.value)}
                      className="w-full bg-white border border-[#D9D7C9] p-2 text-xs outline-none"
                    >
                      {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Body narrative with autosave */}
                <div className="space-y-1.5">
                  <label className="font-semibold block flex justify-between items-center">
                    <span>{locale === 'id' ? 'Kisah & Narasi Memori' : 'Story Narrative'}</span>
                    <span className="font-mono text-[10px] text-[#5C5C5C]">
                      {storyBody.trim().length} karakter (minimal 20 karakter untuk publikasi)
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={storyBody}
                    onChange={e => handleStoryBodyChange(e.target.value)}
                    placeholder={locale === 'id' ? 'Ceritakan suasana hari itu, siapa yang ada bersamamu, bagaimana aroma ini berbaur dengan udara sekitar...' : 'Narrate your memory...'}
                    className="w-full bg-white border border-[#D9D7C9] p-3 text-xs leading-relaxed outline-none focus:border-black font-serif text-sm"
                  />
                </div>

                {/* Tags and visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold block">
                      {locale === 'id' ? 'Tag Momen (Pisahkan koma)' : 'Tags (Comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={storyTagsInput}
                      onChange={e => setStoryTagsInput(e.target.value)}
                      placeholder="Kemang, Hujan, Senja, Kencan, Nostalgia"
                      className="w-full bg-white border border-[#D9D7C9] p-2 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-white border border-[#D9D7C9] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStoryPublic}
                        onChange={e => setIsStoryPublic(e.target.checked)}
                        className="accent-[#8A4B14] w-4 h-4"
                      />
                      <span className="font-semibold text-xs">
                        {locale === 'id' ? 'Tampilkan di Linimasa Komunitas Senstoria' : 'Share to Community Timeline'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D9D7C9]">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('senstoria_story_draft');
                      setStoryTitle('');
                      setStoryBody('');
                      setIsStoryEditorOpen(false);
                      setDraftSavedNotice(null);
                    }}
                    className="text-xs text-rose-700 hover:underline"
                  >
                    {locale === 'id' ? 'Buang Draft' : 'Discard Draft'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePublishStory('draft')}
                      className="px-4 py-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs font-semibold"
                    >
                      {locale === 'id' ? 'Simpan Sebagai Draft' : 'Save as Draft'}
                    </button>

                    <button
                      type="button"
                      disabled={storyBody.trim().length < 20}
                      onClick={() => handlePublishStory('published')}
                      className={`px-6 py-2 bg-[#8A4B14] text-[#FFFEF2] text-xs font-semibold flex items-center gap-1.5 transition ${
                        storyBody.trim().length < 20 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#6e3b0f]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{locale === 'id' ? 'Publikasikan Cerita' : 'Publish Story'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stories Timeline Feed */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-normal">
              {locale === 'id' ? 'Linimasa Cerita & Memori Aroma' : 'Scent Memory Timeline'}
            </h3>

            {filteredStories.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#D9D7C9] space-y-2">
                <BookOpen className="w-8 h-8 text-[#5C5C5C] mx-auto opacity-40" />
                <p className="text-xs text-[#5C5C5C]">
                  {locale === 'id' ? 'Belum ada cerita yang cocok dengan filter pencarian.' : 'No scent stories found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredStories.map(story => {
                  const perfume = perfumes.find(p => p.id === story.perfume_id);

                  return (
                    <div
                      key={story.id}
                      className="bg-white border border-[#D9D7C9] p-6 space-y-4 flex flex-col justify-between hover:border-black transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-[#5C5C5C] border-b border-[#D9D7C9]/60 pb-2">
                          <span className="font-mono">{story.story_date || '2026-10-18'}</span>
                          <span className="bg-[#F4F3E6] px-2 py-0.5 border border-[#D9D7C9] font-bold text-neutral-800">
                            {story.mood || 'Aroma'}
                          </span>
                        </div>

                        {perfume && (
                          <div 
                            onClick={() => onSelectPerfume(perfume.id)}
                            className="cursor-pointer hover:underline"
                          >
                            <span className="text-[10px] uppercase tracking-wider text-[#8A4B14] font-bold block">
                              {perfume.brand}
                            </span>
                            <h4 className="font-serif text-xl font-bold">
                              {story.title || perfume.name}
                            </h4>
                          </div>
                        )}

                        <p className="text-xs text-[#333333] font-serif leading-relaxed line-clamp-5 italic">
                          "{story.body}"
                        </p>

                        {story.tags && story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {story.tags.map(t => (
                              <span key={t} className="text-[10px] font-mono text-[#5C5C5C] bg-[#F4F3E6] px-1.5 py-0.5">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#D9D7C9]/60 flex items-center justify-between text-[11px] text-[#5C5C5C]">
                        <span className="font-medium">Oleh: @{story.user_name || 'senstoria'}</span>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1 hover:text-rose-600 transition">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{story.likes_count || 1}</span>
                          </button>
                          <button
                            onClick={() => onDeleteStory(story.id)}
                            className="hover:text-rose-600 transition p-1"
                            title="Hapus cerita"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
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
          
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFEF2] border border-[#333333] p-5">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A4B14] font-bold">
                {locale === 'id' ? 'Evaluasi Komunitas Independen' : 'Independent Reviews'}
              </span>
              <h3 className="font-serif text-2xl font-bold">
                {locale === 'id' ? 'Ulasan Multi-Kriteria Terverifikasi' : 'Multi-Criteria Reviews Hub'}
              </h3>
              <p className="text-xs text-[#5C5C5C]">
                {locale === 'id'
                  ? 'Bebas sponsor komersial. Data ketahanan nyata kulit, sillage, dan niat beli ulang dari anggota terverifikasi.'
                  : 'Zero commercial bias. Real longevity, projection, and repurchase data from verified wearers.'}
              </p>
            </div>

            <button
              onClick={() => onOpenReviewModal()}
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] text-xs font-semibold flex items-center gap-2 transition"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>{locale === 'id' ? 'Tulis Ulasan Baru' : 'Write Review'}</span>
            </button>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#D9D7C9] space-y-2">
              <Star className="w-8 h-8 text-[#5C5C5C] mx-auto opacity-40" />
              <p className="text-xs text-[#5C5C5C]">
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
                    className="bg-white border border-[#D9D7C9] p-5 md:p-6 space-y-4 hover:border-black transition"
                  >
                    {/* Review Top Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D9D7C9]/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{rev.user_name}</span>
                          {rev.user_badge && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono px-2 py-0.5">
                              ✓ {rev.user_badge}
                            </span>
                          )}
                        </div>
                        {perfume && (
                          <p 
                            onClick={() => onSelectPerfume(perfume.id)}
                            className="font-serif text-base font-bold text-[#8A4B14] hover:underline cursor-pointer pt-0.5"
                          >
                            {perfume.brand} — {perfume.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-[#F4F3E6] px-2.5 py-1 border border-[#D9D7C9]">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="font-mono text-sm font-bold">{rev.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-[#5C5C5C]">/ 5.0</span>
                      </div>
                    </div>

                    {/* Multi-Criteria Spec Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#FFFEF2] p-3 border border-[#D9D7C9]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#5C5C5C] block">Daya Tahan Kulit</span>
                        <span className="font-semibold">{rev.longevity_band}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#5C5C5C] block">Proyeksi (Sillage)</span>
                        <span className="font-semibold capitalize">{rev.sillage}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#5C5C5C] block">Beli Ulang</span>
                        <span className="font-semibold">
                          {rev.repurchase_intent === 'yes_definitely' ? '✓ Pasti Beli Lagi' : 'Mungkin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#5C5C5C] block">Format Pemakaian</span>
                        <span className="font-semibold">
                          {rev.format_used === 'full_bottle' ? 'Botol Penuh' : 'Decant / Sample'}
                        </span>
                      </div>
                    </div>

                    {/* Headline & Body Text */}
                    <div className="space-y-1.5 text-xs">
                      <h4 className="font-serif text-lg font-bold">{rev.title}</h4>
                      <p className="text-[#333333] leading-relaxed">
                        {rev.review_text}
                      </p>
                    </div>

                    {/* Pros & Cons chips */}
                    {(rev.pros || rev.cons) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        {rev.pros && rev.pros.length > 0 && (
                          <div className="space-y-1 bg-emerald-50/50 p-2.5 border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block">+ Kelebihan:</span>
                            <ul className="text-[11px] text-emerald-950 space-y-0.5">
                              {rev.pros.map((p, i) => <li key={i}>• {p}</li>)}
                            </ul>
                          </div>
                        )}
                        {rev.cons && rev.cons.length > 0 && (
                          <div className="space-y-1 bg-rose-50/50 p-2.5 border border-rose-200">
                            <span className="text-[10px] font-bold text-rose-800 uppercase block">- Kekurangan:</span>
                            <ul className="text-[11px] text-rose-950 space-y-0.5">
                              {rev.cons.map((c, i) => <li key={i}>• {c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / Helpful button */}
                    <div className="flex items-center justify-between text-[11px] text-[#5C5C5C] pt-2 border-t border-[#D9D7C9]/60">
                      <span className="font-mono">
                        {new Date(rev.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>

                      <button className="flex items-center gap-1.5 px-3 py-1 bg-[#F4F3E6] hover:bg-neutral-200 border border-[#D9D7C9] text-xs transition">
                        <ThumbsUp className="w-3 h-3 text-[#8A4B14]" />
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

    </div>
  );
}
