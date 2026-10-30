import { WearLogState, StoryState, ReviewState } from '../lib/derivedCalculations.ts';







export const INITIAL_WEAR_LOGS: WearLogState[] = [
  {
    id: 'wear_001',
    client_op_id: 'seed-wear-001',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_001',
    perfume_id: 'prf_013', // HMNS The Perfection (published)
    worn_at: '2026-10-18T08:30:00.000Z',
    sprays: 4,
    ml_used: 0.5,
    compliments: 2,
    longevity_hours: 5,
    mood: 'Percaya Diri',
    occasion: 'Kantor / Kerja',
    weather: 'Ruang Ber-AC Seharian',
    note: 'Dipakai seharian di kantor ber-AC; performanya sesuai klaim brand 4–6 jam dan tetap nyaman sampai sore.',
    deleted_at: null
  },
  {
    id: 'wear_002',
    client_op_id: 'seed-wear-002',
    user_id: 'usr_senstoria',
    bottle_id: 'bot_002',
    perfume_id: 'prf_014', // Carl & Claire Enchantée (published)
    worn_at: '2026-10-17T19:00:00.000Z',
    sprays: 3,
    ml_used: 0.5,
    compliments: 1,
    longevity_hours: 8,
    mood: 'Mewah & Elegan',
    occasion: 'Kencan Romantis',
    weather: 'Malam Angin Semilir',
    note: 'Nuansa floral-nya terasa anggun untuk dinner malam minggu dan bertahan sampai pulang.',
    deleted_at: null
  }
];

export const INITIAL_SCENT_STORIES: StoryState[] = [
  {
    id: 'story_001',
    user_id: 'usr_senstoria',
    user_name: 'senstoria',
    perfume_id: 'prf_013', // HMNS The Perfection (published)
    wear_log_id: 'wear_001',
    title: 'Seharian di Kantor & Teman yang Bertanya',
    body: 'Saya memakai HMNS The Perfection sebelum berangkat ke kantor. Di ruangan ber-AC, aromanya menemani dari rapat pagi sampai sore tanpa terasa menusuk. Seorang rekan kerja bertanya parfum apa yang saya kenakan — momen kecil yang membuat hari kerja terasa lebih percaya diri.',
    mood: 'Percaya Diri',
    occasion: 'Kantor / Kerja',
    weather: 'Ruang Ber-AC Seharian',
    tags: ['Jakarta', 'Kantor', 'Lokal Pride'],
    story_date: '2026-10-18',
    status: 'published',
    created_at: '2026-10-18T10:00:00.000Z',
    deleted_at: null
  },
  {
    id: 'story_002',
    user_id: 'usr_senstoria',
    user_name: 'senstoria',
    perfume_id: 'prf_014', // Carl & Claire Enchantée (published)
    wear_log_id: 'wear_002',
    title: 'Malam Minggu & Gaun Floral',
    body: 'Enchantée menemani dinner malam minggu dengan karakter floral yang anggun. Aromanya tidak berteriak, tapi cukup meninggalkan jejak manis yang membuat saya merasa rapi sepanjang malam.',
    mood: 'Mewah & Elegan',
    occasion: 'Kencan Romantis',
    weather: 'Malam Angin Semilir',
    tags: ['Dinner', 'Floral'],
    story_date: '2026-10-17',
    status: 'published',
    created_at: '2026-10-17T20:00:00.000Z',
    deleted_at: null
  }
];

export const INITIAL_REVIEWS: ReviewState[] = [
  {
    id: 'rev_001',
    user_id: 'usr_rev_1',
    user_name: 'Dimas Prasetyo',
    user_badge: 'Verified Owner (Botol Penuh)',
    perfume_id: 'prf_013', // HMNS The Perfection (published)
    rating: 4.5,
    longevity_band: '4–6 Jam (Moderat)',
    sillage: 'moderate',
    value_for_money: 4.5,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Performa sesuai klaim, nyaman dipakai seharian di kantor',
    review_text: 'HMNS The Perfection bertahan sekitar 5 jam di ruangan ber-AC, sesuai klaim brand 4–6 jam. Karakternya rapi dan tidak menusuk, cocok untuk pemakaian kerja harian.',
    pros: ['Performa sesuai klaim brand', 'Nyaman untuk ruangan ber-AC'],
    cons: ['Perlu re-apply untuk acara malam yang panjang'],
    status: 'approved',
    created_at: '2026-10-14T09:20:00.000Z',
    helpful_count: 12
  },
  {
    id: 'rev_002',
    user_id: 'usr_rev_2',
    user_name: 'Nadia Salsabila',
    user_badge: 'Fragrance Enthusiast',
    perfume_id: 'prf_013', // HMNS The Perfection (published)
    rating: 4.0,
    longevity_band: '4–6 Jam (Moderat)',
    sillage: 'moderate',
    value_for_money: 4,
    repurchase_intent: 'maybe',
    format_used: 'full_bottle',
    title: 'Rapi dan aman, tapi bukan yang paling memorable',
    review_text: 'The Perfection adalah pilihan aman untuk sehari-hari: tidak menyengat, mudah disukai, dan performanya moderat. Untuk yang mencari karakter kuat, mungkin terasa terlalu kalem.',
    pros: ['Mudah disukai banyak orang', 'Aman untuk kantor'],
    cons: ['Karakter terasa kalem'],
    status: 'approved',
    created_at: '2026-10-10T14:10:00.000Z',
    helpful_count: 8
  },
  {
    id: 'rev_003',
    user_id: 'usr_rev_3',
    user_name: 'Bramantyo Wicaksono',
    user_badge: 'Verified Owner (Botol Penuh)',
    perfume_id: 'prf_014', // Carl & Claire Enchantée (published)
    rating: 4.5,
    longevity_band: '7–9 Jam (Tahan Lama)',
    sillage: 'moderate',
    value_for_money: 4,
    repurchase_intent: 'yes_definitely',
    format_used: 'full_bottle',
    title: 'Floral anggun yang tahan sampai pulang',
    review_text: 'Enchantée bertahan sekitar 8 jam di kulit saya, sejalan dengan klaim brand hingga 8–10 jam. Karakter floral-nya anggun untuk acara malam tanpa terasa berat.',
    pros: ['Ketahanan nyata 8 jam', 'Floral anggun untuk malam hari'],
    cons: ['Botol 30 ml cepat habis untuk pemakaian harian'],
    status: 'approved',
    created_at: '2026-10-12T11:45:00.000Z',
    helpful_count: 9
  }
];
