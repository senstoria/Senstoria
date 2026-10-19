import { WearLogState, StoryState, ReviewState } from '../lib/derivedCalculations.ts';

export const MOOD_OPTIONS = [
  'Percaya Diri',
  'Santai & Tenang',
  'Romantis',
  'Fokus & Produktif',
  'Segar & Berenergi',
  'Mewah & Elegan',
  'Nostalgia'
];

export const OCCASION_OPTIONS = [
  'Kantor / Kerja',
  'Kencan Romantis',
  'Nongkrong Santai / Kafe',
  'Acara Formal / Resepsi',
  'Olahraga / Outdoor',
  'Malam Hari / Pesta',
  'Istirahat di Rumah'
];

export const WEATHER_OPTIONS = [
  'Panas Terik Khatulistiwa',
  'Ruang Ber-AC Seharian',
  'Hujan Sejuk Sore Hari',
  'Lembap Tropis Hangat',
  'Malam Angin Semilir'
];

export const LONGEVITY_BANDS = [
  '< 3 jam (Sangat Ringan)',
  '3–6 jam (Moderat)',
  '6–8 jam (Tahan Kerja)',
  '8–12 jam (Tahan Seharian)',
  '> 12 jam (Monster / Abadi)'
];

export const SILLAGE_OPTIONS: { value: 'intimate' | 'moderate' | 'strong' | 'enormous'; label: string; desc: string }[] = [
  { value: 'intimate', label: 'Intimate (Dekat Kulit)', desc: 'Hanya tercium oleh orang yang sangat dekat atau berpelukan' },
  { value: 'moderate', label: 'Moderate (Radius Lengan)', desc: 'Tercium nyaman dalam jarak jabat tangan tanpa mendistraksi' },
  { value: 'strong', label: 'Strong (Satu Ruangan)', desc: 'Meninggalkan jejak wangi saat melintas dan mengisi ruangan' },
  { value: 'enormous', label: 'Enormous (Monster)', desc: 'Proyeksi luar biasa kuat, awet tercium dari kejauhan' }
];

export const REPURCHASE_OPTIONS: { value: 'yes_definitely' | 'maybe' | 'unlikely' | 'never'; label: string }[] = [
  { value: 'yes_definitely', label: 'Pasti Beli Lagi (Signature Scent)' },
  { value: 'maybe', label: 'Mungkin (Jika ada diskon / varian baru)' },
  { value: 'unlikely', label: 'Ragu-ragu (Cukup satu botol)' },
  { value: 'never', label: 'Tidak Akan (Kurang cocok di kulit)' }
];

export const INITIAL_WEAR_LOGS: WearLogState[] = [
  {
    id: 'wear_001',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_001',
    perfume_id: 'prf_001', // HMNS Orgasm
    worn_on: '2026-10-18T08:30:00.000Z',
    sprays_count: 4,
    ml_decremented: 0.5,
    compliments: 2,
    longevity_hours: 7.5,
    mood: 'Percaya Diri',
    occasion: 'Kantor / Kerja',
    weather: 'Ruang Ber-AC Seharian',
    note: 'Rekan kerja memuji aroma vanila apelnya yang segar dan tidak bikin enek di ruangan rapat ber-AC.',
    deleted_at: null
  },
  {
    id: 'wear_002',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_003',
    perfume_id: 'prf_004', // Carl & Claire Black Orchid
    worn_on: '2026-10-17T19:00:00.000Z',
    sprays_count: 3,
    ml_decremented: 0.5,
    compliments: 1,
    longevity_hours: 8,
    mood: 'Mewah & Elegan',
    occasion: 'Kencan Romantis',
    weather: 'Malam Angin Semilir',
    note: 'Nuansa floral gelap dan truffle sangat pas untuk dinner malam minggu.',
    deleted_at: null
  },
  {
    id: 'wear_003',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_004',
    perfume_id: 'prf_005', // Alien Objects Xandu
    worn_on: '2026-10-16T14:15:00.000Z',
    sprays_count: 3,
    ml_decremented: 0.5,
    compliments: 0,
    longevity_hours: 9,
    mood: 'Fokus & Produktif',
    occasion: 'Nongkrong Santai / Kafe',
    weather: 'Hujan Sejuk Sore Hari',
    note: 'Aroma dupa dan kayu cendana membuat fokus bekerja di coffee shop tetap tenang berjam-jam.',
    deleted_at: null
  },
  {
    id: 'wear_004',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_002',
    perfume_id: 'prf_003', // Oullu Arcanum
    worn_on: '2026-10-15T09:00:00.000Z',
    sprays_count: 4,
    ml_decremented: 0.5,
    compliments: 1,
    longevity_hours: 6.5,
    mood: 'Santai & Tenang',
    occasion: 'Kantor / Kerja',
    weather: 'Panas Terik Khatulistiwa',
    note: 'Top notes citrus manis berpadu teh hitam, segar dipakai saat commuting pagi.',
    deleted_at: null
  }
];

