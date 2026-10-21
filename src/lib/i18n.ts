export type Locale = 'id' | 'en';

export interface Translations {
  appName: string;
  tagline: string;
  sampleDataBadge: string;
  sampleDataNotice: string;
  nav: {
    home: string;
    library: string;
    catalog: string;
    diary: string;
    scentFinder: string;
    compare: string;
    tryItFirst: string;
    signIn: string;
    signOut: string;
    register: string;
    admin: string;
  };
  home: {
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    startFinder: string;
    openLibrary: string;
    glanceTitle: string;
    glanceTruth: string;
    currentlyWearingLabel: string;
    wishlistLabel: string;
    wearsLabel: string;
    scentDnaTitle: string;
    scentDnaCalculated: string;
    logTodayTitle: string;
    logTodaySubtitle: string;
    bottlesInRotation: string;
    logWearAction: string;
    repurchaseAction: string;
    lowBottleAlert: string;
    remainingText: string;
    lowBottleBannerSingle: string;
    lowBottleBannerGrouped: string;
    buyAgain: string;
    markAsFinished: string;
  };
  emptyStates: {
    libraryWearingTitle: string;
    libraryWearingBody: string;
    libraryWearingCta: string;
    libraryWishlistTitle: string;
    libraryWishlistBody: string;
    libraryWishlistCta: string;
    libraryFavoritesTitle: string;
    libraryFavoritesBody: string;
    libraryFavoritesCta: string;
    libraryMemoriesTitle: string;
    libraryMemoriesBody: string;
    libraryMemoriesCta: string;
    diaryTitle: string;
    diaryBody: string;
    diaryCtaLog: string;
    diaryCtaStory: string;
    compareTitle: string;
    compareBody: string;
    compareCta: string;
  };
  diary: {
    title: string;
    kicker: string;
    subtitle: string;
    tabWearLogs: string;
    tabScentStories: string;
    tabReviews: string;
    statsWears: string;
    statsCompliments: string;
    statsStreak: string;
    statsStories: string;
    quickLogTitle: string;
    selectBottle: string;
    spraysLabel: string;
    moodLabel: string;
    occasionLabel: string;
    weatherLabel: string;
    complimentCheckbox: string;
    quickLogAction: string;
    emptyWears: string;
    newStoryButton: string;
    draftAutoSaved: string;
    storyTitlePlaceholder: string;
    storyBodyPlaceholder: string;
    publishStoryAction: string;
    saveDraftAction: string;
    writeReviewButton: string;
    filterByPerfume: string;
  };
  library: {
    title: string;
    kicker: string;
    valueLabel: string;
    tabCurrentlyWearing: string;
    tabWishlist: string;
    tabFavorite: string;
    tabMemories: string;
    emptyCurrentlyWearing: string;
    emptyWishlist: string;
    emptyFavorite: string;
    emptyMemories: string;
    addBottle: string;
    searchCatalog: string;
    addCustomManual: string;
    logWear: string;
    viewSpecs: string;
  };
  product: {
    brandClaimsTitle: string;
    wearersVsClaims: string;
    notesPyramid: string;
    topNotes: string;
    heartNotes: string;
    baseNotes: string;
    longevity: string;
    sillage: string;
    climate: string;
    referencePrice: string;
    buyOfficialShopee: string;
    buyOfficialTokopedia: string;
    affiliateDisclosure: string;
    wantToTry: string;
  };
  finder: {
    stepOf: string;
    climateQuestion: string;
    climateExplanation: string;
    back: string;
    skip: string;
    continue: string;
    notSure: string;
    matchScore: string;
    whyItFits: string;
    possibleMismatch: string;
  };
  compare: {
    title: string;
    subtitle: string;
    slotsFilled: string;
    attribute: string;
    originTier: string;
    concentration: string;
    family: string;
    matchScore: string;
    skinLongevity: string;
    estimatedPrice: string;
    buyAction: string;
  };
  toast: {
    loggedWear: string;
    undo: string;
    saved: string;
  };
  footer: {
    about: string;
    privacy: string;
    terms: string;
    affiliateDisclosure: string;
    contact: string;
    integrityStatement: string;
  };
}

