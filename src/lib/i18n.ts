export type Locale = 'id' | 'en';

export interface FinderQuizOption { id: string; label: string; desc: string; }
export interface FinderQuizStep { kicker: string; options: FinderQuizOption[]; }

export interface LabeledOption { value: string; label: string; }
export interface DescribedOption { value: string; label: string; desc: string; }

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

  common: {
    loading: string;
    tryItFirstWaitlistButton: string;
    closeDialog: string;
    priceCheckedOn: string;
    coldStartBanner: string;
    matchPercent: string;
  };
  app: {
    gagalMemuatDatamuDariServerPeriksaKo: string;
    gagalMenyimpanPerubahanCobaLagi: string;
    cobaLagi: string;
    hapusBotolJudul: string;
    hapusBotolIsi: string;
    hapusBotolYa: string;
    hapusBotolBatal: string;
    skipToContent: string;
    n0Tersisa: string;
    dibatalkan0Tersisa: string;
    tambahRincian: string;
    botolDitandaiSelesaiDanDipindahkanKe: string;
    catatanSemprotDihapus: string;
    ceritaAromaBerhasilDipublikasikanKeLi: string;
    draftCeritaTersimpan: string;
    ceritaBerhasilDihapus: string;
    ulasanDiterimaMenungguModerasi: string;
    parfumDihapusDariKomparasi: string;
    maksimal3ParfumDapatDibandingkanSecar: string;
    dihapusDariWishlist: string;
    ditambahkanKeWishlist: string;
    permintaanSampelDecantBerhasilDidaftar: string;
    pesananSampel0BerhasilDibuatSimulasi: string;
    parfum0BerhasilDitambahkanKeKatalog: string;
    parfum0BerhasilDiperbarui: string;
    parfumBerhasilDihapusDariKatalog: string;
    ulasanDisetujuiDanKiniTampilPublik: string;
    ulasanDitangguhkan: string;
    ulasanDihapus: string;
    botolBaruBerhasilDisimpanKeLemarimu: string;
    botolBerhasilDiperbarui: string;
    botolDihapusDariLemari: string;
    masukkanEmailKamu: string;
    berhasilMasukAkun: string;
    akunDibuatPeriksaEmailUntukLinkVerif: string;
    masukkanEmailKamuDuluLaluTekanLupaK: string;
    linkAturUlangKataSandiTelahDikirimK: string;
    textFffef2Underline: string;
    english: string;
    id: string;
    idEn: string;
    modeDemoKamuSedangMelihatDataContoh: string;
    keluarDariDemo: string;
    kamuBelumMasukKoleksimuMasihKosongBu: string;
    lihatContohDenganDataDemo: string;
    daftarAkun: string;
    backendBelumTerhubungMasukDanDaftarA: string;
    mulaiScentFinder: string;
    jelajahi0KatalogParfum: string;
    bukaPustakaSaya: string;
    idId: string;
    memoriAromaPadaHariIni: string;
    bacaDiBukuHarian: string;
    rotasiHarian: string;
    mulaiPerjalananOlfaktif: string;
    n3LangkahMemulaiSenstoria: string;
    bangunLemariAromaPersonalDanTemukanW: string;
    n1TemukanSignatureScentLewatScentFind: string;
    ketahuiProfilPiramidaAromaDanPreferen: string;
    mulaiScentFinder2: string;
    n2TambahkanBotolPertamaKeLemari: string;
    koleksiDariKatalogKurasiAtauBotolCus: string;
    bukaPustaka: string;
    n3CatatSemprotanPertamamuDiBukuHarian: string;
    simpanSuasanaHatiCuacaDanKenanganAro: string;
    bukaBukuHarian: string;
    rincianSemprotSuasanaCuaca: string;
    halamanIniHanyaUntukAdmin: string;
    kamuTidakMemilikiAksesAdminKembaliKe: string;
    kembaliKeBeranda: string;
    ruangKomparasiDikosongkan: string;
    rincian: string;
    lupaKataSandi: string;
    seluruhDataPribadiAndaTelahDimusnahka: string;
      addedToCompare: string;
    addedToLibrary: string;
    unnamedPerfume: string;
    dataRightsTitle: string;
    homeAria: string;
    languageSwitchTitle: string;
    signOutTitle: string;
    signOutAria: string;
    logWearAria: string;
    mainNavAria: string;
    unknownPerfume: string;
    defaultMemberName: string;
    storyFallbackTitle: string;
    switchLanguageAria: string;
    adminPanel: string;
    dataRightsButton: string;
    documentTitle: string;
};
  authErrors: {
    backend_not_configured: string;
    email_in_use: string;
    weak_password: string;
    invalid_email: string;
    invalid_credential: string;
    user_not_found: string;
    too_many_requests: string;
    unverified: string;
    terms_required: string;
    generic: string;
    popup_closed: string;
    popup_blocked: string;
    provider_not_enabled: string;
    account_exists_different: string;
  };
  admin: {
    exitShop: string;
    tabAnalytics: string;
    tabCatalog: string;
    tabReviews: string;
    tabWaitlist: string;
    tabFlags: string;
    funnelTitle: string;
    funnelSubtitle: string;
    conversionRate: string;
    funnelQ1: string;
    funnelQ3: string;
    funnelQ5: string;
    funnelQ7: string;
    funnelResult: string;
    funnelStepCount: string;
    chart1Kicker: string;
    chart1Title: string;
    chart1Subtitle: string;
    tooltipSprays: string;
    seriesSprays: string;
    seriesUsers: string;
    chart2Kicker: string;
    chart2Title: string;
    chart2Subtitle: string;
    seriesBottles: string;
    seriesWaitlist: string;
    clicksTitle: string;
    clicksSubtitle: string;
    refresh: string;
    clicksEmpty: string;
    dataBelumCukup: string;
    clicksFromServer: string;
    thPerfume: string;
    thTime: string;
    catalogTitle: string;
    catalogSubtitle: string;
    catalogSearch: string;
    editPerfumeTitle: string;
    deletePerfumeTitle: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    filterPending: string;
    filterAll: string;
    reviewApproved: string;
    reviewPendingBadge: string;
    reviewsEmpty: string;
    reviewBy: string;
    reviewLongevity: string;
    approve: string;
    suspend: string;
    deletePermanentTitle: string;
    waitlistTitle: string;
    waitlistSubtitle: string;
    registeredCount: string;
    exportCsv: string;
    waitlistEmpty: string;
    waitlistConfirmed: string;
    waitlistPending: string;
    waitlistLoading: string;
    waitlistLoadError: string;
    thSize: string;
    thContact: string;
    thStatus: string;
    flagsTitle: string;
    flagsSubtitle: string;
    flagsReadOnlyNote: string;
    formEditTitle: string;
    formAddTitle: string;
    formName: string;
    formNameExample: string;
    formBrand: string;
    formBrandExample: string;
    formFamily: string;
    formConcentration: string;
    formOrigin: string;
    formOriginLocal: string;
    formOriginIntl: string;
    formPrice: string;
    formSize: string;
    formNotes: string;
    formSave: string;
    formAdd: string;
    headerTitle: string;
    statWaitlistDemand: string;
    thClickId: string;
    thSource: string;
    thPerfumeBrand: string;
    thOfficialPrice: string;
    thHeatFit: string;
    crudKicker: string;
    formNotesTopExample: string;
    formNotesHeartExample: string;
    formNotesBaseExample: string;
    headerSubtitle: string;
    statClicks: string;
    statReviews: string;
    statPendingReviews: string;
  };
  tryItFirstModal: {
    title: string;
    subtitle: string;
    sizeHeading: string;
    sizeLabel2: string;
    sizeDesc2: string;
    sizeLabel5: string;
    sizeDesc5: string;
    sizeLabel10: string;
    sizeDesc10: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    notifHeading: string;
    notifWhatsapp: string;
    notifEmail: string;
    notifBoth: string;
    submitWaitlist: string;
    submitting: string;
    successTitle: string;
    successBodyEmail: string;
    successBodyNoEmail: string;
    alreadyTitle: string;
    alreadyBody: string;
    errorBody: string;
    errorBackend: string;
    priceNote: string;
    closeWindow: string;
  };
  legalModal: {
    closeAria: string;
    kicker: string;
    title: string;
    subtitle: string;
    tabDataRights: string;
    tabContact: string;
    contactDpoTitle: string;
    contactDpoName: string;
    contactDpoResponse: string;
    contactOfficeTitle: string;
    contactOfficeName: string;
    contactOfficeAddress: string;
    exporting: string;
    downloadData: string;
    exportSuccess: string;
    erasureTitle: string;
    erasureBody: string;
    deletionSuccess: string;
    deleteConfirmBefore: string;
    deleteConfirmAfter: string;
    destroyButton: string;
    portabilityTitle: string;
    portabilityBody: string;
    exportIncludesServer: string;
    exportError: string;
    deletionNeedsRelogin: string;
    deletionError: string;
  };
  legalPage: {
    backHome: string;
    tabPrivacy: string;
    tabTerms: string;
    tabAffiliate: string;
    tabFaq: string;
    privacyTitle: string;
    privacyIntro: string;
    privacyS1H: string;
    privacyS1B: string;
    privacyS2H: string;
    privacyS2B: string;
    privacyS3H: string;
    privacyS3B: string;
    privacyS4H: string;
    privacyS4B: string;
    privacyS5H: string;
    privacyS5B: string;
    termsTitle: string;
    termsIntro: string;
    termsS1H: string;
    termsS1B: string;
    termsS2H: string;
    termsS2B: string;
    termsS3H: string;
    termsS3B: string;
    termsS4H: string;
    termsS4B: string;
    affiliateTitle: string;
    affiliateIntro: string;
    affiliateS1H: string;
    affiliateS1B: string;
    affiliateS2H: string;
    affiliateS2B: string;
    affiliateS3H: string;
    affiliateS3B: string;
    faqTitle: string;
    faqIntro: string;
    faqQ1: string;
    faqA1: string;
    faqQ2: string;
    faqA2: string;
    faqQ3: string;
    faqA3: string;
    faqQ4: string;
    faqA4: string;
    faqQ5: string;
    faqA5: string;
    faqQ6: string;
    faqA6: string;
    faqQ7: string;
    faqA7: string;
  };
  authModal: {
    titleSignin: string;
    titleSignup: string;
    subtitleSignin: string;
    subtitleSignup: string;
    tabSignin: string;
    tabSignup: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    consentPrefix: string;
    consentMiddle: string;
    consentSuffix: string;
    termsLink: string;
    privacyLink: string;
    submitSignin: string;
    submitSignup: string;
    authBack: string;
    authSwitchToSignup: string;
    authSwitchToSignin: string;
    providerGoogle: string;
    providerApple: string;
    providerDivider: string;
  };
  buySheet: {
    opsiPembelianRepurchaseResmi: string;
    hargaReferensi: string;
    pilihMitraMarketplaceResmi: string;
    beliResmiDiShopeeMall: string;
    beliResmiDiTokopediaOfficial: string;
    cobaSampelDuluDecant: string;
    kamiBisaMenerimaKomisiJikaKamuMembel: string;
    originTierLocal: string;
    originTierGlobal: string;
  };
  catalogView: {
    katalogTerkurasi: string;
    eksplorasiKoleksiParfum: string;
    menampilkan0DariTotal1Parfum: string;
    cariNamaParfumBrandAtauNotesCthBerg: string;
    semuaAroma: string;
    filterAktif: string;
    hapusSemua: string;
    filterKatalog: string;
    sesuaikanKriteriaPencarianParfum: string;
    hapus: string;
    tampilkan0Parfum: string;
    hargaReferensi: string;
    sortLabel: string;
    sortOptions: Array<{ value: string; label: string }>;
    priceRanges: Array<{ id: string; label: string }>;
    originHeading: string;
    familyHeading: string;
    concentrationHeading: string;
    brandHeading: string;
    budgetHeading: string;
    originLocal: string;
    originIntlChip: string;
    originIntlLabel: string;
    allBrands: string;
    emptyTitle: string;
    emptyBody: string;
    clearAllFilters: string;
    toggleWishlistTitle: string;
    saveToWishlistAria: string;
    addToCompareTitle: string;
    addToCompareAria: string;
    viewSpecs: string;
    historyLabel: string;
  };
  compareTray: {
    bukaKomparasi: string;
    trayAria: string;
    removeTitle: string;
    removeAria: string;
    slotLabel: string;
  };
  compareView: {
    komparasiSisiKeSisi: string;
    bandingkanKarakterKomposisiKetahanan: string;
    dari3SlotParfumAktif: string;
    notesSamaTerdeteksi: string;
    modeSorotPerbedaanAktif: string;
    sorotPerbedaanSaja: string;
    tambahParfum: string;
    bandingkanParfum: string;
    geserTabelUntukMelihatRincian: string;
    kesesuaianIklimPanas: string;
    sangatCocokCuacaPanas: string;
    cocokRuangAcMalam: string;
    hargaNilaiMl: string;
    pilihParfumUntukDibandingkan: string;
    bandingkanPiramidaAromaSpesifikasiMaks: string;
    cariNamaAtauBrandParfum: string;
    tidakAdaParfumYangCocok: string;
    tutup: string;
    buyOnShopee: string;
    buyOnTokopedia: string;
    originTierHeading: string;
    longevityProjectionHeading: string;
    shoppingActionsHeading: string;
    highlightNotesLabel: string;
    sharedNoteLabel: string;
    removeTitle: string;
    addSlotButton: string;
    highlightNotesExplanation: string;
    perBottleSize: string;
  };
  libraryView: {
    koleksiPribadi: string;
    lemariWewangianScentDna: string;
    botolAktif: string;
    favorit: string;
    valuasiKoleksi: string;
    tambahBotolKeLemari: string;
    sedangDipakai: string;
    inginDicobaWishlist: string;
    favorit2: string;
    kenanganBotolHabis: string;
    dashboardScentDna: string;
    botolAktifYangSaatIniTersediaDiMeja: string;
    bukaBukuHarianCerita: string;
    menipis20: string;
    dipakai: string;
    editVolume: string;
    wewangianYangMenarikMinatmuDanInginK: string;
    hapusDariWishlist: string;
    sudahPunyaPindahKeLemari: string;
    cobaDulu: string;
    lihatDetail: string;
    wewangianYangMenjadiIdentitasKhasDan: string;
    aromaKhasYangSelaluMemberiRasaTenang: string;
    catatanDiary: string;
    arsipBotolYangTelahKosongAtauAromaM: string;
    habis0Ml: string;
    telahDisemprotSebanyak0KaliSelamaMen: string;
    profilScentDnaMembutuhkanMinimal3Par: string;
    tambahkanMinimal3ParfumKeLemarimuUnt: string;
    profilDnaAromaPribadi: string;
    karakterUtama0Devotee: string;
    memuatVisualisasiRadar: string;
    kesesuaianIklimTropisIndonesia: string;
    siangTerikOutdoorTropis: string;
    ruangBerAcSeharianKantor: string;
    malamHariCuacaHujan: string;
    totalVolumeTersisa: string;
    rataRataSisaIsiBotol: string;
    totalNilaiKoleksi: string;
    tambahParfumKeLemarimu: string;
    kurasiKoleksiBotolParfumPersonalmu: string;
    pilihDariKatalog0Kurasi: string;
    pilihUkuranBotolMl: string;
    ukuranPenuhMl: string;
    editVolumeSisaBotol: string;
    perbaruiSisaVolumeCairanBotolParfum: string;
    favoriteToggleTitle: string;
    saveToFavoriteAria: string;
    favoriteBadgeAria: string;
    dnaMatchBadge: string;
    openDetails: string;
    chooseCatalogData: string;
    remainingLiquidLabel: string;
    fullSizeLabel: string;
    percentRemaining: string;
    saveBottleToWardrobe: string;
    dnaRecsHeading: string;
    dnaRecsSubtitle: string;
    searchCatalogLabel: string;
    brandNameLabel: string;
    variantNameLabel: string;
    duplicateNotice: string;
    initialStatusLabel: string;
    markFavoriteLabel: string;
    makeFavoriteLabel: string;
    deleteBottleLabel: string;
    searchPlaceholder: string;
    brandExamplePlaceholder: string;
    variantExamplePlaceholder: string;
  };
  logWear: {
    catatPemakaianAromaLogWear: string;
    kurangkanCairanBotolLacakKebiasaanSem: string;
    pemakaianBerhasilDicatat: string;
    dikurangkanDariBotolmu: string;
    belumAdaBotolAktifDiLemarimuSilakan: string;
    pilihBotolDariLemarimu: string;
    jumlahSemprotan: string;
    konteksAcaraPemakaian: string;
    suasanaHatiMood: string;
    cuacaSaatDipakai: string;
    mendapatPujianDariOrangLainHariIni: string;
    catatanSingkatOpsional: string;
    cthDisemprotDiKemejaPutihTahan6Jam: string;
    simpanCatatanPemakaian: string;
    decreaseSprays: string;
    increaseSprays: string;
  };
  lowBottle: {
    statusSisaBotolParfum: string;
    cobaSampel: string;
    tandaiHabis: string;
  };
  productDetail: {
    kembaliKeKatalog: string;
    kurasiIndependenSenstoria: string;
    piramidaAroma: string;
    strukturKomposisiNotesTigaBaris: string;
    validasiKomunitas: string;
    ulasanPemakaiNyataVsKlaimResmiBrand: string;
    klaimResmiBrand: string;
    sumberMateriPeluncuranResmiBrand: string;
    helpfulCount: string;
    dataPemakaiSenstoria: string;
    ulasanKomunitas: string;
    ketahananNyataKulit: string;
    proyeksiAroma: string;
    bersediaMembeliBotolPenuhKembali: string;
    belumCukupUlasan: string;
    memerlukanMinimal5UlasanTerpublikasiU: string;
    evaluasiKomunitasIndependen: string;
    ulasanMultiKriteriaCeritaAroma: string;
    dataKetahananNyataKulitJejakAromaDan: string;
    tulisCerita: string;
    tulisUlasanParfumIni: string;
    rataRataKomunitas: string;
    ulasan: string;
    ketahananKulit: string;
    konsensusIklimTropis: string;
    jejakAromaSillage: string;
    ramahRuangTertutupAc: string;
    niatBeliUlang: string;
    pastiBeliLagi: string;
    tingkatKepuasanTinggi: string;
    ulasanPengguna0: string;
    belumAdaUlasanTerperinciUntukWewangia: string;
    tulisUlasanPertama: string;
    aromaSerupaDalamKeluarga0: string;
    lihatSemuaDiKatalog: string;
    inWishlist: string;
    addWishlist: string;
    inComparison: string;
    compareAction: string;
    shareScentTitle: string;
    tropicalClimate: string;
    heatScore: string;
    buyShopeeMall: string;
    buyTokopediaOfficial: string;
    repurchaseLabel: string;
    repurchaseYes: string;
    repurchaseMaybe: string;
    formatLabel: string;
    fullBottle: string;
    decantFormat: string;
    addBottleTitle: string;
    addBottleSubtitle: string;
    bottleAddedTitle: string;
    bottleAddedBody: string;
    saveBottle: string;
    shareScentHeading: string;
    promoFreeNote: string;
    durabilityLabel: string;
    projectionLabel: string;
    tropicalGuideHeading: string;
    iklimTanpaData: string;
    climateOutdoor: string;
    climateOutdoorTip: string;
    climateOffice: string;
    climateOfficeTip: string;
    climateNight: string;
    climateNightTip: string;
    buyViaPartners: string;
    addToWardrobe: string;
    reviewSillageLabel: string;
    furtherExploration: string;
    bottleStatusLabel: string;
    linkCopied: string;
    copyLinkSummary: string;
    shareWhatsApp: string;
    prosLabel: string;
    consLabel: string;
    projectionLevel: string;
    pyramidBaseDuration: string;
    pyramidHeartDuration: string;
    pyramidTopDuration: string;
    pyramidTopLabel: string;
    pyramidHeartLabel: string;
    pyramidBaseLabel: string;
    shareButton: string;
  };
  review: {
    tulisUlasanParfumKomunitas: string;
    bantuSesamaPecintaAromaDenganDataPem: string;
    ulasanMultiKriteriaTerverifikasi: string;
    ulasanBerhasilDipublikasikan: string;
    terimaKasihAtasKontribusiObjektifmuUn: string;
    parfumYangDiulas: string;
    skorKeseluruhanRating: string;
    luarBiasaMasterpiece: string;
    sangatBagus: string;
    lumayanStandar: string;
    diBawahEkspektasi: string;
    mengecewakan: string;
    dayaTahanNyataKulitLongevity: string;
    jejakAromaSillageProyeksi: string;
    formatYangKamuPakai: string;
    botolPenuhFullBottle: string;
    decantTravelSize510Ml: string;
    sampleVial12Ml: string;
    niatBeliUlang: string;
    judulUlasan: string;
    ringkasanKesanUtamamuMisalGurihDanHa: string;
    ulasanLengkapWajib: string;
    ceritakanEvolusiAromaDariTopNotesHin: string;
    kelebihanPisahkanDenganKoma: string;
    kekuranganPisahkanDenganKoma: string;
    kebijakanIntegritasUlasanmuAkanTerbit: string;
    batal: string;
    kirimUlasanSekarang: string;
    prosExamplePlaceholder: string;
    consExamplePlaceholder: string;
  };
  diaryView: {
    catatanAroma: string;
    bukuHarianAromaMemori: string;
    bukuHarianSemprotCeritaAroma: string;
    catatSemprotan1TapOtomatisMengurangi: string;
    tulisCerita: string;
    tulisUlasanBaru: string;
    helpfulCount: string;
    botolAktifDiLemari: string;
    pujianDiterima: string;
    pencatatanSpontan: string;
    rotasiTeratas: string;
    ceritaTersimpan: string;
    n1LogPemakaianHarian: string;
    n2CeritaAromaMemori: string;
    n3UlasanMultiKriteria: string;
    cariDiBukuHarianCerita: string;
    semuaParfum: string;
    aksiCepatPemakaian: string;
    catatSemprotanHariIni: string;
    belumAdaBotolAktifDiLemariKoleksimu: string;
    bukaLemariKoleksi: string;
    semprotanBerhasilDicatatKeBukuHarian: string;
    pilihBotolYangDipakai: string;
    jumlahSemprotan: string;
    konteksAcara: string;
    cuacaRuangan: string;
    dapatPujianCompliment1: string;
    catatanSingkatOpsionalMisalAromanyaTe: string;
    simpanKeBukuHarian05Ml: string;
    riwayatSemprotTerkini: string;
    belumAdaCatatanPemakaianYangCocokDen: string;
    jadikanCerita: string;
    bukaEditorDraft: string;
    abadikanMemoriCeritaAromamu: string;
    aromaMemilikiKaitanPalingEratDenganM: string;
    mulaiMenulisCerita: string;
    pembuatCeritaAroma: string;
    tulisCatatanMemoriOlfaktif: string;
    menyimpan: string;
    tersimpan: string;
    parfumYangTerikatCeritaIni: string;
    judulCerita: string;
    contohHujanSoreDiKemangHangatnyaVani: string;
    suasanaHati: string;
    konteksAcara2: string;
    cuacaTempat: string;
    kisahNarasiMemori: string;
    ceritakanSuasanaHariItuSiapaYangAda: string;
    tagMomenPisahkanKoma: string;
    buangDraft: string;
    publikasikanCerita: string;
    linimasaCeritaMemoriAroma: string;
    belumAdaCeritaYangCocokDenganFilter: string;
    evaluasiKomunitasIndependen: string;
    ulasanMultiKriteriaTerverifikasi: string;
    bebasSponsorKomersialDataKetahananNya: string;
    belumAdaUlasanYangSesuaiDenganFilter: string;
    catatSemprotanHariIni2: string;
      defaultStoryTitle: string;
    storyLengthHint: string;
    deleteLogTitle: string;
    noDataYet: string;
    wearLogCount: string;
    storyCount: string;
    reviewCount: string;
    deleteStoryTitle: string;
    repurchaseLabel: string;
    repurchaseYes: string;
    repurchaseMaybe: string;
    usageFormatLabel: string;
    fullBottle: string;
    decantSample: string;
    prosLabel: string;
    consLabel: string;
    skinLongevityLabel: string;
    quickLogHint: string;
    privateBadge: string;
    tagPlaceholder: string;
};
  scentDna: {
    dataProfilScentDnaTidakValid: string;
    distribusiKeluargaOlfaktifTidakDapatD: string;
    dominasiScentDna: string;
    parfum: string;
    tambahkanMinimal3ParfumKeLemarimuUnt: string;
    jelajahiKatalog: string;
    distribusiKeluargaOlfaktif: string;
    lihatSebagaiTabelData: string;
    lihatSebagaiGrafikBatang: string;
    lihatTabel: string;
    lihatGrafik: string;
    petaPoligonRadarPandanganSekunder: string;
    tabelDistribusiKeluargaScentDna: string;
    proporsi: string;
    total: string;
    berdasarkan0Parfum: string;
    notesDominan: string;
    radarStyleCaption: string;
  };
  finderView: {
    penikmatKebebasanAroma: string;
    kamuMemilikiHidungYangAdaptifDanSiap: string;
    penjelajahHutanHujanAlamSegar: string;
    keseimbanganAntaraKesegaranSitrusYang: string;
    pencintaKehangatanSenjaNuansaManis: string;
    aromaVanilaRempahEksotisDanResinHang: string;
    pencintaHarmoniBotaniRomansaElegan: string;
    kelopakMawarMelatiLembutDanPeonyMemb: string;
    pencariKetenanganHerbalTehKontemporer: string;
    lavenderSageTehHijauDanRempahSejukM: string;
    kuratorAromaPersonal: string;
    preferensimuMencerminkanPemilihanWewang: string;
    ringkasanTasteProfileDisalinKePapanK: string;
    tasteProfileBerhasilDisimpanKeProfil: string;
    scentFinder6Dimensi: string;
    menghitungKecocokanAromamu: string;
    mencocokkanPreferensiDenganProfilWewan: string;
    kurasiTerkalibrasiSkor60: string;
    belumAdaKecocokanKuat: string;
    kombinasiParameterYangSangatKetatMisa: string;
    faktorPembatasTeridentifikasi: string;
    sertakanParfumYangDimiliki: string;
    sesuaikanJawabanKuis: string;
    hasilScentFinder6Dimensi: string;
    kurasiWewangianYangSungguhCocok: string;
    dihitungSecaraDeterministikBerdasarkan: string;
    sertakanParfumYangSayaMiliki: string;
    hanyaBrandLokal: string;
    semuaAsalBrand: string;
    ubahPreferensi: string;
    profilSeleraAroma: string;
    pencintaAroma: string;
    tersalin: string;
    salinProfil: string;
    tersimpan: string;
    simpanKeAkun: string;
    rekomendasiUtama: string;
    kecocokanSangatTinggi: string;
    kecocokanBagus: string;
    rincian6DimensiKecocokanScoringBreakd: string;
    jumlahPoinDimensiSamaPersisDenganSko: string;
    penyesuaianBuktiKalibrasiAdjustment: string;
    karakterPiramidaNotes: string;
    mengapaCocokUntukmuGroundedEvidence: string;
    kemungkinanKurangCocokWeakestDimension: string;
    catatanIniDihitungSecaraDinamisDariD: string;
    diWishlist: string;
    simpanWishlist: string;
    diKomparasi: string;
    cobaSampleDulu: string;
    lihatDetailSpecs: string;
    beliResmiDiShopeeMall: string;
    alternatifTerkualifikasi: string;
    pilihanAlternatifYangMemenuhiStandar: string;
    disesuaikanDenganPreferensiBelanjaSpes: string;
    kurasiAlternatif: string;
    koleksiRekomendasiTeratasLainnya: string;
    pilihan: string;
    tutupRincian6d: string;
    rincianSkor6Dimensi: string;
    pertanyaan0Dari7: string;
    keluargaAromaApaYangPalingMenarikBag: string;
    pilihSatuAtauLebihKategoriAtauPilih: string;
    diManaKamuPalingSeringMemakaiParfum: string;
    suhuDanKelembapanIndonesiaSangatMemen: string;
    untukMomenApaKamuMencariParfumIni: string;
    mencocokkanKesantunanProyeksiDanKonsen: string;
    berapaLamaKetahananAromaYangKamuButu: string;
    ekspektasiRealistisMembantuMencocokkan: string;
    apaPreferensiEkspresiGenderUntukAroma: string;
    membantuMenyaringNuansaAromaMaskulinF: string;
    berapaRentangAnggaranYangKamuSiapkan: string;
    senstoriaMenampilkanHargaReferensiResm: string;
    adakahKarakteristikAromaYangInginKamu: string;
    karakteristikYangDipilihAkanDiberiPen: string;
    lewatiKuisLihatHasil: string;
    selesaiHitungRekomendasi: string;
    pertanyaanBerikutnya: string;
    climateLabel: string;
    climateOutdoor: string;
    climateIndoor: string;
    climateEvening: string;
    flexible: string;
    occasionLabel: string;
    occasionOffice: string;
    occasionDating: string;
    occasionFormal: string;
    occasionSport: string;
    longevityLabel: string;
    longevityLight: string;
    longevityModerate: string;
    longevityLong: string;
    budgetLabel: string;
    noDataFit: string;
    anyFit: string;
    saveWishlistTitle: string;
    detailSpecs: string;
    matchScore: string;
    adjustmentLabel: string;
    dimensionFitLabel: string;
    fitExplanation: string;
    savedAnswersNote: string;
    savedAnswersWarning: string;
    startOver: string;
    skippedRunNote: string;
    noAdjustmentNote: string;
    budgetConstraintNote: string;
    avoidancePenaltyNote: string;
    ownedExcludedNote: string;
    longevityTip: string;
    calibrationCapNote: string;
    runnersUpCount: string;
    radarCaption: string;
    loadingRadar: string;
    pyramidTopShort: string;
    pyramidHeartShort: string;
    pyramidBaseShort: string;
  };
  tryItFirstView: {
    kicker: string;
    title: string;
    subtitle: string;
    pillar1Title: string;
    pillar1Body: string;
    pillar2Title: string;
    pillar2Body: string;
    pillar3Title: string;
    pillar3Body: string;
    publishedCount: string;
    emptyCatalog: string;
    notesLabel: string;
    priceNote: string;
    detailButton: string;
    joinButton: string;
  };
  finderQuiz: {
    steps: FinderQuizStep[];
  };
  diaryOptions: {
    moods: LabeledOption[];
    occasions: LabeledOption[];
    weathers: LabeledOption[];
    sprayCounts: Array<{ count: number; label: string }>;
  };
  logWearOptions: {
    occasions: LabeledOption[];
    moods: LabeledOption[];
    weathers: LabeledOption[];
  };
  reviewOptions: {
    longevityBands: LabeledOption[];
    sillage: DescribedOption[];
    repurchase: LabeledOption[];
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
      library: 'Pustaka',
      diary: 'Jurnal',
      catalog: 'Katalog',
      tryItFirst: 'Coba Dulu',
      scentFinder: 'Temukan',
      compare: 'Bandingkan',
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
      logTodaySubtitle: '1-tap untuk mencatat pemakaian. Volume sisa botol akan otomatis berkurang 0.5 ml, dengan undo 8 detik.',
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
    },
  
    common: {
      loading: 'Memuat…',
      priceCheckedOn: 'Harga resmi dicek {0}',
      coldStartBanner: 'Jawab kuis Finder untuk melihat % kecocokan parfum ini dengan seleramu.',
      matchPercent: '{0}% cocok',
      tryItFirstWaitlistButton: 'Coba Dulu (Daftar Tunggu Sampel)',
      closeDialog: 'Tutup dialog',
    },
    app: {
      gagalMemuatDatamuDariServerPeriksaKo: "Gagal memuat datamu dari server. Periksa koneksi lalu muat ulang halaman.",
      gagalMenyimpanPerubahanCobaLagi: "Gagal menyimpan perubahan. Periksa koneksi lalu coba lagi.",
      cobaLagi: "Coba lagi",
      hapusBotolJudul: "Hapus botol dari lemari?",
      hapusBotolIsi: "Botol akan disembunyikan dari lemari. Kamu bisa mengurungkannya dalam 8 detik.",
      hapusBotolYa: "Ya, hapus",
      hapusBotolBatal: "Batal",
      skipToContent: 'Lewati ke konten utama',
      n0Tersisa: "{0}% tersisa",
      dibatalkan0Tersisa: "Dibatalkan. {0}% tersisa",
      tambahRincian: "Tambah Rincian",
      botolDitandaiSelesaiDanDipindahkanKe: "Botol ditandai selesai dan dipindahkan ke Memories.",
      catatanSemprotDihapus: "Catatan semprot dihapus",
      ceritaAromaBerhasilDipublikasikanKeLi: "Cerita aroma berhasil dipublikasikan ke linimasa!",
      draftCeritaTersimpan: "Draft cerita tersimpan",
      ceritaBerhasilDihapus: "Cerita berhasil dihapus",
      ulasanDiterimaMenungguModerasi: "Ulasan multi-kriteriamu diterima dan menunggu moderasi. Ulasan baru tampil publik setelah disetujui.",
      parfumDihapusDariKomparasi: "Parfum dihapus dari komparasi",
      maksimal3ParfumDapatDibandingkanSecar: "Maksimal 3 parfum dapat dibandingkan secara bersamaan. Hapus salah satu terlebih dahulu.",
      dihapusDariWishlist: "Dihapus dari Wishlist",
      ditambahkanKeWishlist: "Ditambahkan ke Wishlist",
      permintaanSampelDecantBerhasilDidaftar: "Permintaan sampel decant berhasil didaftarkan ke waiting list!",
      pesananSampel0BerhasilDibuatSimulasi: "Pesanan sampel #{0} berhasil dibuat (Simulasi)!",
      parfum0BerhasilDitambahkanKeKatalog: "Parfum \"{0}\" berhasil ditambahkan ke katalog!",
      parfum0BerhasilDiperbarui: "Parfum \"{0}\" berhasil diperbarui!",
      parfumBerhasilDihapusDariKatalog: "Parfum berhasil dihapus dari katalog",
      ulasanDisetujuiDanKiniTampilPublik: "Ulasan disetujui dan kini tampil publik!",
      ulasanDitangguhkan: "Ulasan ditangguhkan",
      ulasanDihapus: "Ulasan dihapus",
      botolBaruBerhasilDisimpanKeLemarimu: "Botol baru berhasil disimpan ke lemarimu",
      botolBerhasilDiperbarui: "Botol berhasil diperbarui",
      botolDihapusDariLemari: "Botol dihapus dari lemari",
      masukkanEmailKamu: "Masukkan email kamu",
      berhasilMasukAkun: "Berhasil masuk akun",
      akunDibuatPeriksaEmailUntukLinkVerif: "Akun dibuat. Periksa email untuk link verifikasi sebelum masuk.",
      masukkanEmailKamuDuluLaluTekanLupaK: "Masukkan email kamu dulu, lalu tekan Lupa kata sandi.",
      linkAturUlangKataSandiTelahDikirimK: "Link atur ulang kata sandi telah dikirim ke emailmu.",
      textFffef2Underline: "text-paper underline",
      english: "English",
      id: "ID",
      idEn: "ID | EN",
      modeDemoKamuSedangMelihatDataContoh: "Mode Demo: kamu sedang melihat data contoh berlabel. Data ini bukan koleksimu.",
      keluarDariDemo: "Keluar dari Demo",
      kamuBelumMasukKoleksimuMasihKosongBu: "Kamu belum masuk. Koleksimu masih kosong — buat akun agar koleksimu tersimpan di semua perangkat.",
      lihatContohDenganDataDemo: "Lihat contoh dengan data demo",
      daftarAkun: "Daftar Akun",
      backendBelumTerhubungMasukDanDaftarA: "Backend belum terhubung. Masuk dan daftar akun belum dapat dipakai.",
      mulaiScentFinder: "Mulai Scent Finder",
      jelajahi0KatalogParfum: "Jelajahi {0} Katalog Parfum",
      bukaPustakaSaya: "Buka Pustaka Saya",
      idId: "id-ID",
      memoriAromaPadaHariIni: "MEMORI AROMA · PADA HARI INI",
      bacaDiBukuHarian: "Baca di Buku Harian →",
      rotasiHarian: "ROTASI HARIAN",
      mulaiPerjalananOlfaktif: "MULAI PERJALANAN OLFAKTIF",
      n3LangkahMemulaiSenstoria: "3 Langkah Memulai Senstoria",
      bangunLemariAromaPersonalDanTemukanW: "Bangun lemari aroma personal dan temukan wewangian khas yang sesungguhnya.",
      n1TemukanSignatureScentLewatScentFind: "1. Temukan Signature Scent lewat Scent Finder",
      ketahuiProfilPiramidaAromaDanPreferen: "Ketahui profil piramida aroma dan preferensi unikmu",
      mulaiScentFinder2: "Mulai Scent Finder",
      n2TambahkanBotolPertamaKeLemari: "2. Tambahkan Botol Pertama ke Lemari",
      koleksiDariKatalogKurasiAtauBotolCus: "Koleksi dari katalog kurasi atau botol custom pribadimu",
      bukaPustaka: "Buka Pustaka",
      n3CatatSemprotanPertamamuDiBukuHarian: "3. Catat Semprotan Pertamamu di Buku Harian",
      simpanSuasanaHatiCuacaDanKenanganAro: "Simpan suasana hati, cuaca, dan kenangan aroma",
      bukaBukuHarian: "Buka Buku Harian",
      rincianSemprotSuasanaCuaca: "+ Rincian Semprot (Suasana/Cuaca)",
      halamanIniHanyaUntukAdmin: "Halaman ini hanya untuk admin.",
      kamuTidakMemilikiAksesAdminKembaliKe: "Kamu tidak memiliki akses admin. Kembali ke beranda untuk melanjutkan.",
      kembaliKeBeranda: "Kembali ke Beranda",
      ruangKomparasiDikosongkan: "Ruang komparasi dikosongkan",
      rincian: "Rincian",
      lupaKataSandi: "Lupa kata sandi?",
      seluruhDataPribadiAndaTelahDimusnahka: "Seluruh data pribadi Anda telah dimusnahkan secara permanen.",
          addedToCompare: "{0} ditambahkan ke ruang komparasi ({1}/3)",
      addedToLibrary: "{0} berhasil ditambahkan ke Lemari",
      unnamedPerfume: "Parfum",
      dataRightsTitle: 'Pusat Hak Data & Ekspor (UU No. 27/2022)',
      homeAria: 'Senstoria - Ke Beranda',
      languageSwitchTitle: 'Ganti Bahasa',
      signOutTitle: 'Keluar ({0})',
      signOutAria: 'Keluar akun {0}',
      logWearAria: 'Catat pemakaian parfum hari ini',
      mainNavAria: 'Navigasi Utama Aplikasi',
      unknownPerfume: 'Parfum',
      defaultMemberName: 'Anggota Senstoria',
      storyFallbackTitle: 'Aroma',
      switchLanguageAria: 'Ubah bahasa ke {0}',
      adminPanel: 'Admin Panel',
      dataRightsButton: 'Hak Data (UU PDP)',
      documentTitle: 'Senstoria — Pustaka & Penjelajahan Parfum Personal',
},
    authErrors: {
      backend_not_configured: 'Backend belum terhubung. Akun belum dapat dibuat atau dipakai — hubungi pengelola.',
      email_in_use: 'Email ini sudah terdaftar. Coba masuk, atau atur ulang kata sandi bila lupa.',
      weak_password: 'Kata sandi minimal 6 karakter.',
      invalid_email: 'Format email tidak valid.',
      invalid_credential: 'Email atau kata sandi salah.',
      user_not_found: 'Akun dengan email ini tidak ditemukan.',
      too_many_requests: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
      unverified: 'Email belum diverifikasi. Periksa kotak masukmu untuk link verifikasi, atau minta kirim ulang di bawah.',
      terms_required: 'Syarat & Kebijakan Privasi harus disetujui.',
      generic: 'Terjadi kesalahan. Coba lagi sebentar lagi.',
      popup_closed: 'Jendela sign-in ditutup sebelum selesai. Coba lagi.',
      popup_blocked: 'Browser memblokir jendela sign-in. Izinkan pop-up untuk situs ini lalu coba lagi.',
      provider_not_enabled: 'Sign-in dengan provider ini belum diaktifkan di Firebase. Hubungi pengelola untuk mengaktifkannya.',
      account_exists_different: 'Email ini sudah terdaftar dengan metode masuk lain. Masuk dengan metode itu dulu.',
    },
    admin: {
      exitShop: '← Keluar ke Toko / Home',
      tabAnalytics: '📊 Analitik & Funnel',
      tabCatalog: '📦 Katalog Parfum ({0})',
      tabReviews: '⭐ Moderasi Ulasan ({0} Pending)',
      tabWaitlist: 'Daftar Tunggu ({0})',
      tabFlags: '🚩 Feature Flags',
      funnelTitle: 'Funnel Drop-off Kuis Scent Finder (FIND-01)',
      funnelSubtitle: 'Tingkat penyelesaian 7 pertanyaan kuis personalisasi wewangian',
      conversionRate: 'Tingkat Konversi Hasil: {0}%',
      funnelQ1: 'Q1 Keluarga Aroma',
      funnelQ3: 'Q3 Sillage',
      funnelQ5: 'Q5 Asal Brand',
      funnelQ7: 'Q7 Pantangan',
      funnelResult: 'Hasil Rekomendasi 6D',
      funnelStepCount: '{0} pengguna ({1}%)',
      chart1Kicker: 'Metrik Aktivitas Komunitas',
      chart1Title: 'Statistik Penggunaan Parfum Bulanan',
      chart1Subtitle: 'Volume rotasi semprotan (Wears logged) dan pengguna aktif bulanan',
      tooltipSprays: 'Semprotan Dicatat',
      seriesSprays: 'Total Semprotan (Wears)',
      seriesUsers: 'Pengguna Aktif',
      chart2Kicker: 'Pertumbuhan Platform & Ekosistem',
      chart2Title: 'Tren Pertumbuhan Koleksi & Waitlist',
      chart2Subtitle: 'Pertumbuhan botol tersimpan di lemari vs permintaan decant sampel',
      seriesBottles: 'Botol Tersimpan',
      seriesWaitlist: 'Permintaan Waitlist',
      clicksTitle: 'Log Klik Afiliasi Shopee / Tokopedia (AFF-02)',
      clicksSubtitle: 'Alur 302 redirect dengan header X-Robots-Tag noindex dan pencatatan parameter tracking',
      refresh: 'Segarkan',
      clicksEmpty: 'Belum ada klik afiliasi tercatat. Klik tombol beli Shopee/Tokopedia di katalog untuk menguji.',
      dataBelumCukup: 'Belum cukup data nyata untuk menampilkan bagian ini. Bagian ini hanya menampilkan angka dari data yang benar-benar tercatat.',
      clicksFromServer: 'Dari log /go yang tercatat di server.',
      thPerfume: 'Parfum',
      thTime: 'Waktu',
      catalogTitle: 'Manajemen Katalog Wewangian',
      catalogSubtitle: 'Kelola kurasi parfum, spesifikasi notes piramida, dan referensi harga resmi.',
      catalogSearch: 'Cari nama, brand, family...',
      editPerfumeTitle: 'Edit data parfum',
      deletePerfumeTitle: 'Hapus dari katalog',
      reviewsTitle: 'Antrean Moderasi Ulasan Komunitas',
      reviewsSubtitle: 'Tinjau ulasan masuk untuk mencegah spam atau kata-kata ofensif sebelum tampil publik di halaman detail katalog.',
      filterPending: 'Menunggu Persetujuan',
      filterAll: 'Semua Ulasan',
      reviewApproved: 'Disetujui',
      reviewPendingBadge: 'Menunggu Moderasi',
      reviewsEmpty: 'Tidak ada ulasan dalam antrean ini. Semua ulasan telah diproses.',
      reviewBy: 'Oleh:',
      reviewLongevity: 'Ketahanan:',
      approve: 'Setujui',
      suspend: 'Tangguhkan',
      deletePermanentTitle: 'Hapus permanen',
      waitlistTitle: 'Daftar Tunggu Try It First',
      waitlistSubtitle: 'Entri dari backend daftar tunggu. Hanya entri terkonfirmasi yang dihitung sebagai demand.',
      registeredCount: '{0} Peminat Terdaftar',
      exportCsv: 'Ekspor CSV',
      waitlistEmpty: 'Belum ada pendaftar daftar tunggu tercatat.',
      waitlistConfirmed: 'Terkonfirmasi: {0}',
      waitlistPending: 'Menunggu konfirmasi: {0}',
      waitlistLoading: 'Memuat daftar tunggu…',
      waitlistLoadError: 'Gagal memuat daftar tunggu.',
      thSize: 'Ukuran',
      thContact: 'Kontak',
      thStatus: 'Status',
      flagsTitle: 'Pengaturan Feature Flags (ADM-10)',
      flagsSubtitle: 'Kendali fungsionalitas aplikasi secara dinamis tanpa proses deploy ulang.',
      flagsReadOnlyNote: 'Nilai di bawah ini adalah konfigurasi kode (bukan sakelar): perubahan memerlukan deploy baru.',
      formEditTitle: 'Edit Parfum: {0}',
      formAddTitle: 'Tambah Parfum Baru',
      formName: 'Nama Parfum:',
      formNameExample: 'Contoh: Solitude',
      formBrand: 'Brand:',
      formBrandExample: 'Contoh: Oullu',
      formFamily: 'Keluarga Aroma:',
      formConcentration: 'Konsentrasi:',
      formOrigin: 'Asal Brand:',
      formOriginLocal: 'Lokal Indonesia',
      formOriginIntl: 'Internasional',
      formPrice: 'Harga Resmi (Rp):',
      formSize: 'Ukuran Botol (ml):',
      formNotes: 'Piramida Notes:',
      formSave: 'Simpan Perubahan',
      formAdd: 'Tambah ke Katalog',
      headerTitle: 'Pusat Kendali & Analitik Senstoria',
      statWaitlistDemand: 'Demand Daftar Tunggu',
      thClickId: 'Click ID',
      thSource: 'Source Placement',
      thPerfumeBrand: 'Parfum & Brand',
      thOfficialPrice: 'Harga Resmi',
      thHeatFit: 'Heat Fit',
      crudKicker: 'KATALOG CRUD',
      formNotesTopExample: 'Top Notes (Bergamot, Pink Pepper)',
      formNotesHeartExample: 'Heart Notes (Cardamom, Rose)',
      formNotesBaseExample: 'Base Notes (Cedarwood, Vetiver)',
      headerSubtitle: 'Monitor konversi klik afiliasi Shopee/Tokopedia, funnel kuis Scent Finder, antrean moderasi ulasan komunitas, manajemen katalog, serta pengaturan feature flags.',
      statClicks: 'Total Klik Afiliasi (Counted)',
      statReviews: 'Ulasan Komunitas',
      statPendingReviews: '{0} Menunggu Moderasi',
    },
    tryItFirstModal: {
      title: 'Daftar Tunggu Try It First',
      subtitle: 'Pilih ukuran decant yang kamu minati. Konfirmasi lewat email diperlukan agar minatmu dihitung.',
      sizeHeading: 'Pilih Ukuran Decant yang Diminati:',
      sizeLabel2: '2 ml Vial',
      sizeDesc2: '~30 semprot',
      sizeLabel5: '5 ml Decant',
      sizeDesc5: '~75 semprot',
      sizeLabel10: '10 ml Travel',
      sizeDesc10: '~150 semprot',
      emailLabel: 'Email Penerima Kabar:',
      emailPlaceholder: 'kolektor@email.com',
      phoneLabel: 'Nomor WhatsApp (+62, opsional):',
      notifHeading: 'Prioritas Notifikasi:',
      notifWhatsapp: 'WhatsApp',
      notifEmail: 'Email',
      notifBoth: 'Keduanya',
      submitWaitlist: 'Daftar Antrean ({0} ml)',
      submitting: 'Mendaftarkan…',
      successTitle: 'Permintaan Tercatat!',
      successBodyEmail: 'Kami mengirim tautan konfirmasi ke email kamu. Klik tautan itu agar minatmu dihitung sebagai permintaan terkonfirmasi.',
      successBodyNoEmail: 'Entri kamu tercatat, tetapi email konfirmasi belum dapat dikirim karena layanan email belum aktif. Entri ini belum dihitung sebagai minat terkonfirmasi.',
      alreadyTitle: 'Kamu Sudah Terdaftar',
      alreadyBody: 'Email ini sudah terdaftar untuk parfum dan ukuran ini. Cek email kamu untuk tautan konfirmasi.',
      errorBody: 'Pendaftaran gagal. Periksa email dan ukuran, lalu coba lagi.',
      errorBackend: 'Layanan daftar tunggu belum dapat dihubungi. Coba lagi nanti.',
      priceNote: 'Harga diumumkan saat peluncuran.',
      closeWindow: 'Tutup Jendela',
    },
    legalModal: {
      closeAria: 'Tutup jendela hukum',
      kicker: 'KEPATUHAN REGULASI & HUKUM INDONESIA',
      title: 'Pusat Informasi Hukum & Privasi Senstoria',
      subtitle: 'Komitmen transparansi penuh atas perlindungan data pribadi, integritas editorial tanpa intervensi komersial, serta keterbukaan afiliasi.',
      tabDataRights: 'Pusat Hak Data & Ekspor',
      tabContact: 'Kontak DPO & Bantuan',
      contactDpoTitle: 'Petugas Pelindungan Data (DPO)',
      contactDpoName: 'Data Protection Officer Senstoria',
      contactDpoResponse: 'Respon Permintaan Data: Maksimal 3 x 24 jam kerja sesuai ketentuan UU PDP.',
      contactOfficeTitle: 'Kantor & Korespondensi',
      contactOfficeName: 'Senstoria Atelier Indonesia',
      contactOfficeAddress: 'Kawasan Senopati, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12190',
      exporting: 'Mengekspor...',
      downloadData: 'Unduh Data Pribadi (JSON)',
      exportSuccess: 'Arsip data pribadi Anda berhasil diunduh ke komputer Anda.',
      erasureTitle: 'Hak Penghapusan Akun & Pemusnahan Data (Right to Erasure - Pasal 8 UU PDP)',
      erasureBody: 'Tindakan ini akan menghapus secara permanen seluruh koleksi botol lemari Anda, catatan semprotan harian, cerita aroma, jawaban kuis Scent Finder, serta sesi login. Tindakan ini bersifat final.',
      deletionSuccess: 'Seluruh data Anda telah berhasil dimusnahkan sesuai amanat UU PDP. Halaman akan dimuat ulang...',
      deleteConfirmBefore: 'Ketik teks ',
      deleteConfirmAfter: ' di bawah ini untuk konfirmasi:',
      destroyButton: 'Musnahkan Data Permanen',
      portabilityTitle: 'Hak Portabilitas Data (Pasal 7 UU PDP)',
      portabilityBody: 'Unduh seluruh data profil, koleksi botol, catatan pemakaian, cerita aroma, ulasan, preferensi kuis, dan riwayat pesanan dalam format JSON terstruktur.',
      exportIncludesServer: 'Bila Anda masuk, ekspor mencakup data server Firestore Anda; bila tidak masuk, hanya data perangkat ini.',
      exportError: 'Ekspor gagal. Silakan coba lagi; data Anda tidak berubah.',
      deletionNeedsRelogin: 'Data server Anda telah dihapus ({count} dokumen). Karena sesi login sudah lama, akun login belum terhapus: silakan keluar, masuk kembali, lalu ulangi penghapusan untuk menghapus akun login Anda.',
      deletionError: 'Penghapusan gagal. Sebagian data mungkin masih tersisa; silakan coba lagi.',
    },
    legalPage: {
      backHome: '← Kembali ke Beranda',
      tabPrivacy: 'Kebijakan Privasi',
      tabTerms: 'Syarat & Ketentuan',
      tabAffiliate: 'Pengungkapan Afiliasi',
      tabFaq: 'FAQ',
      privacyTitle: 'Kebijakan Privasi',
      privacyIntro: 'Senstoria mematuhi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Halaman ini menjelaskan data apa yang kami proses, atas dasar apa, dan hak apa yang Anda miliki.',
      privacyS1H: '1. Data yang kami kumpulkan',
      privacyS1B: 'Hanya data yang Anda berikan secara sukarela untuk layanan kurasi wewangian: akun (email), koleksi botol, catatan pemakaian (wear log), cerita aroma, ulasan, dan preferensi kuis Scent Finder. Kami tidak menjual data Anda kepada pengiklan.',
      privacyS2H: '2. Dasar hukum pemrosesan',
      privacyS2B: 'Pemrosesan dilakukan atas persetujuan eksplisit Anda (Pasal 20 ayat (2) huruf a UU PDP) saat Anda membuat akun dan mencentang persetujuan pada formulir daftar. Anda dapat menarik persetujuan kapan saja dengan menghapus akun atau menghubungi kami.',
      privacyS3H: '3. Hak subjek data',
      privacyS3B: 'Anda berhak mengakses, memperbaiki, dan meminta salinan portabel (JSON) atas data Anda melalui menu Hak Data di aplikasi, serta mengajukan penghapusan data melalui kontak DPO di bawah.',
      privacyS4H: '4. Penyimpanan dan keamanan',
      privacyS4B: 'Data akun tersimpan selama akun Anda aktif. Jurnal (wear log dan cerita aroma) bersifat privat: tidak pernah ditampilkan kepada pengguna lain. Kami tidak menampilkan data pribadi Anda di halaman publik mana pun.',
      privacyS5H: '5. Pelacakan, Retensi & Catatan Pemrosesan',
      privacyS5B: 'Senstoria tidak memakai pelacak pihak ketiga (tidak ada Google Analytics, Meta Pixel, atau sejenisnya). Satu-satunya pencatatan adalah klik afiliasi di server — tanpa identitas pengguna — dan laporan error yang telah disanitasi: alamat email, token, kata sandi, dan URL berisi rahasia tidak pernah dikirim. Data akun disimpan selama akun aktif; setelah penghapusan, dokumen Firestore pengguna dan akun login dihapus. Pengecualian: entri waitlist dikunci hash dan hanya dapat dibaca admin, sehingga penghapusan waitlist memerlukan permintaan ke dpo@senstoria.id; klik afiliasi tidak terkait pengguna sehingga tidak ada yang perlu dihapus.',
      termsTitle: 'Syarat & Ketentuan',
      termsIntro: 'Senstoria adalah platform kurasi wewangian independen. Skor kecocokan, piramida notes, dan indeks performa disusun dari riset komparatif tanpa sponsor komersial dari brand mana pun.',
      termsS1H: '1. Standar ulasan dan cerita',
      termsS1B: 'Setiap ulasan dan cerita harus mencerminkan pengalaman pemakaian nyata di kulit. Konten spam, promosi tersembunyi, atau ujaran kebencian dimoderasi; hanya ulasan yang disetujui yang tampil publik. Cerita aroma bersifat privat dan tidak pernah dibagikan ke pengguna lain.',
      termsS2H: '2. Skor kecocokan adalah panduan, bukan jaminan',
      termsS2B: "Finder memakai pencocokan selera deterministik atas 6 dimensi (notes & family, iklim, acara, ketahanan, ekspresi gender, anggaran) dengan kalibrasi yang dinyatakan di hasil. Skor membantu memilih, bukan menjamin kecocokan di kulit setiap orang. Field yang tidak dinyatakan brand resmi ditampilkan sebagai 'Tanpa data', bukan ditebak.",
      termsS3H: '3. Pembelian lewat marketplace',
      termsS3B: 'Senstoria tidak menjual parfum di situs ini pada Stage 1. Tombol Beli mengarahkan Anda ke toko resmi di Shopee atau Tokopedia; harga, stok, dan ketentuan pembelian mengikuti toko tersebut.',
      termsS4H: '4. Akun Anda',
      termsS4B: 'Anda bertanggung jawab atas kerahasiaan akun Anda dan atas konten yang Anda kirim. Jangan membagikan kata sandi kepada siapa pun.',
      affiliateTitle: 'Pengungkapan Afiliasi',
      affiliateIntro: 'Sebagian tautan Beli ke Shopee dan Tokopedia adalah tautan afiliasi. Halaman ini menjelaskan apa artinya — dan apa yang tidak pernah kami lakukan.',
      affiliateS1H: '1. Nol-markup',
      affiliateS1B: 'Harga yang Anda bayar di toko mitra sama dengan harga reguler toko tersebut. Senstoria tidak menaikkan harga sepeser pun.',
      affiliateS2H: '2. Cara kerja tautan',
      affiliateS2B: 'Tombol Beli mengarahkan lewat endpoint /go dengan pengalihan 302 ke halaman produk resmi, melalui daftar domain yang diizinkan (Shopee dan Tokopedia). Klik dicatat tanpa data pribadi untuk keperluan pelaporan.',
      affiliateS3H: '3. Komisi tidak pernah memengaruhi ranking',
      affiliateS3B: 'Komisi afiliasi — bila ada — tidak memengaruhi skor Finder, urutan katalog, atau rekomendasi. Peringkat selalu berasal dari kecocokan selera, bukan dari komisi.',
      faqTitle: 'Pertanyaan Umum',
      faqIntro: 'Jawaban singkat atas pertanyaan yang paling sering diajukan tentang Senstoria.',
      faqQ1: 'Apa itu Senstoria?',
      faqA1: 'Perpustakaan wewangian pribadi dan alat discovery: simpan koleksi botol, catat pemakaian dan cerita aroma, dan temukan parfum lewat Scent Finder yang menjelaskan alasannya.',
      faqQ2: 'Bagaimana cara kerja skor Finder?',
      faqA2: 'Finder menilai 6 dimensi — notes & family, iklim tropis, acara, ketahanan, ekspresi gender, dan anggaran — lalu menerapkan kalibrasi (penyusutan bukti, cap konflik, dan plafon) yang ditampilkan sebagai poin + adjustment = skor total. Ini bukan model AI terlatih; labelnya adalah pencocokan selera (taste matching).',
      faqQ3: "Apa arti 'Tanpa data'?",
      faqA3: 'Brand resmi tidak menyatakan field tersebut, jadi kami menampilkannya kosong. Kami tidak menebak notes, family, ketahanan, atau occasion dari listing marketplace.',
      faqQ4: 'Apakah Jurnal saya privat?',
      faqA4: 'Ya. Wear log dan cerita aroma hanya terlihat oleh Anda. Ulasan berbeda: ulasan tampil publik hanya setelah disetujui moderasi.',
      faqQ5: 'Bagaimana cara kerja daftar tunggu Try It First?',
      faqA5: 'Anda mendaftarkan email untuk satu parfum dan ukuran (2/5/10 ml). Kami mengirim tautan konfirmasi ke email Anda; entri baru dihitung sebagai minat terkonfirmasi setelah Anda mengklik tautan itu. Harga diumumkan saat peluncuran.',
      faqQ6: 'Bagaimana cara mengekspor atau menghapus data saya?',
      faqA6: 'Ekspor JSON tersedia lewat menu Hak Data di aplikasi. Penghapusan data akun dapat diajukan lewat email DPO (dpo@senstoria.id); penghapusan server penuh sedang disiapkan untuk tahap beta.',
      faqQ7: 'Apakah Senstoria menjual parfum?',
      faqA7: 'Belum pada Stage 1. Saat ini Anda membeli lewat toko resmi di marketplace melalui tautan Beli. Penjualan langsung hanya dibuka lewat gerbang metrik dan legal tahap berikutnya.',
    },
    authModal: {
      titleSignin: 'Masuk ke Senstoria',
      titleSignup: 'Daftar Akun Baru',
      subtitleSignin: 'Akses lemari parfum dan catatan scent diary kamu di semua perangkat.',
      subtitleSignup: 'Daftar untuk menyimpan lemari parfum dan scent diary kamu di semua perangkat.',
      tabSignin: 'Masuk Email',
      tabSignup: 'Daftar',
      emailLabel: 'Alamat Email',
      emailPlaceholder: 'nama@email.com',
      passwordLabel: 'Kata Sandi',
      passwordPlaceholder: 'Minimal 6 karakter',
      consentPrefix: 'Saya menyetujui ',
      consentMiddle: ' dan ',
      consentSuffix: ' Senstoria.',
      termsLink: 'Syarat Penggunaan',
      privacyLink: 'Kebijakan Privasi',
      submitSignin: 'Masuk',
      submitSignup: 'Daftar Sekarang',
      authBack: 'Kembali',
      authSwitchToSignup: 'Belum punya akun? Daftar',
      authSwitchToSignin: 'Sudah punya akun? Masuk',
      providerGoogle: 'Masuk dengan Google',
      providerApple: 'Masuk dengan Apple',
      providerDivider: 'atau',
    },
    buySheet: {
      opsiPembelianRepurchaseResmi: "Opsi Pembelian & Repurchase Resmi",
      hargaReferensi: "Harga Referensi:",
      pilihMitraMarketplaceResmi: "Pilih Mitra Marketplace Resmi:",
      beliResmiDiShopeeMall: "Beli Resmi di Shopee Mall",
      beliResmiDiTokopediaOfficial: "Beli Resmi di Tokopedia Official",
      cobaSampelDuluDecant: "Coba Sampel Dulu (Decant)",
      kamiBisaMenerimaKomisiJikaKamuMembel: "Kami bisa menerima komisi jika kamu membeli lewat tautan ini. Komisi tidak memengaruhi skor kecocokanmu.",
      originTierLocal: 'Artisan Indonesia',
      originTierGlobal: 'Global Designer',
    },
    catalogView: {
      katalogTerkurasi: "KATALOG TERKURASI",
      eksplorasiKoleksiParfum: "Eksplorasi Koleksi Parfum",
      menampilkan0DariTotal1Parfum: "Menampilkan {0} dari total {1} parfum",
      cariNamaParfumBrandAtauNotesCthBerg: "Cari nama parfum, brand, atau notes (cth: bergamot, oud, HMNS)...",
      semuaAroma: "Semua Aroma",
      filterAktif: "Filter Aktif:",
      hapusSemua: "Hapus Semua",
      filterKatalog: "Filter Katalog",
      sesuaikanKriteriaPencarianParfum: "Sesuaikan kriteria pencarian parfum",
      hapus: "Hapus",
      tampilkan0Parfum: "Tampilkan {0} Parfum",
      hargaReferensi: "Harga referensi:",
      sortLabel: 'Urutkan:',
      sortOptions: [
      { value: 'name-asc', label: 'Nama (A–Z)' },
      { value: 'name-desc', label: 'Nama (Z–A)' },
      { value: 'brand-asc', label: 'Brand (A–Z)' },
      { value: 'year-desc', label: 'Tahun Rilis (Terbaru)' },
      { value: 'price-asc', label: 'Harga (Terendah)' },
      { value: 'price-desc', label: 'Harga (Tertinggi)' },
    ],
      priceRanges: [
      { id: 'all', label: 'Semua Harga' },
      { id: 'under-350', label: '< Rp 350.000' },
      { id: '350-750', label: 'Rp 350k – Rp 750k' },
      { id: '750-1500', label: 'Rp 750k – Rp 1.5jt' },
      { id: 'above-1500', label: '> Rp 1.500.000' },
    ],
      originHeading: 'Asal Brand',
      familyHeading: 'Keluarga Aroma',
      concentrationHeading: 'Konsentrasi',
      brandHeading: 'Brand Spesifik',
      budgetHeading: 'Rentang Anggaran (IDR)',
      originLocal: 'Lokal Indonesia',
      originIntlChip: 'Internasional',
      originIntlLabel: 'Internasional / Global',
      allBrands: 'Semua Brand',
      emptyTitle: 'Tidak ada parfum yang cocok dengan filter ini',
      emptyBody: 'Coba sesuaikan kombinasi keluarga aroma, rentang tier, atau kata kunci pencarianmu.',
      clearAllFilters: 'Hapus Semua Filter',
      toggleWishlistTitle: 'Alihkan Wishlist',
      saveToWishlistAria: 'Simpan ke wishlist',
      addToCompareTitle: 'Tambah ke Komparasi',
      addToCompareAria: 'Tambah ke komparasi',
      viewSpecs: 'Lihat Specs',
      historyLabel: 'Riwayat:',
    },
    compareTray: {
      bukaKomparasi: "Buka Komparasi",
      trayAria: 'Ruang Komparasi Parfum',
      removeTitle: 'Hapus {0}',
      removeAria: 'Hapus {0} dari komparasi',
      slotLabel: '+ Slot {0}',
    },
    compareView: {
      komparasiSisiKeSisi: "KOMPARASI SISI-KE-SISI",
      bandingkanKarakterKomposisiKetahanan: "Bandingkan Karakter, Komposisi & Ketahanan",
      dari3SlotParfumAktif: "dari 3 slot parfum aktif",
      notesSamaTerdeteksi: "notes sama terdeteksi",
      modeSorotPerbedaanAktif: "✓ Mode Sorot Perbedaan Aktif",
      sorotPerbedaanSaja: "Sorot Perbedaan Saja",
      tambahParfum: "Tambah Parfum",
      bandingkanParfum: "Bandingkan Parfum",
      geserTabelUntukMelihatRincian: "Geser tabel untuk melihat rincian",
      kesesuaianIklimPanas: "Kesesuaian Iklim Panas",
      sangatCocokCuacaPanas: "Sangat cocok cuaca panas",
      cocokRuangAcMalam: "Cocok ruang AC / malam",
      hargaNilaiMl: "Harga & Nilai / ml",
      pilihParfumUntukDibandingkan: "Pilih Parfum untuk Dibandingkan",
      bandingkanPiramidaAromaSpesifikasiMaks: "Bandingkan piramida aroma & spesifikasi (maks. 3)",
      cariNamaAtauBrandParfum: "Cari nama atau brand parfum...",
      tidakAdaParfumYangCocok: "Tidak ada parfum yang cocok.",
      tutup: "Tutup",
      buyOnShopee: 'Beli di Shopee',
      buyOnTokopedia: 'Beli di Tokopedia',
      originTierHeading: 'Asal Brand & Tier',
      longevityProjectionHeading: 'Ketahanan & Proyeksi',
      shoppingActionsHeading: 'Aksi Belanja & Coba',
      highlightNotesLabel: '★ Highlight Catatan:',
      sharedNoteLabel: '★ Catatan bersama',
      removeTitle: 'Hapus',
      addSlotButton: '+ Tambah Slot {0}',
      highlightNotesExplanation: 'Menandakan aroma notes yang dimiliki bersama oleh semua parfum yang sedang kamu bandingkan ({0}).',
      perBottleSize: 'Per botol {0}ml',
    },
    libraryView: {
      koleksiPribadi: "KOLEKSI PRIBADI",
      lemariWewangianScentDna: "Lemari Wewangian & Scent DNA",
      botolAktif: "botol aktif",
      favorit: "favorit",
      valuasiKoleksi: "Valuasi Koleksi",
      tambahBotolKeLemari: "Tambah Botol ke Lemari",
      sedangDipakai: "Sedang Dipakai",
      inginDicobaWishlist: "Ingin Dicoba (Wishlist)",
      favorit2: "Favorit",
      kenanganBotolHabis: "Kenangan & Botol Habis",
      dashboardScentDna: "Dashboard Scent DNA",
      botolAktifYangSaatIniTersediaDiMeja: "Botol aktif yang saat ini tersedia di meja rias atau lemari aromamu. Klik \"Catat Semprot\" untuk melacak pengurangan volume secara otomatis.",
      bukaBukuHarianCerita: "Buka Buku Harian & Cerita →",
      menipis20: "Menipis (≤20%)",
      dipakai: "dipakai",
      editVolume: "Edit Volume",
      wewangianYangMenarikMinatmuDanInginK: "Wewangian yang menarik minatmu dan ingin kamu coba atau miliki di masa mendatang. Item wishlist belum dimiliki dan tidak dihitung sebagai botol koleksi.",
      hapusDariWishlist: "Hapus dari wishlist",
      sudahPunyaPindahKeLemari: "Sudah Punya (Pindah ke Lemari)",
      cobaDulu: "Coba Dulu",
      lihatDetail: "Lihat Detail",
      wewangianYangMenjadiIdentitasKhasDan: "Wewangian yang menjadi identitas khas dan signature scent terbaik dalam rotasimu.",
      aromaKhasYangSelaluMemberiRasaTenang: "Aroma khas yang selalu memberi rasa tenang dan percaya diri setiap hari.",
      catatanDiary: "Catatan diary",
      arsipBotolYangTelahKosongAtauAromaM: "Arsip botol yang telah kosong atau aroma masa lalu yang memiliki kenangan emosional berharga.",
      habis0Ml: "Habis (0 ml)",
      telahDisemprotSebanyak0KaliSelamaMen: "Telah disemprot sebanyak {0} kali selama menemani aktivitasmu.",
      profilScentDnaMembutuhkanMinimal3Par: "Profil Scent DNA Membutuhkan Minimal 3 Parfum",
      tambahkanMinimal3ParfumKeLemarimuUnt: "Tambahkan minimal 3 parfum ke lemarimu untuk membentuk profil dan analisis DNA aroma personal.",
      profilDnaAromaPribadi: "Profil DNA Aroma Pribadi",
      karakterUtama0Devotee: "Karakter Utama: {0} Devotee",
      memuatVisualisasiRadar: "Memuat visualisasi radar...",
      kesesuaianIklimTropisIndonesia: "Kesesuaian Iklim Tropis Indonesia",
      siangTerikOutdoorTropis: "Siang Terik Outdoor Tropis",
      ruangBerAcSeharianKantor: "Ruang Ber-AC Seharian (Kantor)",
      malamHariCuacaHujan: "Malam Hari & Cuaca Hujan",
      totalVolumeTersisa: "Total Volume Tersisa:",
      rataRataSisaIsiBotol: "Rata-rata Sisa Isi Botol:",
      totalNilaiKoleksi: "Total Nilai Koleksi:",
      tambahParfumKeLemarimu: "Tambah Parfum ke Lemarimu",
      kurasiKoleksiBotolParfumPersonalmu: "Kurasi koleksi botol parfum personalmu",
      pilihDariKatalog0Kurasi: "Pilih dari Katalog ({0} Kurasi)",
      pilihUkuranBotolMl: "Pilih Ukuran Botol (ml)",
      ukuranPenuhMl: "Ukuran Penuh (ml)",
      editVolumeSisaBotol: "Edit Volume & Sisa Botol",
      perbaruiSisaVolumeCairanBotolParfum: "Perbarui sisa volume cairan botol parfum",
      favoriteToggleTitle: 'Alihkan Favorit',
      saveToFavoriteAria: 'Simpan ke favorit',
      favoriteBadgeAria: 'Favorit',
      dnaMatchBadge: 'COCOK DENGAN DNA',
      openDetails: 'Buka Detail →',
      chooseCatalogData: 'Pilih Data Kurasi Katalog Saja →',
      remainingLiquidLabel: 'Sisa Cairan Saat Ini (ml)',
      fullSizeLabel: 'Ukuran Penuh: {0} ml',
      percentRemaining: 'tersisa',
      saveBottleToWardrobe: 'Simpan Botol ke Lemari',
      dnaRecsHeading: 'Rekomendasi Parfum Kurasi Khusus Scent DNA Kamu',
      dnaRecsSubtitle: 'Dipilih dari katalog karena selaras dengan aroma {0} dan piramida notes favoritmu',
      searchCatalogLabel: 'Cari Parfum di Katalog',
      brandNameLabel: 'Nama Brand',
      variantNameLabel: 'Nama Varian Parfum',
      duplicateNotice: 'Parfum ini sudah ada di katalog kurasi kami dengan data notes terverifikasi.',
      initialStatusLabel: 'Status Awal',
      markFavoriteLabel: 'Tandai sebagai Parfum Favorit',
      makeFavoriteLabel: 'Jadikan Parfum Favorit',
      deleteBottleLabel: 'Hapus Botol',
      searchPlaceholder: 'Ketik nama atau brand (cth: HMNS, Oullu)...',
      brandExamplePlaceholder: 'Contoh: Le Labo, HMNS, atau Artisan Lokal',
      variantExamplePlaceholder: 'Contoh: Santal 33, Orgasm, Vanilla Mist',
    },
    logWear: {
      catatPemakaianAromaLogWear: "Catat Pemakaian Aroma (Log Wear)",
      kurangkanCairanBotolLacakKebiasaanSem: "Kurangkan cairan botol & lacak kebiasaan semprotanmu",
      pemakaianBerhasilDicatat: "Pemakaian Berhasil Dicatat!",
      dikurangkanDariBotolmu: "dikurangkan dari botolmu.",
      belumAdaBotolAktifDiLemarimuSilakan: "Belum ada botol aktif di lemarimu. Silakan tambahkan botol terlebih dahulu.",
      pilihBotolDariLemarimu: "Pilih Botol dari Lemarimu",
      jumlahSemprotan: "Jumlah Semprotan",
      konteksAcaraPemakaian: "Konteks / Acara Pemakaian",
      suasanaHatiMood: "Suasana Hati (Mood)",
      cuacaSaatDipakai: "Cuaca Saat Dipakai",
      mendapatPujianDariOrangLainHariIni: "Mendapat pujian dari orang lain hari ini",
      catatanSingkatOpsional: "Catatan Singkat (Opsional)",
      cthDisemprotDiKemejaPutihTahan6Jam: "Cth: Disemprot di kemeja putih, tahan 6 jam...",
      simpanCatatanPemakaian: "Simpan Catatan Pemakaian",
      decreaseSprays: 'Kurangi semprotan',
      increaseSprays: 'Tambah semprotan',
    },
    lowBottle: {
      statusSisaBotolParfum: "Status sisa botol parfum",
      cobaSampel: "Coba sampel",
      tandaiHabis: "Tandai habis",
    },
    productDetail: {
      kembaliKeKatalog: "Kembali ke Katalog",
      kurasiIndependenSenstoria: "Kurasi Independen Senstoria",
      piramidaAroma: "PIRAMIDA AROMA",
      strukturKomposisiNotesTigaBaris: "Struktur Komposisi Notes Tiga Baris",
      validasiKomunitas: "VALIDASI KOMUNITAS",
      ulasanPemakaiNyataVsKlaimResmiBrand: "Ulasan Pemakai Nyata vs Klaim Resmi Brand",
      klaimResmiBrand: "Klaim Resmi Brand",
      helpfulCount: "{0} orang terbantu",
      sumberMateriPeluncuranResmiBrand: "Sumber: Materi peluncuran resmi brand",
      dataPemakaiSenstoria: "Data Pemakai Senstoria",
      ulasanKomunitas: "ulasan komunitas",
      ketahananNyataKulit: "Ketahanan nyata kulit:",
      proyeksiAroma: "Proyeksi aroma:",
      bersediaMembeliBotolPenuhKembali: "bersedia membeli botol penuh kembali",
      belumCukupUlasan: "Belum cukup ulasan",
      memerlukanMinimal5UlasanTerpublikasiU: "Memerlukan minimal 5 ulasan terpublikasi untuk menampilkan agregat konsensus komunitas.",
      evaluasiKomunitasIndependen: "EVALUASI KOMUNITAS INDEPENDEN",
      ulasanMultiKriteriaCeritaAroma: "Ulasan Multi-Kriteria & Cerita Aroma",
      dataKetahananNyataKulitJejakAromaDan: "Data ketahanan nyata kulit, jejak aroma, dan nilai beli dari anggota komunitas Senstoria.",
      tulisCerita: "Tulis Cerita",
      tulisUlasanParfumIni: "Tulis Ulasan Parfum Ini",
      rataRataKomunitas: "Rata-Rata Komunitas",
      ulasan: "ulasan",
      ketahananKulit: "Ketahanan Kulit",
      konsensusIklimTropis: "Konsensus iklim tropis",
      jejakAromaSillage: "Jejak Aroma (Sillage)",
      ramahRuangTertutupAc: "Ramah ruang tertutup / AC",
      niatBeliUlang: "Niat Beli Ulang",
      pastiBeliLagi: "Pasti Beli Lagi",
      tingkatKepuasanTinggi: "Tingkat kepuasan tinggi",
      ulasanPengguna0: "ULASAN PENGGUNA ({0})",
      belumAdaUlasanTerperinciUntukWewangia: "Belum ada ulasan terperinci untuk wewangian ini. Jadilah yang pertama memberikan ulasan!",
      tulisUlasanPertama: "Tulis Ulasan Pertama",
      aromaSerupaDalamKeluarga0: "Aroma Serupa dalam Keluarga {0}",
      lihatSemuaDiKatalog: "Lihat Semua di Katalog →",
      inWishlist: 'Di Wishlist',
      addWishlist: 'Tambah Wishlist',
      inComparison: 'Dalam Komparasi',
      compareAction: 'Bandingkan',
      shareScentTitle: 'Bagikan Aroma',
      tropicalClimate: 'Iklim Tropis',
      heatScore: 'Skor {0} / 5',
      buyShopeeMall: 'Beli di Shopee Mall',
      buyTokopediaOfficial: 'Beli di Tokopedia Official',
      repurchaseLabel: 'Beli Ulang:',
      repurchaseYes: 'Pasti Beli',
      repurchaseMaybe: 'Mungkin',
      formatLabel: 'Format:',
      fullBottle: 'Botol Penuh',
      decantFormat: 'Decant',
      addBottleTitle: 'Tambahkan {0} ke Lemari',
      addBottleSubtitle: 'Catat volume botol, sisa cairan, dan harga beli untuk menghitung statistik Scent DNA',
      bottleAddedTitle: '✓ Botol Berhasil Ditambahkan!',
      bottleAddedBody: 'Tersimpan di rak koleksi lemarimu.',
      saveBottle: 'Simpan Botol',
      shareScentHeading: 'BAGIKAN AROMA',
      promoFreeNote: 'Bebas promosi berbayar. Kami tidak menerima bayaran untuk mengubah skor atau peringkat wewangian ini.',
      durabilityLabel: 'Daya Tahan',
      projectionLabel: 'Proyeksi / Sillage',
      tropicalGuideHeading: 'Panduan Pemakaian di Iklim Tropis Indonesia',
      iklimTanpaData: 'Tanpa data',
      climateOutdoor: 'Outdoor / Siang Hari',
      climateOutdoorTip: 'Gunakan 2–3 semprotan di titik nadi dada atau tengkuk agar tidak terlalu pekat saat berkeringat.',
      climateOffice: 'Ruang Ber-AC / Kantor',
      climateOfficeTip: 'Sillage ramah ruang tertutup, aroma bertahan lembut 6–8 jam tanpa mendistraksi rekan kerja.',
      climateNight: 'Malam & Cuaca Hujan',
      climateNightTip: 'Notes dasar kayu & rempah lebih kaya dan hangat, semprotkan pada pakaian katun untuk ketahanan ekstra.',
      buyViaPartners: 'Beli Resmi Melalui Rekanan Marketplace Terpercaya:',
      addToWardrobe: 'Tambahkan ke Lemariku',
      reviewSillageLabel: 'Sillage:',
      furtherExploration: 'EKSPLORASI LANJUTAN',
      bottleStatusLabel: 'Status Botol',
      linkCopied: 'Tautan Tersalin!',
      copyLinkSummary: 'Salin Tautan & Ringkasan Aroma',
      shareWhatsApp: 'Bagikan ke WhatsApp',
      prosLabel: '+ Kelebihan:',
      consLabel: '- Kekurangan:',
      projectionLevel: 'Tingkat {0} / 4',
      pyramidBaseDuration: '3+ jam (Jejak Ketahanan)',
      pyramidHeartDuration: '15 menit – 3 jam (Karakter Utama)',
      pyramidTopDuration: '0 – 15 menit (Kesan Awal)',
      pyramidTopLabel: 'Top Notes',
      pyramidHeartLabel: 'Heart Notes',
      pyramidBaseLabel: 'Base Notes',
      shareButton: 'Bagikan',
    },
    review: {
      tulisUlasanParfumKomunitas: "Tulis Ulasan Parfum Komunitas",
      bantuSesamaPecintaAromaDenganDataPem: "Bantu sesama pecinta aroma dengan data pemakaian nyata kulit",
      ulasanMultiKriteriaTerverifikasi: "ULASAN MULTI-KRITERIA TERVERIFIKASI",
      ulasanBerhasilDipublikasikan: "Ulasan Berhasil Dipublikasikan!",
      terimaKasihAtasKontribusiObjektifmuUn: "Terima kasih atas kontribusi objektifmu untuk perpustakaan Senstoria.",
      parfumYangDiulas: "Parfum yang Diulas",
      skorKeseluruhanRating: "Skor Keseluruhan (Rating)",
      luarBiasaMasterpiece: "Luar Biasa / Masterpiece",
      sangatBagus: "Sangat Bagus",
      lumayanStandar: "Lumayan / Standar",
      diBawahEkspektasi: "Di Bawah Ekspektasi",
      mengecewakan: "Mengecewakan",
      dayaTahanNyataKulitLongevity: "Daya Tahan Nyata Kulit (Longevity)",
      jejakAromaSillageProyeksi: "Jejak Aroma (Sillage & Proyeksi)",
      formatYangKamuPakai: "Format yang Kamu Pakai",
      botolPenuhFullBottle: "Botol Penuh (Full Bottle)",
      decantTravelSize510Ml: "Decant / Travel Size (5–10 ml)",
      sampleVial12Ml: "Sample Vial (1–2 ml)",
      niatBeliUlang: "Niat Beli Ulang",
      judulUlasan: "Judul Ulasan",
      ringkasanKesanUtamamuMisalGurihDanHa: "Ringkasan kesan utamamu (misal: Gurih dan hangat untuk malam hari)",
      ulasanLengkapWajib: "Ulasan Lengkap (Wajib)",
      ceritakanEvolusiAromaDariTopNotesHin: "Ceritakan evolusi aroma dari top notes hingga drydown, bagaimana aromanya bereaksi terhadap panas kulitmu...",
      kelebihanPisahkanDenganKoma: "+ Kelebihan (Pisahkan dengan koma)",
      kekuranganPisahkanDenganKoma: "- Kekurangan (Pisahkan dengan koma)",
      kebijakanIntegritasUlasanmuAkanTerbit: "Kebijakan Integritas: Ulasanmu akan terbit secara transparan tanpa intervensi komersial dari brand manapun.",
      batal: "Batal",
      kirimUlasanSekarang: "Kirim Ulasan Sekarang",
      prosExamplePlaceholder: 'Aroma ramah kantor, botol kokoh, banyak pujian',
      consExamplePlaceholder: 'Terlalu manis untuk siang terik, sprayer agak keras',
    },
    diaryView: {
      catatanAroma: "Catatan Aroma",
      bukuHarianAromaMemori: "Buku Harian Aroma & Memori",
      bukuHarianSemprotCeritaAroma: "Buku Harian Semprot & Cerita Aroma",
      catatSemprotan1TapOtomatisMengurangi: "Catat semprotan 1-tap otomatis mengurangi sisa cairan botol, rangkai cerita aroma yang terikat kenangan dengan autosave draft, dan bagikan ulasan multi-kriteria jujur.",
      tulisCerita: "Tulis Cerita",
      helpfulCount: "Membantu ({0})",
      tulisUlasanBaru: "Tulis Ulasan Baru",
      botolAktifDiLemari: "botol aktif di lemari",
      pujianDiterima: "Pujian Diterima",
      pencatatanSpontan: "Pencatatan spontan",
      rotasiTeratas: "Rotasi Teratas",
      ceritaTersimpan: "Cerita Tersimpan",
      n1LogPemakaianHarian: "1. Log Pemakaian Harian",
      n2CeritaAromaMemori: "2. Cerita Aroma & Memori",
      n3UlasanMultiKriteria: "3. Ulasan Multi-Kriteria",
      cariDiBukuHarianCerita: "Cari di buku harian & cerita...",
      semuaParfum: "Semua Parfum",
      aksiCepatPemakaian: "Aksi Cepat Pemakaian",
      catatSemprotanHariIni: "Catat Semprotan Hari Ini",
      belumAdaBotolAktifDiLemariKoleksimu: "Belum ada botol aktif di lemari koleksimu. Tambahkan botol terlebih dahulu untuk mencatat semprotan harian.",
      bukaLemariKoleksi: "Buka Lemari Koleksi",
      semprotanBerhasilDicatatKeBukuHarian: "Semprotan berhasil dicatat ke buku harian! Volume botol otomatis dikurangi.",
      pilihBotolYangDipakai: "Pilih Botol yang Dipakai",
      jumlahSemprotan: "Jumlah Semprotan",
      konteksAcara: "Konteks / Acara",
      cuacaRuangan: "Cuaca / Ruangan",
      dapatPujianCompliment1: "Dapat pujian / compliment (+1)",
      catatanSingkatOpsionalMisalAromanyaTe: "Catatan singkat (opsional: misal \"Aromanya tetap harum walau naik ojol siang\")",
      simpanKeBukuHarian05Ml: "Simpan ke Buku Harian (-0.5 ml)",
      riwayatSemprotTerkini: "Riwayat Semprot Terkini",
      belumAdaCatatanPemakaianYangCocokDen: "Belum ada catatan pemakaian yang cocok dengan filter.",
      jadikanCerita: "Jadikan Cerita",
      bukaEditorDraft: "Buka Editor Draft →",
      abadikanMemoriCeritaAromamu: "Abadikan Memori & Cerita Aromamu",
      aromaMemilikiKaitanPalingEratDenganM: "Aroma memiliki kaitan paling erat dengan memori dan emosi. Tuliskan momen spesial saat kamu memakai parfum tertentu—draft akan tersimpan otomatis saat mengetik.",
      mulaiMenulisCerita: "Mulai Menulis Cerita",
      pembuatCeritaAroma: "Pembuat Cerita Aroma",
      tulisCatatanMemoriOlfaktif: "Tulis Catatan Memori Olfaktif",
      menyimpan: "Menyimpan…",
      tersimpan: "Tersimpan",
      parfumYangTerikatCeritaIni: "Parfum yang Terikat Cerita Ini",
      judulCerita: "Judul Cerita",
      contohHujanSoreDiKemangHangatnyaVani: "Contoh: Hujan Sore di Kemang & Hangatnya Vanilla",
      suasanaHati: "Suasana Hati",
      konteksAcara2: "Konteks Acara",
      cuacaTempat: "Cuaca / Tempat",
      kisahNarasiMemori: "Kisah & Narasi Memori",
      ceritakanSuasanaHariItuSiapaYangAda: "Ceritakan suasana hari itu, siapa yang ada bersamamu, bagaimana aroma ini berbaur dengan udara sekitar...",
      tagMomenPisahkanKoma: "Tag Momen (Pisahkan koma)",
      buangDraft: "Buang Draft",
      publikasikanCerita: "Publikasikan Cerita",
      linimasaCeritaMemoriAroma: "Linimasa Cerita & Memori Aroma",
      belumAdaCeritaYangCocokDenganFilter: "Belum ada cerita yang cocok dengan filter pencarian.",
      evaluasiKomunitasIndependen: "Evaluasi Komunitas Independen",
      ulasanMultiKriteriaTerverifikasi: "Ulasan Multi-Kriteria Terverifikasi",
      bebasSponsorKomersialDataKetahananNya: "Bebas sponsor komersial. Data ketahanan nyata kulit, sillage, dan niat beli ulang dari anggota terverifikasi.",
      belumAdaUlasanYangSesuaiDenganFilter: "Belum ada ulasan yang sesuai dengan filter.",
      catatSemprotanHariIni2: "Catat Semprotan Hari Ini",
          defaultStoryTitle: "Aroma Hari Ini",
      storyLengthHint: "{0} karakter (minimal 20 karakter untuk publikasi)",
      deleteLogTitle: "Hapus log",
      noDataYet: 'Belum ada data',
      wearLogCount: '{0} catatan semprot',
      storyCount: '{0} cerita',
      reviewCount: '{0} ulasan',
      deleteStoryTitle: 'Hapus cerita',
      repurchaseLabel: 'Beli Ulang',
      repurchaseYes: '✓ Pasti Beli Lagi',
      repurchaseMaybe: 'Mungkin',
      usageFormatLabel: 'Format Pemakaian',
      fullBottle: 'Botol Penuh',
      decantSample: 'Decant / Sample',
      prosLabel: '+ Kelebihan:',
      consLabel: '- Kekurangan:',
      skinLongevityLabel: 'Daya Tahan Kulit',
      quickLogHint: '-0.5 ml per log · Undo 8 detik',
      privateBadge: 'Privat',
      tagPlaceholder: 'Kemang, Hujan, Senja, Kencan, Nostalgia',
},
    scentDna: {
      dataProfilScentDnaTidakValid: "Data profil Scent DNA tidak valid",
      distribusiKeluargaOlfaktifTidakDapatD: "Distribusi keluarga olfaktif tidak dapat divisualisasikan karena nilai proporsi tidak konsisten (proporsi tidak boleh bernilai negatif dan total harus tepat 100%).",
      dominasiScentDna: "Dominasi Scent DNA",
      parfum: "parfum",
      tambahkanMinimal3ParfumKeLemarimuUnt: "Tambahkan minimal 3 parfum ke lemarimu untuk mengaktifkan analisis Scent DNA.",
      jelajahiKatalog: "Jelajahi Katalog →",
      distribusiKeluargaOlfaktif: "Distribusi Keluarga Olfaktif",
      lihatSebagaiTabelData: "Lihat sebagai tabel data",
      lihatSebagaiGrafikBatang: "Lihat sebagai grafik batang",
      lihatTabel: "Lihat tabel",
      lihatGrafik: "Lihat grafik",
      petaPoligonRadarPandanganSekunder: "Peta Poligon Radar (Pandangan Sekunder)",
      tabelDistribusiKeluargaScentDna: "Tabel Distribusi Keluarga Scent DNA",
      proporsi: "Proporsi (%)",
      total: "Total",
      berdasarkan0Parfum: "Berdasarkan {0} parfum",
      notesDominan: "Notes dominan: ",
      radarStyleCaption: 'Monochrome · 12% Fill',
    },
    finderView: {
      penikmatKebebasanAroma: "Penikmat Kebebasan Aroma",
      kamuMemilikiHidungYangAdaptifDanSiap: "Kamu memiliki hidung yang adaptif dan siap mengeksplorasi wewangian melintasi berbagai keluarga aroma tanpa prasangka.",
      penjelajahHutanHujanAlamSegar: "Penjelajah Hutan Hujan & Alam Segar",
      keseimbanganAntaraKesegaranSitrusYang: "Keseimbangan antara kesegaran sitrus yang membangkitkan energi dan ketenangan kayu cedar serta vetiver yang bersahaja.",
      pencintaKehangatanSenjaNuansaManis: "Pencinta Kehangatan Senja & Nuansa Manis",
      aromaVanilaRempahEksotisDanResinHang: "Aroma vanila, rempah eksotis, dan resin hangat memberimu rasa nyaman, intim, serta memancarkan daya pikat misterius.",
      pencintaHarmoniBotaniRomansaElegan: "Pencinta Harmoni Botani & Romansa Elegan",
      kelopakMawarMelatiLembutDanPeonyMemb: "Kelopak mawar, melati lembut, dan peony memberimu aura anggun yang ramah, bersih, dan memikat.",
      pencariKetenanganHerbalTehKontemporer: "Pencari Ketenangan Herbal & Teh Kontemporer",
      lavenderSageTehHijauDanRempahSejukM: "Lavender, sage, teh hijau, dan rempah sejuk membantumu tetap fokus, tenang, dan jernih sepanjang hari.",
      kuratorAromaPersonal: "Kurator Aroma Personal",
      preferensimuMencerminkanPemilihanWewang: "Preferensimu mencerminkan pemilihan wewangian yang selektif dan disesuaikan dengan suasana hati serta iklim Indonesia.",
      ringkasanTasteProfileDisalinKePapanK: "Ringkasan Taste Profile disalin ke papan klip!",
      tasteProfileBerhasilDisimpanKeProfil: "Taste Profile berhasil disimpan ke profil akunmu!",
      scentFinder6Dimensi: "Scent Finder 6-Dimensi",
      menghitungKecocokanAromamu: "Menghitung Kecocokan Aromamu...",
      mencocokkanPreferensiDenganProfilWewan: "Mencocokkan preferensi dengan profil wewangian objektif",
      kurasiTerkalibrasiSkor60: "Kurasi Terkalibrasi (Skor < 60%)",
      belumAdaKecocokanKuat: "Belum Ada Kecocokan Kuat",
      kombinasiParameterYangSangatKetatMisa: "Kombinasi parameter yang sangat ketat (misal preferensi anggaran hemat dengan ekspektasi ketahanan maksimal atau pantangan notes yang dominan) membatasi kandidat aroma yang memenuhi standar kurasi objektif Senstoria.",
      faktorPembatasTeridentifikasi: "Faktor Pembatas Teridentifikasi:",
      sertakanParfumYangDimiliki: "Sertakan Parfum yang Dimiliki",
      sesuaikanJawabanKuis: "Sesuaikan Jawaban Kuis",
      hasilScentFinder6Dimensi: "Hasil Scent Finder 6-Dimensi",
      kurasiWewangianYangSungguhCocok: "Kurasi Wewangian yang Sungguh Cocok",
      dihitungSecaraDeterministikBerdasarkan: "Dihitung secara deterministik berdasarkan pencocokan selera (taste matching) 6 dimensi objektif terhadap profil wewangian resmi. Bebas promosi berbayar.",
      sertakanParfumYangSayaMiliki: "Sertakan parfum yang saya miliki",
      hanyaBrandLokal: "✓ Hanya Brand Lokal",
      semuaAsalBrand: "Semua Asal Brand",
      ubahPreferensi: "Ubah Preferensi",
      profilSeleraAroma: "Profil Selera Aroma",
      pencintaAroma: "Pencinta Aroma",
      tersalin: "Tersalin!",
      salinProfil: "Salin Profil",
      tersimpan: "Tersimpan!",
      simpanKeAkun: "Simpan ke Akun",
      rekomendasiUtama: "Rekomendasi Utama",
      kecocokanSangatTinggi: "Kecocokan Sangat Tinggi",
      kecocokanBagus: "Kecocokan Bagus",
      rincian6DimensiKecocokanScoringBreakd: "Rincian 6 Dimensi Kecocokan (Scoring Breakdown):",
      jumlahPoinDimensiSamaPersisDenganSko: "Poin dimensi + penyesuaian = skor total",
      penyesuaianBuktiKalibrasiAdjustment: "Penyesuaian Bukti Kalibrasi (Adjustment):",
      karakterPiramidaNotes: "Karakter Piramida Notes:",
      mengapaCocokUntukmuGroundedEvidence: "Mengapa Cocok Untukmu (Grounded Evidence)",
      kemungkinanKurangCocokWeakestDimension: "Kemungkinan Kurang Cocok (Weakest Dimension)",
      catatanIniDihitungSecaraDinamisDariD: "Catatan ini dihitung secara dinamis dari dimensi dengan kecocokan terendah agar kamu terhindar dari salah beli.",
      diWishlist: "Di Wishlist",
      simpanWishlist: "Simpan Wishlist",
      diKomparasi: "Di Komparasi",
      cobaSampleDulu: "Coba Sample Dulu",
      lihatDetailSpecs: "Lihat Detail Specs",
      beliResmiDiShopeeMall: "Beli Resmi di Shopee Mall",
      alternatifTerkualifikasi: "Alternatif Terkualifikasi",
      pilihanAlternatifYangMemenuhiStandar: "Pilihan Alternatif yang Memenuhi Standar",
      disesuaikanDenganPreferensiBelanjaSpes: "Disesuaikan dengan preferensi belanja spesifik",
      kurasiAlternatif: "Kurasi Alternatif",
      koleksiRekomendasiTeratasLainnya: "Koleksi Rekomendasi Teratas Lainnya",
      pilihan: "Pilihan",
      tutupRincian6d: "▲ Tutup Rincian 6D",
      rincianSkor6Dimensi: "▼ Rincian Skor 6 Dimensi",
      pertanyaan0Dari7: "Pertanyaan {0} dari 7",
      keluargaAromaApaYangPalingMenarikBag: "Keluarga aroma apa yang paling menarik bagimu?",
      pilihSatuAtauLebihKategoriAtauPilih: "Pilih satu atau lebih kategori, atau pilih \"Tidak Yakin\" untuk saran terbuka.",
      diManaKamuPalingSeringMemakaiParfum: "Di mana kamu paling sering memakai parfum ini?",
      suhuDanKelembapanIndonesiaSangatMemen: "Suhu dan kelembapan Indonesia sangat memengaruhi kinerja ketahanan aroma.",
      untukMomenApaKamuMencariParfumIni: "Untuk momen apa kamu mencari parfum ini?",
      mencocokkanKesantunanProyeksiDanKonsen: "Mencocokkan situasi yang dinyatakan brand untuk parfum ini.",
      berapaLamaKetahananAromaYangKamuButu: "Berapa lama ketahanan aroma yang kamu butuhkan?",
      ekspektasiRealistisMembantuMencocokkan: "Ekspektasi realistis membantu mencocokkan konsentrasi EDT, EDP, atau Extrait.",
      apaPreferensiEkspresiGenderUntukAroma: "Apa preferensi ekspresi gender untuk aroma ini?",
      membantuMenyaringNuansaAromaMaskulinF: "Membantu menyaring nuansa aroma maskulin, feminin, atau unisex universal.",
      berapaRentangAnggaranYangKamuSiapkan: "Berapa rentang anggaran yang kamu siapkan?",
      senstoriaMenampilkanHargaReferensiResm: "Senstoria menampilkan harga referensi resmi per botol penuh.",
      adakahKarakteristikAromaYangInginKamu: "Adakah karakteristik aroma yang ingin kamu hindari?",
      karakteristikYangDipilihAkanDiberiPen: "Karakteristik yang dipilih akan diberi penalti scoring -20 poin agar kamu tidak kecewa.",
      lewatiKuisLihatHasil: "Lewati Kuis & Lihat Hasil",
      selesaiHitungRekomendasi: "Selesai & Hitung Rekomendasi",
      pertanyaanBerikutnya: "Pertanyaan Berikutnya",
      climateLabel: 'Iklim:',
      climateOutdoor: 'Outdoor Tropis',
      climateIndoor: 'Ruang Ber-AC',
      climateEvening: 'Malam/Cuaca Dingin',
      flexible: 'Fleksibel',
      occasionLabel: 'Situasi:',
      occasionOffice: 'Kantor/Harian',
      occasionDating: 'Kencan/Santai',
      occasionFormal: 'Pesta/Formal',
      occasionSport: 'Olahraga',
      longevityLabel: 'Ketahanan:',
      longevityLight: '3–5 Jam',
      longevityModerate: '6–8 Jam',
      longevityLong: '8–12+ Jam',
      budgetLabel: 'Anggaran:',
      noDataFit: 'Tanpa Data',
      anyFit: 'Bebas',
      saveWishlistTitle: 'Simpan Wishlist',
      detailSpecs: 'Detail Specs →',
      matchScore: 'Match Score',
      adjustmentLabel: 'Penyesuaian:',
      dimensionFitLabel: 'Kecocokan dimensi',
      fitExplanation: 'Poin dimensi + penyesuaian = skor total. % menunjukkan kecocokan dimensi, bukan turunan poin.',
      savedAnswersNote: 'Jawaban tersimpan dari kunjungan sebelumnya dimuat. Tekan Mulai dari awal untuk menghapusnya.',
      savedAnswersWarning: 'Hasil ini memakai jawaban tersimpan dari kunjungan sebelumnya.',
      startOver: 'Mulai dari awal',
      skippedRunNote: 'Hasil ini memakai default Fleksibel/Bebas (kuis dilewati), bukan jawaban tersimpan.',
      noAdjustmentNote: 'Tidak ada penyesuaian: poin dimensi sudah sama dengan skor total.',
      budgetConstraintNote: 'Anggaran < Rp 250.000 membatasi ketersediaan konsentrasi Extrait/EDP tinggi.',
      avoidancePenaltyNote: 'Beberapa catatan yang dihindari ({0} filter) memicu penalti scoring.',
      ownedExcludedNote: '{0} parfum di Pustakamu saat ini dikecualikan dari hasil pencarian.',
      longevityTip: 'Target ketahanan 8+ jam umumnya memerlukan notes dasar ambery/woody yang lebih berat.',
      calibrationCapNote: '(Batas kalibrasi maks 96%)',
      runnersUpCount: '{0} wewangian dengan skor kecocokan tinggi',
      radarCaption: 'Campuran keluarga dari parfum yang ditampilkan di atas, dihitung dari hasil Finder saat ini.',
      loadingRadar: 'Memuat visualisasi radar…',
      pyramidTopShort: 'Top:',
      pyramidHeartShort: 'Heart:',
      pyramidBaseShort: 'Base:',
    },
    tryItFirstView: {
      kicker: 'TRY IT FIRST · DAFTAR TUNGGU',
      title: 'Coba Dulu Sebelum Memutuskan',
      subtitle: 'Daftarkan minatmu untuk decant 2 ml, 5 ml, atau 10 ml dari parfum katalog. Konfirmasi lewat email diperlukan agar minatmu dihitung.',
      pillar1Title: 'Daftar Minat',
      pillar1Body: 'Pilih parfum dan ukuran decant yang kamu minati.',
      pillar2Title: 'Konfirmasi Email',
      pillar2Body: 'Klik tautan konfirmasi di email kamu agar minatmu dihitung.',
      pillar3Title: 'Kabar Saat Batch Dibuka',
      pillar3Body: 'Kami memberi kabar lewat kontak yang kamu daftarkan saat batch dibuka.',
      publishedCount: '{0} parfum tersedia untuk daftar tunggu',
      emptyCatalog: 'Belum ada parfum yang diterbitkan untuk daftar tunggu.',
      notesLabel: 'Aroma utama:',
      priceNote: 'Harga diumumkan saat peluncuran.',
      detailButton: 'Lihat Detail',
      joinButton: 'Daftar Antrean',
    },
    finderQuiz: {
      steps: [
        {
          "kicker": "Dimensi 1: Notes & Family (Bobot 25 Poin)",
          "options": [
            {
              "id": "Woody",
              "label": "Woody (Kayu & Hutan)",
              "desc": "Cendana, cedarwood, vetiver hangat, tenang & berwibawa."
            },
            {
              "id": "Fresh",
              "label": "Fresh / Citrus & Aquatic",
              "desc": "Bergamot, jeruk segar, udara laut, bersih & berenergi."
            },
            {
              "id": "Floral",
              "label": "Floral (Kelopak Bunga)",
              "desc": "Mawar, melati, peony, anggun, romantis & ramah."
            },
            {
              "id": "Gourmand",
              "label": "Gourmand (Manis Lezat)",
              "desc": "Vanila, karamel, kopi, almond, lezat & menggoda."
            },
            {
              "id": "Ambery",
              "label": "Ambery / Oriental Rempah",
              "desc": "Resin ambery, kapulaga, kayu manis, hangat & eksotis."
            },
            {
              "id": "Aromatic",
              "label": "Aromatic & Herbal",
              "desc": "Lavender, sage, mint, teh hijau, sejuk & menenangkan."
            },
            {
              "id": "not_sure",
              "label": "Tidak Yakin / Bebas",
              "desc": "Rekomendasikan aroma terbaik tanpa batasan keluarga."
            }
          ]
        },
        {
          "kicker": "Dimensi 2: Iklim Tropis (Bobot 20 Poin)",
          "options": [
            {
              "id": "outdoor_hot",
              "label": "Outdoor / Siang Hari Panas Tropis",
              "desc": "Formula tahan keringat yang tidak memicu pusing di tengah terik matahari."
            },
            {
              "id": "indoor_ac",
              "label": "Ruangan Ber-AC Sepanjang Hari (Kantor / Kampus)",
              "desc": "Suhu stabil dan sejuk, nyaman untuk aroma berjejak sedang yang sopan."
            },
            {
              "id": "evening_cool",
              "label": "Malam Hari / Acara Kencan & Cuaca Dingin",
              "desc": "Cocok untuk aroma yang lebih manis, dalam, hangat, dan berjejak kuat."
            },
            {
              "id": "flexible",
              "label": "Fleksibel / Serbaguna Segala Situasi",
              "desc": "Aroma adaptif yang bertransisi mulus dari pagi kantor hingga santai malam."
            }
          ]
        },
        {
          "kicker": "Dimensi 3: Acara & Momen (Bobot 20 Poin)",
          "options": [
            {
              "id": "daily_office",
              "label": "Ruang Kerja / Kantor & Kampus Harian",
              "desc": "Rapi, sopan, bersih, dan tidak menginvasi ruang pribadi rekan kerja."
            },
            {
              "id": "casual_dating",
              "label": "Kencan, Hangout Santai & Sore/Malam",
              "desc": "Aroma memikat, intim, ramah, dan memancarkan daya tarik magnetis."
            },
            {
              "id": "formal_evening",
              "label": "Pesta, Gala & Momen Khusus Formal",
              "desc": "Konsentrasi kaya, berkarakter tegas, dan memancarkan wibawa elegan."
            },
            {
              "id": "outdoor_sport",
              "label": "Olahraga & Aktivitas Luar Ruangan Aktif",
              "desc": "Aroma berenergi segar yang tetap bersih saat bercampur dengan keringat."
            },
            {
              "id": "flexible",
              "label": "Fleksibel / Serbaguna Segala Momen",
              "desc": "Tanpa data pembatas, cari wewangian yang adaptif di berbagai situasi."
            }
          ]
        },
        {
          "kicker": "Dimensi 4: Ketahanan Kulit (Bobot 15 Poin)",
          "options": [
            {
              "id": "light",
              "label": "3–5 Jam (Ringan & Cepat Berganti)",
              "desc": "Cocok untuk olahraga atau santai tanpa mengikat aromanya seharian."
            },
            {
              "id": "moderate",
              "label": "6–8 Jam (Standar Jam Kerja Seharian)",
              "desc": "Cukup disemprot pagi hari dan tetap tercium hingga sore pulang kantor."
            },
            {
              "id": "long",
              "label": "8–12+ Jam (Daya Tahan Ekstra Panjang)",
              "desc": "Konsentrasi pekat yang bertahan hingga malam bahkan setelah mandi."
            },
            {
              "id": "not_sure",
              "label": "Tidak Yakin / Fleksibel",
              "desc": "Fokus pada keindahan aroma, saya bersedia semprot ulang jika perlu."
            }
          ]
        },
        {
          "kicker": "Dimensi 5: Ekspresi Gender (Bobot 10 Poin)",
          "options": [
            {
              "id": "unisex",
              "label": "Netral / Unisex (Aroma Universal)",
              "desc": "Keseimbangan modern tanpa sekat gender, luwes dipakai oleh siapa saja."
            },
            {
              "id": "masculine",
              "label": "Maskulin (Aroma Tegas, Segar Kayu atau Rempah)",
              "desc": "Didominasi nuansa kayu, vetiver, citrus tajam, atau aromatic berwibawa."
            },
            {
              "id": "feminine",
              "label": "Feminin (Aroma Manis, Bunga Anggun atau Buah)",
              "desc": "Didominasi kelopak mawar, melati, buah manis segar, atau vanilla lembut."
            },
            {
              "id": "any",
              "label": "Bebas / Tanpa Batasan Gender",
              "desc": "Fokus pada keindahan komposisi aroma tanpa membatasi label gender."
            }
          ]
        },
        {
          "kicker": "Dimensi 6: Kesesuaian Anggaran (Bobot 10 Poin)",
          "options": [
            {
              "id": "budget",
              "label": "Terjangkau (< Rp 250.000)",
              "desc": "Pilihan hemat bernilai tinggi untuk pemakaian harian santai."
            },
            {
              "id": "mid",
              "label": "Menengah (Rp 250.000 – Rp 600.000)",
              "desc": "Titik temu terpopuler kualitas artisanal lokal dan desainer entry-level."
            },
            {
              "id": "premium",
              "label": "Premium / Niche (> Rp 600.000)",
              "desc": "Bahan baku berkualitas langka, artisan independen, dan desainer mewah."
            },
            {
              "id": "flexible",
              "label": "Fleksibel / Segala Rentang Harga",
              "desc": "Rekomendasikan apa pun yang cocok dengan hidung dan selera saya."
            }
          ]
        },
        {
          "kicker": "Pantangan & Penalti Scoring (-20 Poin)",
          "options": [
            {
              "id": "overly_sweet",
              "label": "Terlalu Manis / Gourmand Enék",
              "desc": "Hindari aroma karamel atau gula tebal yang membuat pusing di cuaca panas."
            },
            {
              "id": "heavy_smoke_oud",
              "label": "Asap Pekat / Dupa & Oud Berat",
              "desc": "Hindari aroma kayu bakar pekat, resin dupa berat, atau aroma gelap menyengat."
            },
            {
              "id": "sharp_white_floral",
              "label": "Bunga Putih Tajam (Tuberose / Melati Kuat)",
              "desc": "Hindari aroma sedap malam atau melati yang terlalu tajam di hidung."
            },
            {
              "id": "none",
              "label": "Tidak Ada Pantangan (Saya Terbuka Mencoba Semua)",
              "desc": "Tidak ada penalti, eksplorasi penuh seluruh spektrum wewangian."
            }
          ]
        }
      ]
    },

    diaryOptions: {
      "moods": [
        {
          "value": "Percaya Diri",
          "label": "Percaya Diri"
        },
        {
          "value": "Santai & Tenang",
          "label": "Santai & Tenang"
        },
        {
          "value": "Romantis",
          "label": "Romantis"
        },
        {
          "value": "Fokus & Produktif",
          "label": "Fokus & Produktif"
        },
        {
          "value": "Segar & Berenergi",
          "label": "Segar & Berenergi"
        },
        {
          "value": "Mewah & Elegan",
          "label": "Mewah & Elegan"
        },
        {
          "value": "Nostalgia",
          "label": "Nostalgia"
        }
      ],
      "occasions": [
        {
          "value": "Kantor / Kerja",
          "label": "Kantor / Kerja"
        },
        {
          "value": "Kencan Romantis",
          "label": "Kencan Romantis"
        },
        {
          "value": "Nongkrong Santai / Kafe",
          "label": "Nongkrong Santai / Kafe"
        },
        {
          "value": "Acara Formal / Resepsi",
          "label": "Acara Formal / Resepsi"
        },
        {
          "value": "Olahraga / Outdoor",
          "label": "Olahraga / Outdoor"
        },
        {
          "value": "Malam Hari / Pesta",
          "label": "Malam Hari / Pesta"
        },
        {
          "value": "Istirahat di Rumah",
          "label": "Istirahat di Rumah"
        }
      ],
      "weathers": [
        {
          "value": "Panas Terik Khatulistiwa",
          "label": "Panas Terik Khatulistiwa"
        },
        {
          "value": "Ruang Ber-AC Seharian",
          "label": "Ruang Ber-AC Seharian"
        },
        {
          "value": "Hujan Sejuk Sore Hari",
          "label": "Hujan Sejuk Sore Hari"
        },
        {
          "value": "Lembap Tropis Hangat",
          "label": "Lembap Tropis Hangat"
        },
        {
          "value": "Malam Angin Semilir",
          "label": "Malam Angin Semilir"
        }
      ],
      "sprayCounts": [
        {
          "count": 1,
          "label": "1–2 (Ringan)"
        },
        {
          "count": 3,
          "label": "3–4 (Standar)"
        },
        {
          "count": 5,
          "label": "5+ (Penuh)"
        }
      ]
    },
    logWearOptions: {
      "occasions": [
        {
          "value": "Kantor / Kerja",
          "label": "Kantor / Kerja"
        },
        {
          "value": "Kencan Santai",
          "label": "Kencan Santai"
        },
        {
          "value": "Formal / Acara",
          "label": "Formal / Acara"
        },
        {
          "value": "Olahraga / Aktif",
          "label": "Olahraga / Aktif"
        },
        {
          "value": "Santai di Rumah",
          "label": "Santai di Rumah"
        },
        {
          "value": "Pesta / Malam",
          "label": "Pesta / Malam"
        }
      ],
      "moods": [
        {
          "value": "Percaya Diri",
          "label": "Percaya Diri"
        },
        {
          "value": "Tenang & Nyaman",
          "label": "Tenang & Nyaman"
        },
        {
          "value": "Segar & Berenergi",
          "label": "Segar & Berenergi"
        },
        {
          "value": "Misterius & Elegan",
          "label": "Misterius & Elegan"
        },
        {
          "value": "Hangat & Nostalgia",
          "label": "Hangat & Nostalgia"
        }
      ],
      "weathers": [
        {
          "value": "Panas Terik Tropis",
          "label": "Panas Terik Tropis"
        },
        {
          "value": "Hujan Lembap",
          "label": "Hujan Lembap"
        },
        {
          "value": "Ruang Ber-AC",
          "label": "Ruang Ber-AC"
        },
        {
          "value": "Malam Sejuk",
          "label": "Malam Sejuk"
        }
      ]
    },
    reviewOptions: {
      "longevityBands": [
        {
          "value": "1–3 Jam (Sangat Singkat)",
          "label": "1–3 Jam (Sangat Singkat)"
        },
        {
          "value": "4–6 Jam (Moderat)",
          "label": "4–6 Jam (Moderat)"
        },
        {
          "value": "7–9 Jam (Tahan Lama)",
          "label": "7–9 Jam (Tahan Lama)"
        },
        {
          "value": "10+ Jam (Sangat Tahan Lama)",
          "label": "10+ Jam (Sangat Tahan Lama)"
        }
      ],
      "sillage": [
        {
          "value": "intimate",
          "label": "Intim (Kulit Saja)",
          "desc": "Hanya tercium dalam jarak sangat dekat"
        },
        {
          "value": "moderate",
          "label": "Moderat (Jarak Lengan)",
          "desc": "Tercium oleh orang di sekitarmu tanpa mengganggu"
        },
        {
          "value": "strong",
          "label": "Kuat (Radius Ruangan)",
          "desc": "Meninggalkan jejak aroma yang jelas di ruangan"
        }
      ],
      "repurchase": [
        {
          "value": "yes_definitely",
          "label": "Pasti Beli Lagi"
        },
        {
          "value": "maybe",
          "label": "Mungkin / Perlu Pertimbangan"
        },
        {
          "value": "never",
          "label": "Tidak Akan Beli Lagi"
        }
      ]
    },
},
  en: {
    appName: 'SENSTORIA',
    tagline: 'Personal Fragrance Library & Scent Discovery',
    sampleDataBadge: 'Sample data',
    sampleDataNotice: 'Sample data for initial preview, awaiting verified curator review',
    nav: {
      home: 'Home',
      library: 'Library',
      diary: 'Journal',
      catalog: 'Catalog',
      tryItFirst: 'Try it First',
      scentFinder: 'Finder',
      compare: 'Compare',
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
    },
  
    common: {
      loading: 'Loading…',
      priceCheckedOn: 'Official price checked {0}',
      coldStartBanner: 'Answer the Finder quiz to see this perfume\'s match % for your taste.',
      matchPercent: '{0}% match',
      tryItFirstWaitlistButton: 'Try It First (Sample Waitlist)',
      closeDialog: 'Close dialog',
    },
    app: {
      gagalMemuatDatamuDariServerPeriksaKo: "Could not load your data from the server. Check your connection and reload the page.",
      gagalMenyimpanPerubahanCobaLagi: "Could not save your change. Check your connection and try again.",
      cobaLagi: "Try again",
      hapusBotolJudul: "Remove this bottle from your library?",
      hapusBotolIsi: "The bottle will be hidden from your library. You can undo within 8 seconds.",
      hapusBotolYa: "Yes, remove",
      hapusBotolBatal: "Cancel",
      skipToContent: 'Skip to main content',
      n0Tersisa: "{0}% remaining",
      dibatalkan0Tersisa: "Undone. {0}% remaining",
      tambahRincian: "Add details",
      botolDitandaiSelesaiDanDipindahkanKe: "Bottle marked as finished and moved to Memories.",
      catatanSemprotDihapus: "Wear log removed",
      ceritaAromaBerhasilDipublikasikanKeLi: "Scent story published!",
      draftCeritaTersimpan: "Story draft saved",
      ceritaBerhasilDihapus: "Story deleted",
      ulasanDiterimaMenungguModerasi: "Your multi-criteria review was received and awaits moderation. New reviews appear publicly after approval.",
      parfumDihapusDariKomparasi: "Perfume removed from comparison",
      maksimal3ParfumDapatDibandingkanSecar: "You can compare up to 3 perfumes. Remove one to add another.",
      dihapusDariWishlist: "Removed from Wishlist",
      ditambahkanKeWishlist: "Added to Wishlist",
      permintaanSampelDecantBerhasilDidaftar: "Decant sample waitlist entry submitted!",
      pesananSampel0BerhasilDibuatSimulasi: "Sample order #{0} placed (Simulation)!",
      parfum0BerhasilDitambahkanKeKatalog: "Perfume \"{0}\" added to catalog!",
      parfum0BerhasilDiperbarui: "Perfume \"{0}\" updated!",
      parfumBerhasilDihapusDariKatalog: "Perfume removed from catalog",
      ulasanDisetujuiDanKiniTampilPublik: "Review approved and published!",
      ulasanDitangguhkan: "Review rejected",
      ulasanDihapus: "Review deleted",
      botolBaruBerhasilDisimpanKeLemarimu: "New bottle added to your Library",
      botolBerhasilDiperbarui: "Bottle updated",
      botolDihapusDariLemari: "Bottle removed from library",
      masukkanEmailKamu: "Please enter your email",
      berhasilMasukAkun: "Signed in successfully",
      akunDibuatPeriksaEmailUntukLinkVerif: "Account created. Check your email for the verification link before signing in.",
      masukkanEmailKamuDuluLaluTekanLupaK: "Enter your email first, then press Forgot password.",
      linkAturUlangKataSandiTelahDikirimK: "A password reset link has been sent to your email.",
      textFffef2Underline: "text-ondark hover:text-paper",
      english: "Bahasa Indonesia",
      id: "EN",
      idEn: "EN | ID",
      modeDemoKamuSedangMelihatDataContoh: "Demo Mode: you are viewing labelled sample data. This is not your collection.",
      keluarDariDemo: "Exit Demo",
      kamuBelumMasukKoleksimuMasihKosongBu: "You are not signed in. Your collection is empty — create an account to keep it on all your devices.",
      lihatContohDenganDataDemo: "View a demo with sample data",
      daftarAkun: "Sign Up",
      backendBelumTerhubungMasukDanDaftarA: "The backend is not connected yet. Sign-in and sign-up are unavailable.",
      mulaiScentFinder: "Take the Scent Finder",
      jelajahi0KatalogParfum: "Explore {0} Perfume Catalog",
      bukaPustakaSaya: "Open My Library",
      idId: "en-US",
      memoriAromaPadaHariIni: "SCENT STORY · ON THIS DAY",
      bacaDiBukuHarian: "Read in Scent Diary →",
      rotasiHarian: "DAILY ROTATION",
      mulaiPerjalananOlfaktif: "GETTING STARTED",
      n3LangkahMemulaiSenstoria: "3 Steps to Begin Senstoria",
      bangunLemariAromaPersonalDanTemukanW: "Build your fragrance wardrobe and uncover your true olfactory signature.",
      n1TemukanSignatureScentLewatScentFind: "1. Discover Signature Scent via Finder",
      ketahuiProfilPiramidaAromaDanPreferen: "Uncover your aroma notes profile and unique preferences",
      mulaiScentFinder2: "Start Scent Finder",
      n2TambahkanBotolPertamaKeLemari: "2. Add Your First Bottle to Shelf",
      koleksiDariKatalogKurasiAtauBotolCus: "Curated catalog fragrance or bespoke bottle",
      bukaPustaka: "Open Library",
      n3CatatSemprotanPertamamuDiBukuHarian: "3. Log Your First Wear in Diary",
      simpanSuasanaHatiCuacaDanKenanganAro: "Record mood, weather, and olfactory memory",
      bukaBukuHarian: "Open Scent Diary",
      rincianSemprotSuasanaCuaca: "+ Wear Details (Mood/Weather)",
      halamanIniHanyaUntukAdmin: "This page is for admins only.",
      kamuTidakMemilikiAksesAdminKembaliKe: "You do not have admin access. Return home to continue.",
      kembaliKeBeranda: "Back to Home",
      ruangKomparasiDikosongkan: "Comparison tray cleared",
      rincian: "Add details",
      lupaKataSandi: "Forgot password?",
      seluruhDataPribadiAndaTelahDimusnahka: "All personal data permanently erased.",
          addedToCompare: "Added to comparison ({1}/3)",
      addedToLibrary: "{0} added to your Library",
      unnamedPerfume: "Fragrance",
      dataRightsTitle: 'Data Rights & Export Center (UU No. 27/2022)',
      homeAria: 'Senstoria — Go to Home',
      languageSwitchTitle: 'Switch Language',
      signOutTitle: 'Sign Out ({0})',
      signOutAria: 'Sign out of account {0}',
      logWearAria: 'Log today’s perfume wear',
      mainNavAria: 'Main App Navigation',
      unknownPerfume: 'Perfume',
      defaultMemberName: 'Senstoria Member',
      storyFallbackTitle: 'Scent',
      switchLanguageAria: 'Switch language to {0}',
      adminPanel: 'Admin Panel',
      dataRightsButton: 'Data Rights (UU PDP)',
      documentTitle: 'Senstoria — Personal Fragrance Library & Discovery',
},
    authErrors: {
      backend_not_configured: 'The backend is not connected yet. Accounts cannot be created or used — please contact the administrator.',
      email_in_use: 'This email is already registered. Try signing in, or reset your password if you forgot it.',
      weak_password: 'Password must be at least 6 characters.',
      invalid_email: 'The email format is invalid.',
      invalid_credential: 'Incorrect email or password.',
      user_not_found: 'No account was found for this email.',
      too_many_requests: 'Too many attempts. Wait a moment and try again.',
      unverified: 'Your email is not verified yet. Check your inbox for the verification link, or request a resend below.',
      terms_required: 'You must accept the Terms & Privacy Policy.',
      generic: 'Something went wrong. Please try again shortly.',
      popup_closed: 'The sign-in window was closed before finishing. Please try again.',
      popup_blocked: 'The browser blocked the sign-in window. Allow pop-ups for this site and try again.',
      provider_not_enabled: 'Sign-in with this provider is not enabled in Firebase yet. Ask the administrator to enable it.',
      account_exists_different: 'This email is already registered with a different sign-in method. Sign in with that method first.',
    },
    admin: {
      exitShop: '← Back to Shop / Home',
      tabAnalytics: '📊 Analytics & Funnel',
      tabCatalog: '📦 Perfume Catalog ({0})',
      tabReviews: '⭐ Review Moderation ({0} Pending)',
      tabWaitlist: 'Waitlist ({0})',
      tabFlags: '🚩 Feature Flags',
      funnelTitle: 'Scent Finder Quiz Funnel Drop-off (FIND-01)',
      funnelSubtitle: 'Completion rate for the 7 fragrance personalization quiz questions',
      conversionRate: 'Result Conversion Rate: {0}%',
      funnelQ1: 'Q1 Fragrance Family',
      funnelQ3: 'Q3 Sillage',
      funnelQ5: 'Q5 Brand Origin',
      funnelQ7: 'Q7 Restrictions',
      funnelResult: '6D Recommendation Result',
      funnelStepCount: '{0} users ({1}%)',
      chart1Kicker: 'Community Activity Metrics',
      chart1Title: 'Monthly Perfume Usage Statistics',
      chart1Subtitle: 'Spray rotation volume (wears logged) and monthly active users',
      tooltipSprays: 'Sprays Logged',
      seriesSprays: 'Total Sprays (Wears)',
      seriesUsers: 'Active Users',
      chart2Kicker: 'Platform & Ecosystem Growth',
      chart2Title: 'Collection & Waitlist Growth Trend',
      chart2Subtitle: 'Growth of bottles stored in wardrobes vs sample decant requests',
      seriesBottles: 'Bottles Stored',
      seriesWaitlist: 'Waitlist Requests',
      clicksTitle: 'Shopee / Tokopedia Affiliate Click Log (AFF-02)',
      clicksSubtitle: '302 redirect flow with X-Robots-Tag noindex header and tracking parameter logging',
      refresh: 'Refresh',
      clicksEmpty: 'No affiliate clicks recorded yet. Click a Shopee/Tokopedia buy button in the catalog to test.',
      dataBelumCukup: 'Not enough real data yet to show this section. This section only shows numbers from data actually recorded.',
      clicksFromServer: 'From /go logs recorded on the server.',
      thPerfume: 'Perfume',
      thTime: 'Time',
      catalogTitle: 'Fragrance Catalog Management',
      catalogSubtitle: 'Manage curated perfumes, pyramid notes specifications, and official price references.',
      catalogSearch: 'Search name, brand, family...',
      editPerfumeTitle: 'Edit perfume data',
      deletePerfumeTitle: 'Remove from catalog',
      reviewsTitle: 'Community Review Moderation Queue',
      reviewsSubtitle: 'Review incoming reviews to prevent spam or offensive words before they appear publicly on catalog detail pages.',
      filterPending: 'Awaiting Approval',
      filterAll: 'All Reviews',
      reviewApproved: 'Approved',
      reviewPendingBadge: 'Awaiting Moderation',
      reviewsEmpty: 'No reviews in this queue. All reviews have been processed.',
      reviewBy: 'By:',
      reviewLongevity: 'Longevity:',
      approve: 'Approve',
      suspend: 'Suspend',
      deletePermanentTitle: 'Delete permanently',
      waitlistTitle: 'Try It First Waitlist',
      waitlistSubtitle: 'Entries from the waitlist backend. Only confirmed entries count as demand.',
      registeredCount: '{0} Registered Applicants',
      exportCsv: 'Export CSV',
      waitlistEmpty: 'No waitlist registrants recorded yet.',
      waitlistConfirmed: 'Confirmed: {0}',
      waitlistPending: 'Awaiting confirmation: {0}',
      waitlistLoading: 'Loading waitlist…',
      waitlistLoadError: 'Failed to load the waitlist.',
      thSize: 'Size',
      thContact: 'Contact',
      thStatus: 'Status',
      flagsTitle: 'Feature Flag Settings (ADM-10)',
      flagsSubtitle: 'Control app functionality dynamically without redeploying.',
      flagsReadOnlyNote: 'Values below are code configuration (not switches): changes require a new deployment.',
      formEditTitle: 'Edit Perfume: {0}',
      formAddTitle: 'Add New Perfume',
      formName: 'Perfume Name:',
      formNameExample: 'Example: Solitude',
      formBrand: 'Brand:',
      formBrandExample: 'Example: Oullu',
      formFamily: 'Fragrance Family:',
      formConcentration: 'Concentration:',
      formOrigin: 'Brand Origin:',
      formOriginLocal: 'Indonesian Local',
      formOriginIntl: 'International',
      formPrice: 'Official Price (Rp):',
      formSize: 'Bottle Size (ml):',
      formNotes: 'Notes Pyramid:',
      formSave: 'Save Changes',
      formAdd: 'Add to Catalog',
      headerTitle: 'Senstoria Control Center & Analytics',
      statWaitlistDemand: 'Waitlist Demand',
      thClickId: 'Click ID',
      thSource: 'Source Placement',
      thPerfumeBrand: 'Perfume & Brand',
      thOfficialPrice: 'Official Price',
      thHeatFit: 'Heat Fit',
      crudKicker: 'CATALOG CRUD',
      formNotesTopExample: 'Top Notes (Bergamot, Pink Pepper)',
      formNotesHeartExample: 'Heart Notes (Cardamom, Rose)',
      formNotesBaseExample: 'Base Notes (Cedarwood, Vetiver)',
      headerSubtitle: 'Monitor Shopee/Tokopedia affiliate click conversion, the Scent Finder quiz funnel, the community review moderation queue, catalog management, and feature flag settings.',
      statClicks: 'Total Affiliate Clicks (Counted)',
      statReviews: 'Community Reviews',
      statPendingReviews: '{0} Pending Moderation',
    },
    tryItFirstModal: {
      title: 'Try It First Waitlist',
      subtitle: 'Choose the decant size you are interested in. Email confirmation is required for your interest to count.',
      sizeHeading: 'Choose the decant size you are interested in:',
      sizeLabel2: '2 ml Vial',
      sizeDesc2: '~30 sprays',
      sizeLabel5: '5 ml Decant',
      sizeDesc5: '~75 sprays',
      sizeLabel10: '10 ml Travel',
      sizeDesc10: '~150 sprays',
      emailLabel: 'Email for updates:',
      emailPlaceholder: 'collector@email.com',
      phoneLabel: 'WhatsApp number (+62, optional):',
      notifHeading: 'Notification preference:',
      notifWhatsapp: 'WhatsApp',
      notifEmail: 'Email',
      notifBoth: 'Both',
      submitWaitlist: 'Join Waitlist ({0} ml)',
      submitting: 'Registering…',
      successTitle: 'Request Recorded!',
      successBodyEmail: 'We sent a confirmation link to your email. Click that link for your interest to count as a confirmed request.',
      successBodyNoEmail: 'Your entry is recorded, but the confirmation email could not be sent because the email service is not active yet. This entry does not yet count as confirmed interest.',
      alreadyTitle: 'You Are Already Registered',
      alreadyBody: 'This email is already registered for this perfume and size. Check your email for the confirmation link.',
      errorBody: 'Registration failed. Check your email and size, then try again.',
      errorBackend: 'The waitlist service could not be reached. Try again later.',
      priceNote: 'Prices announced at launch.',
      closeWindow: 'Close Window',
    },
    legalModal: {
      closeAria: 'Close the legal window',
      kicker: 'INDONESIAN REGULATORY & LEGAL COMPLIANCE',
      title: 'Senstoria Legal & Privacy Information Center',
      subtitle: 'Full transparency on personal data protection, editorial integrity without commercial interference, and affiliate disclosure.',
      tabDataRights: 'Data Rights & Export Center',
      tabContact: 'DPO Contact & Help',
      contactDpoTitle: 'Data Protection Officer (DPO)',
      contactDpoName: 'Senstoria Data Protection Officer',
      contactDpoResponse: 'Data request response: maximum 3 x 24 working hours under UU PDP.',
      contactOfficeTitle: 'Office & Correspondence',
      contactOfficeName: 'Senstoria Atelier Indonesia',
      contactOfficeAddress: 'Senopati area, Kebayoran Baru, South Jakarta, DKI Jakarta 12190',
      exporting: 'Exporting...',
      downloadData: 'Download Personal Data (JSON)',
      exportSuccess: 'Your personal data archive has been downloaded to your computer.',
      erasureTitle: 'Account Deletion & Data Erasure Right (Right to Erasure — Article 8, UU PDP)',
      erasureBody: 'This will permanently delete your entire wardrobe bottle collection, daily spray logs, scent stories, Scent Finder quiz answers, and login session. This action is final.',
      deletionSuccess: 'All your data has been destroyed in accordance with the UU PDP. The page will reload...',
      deleteConfirmBefore: 'Type the text ',
      deleteConfirmAfter: ' below to confirm:',
      destroyButton: 'Permanently Destroy Data',
      portabilityTitle: 'Data Portability Right (UU PDP Article 7)',
      portabilityBody: 'Download your profile data, bottle collection, wear logs, scent stories, reviews, quiz preferences, and order history as a structured JSON file.',
      exportIncludesServer: 'When you are signed in, the export includes your Firestore server data; when signed out, only this device\'s data.',
      exportError: 'Export failed. Please try again; your data was not changed.',
      deletionNeedsRelogin: 'Your server data has been deleted ({count} documents). Because your session is old, your login account was not deleted yet: please sign out, sign in again, then repeat the deletion to remove your login account.',
      deletionError: 'Deletion failed. Some data may remain; please try again.',
    },
    legalPage: {
      backHome: '← Back to Home',
      tabPrivacy: 'Privacy Policy',
      tabTerms: 'Terms & Conditions',
      tabAffiliate: 'Affiliate Disclosure',
      tabFaq: 'FAQ',
      privacyTitle: 'Privacy Policy',
      privacyIntro: 'Senstoria complies with Law No. 27 of 2022 on Personal Data Protection (UU PDP). This page explains what data we process, on what basis, and what rights you have.',
      privacyS1H: '1. Data we collect',
      privacyS1B: 'Only data you voluntarily provide for the fragrance curation service: account (email), bottle collection, wear logs, scent stories, reviews, and Scent Finder quiz preferences. We do not sell your data to advertisers.',
      privacyS2H: '2. Legal basis for processing',
      privacyS2B: 'Processing is based on your explicit consent (Article 20 paragraph (2) letter a, UU PDP) when you create an account and tick the consent box on the sign-up form. You may withdraw consent at any time by deleting your account or contacting us.',
      privacyS3H: '3. Data subject rights',
      privacyS3B: 'You have the right to access, correct, and request a portable copy (JSON) of your data through the in-app Data Rights menu, and to request erasure through the DPO contact below.',
      privacyS4H: '4. Storage and security',
      privacyS4B: 'Account data is stored while your account is active. Your Journal (wear logs and scent stories) is private: it is never shown to other users. We do not display your personal data on any public page.',
      privacyS5H: '5. Tracking, Retention & Processing Notes',
      privacyS5B: 'Senstoria uses no third-party trackers (no Google Analytics, Meta Pixel, or similar). The only logging is server-side affiliate clicks — with no user identity — and sanitized error reports: email addresses, tokens, passwords, and secret-bearing URLs are never sent. Account data is kept while the account is active; after deletion, the user\'s Firestore documents and login account are deleted. Exceptions: waitlist entries are hash-keyed and admin-read-only, so waitlist erasure needs a request to dpo@senstoria.id; affiliate clicks are not user-linked, so there is nothing to erase there.',
      termsTitle: 'Terms & Conditions',
      termsIntro: 'Senstoria is an independent fragrance curation platform. Match scores, note pyramids, and performance indexes are compiled from comparative research with no commercial sponsorship from any brand.',
      termsS1H: '1. Review and story standards',
      termsS1B: 'Every review and story must reflect a real wear experience on skin. Spam, hidden promotion, or hate speech is moderated; only approved reviews appear publicly. Scent stories are private and are never shared with other users.',
      termsS2H: '2. Match scores are guidance, not a guarantee',
      termsS2B: "The Finder uses deterministic taste matching across 6 dimensions (notes & family, climate, occasion, longevity, gender expression, budget) with calibration shown in the result as points + adjustment = total score. Scores help you choose; they do not guarantee a fit on every person's skin. Fields the official brand does not state are shown as 'No data', never guessed.",
      termsS3H: '3. Purchases through marketplaces',
      termsS3B: 'Senstoria does not sell perfumes on this site in Stage 1. Buy buttons take you to the official store on Shopee or Tokopedia; price, stock, and purchase terms follow that store.',
      termsS4H: '4. Your account',
      termsS4B: 'You are responsible for keeping your account confidential and for the content you submit. Never share your password with anyone.',
      affiliateTitle: 'Affiliate Disclosure',
      affiliateIntro: 'Some Buy links to Shopee and Tokopedia are affiliate links. This page explains what that means — and what we never do.',
      affiliateS1H: '1. Zero markup',
      affiliateS1B: 'The price you pay at the partner store is the same as that store\'s regular price. Senstoria does not raise prices by a single cent.',
      affiliateS2H: '2. How links work',
      affiliateS2B: 'Buy buttons redirect through the /go endpoint with a 302 redirect to the official product page, via an allowlist of domains (Shopee and Tokopedia). Clicks are logged without personal data for reporting purposes.',
      affiliateS3H: '3. Commission never affects ranking',
      affiliateS3B: 'Affiliate commission — where applicable — never affects Finder scores, catalog order, or recommendations. Rankings always come from taste fit, not from commission.',
      faqTitle: 'Frequently Asked Questions',
      faqIntro: 'Short answers to the questions most often asked about Senstoria.',
      faqQ1: 'What is Senstoria?',
      faqA1: 'A personal fragrance library and discovery tool: store your bottle collection, log wears and scent stories, and discover perfumes through a Scent Finder that explains its reasons.',
      faqQ2: 'How does the Finder score work?',
      faqA2: 'The Finder rates 6 dimensions — notes & family, tropical climate, occasion, longevity, gender expression, and budget — then applies calibration (evidence shrinkage, conflict cap, and ceiling) shown as points + adjustment = total score. It is not a trained AI model; the label is taste matching.',
      faqQ3: "What does 'No data' mean?",
      faqA3: 'The official brand does not state that field, so we show it empty. We never guess notes, family, longevity, or occasion from marketplace listings.',
      faqQ4: 'Is my Journal private?',
      faqA4: 'Yes. Wear logs and scent stories are visible only to you. Reviews are different: a review appears publicly only after moderation approval.',
      faqQ5: 'How does the Try It First waitlist work?',
      faqA5: 'You register your email for one perfume and size (2/5/10 ml). We send a confirmation link to your email; an entry only counts as confirmed interest after you click that link. Prices are announced at launch.',
      faqQ6: 'How do I export or delete my data?',
      faqA6: 'JSON export is available through the in-app Data Rights menu. Account data erasure can be requested via the DPO email (dpo@senstoria.id); full server-side erasure is being prepared for the beta stage.',
      faqQ7: 'Does Senstoria sell perfumes?',
      faqA7: 'Not in Stage 1. For now you buy through official stores on marketplaces via Buy links. Direct sales only open through later metric and legal gates.',
    },
    authModal: {
      titleSignin: 'Sign In to Senstoria',
      titleSignup: 'Create a New Account',
      subtitleSignin: 'Access your fragrance wardrobe and scent diary notes on all your devices.',
      subtitleSignup: 'Sign up to save your fragrance wardrobe and scent diary across devices.',
      tabSignin: 'Email Sign In',
      tabSignup: 'Sign Up',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'At least 6 characters',
      consentPrefix: 'I agree to the ',
      consentMiddle: ' and the ',
      consentSuffix: ' of Senstoria.',
      termsLink: 'Terms of Use',
      privacyLink: 'Privacy Policy',
      submitSignin: 'Sign In',
      submitSignup: 'Register Now',
      authBack: 'Back',
      authSwitchToSignup: "Don't have an account? Sign Up",
      authSwitchToSignin: 'Already have an account? Sign In',
      providerGoogle: 'Sign in with Google',
      providerApple: 'Sign in with Apple',
      providerDivider: 'or',
    },
    buySheet: {
      opsiPembelianRepurchaseResmi: "Official Purchase & Repurchase Options",
      hargaReferensi: "Reference Price:",
      pilihMitraMarketplaceResmi: "Select Official Marketplace Partner:",
      beliResmiDiShopeeMall: "Buy on Shopee Mall",
      beliResmiDiTokopediaOfficial: "Buy on Tokopedia Official",
      cobaSampelDuluDecant: "Try Sample Decant First",
      kamiBisaMenerimaKomisiJikaKamuMembel: "We may earn a commission if you buy through these links. It never changes your match score.",
      originTierLocal: 'Indonesian Artisan',
      originTierGlobal: 'Global Designer',
    },
    catalogView: {
      katalogTerkurasi: "CURATED CATALOG",
      eksplorasiKoleksiParfum: "Explore Fragrance Database",
      menampilkan0DariTotal1Parfum: "Showing {0} of {1} fragrances",
      cariNamaParfumBrandAtauNotesCthBerg: "Search perfume, brand, or notes (e.g. bergamot, oud, HMNS)...",
      semuaAroma: "All Families",
      filterAktif: "Active Filters:",
      hapusSemua: "Clear All",
      filterKatalog: "Catalog Filters",
      sesuaikanKriteriaPencarianParfum: "Refine fragrance search criteria",
      hapus: "Clear",
      tampilkan0Parfum: "Show {0} Perfumes",
      hargaReferensi: "Reference price:",
      sortLabel: 'Sort:',
      sortOptions: [
      { value: 'name-asc', label: 'Name (A–Z)' },
      { value: 'name-desc', label: 'Name (Z–A)' },
      { value: 'brand-asc', label: 'Brand (A–Z)' },
      { value: 'year-desc', label: 'Release Year (Newest)' },
      { value: 'price-asc', label: 'Price (Lowest)' },
      { value: 'price-desc', label: 'Price (Highest)' },
    ],
      priceRanges: [
      { id: 'all', label: 'All Prices' },
      { id: 'under-350', label: '< Rp 350,000' },
      { id: '350-750', label: 'Rp 350k – Rp 750k' },
      { id: '750-1500', label: 'Rp 750k – Rp 1.5m' },
      { id: 'above-1500', label: '> Rp 1,500,000' },
    ],
      originHeading: 'Brand Origin',
      familyHeading: 'Fragrance Family',
      concentrationHeading: 'Concentration',
      brandHeading: 'Specific Brand',
      budgetHeading: 'Budget Range (IDR)',
      originLocal: 'Indonesian Local',
      originIntlChip: 'International',
      originIntlLabel: 'International / Global',
      allBrands: 'All Brands',
      emptyTitle: 'No perfumes match these filters',
      emptyBody: 'Try adjusting your fragrance family combination, tier range, or search keywords.',
      clearAllFilters: 'Clear All Filters',
      toggleWishlistTitle: 'Toggle Wishlist',
      saveToWishlistAria: 'Save to wishlist',
      addToCompareTitle: 'Add to Compare',
      addToCompareAria: 'Add to comparison',
      viewSpecs: 'View Specs',
      historyLabel: 'History:',
    },
    compareTray: {
      bukaKomparasi: "Compare Now",
      trayAria: 'Perfume Comparison Tray',
      removeTitle: 'Remove {0}',
      removeAria: 'Remove {0} from comparison',
      slotLabel: '+ Slot {0}',
    },
    compareView: {
      komparasiSisiKeSisi: "SIDE-BY-SIDE COMPARISON",
      bandingkanKarakterKomposisiKetahanan: "Compare Scents, Performance & Value",
      dari3SlotParfumAktif: "of 3 perfume slots active",
      notesSamaTerdeteksi: "shared notes detected",
      modeSorotPerbedaanAktif: "✓ Highlight Differences Active",
      sorotPerbedaanSaja: "Highlight Differences",
      tambahParfum: "Add Perfume",
      bandingkanParfum: "Compare perfumes",
      geserTabelUntukMelihatRincian: "Swipe table to view details",
      kesesuaianIklimPanas: "Heat Suitability",
      sangatCocokCuacaPanas: "Ideal for tropical heat",
      cocokRuangAcMalam: "Best in AC / evenings",
      hargaNilaiMl: "Price & Value / ml",
      pilihParfumUntukDibandingkan: "Select Perfume to Compare",
      bandingkanPiramidaAromaSpesifikasiMaks: "Compare notes pyramid & specs (max 3)",
      cariNamaAtauBrandParfum: "Search perfume name or brand...",
      tidakAdaParfumYangCocok: "No fragrances found.",
      tutup: "Close",
      buyOnShopee: 'Buy on Shopee',
      buyOnTokopedia: 'Buy on Tokopedia',
      originTierHeading: 'Brand Origin & Tier',
      longevityProjectionHeading: 'Longevity & Projection',
      shoppingActionsHeading: 'Shop & Try Actions',
      highlightNotesLabel: '★ Note Highlights:',
      sharedNoteLabel: '★ Shared note',
      removeTitle: 'Remove',
      addSlotButton: '+ Add Slot {0}',
      highlightNotesExplanation: 'Indicates fragrance notes shared by all perfumes you are comparing ({0}).',
      perBottleSize: 'Per {0}ml bottle',
    },
    libraryView: {
      koleksiPribadi: "PERSONAL SHELF & WARDROBE",
      lemariWewangianScentDna: "Fragrance Library & Scent DNA",
      botolAktif: "active bottles",
      favorit: "favorites",
      valuasiKoleksi: "Total Value",
      tambahBotolKeLemari: "Add Bottle to Shelf",
      sedangDipakai: "Currently Wearing",
      inginDicobaWishlist: "Want to Try",
      favorit2: "Favorites",
      kenanganBotolHabis: "Memories & Empties",
      dashboardScentDna: "Scent DNA Analysis",
      botolAktifYangSaatIniTersediaDiMeja: "Active bottles in your current fragrance rotation. Tap \"Log Wear\" to automatically track bottle level depletion.",
      bukaBukuHarianCerita: "Open Scent Diary & Journal →",
      menipis20: "Low (≤20%)",
      dipakai: "worn",
      editVolume: "Edit volume",
      wewangianYangMenarikMinatmuDanInginK: "Fragrances you have bookmarked to test, sample, or purchase in the future. Wishlist items are not owned and do not count as collection bottles.",
      hapusDariWishlist: "Remove from wishlist",
      sudahPunyaPindahKeLemari: "Add to Collection",
      cobaDulu: "Try First",
      lihatDetail: "View Detail",
      wewangianYangMenjadiIdentitasKhasDan: "Fragrances marked as your signature favourites, carrying higher weight in your Scent DNA.",
      aromaKhasYangSelaluMemberiRasaTenang: "A signature companion that brings effortless presence and calm throughout the day.",
      catatanDiary: "Why I love it",
      arsipBotolYangTelahKosongAtauAromaM: "Emptied bottles and archived fragrance memories preserving your personal olfactory journey.",
      habis0Ml: "Empty (0 ml)",
      telahDisemprotSebanyak0KaliSelamaMen: "Worn {0} times throughout your fragrance journey.",
      profilScentDnaMembutuhkanMinimal3Par: "Scent DNA Requires at Least 3 Fragrances",
      tambahkanMinimal3ParfumKeLemarimuUnt: "Add at least 3 fragrances to your library to generate an accurate personal olfactory taste profile.",
      profilDnaAromaPribadi: "Personal Scent DNA Profile",
      karakterUtama0Devotee: "Primary Accord: {0} Devotee",
      memuatVisualisasiRadar: "Loading radar visualization...",
      kesesuaianIklimTropisIndonesia: "Indonesian Tropical Climate Suitability",
      siangTerikOutdoorTropis: "Tropical Daytime Outdoor",
      ruangBerAcSeharianKantor: "All-Day Air-Conditioned Office",
      malamHariCuacaHujan: "Evenings & Rain",
      totalVolumeTersisa: "Total Volume Remaining:",
      rataRataSisaIsiBotol: "Average Bottle Fill:",
      totalNilaiKoleksi: "Total Collection Value:",
      tambahParfumKeLemarimu: "Add Perfume to Library",
      kurasiKoleksiBotolParfumPersonalmu: "Add fragrance to your personal shelf",
      pilihDariKatalog0Kurasi: "Select from Catalog ({0} Curated)",
      pilihUkuranBotolMl: "Select Bottle Size (ml)",
      ukuranPenuhMl: "Full Size (ml)",
      editVolumeSisaBotol: "Update Bottle Level",
      perbaruiSisaVolumeCairanBotolParfum: "Adjust remaining volume in ml",
      favoriteToggleTitle: 'Toggle Favorite',
      saveToFavoriteAria: 'Save to favorites',
      favoriteBadgeAria: 'Favorite',
      dnaMatchBadge: 'MATCHES YOUR DNA',
      openDetails: 'Open Details →',
      chooseCatalogData: 'Choose Catalog Curated Data Only →',
      remainingLiquidLabel: 'Current Remaining Liquid (ml)',
      fullSizeLabel: 'Full Size: {0} ml',
      percentRemaining: 'remaining',
      saveBottleToWardrobe: 'Save Bottle to Wardrobe',
      dnaRecsHeading: 'Curated Perfume Recommendations for Your Scent DNA',
      dnaRecsSubtitle: 'Chosen from the catalog for harmony with your {0} scent and favourite note pyramid',
      searchCatalogLabel: 'Search Perfumes in Catalog',
      brandNameLabel: 'Brand Name',
      variantNameLabel: 'Perfume Variant Name',
      duplicateNotice: 'This perfume is already in our curated catalog with verified note data.',
      initialStatusLabel: 'Initial Status',
      markFavoriteLabel: 'Mark as Favorite Perfume',
      makeFavoriteLabel: 'Make Favorite Perfume',
      deleteBottleLabel: 'Delete Bottle',
      searchPlaceholder: 'Type a name or brand (e.g. HMNS, Oullu)...',
      brandExamplePlaceholder: 'Example: Le Labo, HMNS, or a local artisan',
      variantExamplePlaceholder: 'Example: Santal 33, Orgasm, Vanilla Mist',
    },
    logWear: {
      catatPemakaianAromaLogWear: "Log Fragrance Wear",
      kurangkanCairanBotolLacakKebiasaanSem: "Record sprays and track your daily scent",
      pemakaianBerhasilDicatat: "Wear Logged Successfully!",
      dikurangkanDariBotolmu: "decremented from bottle.",
      belumAdaBotolAktifDiLemarimuSilakan: "No active bottles in your library. Please add a bottle first.",
      pilihBotolDariLemarimu: "Select Perfume Bottle",
      jumlahSemprotan: "Number of Sprays",
      konteksAcaraPemakaian: "Occasion",
      suasanaHatiMood: "Mood",
      cuacaSaatDipakai: "Weather",
      mendapatPujianDariOrangLainHariIni: "Received a compliment today",
      catatanSingkatOpsional: "Quick Note (Optional)",
      cthDisemprotDiKemejaPutihTahan6Jam: "E.g. Sprayed on white shirt, lasted 6 hours...",
      simpanCatatanPemakaian: "Save Wear Log",
      decreaseSprays: 'Decrease sprays',
      increaseSprays: 'Add sprays',
    },
    lowBottle: {
      statusSisaBotolParfum: "Low bottle status",
      cobaSampel: "Try It First",
      tandaiHabis: "Mark as finished",
    },
    productDetail: {
      kembaliKeKatalog: "Back to Catalog",
      kurasiIndependenSenstoria: "Independent Senstoria Curation",
      piramidaAroma: "SCENT PYRAMID",
      strukturKomposisiNotesTigaBaris: "Three-Row Composition Structure",
      validasiKomunitas: "COMMUNITY VALIDATION",
      ulasanPemakaiNyataVsKlaimResmiBrand: "Real Wearers vs Official Claims",
      klaimResmiBrand: "Official Brand Claims",
      helpfulCount: "{0} people found this helpful",
      sumberMateriPeluncuranResmiBrand: "Source: Official brand launch material",
      dataPemakaiSenstoria: "Senstoria Wearer Data",
      ulasanKomunitas: "community reviews",
      ketahananNyataKulit: "Real skin longevity:",
      proyeksiAroma: "Sillage projection:",
      bersediaMembeliBotolPenuhKembali: "would repurchase full bottle",
      belumCukupUlasan: "Not enough reviews yet",
      memerlukanMinimal5UlasanTerpublikasiU: "Requires at least 5 published reviews to calculate community consensus aggregates.",
      evaluasiKomunitasIndependen: "COMMUNITY EVALUATION",
      ulasanMultiKriteriaCeritaAroma: "Community Reviews & Scent Stories",
      dataKetahananNyataKulitJejakAromaDan: "Real skin wear, longevity consensus, and repurchase data from Senstoria community wearers.",
      tulisCerita: "Write Story",
      tulisUlasanParfumIni: "Write Review",
      rataRataKomunitas: "Average Rating",
      ulasan: "reviews",
      ketahananKulit: "Skin Longevity",
      konsensusIklimTropis: "Tropical consensus",
      jejakAromaSillage: "Sillage Projection",
      ramahRuangTertutupAc: "Indoor friendly",
      niatBeliUlang: "Repurchase Rate",
      pastiBeliLagi: "Would Repurchase",
      tingkatKepuasanTinggi: "High satisfaction rate",
      ulasanPengguna0: "USER REVIEWS ({0})",
      belumAdaUlasanTerperinciUntukWewangia: "No detailed reviews yet. Be the first to share your wear experience!",
      tulisUlasanPertama: "Write First Review",
      aromaSerupaDalamKeluarga0: "Similar Scents in {0}",
      lihatSemuaDiKatalog: "View All in Catalog →",
      inWishlist: 'In Wishlist',
      addWishlist: 'Add to Wishlist',
      inComparison: 'In Comparison',
      compareAction: 'Compare',
      shareScentTitle: 'Share Scent',
      tropicalClimate: 'Tropical Climate',
      heatScore: 'Score {0} / 5',
      buyShopeeMall: 'Buy on Shopee Mall',
      buyTokopediaOfficial: 'Buy on Tokopedia Official',
      repurchaseLabel: 'Repurchase:',
      repurchaseYes: 'Definitely Buy',
      repurchaseMaybe: 'Maybe',
      formatLabel: 'Format:',
      fullBottle: 'Full Bottle',
      decantFormat: 'Decant',
      addBottleTitle: 'Add {0} to Wardrobe',
      addBottleSubtitle: 'Record bottle volume, remaining liquid, and purchase price to calculate Scent DNA statistics',
      bottleAddedTitle: '✓ Bottle Successfully Added!',
      bottleAddedBody: 'Saved to your wardrobe collection shelf.',
      saveBottle: 'Save Bottle',
      shareScentHeading: 'SHARE SCENT',
      promoFreeNote: 'Free of paid promotion. We accept no payment to change this fragrance\u2019s score or ranking.',
      durabilityLabel: 'Longevity',
      projectionLabel: 'Projection / Sillage',
      tropicalGuideHeading: 'Wearing Guide for Indonesia\u2019s Tropical Climate',
      iklimTanpaData: 'No data',
      climateOutdoor: 'Outdoor / Daytime',
      climateOutdoorTip: 'Use 2–3 sprays on chest and nape pulse points so it does not turn heavy as you sweat.',
      climateOffice: 'Air-Conditioned Room / Office',
      climateOfficeTip: 'Enclosed-room-friendly sillage; the scent lasts softly 6–8 hours without distracting colleagues.',
      climateNight: 'Evening & Rainy Weather',
      climateNightTip: 'Woody and spicy base notes grow richer and warmer; spray on cotton clothing for extra longevity.',
      buyViaPartners: 'Buy Officially Through Trusted Marketplace Partners:',
      addToWardrobe: 'Add to My Wardrobe',
      reviewSillageLabel: 'Sillage:',
      furtherExploration: 'FURTHER EXPLORATION',
      bottleStatusLabel: 'Bottle Status',
      linkCopied: 'Link Copied!',
      copyLinkSummary: 'Copy Link & Scent Summary',
      shareWhatsApp: 'Share to WhatsApp',
      prosLabel: '+ Pros:',
      consLabel: '- Cons:',
      projectionLevel: 'Level {0} / 4',
      pyramidBaseDuration: '3+ hrs (Lasting Trail)',
      pyramidHeartDuration: '15 min – 3 hrs (Main Character)',
      pyramidTopDuration: '0–15 min (First Impression)',
      pyramidTopLabel: 'Top Notes',
      pyramidHeartLabel: 'Heart Notes',
      pyramidBaseLabel: 'Base Notes',
      shareButton: 'Share',
    },
    review: {
      tulisUlasanParfumKomunitas: "Write Fragrance Review",
      bantuSesamaPecintaAromaDenganDataPem: "Share real skin wear evaluation",
      ulasanMultiKriteriaTerverifikasi: "MULTI-CRITERIA VERIFIED REVIEW",
      ulasanBerhasilDipublikasikan: "Review Successfully Published!",
      terimaKasihAtasKontribusiObjektifmuUn: "Thank you for your valuable objective review.",
      parfumYangDiulas: "Selected Fragrance",
      skorKeseluruhanRating: "Overall Rating",
      luarBiasaMasterpiece: "Masterpiece",
      sangatBagus: "Very Good",
      lumayanStandar: "Average",
      diBawahEkspektasi: "Below Expectation",
      mengecewakan: "Disappointing",
      dayaTahanNyataKulitLongevity: "Real Skin Longevity",
      jejakAromaSillageProyeksi: "Sillage & Projection",
      formatYangKamuPakai: "Format Used",
      botolPenuhFullBottle: "Full Bottle",
      decantTravelSize510Ml: "Decant (5–10 ml)",
      sampleVial12Ml: "Sample Vial (1–2 ml)",
      niatBeliUlang: "Repurchase Intent",
      judulUlasan: "Review Headline",
      ringkasanKesanUtamamuMisalGurihDanHa: "Headline summary",
      ulasanLengkapWajib: "Review Details (Required)",
      ceritakanEvolusiAromaDariTopNotesHin: "Describe how the scent opens, evolves, and wears on your skin...",
      kelebihanPisahkanDenganKoma: "+ Pros (Comma separated)",
      kekuranganPisahkanDenganKoma: "- Cons (Comma separated)",
      kebijakanIntegritasUlasanmuAkanTerbit: "Integrity Policy: Your review will be published without commercial influence.",
      batal: "Cancel",
      kirimUlasanSekarang: "Submit Review",
      prosExamplePlaceholder: 'Office-friendly scent, sturdy bottle, lots of compliments',
      consExamplePlaceholder: 'Too sweet for hot midday, sprayer a bit stiff',
    },
    diaryView: {
      catatanAroma: "Scent Memory",
      bukuHarianAromaMemori: "Scent Diary & Journal",
      bukuHarianSemprotCeritaAroma: "Scent Diary & Memory Stories",
      catatSemprotan1TapOtomatisMengurangi: "Log daily wears with 1-tap auto volume decrement, craft scent memories with draft autosaving, and contribute honest multi-criteria evaluations.",
      tulisCerita: "Pen Story",
      helpfulCount: "Helpful ({0})",
      tulisUlasanBaru: "Write Review",
      botolAktifDiLemari: "active bottles",
      pujianDiterima: "Compliments",
      pencatatanSpontan: "Spontaneous compliments",
      rotasiTeratas: "Top Signature",
      ceritaTersimpan: "Stories Penned",
      n1LogPemakaianHarian: "1. Daily Wear Logs",
      n2CeritaAromaMemori: "2. Scent Stories & Memories",
      n3UlasanMultiKriteria: "3. Multi-Criteria Reviews",
      cariDiBukuHarianCerita: "Search diary and stories...",
      semuaParfum: "All Fragrances",
      aksiCepatPemakaian: "Quick Wear Logger",
      catatSemprotanHariIni: "Log Today's Scent",
      belumAdaBotolAktifDiLemariKoleksimu: "No active bottles in your library. Add a bottle to start logging wears.",
      bukaLemariKoleksi: "Open Library",
      semprotanBerhasilDicatatKeBukuHarian: "Wear logged! Volume automatically decremented.",
      pilihBotolYangDipakai: "Select Bottle",
      jumlahSemprotan: "Sprays Count",
      konteksAcara: "Occasion",
      cuacaRuangan: "Weather / Setting",
      dapatPujianCompliment1: "Got a compliment (+1)",
      catatanSingkatOpsionalMisalAromanyaTe: "Quick note (optional)",
      simpanKeBukuHarian05Ml: "Save to Diary (-0.5 ml)",
      riwayatSemprotTerkini: "Recent Wear History",
      belumAdaCatatanPemakaianYangCocokDen: "No wear logs matching your filter.",
      jadikanCerita: "Pen Story",
      bukaEditorDraft: "Open Draft →",
      abadikanMemoriCeritaAromamu: "Capture Your Scent Memories",
      aromaMemilikiKaitanPalingEratDenganM: "Fragrances are deeply intertwined with emotion and memory. Craft your personal olfactory memoir with real-time draft autosaving.",
      mulaiMenulisCerita: "Write Scent Story",
      pembuatCeritaAroma: "Scent Story Publisher",
      tulisCatatanMemoriOlfaktif: "Pen Scent Story",
      menyimpan: "Saving…",
      tersimpan: "Saved",
      parfumYangTerikatCeritaIni: "Fragrance Subject",
      judulCerita: "Story Title",
      contohHujanSoreDiKemangHangatnyaVani: "Story title",
      suasanaHati: "Mood",
      konteksAcara2: "Occasion",
      cuacaTempat: "Weather",
      kisahNarasiMemori: "Story Narrative",
      ceritakanSuasanaHariItuSiapaYangAda: "Narrate your memory...",
      tagMomenPisahkanKoma: "Tags (Comma separated)",
      buangDraft: "Discard Draft",
      publikasikanCerita: "Publish Story",
      linimasaCeritaMemoriAroma: "Scent Memory Timeline",
      belumAdaCeritaYangCocokDenganFilter: "No scent stories found.",
      evaluasiKomunitasIndependen: "Independent Reviews",
      ulasanMultiKriteriaTerverifikasi: "Multi-Criteria Reviews Hub",
      bebasSponsorKomersialDataKetahananNya: "Zero commercial bias. Real longevity, projection, and repurchase data from verified wearers.",
      belumAdaUlasanYangSesuaiDenganFilter: "No reviews match your filter.",
      catatSemprotanHariIni2: "Log Today's Wear",
          defaultStoryTitle: "Today’s Scent",
      storyLengthHint: "{0} characters (minimum 20 characters to publish)",
      deleteLogTitle: "Delete log",
      noDataYet: 'No data yet',
      wearLogCount: '{0} wear logs',
      storyCount: '{0} stories',
      reviewCount: '{0} reviews',
      deleteStoryTitle: 'Delete story',
      repurchaseLabel: 'Repurchase',
      repurchaseYes: '✓ Definitely Repurchase',
      repurchaseMaybe: 'Maybe',
      usageFormatLabel: 'Usage Format',
      fullBottle: 'Full Bottle',
      decantSample: 'Decant / Sample',
      prosLabel: '+ Pros:',
      consLabel: '- Cons:',
      skinLongevityLabel: 'Skin Longevity',
      quickLogHint: '-0.5 ml per log · 8-second undo',
      privateBadge: 'Private',
      tagPlaceholder: 'Kemang, Rain, Dusk, Date, Nostalgia',
},
    scentDna: {
      dataProfilScentDnaTidakValid: "Invalid Scent DNA profile data",
      distribusiKeluargaOlfaktifTidakDapatD: "Olfactive family distribution cannot be rendered because proportions are inconsistent (shares cannot be negative and must sum to exactly 100%).",
      dominasiScentDna: "Scent DNA Dominance",
      parfum: "perfumes",
      tambahkanMinimal3ParfumKeLemarimuUnt: "Add at least 3 fragrances to your library to activate Scent DNA analysis.",
      jelajahiKatalog: "Browse Catalog →",
      distribusiKeluargaOlfaktif: "Olfactive Family Distribution",
      lihatSebagaiTabelData: "View as data table",
      lihatSebagaiGrafikBatang: "View as bar chart",
      lihatTabel: "View as table",
      lihatGrafik: "View as chart",
      petaPoligonRadarPandanganSekunder: "Radar Polygon View (Secondary)",
      tabelDistribusiKeluargaScentDna: "Scent DNA Distribution Table",
      proporsi: "Share (%)",
      total: "Total",
      berdasarkan0Parfum: "Based on {0} perfumes",
      notesDominan: "Dominant notes: ",
      radarStyleCaption: 'Monochrome · 12% Fill',
    },
    finderView: {
      penikmatKebebasanAroma: "The Open Scent Explorer",
      kamuMemilikiHidungYangAdaptifDanSiap: "You possess an adaptable nose ready to explore across different olfactive families without prejudice.",
      penjelajahHutanHujanAlamSegar: "The Verdant & Forest Voyager",
      keseimbanganAntaraKesegaranSitrusYang: "Invigorating citrus freshness grounded in peaceful cedarwood and vetiver depths.",
      pencintaKehangatanSenjaNuansaManis: "The Twilight & Gourmand Connoisseur",
      aromaVanilaRempahEksotisDanResinHang: "Rich vanilla, comforting spices, and warm ambery resins grant you an inviting and magnetic presence.",
      pencintaHarmoniBotaniRomansaElegan: "The Botanical & Floral Romantic",
      kelopakMawarMelatiLembutDanPeonyMemb: "Sophisticated florals like tea roses, night jasmine, and peonies provide a timelessly graceful aura.",
      pencariKetenanganHerbalTehKontemporer: "The Zen & Aromatic Purist",
      lavenderSageTehHijauDanRempahSejukM: "Lavender, sage, green tea, and cool herbs provide unwavering focus, serenity, and crystalline poise.",
      kuratorAromaPersonal: "The Discerning Scent Curator",
      preferensimuMencerminkanPemilihanWewang: "Your preferences reflect a thoughtful selection tailored to mood, occasion, and tropical climate conditions.",
      ringkasanTasteProfileDisalinKePapanK: "Taste profile copied to clipboard!",
      tasteProfileBerhasilDisimpanKeProfil: "Taste profile saved to your account!",
      scentFinder6Dimensi: "6-Dimension Scent Finder",
      menghitungKecocokanAromamu: "Calculating Your Matches...",
      mencocokkanPreferensiDenganProfilWewan: "Matching preferences with objective fragrance profiles",
      kurasiTerkalibrasiSkor60: "Calibrated Curation (Score < 60%)",
      belumAdaKecocokanKuat: "No Strong Match Yet",
      kombinasiParameterYangSangatKetatMisa: "Highly strict parameter combinations (such as strict budget bounds paired with extreme longevity expectations or multiple avoided notes) limit fragrances meeting Senstoria’s curation threshold.",
      faktorPembatasTeridentifikasi: "Identified Limiting Factors:",
      sertakanParfumYangDimiliki: "Include Owned Perfumes",
      sesuaikanJawabanKuis: "Adjust Quiz Answers",
      hasilScentFinder6Dimensi: "6-Dimension Scent Finder Results",
      kurasiWewangianYangSungguhCocok: "Personalized Fragrance Matches",
      dihitungSecaraDeterministikBerdasarkan: "Calculated deterministically using objective 6-dimension taste matching against official perfume profiles. Free of commercial bias.",
      sertakanParfumYangSayaMiliki: "Include perfumes I own",
      hanyaBrandLokal: "✓ Local Brands Only",
      semuaAsalBrand: "All Brand Origins",
      ubahPreferensi: "Retake Quiz",
      profilSeleraAroma: "Taste Profile Archetype",
      pencintaAroma: "Fragrance Enthusiast",
      tersalin: "Copied!",
      salinProfil: "Copy Profile",
      tersimpan: "Saved!",
      simpanKeAkun: "Save to Profile",
      rekomendasiUtama: "Top Recommendation",
      kecocokanSangatTinggi: "Very High Match",
      kecocokanBagus: "Good Match",
      rincian6DimensiKecocokanScoringBreakd: "6-Dimension Match Breakdown:",
      jumlahPoinDimensiSamaPersisDenganSko: "Dimension points + adjustment = total score",
      penyesuaianBuktiKalibrasiAdjustment: "Calibration Adjustment:",
      karakterPiramidaNotes: "Notes Pyramid Character:",
      mengapaCocokUntukmuGroundedEvidence: "Why It Fits Your Profile",
      kemungkinanKurangCocokWeakestDimension: "Possible Mismatch (Weakest Dimension)",
      catatanIniDihitungSecaraDinamisDariD: "Computed dynamically from the lowest-scoring dimension to safeguard against blind-buy disappointment.",
      diWishlist: "Wishlisted",
      simpanWishlist: "Add to Wishlist",
      diKomparasi: "Compared",
      cobaSampleDulu: "Try Sample First",
      lihatDetailSpecs: "View Full Specs",
      beliResmiDiShopeeMall: "Buy Official on Shopee",
      alternatifTerkualifikasi: "Qualified Alternatives",
      pilihanAlternatifYangMemenuhiStandar: "Qualified Alternative Recommendations",
      disesuaikanDenganPreferensiBelanjaSpes: "Tailored to shopping intent",
      kurasiAlternatif: "Alternative Selections",
      koleksiRekomendasiTeratasLainnya: "Other Highly Matched Fragrances",
      pilihan: "Rank",
      tutupRincian6d: "▲ Hide 6D Breakdown",
      rincianSkor6Dimensi: "▼ 6D Match Breakdown",
      pertanyaan0Dari7: "Question {0} of 7",
      keluargaAromaApaYangPalingMenarikBag: "Which scent families appeal to you most?",
      pilihSatuAtauLebihKategoriAtauPilih: "Select one or more, or choose \"Not Sure\" for open exploration.",
      diManaKamuPalingSeringMemakaiParfum: "Where will you wear this fragrance most?",
      suhuDanKelembapanIndonesiaSangatMemen: "Tropical humidity strongly dictates perfume performance.",
      untukMomenApaKamuMencariParfumIni: "What occasion are you shopping for?",
      mencocokkanKesantunanProyeksiDanKonsen: "Matches occasions stated by the brand for this perfume.",
      berapaLamaKetahananAromaYangKamuButu: "How long should the scent last?",
      ekspektasiRealistisMembantuMencocokkan: "Helps match EDT, EDP, or Extrait concentrations.",
      apaPreferensiEkspresiGenderUntukAroma: "What is your gender expression preference?",
      membantuMenyaringNuansaAromaMaskulinF: "Helps focus on masculine, feminine, or universal unisex facets.",
      berapaRentangAnggaranYangKamuSiapkan: "What is your budget tier?",
      senstoriaMenampilkanHargaReferensiResm: "Official transparent reference pricing.",
      adakahKarakteristikAromaYangInginKamu: "Any notes or traits you want to avoid?",
      karakteristikYangDipilihAkanDiberiPen: "Selected traits receive a penalty to prevent blind-buy regret.",
      lewatiKuisLihatHasil: "Skip Quiz & View Results",
      selesaiHitungRekomendasi: "Finish & Calculate Matches",
      pertanyaanBerikutnya: "Next Question",
      climateLabel: 'Climate:',
      climateOutdoor: 'Tropical Outdoors',
      climateIndoor: 'Air-Conditioned Room',
      climateEvening: 'Evening / Cold Weather',
      flexible: 'Flexible',
      occasionLabel: 'Occasion:',
      occasionOffice: 'Office / Daily',
      occasionDating: 'Dating / Casual',
      occasionFormal: 'Party / Formal',
      occasionSport: 'Sports',
      longevityLabel: 'Longevity:',
      longevityLight: '3–5 Hours',
      longevityModerate: '6–8 Hours',
      longevityLong: '8–12+ Hours',
      budgetLabel: 'Budget:',
      noDataFit: 'No Data',
      anyFit: 'Any',
      saveWishlistTitle: 'Save to Wishlist',
      detailSpecs: 'Detail Specs →',
      matchScore: 'Match Score',
      adjustmentLabel: 'Adjustment:',
      dimensionFitLabel: 'Dimension fit',
      fitExplanation: 'Dimension points + adjustment = total score. % shows dimension fit, not a points derivative.',
      savedAnswersNote: 'Saved answers from a previous visit were loaded. Press Start over to delete them.',
      savedAnswersWarning: 'These results use saved answers from a previous visit.',
      startOver: 'Start over',
      skippedRunNote: 'These results use Flexible/Free defaults (quiz skipped), not saved answers.',
      noAdjustmentNote: 'No adjustment: dimension points already equal the total score.',
      budgetConstraintNote: 'A budget under Rp 250,000 limits availability of high Extrait/EDP concentrations.',
      avoidancePenaltyNote: 'Avoided notes ({0} filters) trigger a scoring penalty.',
      ownedExcludedNote: '{0} perfumes in your Library are currently excluded from search results.',
      longevityTip: 'An 8+ hour longevity target generally requires heavier ambery/woody base notes.',
      calibrationCapNote: '(Calibration cap max 96%)',
      runnersUpCount: '{0} fragrances with high match scores',
      radarCaption: 'Family mix of the perfumes shown above, calculated from the current Finder results.',
      loadingRadar: 'Loading radar visualization…',
      pyramidTopShort: 'Top:',
      pyramidHeartShort: 'Heart:',
      pyramidBaseShort: 'Base:',
    },
    tryItFirstView: {
      kicker: 'TRY IT FIRST · WAITLIST',
      title: 'Try Before You Decide',
      subtitle: 'Register your interest for 2 ml, 5 ml, or 10 ml decants from catalog perfumes. Email confirmation is required for your interest to count.',
      pillar1Title: 'Register Interest',
      pillar1Body: 'Choose the perfume and decant size you are interested in.',
      pillar2Title: 'Confirm by Email',
      pillar2Body: 'Click the confirmation link in your email for your interest to count.',
      pillar3Title: 'News When a Batch Opens',
      pillar3Body: 'We notify you through your registered contact when a batch opens.',
      publishedCount: '{0} perfumes open for the waitlist',
      emptyCatalog: 'No published perfumes are open for the waitlist yet.',
      notesLabel: 'Key notes:',
      priceNote: 'Prices announced at launch.',
      detailButton: 'View Detail',
      joinButton: 'Join Waitlist',
    },

    finderQuiz: {
      steps: [
        {
          "kicker": "Dimension 1: Notes & Family (25 Points Weight)",
          "options": [
            {
              "id": "Woody",
              "label": "Woody (Wood & Forest)",
              "desc": "Sandalwood, cedarwood, warm vetiver, calm & commanding."
            },
            {
              "id": "Fresh",
              "label": "Fresh / Citrus & Aquatic",
              "desc": "Bergamot, fresh citrus, sea air, clean & energizing."
            },
            {
              "id": "Floral",
              "label": "Floral (Flower Petals)",
              "desc": "Rose, jasmine, peony, graceful, romantic & friendly."
            },
            {
              "id": "Gourmand",
              "label": "Gourmand (Sweet & Delicious)",
              "desc": "Vanilla, caramel, coffee, almond, delicious & tempting."
            },
            {
              "id": "Ambery",
              "label": "Ambery / Spiced Oriental",
              "desc": "Ambery resins, cardamom, cinnamon, warm & exotic."
            },
            {
              "id": "Aromatic",
              "label": "Aromatic & Herbal",
              "desc": "Lavender, sage, mint, green tea, cool & calming."
            },
            {
              "id": "not_sure",
              "label": "Not Sure / Open",
              "desc": "Recommend the best scent without family constraints."
            }
          ]
        },
        {
          "kicker": "Dimension 2: Tropical Climate (20 Points Weight)",
          "options": [
            {
              "id": "outdoor_hot",
              "label": "Outdoor / Hot Tropical Midday",
              "desc": "A sweat-resistant formula that stays comfortable under harsh sun."
            },
            {
              "id": "indoor_ac",
              "label": "Air-Conditioned Room All Day (Office / Campus)",
              "desc": "Stable, cool temperature — suits a polite, moderate-projection scent."
            },
            {
              "id": "evening_cool",
              "label": "Evening / Dates & Cool Weather",
              "desc": "Suits sweeter, deeper, warmer scents with a stronger trail."
            },
            {
              "id": "flexible",
              "label": "Flexible / Versatile for Any Situation",
              "desc": "An adaptive scent that transitions smoothly from office mornings to relaxed evenings."
            }
          ]
        },
        {
          "kicker": "Dimension 3: Occasion & Setting (20 Points Weight)",
          "options": [
            {
              "id": "daily_office",
              "label": "Workspace / Daily Office & Campus",
              "desc": "Neat, polite, clean, and never invading colleagues’ personal space."
            },
            {
              "id": "casual_dating",
              "label": "Dates, Casual Hangouts & Afternoon/Evening",
              "desc": "An alluring, intimate, friendly scent with magnetic appeal."
            },
            {
              "id": "formal_evening",
              "label": "Parties, Galas & Formal Special Moments",
              "desc": "Rich concentration, bold character, radiating elegant authority."
            },
            {
              "id": "outdoor_sport",
              "label": "Sports & Active Outdoor Activities",
              "desc": "A fresh, energetic scent that stays clean even mixed with sweat."
            },
            {
              "id": "flexible",
              "label": "Flexible / Versatile for Any Moment",
              "desc": "No limiting data — find a fragrance that adapts across situations."
            }
          ]
        },
        {
          "kicker": "Dimension 4: Skin Longevity (15 Points Weight)",
          "options": [
            {
              "id": "light",
              "label": "3–5 Hours (Light & Quick to Switch)",
              "desc": "Suits sports or relaxing without committing to a scent all day."
            },
            {
              "id": "moderate",
              "label": "6–8 Hours (Standard Full Workday)",
              "desc": "Spray in the morning and it still lingers until the afternoon commute home."
            },
            {
              "id": "long",
              "label": "8–12+ Hours (Extra-Long Staying Power)",
              "desc": "A rich concentration that lasts into the night, even after a shower."
            },
            {
              "id": "not_sure",
              "label": "Not Sure / Flexible",
              "desc": "Focus on the beauty of the scent; I’m happy to re-spray if needed."
            }
          ]
        },
        {
          "kicker": "Dimension 5: Gender Expression (10 Points Weight)",
          "options": [
            {
              "id": "unisex",
              "label": "Neutral / Unisex (Universal Scent)",
              "desc": "A modern balance without gender barriers, effortlessly worn by anyone."
            },
            {
              "id": "masculine",
              "label": "Masculine (Bold, Fresh Woody or Spiced Scent)",
              "desc": "Dominated by woody, vetiver, sharp citrus, or commanding aromatic nuances."
            },
            {
              "id": "feminine",
              "label": "Feminine (Sweet, Graceful Floral or Fruity Scent)",
              "desc": "Dominated by rose petals, jasmine, fresh sweet fruit, or soft vanilla."
            },
            {
              "id": "any",
              "label": "Open / No Gender Limits",
              "desc": "Focus on the beauty of the composition without limiting gender labels."
            }
          ]
        },
        {
          "kicker": "Dimension 6: Budget Fit (10 Points Weight)",
          "options": [
            {
              "id": "budget",
              "label": "Affordable (< Rp 250,000)",
              "desc": "High-value budget picks for relaxed daily wear."
            },
            {
              "id": "mid",
              "label": "Mid-Range (Rp 250,000 – Rp 600,000)",
              "desc": "The most popular meeting point of local artisanal quality and entry-level designers."
            },
            {
              "id": "premium",
              "label": "Premium / Niche (> Rp 600,000)",
              "desc": "Rare, high-quality raw materials, independent artisans, and luxury designers."
            },
            {
              "id": "flexible",
              "label": "Flexible / Any Price Range",
              "desc": "Recommend whatever fits my nose and taste."
            }
          ]
        },
        {
          "kicker": "Restrictions & Scoring Penalty (-20 Points)",
          "options": [
            {
              "id": "overly_sweet",
              "label": "Overly Sweet / Cloying Gourmand",
              "desc": "Avoid thick caramel or sugary scents that feel dizzying in hot weather."
            },
            {
              "id": "heavy_smoke_oud",
              "label": "Heavy Smoke / Incense & Strong Oud",
              "desc": "Avoid dense burnt-wood, heavy incense resin, or piercing dark scents."
            },
            {
              "id": "sharp_white_floral",
              "label": "Sharp White Floral (Strong Tuberose / Jasmine)",
              "desc": "Avoid tuberose or jasmine that smells too sharp on the nose."
            },
            {
              "id": "none",
              "label": "No Restrictions (I’m Open to Trying Everything)",
              "desc": "No penalty — full exploration of the entire fragrance spectrum."
            }
          ]
        }
      ]
    },

    diaryOptions: {
      "moods": [
        {
          "value": "Percaya Diri",
          "label": "Confident"
        },
        {
          "value": "Santai & Tenang",
          "label": "Relaxed & Calm"
        },
        {
          "value": "Romantis",
          "label": "Romantic"
        },
        {
          "value": "Fokus & Produktif",
          "label": "Focused & Productive"
        },
        {
          "value": "Segar & Berenergi",
          "label": "Fresh & Energized"
        },
        {
          "value": "Mewah & Elegan",
          "label": "Luxurious & Elegant"
        },
        {
          "value": "Nostalgia",
          "label": "Nostalgic"
        }
      ],
      "occasions": [
        {
          "value": "Kantor / Kerja",
          "label": "Office / Work"
        },
        {
          "value": "Kencan Romantis",
          "label": "Romantic Date"
        },
        {
          "value": "Nongkrong Santai / Kafe",
          "label": "Casual Hangout / Café"
        },
        {
          "value": "Acara Formal / Resepsi",
          "label": "Formal Event / Reception"
        },
        {
          "value": "Olahraga / Outdoor",
          "label": "Sports / Outdoors"
        },
        {
          "value": "Malam Hari / Pesta",
          "label": "Night Out / Party"
        },
        {
          "value": "Istirahat di Rumah",
          "label": "Resting at Home"
        }
      ],
      "weathers": [
        {
          "value": "Panas Terik Khatulistiwa",
          "label": "Scorching Equatorial Heat"
        },
        {
          "value": "Ruang Ber-AC Seharian",
          "label": "Air-Conditioned Room All Day"
        },
        {
          "value": "Hujan Sejuk Sore Hari",
          "label": "Cool Rainy Afternoon"
        },
        {
          "value": "Lembap Tropis Hangat",
          "label": "Warm Tropical Humidity"
        },
        {
          "value": "Malam Angin Semilir",
          "label": "Breezy Night"
        }
      ],
      "sprayCounts": [
        {
          "count": 1,
          "label": "1–2 (Light)"
        },
        {
          "count": 3,
          "label": "3–4 (Standard)"
        },
        {
          "count": 5,
          "label": "5+ (Full)"
        }
      ]
    },
    logWearOptions: {
      "occasions": [
        {
          "value": "Kantor / Kerja",
          "label": "Office / Work"
        },
        {
          "value": "Kencan Santai",
          "label": "Casual Date"
        },
        {
          "value": "Formal / Acara",
          "label": "Formal / Event"
        },
        {
          "value": "Olahraga / Aktif",
          "label": "Sports / Active"
        },
        {
          "value": "Santai di Rumah",
          "label": "Relaxing at Home"
        },
        {
          "value": "Pesta / Malam",
          "label": "Party / Night"
        }
      ],
      "moods": [
        {
          "value": "Percaya Diri",
          "label": "Confident"
        },
        {
          "value": "Tenang & Nyaman",
          "label": "Calm & Comfortable"
        },
        {
          "value": "Segar & Berenergi",
          "label": "Fresh & Energized"
        },
        {
          "value": "Misterius & Elegan",
          "label": "Mysterious & Elegant"
        },
        {
          "value": "Hangat & Nostalgia",
          "label": "Warm & Nostalgic"
        }
      ],
      "weathers": [
        {
          "value": "Panas Terik Tropis",
          "label": "Scorching Tropical Heat"
        },
        {
          "value": "Hujan Lembap",
          "label": "Humid Rain"
        },
        {
          "value": "Ruang Ber-AC",
          "label": "Air-Conditioned Room"
        },
        {
          "value": "Malam Sejuk",
          "label": "Cool Night"
        }
      ]
    },
    reviewOptions: {
      "longevityBands": [
        {
          "value": "1–3 Jam (Sangat Singkat)",
          "label": "1–3 Hours (Very Brief)"
        },
        {
          "value": "4–6 Jam (Moderat)",
          "label": "4–6 Hours (Moderate)"
        },
        {
          "value": "7–9 Jam (Tahan Lama)",
          "label": "7–9 Hours (Long-Lasting)"
        },
        {
          "value": "10+ Jam (Sangat Tahan Lama)",
          "label": "10+ Hours (Very Long-Lasting)"
        }
      ],
      "sillage": [
        {
          "value": "intimate",
          "label": "Intimate (Skin Only)",
          "desc": "Only noticeable at a very close distance"
        },
        {
          "value": "moderate",
          "label": "Moderate (Arm’s Length)",
          "desc": "Noticeable by people around you without intruding"
        },
        {
          "value": "strong",
          "label": "Strong (Room Radius)",
          "desc": "Leaves a clear scent trail in the room"
        }
      ],
      "repurchase": [
        {
          "value": "yes_definitely",
          "label": "Definitely Repurchase"
        },
        {
          "value": "maybe",
          "label": "Maybe / Needs Consideration"
        },
        {
          "value": "never",
          "label": "Will Not Repurchase"
        }
      ]
    },
}
};

