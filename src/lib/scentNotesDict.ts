/**
 * Family display palette (canonical data-palette source).
 * Each family has a tint/mid/deep triple plus bilingual labels. Deep values
 * must meet WCAG AA (4.5:1) as text on paper and on tint; citrus deep was
 * corrected to #7A5C00 (D-V2). Sprint 6 re-adopts this palette for facet chips.
 * NOTE: descId is Indonesian-only (no descEn); see the Sprint 5 log gap list.
 */

export const FAMILY_DISPLAY_ID: Record<string, { labelId: string; labelEn: string; tint: string; mid: string; deep: string; descId: string }> = {
  citrus: {
    labelId: 'Sitrus',
    labelEn: 'Citrus',
    tint: '#FBF1C7',
    mid: '#F0CC4D',
    deep: '#7A5C00',
    descId: 'Cerah, tajam membangkitkan energi, seperti percikan jeruk nipis & bergamot.'
  },
  floral: {
    labelId: 'Floral',
    labelEn: 'Floral',
    tint: '#FBE4E8',
    mid: '#E9A9B8',
    deep: '#9C3F5B',
    descId: 'Mekar semerbak melati, kenanga, dan mawar yang lembut memikat.'
  },
  woody: {
    labelId: 'Berkayu',
    labelEn: 'Woody',
    tint: '#EEE0D0',
    mid: '#B58A62',
    deep: '#5E3F26',
    descId: 'Sentuhan kokoh bersahaja dari kayu cendana, nilam, dan akar wangi.'
  },
  amber: {
    labelId: 'Amber / Oriental',
    labelEn: 'Amber / Oriental',
    tint: '#FBE3C8',
    mid: '#DB8B3A',
    deep: '#8A4A10',
    descId: 'Hangat, sensual, berselimut resin manis dan keanggunan malam.'
  },
  oriental: {
    labelId: 'Amber / Oriental',
    labelEn: 'Amber / Oriental',
    tint: '#FBE3C8',
    mid: '#DB8B3A',
    deep: '#8A4A10',
    descId: 'Hangat, sensual, berselimut resin manis dan keanggunan malam.'
  },
  aromatic: {
    labelId: 'Aromatik / Fougère',
    labelEn: 'Aromatic / Fougère',
    tint: '#E3EDDF',
    mid: '#8FAE8B',
    deep: '#3F5E3C',
    descId: 'Kesegaran herba, lavender, dan teh hijau yang bersih serta menenangkan.'
  },
  gourmand: {
    labelId: 'Gourmand',
    labelEn: 'Gourmand',
    tint: '#F4DDCB',
    mid: '#C98B5E',
    deep: '#6E3F22',
    descId: 'Manis menggugah selera dengan sentuhan vanila lembut, kopi, dan karamel.'
  },
  aquatic: {
    labelId: 'Segar / Akuatik',
    labelEn: 'Fresh / Aquatic',
    tint: '#DDEEF3',
    mid: '#7DB8CC',
    deep: '#2D6479',
    descId: 'Hembusan angin laut pantai selatan dan kesegaran air embun pagi.'
  },
  fresh: {
    labelId: 'Segar / Akuatik',
    labelEn: 'Fresh / Aquatic',
    tint: '#DDEEF3',
    mid: '#7DB8CC',
    deep: '#2D6479',
    descId: 'Hembusan angin laut pantai selatan dan kesegaran air embun pagi.'
  },
  green: {
    labelId: 'Hijau',
    labelEn: 'Green',
    tint: '#E6EFD6',
    mid: '#9CB873',
    deep: '#4A6428',
    descId: 'Aroma daun pandan basah, rerumputan sehabis hujan, dan lumut segar.'
  },
  musky: {
    labelId: 'Musk / Bedak',
    labelEn: 'Musk / Powdery',
    tint: '#EFE5EE',
    mid: '#CDB6CC',
    deep: '#6C4F6B',
    descId: 'Lembut dekat di kulit (skin scent), nyaman bak kemeja katun bersih.'
  },
  powdery: {
    labelId: 'Musk / Bedak',
    labelEn: 'Musk / Powdery',
    tint: '#EFE5EE',
    mid: '#CDB6CC',
    deep: '#6C4F6B',
    descId: 'Lembut dekat di kulit (skin scent), nyaman bak kemeja katun bersih.'
  },
  leather: {
    labelId: 'Kulit / Asap',
    labelEn: 'Leather / Smoky',
    tint: '#E4DCD7',
    mid: '#7A655B',
    deep: '#3A2C26',
    descId: 'Karakter matang nan berwibawa, sentuhan jaket kulit dan aroma kayu terbakar.'
  },
  spicy: {
    labelId: 'Rempah',
    labelEn: 'Spicy',
    tint: '#F8DDD4',
    mid: '#D2573D',
    deep: '#84281A',
    descId: 'Kehangatan eksotis cengkeh Maluku, kayu manis, dan lada berani.'
  },
  fruity: {
    labelId: 'Buah',
    labelEn: 'Fruity',
    tint: '#FBE0D6',
    mid: '#EE8B6A',
    deep: '#9A3F25',
    descId: 'Keceriaan buah ranum tropis yang manis, segar, dan menggembirakan.'
  }
};