export const INITIAL_SCENT_STORIES: StoryState[] = [
  {
    id: 'story_001',
    user_id: 'usr_senstoria',
    user_name: 'senstoria',
    perfume_id: 'prf_001', // HMNS Orgasm
    wear_log_id: 'wear_001',
    title: 'Hujan Sore di Kemang & Hangatnya Vanilla Apel',
    body: 'Ada sesuatu yang magis ketika hujan pertama bulan Oktober membasahi aspal Kemang yang panas. Saya menyemprotkan HMNS Orgasm di tengkuk dan pergelangan tangan sebelum melangkah ke sebuah toko buku tua. Udara berbau petrichor yang lembap tiba-tiba berbaur dengan semerbak apel merah dan vanila hangat yang lembut. Seorang barista tersenyum dan bertanya parfum apa yang saya kenakan karena aromanya membuat seluruh sudut kafe terasa hangat seperti pelukan lama.',
    mood: 'Nostalgia',
    occasion: 'Nongkrong Santai / Kafe',
    weather: 'Hujan Sejuk Sore Hari',
    tags: ['Kemang', 'Hujan', 'Kopi', 'Vanilla Warmth', 'Lokal Pride'],
    story_date: '2026-10-18',
    status: 'published',
    is_public: true,
    likes_count: 14,
    created_at: '2026-10-18T10:00:00.000Z',
    deleted_at: null
  },
  {
    id: 'story_002',
    user_id: 'usr_senstoria',
    user_name: 'senstoria',
    perfume_id: 'prf_005', // Alien Objects Xandu
    wear_log_id: 'wear_003',
    title: 'Ritual Meditasi Kayu & Teh Oolong di Dago Pakar',
    body: 'Kabut tipis menyelimuti perbukitan Bandung utara saat pagi buta. Menyemprotkan Alien Objects Xandu memberikan transisi batin yang seketika menenangkan: perpaduan dupa, kayu basah, dan resin ambery. Menghirup aroma ini saat menyeruput teh hangat membuat waktu seolah melambat. Ini bukan sekadar parfum untuk dipamerkan ke orang lain, melainkan jangkar ketenangan untuk diri sendiri.',
    mood: 'Santai & Tenang',
    occasion: 'Istirahat di Rumah',
    weather: 'Hujan Sejuk Sore Hari',
    tags: ['Bandung', 'Dago', 'Meditasi', 'Kayu Cendana'],
    story_date: '2026-10-16',
    status: 'published',
    is_public: true,
    likes_count: 9,
    created_at: '2026-10-16T15:30:00.000Z',
    deleted_at: null
  }
];

