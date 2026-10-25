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
  Smartphone,
  Monitor,
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
import { translations, Locale, formatCurrency } from './lib/i18n.ts';
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
  computeScentDna
} from './lib/derivedCalculations.ts';
import { CatalogView } from './components/CatalogView.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { CompareView } from './components/CompareView.tsx';
import { CompareTray } from './components/CompareTray.tsx';
import { LibraryView } from './components/LibraryView.tsx';
import { ScentDiaryView } from './components/ScentDiaryView.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { ScentFinderView } from './components/ScentFinderView.tsx';
import { TryItFirstModal } from './components/TryItFirstModal.tsx';
import { BuyOptionsSheet } from './components/BuyOptionsSheet.tsx';
import { LogWearDetailSheet } from './components/LogWearDetailSheet.tsx';
import { BottomSheetOrModal } from './components/BottomSheetOrModal.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { LegalModal, LegalTab } from './components/LegalModal.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { LowBottleBanner } from './components/LowBottleBanner.tsx';
import { Bottle } from './components/Bottle.tsx';
import { ScentAura } from './components/ScentAura.tsx';
import { TryItFirstView } from './components/TryItFirstView.tsx';
import { ScentWheel } from './components/ScentWheel.tsx';
import { useTheme } from './lib/theme.ts';
import { usePrefersReducedMotion } from './lib/motion.ts';
import { 
  saveBottleToFirestore, 
  fetchUserBottlesFromFirestore,
  saveWearLogToFirestore,
  fetchUserWearLogsFromFirestore,
  saveStoryToFirestore,
  fetchUserStoriesFromFirestore,
  fetchPublishedStoriesFromFirestore,
  saveReviewToFirestore,
  fetchAllApprovedReviewsFromFirestore,
  saveWaitlistEntryToFirestore,
  fetchUserWaitlistEntriesFromFirestore,
  saveSampleOrderToFirestore,
  fetchUserSampleOrdersFromFirestore
} from './lib/firebase.ts';
import { INITIAL_WEAR_LOGS, INITIAL_SCENT_STORIES, INITIAL_REVIEWS } from './data/seedDiaryData.ts';

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
  const { user, isDemoMode, login, signup, logout, sendWhatsAppOtp, verifyWhatsAppOtp } = useAuth();
  
  const [locale, setLocale] = useState<Locale>('id');
  const [view, setView] = useState<ScreenView>('home');
  const [isMobile, setIsMobile] = useState<boolean>(false);
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

  // Bottles collection state backed by single source of truth (XC-01)
  const [bottles, setBottles] = useState<BottleState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_user_bottles');
      return saved ? JSON.parse(saved) : INITIAL_USER_BOTTLES;
    } catch {
      return INITIAL_USER_BOTTLES;
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prf_002', 'prf_007']);
  const [compareIds, setCompareIds] = useState<string[]>(['prf_001', 'prf_003']);

  // Phase 4: Scent Diary, Wear Logs, Scent Stories, and Community Reviews
  const [wearLogs, setWearLogs] = useState<WearLogState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_wear_logs');
      return saved ? JSON.parse(saved) : INITIAL_WEAR_LOGS;
    } catch {
      return INITIAL_WEAR_LOGS;
    }
  });

  const [scentStories, setScentStories] = useState<StoryState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_scent_stories');
      return saved ? JSON.parse(saved) : INITIAL_SCENT_STORIES;
    } catch {
      return INITIAL_SCENT_STORIES;
    }
  });

  const [reviews, setReviews] = useState<ReviewState[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_reviews');
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewPerfumeIdTarget, setReviewPerfumeIdTarget] = useState<string | undefined>(undefined);

  // Sync user bottles, wear logs, stories, and reviews with Firestore on authentication
  React.useEffect(() => {
    if (user) {
      fetchUserBottlesFromFirestore(user.uid).then(remoteBottles => {
        if (remoteBottles && remoteBottles.length > 0) {
          setBottles(remoteBottles);
          localStorage.setItem('senstoria_user_bottles', JSON.stringify(remoteBottles));
        }
      }).catch(err => {
        console.warn('Could not sync remote bottles from Firestore:', err);
      });

      fetchUserWearLogsFromFirestore(user.uid).then(remoteWears => {
        if (remoteWears && remoteWears.length > 0) {
          setWearLogs(remoteWears);
          localStorage.setItem('senstoria_wear_logs', JSON.stringify(remoteWears));
        }
      }).catch(err => {
        console.warn('Could not sync remote wear logs:', err);
      });

      fetchUserStoriesFromFirestore(user.uid).then(remoteStories => {
        if (remoteStories && remoteStories.length > 0) {
          setScentStories(prev => {
            const combined = [...remoteStories, ...prev.filter(s => !remoteStories.some(r => r.id === s.id))];
            localStorage.setItem('senstoria_scent_stories', JSON.stringify(combined));
            return combined;
          });
        }
      }).catch(err => {
        console.warn('Could not sync user stories:', err);
      });

      fetchAllApprovedReviewsFromFirestore().then(remoteReviews => {
        if (remoteReviews && remoteReviews.length > 0) {
          setReviews(prev => {
            const combined = [...remoteReviews, ...prev.filter(r => !remoteReviews.some(rem => rem.id === r.id))];
            localStorage.setItem('senstoria_reviews', JSON.stringify(combined));
            return combined;
          });
        }
      }).catch(err => {
        console.warn('Could not sync approved reviews:', err);
      });
    }
  }, [user]);

  // Modals & UI states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'whatsapp'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBirthDate, setAuthBirthDate] = useState('2000-01-01');
  const [authTermsAccepted, setAuthTermsAccepted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // WhatsApp OTP State
  const [waPhone, setWaPhone] = useState('+628123456789');
  const [waOtpCode, setWaOtpCode] = useState('');
  const [waOtpSent, setWaOtpSent] = useState(false);
  const [waMessage, setWaMessage] = useState<string | null>(null);

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
    if (view === 'admin') {
      fetchAdminClicks();
    }
  }, [view]);

  const t = translations[locale];

  // Derived Values calculation via Single Source of Truth (XC-01)
  const summary = computeCollectionSummary(bottles, wearLogs, scentStories);
  const currentlyWearingBottles = bottles.filter(b => b.status === 'in_use' || b.status === 'sealed');

  const selectedPerfume = allActivePerfumes.find(p => p.id === selectedPerfumeId) || allActivePerfumes[0];
  const comparePerfumes = compareIds
    .map(id => allActivePerfumes.find(p => p.id === id))
    .filter((p): p is SeedPerfume => Boolean(p));

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
    const perfumeName = perfume ? `${perfume.brand} — ${perfume.name}` : 'Parfum';

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
    setLiveAnnouncement(locale === 'id' ? `${newPct}% tersisa` : `${newPct}% remaining`);

    const msg = t.toast.loggedWear.replace('{name}', perfumeName).replace('{ml}', String(newRemaining));
    
    // When a wear is logged, the bottle fill and % bar animate down over 200ms,
    // times-worn ticks up, and then the Undo toast appears ("Logged · Undo · Add details").
    const triggerToast = () => {
      showToast(
        msg,
        () => {
          // Revert bottle volume and wear log on 8-second undo
          const prevPct = target.size_ml > 0 ? Math.round((prevMl / target.size_ml) * 100) : 0;
          setLiveAnnouncement(locale === 'id' ? `Dibatalkan. ${prevPct}% tersisa` : `Undone. ${prevPct}% remaining`);

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
        locale === 'id' ? 'Tambah Rincian' : 'Add details'
      );
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
    setToastMessage(locale === 'id' ? 'Botol ditandai selesai dan dipindahkan ke Memories.' : 'Bottle marked as finished and moved to Memories.');
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
    const perfumeName = perfume ? `${perfume.brand} — ${perfume.name}` : 'Parfum';

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

    showToast(locale === 'id' ? 'Catatan semprot dihapus' : 'Wear log removed', () => {
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
        ? (locale === 'id' ? 'Cerita aroma berhasil dipublikasikan ke linimasa!' : 'Scent story published!')
        : (locale === 'id' ? 'Draft cerita tersimpan' : 'Story draft saved')
    );
  };

  const handleDeleteStory = (storyId: string) => {
    setScentStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      localStorage.setItem('senstoria_scent_stories', JSON.stringify(updated));
      return updated;
    });
    showToast(locale === 'id' ? 'Cerita berhasil dihapus' : 'Story deleted');
  };

  // Multi-criteria Review Submit Handler (Phase 4)
  const handleSubmitReview = (review: ReviewState) => {
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

    showToast(locale === 'id' ? 'Ulasan multi-kriteriamu berhasil dipublikasikan!' : 'Your multi-criteria review was published!');
  };

  const handleOpenReviewModal = (perfumeId?: string) => {
    setReviewPerfumeIdTarget(perfumeId || selectedPerfumeId);
    setIsReviewModalOpen(true);
  };

  // Compare Toggle with Max 3 Rule (CMP-01)
  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(item => item !== id));
      showToast(locale === 'id' ? 'Parfum dihapus dari komparasi' : 'Perfume removed from comparison');
    } else {
      if (compareIds.length >= 3) {
        showToast(
          locale === 'id' 
            ? 'Maksimal 3 parfum dapat dibandingkan secara bersamaan. Hapus salah satu terlebih dahulu.' 
            : 'You can compare up to 3 perfumes. Remove one to add another.'
        );
        return;
      }
      setCompareIds(prev => [...prev, id]);
      const target = SEED_PERFUMES.find(p => p.id === id);
      showToast(
        locale === 'id' 
          ? `${target?.name || 'Parfum'} ditambahkan ke ruang komparasi (${compareIds.length + 1}/3)` 
          : `Added to comparison (${compareIds.length + 1}/3)`
      );
    }
  };

  const handleToggleWishlist = (id: string) => {
    setWishlistIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      showToast(
        exists 
          ? (locale === 'id' ? 'Dihapus dari Wishlist' : 'Removed from Wishlist') 
          : (locale === 'id' ? 'Ditambahkan ke Wishlist' : 'Added to Wishlist')
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
    showToast(locale === 'id' ? 'Permintaan sampel decant berhasil didaftarkan ke waiting list!' : 'Decant sample waitlist entry submitted!');
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
    showToast(locale === 'id' ? `Pesanan sampel #${order.order_number} berhasil dibuat (Simulasi)!` : `Sample order #${order.order_number} placed (Simulation)!`);
  };

  // Admin Catalog CRUD Handlers (ADM-04)
  const handleAddCatalogPerfume = (perfume: SeedPerfume) => {
    setAdminCatalogPerfumes(prev => {
      const next = [perfume, ...prev];
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? `Parfum "${perfume.name}" berhasil ditambahkan ke katalog!` : `Perfume "${perfume.name}" added to catalog!`);
  };

  const handleUpdateCatalogPerfume = (perfume: SeedPerfume) => {
    setAdminCatalogPerfumes(prev => {
      const next = prev.map(p => p.id === perfume.id ? perfume : p);
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? `Parfum "${perfume.name}" berhasil diperbarui!` : `Perfume "${perfume.name}" updated!`);
  };

  const handleDeleteCatalogPerfume = (perfumeId: string) => {
    setAdminCatalogPerfumes(prev => {
      const next = prev.filter(p => p.id !== perfumeId);
      localStorage.setItem('senstoria_admin_catalog', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? 'Parfum berhasil dihapus dari katalog' : 'Perfume removed from catalog');
  };

  // Admin Review Moderation Handlers (ADM-02)
  const handleApproveReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.map(r => r.id === reviewId ? { ...r, status: 'approved' as const } : r);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? 'Ulasan disetujui dan kini tampil publik!' : 'Review approved and published!');
  };

  const handleRejectReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.map(r => r.id === reviewId ? { ...r, status: 'rejected' as const } : r);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? 'Ulasan ditangguhkan' : 'Review rejected');
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.filter(r => r.id !== reviewId);
      localStorage.setItem('senstoria_reviews', JSON.stringify(next));
      return next;
    });
    showToast(locale === 'id' ? 'Ulasan dihapus' : 'Review deleted');
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
    showToast(locale === 'id' ? 'Botol baru berhasil disimpan ke lemarimu' : 'New bottle added to your Library');
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
      locale === 'id' 
        ? `${p ? p.name : 'Parfum'} berhasil ditambahkan ke Lemari` 
        : `${p ? p.name : 'Fragrance'} added to your Library`
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

    showToast(locale === 'id' ? 'Botol berhasil diperbarui' : 'Bottle updated');
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
      locale === 'id' ? 'Botol dihapus dari lemari' : 'Bottle removed from library',
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
    showToast(locale === 'id' ? 'Dihapus dari Wishlist' : 'Removed from Wishlist');
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authTab === 'signin') {
      if (!authEmail) {
        setAuthError(locale === 'id' ? 'Masukkan email kamu' : 'Please enter your email');
        return;
      }
      await login(authEmail, authPassword);
      setIsAuthModalOpen(false);
      showToast(locale === 'id' ? 'Berhasil masuk akun' : 'Signed in successfully');
    } else if (authTab === 'signup') {
      const res = await signup(authEmail, authPassword, authBirthDate, authTermsAccepted);
      if (!res.success) {
        setAuthError(res.error || 'Pendaftaran gagal');
      } else {
        setIsAuthModalOpen(false);
        showToast(locale === 'id' ? 'Akun berhasil dibuat' : 'Account created');
      }
    }
  };

  const handleSendWa = async () => {
    setAuthError(null);
    const res = await sendWhatsAppOtp(waPhone);
    setWaOtpSent(true);
    setWaMessage(res.message);
  };

  const handleVerifyWa = async () => {
    const success = await verifyWhatsAppOtp(waPhone, waOtpCode);
    if (success) {
      setIsAuthModalOpen(false);
      showToast(locale === 'id' ? 'Berhasil masuk dengan WhatsApp' : 'Logged in with WhatsApp');
    } else {
      setAuthError(locale === 'id' ? 'Kode OTP 6-digit tidak valid' : 'Invalid 6-digit OTP code');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF2] text-[#1A1A1A] flex flex-col antialiased selection:bg-[#333333] selection:text-[#FFFEF2] pb-24">
      
      {/* ── TOP BANNER: PHASE 4 STATUS & VIEWPORT SWITCH ── */}
      <div className="bg-[#333333] text-[#fffef2] text-[12px] py-2 px-4 border-b border-[#8a8a8a] flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-mono bg-[#000000] text-[#fffef2] px-2 py-0.5 border border-[#8a8a8a] font-medium text-[12px] tracking-wide">
            PHASE 7 · ADMIN BACKEND & MODERATION
          </span>
          <button
            onClick={() => setView('admin')}
            className={`text-[12px] font-mono px-2 py-0.5 border transition ${
              view === 'admin' 
                ? 'bg-[#b3261e] border-[#b3261e] text-[#fffef2] font-medium' 
                : 'bg-[#000000] border-[#8a8a8a] text-[#fffef2] hover:bg-[#333333]'
            }`}
          >
            ADMIN CONSOLE
          </button>
          <button
            onClick={() => {
              const next = !flagTryItFirstOrdering;
              setFlagTryItFirstOrdering(next);
              localStorage.setItem('senstoria_flag_try_it_first_ordering', JSON.stringify(next));
              showToast(next ? 'Feature flag try_it_first_ordering: AKTIF' : 'Feature flag try_it_first_ordering: NONAKTIF');
            }}
            className={`text-[12px] font-mono px-2 py-0.5 border transition ${
              flagTryItFirstOrdering 
                ? 'bg-[#000000] border-[#fffef2] text-[#fffef2] font-medium' 
                : 'bg-[#000000] border-[#8a8a8a] text-[#d9d7c9] hover:text-[#fffef2]'
            }`}
          >
            FLAG: try_it_first_ordering [{flagTryItFirstOrdering ? 'ON' : 'OFF'}]
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#000000] p-0.5 border border-[#8a8a8a]">
            <button 
              onClick={() => setIsMobile(false)}
              className={`p-1.5 transition ${!isMobile ? 'bg-[#333333] text-[#fffef2]' : 'text-[#d9d7c9] hover:text-[#fffef2]'}`}
              title="Desktop 1200px"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsMobile(true)}
              className={`p-1.5 transition ${isMobile ? 'bg-[#333333] text-[#fffef2]' : 'text-[#d9d7c9] hover:text-[#fffef2]'}`}
              title="Mobile 390px"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[12px] font-mono space-x-1">
            <button 
              onClick={() => setLocale('id')} 
              className={`px-1 font-medium ${locale === 'id' ? 'text-[#fffef2] underline' : 'text-[#d9d7c9] hover:text-[#fffef2]'}`}
            >
              ID
            </button>
            <span className="text-[#8a8a8a]">·</span>
            <button 
              onClick={() => setLocale('en')} 
              className={`px-1 font-medium ${locale === 'en' ? 'text-[#fffef2] underline' : 'text-[#d9d7c9] hover:text-[#fffef2]'}`}
            >
              EN
            </button>
          </div>

          <button 
            type="button"
            onClick={() => handleOpenLegalModal('data_rights')}
            className="text-[#d9d7c9] hover:text-[#fffef2] underline text-[12px] transition focus:outline-hidden"
            title="Pusat Hak Data & Ekspor (UU No. 27/2022)"
          >
            Hak Data (UU PDP)
          </button>

          {user?.role === 'admin' && (
            <button 
              type="button"
              onClick={() => setView('admin')}
              className="text-[#fffef2] font-medium underline text-[12px] transition focus:outline-hidden"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>

      {/* Skip to Main Content Link (WCAG 2.1 AA) */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1A1A1A] focus:text-[#FFFEF2] focus:ring-2 focus:ring-[#8A4B14] focus:outline-hidden font-semibold text-xs shadow-xl border border-neutral-600"
      >
        Lewati ke Konten Utama (Skip to Content)
      </a>

      {/* Screen Reader Live Region for Volume and State Announcements (Rule 8) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* ── RESPONSIVE CONTAINER ── */}
      <div className={`w-full mx-auto flex-1 flex flex-col transition-all duration-300 ${isMobile ? 'max-w-[390px] border-x-4 border-neutral-800 shadow-2xl my-3' : 'max-w-[1200px] border-x border-[#D9D7C9]'}`}>
        
        {/* ── MOBILE HEADER (< 1024px / < lg) ── */}
        {/* Shrunk to strictly: Logo, Try It First, Language Switcher (EN | ID), Account Icon */}
        <header className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-[#D9D7C9] bg-[#FFFEF2] sticky top-0 z-30">
          <button 
            onClick={() => setView('home')} 
            className="flex items-center min-h-[44px] -ml-1 px-1 focus:outline-hidden"
            aria-label="Senstoria - Ke Beranda"
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
              className={`min-h-[44px] px-3 py-1.5 border text-xs font-semibold rounded-xs transition flex items-center gap-1 ${
                view === 'tryItFirst' 
                  ? 'bg-[#1A1A1A] text-white border-black' 
                  : 'bg-white border-[#333333] text-[#1A1A1A] hover:bg-[#F4F3E6]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.nav.tryItFirst}</span>
            </button>

            {/* Language Switcher (EN | ID) */}
            <button
              type="button"
              onClick={() => setLocale(prev => prev === 'id' ? 'en' : 'id')}
              className="min-h-[44px] min-w-[44px] px-2 py-1.5 border border-[#333333] bg-white hover:bg-[#F4F3E6] text-xs font-mono font-bold text-[#1A1A1A] rounded-xs transition flex items-center justify-center"
              title="Ganti Bahasa (Switch Language)"
              aria-label={`Ubah bahasa ke ${locale === 'id' ? 'English' : 'Bahasa Indonesia'}`}
            >
              {locale === 'id' ? 'ID' : 'EN'}
            </button>

            {/* Account Icon */}
            {user ? (
              <button 
                onClick={logout}
                className="min-h-[44px] min-w-[44px] p-2 border border-[#333333] hover:bg-[#F4F3E6] text-xs text-[#1A1A1A] rounded-xs transition flex items-center justify-center"
                title={`Sign out (${user.nickname})`}
                aria-label={`Keluar akun ${user.nickname}`}
              >
                <LogOut className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAuthTab('signin');
                  setIsAuthModalOpen(true);
                }} 
                className="min-h-[44px] min-w-[44px] p-2 border border-[#333333] bg-[#333333] hover:bg-black text-[#FFFEF2] rounded-xs transition flex items-center justify-center"
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
        <header className="hidden lg:flex items-center justify-between gap-6 px-8 py-5 border-b border-[#D9D7C9] bg-[#FFFEF2] sticky top-0 z-30">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setView('home')} 
              className="flex items-center gap-2 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8A4B14] rounded-xs"
              aria-label="Senstoria - Ke Beranda"
            >
              <img 
                src="/assets/senstoria-logo.png" 
                alt="Senstoria" 
                className="h-8.5 w-auto object-contain transition-opacity duration-200 group-hover:opacity-85"
              />
            </button>
            
            <nav className="flex items-center gap-6 text-sm text-[#5C5C5C]">
              <button 
                onClick={() => setView('home')} 
                className={`hover:text-black transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'home' ? 'text-black font-bold' : 'font-medium'}`}
              >
                {t.nav.home}
              </button>
              <button 
                onClick={() => setView('library')} 
                className={`hover:text-black transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'library' ? 'text-black font-bold' : 'font-medium'}`}
              >
                {t.nav.library}
              </button>
              <button 
                onClick={() => setView('diary')} 
                className={`hover:text-black transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'diary' ? 'text-black font-bold' : 'font-medium'}`}
              >
                {locale === 'id' ? 'Jurnal' : 'Journal'}
              </button>
              <button 
                onClick={() => {
                  setCatalogFilterNote(null);
                  setCatalogFilterBrand(null);
                  setCatalogFilterFamily(null);
                  setView('catalog');
                }} 
                className={`hover:text-black transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'catalog' || view === 'detail' ? 'text-black font-bold' : 'font-medium'}`}
              >
                {t.nav.catalog}
              </button>
              <button 
                onClick={() => setView('finder')} 
                className={`hover:text-black transition whitespace-nowrap min-h-[44px] flex items-center ${view === 'finder' ? 'text-black font-bold' : 'font-medium'}`}
              >
                {locale === 'id' ? 'Temukan' : 'Finder'}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            {/* Try It First Button */}
            <button
              onClick={() => setView('tryItFirst')}
              className={`px-3 py-1.5 border text-xs font-semibold rounded-xs transition flex items-center gap-1.5 ${
                view === 'tryItFirst' 
                  ? 'bg-[#1A1A1A] text-white border-black' 
                  : 'bg-[#F4F3E6] border-[#333333] hover:bg-neutral-200 text-[#1A1A1A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.nav.tryItFirst}</span>
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLocale(prev => prev === 'id' ? 'en' : 'id')}
              className="px-2.5 py-1.5 border border-[#333333] bg-white hover:bg-[#F4F3E6] font-mono text-xs font-bold text-[#1A1A1A] rounded-xs transition"
              title="Ganti Bahasa (Switch Language)"
            >
              {locale === 'id' ? 'ID | EN' : 'EN | ID'}
            </button>

            {/* Compare Shortcut */}
            {compareIds.length > 0 && (
              <button 
                onClick={() => setView('compare')} 
                className={`px-3 py-1.5 border border-[#333333] text-xs font-medium transition flex items-center gap-1 rounded-xs ${view === 'compare' ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#F4F3E6]'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t.nav.compare} ({compareIds.length})</span>
              </button>
            )}

            {/* Account Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[#5c5c5c]">
                  {user.nickname} ({user.role})
                </span>
                <button 
                  onClick={logout} 
                  className="px-3 py-1.5 border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[12px] transition flex items-center gap-1 rounded-none text-[#000000]"
                  title="Sign Out"
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
                className="bg-[#333333] hover:bg-black text-[#FFFEF2] px-4 py-2 text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5 rounded-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.nav.signIn}</span>
              </button>
            )}
          </div>
        </header>

        {/* Demo Mode Notice Banner if logged out (AUTH-11) */}
        {isDemoMode && !user && (
          <div className="bg-[#F4F3E6] border-b border-[#D9D7C9] px-6 py-2.5 text-xs text-[#5C5C5C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>{locale === 'id' ? 'Mode Demo: Data tersimpan di perangkat ini. Buat akun agar koleksimu tidak hilang.' : 'Demo Mode: Data saved on this device only. Create an account to preserve your collection.'}</span>
            </div>
            <button 
              onClick={() => {
                setAuthTab('signup');
                setIsAuthModalOpen(true);
              }}
              className="text-[#1A1A1A] font-bold underline ml-2 whitespace-nowrap"
            >
              {locale === 'id' ? 'Daftar Akun' : 'Sign Up'}
            </button>
          </div>
        )}

        {/* ── MAIN VIEWPORT CONTENT (WCAG 2.1 AA Landmark) ── */}
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-8 space-y-8 pb-36 lg:pb-12 focus:outline-hidden">
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
                onMarkFinished={handleMarkFinished}
              />

              {/* Confident Editorial Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-[#d9d7c9] pb-8">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                  <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
                    {t.home.heroKicker}
                  </span>
                  <h1 className="font-serif text-[32px] leading-[40px] md:text-[48px] md:leading-[56px] font-normal text-[#000000]">
                    {t.home.heroTitle}
                  </h1>
                  <p className="text-[16px] leading-[24px] text-[#5c5c5c] max-w-xl">
                    {t.home.heroSubtitle}
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setView('finder')}
                      className="min-h-[48px] bg-[#333333] hover:bg-black text-[#fffef2] px-6 py-3 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>{locale === 'id' ? 'Mulai Scent Finder' : 'Take the Scent Finder'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCatalogFilterNote(null);
                        setCatalogFilterBrand(null);
                        setCatalogFilterFamily(null);
                        setView('catalog');
                      }}
                      className="min-h-[48px] border border-[#333333] hover:bg-[#f4f3e6] text-[#000000] px-6 py-3 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>{locale === 'id' ? 'Jelajahi Katalog Parfum' : 'Browse Fragrance Catalog'}</span>
                    </button>
                    <button 
                      onClick={() => setView('library')}
                      className="min-h-[48px] border border-[#8a8a8a] hover:bg-[#f4f3e6] text-[#333333] px-6 py-3 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{locale === 'id' ? 'Buka Pustaka Saya' : 'Open My Library'}</span>
                    </button>
                  </div>
                </div>

                {/* Collection Glance Tiles (BR-01, XC-01 single source) — Numbers first, decoration never */}
                <div className="lg:col-span-5 bg-[#f4f3e6] p-6 border border-[#d9d7c9] flex flex-col justify-between space-y-6">
                  <div className="flex justify-between items-baseline border-b border-[#d9d7c9] pb-3">
                    <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium">
                      {t.home.glanceTitle}
                    </span>
                    <span className="text-[12px] font-mono text-[#5c5c5c]">
                      {t.home.glanceTruth}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-[#000000] tabular-nums font-normal">
                        {summary.currentlyWearingCount}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-[#5c5c5c] mt-2">
                        {t.home.currentlyWearingLabel}
                      </p>
                    </div>
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-[#000000] tabular-nums font-normal">
                        {wishlistIds.length}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-[#5c5c5c] mt-2">
                        {t.home.wishlistLabel}
                      </p>
                    </div>
                    <div>
                      <p className="font-serif text-[44px] md:text-[56px] leading-none text-[#000000] tabular-nums font-normal">
                        {summary.totalWearsCount}
                      </p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-[#5c5c5c] mt-2">
                        {t.home.wearsLabel}
                      </p>
                    </div>
                  </div>

                  {/* Scent DNA Bar — Monochrome Locked Tokens */}
                  <div className="space-y-2 pt-2 border-t border-[#d9d7c9]">
                    <div className="flex justify-between text-xs text-[#000000]">
                      <span className="font-medium text-[12px]">{t.home.scentDnaTitle}</span>
                      <span className="font-mono text-[12px] text-[#5c5c5c]">Woody / Floral Ambery</span>
                    </div>
                    <div className="w-full bg-[#d9d7c9] h-2 overflow-hidden flex">
                      <div className="bg-[#333333] h-full" style={{ width: '52%' }}></div>
                      <div className="bg-[#5c5c5c] h-full" style={{ width: '28%' }}></div>
                      <div className="bg-[#8a8a8a] h-full" style={{ width: '20%' }}></div>
                    </div>
                    <p className="text-[12px] text-[#5c5c5c]">
                      {t.home.scentDnaCalculated}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1-Tap Wear Rotation (BR-02: Remaining % allowed here ONLY) */}
              <div className="space-y-6">
                {/* Standardized Section Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d9d7c9] pb-3">
                  <div className="space-y-1">
                    <span className="text-[12px] uppercase tracking-widest text-[#5c5c5c] font-medium block">
                      {locale === 'id' ? 'ROTASI HARIAN' : 'DAILY ROTATION'}
                    </span>
                    <h2 className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] text-[#000000] font-normal">
                      {t.home.logTodayTitle}
                    </h2>
                    <p className="text-[14px] leading-[20px] text-[#5c5c5c]">
                      {t.home.logTodaySubtitle}
                    </p>
                  </div>
                  <span className="text-[12px] font-mono text-[#5c5c5c]">
                    {currentlyWearingBottles.length} {t.home.bottlesInRotation}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  {currentlyWearingBottles.map((bottle, idx) => {
                    const perfume = SEED_PERFUMES.find(p => p.id === bottle.perfume_id);
                    if (!perfume) return null;

                    const percentage = calculateRemainingPercentage(bottle);
                    const low = isLowBottle(bottle);

                    return (
                      <div 
                        key={bottle.id} 
                        className={`bg-white p-5 border ${low ? 'border-[#b3261e]' : 'border-[#d9d7c9]'} flex flex-col justify-between h-full space-y-4 transition-colors animate-card-enter`}
                        style={{ animationDelay: `${Math.min(idx, 7) * 30}ms` }}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[12px] uppercase tracking-wider text-[#5c5c5c] font-medium">
                              {perfume.brand}
                            </span>
                            {low ? (
                              <span className="text-[12px] font-medium text-[#b3261e] border border-[#b3261e] px-1.5 py-0.5">
                                {t.home.lowBottleAlert}
                              </span>
                            ) : (
                              <span className="text-[12px] font-mono text-[#5c5c5c]">
                                {perfume.concentration}
                              </span>
                            )}
                          </div>

                          {/* Hero Bottle Silhouette with liquid level drawn */}
                          <div className="py-2 flex justify-center">
                            <Bottle
                              fragranceId={perfume.id}
                              name={perfume.name}
                              brand={perfume.brand}
                              size="sm"
                              showFill={true}
                              fillPercentage={percentage}
                            />
                          </div>

                          <div>
                            <h3 className="text-[18px] leading-[24px] font-medium text-[#000000] line-clamp-2 h-[48px]">
                              {perfume.name}
                            </h3>
                            <p className="text-[14px] leading-[20px] text-[#5c5c5c] truncate mt-1">
                              {perfume.top_notes}
                            </p>
                          </div>
                        </div>

                        {/* Fill level progress bar (BR-02): strictly 200ms scaleX transform */}
                        <div className="space-y-3 pt-2 border-t border-[#d9d7c9]">
                          <div className="space-y-1">
                            <div className="w-full bg-[#f4f3e6] border border-[#d9d7c9] h-2 overflow-hidden">
                              <div 
                                className={`h-full w-full origin-left transition-transform duration-200 ease-out ${low ? 'bg-[#b3261e]' : 'bg-[#333333]'}`} 
                                style={{ transform: `scaleX(${Math.max(0, Math.min(1, percentage / 100))})` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[12px] font-mono text-[#5c5c5c] tabular-nums">
                              <span>{percentage}% {t.home.remainingText}</span>
                              <span>{bottle.remaining_ml} / {bottle.size_ml} ml</span>
                            </div>
                          </div>

                          {/* Action Buttons: EXACTLY ONE primary (filled) button per card */}
                          <div>
                            {low ? (
                              <div className="space-y-2">
                                <button 
                                  onClick={() => handleLogWear(bottle.id)}
                                  className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Droplet className="w-4 h-4" />
                                  <span>{t.home.logWearAction}</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setBuyPerfume(perfume)}
                                  className="w-full min-h-[44px] py-2 border border-[#b3261e] text-[#b3261e] text-xs font-semibold hover:bg-[#f4f3e6] transition text-center cursor-pointer"
                                >
                                  {t.home.repurchaseAction}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWearDetailInitialBottleId(bottle.id);
                                    setIsLogWearDetailOpen(true);
                                  }}
                                  className="w-full text-center text-[12px] text-[#5c5c5c] hover:text-[#000000] py-1 block underline cursor-pointer"
                                >
                                  {locale === 'id' ? '+ Rincian Semprot (Suasana/Cuaca)' : '+ Wear Details (Mood/Weather)'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <button 
                                  onClick={() => handleLogWear(bottle.id)}
                                  className="w-full min-h-[48px] py-3 bg-[#333333] hover:bg-black text-[#fffef2] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
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
                                  className="w-full text-center text-[12px] text-[#5c5c5c] hover:text-[#000000] py-1 block underline cursor-pointer"
                                >
                                  {locale === 'id' ? '+ Rincian Semprot (Suasana/Cuaca)' : '+ Wear Details (Mood/Weather)'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
          )}

          {/* ══════════════ 5B. SCENT DIARY & REVIEWS (PHASE 4 CORE) ══════════════ */}
          {view === 'diary' && (
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
          )}

          {/* ══════════════ 7. ADMIN DASHBOARD VIEW (ADM-01 to ADM-10) ══════════════ */}
          {view === 'admin' && (
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
          )}

          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#D9D7C9] bg-[#F4F3E6] px-6 py-8 text-xs text-[#5C5C5C] space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <button 
              onClick={() => setView('home')} 
              className="flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8A4B14] rounded-xs group"
              aria-label="Senstoria - Ke Beranda"
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
                className="hover:text-black focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
              >
                {t.footer.about}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('privacy')} 
                className="hover:text-black focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
              >
                {t.footer.privacy}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('terms')} 
                className="hover:text-black focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
              >
                {t.footer.terms}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('affiliate')} 
                className="hover:text-black focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
              >
                {t.footer.affiliateDisclosure}
              </button>
              <button 
                type="button"
                onClick={() => handleOpenLegalModal('contact')} 
                className="hover:text-black focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
              >
                {t.footer.contact}
              </button>
            </div>
          </div>
          <p className="text-[12px] text-[#5c5c5c] leading-relaxed">
            {t.footer.integrityStatement}
          </p>
        </footer>

        {/* ── PERSISTENT COMPARE TRAY (CMP-01) ── */}
        <CompareTray
          comparePerfumes={comparePerfumes}
          onRemove={id => handleToggleCompare(id)}
          onClear={() => {
            setCompareIds([]);
            showToast(locale === 'id' ? 'Ruang komparasi dikosongkan' : 'Comparison tray cleared');
          }}
          onOpenCompare={() => setView('compare')}
          locale={locale}
        />

        {/* ── 8-SECOND GLOBAL UNDO TOAST NOTIFICATION (C3, BR-02) ── */}
        {toastMessage && (
          <div className="fixed bottom-20 right-6 max-w-md bg-[#333333] text-[#fffef2] px-5 py-3.5 border border-[#8a8a8a] flex items-center justify-between gap-4 z-50 text-xs animate-toast-enter">
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
                  className="text-[#fffef2] underline hover:text-white text-xs cursor-pointer font-medium"
                >
                  {toastExtraLabel || (locale === 'id' ? 'Rincian' : 'Add details')}
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
                  className="bg-[#fffef2] text-black px-3 py-1 text-xs font-bold hover:bg-[#f4f3e6] transition shrink-0 active:scale-95 cursor-pointer"
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
          title={authTab === 'signin' ? 'Masuk ke Senstoria' : authTab === 'signup' ? 'Daftar Akun Baru' : 'Masuk via WhatsApp'}
          subtitle={authTab === 'signin' 
            ? 'Akses lemari parfum dan catatan scent diary kamu di semua perangkat.'
            : 'Wajib berusia 18 tahun ke atas sesuai UU Pelindungan Data Pribadi (UU PDP).'}
          maxWidth="max-w-md"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 border border-[#333333] text-center text-xs p-0.5 bg-[#F4F3E6]">
              <button 
                type="button"
                onClick={() => setAuthTab('signin')}
                className={`min-h-[36px] py-1.5 font-medium transition ${authTab === 'signin' ? 'bg-[#333333] text-white' : 'text-[#5C5C5C]'}`}
              >
                Masuk Email
              </button>
              <button 
                type="button"
                onClick={() => setAuthTab('signup')}
                className={`min-h-[36px] py-1.5 font-medium transition ${authTab === 'signup' ? 'bg-[#333333] text-white' : 'text-[#5C5C5C]'}`}
              >
                Daftar
              </button>
              <button 
                type="button"
                onClick={() => setAuthTab('whatsapp')}
                className={`min-h-[36px] py-1.5 font-medium transition ${authTab === 'whatsapp' ? 'bg-[#333333] text-white' : 'text-[#5C5C5C]'}`}
              >
                WhatsApp OTP
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authTab !== 'whatsapp' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold block">Alamat Email</label>
                  <input 
                    type="email" 
                    inputMode="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full p-3 bg-white border border-[#333333] text-base md:text-sm focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Kata Sandi</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full p-3 bg-white border border-[#333333] text-base md:text-sm focus:outline-hidden"
                  />
                </div>

                {authTab === 'signup' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="font-semibold block">Tanggal Lahir (Verifikasi 18+)</label>
                      <input 
                        type="date" 
                        required
                        value={authBirthDate}
                        onChange={e => setAuthBirthDate(e.target.value)}
                        className="w-full p-3 bg-white border border-[#333333] text-base md:text-sm focus:outline-hidden"
                      />
                      <span className="text-[12px] text-[#5c5c5c] block">
                        Tanggal lahir tidak disimpan permanen, hanya untuk memvalidasi batas usia 18+.
                      </span>
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer pt-1 min-h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={authTermsAccepted}
                        onChange={e => setAuthTermsAccepted(e.target.checked)}
                        className="mt-0.5 accent-[#333333] w-4 h-4"
                      />
                      <span className="text-[12px] text-[#5c5c5c]">
                        Saya menyetujui <a href="#terms" className="underline text-[#000000]">Syarat Penggunaan</a> dan <a href="#privacy" className="underline text-[#000000]">Kebijakan Privasi</a> Senstoria.
                      </span>
                    </label>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full min-h-[48px] py-3.5 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[14px] font-medium transition cursor-pointer"
                >
                  {authTab === 'signin' ? 'Masuk' : 'Daftar Sekarang'}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-[12px]">
                <div className="space-y-1">
                  <label className="font-medium block text-[#000000]">Nomor WhatsApp (+62)</label>
                  <input 
                    type="tel" 
                    inputMode="tel"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    placeholder="+628123456789"
                    className="w-full p-3 bg-[#fffef2] border border-[#8a8a8a] text-[14px] focus:outline-hidden font-mono"
                  />
                </div>

                {!waOtpSent ? (
                  <button 
                    type="button" 
                    onClick={handleSendWa}
                    className="w-full min-h-[48px] py-3.5 bg-[#333333] hover:bg-[#000000] text-[#fffef2] text-[14px] font-medium transition cursor-pointer"
                  >
                    Kirim Kode OTP WhatsApp
                  </button>
                ) : (
                  <div className="space-y-3">
                    {waMessage && (
                      <p className="p-3 bg-[#f4f3e6] border border-[#d9d7c9] text-[#000000] text-[12px]">
                        {waMessage}
                      </p>
                    )}
                    <div className="space-y-1">
                      <label className="font-semibold block">Kode Verifikasi (6-Digit)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        maxLength={6}
                        value={waOtpCode}
                        onChange={e => setWaOtpCode(e.target.value)}
                        placeholder="Contoh: 123456"
                        className="w-full p-3 bg-white border border-[#333333] text-base md:text-sm tracking-widest text-center font-mono focus:outline-hidden"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleVerifyWa}
                      className="w-full min-h-[48px] py-3.5 bg-[#333333] hover:bg-black text-[#FFFEF2] text-sm font-medium transition cursor-pointer"
                    >
                      Verifikasi & Masuk
                    </button>
                  </div>
                )}
              </div>
            )}
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
              userPhone={waPhone}
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
          userName={user?.nickname || 'Anggota Senstoria'}
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
            showToast(locale === 'id' ? 'Seluruh data pribadi Anda telah dimusnahkan secara permanen.' : 'All personal data permanently erased.');
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
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-4 z-30 lg:hidden bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-neutral-700 min-h-[44px] text-xs font-semibold active:scale-95 transition"
            aria-label="Catat pemakaian parfum hari ini"
          >
            <Droplet className="w-4 h-4 text-sky-400" />
            <span>{locale === 'id' ? 'Catat Semprot' : 'Log Wear'}</span>
          </button>
        )}

        {/* ── LOGGED-IN MOBILE BOTTOM NAVIGATION BAR (Req 1) ── */}
        {/* Exactly 5 items: Home, Library, Journal, Catalog, Finder */}
        {/* Monochrome line icon + text label >= 12px; Active is filled icon + bold text, NEVER colour */}
        <nav 
          className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFEF2] border-t border-[#D9D7C9] shadow-lg lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          aria-label="Navigasi Utama Aplikasi"
        >
          <div className="grid grid-cols-5 h-16 items-center px-1">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => setView('home')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden"
              aria-current={view === 'home' ? 'page' : undefined}
            >
              <HomeIcon className={`w-5 h-5 transition-all ${view === 'home' ? 'fill-current text-[#1A1A1A] stroke-[2.5]' : 'text-[#5C5C5C] stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'home' ? 'font-bold text-[#1A1A1A]' : 'font-normal text-[#5C5C5C]'}`}>
                {t.nav.home}
              </span>
            </button>

            {/* 2. Library */}
            <button
              type="button"
              onClick={() => setView('library')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden"
              aria-current={view === 'library' ? 'page' : undefined}
            >
              <BookOpen className={`w-5 h-5 transition-all ${view === 'library' ? 'fill-current text-[#1A1A1A] stroke-[2.5]' : 'text-[#5C5C5C] stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'library' ? 'font-bold text-[#1A1A1A]' : 'font-normal text-[#5C5C5C]'}`}>
                {t.nav.library}
              </span>
            </button>

            {/* 3. Journal */}
            <button
              type="button"
              onClick={() => setView('diary')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden"
              aria-current={view === 'diary' ? 'page' : undefined}
            >
              <BookText className={`w-5 h-5 transition-all ${view === 'diary' ? 'fill-current text-[#1A1A1A] stroke-[2.5]' : 'text-[#5C5C5C] stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'diary' ? 'font-bold text-[#1A1A1A]' : 'font-normal text-[#5C5C5C]'}`}>
                {locale === 'id' ? 'Jurnal' : 'Journal'}
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
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden"
              aria-current={view === 'catalog' || view === 'detail' ? 'page' : undefined}
            >
              <Compass className={`w-5 h-5 transition-all ${view === 'catalog' || view === 'detail' ? 'fill-current text-[#1A1A1A] stroke-[2.5]' : 'text-[#5C5C5C] stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'catalog' || view === 'detail' ? 'font-bold text-[#1A1A1A]' : 'font-normal text-[#5C5C5C]'}`}>
                {t.nav.catalog}
              </span>
            </button>

            {/* 5. Finder */}
            <button
              type="button"
              onClick={() => setView('finder')}
              className="flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition active:scale-95 text-center focus:outline-hidden"
              aria-current={view === 'finder' ? 'page' : undefined}
            >
              <Sparkles className={`w-5 h-5 transition-all ${view === 'finder' ? 'fill-current text-[#1A1A1A] stroke-[2.5]' : 'text-[#5C5C5C] stroke-[1.75]'}`} />
              <span className={`text-xs transition-all leading-none ${view === 'finder' ? 'font-bold text-[#1A1A1A]' : 'font-normal text-[#5C5C5C]'}`}>
                {locale === 'id' ? 'Temukan' : 'Finder'}
              </span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  );
}
