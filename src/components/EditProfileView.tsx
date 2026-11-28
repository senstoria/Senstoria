import React, { useState } from 'react';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { translations, type Locale } from '../lib/i18n.ts';
import { initialFromName } from '../lib/profileN6.ts';
import type { UserProfile } from '../context/AuthContext.tsx';

interface EditProfileViewProps {
  user: UserProfile | null;
  /** Simpan nama; mengembalikan pesan error (sudah diterjemahkan) atau null bila sukses. */
  onSaveName: (name: string) => Promise<string | null>;
  onBack: () => void;
  onSignIn: () => void;
  onToast: (message: string) => void;
  locale: Locale;
}

/**
 * Fase N6 (G2 + P1): Edit Profil.
 * - "Ganti Foto" DITAMPILKAN dengan pesan jujur (keputusan founder
 *   28 Nov 2026): upload foto belum aktif sampai Storage + UI admin
 *   upload jalan — tombol tidak pernah pura-pura mengunggah (tidak ada
 *   input file; ketuk menampilkan catatan jujur yang menetap).
 * - Field: Nama lengkap (bisa diubah) + Email (hanya tampil — perubahan
 *   email butuh verifikasi ulang + re-auth, di luar fase ini).
 * - TIDAK ADA field tanggal lahir: keputusan founder 30 Okt 2026
 *   menghapus semua penanganan tanggal lahir (aturan 18+ dibuang);
 *   rencana G2 yang menyebut "Tanggal lahir (opsional)" tidak diikuti.
 * - Simpan → updateDisplayName (Auth displayName + dokumen Firestore).
 */
export const EditProfileView: React.FC<EditProfileViewProps> = ({
  user,
  onSaveName,
  onBack,
  onSignIn,
  onToast,
  locale,
}) => {
  const t = translations[locale];
  const [name, setName] = useState(user?.nickname ?? '');
  const [photoNoteVisible, setPhotoNoteVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div data-testid="edit-profile-screen" className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.editProfileView.backToProfile}</span>
        </button>
        <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
          {t.editProfileView.title}
        </h1>
        <p className="text-[14px] leading-[20px] text-secondary">{t.editProfileView.signInRequired}</p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center justify-center min-h-[48px] rounded-full px-6 text-[14px] font-bold bg-bar hover:bg-ink text-paper transition active:scale-[0.97] cursor-pointer"
        >
          {t.profileView.signIn}
        </button>
      </div>
    );
  }

  const initial = initialFromName(user.nickname);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.editProfileView.nameRequired);
      return;
    }
    setError(null);
    setSaving(true);
    const err = await onSaveName(trimmed);
    setSaving(false);
    if (!err) onToast(t.editProfileView.saved);
    else setError(err);
  };

  return (
    <div data-testid="edit-profile-screen" className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start whitespace-nowrap min-h-[44px] text-[12px] font-medium text-secondary hover:text-ink flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.editProfileView.backToProfile}</span>
      </button>

      <h1 className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink">
        {t.editProfileView.title}
      </h1>

      {/* Avatar + Ganti Foto (pesan jujur, bukan upload pura-pura). */}
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-[24px] font-extrabold text-ink flex-none">
          {initial ? initial : <UserIcon className="w-7 h-7 text-secondary" aria-hidden="true" />}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setPhotoNoteVisible(true)}
            className="inline-flex items-center justify-center min-h-[44px] rounded-full px-5 text-[14px] font-bold border border-border bg-paper text-ink hover:bg-surface transition active:scale-[0.97] cursor-pointer"
          >
            {t.editProfileView.changePhoto}
          </button>
        </div>
      </div>
      {photoNoteVisible && (
        <p
          data-testid="photo-upload-note"
          className="text-[13px] leading-[18px] text-muted"
        >
          {t.editProfileView.photoUnavailable}
        </p>
      )}

      {/* Nama lengkap (bisa diubah). */}
      <div className="space-y-2">
        <label htmlFor="edit-profile-name" className="block text-[14px] font-bold text-ink">
          {t.editProfileView.nameLabel}
        </label>
        <input
          id="edit-profile-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
          className="w-full min-h-[48px] rounded-lg border border-border bg-paper px-4 text-[14px] text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus"
        />
      </div>

      {/* Email (hanya tampil). */}
      <div className="space-y-2">
        <span className="block text-[14px] font-bold text-ink">{t.editProfileView.emailLabel}</span>
        <p className="text-[14px] leading-[20px] text-ink break-all">{user.email}</p>
        <p className="text-[13px] leading-[18px] text-muted">{t.editProfileView.emailHint}</p>
      </div>

      {error && (
        <p role="alert" className="text-[13px] leading-[18px] text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full min-h-[48px] rounded-full bg-bar hover:bg-ink text-paper text-[14px] font-bold transition active:scale-[0.97] cursor-pointer disabled:opacity-60"
      >
        {t.editProfileView.save}
      </button>
    </div>
  );
};