export const translations: Record<Locale, Translations> = {
  id: {
    appName: 'SENSTORIA',
    tagline: 'Perpustakaan Aroma Pribadi & Pencari Selera',
    sampleDataBadge: 'Data contoh',
    sampleDataNotice: 'Data contoh untuk evaluasi awal, sedang dalam verifikasi kurasi',
    nav: {
      home: 'Beranda',
      library: 'Library',
      catalog: 'Katalog',
      diary: 'Scent Diary',
      scentFinder: 'Scent Finder',
      compare: 'Compare',
      tryItFirst: 'Try It First',
      signIn: 'Masuk Akun',
      signOut: 'Keluar',
      register: 'Daftar',
      admin: 'Admin'
    },
    home: {
      heroKicker: 'Perpustakaan Aroma Pribadi',
      heroTitle: 'Menemukan parfum yang sungguh cocok dengan seleramu.',
      heroSubtitle: 'Catat koleksimu, kenali DNA aroma tubuhmu, dan temukan rekomendasi objektif tanpa klaim berlebihan dan bebas risiko zonk.',
      startFinder: 'Ikuti Scent Finder',
      openLibrary: 'Buka Lemari Koleksi',
      glanceTitle: 'Kilas Koleksi',
      glanceTruth: 'Satu Sumber Kebenaran',
      currentlyWearingLabel: 'Currently Wearing',
      wishlistLabel: 'Wishlist',
      wearsLabel: 'Total Semprot',
      scentDnaTitle: 'Dominasi Scent DNA',
      scentDnaCalculated: 'Dihitung deterministik dari botol yang kamu miliki',
      logTodayTitle: 'Catat Pemakaian Hari Ini',
      logTodaySubtitle: '1-tap untuk mencatat pemakaian. Volume sisa botol akan otomatis berkurang 0.5 ml.',
      bottlesInRotation: 'botol aktif di rotasi',
      logWearAction: 'Semprot Hari Ini (+1)',
      repurchaseAction: 'Beli Ulang di Shopee',
      lowBottleAlert: 'Hampir Habis',
      remainingText: 'tersisa',
      lowBottleBannerSingle: '{name} hampir habis ({pct}% tersisa)',
      lowBottleBannerGrouped: '{count} botol hampir habis',
      buyAgain: 'Beli lagi',
      markAsFinished: 'Tandai Habis'
    },
    emptyStates: {
      libraryWearingTitle: 'Rak Sedang Dipakai Kosong',
      libraryWearingBody: 'Rakmu masih kosong. Tambahkan parfum yang sedang kamu pakai.',
      libraryWearingCta: 'Cari Parfum',
      libraryWishlistTitle: 'Wishlist Masih Kosong',
      libraryWishlistBody: 'Wishlist kamu masih kosong. Jelajahi parfum yang ingin kamu coba.',
      libraryWishlistCta: 'Jelajahi Katalog',
      libraryFavoritesTitle: 'Belum Ada Favorit',
      libraryFavoritesBody: 'Belum ada parfum favorit. Tandai botol yang kamu sukai dengan hati.',
      libraryFavoritesCta: 'Lihat Koleksi',
      libraryMemoriesTitle: 'Belum Ada Botol Habis',
      libraryMemoriesBody: 'Belum ada botol yang habis. Parfum yang telah selesai akan tersimpan di sini.',
      libraryMemoriesCta: 'Jelajahi Katalog',
      diaryTitle: 'Buku Harian Belum Ada Catatan',
      diaryBody: 'Catat semprotan harian atau tulis cerita aromamu. Keduanya membentuk perjalanan wewangianmu.',
      diaryCtaLog: 'Catat Semprotan',
      diaryCtaStory: 'Tulis Cerita Aroma',
      compareTitle: 'Pilih Parfum untuk Dibandingkan',
      compareBody: 'Pilih hingga 3 parfum untuk dibandingkan.',
      compareCta: 'Cari Parfum'
    },
    diary: {
      title: 'Buku Harian Aroma & Memori',
      kicker: 'Scent Diary & Stories',
      subtitle: 'Catat kebiasaan semprot harianmu, abadikan kenangan yang terikat dengan aroma, dan tulis ulasan multi-kriteria jujur.',
      tabWearLogs: 'Log Pemakaian',
      tabScentStories: 'Cerita Aroma & Memori',
      tabReviews: 'Ulasan Komunitas',
      statsWears: 'Total Semprot Tercatat',
      statsCompliments: 'Pujian Diterima',
      statsStreak: 'Hari Beruntun',
      statsStories: 'Cerita Tersimpan',
      quickLogTitle: 'Catat Pemakaian Hari Ini',
      selectBottle: 'Pilih Botol Dipakai',
      spraysLabel: 'Intensitas Semprotan',
      moodLabel: 'Suasana Hati (Mood)',
      occasionLabel: 'Konteks / Acara',
      weatherLabel: 'Kondisi Cuaca / Ruangan',
      complimentCheckbox: 'Mendapat pujian / compliment hari ini (+1)',
      quickLogAction: 'Simpan ke Buku Harian (-0.5ml)',
      emptyWears: 'Belum ada catatan semprot. Mulai catat pemakaian dari lemari atau form di atas.',
      newStoryButton: 'Tulis Cerita Baru',
      draftAutoSaved: 'Draft tersimpan otomatis di perangkatmu',
      storyTitlePlaceholder: 'Contoh: Hujan Sore di Kemang & Aroma Hutan Basah',
      storyBodyPlaceholder: 'Ceritakan momen yang terikat dengan aroma ini, tempat kamu memakainya, atau orang yang mengingat aromamu...',
      publishStoryAction: 'Publikasikan Cerita',
      saveDraftAction: 'Simpan Sebagai Draft',
      writeReviewButton: 'Tulis Ulasan Parfum',
      filterByPerfume: 'Filter berdasarkan parfum'
    },
    library: {
      title: 'Koleksi & Arsip Parfum',
      kicker: 'Digital Shelf',
      valueLabel: 'Estimasi nilai koleksi',
      tabCurrentlyWearing: 'Currently Wearing',
      tabWishlist: 'Wishlist',
      tabFavorite: 'Favorite',
      tabMemories: 'Scent Archive',
      emptyCurrentlyWearing: 'Rakmu masih kosong. Tambahkan parfum yang sedang kamu pakai sekarang.',
      emptyWishlist: 'Belum ada parfum di Wishlist. Tandai parfum yang ingin kamu miliki.',
      emptyFavorite: 'Belum ada parfum favorit yang ditandai.',
      emptyMemories: 'Botol yang sudah habis tersimpan di sini sebagai kenangan beraroma.',
      addBottle: 'Tambah Botol Baru',
      searchCatalog: 'Cari di database katalog...',
      addCustomManual: 'Tambah parfum manual (privat)',
      logWear: 'Catat Semprot',
      viewSpecs: 'Detail Specs'
    },
    product: {
      brandClaimsTitle: 'Klaim Brand',
      wearersVsClaims: 'Ulasan Pemakai Nyata vs Klaim Brand',
      notesPyramid: 'Piramida Aroma (Notes)',
      topNotes: 'Top Notes',
      heartNotes: 'Heart Notes',
      baseNotes: 'Base Notes',
      longevity: 'Daya Tahan',
      sillage: 'Sillage / Proyeksi',
      climate: 'Kesesuaian Cuaca',
      referencePrice: 'Harga Referensi',
      buyOfficialShopee: 'Beli di Shopee Mall',
      buyOfficialTokopedia: 'Beli di Tokopedia',
      affiliateDisclosure: 'Kami dapat memperoleh komisi jika kamu membeli melalui tautan di atas. Komisi tidak pernah memengaruhi Match Score atau peringkat rekomendasi kami.',
      wantToTry: 'Ingin Coba (Waitlist)'
    },
    finder: {
      stepOf: 'Pertanyaan {current} dari {total}',
      climateQuestion: 'Di lingkungan atau cuaca seperti apa parfum ini akan paling sering kamu kenakan?',
      climateExplanation: 'Iklim tropis dan kelembapan Indonesia sangat memengaruhi kecepatan penguapan aroma.',
      back: 'Kembali',
      skip: 'Lewati',
      continue: 'Lanjutkan',
      notSure: 'Tidak yakin / Fleksibel',
      matchScore: 'Match Score',
      whyItFits: 'Kenapa cocok',
      possibleMismatch: 'Kemungkinan kurang cocok'
    },
    compare: {
      title: 'Bandingkan Karakter & Ketahanan',
      subtitle: 'Analisis sisi-ke-sisi maksimal 3 parfum',
      slotsFilled: '{count} dari 3 slot terisi',
      attribute: 'Parameter',
      originTier: 'Asal & Tier',
      concentration: 'Konsentrasi',
      family: 'Keluarga Aroma',
      matchScore: 'Match Score',
      skinLongevity: 'Daya Tahan di Kulit',
      estimatedPrice: 'Harga Estimasi',
      buyAction: 'Aksi Belanja'
    },
    toast: {
      loggedWear: 'Pemakaian {name} berhasil dicatat (+1 semprot, sisa {ml} ml)',
      undo: 'Urungkan (Undo)',
      saved: 'Tersimpan dengan aman'
    },
    footer: {
      about: 'Tentang Senstoria',
      privacy: 'Kebijakan Privasi',
      terms: 'Syarat Penggunaan',
      affiliateDisclosure: 'Keterbukaan Afiliasi',
      contact: 'Hubungi Kami',
      integrityStatement: 'Senstoria adalah platform katalog aroma independen. Penilaian Match Score dihitung secara objektif berdasarkan preferensi dan profil aroma. Kami tidak pernah menerima bayaran untuk mengubah skor atau peringkat parfum.'
    }
  },
  en: {
    appName: 'SENSTORIA',
    tagline: 'Personal Fragrance Library & Scent Discovery',
    sampleDataBadge: 'Sample data',
    sampleDataNotice: 'Sample data for initial preview, awaiting verified curator review',
    nav: {
      home: 'Home',
      library: 'Library',
      catalog: 'Catalog',
      diary: 'Scent Diary',
      scentFinder: 'Scent Finder',
      compare: 'Compare',
      tryItFirst: 'Try It First',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      register: 'Register',
      admin: 'Admin'
    },
    home: {
      heroKicker: 'Personal Scent Library',
      heroTitle: 'Find perfumes that truly fit your taste and climate.',
      heroSubtitle: 'Catalogue what you own, discover your scent DNA, and receive honest recommendations without marketing exaggeration or blind-buy regret.',
      startFinder: 'Start Scent Finder',
      openLibrary: 'Open My Library',
      glanceTitle: 'Collection Glance',
      glanceTruth: 'Single Source of Truth',
      currentlyWearingLabel: 'Currently Wearing',
      wishlistLabel: 'Wishlist',
      wearsLabel: 'Logged Wears',
      scentDnaTitle: 'Primary Scent DNA',
      scentDnaCalculated: 'Calculated deterministically from your collection bottles',
      logTodayTitle: "Log Today's Wear",
      logTodaySubtitle: '1-tap wear logging. Bottle volume automatically decrements by 0.5 ml with 8-second undo.',
      bottlesInRotation: 'bottles in rotation',
      logWearAction: 'Log Wear (+1)',
      repurchaseAction: 'Repurchase on Shopee',
      lowBottleAlert: 'Low Bottle',
      remainingText: 'remaining',
      lowBottleBannerSingle: '{name} is running low ({pct}% left)',
      lowBottleBannerGrouped: '{count} bottles are running low',
      buyAgain: 'Buy again',
      markAsFinished: 'Mark as finished'
    },
    emptyStates: {
      libraryWearingTitle: 'No bottles in rotation',
      libraryWearingBody: "Your shelf is empty. Add a perfume you're wearing now.",
      libraryWearingCta: 'Find a Perfume',
      libraryWishlistTitle: 'Your wishlist is empty',
      libraryWishlistBody: "Your wishlist is empty. Explore perfumes you'd like to try.",
      libraryWishlistCta: 'Browse Catalog',
      libraryFavoritesTitle: 'No favorites yet',
      libraryFavoritesBody: 'No favorite perfumes yet. Mark bottles you love with a heart.',
      libraryFavoritesCta: 'Explore Collection',
      libraryMemoriesTitle: 'No finished bottles',
      libraryMemoriesBody: 'No finished bottles recorded yet. Completed perfumes will rest here.',
      libraryMemoriesCta: 'View Catalog',
      diaryTitle: 'Your Scent Diary is empty',
      diaryBody: 'Track daily wears or write deeper olfactory memories. Both shape your scent journey.',
      diaryCtaLog: 'Log a wear',
      diaryCtaStory: 'Write a Scent Story',
      compareTitle: 'Compare perfumes',
      compareBody: 'Pick up to 3 perfumes to compare.',
      compareCta: 'Find a Perfume'
    },
    diary: {
      title: 'Scent Diary & Memory Vault',
      kicker: 'Scent Diary & Stories',
      subtitle: 'Log your daily wear habits, capture evocative scent memories, and share honest multi-criteria fragrance reviews.',
      tabWearLogs: 'Wear Logs',
      tabScentStories: 'Scent Stories & Memories',
      tabReviews: 'Community Reviews',
      statsWears: 'Total Logged Wears',
      statsCompliments: 'Compliments Received',
      statsStreak: 'Day Streak',
      statsStories: 'Memories Penned',
      quickLogTitle: "Log Today's Wear",
      selectBottle: 'Select Bottle Worn',
      spraysLabel: 'Sprays Intensity',
      moodLabel: 'Mood Tag',
      occasionLabel: 'Occasion / Setting',
      weatherLabel: 'Weather / Climate',
      complimentCheckbox: 'Received a compliment today (+1)',
      quickLogAction: 'Save to Scent Diary (-0.5ml)',
      emptyWears: 'No wear logs recorded yet. Tap "Log Wear" on any bottle or use the quick logger above.',
      newStoryButton: 'Pen New Scent Story',
      draftAutoSaved: 'Draft autosaved to your device',
      storyTitlePlaceholder: 'e.g. Rainy Afternoon in Kemang & Damp Cedar',
      storyBodyPlaceholder: 'Narrate the emotion, place, or memory intertwined with this scent...',
      publishStoryAction: 'Publish Scent Story',
      saveDraftAction: 'Save as Draft',
      writeReviewButton: 'Write Fragrance Review',
      filterByPerfume: 'Filter by perfume'
    },
    library: {
      title: 'Fragrance Collection & Archive',
      kicker: 'Digital Shelf',
      valueLabel: 'Estimated collection value',
      tabCurrentlyWearing: 'Currently Wearing',
      tabWishlist: 'Wishlist',
      tabFavorite: 'Favorite',
      tabMemories: 'Scent Archive',
      emptyCurrentlyWearing: 'Your shelf is empty. Add a perfume you are wearing right now.',
      emptyWishlist: 'Nothing on your Wishlist yet. Tap the heart to bookmark perfumes.',
      emptyFavorite: 'No favorites marked yet.',
      emptyMemories: 'Finished bottles rest here as lasting scent memories.',
      addBottle: 'Add New Bottle',
      searchCatalog: 'Search catalog database...',
      addCustomManual: 'Add custom perfume (private)',
      logWear: 'Log Wear',
      viewSpecs: 'View Specs'
    },
    product: {
      brandClaimsTitle: 'Brand Claims',
      wearersVsClaims: 'What Real Wearers Say vs Brand Claims',
      notesPyramid: 'Notes Pyramid',
      topNotes: 'Top Notes',
      heartNotes: 'Heart Notes',
      baseNotes: 'Base Notes',
      longevity: 'Longevity',
      sillage: 'Sillage / Projection',
      climate: 'Climate Fit',
      referencePrice: 'Reference Price',
      buyOfficialShopee: 'Buy on Shopee Mall',
      buyOfficialTokopedia: 'Buy on Tokopedia',
      affiliateDisclosure: 'We may earn a commission if you purchase through these links. It never changes your Match Score or recommendation ranking.',
      wantToTry: 'Want to Try (Waitlist)'
    },
    finder: {
      stepOf: 'Question {current} of {total}',
      climateQuestion: 'In what climate or environment will you wear this perfume most often?',
      climateExplanation: 'Tropical climate and humidity directly govern fragrance evaporation and longevity.',
      back: 'Back',
      skip: 'Skip',
      continue: 'Continue',
      notSure: 'Not sure / Flexible',
      matchScore: 'Match Score',
      whyItFits: 'Why it fits',
      possibleMismatch: 'Possible mismatch'
    },
    compare: {
      title: 'Compare Fragrance Profiles',
      subtitle: 'Side-by-side comparison for up to 3 perfumes',
      slotsFilled: '{count} of 3 slots filled',
      attribute: 'Attribute',
      originTier: 'Origin & Tier',
      concentration: 'Concentration',
      family: 'Olfactive Family',
      matchScore: 'Match Score',
      skinLongevity: 'Skin Longevity',
      estimatedPrice: 'Estimated Price',
      buyAction: 'Purchase Options'
    },
    toast: {
      loggedWear: 'Logged wear for {name} (+1 spray, {ml} ml remaining)',
      undo: 'Undo',
      saved: 'Saved securely'
    },
    footer: {
      about: 'About Senstoria',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      affiliateDisclosure: 'Affiliate Disclosure',
      contact: 'Contact Us',
      integrityStatement: 'Senstoria is an independent fragrance platform. Match Scores are calculated deterministically from your taste profile. We never accept commission to boost ratings.'
    }
  }
};

export function formatCurrency(amount: number, locale: Locale): string {
  if (locale === 'id') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  return `Rp ${amount.toLocaleString('en-US')}`;
}

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
