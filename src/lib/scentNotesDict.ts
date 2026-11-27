/**
 * Family display palette (canonical data-palette source).
 * Each family has a tint/mid/deep triple plus bilingual labels.
 * DUA WARNA SAJA (27 Nov 2026, perintah founder): tint putih,
 * mid & deep hitam — semua keluarga kini identik secara warna;
 * pembeda antar-keluarga hanya labelnya. Dulu tiap keluarga punya
 * tint/mid/deep berwarna (mis. deep sitrus yang memenuhi AA).
 * NOTE: descId is Indonesian-only (no descEn); see the Sprint 5 log gap list.
 * NOTE 2: saat ini tidak ada komponen yang memakai record ini
 * (inventarisasi 27 Nov 2026) — nilainya dipertahankan konsisten
 * dengan token dua warna bila suatu saat dipakai lagi.
 */

export const FAMILY_DISPLAY_ID: Record<string, { labelId: string; labelEn: string; tint: string; mid: string; deep: string; descId: string }> = {
  citrus: {
    labelId: 'Sitrus',
    labelEn: 'Citrus',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Cerah, tajam membangkitkan energi, seperti percikan jeruk nipis & bergamot.'
  },
  floral: {
    labelId: 'Floral',
    labelEn: 'Floral',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Mekar semerbak melati, kenanga, dan mawar yang lembut memikat.'
  },
  woody: {
    labelId: 'Berkayu',
    labelEn: 'Woody',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Sentuhan kokoh bersahaja dari kayu cendana, nilam, dan akar wangi.'
  },
  amber: {
    labelId: 'Amber / Oriental',
    labelEn: 'Amber / Oriental',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Hangat, sensual, berselimut resin manis dan keanggunan malam.'
  },
  oriental: {
    labelId: 'Amber / Oriental',
    labelEn: 'Amber / Oriental',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Hangat, sensual, berselimut resin manis dan keanggunan malam.'
  },
  aromatic: {
    labelId: 'Aromatik / Fougère',
    labelEn: 'Aromatic / Fougère',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Kesegaran herba, lavender, dan teh hijau yang bersih serta menenangkan.'
  },
  gourmand: {
    labelId: 'Gourmand',
    labelEn: 'Gourmand',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Manis menggugah selera dengan sentuhan vanila lembut, kopi, dan karamel.'
  },
  aquatic: {
    labelId: 'Segar / Akuatik',
    labelEn: 'Fresh / Aquatic',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Hembusan angin laut pantai selatan dan kesegaran air embun pagi.'
  },
  fresh: {
    labelId: 'Segar / Akuatik',
    labelEn: 'Fresh / Aquatic',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Hembusan angin laut pantai selatan dan kesegaran air embun pagi.'
  },
  green: {
    labelId: 'Hijau',
    labelEn: 'Green',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Aroma daun pandan basah, rerumputan sehabis hujan, dan lumut segar.'
  },
  musky: {
    labelId: 'Musk / Bedak',
    labelEn: 'Musk / Powdery',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Lembut dekat di kulit (skin scent), nyaman bak kemeja katun bersih.'
  },
  powdery: {
    labelId: 'Musk / Bedak',
    labelEn: 'Musk / Powdery',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Lembut dekat di kulit (skin scent), nyaman bak kemeja katun bersih.'
  },
  leather: {
    labelId: 'Kulit / Asap',
    labelEn: 'Leather / Smoky',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Karakter matang nan berwibawa, sentuhan jaket kulit dan aroma kayu terbakar.'
  },
  spicy: {
    labelId: 'Rempah',
    labelEn: 'Spicy',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Kehangatan eksotis cengkeh Maluku, kayu manis, dan lada berani.'
  },
  fruity: {
    labelId: 'Buah',
    labelEn: 'Fruity',
    tint: '#FFFFFF',
    mid: '#000000',
    deep: '#000000',
    descId: 'Keceriaan buah ranum tropis yang manis, segar, dan menggembirakan.'
  }
};
