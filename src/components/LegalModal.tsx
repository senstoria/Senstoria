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
import { Locale, translations } from '../lib/i18n.ts';

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
      className="fixed inset-0 bg-ink/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-paper border border-bar max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 relative text-ink">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label={translations[locale].legalModal.closeAria}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-ink border border-transparent hover:border-hairline transition focus:outline-hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-hairline pb-4 space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-[12px] uppercase font-mono tracking-widest text-secondary font-medium">
              {translations[locale].legalModal.kicker}
            </span>
            <span className="text-[12px] font-mono bg-paper border border-hairline px-2 py-0.5 text-secondary">
              UU PDP No. 27/2022
            </span>
          </div>
          <h2 id="legal-modal-title" className="font-serif text-[24px] leading-[32px] md:text-[32px] md:leading-[40px] font-normal text-ink">
            {translations[locale].legalModal.title}
          </h2>
          <p className="text-[14px] text-secondary">
            {translations[locale].legalModal.subtitle}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline text-[12px] overflow-x-auto gap-2">
          {[
            { id: 'privacy' as const, label: translations[locale].legalModal.tabPrivacy, icon: Lock },
            { id: 'terms' as const, label: translations[locale].legalModal.tabTerms, icon: Scale },
            { id: 'affiliate' as const, label: translations[locale].legalModal.tabAffiliate, icon: FileText },
            { id: 'data_rights' as const, label: translations[locale].legalModal.tabDataRights, icon: ShieldCheck },
            { id: 'contact' as const, label: translations[locale].legalModal.tabContact, icon: Mail }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 pt-1 px-3 font-medium flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                  isActive 
                    ? 'border-ink text-ink' 
                    : 'border-transparent text-secondary hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: KEBIJAKAN PRIVASI */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 text-[12px] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-surface border border-hairline space-y-1">
              <span className="font-medium text-ink block">Kepatuhan Hukum Pelindungan Data Pribadi (UU No. 27 Tahun 2022)</span>
              <p className="text-[12px] text-secondary">
                Senstoria beroperasi sebagai Pengendali Data Pribadi yang tunduk sepenuhnya pada peraturan perundang-undangan Republik Indonesia. Pemrosesan data hanya dilakukan dengan persetujuan eksplisit Anda.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">1. Data yang Kami Kumpulkan</h4>
              <p className="text-bar">
                Kami hanya memproses data yang Anda berikan secara sukarela untuk kepentingan personalisasi wewangian: catatan pemakaian (wear logs), daftar koleksi lemari pribadi, cerita aroma, ulasan, serta preferensi kuis Scent Finder. Kami tidak menjual data Anda kepada pihak ketiga pengiklan manapun.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">2. Dasar Hukum Pemrosesan</h4>
              <p className="text-bar">
                Pemrosesan data profil dan riwayat semprot dilakukan berlandaskan persetujuan eksplisit (consent) subjek data sesuai Pasal 20 ayat (2) huruf a UU PDP untuk pelaksanaan layanan kurasi wewangian independen.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">3. Hak Subjek Data</h4>
              <p className="text-bar">
                Anda memiliki hak penuh untuk mengakses data pribadi, memperbaiki data yang tidak akurat, menarik kembali persetujuan pemrosesan, memperoleh salinan portabel (JSON), serta hak penghapusan/pemusnahan data akun Anda secara permanen setiap saat.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SYARAT & KETENTUAN */}
        {activeTab === 'terms' && (
          <div className="space-y-4 text-[12px] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-surface border border-hairline space-y-1">
              <span className="font-medium text-ink block">Prinsip Kurasi & Integritas Independen</span>
              <p className="text-[12px] text-secondary">
                Senstoria adalah platform kurasi wewangian independen. Seluruh skor kecocokan, piramida notes, dan indeks performa disusun berdasarkan riset komparatif tanpa sponsor komersial dari brand manapun.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">1. Batas Usia Minimum (18+)</h4>
              <p className="text-bar">
                Layanan ini ditujukan untuk pengguna berusia minimal 18 tahun. Pendaftaran akun memerlukan verifikasi tanggal lahir untuk kepatuhan perlindungan privasi anak di ranah digital.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">2. Standar Ulasan & Cerita Komunitas</h4>
              <p className="text-bar">
                Setiap ulasan dan cerita memori yang diunggah ke Senstoria harus mencerminkan pengalaman pemakaian nyata di kulit (wear experience). Konten spam, promosi tersembunyi, atau ujaran kebencian akan dimoderasi secara berkala oleh kurator platform.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PENGUNGKAPAN AFILIASI */}
        {activeTab === 'affiliate' && (
          <div className="space-y-4 text-[12px] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-surface border border-hairline space-y-1">
              <span className="font-medium text-ink block">Keterbukaan Transparan (Affiliate Disclosure)</span>
              <p className="text-[12px] text-secondary">
                Sesuai dengan pedoman perlindungan konsumen dan praktik transparansi digital, kami menginformasikan bahwa sebagian tautan pembelian ke marketplace resmi (Shopee & Tokopedia) merupakan tautan afiliasi.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">1. Jaminan Nol-Markup (Zero-Markup Guarantee)</h4>
              <p className="text-secondary">
                Harga yang Anda bayarkan di marketplace mitra adalah 100% sama dengan harga reguler toko resmi. Kami tidak menaikkan harga sepeser pun.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-medium text-[16px] text-ink">2. Domain Allowlist yang Terverifikasi Aman</h4>
              <p className="text-secondary">
                Seluruh tautan belanja diarahkan melalui endpoint 302 yang terlindungi dengan domain allowlist resmi: Shopee Mall dan Tokopedia Official.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PUSAT HAK DATA & EKSPOR */}
        {activeTab === 'data_rights' && (
          <div className="space-y-5 text-[12px] max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Export Section */}
            <div className="p-4 bg-paper border border-hairline space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-bar" />
                    <h4 className="font-sans font-medium text-[16px] text-ink">Hak Portabilitas Data (Pasal 7 UU PDP)</h4>
                  </div>
                  <p className="text-[12px] text-secondary">
                    Unduh seluruh data profil, koleksi botol, catatan pemakaian, cerita aroma, ulasan, preferensi kuis, dan riwayat pesanan dalam format JSON terstruktur.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportPersonalData}
                  className="px-4 py-2 bg-bar hover:bg-ink text-paper font-medium text-[12px] transition flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? translations[locale].legalModal.exporting : translations[locale].legalModal.downloadData}</span>
                </button>
              </div>

              {exportSuccess && (
                <div className="p-3 bg-surface border border-hairline text-ink text-[12px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-bar" />
                  <span>{translations[locale].legalModal.exportSuccess}</span>
                </div>
              )}
            </div>

            {/* Account Erasure Section */}
            <div className="p-4 bg-surface border border-error space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-error" />
                  <h4 className="font-sans font-medium text-[16px] text-error">
                    {translations[locale].legalModal.erasureTitle}
                  </h4>
                </div>
                <p className="text-[12px] text-secondary">
                  {translations[locale].legalModal.erasureBody}
                </p>
              </div>

              {deletionSuccess ? (
                <div className="p-3 bg-paper border border-error text-error font-medium text-[12px]">
                  {translations[locale].legalModal.deletionSuccess}
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-hairline">
                  <label className="block text-[12px] font-medium text-error">
                    {translations[locale].legalModal.deleteConfirmBefore}<strong>HAPUS DATA</strong>{translations[locale].legalModal.deleteConfirmAfter}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={confirmDeleteText}
                      onChange={e => setConfirmDeleteText(e.target.value)}
                      placeholder="HAPUS DATA"
                      className="p-2.5 bg-paper border border-border text-[12px] font-mono focus:border-error focus:outline-hidden max-w-xs uppercase"
                    />
                    <button
                      type="button"
                      disabled={confirmDeleteText.trim().toUpperCase() !== 'HAPUS DATA'}
                      onClick={handleExecuteDeletion}
                      className="px-4 py-2 bg-error hover:bg-error/90 text-paper font-medium text-[12px] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {translations[locale].legalModal.destroyButton}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: KONTAK DPO & BANTUAN */}
        {activeTab === 'contact' && (
          <div className="space-y-4 text-[12px] max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-paper border border-hairline space-y-2">
                <span className="font-mono text-[12px] text-secondary uppercase block">Petugas Pelindungan Data (DPO)</span>
                <p className="font-medium text-[14px] text-ink">Data Protection Officer Senstoria</p>
                <p className="text-secondary">
                  Email: <a href="mailto:dpo@senstoria.id" className="underline font-mono text-ink">dpo@senstoria.id</a>
                </p>
                <p className="text-secondary">
                  Respon Permintaan Data: Maksimal 3 x 24 jam kerja sesuai ketentuan UU PDP.
                </p>
              </div>

              <div className="p-4 bg-paper border border-hairline space-y-2">
                <span className="font-mono text-[12px] text-secondary uppercase block">Kantor & Korespondensi</span>
                <p className="font-medium text-[14px] text-ink">Senstoria Atelier Indonesia</p>
                <p className="text-secondary">
                  Kawasan Senopati, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12190
                </p>
              </div>
            </div>

            <form onSubmit={handleSendContact} className="p-4 bg-surface border border-hairline space-y-3">
              <h4 className="font-sans font-medium text-[16px] text-ink">{translations[locale].legalModal.contactTitle}</h4>
              
              <div className="space-y-1">
                <label className="font-medium block text-ink">{translations[locale].legalModal.subjectLabel}</label>
                <select
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-border text-[12px] focus:outline-hidden"
                >
                  <option value="">{translations[locale].legalModal.topicPlaceholder}</option>
                  <option value="data_inquiry">{translations[locale].legalModal.topicPrivacy}</option>
                  <option value="data_correction">{translations[locale].legalModal.topicCorrection}</option>
                  <option value="data_erasure">{translations[locale].legalModal.topicErasure}</option>
                  <option value="general_help">{translations[locale].legalModal.topicGeneral}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium block text-ink">{translations[locale].legalModal.messageLabel}</label>
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder={translations[locale].legalModal.messagePlaceholder}
                  className="w-full p-2.5 bg-paper border border-border text-[12px] focus:outline-hidden resize-none"
                />
              </div>

              {contactSent ? (
                <div className="p-3 bg-surface border border-hairline text-ink text-[12px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-bar" />
                  <span>{translations[locale].legalModal.contactSent}</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-bar hover:bg-ink text-paper font-medium text-[12px] transition"
                >
                  {translations[locale].legalModal.contactSubmit}
                </button>
              )}
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-hairline flex justify-between items-center text-[12px]">
          <span className="text-[12px] text-secondary font-mono">
            Senstoria v1.0 · UU PDP Compliant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-bar hover:bg-ink text-paper font-medium text-[12px] transition"
          >
            {translations[locale].compareView.tutup}
          </button>
        </div>

      </div>
    </div>
  );
}
