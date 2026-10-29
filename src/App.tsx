import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Search, 
  RotateCcw, 
  ExternalLink, 
  Layers, 
  SlidersHorizontal, 
  ChevronRight, 
  Droplet, 
  Heart, 
  Check, 
  AlertCircle,
  Flame,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  X,
  Plus,
  HelpCircle,
  Sun,
  CloudRain,
  Moon,
  Award,
  Compass,
  MessageSquare,
  Home as HomeIcon,
  BookText
} from 'lucide-react';
import { useAuth } from './context/AuthContext.tsx';
import { translations, fmt, Locale, formatCurrency } from './lib/i18n.ts';
import { SEED_PERFUMES, SeedPerfume } from './data/seedPerfumes.ts';
import { 
  BottleState, 
  WearLogState, 
  StoryState, 
  ReviewState, 
  WaitlistState,
  SampleOrderState,
  computeCollectionSummary, 
  calculateRemainingPercentage, 
  isLowBottle,
  computeScentDna,
  computeSharedBottleStats
} from './lib/derivedCalculations.ts';
import { CatalogView } from './components/CatalogView.tsx';
import { CompareView } from './components/CompareView.tsx';
import { CompareTray } from './components/CompareTray.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { TryItFirstModal } from './components/TryItFirstModal.tsx';
import { BuyOptionsSheet } from './components/BuyOptionsSheet.tsx';
import { LogWearDetailSheet } from './components/LogWearDetailSheet.tsx';
import { BottomSheetOrModal } from './components/BottomSheetOrModal.tsx';
import { LegalModal, LegalTab } from './components/LegalModal.tsx';
import { LowBottleBanner } from './components/LowBottleBanner.tsx';
import { Bottle } from './components/Bottle.tsx';
import { 
  ScentDnaVisualisation, 
  countProfilePerfumes, 
  extractRankedTopNotes 
} from './components/ScentDnaVisualisation.tsx';
import { TryItFirstView } from './components/TryItFirstView.tsx';
import { usePrefersReducedMotion } from './lib/motion.ts';
import { 
  saveBottleToFirestore, 
  fetchUserBottlesFromFirestore,
  saveWearLogToFirestore,
  fetchUserWearLogsFromFirestore,
  saveStoryToFirestore,
  fetchUserStoriesFromFirestore,
  saveReviewToFirestore,
  fetchAllApprovedReviewsFromFirestore,
  saveWaitlistEntryToFirestore,
  fetchUserWaitlistEntriesFromFirestore,
  saveSampleOrderToFirestore,
  fetchUserSampleOrdersFromFirestore
} from './lib/firebase.ts';
import { INITIAL_WEAR_LOGS, INITIAL_SCENT_STORIES, INITIAL_REVIEWS } from './data/seedDiaryData.ts';
const ScentFinderView = React.lazy(() => import('./components/ScentFinderView.tsx').then(m => ({ default: m.ScentFinderView })));
const AdminDashboardView = React.lazy(() => import('./components/AdminDashboardView.tsx').then(m => ({ default: m.AdminDashboardView })));
const ProductDetailView = React.lazy(() => import('./components/ProductDetailView.tsx').then(m => ({ default: m.ProductDetailView })));
const LibraryView = React.lazy(() => import('./components/LibraryView.tsx').then(m => ({ default: m.LibraryView })));
const ScentDiaryView = React.lazy(() => import('./components/ScentDiaryView.tsx').then(m => ({ default: m.ScentDiaryView })));


type ScreenView = 'home' | 'library' | 'diary' | 'catalog' | 'tryItFirst' | 'finder' | 'compare' | 'detail' | 'community' | 'admin';

const INITIAL_USER_BOTTLES: BottleState[] = [
  {
    id: 'bot_001',
    perfume_id: 'prf_001', // HMNS Orgasm
    status: 'in_use',
    format: 'full',
    size_ml: 50,
    remaining_ml: 31,
    ml_per_wear: 0.5,
    price_idr: 325000,
    times_worn: 18,
    is_favorite: true
  },
  {
    id: 'bot_002',
    perfume_id: 'prf_003', // Oullu Arcanum
    status: 'in_use',
    format: 'full',
    size_ml: 50,
    remaining_ml: 42.5,
    ml_per_wear: 0.5,
    price_idr: 389000,
    times_worn: 7,
    is_favorite: false
  },
  {
    id: 'bot_003',
    perfume_id: 'prf_004', // Carl & Claire Black Orchid
    status: 'in_use',
    format: 'travel',
    size_ml: 30,
    remaining_ml: 4.2, // <= 20% -> Low bottle trigger
    ml_per_wear: 0.5,
    price_idr: 279000,
    times_worn: 24,
    is_favorite: true
  },
  {
    id: 'bot_004',
    perfume_id: 'prf_005', // Alien Objects Xandu
    status: 'in_use',
    format: 'full',
    size_ml: 50,
    remaining_ml: 36,
    ml_per_wear: 0.5,
    price_idr: 650000,
    times_worn: 12,
    is_favorite: true
  }
];

