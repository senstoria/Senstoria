/**
 * Indonesian <-> English Fragrance Note & Family Dictionary
 * Provides bidirectional translation and matching so searches for "cendana" find "sandalwood"
 */

export interface NoteDefinition {
  id: string;
  nameId: string;
  nameEn: string;
  family: string;
  category: 'lokal' | 'umum';
  descriptionId: string;
}

export const INDONESIAN_NOTES_DICTIONARY: NoteDefinition[] = [
  { id: 'melati', nameId: 'Melati', nameEn: 'Jasmine', family: 'floral', category: 'lokal', descriptionId: 'Bunga putih khas nusantara, manis, sensual, dan menenangkan.' },
  { id: 'kenanga', nameId: 'Kenanga', nameEn: 'Ylang-Ylang', family: 'floral', category: 'lokal', descriptionId: 'Aroma floral eksotis tropis dengan nuansa manis madu yang kaya.' },
  { id: 'cendana', nameId: 'Cendana', nameEn: 'Sandalwood', family: 'woody', category: 'lokal', descriptionId: 'Kayu cendana Nusa Tenggara yang lembut, creamy, hangat, dan meditatif.' },
  { id: 'gaharu', nameId: 'Gaharu (Oud)', nameEn: 'Oud / Agarwood', family: 'woody', category: 'lokal', descriptionId: 'Resin kayu langka bernuansa gelap, mewah, berasap, dan berkarakter kuat.' },
  { id: 'cengkeh', nameId: 'Cengkeh', nameEn: 'Clove', family: 'spicy', category: 'lokal', descriptionId: 'Rempah Maluku hangat pedas yang memberi kedalaman dan rasa nostalgik.' },
  { id: 'kayu-manis', nameId: 'Kayu Manis', nameEn: 'Cinnamon', family: 'spicy', category: 'lokal', descriptionId: 'Aroma manis rempah hangat yang memberi sentuhan nyaman dan mengundang.' },
  { id: 'pandan', nameId: 'Pandan', nameEn: 'Pandan Leaf', family: 'green', category: 'lokal', descriptionId: 'Aroma daun pandan segar bernuansa beras wangi dan vanila herbal.' },
  { id: 'nilam', nameId: 'Nilam', nameEn: 'Patchouli', family: 'woody', category: 'lokal', descriptionId: 'Nilam Sumatra bersahaja, bersahabat dengan tanah (earthy), gelap dan tahan lama.' },
  { id: 'akar-wangi', nameId: 'Akar Wangi', nameEn: 'Vetiver', family: 'woody', category: 'lokal', descriptionId: 'Akar wangi Garut yang terkenal di dunia; hijau kering, bersahaja dan maskulin.' },
  { id: 'vanila', nameId: 'Vanila', nameEn: 'Vanilla', family: 'gourmand', category: 'umum', descriptionId: 'Manis lembut, hangat, mengalirkan rasa tenang seperti pelukan.' },
  { id: 'kopi', nameId: 'Kopi', nameEn: 'Coffee', family: 'gourmand', category: 'lokal', descriptionId: 'Aroma sangrai biji kopi nusantara yang pekat, energik, dan kaya rasa.' },
  { id: 'jeruk-nipis', nameId: 'Jeruk Nipis', nameEn: 'Lime', family: 'citrus', category: 'lokal', descriptionId: 'Kesegaran citrus tajam menyegarkan yang membangkitkan semangat seketika.' },
  { id: 'bergamot', nameId: 'Bergamot', nameEn: 'Bergamot', family: 'citrus', category: 'umum', descriptionId: 'Citrus Italia klasik yang elegan, segar berbunga, dan bersih.' },
  { id: 'mawar', nameId: 'Mawar', nameEn: 'Rose', family: 'floral', category: 'umum', descriptionId: 'Kembang mawar klasik yang segar merekah, romantis, dan tak lekang zaman.' },
  { id: 'teh', nameId: 'Teh', nameEn: 'Tea / Green Tea', family: 'aromatic', category: 'lokal', descriptionId: 'Aroma seduhan pucuk daun teh perkebunan sejuk, bersih dan damai.' },
];

/**
 * Normalizes query string and finds matching note ids across Indonesian and English names
 */
export function matchNoteTerms(term: string): string[] {
  const clean = term.toLowerCase().trim();
  if (!clean) return [];
  
  const matches = new Set<string>();
  for (const n of INDONESIAN_NOTES_DICTIONARY) {
    if (
      n.nameId.toLowerCase().includes(clean) ||
      n.nameEn.toLowerCase().includes(clean) ||
      n.id.includes(clean)
    ) {
      matches.add(n.id);
      matches.add(n.nameId.toLowerCase());
      matches.add(n.nameEn.toLowerCase());
    }
  }
  return Array.from(matches);
}

export const FAMILY_DISPLAY_ID: Record<string, { labelId: string; labelEn: string; tint: string; mid: string; deep: string; descId: string }> = {
  citrus: {
    labelId: 'Sitrus',
    labelEn: 'Citrus',
    tint: '#FBF1C7',
    mid: '#F0CC4D',
    deep: '#A67C00',
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
