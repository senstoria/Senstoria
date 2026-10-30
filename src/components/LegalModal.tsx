import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Trash2, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  Mail, 
  UserCheck, 
  HelpCircle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Locale, translations } from '../lib/i18n.ts';
import {
  assembleExportDocument,
  EMPTY_SERVER_EXPORT,
  type DeleteOutcome,
  type ServerExportData,
} from '../lib/dataPortability.ts';

export type LegalTab = 'data_rights' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  locale: Locale;
  userEmail?: string;
  /** True when a Firebase user is signed in (server export/delete apply). */
  isSignedIn?: boolean;
  /**
   * Sprint 7: fetch the signed-in user's server data. Rejects on read
   * failure (the modal then shows exportError instead of an incomplete file).
   * Returns null when there is no server data (signed out / no backend).
   */
  onExportServerData?: () => Promise<ServerExportData | null>;
  /**
   * Sprint 7: actually delete the user's data. Returns null for the
   * signed-out local-only path; otherwise a DeleteOutcome describing what
   * was deleted (server docs + whether the Auth account was removed).
   */
  onDeleteAccountData?: () => Promise<DeleteOutcome | null>;
}

export function LegalModal({
  isOpen,
  initialTab = 'data_rights',
  onClose,
  locale,
  userEmail,
  isSignedIn = false,
  onExportServerData,
  onDeleteAccountData
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const [deletionNotice, setDeletionNotice] = useState<string | null>(null);

  // D-V7 close behaviours (Sprint 6): Escape closes, Tab is trapped inside the
  // panel, focus is restored by the browser order on unmount. The shell stays
  // LegalModal's own long-form scroll layout; only close/focus behaviour is
  // unified with BottomSheetOrModal.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // UU PDP Pasal 7: Hak Portabilitas Data (Ekspor Data Pribadi Lengkap)
  // Sprint 7: the download now merges the server export (Firestore, owner
  // reads) with the device-local snapshot. A failed server read aborts the
  // download — a local-only file for a signed-in user would be incomplete
  // and the old success message would have lied about it.
  const handleExportPersonalData = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(false);
    try {
      let server: ServerExportData | null = null;
      if (isSignedIn && onExportServerData) {
        server = await onExportServerData();
      }
      const readLocal = <T,>(key: string, fallback: T): T => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? (JSON.parse(raw) as T) : fallback;
        } catch {
          return fallback;
        }
      };
      const localSnapshot: Record<string, unknown> = {
        profile: readLocal('senstoria_auth_user', {}),
        library_bottles: readLocal('senstoria_user_bottles', []),
        wear_logs: readLocal('senstoria_wear_logs', []),
        scent_stories: readLocal('senstoria_scent_stories', []),
        reviews: readLocal('senstoria_reviews', []),
        scent_finder_preferences: readLocal('senstoria_quiz_answers', {}),
        saved_taste_profile: readLocal('senstoria_saved_taste_profile', {}),
        sample_orders: readLocal('senstoria_sample_orders', []),
        waitlist_entries: readLocal('senstoria_waitlist_entries', []),
      };
      const exportPayload = assembleExportDocument(
        server ?? EMPTY_SERVER_EXPORT,
        localSnapshot,
        userEmail ?? null,
      );

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
    } catch {
      // Server read failed: do not hand the user an incomplete archive.
      setExportError(true);
    } finally {
      setIsExporting(false);
    }
  };

  // UU PDP Pasal 8: Hak Menghapus Data / Right to Erasure
  // Sprint 7: onDeleteAccountData now really deletes server documents and
  // attempts Auth deletion. The modal reports the honest outcome:
  //  - null outcome (signed out): local-only wipe, old behaviour.
  //  - authDeleted: full deletion, reload as before.
  //  - needsRelogin: server docs deleted, login account still exists —
  //    the user must sign out/in and repeat; NO reload, NO success claim.
  //  - anything else / throw: failure notice, nothing claimed.
  const handleExecuteDeletion = async () => {
    if (confirmDeleteText.trim().toUpperCase() !== 'HAPUS DATA') return;
    setDeletionNotice(null);

    if (onDeleteAccountData) {
      try {
        const outcome = await onDeleteAccountData();
        if (outcome === null || outcome.authDeleted) {
          setDeletionSuccess(true);
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2500);
          return;
        }
        if (outcome.needsRelogin) {
          setDeletionNotice(
            translations[locale].legalModal.deletionNeedsRelogin.replace(
              '{count}',
              String(outcome.serverDocsDeleted),
            ),
          );
          return;
        }
        setDeletionNotice(translations[locale].legalModal.deletionError);
        return;
      } catch {
        setDeletionNotice(translations[locale].legalModal.deletionError);
        return;
      }
    }

    localStorage.removeItem('senstoria_user_bottles');
    localStorage.removeItem('senstoria_wear_logs');
    localStorage.removeItem('senstoria_scent_stories');
    localStorage.removeItem('senstoria_reviews');
    localStorage.removeItem('senstoria_quiz_answers');
    localStorage.removeItem('senstoria_saved_taste_profile');
    localStorage.removeItem('senstoria_sample_orders');
    localStorage.removeItem('senstoria_waitlist_entries');
    localStorage.removeItem('senstoria_auth_user');

    setDeletionSuccess(true);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 2500);
  };


  return (
    <div 
      className="fixed inset-0 bg-ink/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={panelRef} className="bg-paper border border-bar max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 relative text-ink">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label={translations[locale].legalModal.closeAria}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-ink border border-transparent hover:border-hairline transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
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

        {/* TAB 4: PUSAT HAK DATA & EKSPOR */}
        {activeTab === 'data_rights' && (
          <div className="space-y-5 text-[12px] max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Export Section */}
            <div className="p-4 bg-paper border border-hairline space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-bar" />
                    <h4 className="font-sans font-medium text-[16px] text-ink">{translations[locale].legalModal.portabilityTitle}</h4>
                  </div>
                  <p className="text-[12px] text-secondary">
                    {translations[locale].legalModal.portabilityBody}
                  </p>
                  <p className="text-[12px] text-secondary">
                    {translations[locale].legalModal.exportIncludesServer}
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

              {exportError && (
                <div className="p-3 bg-paper border border-error text-error text-[12px] flex items-center gap-2" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{translations[locale].legalModal.exportError}</span>
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
                  {deletionNotice && (
                    <div className="p-3 bg-paper border border-error text-error text-[12px]" role="alert">
                      {deletionNotice}
                    </div>
                  )}
                  <label className="block text-[12px] font-medium text-error">
                    {translations[locale].legalModal.deleteConfirmBefore}<strong>HAPUS DATA</strong>{translations[locale].legalModal.deleteConfirmAfter}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={confirmDeleteText}
                      onChange={e => setConfirmDeleteText(e.target.value)}
                      placeholder="HAPUS DATA"
                      className="p-2.5 bg-paper border border-border text-[12px] font-mono focus:border-error focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent max-w-xs uppercase"
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
                <span className="font-mono text-[12px] text-secondary uppercase block">{translations[locale].legalModal.contactDpoTitle}</span>
                <p className="font-medium text-[14px] text-ink">{translations[locale].legalModal.contactDpoName}</p>
                <p className="text-secondary">
                  Email: <a href="mailto:dpo@senstoria.id" className="underline font-mono text-ink">dpo@senstoria.id</a>
                </p>
                <p className="text-secondary">
                  {translations[locale].legalModal.contactDpoResponse}
                </p>
              </div>

              <div className="p-4 bg-paper border border-hairline space-y-2">
                <span className="font-mono text-[12px] text-secondary uppercase block">{translations[locale].legalModal.contactOfficeTitle}</span>
                <p className="font-medium text-[14px] text-ink">{translations[locale].legalModal.contactOfficeName}</p>
                <p className="text-secondary">
                  {translations[locale].legalModal.contactOfficeAddress}
                </p>
              </div>
            </div>

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
