import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Share2, 
  Flame, 
  Award, 
  Check, 
  ArrowRight,
  BookOpen,
  Droplet
} from 'lucide-react';
import { SeedPerfume } from '../data/seedPerfumes.ts';
import { Locale, formatCurrency } from '../lib/i18n.ts';

interface PublicStory {
  id: string;
  author: string;
  city: string;
  perfumeId: string;
  perfumeName: string;
  brand: string;
  title: string;
  body: string;
  occasion: string;
  mood: string;
  date: string;
  likes: number;
  isLiked?: boolean;
  comments: { id: string; author: string; text: string; time: string }[];
}

interface CommunityViewProps {
  perfumes: SeedPerfume[];
  onSelectPerfume: (id: string) => void;
  onOpenTryItFirst: (id: string) => void;
  onNavigateToDiary: () => void;
  locale: Locale;
}

const INITIAL_PUBLIC_STORIES: PublicStory[] = [
  {
    id: 'story_pub_01',
    author: 'Nadira S.',
    city: 'Jakarta Selatan',
    perfumeId: 'prf_001',
    perfumeName: 'Orgasm',
    brand: 'HMNS',
    title: 'Hujan Sore Pertama di Senopati',
    body: 'Menghabiskan waktu menunggu hujan reda di teras kafe. Sentuhan aroma apel merah dan vanila hangat terasa sangat memeluk di udara basah Jakarta. Banyak yang bertanya aroma apa yang kupakai.',
    occasion: 'Kencan Santai',
    mood: 'Hangat & Nostalgia',
    date: 'Kemarin, 17:30',
    likes: 42,
    comments: [
      { id: 'c1', author: 'Reza P.', text: 'Setuju banget, HMNS Orgasm saat hujan sore aromanya lebih creamy!', time: '1 jam lalu' }
    ]
  },
  {
    id: 'story_pub_02',
    author: 'Dimas Aditya',
    city: 'Bandung',
    perfumeId: 'prf_004',
    perfumeName: 'Black Orchid',
    brand: 'Carl & Claire',
    title: 'Presentasi Proyek Akhir Tahun di SCBD',
    body: 'Butuh aroma yang memancarkan aura tenang namun berwibawa di ruang rapat ber-AC dingin. Woody ambery yang dalam ini memberikan rasa percaya diri ekstra selama dua jam presentasi.',
    occasion: 'Kantor / Profesional',
    mood: 'Percaya Diri & Elegan',
    date: '3 hari lalu',
    likes: 29,
    comments: [
      { id: 'c2', author: 'Siti W.', text: 'Ketahanan di ruangan AC berapa jam kak?', time: '2 hari lalu' }
    ]
  },
  {
    id: 'story_pub_03',
    author: 'Clara Michelle',
    city: 'Surabaya',
    perfumeId: 'prf_005',
    perfumeName: 'Xandu',
    brand: 'Alien Objects',
    title: 'Menyusuri Galeri Seni & Toko Buku Antik',
    body: 'Aroma dupa halus, teh herbal, dan kayu tua yang sangat artistik. Sangat menyatu dengan suasana tenang dan aroma kertas buku tua.',
    occasion: 'Waktu Sendiri / Me Time',
    mood: 'Meditatif',
    date: '5 hari lalu',
    likes: 36,
    comments: []
  }
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  perfumes,
  onSelectPerfume,
  onOpenTryItFirst,
  onNavigateToDiary,
  locale
}) => {
  const [stories, setStories] = useState<PublicStory[]>(() => {
    try {
      const saved = localStorage.getItem('senstoria_community_stories');
      return saved ? JSON.parse(saved) : INITIAL_PUBLIC_STORIES;
    } catch {
      return INITIAL_PUBLIC_STORIES;
    }
  });

  const [filterTag, setFilterTag] = useState<string>('all');
  const [activeCommentStoryId, setActiveCommentStoryId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const toggleLike = (storyId: string) => {
    setStories(prev => {
      const updated = prev.map(s => {
        if (s.id === storyId) {
          const isLiked = !s.isLiked;
          return {
            ...s,
            isLiked,
            likes: isLiked ? s.likes + 1 : s.likes - 1
          };
        }
        return s;
      });
      try {
        localStorage.setItem('senstoria_community_stories', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddComment = (storyId: string) => {
    if (!newCommentText.trim()) return;

    setStories(prev => {
      const updated = prev.map(s => {
        if (s.id === storyId) {
          return {
            ...s,
            comments: [
              ...s.comments,
              {
                id: 'c_' + Date.now(),
                author: 'Kamu (Kolektor)',
                text: newCommentText.trim(),
                time: 'Baru saja'
              }
            ]
          };
        }
        return s;
      });
      try {
        localStorage.setItem('senstoria_community_stories', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setNewCommentText('');
  };

  const handleShareStory = (story: PublicStory) => {
    const text = `📖 Cerita Aroma: "${story.title}" oleh ${story.author} (${story.perfumeName} - ${story.brand})\n${story.body}\nBaca selengkapnya di Senstoria.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShareId(story.id);
      setTimeout(() => setCopiedShareId(null), 2000);
    }
  };

  const topVotedPerfumes = perfumes.slice(0, 4);

  const filteredStories = filterTag === 'all' 
    ? stories 
    : stories.filter(s => s.occasion.toLowerCase().includes(filterTag.toLowerCase()) || s.mood.toLowerCase().includes(filterTag.toLowerCase()));

  return (
    <div className="space-y-12">
      
      {/* ── HEADER ── */}
      <div className="border-b border-hairline pb-6 space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-accent block">
          Ruang Cerita & Pilihan Komunitas
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-bar">
              Komunitas Senstoria
            </h1>
            <p className="text-sm text-secondary max-w-xl mt-1">
              Jelajahi kisah memori olfaktif dari para pecinta aroma di Indonesia, berikan apresiasi, dan temukan parfum favorit pilihan publik.
            </p>
          </div>
          <button
            onClick={onNavigateToDiary}
            className="px-5 py-2.5 bg-bar hover:bg-ink text-paper text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tulis Cerita Aromamu</span>
          </button>
        </div>
      </div>

      {/* ── SECTION: TOP COMMUNITY-VOTED PERFUMES ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            <span>Parfum Terpopuler Pilihan Komunitas</span>
          </h2>
          <span className="text-xs text-secondary font-mono">Berdasarkan ulasan & rotasi semprot</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topVotedPerfumes.map((p, idx) => (
            <div 
              key={p.id}
              className="bg-white border border-hairline p-4 flex flex-col justify-between hover:border-ink transition"
            >
              <div>
                <div className="flex justify-between items-center text-[12px] font-mono text-secondary">
                  <span>#{idx + 1} TERFAVORIT</span>
                  <span className="px-1.5 py-0.5 bg-surface border border-hairline uppercase">{p.origin}</span>
                </div>
                <h3 
                  onClick={() => onSelectPerfume(p.id)}
                  className="font-serif text-lg font-bold mt-2 cursor-pointer hover:underline"
                >
                  {p.name}
                </h3>
                <p className="text-xs text-secondary font-mono">{p.brand} · {p.concentration}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-accent">
                  <span>★ {p.rating_seed.toFixed(1)}</span>
                  <span className="text-warm">·</span>
                  <span className="text-secondary">{formatCurrency(p.reference_price_idr, locale)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectPerfume(p.id)}
                  className="text-xs underline font-semibold hover:text-ink text-secondary"
                >
                  Lihat Notes
                </button>
                <button
                  onClick={() => onOpenTryItFirst(p.id)}
                  className="px-2.5 py-1 bg-surface hover:bg-mist border border-hairline text-xs font-mono transition"
                >
                  Coba Decant
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION: PUBLIC SCENT STORIES FEED ── */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-3">
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Kisah Aroma Terbaru (Public Stories)</span>
          </h2>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-secondary mr-2">Filter Suasana:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'kencan', label: 'Kencan' },
              { id: 'kantor', label: 'Kantor' },
              { id: 'hujan', label: 'Hujan' },
              { id: 'santai', label: 'Santai' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTag(tab.id)}
                className={`px-2.5 py-1 transition border ${
                  filterTag === tab.id 
                    ? 'bg-bar text-paper border-bar' 
                    : 'bg-white border-hairline text-secondary hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredStories.map(story => (
            <article 
              key={story.id}
              className="bg-white border border-hairline p-6 space-y-4 hover:border-border transition"
            >
              <div className="flex flex-wrap justify-between items-start gap-2 border-b border-hairline pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-mist border border-hairline flex items-center justify-center font-serif font-bold text-sm text-accent">
                    {story.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-bar">{story.author}</p>
                    <p className="text-[12px] text-secondary font-mono">{story.city} · {story.date}</p>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectPerfume(story.perfumeId)}
                  className="px-2.5 py-1 bg-surface border border-hairline text-xs cursor-pointer hover:bg-mist transition flex items-center gap-1.5"
                >
                  <Droplet className="w-3 h-3 text-accent" />
                  <span className="font-serif font-bold">{story.perfumeName}</span>
                  <span className="text-secondary font-mono">({story.brand})</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-bar mb-1">
                  "{story.title}"
                </h3>
                <p className="text-xs text-bar leading-relaxed whitespace-pre-line font-sans">
                  {story.body}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono text-secondary">
                <span className="px-2 py-0.5 bg-surface border border-hairline">
                  Acara: {story.occasion}
                </span>
                <span className="px-2 py-0.5 bg-surface border border-hairline">
                  Suasana: {story.mood}
                </span>
              </div>

              {/* Action bar: Likes, Comments, Share */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(story.id)}
                    className={`flex items-center gap-1.5 transition ${
                      story.isLiked ? 'text-error font-bold' : 'text-secondary hover:text-error'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${story.isLiked ? 'fill-current' : ''}`} />
                    <span>{story.likes} Suka</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentStoryId(activeCommentStoryId === story.id ? null : story.id)}
                    className="flex items-center gap-1.5 text-secondary hover:text-ink transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{story.comments.length} Komentar</span>
                  </button>
                </div>

                <button
                  onClick={() => handleShareStory(story)}
                  className="flex items-center gap-1 text-secondary hover:text-ink transition font-mono text-[12px]"
                >
                  {copiedShareId === story.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Comments Section Drawer */}
              {activeCommentStoryId === story.id && (
                <div className="bg-paper border border-hairline p-4 mt-3 space-y-3">
                  <h4 className="font-serif font-bold text-sm">Komentar Komunitas:</h4>
                  {story.comments.length === 0 ? (
                    <p className="text-xs text-secondary italic">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
                  ) : (
                    <div className="space-y-2">
                      {story.comments.map(c => (
                        <div key={c.id} className="text-xs bg-white border border-hairline p-2 space-y-0.5">
                          <div className="flex justify-between font-mono text-[12px] text-secondary">
                            <strong className="text-ink">{c.author}</strong>
                            <span>{c.time}</span>
                          </div>
                          <p className="text-bar">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddComment(story.id);
                      }}
                      placeholder="Tulis tanggapan atau pengalamanmu..."
                      className="flex-1 bg-white border border-bar px-3 py-1.5 text-xs focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleAddComment(story.id)}
                      className="px-3 py-1.5 bg-bar hover:bg-ink text-paper text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};