export function formatCurrency(amount: number, locale: Locale = 'id'): string {
  if (locale === 'id') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  return `Rp ${amount.toLocaleString('en-US')}`;
}

/**
 * Render an optional 1–5 score (e.g. heat_suitability) or an honest NoData
 * label when the value is absent. Never interpolates `undefined`: published
 * canonical rows legitimately omit fields the brand does not state, so an
 * unguarded `${value}/5` would render "undefined/5" on the detail page.
 */
export function formatScoreOutOfFive(value: number | undefined | null, noDataLabel: string): string {
  return value != null ? `${value}/5` : noDataLabel;
}

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Fill positional `{0}`, `{1}`, ... placeholders in a resource template.
 * Used by strings extracted from template literals whose two locale branches
 * interpolate the same expressions (e.g. counts, names). Older resource
 * templates that use named `{name}` placeholders keep their existing
 * `.replace('{name}', ...)` call sites; do not mix the two conventions.
 */
export function fmt(template: string, ...values: unknown[]): string {
  let out = template;
  values.forEach((value, i) => {
    out = out.split(`{${i}}`).join(String(value));
  });
  return out;
}

/**
 * Localised label for a stored option value (mood / occasion / weather /
 * longevity band). Stored values are the Indonesian strings, identical in
 * both locales, so lookups work for logs written in either locale. Unknown
 * or legacy values fall back to the raw stored value, never blank.
 */
export function optionLabel(options: LabeledOption[], value: string | undefined | null): string {
  if (!value) return '';
  return options.find((o) => o.value === value)?.label ?? value;
}