export default function App() {
  const { user, isDemoMode, backendConfigured, login, signup, logout, resetPassword, enableDemoMode, disableDemoMode } = useAuth();
  
  const [locale, setLocale] = useState<Locale>('id');

  // BR-12: <html lang> + judul dokumen mengikuti locale aktif.
  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translations[locale].app.documentTitle;
  }, [locale]);
  const [view, setView] = useState<ScreenView>('home');
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string>('prf_001');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  // Filter cross-navigation parameters (CAT-06)
  const [catalogFilterNote, setCatalogFilterNote] = useState<string | null>(null);
  const [catalogFilterBrand, setCatalogFilterBrand] = useState<string | null>(null);
  const [catalogFilterFamily, setCatalogFilterFamily] = useState<string | null>(null);

  // Custom Perfumes added privately by user (CAB-04)
  const [customPerfumes, setCustomPerfumes] = useState<SeedPerfume[]>(() => {
    try {
      const stored = localStorage.getItem('senstoria_custom_perfumes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [adminCatalogPerfumes, setAdminCatalogPerfumes] = useState<SeedPerfume[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_admin_catalog');
      return saved ? JSON.parse(saved) : SEED_PERFUMES;
    } catch {
      return SEED_PERFUMES;
    }
  });

  const allActivePerfumes = React.useMemo(() => {
    return [...adminCatalogPerfumes, ...customPerfumes];
  }, [adminCatalogPerfumes, customPerfumes]);

  // Sprint 1: fresh visitors start EMPTY. Stored data identical to the old
  // built-in seed is legacy demo data, not the visitor's collection — unless
  // explicit demo mode is on, in which case the seed is shown labelled.
  const parseStoredCollection = <T,>(key: string, legacySeed: T[]): T[] => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return isDemoMode ? [...legacySeed] : [];
      const parsed = JSON.parse(saved) as T[];
      if (!isDemoMode && JSON.stringify(parsed) === JSON.stringify(legacySeed)) return [];
      return parsed;
    } catch {
      return isDemoMode ? [...legacySeed] : [];
    }
  };

  // Bottles collection state backed by single source of truth (XC-01)
  const [bottles, setBottles] = useState<BottleState[]>(() => {
    try {
      return parseStoredCollection('senstoria_user_bottles', INITIAL_USER_BOTTLES);
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prf_002', 'prf_007']);
  const [compareIds, setCompareIds] = useState<string[]>(['prf_001', 'prf_003']);

  // Phase 4: Scent Diary, Wear Logs, Scent Stories, and Community Reviews
  const [wearLogs, setWearLogs] = useState<WearLogState[]>(() => {
    try {
      return parseStoredCollection('senstoria_wear_logs', INITIAL_WEAR_LOGS);
    } catch {
      return [];
    }
  });

  const [scentStories, setScentStories] = useState<StoryState[]>(() => {
    try {
      return parseStoredCollection('senstoria_scent_stories', INITIAL_SCENT_STORIES);
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState<ReviewState[]>(() => {
    try {
      return parseStoredCollection('senstoria_reviews', INITIAL_REVIEWS);
    } catch {
      return [];
    }
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewPerfumeIdTarget, setReviewPerfumeIdTarget] = useState<string | undefined>(undefined);

  // Sync the signed-in user's Firestore data on authentication (Sprint 1).
  // Failures are surfaced, never silently swallowed. An empty remote
  // collection keeps local state empty (honest empty state) — seed data is
  // never injected here.
  const [syncError, setSyncError] = useState<string | null>(null);
  React.useEffect(() => {
    if (!user || !backendConfigured) return;
    setSyncError(null);
    const syncFailed = (err: unknown) => {
      setSyncError(translations[locale].app.gagalMemuatDatamuDariServerPeriksaKo);
      console.warn('Could not sync from Firestore:', err);
    };

    fetchUserBottlesFromFirestore(user.uid).then(remoteBottles => {
      if (remoteBottles && remoteBottles.length > 0) {
        setBottles(remoteBottles);
        localStorage.setItem('senstoria_user_bottles', JSON.stringify(remoteBottles));
      }
    }).catch(syncFailed);

    fetchUserWearLogsFromFirestore(user.uid).then(remoteWears => {
      if (remoteWears && remoteWears.length > 0) {
        setWearLogs(remoteWears);
        localStorage.setItem('senstoria_wear_logs', JSON.stringify(remoteWears));
      }
    }).catch(syncFailed);

    fetchUserStoriesFromFirestore(user.uid).then(remoteStories => {
      if (remoteStories && remoteStories.length > 0) {
        setScentStories(prev => {
          const combined = [...remoteStories, ...prev.filter(s => !remoteStories.some(r => r.id === s.id))];
          localStorage.setItem('senstoria_scent_stories', JSON.stringify(combined));
          return combined;
        });
      }
    }).catch(syncFailed);

    fetchAllApprovedReviewsFromFirestore().then(remoteReviews => {
      if (remoteReviews && remoteReviews.length > 0) {
        setReviews(prev => {
          const combined = [...remoteReviews, ...prev.filter(r => !remoteReviews.some(rem => rem.id === r.id))];
          localStorage.setItem('senstoria_reviews', JSON.stringify(combined));
          return combined;
        });
      }
    }).catch(syncFailed);
  }, [user, backendConfigured, locale]);

  // Explicit demo mode (Sprint 1): labelled sample data, only on request,
  // only while logged out and the local collections are empty.
  const handleEnableDemoMode = () => {
    if (user) return;
    setBottles(INITIAL_USER_BOTTLES);
    setWearLogs(INITIAL_WEAR_LOGS);
    setScentStories(INITIAL_SCENT_STORIES);
    setReviews(INITIAL_REVIEWS);
    localStorage.setItem('senstoria_user_bottles', JSON.stringify(INITIAL_USER_BOTTLES));
    localStorage.setItem('senstoria_wear_logs', JSON.stringify(INITIAL_WEAR_LOGS));
    localStorage.setItem('senstoria_scent_stories', JSON.stringify(INITIAL_SCENT_STORIES));
    localStorage.setItem('senstoria_reviews', JSON.stringify(INITIAL_REVIEWS));
    enableDemoMode();
  };
  const handleDisableDemoMode = () => {
    disableDemoMode();
    setBottles([]);
    setWearLogs([]);
    setScentStories([]);
    setReviews([]);
    localStorage.removeItem('senstoria_user_bottles');
    localStorage.removeItem('senstoria_wear_logs');
    localStorage.removeItem('senstoria_scent_stories');
    localStorage.removeItem('senstoria_reviews');
  };
  React.useEffect(() => {
    if (user && isDemoMode) handleDisableDemoMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Modals & UI states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBirthDate, setAuthBirthDate] = useState('2000-01-01');
  const [authTermsAccepted, setAuthTermsAccepted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  

  // Buy / Repurchase sheet state
  const [buyPerfume, setBuyPerfume] = useState<SeedPerfume | null>(null);

  // Detailed Log Wear Sheet state
  const [isLogWearDetailOpen, setIsLogWearDetailOpen] = useState<boolean>(false);
  const [wearDetailInitialBottleId, setWearDetailInitialBottleId] = useState<string | undefined>(undefined);

  // Try It First (Phase 6) State & Feature Flag
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistPerfumeId, setWaitlistPerfumeId] = useState<string>('prf_001');
  const [flagTryItFirstOrdering, setFlagTryItFirstOrdering] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('senstoria_flag_try_it_first_ordering');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [waitlists, setWaitlists] = useState<WaitlistState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_waitlist_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sampleOrders, setSampleOrders] = useState<SampleOrderState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_sample_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Feature Flags (ADM-10)
  const [allFeatureFlags, setAllFeatureFlags] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('senstoria_feature_flags');
      return saved ? JSON.parse(saved) : {
        try_it_first_ordering: false,
        affiliate_buttons: true,
        ai_gemini_rephrase: true,
        community_reviews: true
      };
    } catch {
      return {
        try_it_first_ordering: false,
        affiliate_buttons: true,
        ai_gemini_rephrase: true,
        community_reviews: true
      };
    }
  });

  // Global Toast notification state (C3, 8 seconds duration)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const [toastExtraAction, setToastExtraAction] = useState<(() => void) | null>(null);
  const [toastExtraLabel, setToastExtraLabel] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  // Scent Finder State
  const [finderClimate, setFinderClimate] = useState<string>('tropical');

  // Legal Modal & UU PDP Center State (Phase 8 Hardening)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const handleOpenLegalModal = (tab: LegalTab = 'privacy') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Live Affiliate Click Tracking from Express backend (AFF-02, ADM-01)
  const [adminClicks, setAdminClicks] = useState<{ totalCounted: number; clicks: any[] }>({
    totalCounted: 128,
    clicks: []
  });

  const fetchAdminClicks = async () => {
    try {
      const res = await fetch('/api/admin/clicks');
      if (res.ok) {
        const data = await res.json();
        setAdminClicks(prev => ({
          totalCounted: 128 + (data.totalCounted || 0),
          clicks: data.clicks || []
        }));
      }
    } catch {
      // offline/dev fallback
    }
  };

  React.useEffect(() => {
    if (view === 'admin' && user?.isAdmin) {
      fetchAdminClicks();
    }
  }, [view, user]);

  const t = translations[locale];

  // Derived Values calculation via Shared Derived Values Module (XC-01)
  const sharedBottleStats = React.useMemo(() => computeSharedBottleStats(bottles, allActivePerfumes), [bottles, allActivePerfumes]);
  const summary = computeCollectionSummary(bottles, wearLogs, scentStories);
  const currentlyWearingBottles = bottles.filter(b => b.status === 'in_use' || b.status === 'sealed');

  const selectedPerfume = allActivePerfumes.find(p => p.id === selectedPerfumeId) || allActivePerfumes[0];
  const comparePerfumes = compareIds
    .map(id => allActivePerfumes.find(p => p.id === id))
    .filter((p): p is SeedPerfume => Boolean(p));

  const homeScentDna = sharedBottleStats.scentDna;
  const profilePerfumesCount = React.useMemo(() => countProfilePerfumes(bottles), [bottles]);
  const rankedTopNotes = React.useMemo(() => extractRankedTopNotes(bottles, allActivePerfumes, 8), [bottles, allActivePerfumes]);

  // Helper to show 8s toast with optional undo and extra action
  const showToast = (message: string, onUndo?: () => void, onExtra?: () => void, extraLabel?: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(message);
    setUndoAction(onUndo ? () => onUndo : null);
    setToastExtraAction(onExtra ? () => onExtra : null);
    setToastExtraLabel(extraLabel || null);

    const timer = setTimeout(() => {
      setToastMessage(null);
      setUndoAction(null);
      setToastExtraAction(null);
      setToastExtraLabel(null);
    }, 8000);
    setToastTimer(timer);
  };

  // 1-Tap wear logger with auto-decrement & wear log history (CAB-06, BR-02, Phase 4)
  const handleLogWear = (bottleId: string) => {
    const target = bottles.find(b => b.id === bottleId);
    if (!target || target.remaining_ml <= 0) return;

    const prevMl = target.remaining_ml;
    const decrement = target.ml_per_wear || 0.5;
    const newRemaining = Math.max(0, Number((prevMl - decrement).toFixed(1)));

    const perfume = allActivePerfumes.find(p => p.id === target.perfume_id);
    const perfumeName = perfume ? `${perfume.brand} — ${perfume.name}` : translations[locale].app.unknownPerfume;

    const newLogId = 'wear_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newWearLog: WearLogState = {
      id: newLogId,
      user_id: user?.uid || 'usr_senstoria',
      bottle_id: bottleId,
      perfume_id: target.perfume_id,
      worn_on: new Date().toISOString(),
      sprays_count: 3,
      ml_decremented: decrement,
      compliments: 0,
      mood: 'Percaya Diri',
      occasion: 'Harian',
      weather: 'Tropis',
      deleted_at: null
    };

    setBottles(prev => {
      const next = prev.map(b => {
        if (b.id === bottleId) {
          const updated = {
            ...b,
            remaining_ml: newRemaining,
            times_worn: (b.times_worn || 0) + 1,
            status: newRemaining === 0 ? ('finished' as const) : ('in_use' as const)
          };
          if (user) saveBottleToFirestore(user.uid, updated);
          return updated;
        }
        return b;
      });
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });

    setWearLogs(prev => {
      const next = [newWearLog, ...prev];
      localStorage.setItem('senstoria_wear_logs', JSON.stringify(next));
      return next;
    });

    if (user) {
      saveWearLogToFirestore(user.uid, newWearLog).catch(err => {
        console.warn('Firestore save wear log error:', err);
      });
    }

    const newPct = target.size_ml > 0 ? Math.round((newRemaining / target.size_ml) * 100) : 0;
    setLiveAnnouncement(fmt(translations[locale].app.n0Tersisa, newPct));

    const msg = t.toast.loggedWear.replace('{name}', perfumeName).replace('{ml}', String(newRemaining));
    
    // When a wear is logged, the bottle fill and % bar animate down over 200ms,
    // times-worn ticks up, and then the Undo toast appears ("Logged · Undo · Add details").
    const triggerToast = () => {
      showToast(
        msg,
        () => {
          // Revert bottle volume and wear log on 8-second undo
          const prevPct = target.size_ml > 0 ? Math.round((prevMl / target.size_ml) * 100) : 0;
          setLiveAnnouncement(fmt(translations[locale].app.dibatalkan0Tersisa, prevPct));

          setBottles(prev => {
            const reverted = prev.map(b => {
              if (b.id === bottleId) {
                const r = {
                  ...b,
                  remaining_ml: prevMl,
                  times_worn: Math.max(0, (b.times_worn || 1) - 1),
                  status: 'in_use' as const
                };
                if (user) saveBottleToFirestore(user.uid, r);
                return r;
              }
              return b;
            });
            localStorage.setItem('senstoria_user_bottles', JSON.stringify(reverted));
            return reverted;
          });

          setWearLogs(prev => {
            const reverted = prev.filter(w => w.id !== newLogId);
            localStorage.setItem('senstoria_wear_logs', JSON.stringify(reverted));
            return reverted;
          });
        },
        () => {
          setWearDetailInitialBottleId(bottleId);
          setIsLogWearDetailOpen(true);
        },
        translations[locale].app.tambahRincian);
    };

    if (prefersReducedMotion) {
      triggerToast();
    } else {
      setTimeout(triggerToast, 200);
    }
  };

  const handleMarkFinished = (bottleId: string) => {
    setBottles(prev => {
      const next = prev.map(b => {
        if (b.id === bottleId) {
          const updated: BottleState = { ...b, remaining_ml: 0, status: 'finished' as const };
          if (user) saveBottleToFirestore(user.uid, updated);
          return updated;
        }
        return b;
      });
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });
    setToastMessage(translations[locale].app.botolDitandaiSelesaiDanDipindahkanKe);
  };

  // Detailed wear logger from Scent Diary (Phase 4)
  const handleLogWearDetail = (data: {
    bottleId: string;
    spraysCount: number;
    mood: string;
    occasion: string;
    weather: string;
    compliments: number;
    note: string;
  }) => {
    const target = bottles.find(b => b.id === data.bottleId);
    if (!target || target.remaining_ml <= 0) return;

    const prevMl = target.remaining_ml;
    const decrement = Number(((data.spraysCount || 3) * 0.12).toFixed(1)) || 0.5;
    const newRemaining = Math.max(0, Number((prevMl - decrement).toFixed(1)));

    const perfume = allActivePerfumes.find(p => p.id === target.perfume_id);
    const perfumeName = perfume ? `${perfume.brand} — ${perfume.name}` : translations[locale].app.unknownPerfume;

    const newLogId = 'wear_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newWearLog: WearLogState = {
      id: newLogId,
      user_id: user?.uid || 'usr_senstoria',
      bottle_id: data.bottleId,
      perfume_id: target.perfume_id,
      worn_on: new Date().toISOString(),
      sprays_count: data.spraysCount,
      ml_decremented: decrement,
      compliments: data.compliments,
      mood: data.mood,
      occasion: data.occasion,
      weather: data.weather,
      note: data.note,
      deleted_at: null
    };

    setBottles(prev => {
      const updated = prev.map(b => {
        if (b.id === data.bottleId) {
          const u = {
            ...b,
            remaining_ml: newRemaining,
            times_worn: (b.times_worn || 0) + 1,
            status: newRemaining === 0 ? ('finished' as const) : ('in_use' as const)
          };
          if (user) saveBottleToFirestore(user.uid, u);
          return u;
        }
        return b;
      });
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(updated));
      return updated;
    });

    setWearLogs(prev => {
      const updated = [newWearLog, ...prev];
      localStorage.setItem('senstoria_wear_logs', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      saveWearLogToFirestore(user.uid, newWearLog).catch(err => {
        console.warn('Firestore save wear log error:', err);
      });
    }

    const msg = t.toast.loggedWear.replace('{name}', perfumeName).replace('{ml}', String(newRemaining));
    showToast(msg, () => {
      setBottles(prev => {
        const reverted = prev.map(b => {
          if (b.id === data.bottleId) {
            const r = {
              ...b,
              remaining_ml: prevMl,
              times_worn: Math.max(0, (b.times_worn || 1) - 1),
              status: 'in_use' as const
            };
            if (user) saveBottleToFirestore(user.uid, r);
            return r;
          }
          return b;
        });
        localStorage.setItem('senstoria_user_bottles', JSON.stringify(reverted));
        return reverted;
      });

      setWearLogs(prev => {
        const reverted = prev.filter(w => w.id !== newLogId);
        localStorage.setItem('senstoria_wear_logs', JSON.stringify(reverted));
        return reverted;
      });
    });
  };

  // Delete wear log with undo
  const handleDeleteWearLog = (logId: string) => {
    const target = wearLogs.find(w => w.id === logId);
    if (!target) return;

    setWearLogs(prev => {
      const updated = prev.filter(w => w.id !== logId);
      localStorage.setItem('senstoria_wear_logs', JSON.stringify(updated));
      return updated;
    });

    showToast(translations[locale].app.catatanSemprotDihapus, () => {
      setWearLogs(prev => {
        const reverted = [target, ...prev];
        localStorage.setItem('senstoria_wear_logs', JSON.stringify(reverted));
        return reverted;
      });
    });
  };

  // Scent Story Publisher Handler (Phase 4)
  const handleSaveStory = (story: StoryState) => {
    setScentStories(prev => {
      const updated = [story, ...prev.filter(s => s.id !== story.id)];
      localStorage.setItem('senstoria_scent_stories', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      saveStoryToFirestore(user.uid, story).catch(err => {
        console.warn('Firestore save story error:', err);
      });
    }

    showToast(
      story.status === 'published'
        ? (translations[locale].app.ceritaAromaBerhasilDipublikasikanKeLi)
        : (translations[locale].app.draftCeritaTersimpan)
    );
  };

  const handleDeleteStory = (storyId: string) => {
    setScentStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      localStorage.setItem('senstoria_scent_stories', JSON.stringify(updated));
      return updated;
    });
    showToast(translations[locale].app.ceritaBerhasilDihapus);
  };

  // Multi-criteria Review Submit Handler (Phase 4)
  const handleSubmitReview = (reviewData: ReviewState | Omit<ReviewState, 'id' | 'created_at' | 'helpful_count'>) => {
    const review: ReviewState = {
      ...reviewData,
      id: 'id' in reviewData ? reviewData.id : `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: 'created_at' in reviewData ? reviewData.created_at : new Date().toISOString(),
      helpful_count: 'helpful_count' in reviewData ? reviewData.helpful_count : 0
    };

    setReviews(prev => {
      const updated = [review, ...prev.filter(r => r.id !== review.id)];
      localStorage.setItem('senstoria_reviews', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      saveReviewToFirestore(user.uid, review).catch(err => {
        console.warn('Firestore save review error:', err);
      });
    }

    showToast(translations[locale].app.ulasanMultiKriteriamuBerhasilDipublika);
  };

  const handleOpenReviewModal = (perfumeId?: string) => {
    setReviewPerfumeIdTarget(perfumeId || selectedPerfumeId);
    setIsReviewModalOpen(true);
  };

  // Compare Toggle with Max 3 Rule (CMP-01)
  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(item => item !== id));
      showToast(translations[locale].app.parfumDihapusDariKomparasi);
    } else {
      if (compareIds.length >= 3) {
        showToast(
          translations[locale].app.maksimal3ParfumDapatDibandingkanSecar);
        return;
      }
      setCompareIds(prev => [...prev, id]);
      const target = SEED_PERFUMES.find(p => p.id === id);
      showToast(
        fmt(translations[locale].app.addedToCompare, target?.name || translations[locale].app.unnamedPerfume, compareIds.length + 1)
      );
    }
  };

  const handleToggleWishlist = (id: string) => {
    setWishlistIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      showToast(
        exists 
          ? (translations[locale].app.dihapusDariWishlist) 
          : (translations[locale].app.ditambahkanKeWishlist)
      );
      return next;
    });
  };

  const handleSaveWaitlistEntry = (entry: WaitlistState) => {
    setWaitlists(prev => {
      const next = [entry, ...prev];
      localStorage.setItem('senstoria_waitlist_entries', JSON.stringify(next));
      return next;
    });
    if (user) {
      saveWaitlistEntryToFirestore(user.uid, entry).catch(err => {
        console.warn('Firestore waitlist save error:', err);
      });
    }
    showToast(translations[locale].app.permintaanSampelDecantBerhasilDidaftar);
  };

  const handleSaveSampleOrder = (order: SampleOrderState) => {
    setSampleOrders(prev => {
      const next = [order, ...prev];
      localStorage.setItem('senstoria_sample_orders', JSON.stringify(next));
      return next;
    });
    if (user) {
      saveSampleOrderToFirestore(user.uid, order).catch(err => {
        console.warn('Firestore sample order save error:', err);
      });
    }
    showToast(fmt(translations[locale].app.pesananSampel0BerhasilDibuatSimulasi, order.order_number));
  };

  // Admin Catalog CRUD Handlers (ADM-04)
  const handleAddCatalogPerfume = (perfume: SeedPerfume) => {
    setAdminCatalogPerfumes(prev => {
      const next = [perfume, ...prev];
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(fmt(translations[locale].app.parfum0BerhasilDitambahkanKeKatalog, perfume.name));
  };

  const handleUpdateCatalogPerfume = (perfume: SeedPerfume) => {
    setAdminCatalogPerfumes(prev => {
      const next = prev.map(p => p.id === perfume.id ? perfume : p);
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(fmt(translations[locale].app.parfum0BerhasilDiperbarui, perfume.name));
  };

  const handleDeleteCatalogPerfume = (perfumeId: string) => {
    setAdminCatalogPerfumes(prev => {
      const next = prev.filter(p => p.id !== perfumeId);
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(translations[locale].app.parfumBerhasilDihapusDariKatalog);
  };

  // Admin Review Moderation Handlers (ADM-02)
  const handleApproveReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.map(r => r.id === reviewId ? { ...r, status: 'approved' as const } : r);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(translations[locale].app.ulasanDisetujuiDanKiniTampilPublik);
  };

  const handleRejectReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.map(r => r.id === reviewId ? { ...r, status: 'rejected' as const } : r);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(translations[locale].app.ulasanDitangguhkan);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.filter(r => r.id !== reviewId);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(translations[locale].app.ulasanDihapus);
  };

  // Admin Feature Flag Toggles (ADM-10)
  const handleToggleFeatureFlag = (flagKey: string) => {
    const nextVal = !allFeatureFlags[flagKey];
    setAllFeatureFlags(prev => {
      const next = { ...prev, [flagKey]: nextVal };
      localStorage.setItem('senstoria_feature_flags', JSON.stringify(next));
      return next;
    });
    if (flagKey === 'try_it_first_ordering') {
      setFlagTryItFirstOrdering(nextVal);
      localStorage.setItem('senstoria_flag_try_it_first_ordering', JSON.stringify(nextVal));
    }
    showToast(`Feature flag ${flagKey}: ${nextVal ? 'AKTIF' : 'NONAKTIF'}`);
  };

  // Navigate to catalog with preset filter (CAT-06)
  const handleFilterByNote = (note: string) => {
    setCatalogFilterNote(note);
    setCatalogFilterBrand(null);
    setCatalogFilterFamily(null);
    setView('catalog');
  };

  const handleFilterByBrand = (brand: string) => {
    setCatalogFilterBrand(brand);
    setCatalogFilterNote(null);
    setCatalogFilterFamily(null);
    setView('catalog');
  };

  const handleFilterByFamily = (family: string) => {
    setCatalogFilterFamily(family);
    setCatalogFilterNote(null);
    setCatalogFilterBrand(null);
    setView('catalog');
  };

  // Add custom bottle to library from ProductDetailView (CAB-04)
  const handleAddBottleToLibrary = (data: { size_ml: number; remaining_ml: number; status: 'sealed' | 'in_use'; price_idr: number }) => {
    const newId = 'bot_' + Math.random().toString(36).substring(2, 9);
    const newBottle: BottleState = {
      id: newId,
      perfume_id: selectedPerfumeId,
      status: data.status,
      format: data.size_ml <= 10 ? 'decant' : 'full',
      size_ml: data.size_ml,
      remaining_ml: data.remaining_ml,
      ml_per_wear: 0.5,
      price_idr: data.price_idr,
      times_worn: 0,
      is_favorite: false
    };

    setBottles(prev => {
      const next = [newBottle, ...prev];
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });

    if (user) {
      saveBottleToFirestore(user.uid, newBottle).catch(err => {
        console.warn('Firestore save bottle error:', err);
      });
    }

    // Clear wishlist if the user now owns it (CAB-02)
    setWishlistIds(prev => prev.filter(id => id !== selectedPerfumeId));
    showToast(translations[locale].app.botolBaruBerhasilDisimpanKeLemarimu);
  };

  // Phase 3 Library Bottle Handlers
  const handleAddBottle = (
    bottleData: Omit<BottleState, 'id'>, 
    customPerfume?: Partial<SeedPerfume>
  ) => {
    const newId = 'bot_' + Math.random().toString(36).substring(2, 9);
    const newBottle: BottleState = {
      ...bottleData,
      id: newId
    };

    if (customPerfume && customPerfume.id) {
      setCustomPerfumes(prev => {
        const next = [customPerfume as SeedPerfume, ...prev];
        localStorage.setItem('senstoria_custom_perfumes', JSON.stringify(next));
        return next;
      });
    }

    setBottles(prev => {
      const next = [newBottle, ...prev];
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });

    if (user) {
      saveBottleToFirestore(user.uid, newBottle).catch(err => {
        console.warn('Firestore save error:', err);
      });
    }

    // Clear wishlist if user now owns it
    setWishlistIds(prev => prev.filter(id => id !== bottleData.perfume_id));

    const p = allActivePerfumes.find(item => item.id === bottleData.perfume_id) || customPerfume;
    showToast(
        fmt(translations[locale].app.addedToLibrary, p ? p.name : translations[locale].app.unnamedPerfume)
      );
  };

  const handleUpdateBottle = (bottleId: string, updates: Partial<BottleState>) => {
    setBottles(prev => {
      const next = prev.map(b => b.id === bottleId ? { ...b, ...updates } : b);
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });

    const target = bottles.find(b => b.id === bottleId);
    if (user && target) {
      saveBottleToFirestore(user.uid, { ...target, ...updates }).catch(err => {
        console.warn('Firestore update error:', err);
      });
    }

    showToast(translations[locale].app.botolBerhasilDiperbarui);
  };

  const handleDeleteBottle = (bottleId: string) => {
    const targetBottle = bottles.find(b => b.id === bottleId);
    if (!targetBottle) return;

    setBottles(prev => {
      const next = prev.filter(b => b.id !== bottleId);
      localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
      return next;
    });

    showToast(
      translations[locale].app.botolDihapusDariLemari,
      () => {
        // Undo within 8 seconds
        setBottles(prev => {
          const next = [targetBottle, ...prev];
          localStorage.setItem('senstoria_user_bottles', JSON.stringify(next));
          return next;
        });
      }
    );
  };

  const handleRemoveWishlist = (perfumeId: string) => {
    setWishlistIds(prev => prev.filter(id => id !== perfumeId));
    showToast(translations[locale].app.dihapusDariWishlist);
  };

  // Auth Submit Handlers (Sprint 1: real Firebase Auth results)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    if (authTab === 'signin') {
      if (!authEmail) {
        setAuthError(translations[locale].app.masukkanEmailKamu);
        return;
      }
      const res = await login(authEmail, authPassword, locale);
      if (!res.success) {
        setAuthError(res.error || 'Gagal masuk');
        return;
      }
      setIsAuthModalOpen(false);
      showToast(translations[locale].app.berhasilMasukAkun);
    } else {
      const res = await signup(authEmail, authPassword, authBirthDate, authTermsAccepted, locale);
      if (!res.success) {
        setAuthError(res.error || 'Pendaftaran gagal');
        return;
      }
      setIsAuthModalOpen(false);
      showToast(translations[locale].app.akunDibuatPeriksaEmailUntukLinkVerif);
    }
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!authEmail) {
      setAuthError(translations[locale].app.masukkanEmailKamuDuluLaluTekanLupaK);
      return;
    }
    const res = await resetPassword(authEmail, locale);
    if (res.success) {
      setAuthNotice(translations[locale].app.linkAturUlangKataSandiTelahDikirimK);
    } else {
      setAuthError(res.error || 'Gagal mengirim link atur ulang.');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-bar flex flex-col antialiased selection:bg-bar selection:text-paper pb-24">
      
      {/* ── TOP UTILITY BAR (Sprint 1: no internal controls visible to the public) ── */}
      <div className="bg-bar text-paper text-[12px] py-2 px-4 border-b border-border flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-mono px-2 py-0.5 font-medium text-[12px] tracking-wide">
            SENSTORIA
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[12px] font-mono space-x-1">
            <button
              onClick={() => setLocale('id')}
              className={`px-1 font-medium ${locale === 'id' ? 'text-paper underline' : 'text-ondark hover:text-paper'}`}
            >
              ID
            </button>
            <span className="text-secondary">·</span>
            <button
              onClick={() => setLocale('en')}
              className={`px-1 font-medium ${locale === 'en' ? 'text-paper underline' : 'text-ondark hover:text-paper'}`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenLegalModal('data_rights')}
            className="text-ondark hover:text-paper underline text-[12px] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            title={translations[locale].app.dataRightsTitle}
          >
            {translations[locale].app.dataRightsButton}
          </button>

          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => setView('admin')}
              className="text-paper font-medium underline text-[12px] transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              {translations[locale].app.adminPanel}
            </button>
          )}
        </div>
      </div>

      {/* Skip to Main Content Link (WCAG 2.1 AA) */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-bar focus:text-paper focus:ring-2 focus:ring-accent focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent font-semibold text-xs shadow-sheet border border-bar"
      >
        {translations[locale].app.skipToContent}
      </a>

      {/* Screen Reader Live Region for Volume and State Announcements (Rule 8) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* ── RESPONSIVE CONTAINER ── */}
      <div className="w-full mx-auto flex-1 flex flex-col transition-all duration-300 max-w-[1200px] border-x border-hairline">
        
        {/* ── MOBILE HEADER (< 1024px / < lg) ── */}
        {/* Shrunk to strictly: Logo, Try It First, Language Switcher (EN | ID), Account Icon */}
        <header className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-hairline bg-paper sticky top-0 z-30">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center min-h-[44px] -ml-1 px-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={translations[locale].app.homeAria}
          >
            <img 
              src="/assets/senstoria-logo.png" 
              alt="Senstoria" 
              className="h-7 w-auto object-contain"
            />
          </button>

          <div className="flex items-center gap-2">
            {/* Try It First Button */}
            <button
              onClick={() => setView('tryItFirst')}
              className={`min-h-[44px] px-3 py-1.5 border text-xs font-semibold  transition flex items-center gap-1 ${
                view === 'tryItFirst' 
                  ? 'bg-bar text-paper border-ink' 
                  : 'bg-white border-bar text-bar hover:bg-surface'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>{t.nav.tryItFirst}</span>
            </button>

            {/* Language Switcher (EN | ID) */}
            <button
              type="button"
              onClick={() => setLocale(prev => prev === 'id' ? 'en' : 'id')}
              className="min-h-[44px] min-w-[44px] px-2 py-1.5 border border-bar bg-white hover:bg-surface text-xs font-mono font-bold text-bar transition flex items-center justify-center"
              title="Ganti Bahasa (Switch Language)"
              aria-label={fmt(translations[locale].app.switchLanguageAria, translations[locale].app.english)}
            >
              {translations[locale].app.id}
            </button>

            {/* Account Icon */}
            {user ? (
              <button 
                onClick={logout}
                className="min-h-[44px] min-w-[44px] p-2 border border-bar hover:bg-surface text-xs text-bar transition flex items-center justify-center"
                title={fmt(translations[locale].app.signOutTitle, user.nickname)}
                aria-label={fmt(translations[locale].app.signOutAria, user.nickname)}
              >
                <LogOut className="w-4 h-4 text-bar" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAuthTab('signin');
                  setIsAuthModalOpen(true);
                }} 
                className="min-h-[44px] min-w-[44px] p-2 border border-bar bg-bar hover:bg-ink text-paper transition flex items-center justify-center"
                title={t.nav.signIn}
                aria-label={t.nav.signIn}
              >
                <UserIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ── DESKTOP HEADER (>= 1024px / lg) ── */}
        {/* Full header: Logo, 5 items, Try It First, Language Switcher, Account Menu */}
        <header className="hidden lg:flex items-center justify-between gap-6 px-8 py-5 border-b border-hairline bg-paper sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setView('home')} 
              className="flex items-center gap-2 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent "
              aria-label={translations[locale].app.homeAria}
            >
              <img 
                src="/assets/senstoria-logo.png" 
                alt="Senstoria" 
                className="h-8.5 w-auto object-contain transition-opacity duration-200 group-hover:opacity-85"
              />
            </button>
            
            <nav className="flex items-center gap-6 text-sm text-secondary">
              <button 
                onClick={() => setView('home')} 
                className={`hover:text-ink transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'home' ? 'text-ink font-bold' : 'font-medium'}`}
              >
                {t.nav.home}
              </button>
              <button 
                onClick={() => setView('library')} 
                className={`hover:text-ink transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'library' ? 'text-ink font-bold' : 'font-medium'}`}
              >
                {t.nav.library}
              </button>
              <button 
                onClick={() => setView('diary')} 
                className={`hover:text-ink transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'diary' ? 'text-ink font-bold' : 'font-medium'}`}
              >
                {translations[locale].nav.diary}
              </button>
              <button 
                onClick={() => {
                  setCatalogFilterNote(null);
                  setCatalogFilterBrand(null);
                  setCatalogFilterFamily(null);
                  setView('catalog');
                }} 
                className={`hover:text-ink transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'catalog' || view === 'detail' ? 'text-ink font-bold' : 'font-medium'}`}
              >
                {t.nav.catalog}
              </button>
              <button 
                onClick={() => setView('finder')} 
                className={`hover:text-ink transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'finder' ? 'text-ink font-bold' : 'font-medium'}`}
              >
                {translations[locale].nav.scentFinder}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            {/* Try It First Button */}
            <button
              onClick={() => setView('tryItFirst')}
              className={`px-3 py-1.5 border text-xs font-semibold  transition flex items-center gap-1.5 ${
                view === 'tryItFirst' 
                  ? 'bg-bar text-paper border-ink' 
                  : 'bg-surface border-bar hover:bg-surface text-bar'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>{t.nav.tryItFirst}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLocale(prev => prev === 'id' ? 'en' : 'id')}
              className="px-2.5 py-1.5 border border-bar bg-white hover:bg-surface font-mono text-xs font-bold text-bar transition"
              title="Ganti Bahasa (Switch Language)"
            >
              {translations[locale].app.idEn}
            </button>

            {/* Compare Shortcut */}
            {compareIds.length > 0 && (
              <button 
                onClick={() => setView('compare')} 
                className={`px-3 py-1.5 border border-bar text-xs font-medium transition flex items-center gap-1  ${view === 'compare' ? 'bg-bar text-paper' : 'hover:bg-surface'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.nav.compare} ({compareIds.length})</span>
              </button>
            )}

            {/* Account Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-secondary">
                  {user.nickname} ({user.role})
                </span>
                <button 
                  onClick={logout} 
                  className="px-3 py-1.5 border border-border hover:bg-surface text-[12px] transition flex items-center gap-1 rounded-none text-ink"
                  title={translations[locale].nav.signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.nav.signOut}</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthTab('signin');
                  setIsAuthModalOpen(true);
                }} 
                className="bg-bar hover:bg-ink text-paper px-4 py-2 text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5 "
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.nav.signIn}</span>
              </button>
            )}
          </div>
        </header>

        {/* Status banners: sync failure is shown, never hidden (Sprint 1) */}
        {syncError && (
          <div className="bg-error/10 border-b border-error px-6 py-2.5 text-xs text-error" role="alert">
            {syncError}
          </div>
        )}

        {/* Explicit demo mode: labelled sample data, entered only on request */}
        {isDemoMode && !user && (
          <div className="bg-surface border-b border-hairline px-6 py-2.5 text-xs text-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              <span>{translations[locale].app.modeDemoKamuSedangMelihatDataContoh}</span>
            </div>
            <button
              onClick={handleDisableDemoMode}
              className="text-bar font-bold underline ml-2 whitespace-nowrap"
            >
              {translations[locale].app.keluarDariDemo}
            </button>
          </div>
        )}

        {/* Logged out, backend connected: honest empty state + explicit demo offer */}
        {!isDemoMode && !user && backendConfigured && (
          <div className="bg-surface border-b border-hairline px-6 py-2.5 text-xs text-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              <span>{translations[locale].app.kamuBelumMasukKoleksimuMasihKosongBu}</span>
            </div>
            <div className="flex items-center gap-3 ml-2 whitespace-nowrap">
              <button
                onClick={handleEnableDemoMode}
                className="text-bar underline"
              >
                {translations[locale].app.lihatContohDenganDataDemo}
              </button>
              <button
                onClick={() => {
                  setAuthTab('signup');
                  setIsAuthModalOpen(true);
                }}
                className="text-bar font-bold underline"
              >
                {translations[locale].app.daftarAkun}
              </button>
            </div>
          </div>
        )}

        {/* Backend not configured: no account actions are offered as if they worked */}
        {!isDemoMode && !user && !backendConfigured && (
          <div className="bg-surface border-b border-hairline px-6 py-2.5 text-xs text-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              <span>{translations[locale].app.backendBelumTerhubungMasukDanDaftarA}</span>
            </div>
            <button
              onClick={handleEnableDemoMode}
              className="text-bar font-bold underline ml-2 whitespace-nowrap"
            >
              {translations[locale].app.lihatContohDenganDataDemo}
            </button>
          </div>
        )}

        {/* ── MAIN VIEWPORT CONTENT (WCAG 2.1 AA Landmark) ── */}
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1024px] desktop:max-w-[1152px] mx-auto w-full px-4 md:px-6 py-8 space-y-8 pb-36 lg:pb-12 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
          <div key={view} className="animate-screen-enter space-y-8">

          {/* ══════════════ 1. HOME VIEW ══════════════ */}
          {view === 'home' && (
            <div className="space-y-8">
              
              {/* Low Bottle Alert Banner if any bottle <= 20% remaining (BR-02) */}
              <LowBottleBanner
                bottles={bottles}
                perfumes={allActivePerfumes}
                locale={locale}
                onBuyAgain={(perfumeId) => {
                  const p = allActivePerfumes.find(x => x.id === perfumeId) || null;
                  setBuyPerfume(p);
                }}
                onTryItFirst={(perfumeId) => {
                  setWaitlistPerfumeId(perfumeId);
                  setIsWaitlistOpen(true);
                }}
                onMarkFinished={handleMarkFinished}
              />

              {/* Confident Editorial Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-hairline pb-8">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                  <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                    {t.home.heroKicker}
                  </span>
                  <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-ink">
                    {t.home.heroTitle}
                  </h1>
                  <p className="text-[16px] leading-[24px] text-secondary max-w-xl">
                    {t.home.heroSubtitle}
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setView('finder')}
                      className="min-h-[48px] bg-bar hover:bg-ink text-paper px-6 py-3 text-sm font-medium transition active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                    >
                      <span>{translations[locale].app.mulaiScentFinder}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCatalogFilterNote(null);
                        setCatalogFilterBrand(null);
                        setCatalogFilterFamily(null);
                        setView('catalog');
                      }}
                      className="min-h-[48px] border border-bar hover:bg-surface text-ink px-6 py-3 text-sm font-medium transition active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>{fmt(translations[locale].app.jelajahi0KatalogParfum, allActivePerfumes.length)}</span>
                    </button>
                    <button 
                      onClick={() => setView('library')}
                      className="min-h-[48px] border border-border hover:bg-surface text-bar px-6 py-3 text-sm font-medium transition active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{translations[locale].app.bukaPustakaSaya}</span>
                    </button>
                  </div>
                </div>

                {/* Collection Glance Tiles (BR-01, XC-01 single source) — Numbers first, decoration never */}
                <div className="lg:col-span-5 bg-surface p-6 border border-hairline flex flex-col justify-between space-y-6">
                  <div className="flex justify-between items-baseline border-b border-hairline pb-3">
                    <span className="text-[12px] uppercase tracking-wider text-secondary font-medium">
                      {t.home.glanceTitle}
                    </span>
                    <span className="text-[12px] font-mono text-secondary">
                      {t.home.glanceTruth}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-ink tabular-nums font-normal">
                        {sharedBottleStats.totalLibraryBottles}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-secondary mt-2">
                        {t.home.currentlyWearingLabel}
                      </p>
                    </div>
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-ink tabular-nums font-normal">
                        {wishlistIds.length}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-secondary mt-2">
                        {t.home.wishlistLabel}
                      </p>
                    </div>
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-ink tabular-nums font-normal">
                        {sharedBottleStats.totalWearsCount}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-secondary mt-2">
                        {t.home.wearsLabel}
                      </p>
                    </div>
                  </div>

                  {/* Scent DNA Visualisation on Home (Horizontal bars, data table toggle, caption line, no radar) */}
                  <ScentDnaVisualisation
                    familyBreakdown={homeScentDna.familyBreakdown}
                    perfumesCount={profilePerfumesCount}
                    topNotes={rankedTopNotes}
                    locale={locale}
                    isDashboard={false}
                    onNavigateToCatalog={() => setView('catalog')}
                  />
                </div>
              </div>

              {/* Quiet Editorial Quote Card — "On this day" & Scent Story Memories */}
              {scentStories.length > 0 && (() => {
                const story = scentStories[0];
                const storyPerfume = SEED_PERFUMES.find(p => p.id === story.perfume_id);
                const storyDateFormatted = new Date(story.story_date || story.created_at || '2026-10-18').toLocaleDateString(
                  translations[locale].app.idId,
                  { day: 'numeric', month: 'long', year: 'numeric' }
                );
                return (
                  <div className="bg-surface border border-hairline p-6 md:p-8 space-y-4">
                    <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                      {translations[locale].app.memoriAromaPadaHariIni}
                    </span>
                    <blockquote className="font-serif italic text-[18px] md:text-[22px] leading-[28px] md:leading-[34px] text-ink">
                      “{story.body.length > 180 ? `${story.body.slice(0, 180)}…` : story.body}”
                    </blockquote>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-hairline text-[12px] text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {storyPerfume ? `${storyPerfume.brand} — ${storyPerfume.name}` : story.title || translations[locale].app.storyFallbackTitle}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{storyDateFormatted}</span>
                      </div>
                      <button
                        onClick={() => setView('diary')}
                        className="text-[12px] font-semibold text-ink hover:underline cursor-pointer"
                      >
                        {translations[locale].app.bacaDiBukuHarian}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 1-Tap Wear Rotation (BR-02: Remaining % allowed here ONLY) */}
              <div className="space-y-6">
                {/* Standardized Section Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline pb-3">
                  <div className="space-y-1">
                    <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                      {translations[locale].app.rotasiHarian}
                    </span>
                    <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] text-ink font-normal">
                      {t.home.logTodayTitle}
                    </h2>
                    <p className="text-[14px] leading-[20px] text-secondary">
                      {t.home.logTodaySubtitle}
                    </p>
                  </div>
                  <span className="text-[12px] font-mono text-secondary">
                    {currentlyWearingBottles.length} {t.home.bottlesInRotation}
                  </span>
                </div>

                {currentlyWearingBottles.length === 0 ? (
                  /* Empty / First-Run Home: 3-step checklist with one CTA per step */
                  <div className="bg-surface border border-hairline p-6 md:p-8 space-y-6">
                    <div className="space-y-1">
                      <span className="text-[12px] uppercase tracking-widest text-secondary font-medium block">
                        {translations[locale].app.mulaiPerjalananOlfaktif}
                      </span>
                      <h3 className="font-serif text-[24px] leading-[32px] text-ink font-normal">
                        {translations[locale].app.n3LangkahMemulaiSenstoria}
                      </h3>
                      <p className="text-[14px] leading-[20px] text-secondary">
                        {translations[locale].app.bangunLemariAromaPersonalDanTemukanW}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="bg-white border border-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 border border-bar flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 bg-bar text-paper">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-[14px] text-ink">
                              {translations[locale].app.n1TemukanSignatureScentLewatScentFind}
                            </p>
                            <p className="text-[12px] text-secondary">
                              {translations[locale].app.ketahuiProfilPiramidaAromaDanPreferen}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setView('finder')}
                          className="min-h-[44px] px-4 py-2 bg-bar hover:bg-ink text-paper text-xs font-semibold whitespace-nowrap transition active:scale-[0.98] cursor-pointer"
                        >
                          {translations[locale].app.mulaiScentFinder2}
                        </button>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-white border border-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 border transition-all duration-150 flex items-center justify-center shrink-0 mt-0.5 ${bottles.length > 0 ? 'bg-bar border-bar text-paper' : 'border-border text-transparent'}`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-[14px] text-ink">
                              {translations[locale].app.n2TambahkanBotolPertamaKeLemari}
                            </p>
                            <p className="text-[12px] text-secondary">
                              {translations[locale].app.koleksiDariKatalogKurasiAtauBotolCus}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setView('library')}
                          className="min-h-[44px] px-4 py-2 bg-bar hover:bg-ink text-paper text-xs font-semibold whitespace-nowrap transition active:scale-[0.98] cursor-pointer"
                        >
                          {translations[locale].app.bukaPustaka}
                        </button>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-white border border-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 border transition-all duration-150 flex items-center justify-center shrink-0 mt-0.5 ${wearLogs.length > 0 ? 'bg-bar border-bar text-paper' : 'border-border text-transparent'}`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-[14px] text-ink">
                              {translations[locale].app.n3CatatSemprotanPertamamuDiBukuHarian}
                            </p>
                            <p className="text-[12px] text-secondary">
                              {translations[locale].app.simpanSuasanaHatiCuacaDanKenanganAro}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setView('diary')}
                          className="min-h-[44px] px-4 py-2 bg-bar hover:bg-ink text-paper text-xs font-semibold whitespace-nowrap transition active:scale-[0.98] cursor-pointer"
                        >
                          {translations[locale].app.bukaBukuHarian}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Horizontal snap-scroll rotation of bottle cards with visible peek on mobile, responsive grid on desktop */
                  <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-none sm:mx-0 sm:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:overflow-visible">
                    {currentlyWearingBottles.map((bottle, idx) => {
                      const perfume = SEED_PERFUMES.find(p => p.id === bottle.perfume_id);
                      if (!perfume) return null;

                      const rawPercentage = calculateRemainingPercentage(bottle);
                      const percentage = rawPercentage ?? 0;

                      return (
                        <div 
                          key={bottle.id} 
                          className="w-[82vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink bg-white p-5 border border-hairline flex flex-col justify-between space-y-4 transition-colors animate-card-enter"
                          style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[12px] uppercase tracking-wider text-secondary font-medium">
                                {perfume.brand}
                              </span>
                              <span className="text-[12px] font-mono text-secondary">
                                {perfume.concentration}
                              </span>
                            </div>

                            {/* Hero Bottle Silhouette with liquid level drawn */}
                            <div className="py-2 flex justify-center">
                              <Bottle
                                fragranceId={perfume.id}
                                name={perfume.name}
                                brand={perfume.brand}
                                size="sm"
                                showFill={true}
                                fillPercentage={rawPercentage ?? undefined}
                              />
                            </div>

                            <div>
                              <h3 className="text-[18px] leading-[24px] font-medium text-ink line-clamp-2 h-[48px]">
                                {perfume.name}
                              </h3>
                              <p className="text-[14px] leading-[20px] text-secondary truncate mt-1">
                                {perfume.top_notes}
                              </p>
                            </div>
                          </div>

                          {/* Fill level progress bar (BR-02): strictly 200ms scaleX transform */}
                          <div className="space-y-3 pt-2 border-t border-hairline">
                            <div className="space-y-1">
                              <div className="w-full bg-surface border border-hairline h-2 overflow-hidden">
                                <div 
                                  className="h-full w-full origin-left transition-transform duration-200 ease-out bg-bar" 
                                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, percentage / 100))})` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[12px] font-mono text-secondary tabular-nums">
                                <span>{percentage}% {t.home.remainingText}</span>
                                <span>{bottle.remaining_ml} / {bottle.size_ml} ml</span>
                              </div>
                            </div>

                            {/* Action Buttons: EXACTLY ONE primary (filled) button per card */}
                            <div className="space-y-2">
                              <button 
                                onClick={() => handleLogWear(bottle.id)}
                                className="w-full min-h-[48px] py-3 bg-bar hover:bg-ink text-paper text-xs font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Droplet className="w-4 h-4" />
                                <span>{t.home.logWearAction}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWearDetailInitialBottleId(bottle.id);
                                  setIsLogWearDetailOpen(true);
                                }}
                                className="w-full text-center text-[12px] text-secondary hover:text-ink py-1 block underline cursor-pointer"
                              >
                                {translations[locale].app.rincianSemprotSuasanaCuaca}
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

          {/* ══════════════ 2. CATALOG VIEW (PHASE 2 CORE) ══════════════ */}
          {view === 'catalog' && (
            <CatalogView
              perfumes={SEED_PERFUMES}
              onSelectPerfume={id => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onOpenTryItFirst={id => {
                setWaitlistPerfumeId(id);
                setIsWaitlistOpen(true);
              }}
              initialFilterNote={catalogFilterNote}
              initialFilterBrand={catalogFilterBrand}
              initialFilterFamily={catalogFilterFamily}
              locale={locale}
            />
          )}

          {/* ══════════════ 3. PRODUCT DETAIL VIEW (PHASE 2 CORE) ══════════════ */}
          {view === 'detail' && (
            <React.Suspense fallback={
              <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                {translations[locale].common.loading}
              </div>
            }>
            <ProductDetailView
              perfume={selectedPerfume}
              onBackToCatalog={() => setView('catalog')}
              onFilterByNote={handleFilterByNote}
              onFilterByBrand={handleFilterByBrand}
              onFilterByFamily={handleFilterByFamily}
              isWishlisted={wishlistIds.includes(selectedPerfume.id)}
              onToggleWishlist={() => handleToggleWishlist(selectedPerfume.id)}
              isCompared={compareIds.includes(selectedPerfume.id)}
              onToggleCompare={() => handleToggleCompare(selectedPerfume.id)}
              onOpenTryItFirst={() => {
                setWaitlistPerfumeId(selectedPerfume.id);
                setIsWaitlistOpen(true);
              }}
              onAddBottleToLibrary={handleAddBottleToLibrary}
              allPerfumes={SEED_PERFUMES}
              onSelectPerfume={id => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              reviews={reviews}
              stories={scentStories}
              onOpenReviewModal={handleOpenReviewModal}
              onOpenStoryModal={(id) => {
                setSelectedPerfumeId(id);
                setView('diary');
              }}
              locale={locale}
            />
            </React.Suspense>
          )}

          {/* ══════════════ 4. COMPARE VIEW (PHASE 2 CORE) ══════════════ */}
          {view === 'compare' && (
            <CompareView
              perfumes={SEED_PERFUMES}
              compareIds={compareIds}
              onRemoveFromCompare={id => handleToggleCompare(id)}
              onOpenCatalogToAdd={() => setView('catalog')}
              onSelectPerfume={id => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onOpenTryItFirst={id => {
                setWaitlistPerfumeId(id);
                setIsWaitlistOpen(true);
              }}
              locale={locale}
            />
          )}

          {/* ══════════════ 5. LIBRARY VIEW ══════════════ */}
          {view === 'library' && (
            <React.Suspense fallback={
              <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                {translations[locale].common.loading}
              </div>
            }>
            <LibraryView
              bottles={bottles}
              wishlistIds={wishlistIds}
              perfumes={allActivePerfumes}
              onLogWear={handleLogWear}
              onSelectPerfume={(id) => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              onOpenTryItFirst={(id) => {
                setWaitlistPerfumeId(id);
                setIsWaitlistOpen(true);
              }}
              onAddBottle={handleAddBottle}
              onUpdateBottle={handleUpdateBottle}
              onDeleteBottle={handleDeleteBottle}
              onRemoveWishlist={handleRemoveWishlist}
              onNavigateToDiary={() => setView('diary')}
              locale={locale}
            />
            </React.Suspense>
          )}

          {/* ══════════════ 5B. SCENT DIARY & REVIEWS (PHASE 4 CORE) ══════════════ */}
          {view === 'diary' && (
            <React.Suspense fallback={
              <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                {translations[locale].common.loading}
              </div>
            }>
            <ScentDiaryView
              bottles={bottles}
              perfumes={allActivePerfumes}
              wearLogs={wearLogs}
              stories={scentStories}
              reviews={reviews}
              onLogWearDetail={handleLogWearDetail}
              onDeleteWearLog={handleDeleteWearLog}
              onSaveStory={handleSaveStory}
              onDeleteStory={handleDeleteStory}
              onOpenReviewModal={handleOpenReviewModal}
              onSelectPerfume={(id) => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              onNavigateToLibrary={() => setView('library')}
              currentUserId={user?.uid}
              currentUserName={user?.nickname}
              locale={locale}
            />
            </React.Suspense>
          )}

          {/* ══════════════ 5C. TRY IT FIRST VIEW (COBA DULU) ══════════════ */}
          {view === 'tryItFirst' && (
            <TryItFirstView
              locale={locale}
              onSelectPerfume={(id) => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              onOpenWaitlist={(perfumeId) => {
                setWaitlistPerfumeId(perfumeId);
                setIsWaitlistOpen(true);
              }}
            />
          )}

          {/* ══════════════ 6. SCENT FINDER VIEW (Phase 5) ══════════════ */}
          {view === 'finder' && (
            <React.Suspense fallback={
              <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                {translations[locale].common.loading}
              </div>
            }>
            <ScentFinderView
              perfumes={SEED_PERFUMES}
              ownedPerfumeIds={bottles.map(b => b.perfume_id)}
              wishlistIds={wishlistIds}
              compareIds={compareIds}
              onToggleWishlist={handleToggleWishlist}
              onToggleCompare={handleToggleCompare}
              onOpenTryItFirst={id => {
                setWaitlistPerfumeId(id);
                setIsWaitlistOpen(true);
              }}
              onSelectPerfume={id => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
              locale={locale}
              onToast={showToast}
              userName={user?.nickname}
            />
            </React.Suspense>
          )}

          {/* ══════════════ 7. ADMIN DASHBOARD VIEW (ADM-01 to ADM-10) ══════════════ */}
          {view === 'admin' && user?.isAdmin && (
            <React.Suspense fallback={
              <div className="h-[260px] flex items-center justify-center font-mono text-xs text-secondary">
                {translations[locale].common.loading}
              </div>
            }>
            <AdminDashboardView
              perfumes={adminCatalogPerfumes}
              onAddPerfume={handleAddCatalogPerfume}
              onUpdatePerfume={handleUpdateCatalogPerfume}
              onDeletePerfume={handleDeleteCatalogPerfume}
              reviews={reviews}
              onApproveReview={handleApproveReview}
              onRejectReview={handleRejectReview}
              onDeleteReview={handleDeleteReview}
              waitlists={waitlists}
              sampleOrders={sampleOrders}
              adminClicks={adminClicks}
              onRefreshClicks={fetchAdminClicks}
              featureFlags={allFeatureFlags}
              onToggleFeatureFlag={handleToggleFeatureFlag}
              locale={locale}
              onCloseAdmin={() => setView('home')}
              onSelectPerfume={(id) => {
                setSelectedPerfumeId(id);
                setView('detail');
              }}
            />
            </React.Suspense>
          )}

          {view === 'admin' && !user?.isAdmin && (
            <div className="border border-hairline bg-surface p-8 space-y-3" role="alert">
              <p className="font-serif text-[22px] text-ink">
                {translations[locale].app.halamanIniHanyaUntukAdmin}
              </p>
              <p className="text-[14px] text-secondary">
                {translations[locale].app.kamuTidakMemilikiAksesAdminKembaliKe}
              </p>
              <button
                type="button"
                onClick={() => setView('home')}
                className="min-h-[44px] px-5 bg-bar text-paper text-[14px] font-medium"
              >
                {translations[locale].app.kembaliKeBeranda}
              </button>
            </div>
          )}

          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="border-t border-hairline bg-surface px-6 py-8 text-xs text-secondary space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <button 
              onClick={() => setView('home')} 
              className="flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent group"
              aria-label={translations[locale].app.homeAria}
            >
              <img 
                src="/assets/senstoria-logo.png" 
                alt="Senstoria" 
                className="h-6.5 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </button>
            <div className="flex flex-wrap gap-4 text-xs">
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('terms')} 
                className="hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
              >
                {t.footer.about}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('privacy')} 
                className="hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
              >
                {t.footer.privacy}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('terms')} 
                className="hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
              >
                {t.footer.terms}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('affiliate')} 
                className="hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
              >
                {t.footer.affiliateDisclosure}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('contact')} 
                className="hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
              >
                {t.footer.contact}
              </button>
            </div>
          </div>
          <p className="text-[12px] text-secondary leading-relaxed">
            {t.footer.integrityStatement}
          </p>
        </footer>

        {/* ── PERSISTENT COMPARE TRAY (CMP-01) ── */}
        <CompareTray
          comparePerfumes={comparePerfumes}
          onRemove={id => handleToggleCompare(id)}
          onClear={() => {
            setCompareIds([]);
            showToast(translations[locale].app.ruangKomparasiDikosongkan);
          }}
          onOpenCompare={() => setView('compare')}
          locale={locale}
        />

        {/* ── 8-SECOND GLOBAL UNDO TOAST NOTIFICATION (C3, BR-02) ── */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 max-w-md bg-bar text-paper px-5 py-3.5 border border-border flex items-center justify-between gap-4 z-50 text-xs animate-toast-enter shadow-sheet">
            <span>{toastMessage}</span>
            <div className="flex items-center gap-3 shrink-0">
              {toastExtraAction && (
                <button
                  type="button"
                  onClick={() => {
                    toastExtraAction();
                    setToastMessage(null);
                    setUndoAction(null);
                    setToastExtraAction(null);
                  }}
                  className="text-paper underline hover:text-paper text-xs cursor-pointer font-medium"
                >
                  {toastExtraLabel || (translations[locale].app.rincian)}
                </button>
              )}
              {undoAction && (
                <button 
                  type="button"
                  onClick={() => {
                    undoAction();
                    setToastMessage(null);
                    setUndoAction(null);
                    setToastExtraAction(null);
                  }}
                  className="bg-paper text-ink px-3 py-1 text-xs font-bold hover:bg-surface transition shrink-0 active:scale-95 cursor-pointer"
                >
                  {t.toast.undo}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── AUTHENTICATION MODAL (AUTH-02, AUTH-04, AUTH-12, AUTH-14) ── */}
        <BottomSheetOrModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          locale={locale}
          title={authTab === 'signin' ? translations[locale].authModal.titleSignin : translations[locale].authModal.titleSignup}
          subtitle={authTab === 'signin' ? translations[locale].authModal.subtitleSignin : translations[locale].authModal.subtitleSignup}
          maxWidth="max-w-md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 border border-bar text-center text-xs p-0.5 bg-surface">
              <button 
                type="button"
                onClick={() => setAuthTab('signin')}
                className={`min-h-[36px] py-1.5 font-medium transition ${authTab === 'signin' ? 'bg-bar text-paper' : 'text-secondary'}`}
              >
                {translations[locale].authModal.tabSignin}
              </button>
              <button 
                type="button"
                onClick={() => setAuthTab('signup')}
                className={`min-h-[36px] py-1.5 font-medium transition ${authTab === 'signup' ? 'bg-bar text-paper' : 'text-secondary'}`}
              >
                {translations[locale].authModal.tabSignup}
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-error/10 border border-error text-error text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div className="p-3 bg-surface border border-hairline text-ink text-xs">
                {authNotice}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].authModal.emailLabel}</label>
                  <input 
                    type="email" 
                    inputMode="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full p-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">{translations[locale].authModal.passwordLabel}</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder={translations[locale].authModal.passwordPlaceholder}
                    className="w-full p-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>

                {authTab === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[12px] underline text-ink min-h-[32px]"
                    >
                      {translations[locale].app.lupaKataSandi}
                    </button>
                  </div>
                )}

                {authTab === 'signup' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="font-semibold block">{translations[locale].authModal.birthDateLabel}</label>
                      <input 
                        type="date" 
                        required
                        value={authBirthDate}
                        onChange={e => setAuthBirthDate(e.target.value)}
                        className="w-full p-3 bg-white border border-bar text-base md:text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                      />
                      <span className="text-[12px] text-secondary block">
                        {translations[locale].authModal.birthDateHint}
                      </span>
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer pt-1 min-h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={authTermsAccepted}
                        onChange={e => setAuthTermsAccepted(e.target.checked)}
                        className="mt-0.5 accent-bar w-4 h-4"
                      />
                      <span className="text-[12px] text-secondary">
                        {translations[locale].authModal.consentPrefix}<a href="#terms" className="underline text-ink">{translations[locale].authModal.termsLink}</a>{translations[locale].authModal.consentMiddle}<a href="#privacy" className="underline text-ink">{translations[locale].authModal.privacyLink}</a>{translations[locale].authModal.consentSuffix}
                      </span>
                    </label>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full min-h-[48px] py-3.5 bg-bar hover:bg-ink text-paper text-[14px] font-medium transition cursor-pointer"
                >
                  {authTab === 'signin' ? translations[locale].authModal.submitSignin : translations[locale].authModal.submitSignup}
                </button>
              </form>

          </div>
        </BottomSheetOrModal>

        {/* ── TRY IT FIRST MODAL (Phase 6 - TRY-01 & TRY-02) ── */}
        {(() => {
          const targetPerfume = SEED_PERFUMES.find(p => p.id === waitlistPerfumeId) || SEED_PERFUMES[0];
          return (
            <TryItFirstModal
              isOpen={isWaitlistOpen}
              onClose={() => setIsWaitlistOpen(false)}
              perfume={targetPerfume}
              userEmail={user?.email}
              userId={user?.uid}
              locale={locale}
              initialFeatureFlagOrdering={flagTryItFirstOrdering}
              onSaveWaitlist={handleSaveWaitlistEntry}
              onSaveSampleOrder={handleSaveSampleOrder}
            />
          );
        })()}

        {/* ── MULTI-CRITERIA REVIEW MODAL (Phase 4) ── */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          perfumes={allActivePerfumes}
          initialPerfumeId={reviewPerfumeIdTarget}
          userName={user?.nickname || translations[locale].app.defaultMemberName}
          userId={user?.uid || 'usr_senstoria'}
          onSubmitReview={handleSubmitReview}
          locale={locale}
        />

        {/* ── LEGAL & UU PDP COMPLIANCE CENTER MODAL (Phase 8 Hardening) ── */}
        <LegalModal
          isOpen={isLegalModalOpen}
          initialTab={legalModalTab}
          onClose={() => setIsLegalModalOpen(false)}
          locale={locale}
          userEmail={user?.email}
          onDeleteAccountData={() => {
            // Full wipe of user-scoped collections in accordance with UU PDP Right to Erasure
            localStorage.clear();
            setBottles([]);
            setWearLogs([]);
            setScentStories([]);
            setReviews([]);
            setWaitlists([]);
            setSampleOrders([]);
            showToast(translations[locale].app.seluruhDataPribadiAndaTelahDimusnahka);
          }}
        />

        {/* ── BUY / REPURCHASE OPTIONS BOTTOM SHEET ── */}
        <BuyOptionsSheet
          isOpen={Boolean(buyPerfume)}
          onClose={() => setBuyPerfume(null)}
          perfume={buyPerfume}
          locale={locale}
          onOpenTryItFirst={(id) => {
            setWaitlistPerfumeId(id);
            setIsWaitlistOpen(true);
          }}
        />

        {/* ── LOG WEAR DETAIL BOTTOM SHEET ── */}
        <LogWearDetailSheet
          isOpen={isLogWearDetailOpen}
          onClose={() => setIsLogWearDetailOpen(false)}
          bottles={bottles}
          perfumes={allActivePerfumes}
          initialBottleId={wearDetailInitialBottleId}
          onSaveWearDetail={handleLogWearDetail}
          locale={locale}
        />

        {/* ── THUMB-ZONE FLOATING ACTION BUTTON (MOBILE ONLY) ── */}
        {(view === 'home' || view === 'library' || view === 'diary') && (
          <button
            type="button"
            onClick={() => {
              setWearDetailInitialBottleId(undefined);
              setIsLogWearDetailOpen(true);
            }}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-4 z-30 lg:hidden bg-bar hover:bg-ink text-paper px-4 py-3 rounded-full shadow-sheet flex items-center gap-2 border border-bar min-h-[44px] text-xs font-semibold active:scale-95 transition"
            aria-label={translations[locale].app.logWearAria}
          >
            <Droplet className="w-4 h-4 text-ondark" />
            <span>{translations[locale].library.logWear}</span>
          </button>
        )}

        {/* ── LOGGED-IN MOBILE BOTTOM NAVIGATION BAR (Req 1) ── */}
        {/* Exactly 5 items: Home, Library, Journal, Catalog, Finder */}
        {/* Monochrome line icon + text label >= 12px; Active is filled icon + bold text, NEVER colour */}
        <nav 
          className="fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-hairline lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-label={translations[locale].app.mainNavAria}
        >
          <div className="grid grid-cols-5 h-16 items-center px-1">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => setView('home')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={view === 'home' ? 'page' : undefined}
            >
              <HomeIcon className={`w-5 h-5 transition-all ${view === 'home' ? 'fill-current text-bar stroke-[2.5]' : 'text-secondary stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'home' ? 'font-bold text-bar' : 'font-normal text-secondary'}`}>
                {t.nav.home}
              </span>
            </button>

            {/* 2. Library */}
            <button
              type="button"
              onClick={() => setView('library')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={view === 'library' ? 'page' : undefined}
            >
              <BookOpen className={`w-5 h-5 transition-all ${view === 'library' ? 'fill-current text-bar stroke-[2.5]' : 'text-secondary stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'library' ? 'font-bold text-bar' : 'font-normal text-secondary'}`}>
                {t.nav.library}
              </span>
            </button>

            {/* 3. Journal */}
            <button
              type="button"
              onClick={() => setView('diary')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={view === 'diary' ? 'page' : undefined}
            >
              <BookText className={`w-5 h-5 transition-all ${view === 'diary' ? 'fill-current text-bar stroke-[2.5]' : 'text-secondary stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'diary' ? 'font-bold text-bar' : 'font-normal text-secondary'}`}>
                {translations[locale].nav.diary}
              </span>
            </button>

            {/* 4. Catalog */}
            <button
              type="button"
              onClick={() => {
                setCatalogFilterNote(null);
                setCatalogFilterBrand(null);
                setCatalogFilterFamily(null);
                setView('catalog');
              }}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={view === 'catalog' || view === 'detail' ? 'page' : undefined}
            >
              <Compass className={`w-5 h-5 transition-all ${view === 'catalog' || view === 'detail' ? 'fill-current text-bar stroke-[2.5]' : 'text-secondary stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'catalog' || view === 'detail' ? 'font-bold text-bar' : 'font-normal text-secondary'}`}>
                {t.nav.catalog}
              </span>
            </button>

            {/* 5. Finder */}
            <button
              type="button"
              onClick={() => setView('finder')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={view === 'finder' ? 'page' : undefined}
            >
              <Sparkles className={`w-5 h-5 transition-all ${view === 'finder' ? 'fill-current text-bar stroke-[2.5]' : 'text-secondary stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'finder' ? 'font-bold text-bar' : 'font-normal text-secondary'}`}>
                {translations[locale].nav.scentFinder}
              </span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  );
}
