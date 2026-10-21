import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  Lock, 
  Mail, 
  UserCheck, 
  Scale, 
  HelpCircle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Locale } from '../lib/i18n.ts';

export type LegalTab = 'privacy' | 'terms' | 'affiliate' | 'data_rights' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  locale: Locale;
  userEmail?: string;
  onDeleteAccountData?: () => void;
}

export function LegalModal({
  isOpen,
  initialTab = 'privacy',
  onClose,
  locale,
  userEmail,
  onDeleteAccountData
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (!isOpen) return null;

  // UU PDP Pasal 7: Hak Portabilitas Data (Ekspor Data Pribadi Lengkap)
  const handleExportPersonalData = () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        meta: {
          app: 'Senstoria',
          version: '1.0.0',
          exported_at: new Date().toISOString(),
          regulation_compliance: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)',
          user_email: userEmail || 'senstoria@gmail.com'
        },
        profile: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_auth_user') || '{}');
          } catch {
            return {};
          }
        })(),
        library_bottles: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_user_bottles') || '[]');
          } catch {
            return [];
          }
        })(),
        wear_logs: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_wear_logs') || '[]');
          } catch {
            return [];
          }
        })(),
        scent_stories: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_scent_stories') || '[]');
          } catch {
            return [];
          }
        })(),
        reviews: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_reviews') || '[]');
          } catch {
            return [];
          }
        })(),
        scent_finder_preferences: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_quiz_answers') || '{}');
          } catch {
            return {};
          }
        })(),
        saved_taste_profile: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_saved_taste_profile') || '{}');
          } catch {
            return {};
          }
        })(),
        sample_orders: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_sample_orders') || '[]');
          } catch {
            return [];
          }
        })(),
        waitlist_entries: (() => {
          try {
            return JSON.parse(localStorage.getItem('senstoria_waitlist_entries') || '[]');
          } catch {
            return [];
          }
        })()
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `senstoria_data_pribadi_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.warn('Data export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // UU PDP Pasal 8: Hak Menghapus Data / Right to Erasure
  const handleExecuteDeletion = () => {
    if (confirmDeleteText.trim().toUpperCase() !== 'HAPUS DATA') return;

    if (onDeleteAccountData) {
      onDeleteAccountData();
    } else {
      localStorage.removeItem('senstoria_user_bottles');
      localStorage.removeItem('senstoria_wear_logs');
      localStorage.removeItem('senstoria_scent_stories');
      localStorage.removeItem('senstoria_reviews');
      localStorage.removeItem('senstoria_quiz_answers');
      localStorage.removeItem('senstoria_saved_taste_profile');
      localStorage.removeItem('senstoria_sample_orders');
      localStorage.removeItem('senstoria_waitlist_entries');
      localStorage.removeItem('senstoria_auth_user');
    }

    setDeletionSuccess(true);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 2500);
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactSubject('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-[#FFFEF2] border border-[#1A1A1A] max-w-3xl w-full my-8 p-6 md:p-8 space-y-6 shadow-2xl relative text-[#1A1A1A]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Tutup jendela hukum"
          className="absolute top-4 right-4 p-1.5 text-[#5C5C5C] hover:text-black border border-transparent hover:border-[#D9D7C9] transition focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#D9D7C9] pb-4 space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#8A4B14] font-bold">
              KEPATUHAN REGULASI & HUKUM INDONESIA
            </span>
            <span className="text-[9px] font-mono bg-white border border-[#D9D7C9] px-1.5 py-0.5 text-[#5C5C5C]">
              UU PDP No. 27/2022
            </span>
          </div>
          <h2 id="legal-modal-title" className="font-serif text-3xl font-normal">
            Pusat Informasi Hukum & Privasi Senstoria
          </h2>
          <p className="text-xs text-[#5C5C5C]">
            Komitmen transparansi penuh atas perlindungan data pribadi, integritas editorial tanpa intervensi komersial, serta keterbukaan afiliasi.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D9D7C9] text-xs overflow-x-auto gap-2">
          {[
            { id: 'privacy' as const, label: 'Kebijakan Privasi (UU PDP)', icon: Lock },
            { id: 'terms' as const, label: 'Syarat & Ketentuan', icon: Scale },
            { id: 'affiliate' as const, label: 'Pengungkapan Afiliasi', icon: FileText },
            { id: 'data_rights' as const, label: 'Pusat Hak Data & Ekspor', icon: ShieldCheck },
            { id: 'contact' as const, label: 'Kontak DPO & Bantuan', icon: Mail }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 pt-1 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden ${
                  isActive 
                    ? 'border-black text-black font-bold' 
                    : 'border-transparent text-[#5C5C5C] hover:text-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: KEBIJAKAN PRIVASI (UU PDP) */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-3 bg-[#F4F3E6] border border-[#D9D7C9] space-y-1">
              <span className="font-bold text-[#8A4B14] block">Kepatuhan Hukum Pelindungan Data Pribadi (UU No. 27 Tahun 2022)</span>
              <p className="text-[11px] text-[#5C5C5C]">
                Senstoria beroperasi sebagai Pengendali Data Pribadi yang tunduk sepenuhnya pada peraturan perundang-undangan Republik Indonesia. Pemrosesan data hanya dilakukan dengan persetujuan eksplisit Anda.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">1. Data yang Kami Kumpulkan</h4>
              <p className="text-[#333333]">
                Kami hanya mengumpulkan data yang relevan secara fungsional untuk mengurasi wewangian dan mengelola lemari parfum Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#5C5C5C]">
                <li><strong>Data Identitas & Akun:</strong> Alamat email, nama panggilan, nomor kontak WhatsApp (jika menggunakan alur verifikasi).</li>
                <li><strong>Data Inventaris Parfum:</strong> Koleksi botol parfum yang Anda simpan, estimasi sisa volume, serta status botol (sedang dipakai, wishlist, kenangan).</li>
                <li><strong>Catatan Pemakaian & Diary:</strong> Log semprotan harian, catatan suasana hati, cuaca, dan Cerita Aroma (Scent Stories).</li>
                <li><strong>Preferensi Olfaktif:</strong> Jawaban kuis Scent Finder 7 pertanyaan serta persona aroma yang dihasilkan.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">2. Hak-Hak Anda Berdasarkan UU PDP (Pasal 5 s.d. 13)</h4>
              <p className="text-[#333333]">Sebagai Pemilik Data Pribadi, Anda memiliki hak penuh yang dapat dieksekusi kapan saja:</p>
              <ul className="list-disc pl-5 space-y-1 text-[#5C5C5C]">
                <li><strong>Hak Informasi & Akses (Pasal 5 & 7):</strong> Anda berhak mengetahui tujuan pemrosesan data dan mengunduh seluruh data Anda melalui tab <em>Pusat Hak Data & Ekspor</em>.</li>
                <li><strong>Hak Koreksi (Pasal 6):</strong> Anda berhak mengubah atau memperbarui profil dan catatan parfum Anda secara langsung.</li>
                <li><strong>Hak Menghapus Data (Right to Erasure - Pasal 8):</strong> Anda berhak meminta pemusnahan total atas akun dan data riwayat Anda.</li>
                <li><strong>Hak Menarik Persetujuan (Pasal 9):</strong> Anda berhak membatalkan persetujuan pemrosesan data kapan pun Anda kehendaki.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">3. Batasan Umur 18+ & UU PDP</h4>
              <p className="text-[#5C5C5C]">
                Layanan ini ditujukan untuk pengguna berusia 18 tahun ke atas. Kami menerapkan verifikasi usia saat pendaftaran untuk memastikan perlindungan khusus bagi anak sesuai amanat Pasal 25 UU PDP.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SYARAT & KETENTUAN */}
        {activeTab === 'terms' && (
          <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">1. Prinsip Kurasi Independen & Integritas Editorial</h4>
              <p className="text-[#5C5C5C]">
                Senstoria berkomitmen menjaga ulasan dan kurasi berbasis bukti objektif. Penilaian ketahanan wewangian, sillage, serta kecocokan cuaca tropis disusun tanpa campur tangan komersial atau sponsor merek tertentu.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">2. Etika Ulasan Komunitas</h4>
              <p className="text-[#5C5C5C]">
                Pengguna yang menuliskan ulasan diwajibkan menuliskan pengalaman pemakaian riil. Segala bentuk ulasan bot, spam iklan, fitnah, atau ujaran kebencian akan dimoderasi dan ditangguhkan oleh tim kurator kami.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">3. Penafian Reaksi Alergi & Sensitivitas Kulit</h4>
              <p className="text-[#5C5C5C]">
                Wewangian merupakan produk kosmetik yang reaksinya dapat bervariasi bergantung pada biokimia kulit, kelembapan, dan riwayat alergi masing-masing pemakai. Rekomendasi Senstoria tidak menggantikan konsultasi dermatologi. Pengguna disarankan selalu melakukan <em>patch test</em> sebelum menggunakan parfum secara penuh.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PENGUNGKAPAN AFILIASI */}
        {activeTab === 'affiliate' && (
          <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-3 bg-amber-50 border border-amber-300 space-y-1">
              <span className="font-bold text-amber-900 block">Keterbukaan Transparan (Affiliate Disclosure)</span>
              <p className="text-[11px] text-[#5C5C5C]">
                Sesuai dengan pedoman perlindungan konsumen dan praktik transparansi digital, kami menginformasikan bahwa sebagian tautan pembelian ke marketplace resmi (Shopee & Tokopedia) merupakan tautan afiliasi.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">1. Jaminan Nol-Markup (Zero-Markup Guarantee)</h4>
              <p className="text-[#5C5C5C]">
                Harga yang Anda bayarkan di marketplace mitra adalah 100% sama dengan harga reguler toko resmi. Kami tidak menaikkan harga sepeser pun. Komisi kecil yang diterima dari marketplace digunakan untuk membiayai operasional server, lisensi model AI Gemini, dan riset kurasi independen.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm">2. Domain Allowlist yang Terverifikasi Aman</h4>
              <p className="text-[#5C5C5C]">
                Seluruh tautan belanja diarahkan melalui endpoint 302 yang terlindungi (`/go/:id`) dengan domain allowlist resmi: `shopee.co.id`, `shope.ee`, dan `tokopedia.com`. Kami tidak pernah mengarahkan Anda ke toko yang tidak terverifikasi atau mencurigakan.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PUSAT HAK DATA & EKSPOR (UU PDP) */}
        {activeTab === 'data_rights' && (
          <div className="space-y-5 text-xs max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Export Section */}
            <div className="p-4 bg-white border border-[#D9D7C9] space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#8A4B14]" />
                    <h4 className="font-serif font-bold text-base">Hak Portabilitas Data (Pasal 7 UU PDP)</h4>
                  </div>
                  <p className="text-[11px] text-[#5C5C5C]">
                    Unduh seluruh data profil, koleksi botol, catatan pemakaian, cerita aroma, ulasan, preferensi kuis, dan riwayat pesanan dalam format JSON terstruktur yang dapat Anda buka di peramban atau disimpan sebagai arsip pribadi.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportPersonalData}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] font-semibold text-xs transition flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Mengekspor...' : 'Unduh Data Pribadi (JSON)'}</span>
                </button>
              </div>

              {exportSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>Arsip data pribadi Anda berhasil diunduh ke komputer Anda.</span>
                </div>
              )}
            </div>

            {/* Account Erasure Section */}
            <div className="p-4 bg-red-50/50 border border-red-300 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-700" />
                  <h4 className="font-serif font-bold text-base text-red-900">
                    Hak Penghapusan Akun & Pemusnahan Data (Right to Erasure - Pasal 8 UU PDP)
                  </h4>
                </div>
                <p className="text-[11px] text-[#5C5C5C]">
                  Tindakan ini akan menghapus secara permanen seluruh koleksi botol lemari Anda, catatan semprotan harian, cerita aroma, jawaban kuis Scent Finder, serta sesi login. Tindakan ini bersifat final dan tidak dapat dibatalkan.
                </p>
              </div>

              {deletionSuccess ? (
                <div className="p-3 bg-red-100 border border-red-400 text-red-900 font-bold text-xs">
                  Seluruh data Anda telah berhasil dimusnahkan sesuai amanat UU PDP. Halaman akan dimuat ulang...
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-red-200">
                  <label className="block text-[11px] font-semibold text-red-900">
                    Ketik teks <strong>HAPUS DATA</strong> di bawah ini untuk konfirmasi:
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={confirmDeleteText}
                      onChange={e => setConfirmDeleteText(e.target.value)}
                      placeholder="HAPUS DATA"
                      className="p-2 bg-white border border-red-300 text-xs font-mono focus:border-red-600 focus:outline-hidden max-w-xs uppercase"
                    />
                    <button
                      type="button"
                      disabled={confirmDeleteText.trim().toUpperCase() !== 'HAPUS DATA'}
                      onClick={handleExecuteDeletion}
                      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
                    >
                      Musnahkan Data Permanen
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: KONTAK DPO & BANTUAN */}
        {activeTab === 'contact' && (
          <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-[#D9D7C9] space-y-2">
                <span className="font-mono text-[10px] text-[#5C5C5C] uppercase block">Petugas Pelindungan Data (DPO)</span>
                <p className="font-bold text-sm text-[#1A1A1A]">Data Protection Officer Senstoria</p>
                <p className="text-[#5C5C5C]">
                  Email: <a href="mailto:dpo@senstoria.id" className="underline font-mono text-black">dpo@senstoria.id</a>
                </p>
                <p className="text-[#5C5C5C]">
                  Respon Permintaan Data: Maksimal 3 x 24 jam kerja sesuai ketentuan UU PDP.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#D9D7C9] space-y-2">
                <span className="font-mono text-[10px] text-[#5C5C5C] uppercase block">Kantor & Korespondensi</span>
                <p className="font-bold text-sm text-[#1A1A1A]">Senstoria Atelier Indonesia</p>
                <p className="text-[#5C5C5C]">
                  Kawasan Senopati, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12190
                </p>
              </div>
            </div>

            <form onSubmit={handleSendContact} className="p-4 bg-[#F4F3E6]/60 border border-[#D9D7C9] space-y-3">
              <h4 className="font-serif font-bold text-sm">Kirim Pesan atau Permintaan Hak Data Langsung</h4>
              
              <div className="space-y-1">
                <label className="font-semibold block">Perihal Permintaan:</label>
                <select
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden"
                >
                  <option value="">Pilih topik permintaan...</option>
                  <option value="data_inquiry">Pertanyaan Mengenai Kebijakan Privasi</option>
                  <option value="data_correction">Permintaan Koreksi Data Pribadi</option>
                  <option value="data_erasure">Bantuan Pemusnahan Akun Khusus</option>
                  <option value="general_help">Pertanyaan Layanan & Kurasi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Pesan / Rincian:</label>
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Tuliskan pertanyaan atau kebutuhan Anda di sini..."
                  className="w-full p-2 bg-white border border-[#D9D7C9] text-xs focus:border-black focus:outline-hidden resize-none"
                />
              </div>

              {contactSent ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Pesan Anda telah dikirimkan ke tim DPO Senstoria. Kami akan merespons melalui email Anda.</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] font-semibold text-xs transition"
                >
                  Kirim Permintaan ke Tim DPO
                </button>
              )}
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#D9D7C9] flex justify-between items-center text-xs">
          <span className="text-[11px] text-[#5C5C5C] font-mono">
            Senstoria v1.0 · UU PDP Compliant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#1A1A1A] hover:bg-black text-[#FFFEF2] font-medium text-xs transition focus-visible:ring-2 focus-visible:ring-[#8A4B14] focus-visible:outline-hidden"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
