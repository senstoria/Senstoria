/**
 * Central Indonesian Language Dictionary (id.ts)
 * Source of truth for all user-facing copy, terminology, and legal templates.
 * Addressing user as "kamu", natural Indonesian, warm and sensory.
 */

export const idTranslations = {
  appName: 'Senstoria',
  tagline: 'Temukan aroma yang menceritakan kisahmu.',
  subline: 'Susun pustaka parfummu. Kenali aroma yang benar-benar cocok untukmu.',
  heroKicker: 'Pustaka & Kurasi Parfum Digital',
  heroCtaRegister: 'Buat akun',
  heroCtaSignIn: 'Masuk',
  heroCtaFinder: 'Mulai Pencari Aroma',
  heroCtaExplore: 'Jelajahi Katalog',
  
  sampleDataBadge: 'Data contoh',
  sampleDataNotice: 'Nilai perkiraan awal, akan diperbarui otomatis saat ulasan komunitas bertambah.',
  priceNote: 'Perkiraan harga, mohon cek ulang di toko. Terakhir diperbarui 21 Oktober 2026.',
  affiliateDisclosure: 'Senstoria dapat menerima komisi dari pembelian melalui tautan ini, tanpa biaya tambahan untukmu.',
  authenticityNotice: 'Beli dari toko berlabel Official Store dan cocokkan detail kemasannya.',

  // Navigasi yang disesuaikan dengan permintaan:
  // Beranda, Pustaka, Jurnal, Katalog, Coba Dulu, Temukan, Bandingkan
  nav: {
    home: 'Beranda',
    library: 'Pustaka',
    diary: 'Jurnal',
    catalog: 'Katalog',
    tryItFirst: 'Coba Dulu',
    scentFinder: 'Temukan',
    compare: 'Bandingkan',
    search: 'Cari',
    account: 'Akun',
    signIn: 'Masuk',
    signOut: 'Keluar',
    register: 'Daftar',
    admin: 'Admin'
  },

  howItWorks: {
    title: 'Cara Kerja Senstoria',
    subtitle: 'Tiga langkah mudah mengenali dan menikmati semesta aromamu.',
    step1Title: 'Kumpulkan',
    step1Desc: 'Dokumentasikan botol yang sedang kamu pakai, wishlist incaran, hingga kenangan botol yang telah habis.',
    step2Title: 'Pahami',
    step2Desc: 'Petakan Scent DNA personalmu. Ketahui keluarga aroma favorit, notes dominan, dan ketahanan di kulitmu.',
    step3Title: 'Temukan',
    step3Desc: 'Dapatkan rekomendasi jujur berbasis kesesuaian aroma nyata—bukan sekadar tren atau sponsor iklan.'
  },

  twoProblems: {
    title: 'Mengapa Memilih Parfum Sering Kali Membingungkan?',
    problem1Title: 'Takut Zonk & Menyesal Blind-Buy',
    problem1Desc: 'Deskripsi parfum sering kali terasa terlalu abstrak. Membeli botol penuh tanpa mencoba decant berisiko berakhir tak terpakai di meja rias.',
    problem2Title: 'Rekomendasi Berbayar yang Tidak Obyektif',
    problem2Desc: 'Banyak daftar teratas diatur oleh komisi atau promosi berbayar. Senstoria hadir dengan penilaian transparan tanpa pay-to-rank.'
  },

  library: {
    title: 'Pustaka Parfummu',
    kicker: 'Koleksi Pribadi',
    subtitle: 'Ruang tenang untuk merawat setiap tetes botol dan kenangan aroma.',
    valueLabel: 'Total Nilai Koleksi',
    addBottleAction: 'Tambah Koleksi',
    tabCurrentlyWearing: 'Sedang Dipakai',
    tabWishlist: 'Wishlist',
    tabFavorites: 'Favorit',
    tabMemories: 'Arsip',
    tabMemoriesSubtitle: 'Bab yang telah lalu',
    viewShelf: 'Rak',
    viewGrid: 'Grid',
    viewList: 'Daftar',
    remainingText: 'tersisa',
    wearsText: 'kali dipakai',
    quickLog: 'Catat Pakai',
    undoLog: 'Batal',
    markFinished: 'Tandai Habis',
    lowBottleWarning: 'Hampir habis'
  },

  diary: {
    title: 'Jurnal Aroma',
    kicker: 'Catatan Pemakaian & Cerita',
    subtitle: 'Rekam jejak setiap semprotan, suasana hati, dan cerita yang menyertainya.',
    tabWearLogs: 'Catatan Pakai',
    tabScentStories: 'Kisah Aroma (Scent Stories)',
    tabReviews: 'Ulasan Komunitas',
    statsWears: 'Total Semprotan',
    statsCompliments: 'Pujian Diterima',
    statsStreak: 'Hari Beruntun',
    statsStories: 'Cerita Tertulis',
    quickLogTitle: 'Catat Aroma Hari Ini',
    selectBottle: 'Pilih botol dari koleksimu',
    spraysLabel: 'Jumlah Semprotan',
    moodLabel: 'Suasana Hati',
    occasionLabel: 'Acara / Momen',
    weatherLabel: 'Cuaca Hari Ini',
    complimentCheckbox: 'Mendapat pujian dari orang lain hari ini',
    quickLogAction: 'Simpan Catatan',
    emptyWears: 'Belum ada catatan pemakaian. Semprotkan parfum favoritmu dan catat sekarang.',
    newStoryButton: 'Tulis Kisah Aroma',
    draftAutoSaved: 'Draf tersimpan otomatis',
    storyTitlePlaceholder: 'Beri judul ceritamu...',
    storyBodyPlaceholder: 'Bagikan bagaimana aroma ini menemani harimu, kenangan apa yang terbit, atau suasana yang tercipta...',
    publishStoryAction: 'Terbitkan Kisah',
    saveDraftAction: 'Simpan Draf',
    writeReviewButton: 'Tulis Ulasan Mendalam',
    filterByPerfume: 'Saring berdasarkan parfum'
  },

  scentFinder: {
    kicker: 'Pencari Aroma Personal',
    title: 'Temukan Aroma yang Tepat untuk Setiap Momenmu',
    subtitle: '7 pertanyaan sederhana untuk memetakan kepribadian aromamu secara objektif.',
    stepProgress: 'Langkah {current} dari {total}',
    notSureOption: 'Belum yakin / fleksibel',
    nextButton: 'Lanjutkan',
    backButton: 'Kembali',
    finishButton: 'Lihat Hasil Analisis',
    resultsTitle: 'Rekomendasi Parfum Khusus Untukmu',
    resultsSubtitle: 'Dihitung berdasarkan kesesuaian piramida notes, iklim tropis, dan preferensimu.',
    matchScoreLabel: 'Tingkat Kesesuaian',
    whyItFits: 'Kenapa cocok untukmu:',
    possibleMismatch: 'Catatan pertimbangan (Possible Mismatch):',
    retakeQuiz: 'Ulangi Kuis'
  },

  tryItFirst: {
    kicker: 'Senstoria Decant Hub',
    title: 'Coba Dulu Sebelum Membeli Botol Penuh',
    subtitle: 'Dapatkan sampel decant original resmi (2ml, 5ml, 10ml) langsung dari botol asli bergaransi.',
    availableDecants: 'Decant Tersedia',
    comingSoonDecants: 'Segera Hadir / Antrean Permintaan',
    sizeVial: '2ml Vial (±30 semprotan)',
    sizeDecant: '5ml Decant (±75 semprotan)',
    sizeTravel: '10ml Travel Spray (±150 semprotan)',
    joinWaitlist: 'Masuk Antrean Sampel',
    orderSample: 'Pesan Sampel Sekarang',
    fairPriceLabel: 'Estimasi Harga Decant Wajar:',
    packagingNote: 'Termasuk botol kaca steril & perlindungan bubble wrap ekstra tebal.',
    emptyNotice: 'Koleksi decant resmi Senstoria sedang dalam tahap kurasi batch perdana.'
  },

  catalog: {
    kicker: 'Eksplorasi Lengkap',
    title: 'Katalog Aroma Pilihan',
    subtitle: 'Jelajahi karya peracik parfum lokal nusantara dan rumah parfum legendaris dunia.',
    searchPlaceholder: 'Cari nama parfum, merek, atau notes (mis. cendana, melati, vanila)...',
    filterAll: 'Semua',
    filterLocal: 'Merek Lokal (Indonesia)',
    filterInternational: 'Internasional',
    filterFamily: 'Keluarga Aroma',
    filterPrice: 'Kisaran Harga',
    collectionNusantara: 'Aroma Nusantara',
    collectionNusantaraSubtitle: 'Parfum kaya aroma rempah, melati, nilam, dan cendana khas bumi pertiwi.',
    sortBy: 'Urutkan:',
    sortRecommended: 'Rekomendasi',
    sortPriceLow: 'Harga: Terendah ke Tertinggi',
    sortPriceHigh: 'Harga: Tertinggi ke Terendah',
    sortYear: 'Tahun Rilis',
    compareSelected: 'Bandingkan ({count})',
    addToCompare: 'Bandingkan',
    removeFromCompare: 'Batal bandingkan',
    viewDetail: 'Lihat Detail'
  },

  compare: {
    title: 'Perbandingan Berdampingan',
    subtitle: 'Bandingkan hingga 3 parfum untuk menentukan mana yang paling sesuai kebutuhanmu.',
    addSlot: 'Pilih parfum untuk dibandingkan',
    clearAll: 'Bersihkan Perbandingan',
    metricFamily: 'Keluarga Aroma',
    metricConcentration: 'Konsentrasi',
    metricLongevity: 'Daya Tahan',
    metricSillage: 'Jejak Aroma (Sillage)',
    metricTopNotes: 'Nada Atas (Top Notes)',
    metricHeartNotes: 'Nada Tengah (Heart Notes)',
    metricBaseNotes: 'Nada Dasar (Base Notes)',
    metricPrice: 'Perkiraan Harga',
    metricBestFor: 'Paling Cocok Untuk'
  },

  productDetail: {
    brandLabel: 'Merek',
    concentrationLabel: 'Konsentrasi',
    perfumerLabel: 'Perfumer (Peracik)',
    releaseYearLabel: 'Tahun Rilis',
    originLabel: 'Asal Negara',
    pyramidTitle: 'Piramida Aroma',
    topNotes: 'Nada Atas (Top)',
    heartNotes: 'Nada Tengah (Heart)',
    baseNotes: 'Nada Dasar (Base)',
    performanceTitle: 'Performa di Kulit',
    longevityLabel: 'Daya Tahan',
    sillageLabel: 'Jejak Aroma (Sillage)',
    buyShopee: 'Beli di Shopee',
    buyTokopedia: 'Beli di Tokopedia',
    orderDecant: 'Coba Decant Dulu',
    addToLibrary: 'Tambah ke Koleksi',
    addToWishlist: 'Simpan ke Wishlist'
  },

  performance: {
    longevity: {
      under2h: '<2 jam',
      h2to4: '2–4 jam',
      h4to6: '4–6 jam',
      h6to8: '6–8 jam',
      over8h: '8 jam+'
    },
    sillage: {
      intimate: 'Intim',
      close: 'Dekat',
      moderate: 'Sedang',
      strong: 'Kuat',
      enormous: 'Sangat kuat'
    }
  },

  auth: {
    signInTitle: 'Masuk ke Senstoria',
    signUpTitle: 'Mulai Pustaka Aromamu',
    tagline: 'Setiap aroma punya cerita.',
    emailLabel: 'Alamat Email',
    passwordLabel: 'Kata Sandi',
    confirmPasswordLabel: 'Ulangi Kata Sandi',
    termsConsent: 'Saya menyetujui Ketentuan Layanan serta Kebijakan Privasi Senstoria.',
    submitSignIn: 'Masuk',
    submitSignUp: 'Daftar Akun Baru',
    switchToSignUp: 'Belum punya akun? Daftar gratis',
    switchToSignIn: 'Sudah punya akun? Masuk di sini',
    forgotPassword: 'Lupa kata sandi?'
  },

  // Pemetaan pesan kesalahan Firebase Auth yang ramah dalam Bahasa Indonesia
  authErrors: {
    'auth/invalid-email': 'Format alamat email tidak valid.',
    'auth/user-disabled': 'Akun ini telah dinonaktifkan. Silakan hubungi dukungan.',
    'auth/user-not-found': 'Akun dengan email ini tidak ditemukan.',
    'auth/wrong-password': 'Kata sandi salah. Silakan periksa kembali.',
    'auth/email-already-in-use': 'Alamat email ini sudah terdaftar. Silakan masuk.',
    'auth/weak-password': 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.',
    'auth/too-many-requests': 'Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Silakan periksa jaringanmu.',
    'auth/operation-not-allowed': 'Metode masuk ini sedang tidak aktif.',
    'default': 'Terjadi kendala saat memproses akun. Silakan coba kembali.'
  },

  legal: {
    privacyTitle: 'Kebijakan Pelindungan Data Pribadi (UU PDP No. 27/2022)',
    termsTitle: 'Syarat & Ketentuan Layanan Senstoria',
    affiliateTitle: 'Keterbukaan Tautan Afiliasi (Affiliate Disclosure)',
    draftNotice: 'Draf Dokumen — Perlu Ditinjau Konsultan Hukum Resmi',
    pdpExportAction: 'Unduh Portabilitas Data Pribadiku (JSON)',
    pdpDeleteAction: 'Permohonan Penghapusan Akun & Data Permanen',
    copyright: '© 2026 Senstoria. Seluruh hak cipta dilindungi undang-undang.'
  }
};

/**
 * Format currency to Indonesian Rupiah standard format (Rp 1.250.000)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount).replace('IDR', 'Rp');
}

/**
 * Format date to standard Indonesian format (e.g., 21 Oktober 2026)
 */
export function formatIndonesianDate(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

/**
 * Friendly Firebase error code mapper to Indonesian
 */
export function mapFirebaseAuthError(code: string): string {
  return idTranslations.authErrors[code as keyof typeof idTranslations.authErrors] || idTranslations.authErrors.default;
}