export const INITIAL_REVIEWS: ReviewState[] = [
  {
    id: 'rev_001',
    user_id: 'usr_rev_1',
    user_name: 'Dimas Prasetyo',
    user_badge: 'Verified Owner (Botol Penuh)',
    perfume_id: 'prf_001', // HMNS Orgasm
    rating: 4.8,
    longevity_band: '6–8 jam (Tahan Kerja)',
    sillage: 'moderate',
    value_for_money: 5,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Gourmand tropis yang seimbang, tidak membuat pusing di cuaca panas Jakarta',
    review_text: 'HMNS Orgasm layak mendapatkan reputasinya. Dibuka dengan kesegaran apel merah yang renyah dan berair, lalu berubah menjadi floral mawar lembut dan drydown vanila amber yang manis tapi tetap airy. Di ruang ber-AC kantor tahan hingga 7 jam lebih. Sangat direkomendasikan untuk pemula parfum lokal yang mencari aroma mass-pleasing berkelas.',
    pros: ['Aroma manis apel vanila ramah lingkungan kerja', 'Value for money luar biasa untuk brand lokal', 'Sering mendapat pujian spontan'],
    cons: ['Semprotan awal agak sedikit tajam alkohol (10 detik pertama)'],
    status: 'approved',
    created_at: '2026-10-14T09:20:00.000Z',
    helpful_count: 28
  },
  {
    id: 'rev_002',
    user_id: 'usr_rev_2',
    user_name: 'Nadia Salsabila',
    user_badge: 'Fragrance Enthusiast',
    perfume_id: 'prf_001', // HMNS Orgasm
    rating: 4.5,
    longevity_band: '6–8 jam (Tahan Kerja)',
    sillage: 'moderate',
    value_for_money: 4.5,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Parfum kencan signature saya sejak 2022',
    review_text: 'Kombinasi vanila dan floralnya feminin sekaligus elegan. Teman-teman selalu tahu jika saya baru masuk ruangan karena jejak aromanya yang manis lembut. Untuk cuaca siang terik, cukup 2-3 semprot saja agar tidak terasa terlalu manis.',
    pros: ['Daya tarik kencan tinggi', 'Drydown hangat dan comforting'],
    cons: ['Kurang cocok jika dipakai saat olahraga berat'],
    status: 'approved',
    created_at: '2026-10-10T14:10:00.000Z',
    helpful_count: 19
  },
  {
    id: 'rev_003',
    user_id: 'usr_rev_3',
    user_name: 'Bramantyo Wicaksono',
    user_badge: 'Verified Owner (Decant 10ml)',
    perfume_id: 'prf_003', // Oullu Arcanum
    rating: 4.6,
    longevity_band: '6–8 jam (Tahan Kerja)',
    sillage: 'moderate',
    value_for_money: 4,
    repurchase_intent: 'maybe',
    format_used: 'decant',
    title: 'Citrus rempah gelap yang misterius dan intelek',
    review_text: 'Oullu Arcanum memiliki karakter yang unik dibanding parfum lokal mainstream lainnya. Ada nuansa rempah hangat dan teh hitam yang berpadu dengan citrus matang. Sangat cocok bagi yang ingin tampil beda tanpa menjadi berisik.',
    pros: ['Profil aroma tidak pasaran', 'Botol dan branding sangat estetik'],
    cons: ['Proyeksi mengecil setelah 3 jam'],
    status: 'approved',
    created_at: '2026-10-12T11:45:00.000Z',
    helpful_count: 14
  },
  {
    id: 'rev_004',
    user_id: 'usr_rev_4',
    user_name: 'Farhan Rizki',
    user_badge: 'Verified Owner (Botol Penuh)',
    perfume_id: 'prf_004', // Carl & Claire Black Orchid
    rating: 4.7,
    longevity_band: '8–12 jam (Tahan Seharian)',
    sillage: 'strong',
    value_for_money: 5,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Ketahanan buas untuk parfum malam dan pesta',
    review_text: 'Carl & Claire benar-benar juara di urutan ketahanan. Black Orchid bertahan di jas saya sampai keesokan harinya! Floral gelap yang mewah dengan aura misterius. Sangat berbobot.',
    pros: ['Ketahanan 8-10 jam nyata di iklim lembap', 'Proyeksi berani dan percaya diri'],
    cons: ['Terlalu pekat untuk siang hari terik outdoor'],
    status: 'approved',
    created_at: '2026-10-15T18:00:00.000Z',
    helpful_count: 22
  },
  {
    id: 'rev_005',
    user_id: 'usr_rev_5',
    user_name: 'Aulia Rahma',
    user_badge: 'Niche Collector',
    perfume_id: 'prf_005', // Alien Objects Xandu
    rating: 4.9,
    longevity_band: '8–12 jam (Tahan Seharian)',
    sillage: 'strong',
    value_for_money: 4.5,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Karya seni olfaktif independen Indonesia kelas dunia',
    review_text: 'Alien Objects membuktikan bahwa artisan perfumery Indonesia bisa bersaing dengan brand niche internasional seperti Le Labo atau Byredo. Xandu memiliki kedalaman kayu dupa, rempah dingin, dan resin yang berkembang dinamis sepanjang hari.',
    pros: ['Kualitas bahan baku level artisanal niche', 'Storytelling dan konsep sangat kuat', 'Unisex sempurna'],
    cons: ['Harga relatif tinggi untuk pasar lokal, namun sangat sepadan'],
    status: 'approved',
    created_at: '2026-10-08T16:30:00.000Z',
    helpful_count: 31
  }
];
