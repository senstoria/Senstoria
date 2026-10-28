import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, BackendNotConfiguredError } from '../lib/firebase.ts';

/**
 * Sprint 1 — REAL Firebase Authentication. Everything the previous version
 * faked is gone: no localStorage user, no ignored passwords, no auto-verify,
 * no role from an email substring, no client-side OTP.
 *
 * - Signup: 18+ age gate (birth date is used ONLY for the check and is never
 *   stored — no birth-date field exists in the user document, C1/BR-12).
 *   Email verification is required before the account can sign in.
 * - Login: unverified accounts are signed straight back out and told to
 *   verify first. Roles come ONLY from the Firebase custom claim `admin: true`
 *   (§5.4 bootstrap); there is no email-based admin.
 * - WhatsApp OTP: removed. No gateway exists; the tab is hidden in Sprint 1
 *   instead of showing a fake one.
 * - Demo mode is an EXPLICIT opt-in (viewing labelled sample data), never
 *   the default for a logged-out visitor.
 */

export type UserRole = 'user' | 'admin';

export const CONSENT_VERSION = '1.0';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  nickname: string;
  role: UserRole;
  isAdmin: boolean;
  isEmailVerified: boolean;
  ageGatePassed: boolean;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

type Locale = 'id' | 'en';

const MESSAGES: Record<string, Record<Locale, string>> = {
  backend_not_configured: {
    id: 'Backend belum terhubung. Akun belum dapat dibuat atau dipakai — hubungi pengelola.',
    en: 'The backend is not connected yet. Accounts cannot be created or used — please contact the administrator.',
  },
  email_in_use: {
    id: 'Email ini sudah terdaftar. Coba masuk, atau atur ulang kata sandi bila lupa.',
    en: 'This email is already registered. Try signing in, or reset your password if you forgot it.',
  },
  weak_password: {
    id: 'Kata sandi minimal 6 karakter.',
    en: 'Password must be at least 6 characters.',
  },
  invalid_email: {
    id: 'Format email tidak valid.',
    en: 'The email format is invalid.',
  },
  invalid_credential: {
    id: 'Email atau kata sandi salah.',
    en: 'Incorrect email or password.',
  },
  user_not_found: {
    id: 'Akun dengan email ini tidak ditemukan.',
    en: 'No account was found for this email.',
  },
  too_many_requests: {
    id: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    en: 'Too many attempts. Wait a moment and try again.',
  },
  unverified: {
    id: 'Email belum diverifikasi. Periksa kotak masukmu untuk link verifikasi, atau minta kirim ulang di bawah.',
    en: 'Your email is not verified yet. Check your inbox for the verification link, or request a resend below.',
  },
  terms_required: {
    id: 'Syarat & Kebijakan Privasi harus disetujui.',
    en: 'You must accept the Terms & Privacy Policy.',
  },
  underage: {
    id: 'Pendaftaran akun hanya diperuntukkan untuk usia 18 tahun ke atas. Kamu tetap dapat menjelajah katalog dan mencoba Scent Finder dalam mode tamu.',
    en: 'Accounts are only for ages 18 and over. You can still browse the catalog and try the Scent Finder as a guest.',
  },
  generic: {
    id: 'Terjadi kesalahan. Coba lagi sebentar lagi.',
    en: 'Something went wrong. Please try again shortly.',
  },
};

function messageFor(code: string, locale: Locale): string {
  const key =
    code === 'auth/email-already-in-use' ? 'email_in_use'
    : code === 'auth/weak-password' ? 'weak_password'
    : code === 'auth/invalid-email' ? 'invalid_email'
    : code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'invalid_credential'
    : code === 'auth/user-not-found' ? 'user_not_found'
    : code === 'auth/too-many-requests' ? 'too_many_requests'
    : 'generic';
  return MESSAGES[key][locale];
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface AuthContextType {
  user: UserProfile | null;
  /** Explicit, labelled sample-data viewing. Never the default. */
  isDemoMode: boolean;
  isLoading: boolean;
  backendConfigured: boolean;
  login: (email: string, password: string, locale?: Locale) => Promise<AuthResult>;
  signup: (email: string, password: string, birthDate: string, termsAccepted: boolean, locale?: Locale) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string, locale?: Locale) => Promise<AuthResult>;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  let isAdmin = false;
  try {
    const token = await getIdTokenResult(firebaseUser, false);
    isAdmin = token.claims.admin === true;
  } catch {
    isAdmin = false;
  }

  let nickname: string | undefined;
  let createdAt: string | undefined;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data() as { display_name?: string; created_at?: { toDate?: () => Date } | string };
        nickname = data.display_name;
        const created = data.created_at;
        createdAt = typeof created === 'string' ? created : created?.toDate?.()?.toISOString();
      }
    } catch {
      // Profile document is optional for sign-in; never block auth on it.
    }
  }

  const email = firebaseUser.email ?? '';
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email,
    nickname: nickname ?? firebaseUser.displayName ?? email.split('@')[0] ?? 'Kolektor',
    role: isAdmin ? 'admin' : 'user',
    isAdmin,
    isEmailVerified: firebaseUser.emailVerified,
    ageGatePassed: true,
    createdAt: createdAt ?? firebaseUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('senstoria_demo_mode') === '1';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
      } else {
        setUser(await buildProfile(firebaseUser));
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('senstoria_demo_mode', isDemoMode ? '1' : '0');
    } catch {
      // Demo flag persistence is best-effort only.
    }
  }, [isDemoMode]);

  const login = async (email: string, password: string, locale: Locale = 'id'): Promise<AuthResult> => {
    if (!auth || !isFirebaseConfigured) {
      return { success: false, error: MESSAGES.backend_not_configured[locale] };
    }
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
        } catch {
          // Resend is best-effort; the error below is what matters.
        }
        await signOut(auth);
        return { success: false, error: MESSAGES.unverified[locale] };
      }
      setUser(await buildProfile(credential.user));
      return { success: true };
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      return { success: false, error: messageFor(code, locale) };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    birthDate: string,
    termsAccepted: boolean,
    locale: Locale = 'id'
  ): Promise<AuthResult> => {
    if (!termsAccepted) {
      return { success: false, error: MESSAGES.terms_required[locale] };
    }
    // Age gate: the birth date is checked here and then DISCARDED. It is
    // never written to Firestore, localStorage, or any user document (C1).
    if (calculateAge(birthDate) < 18) {
      return { success: false, error: MESSAGES.underage[locale] };
    }
    if (!auth || !db || !isFirebaseConfigured) {
      return { success: false, error: MESSAGES.backend_not_configured[locale] };
    }
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      await sendEmailVerification(firebaseUser);
      // User document: NO birth date anywhere. Only the boolean proof.
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        display_name: email.split('@')[0] ?? '',
        birthdate_verified_18plus: true,
        consent_version: CONSENT_VERSION,
        consent_at: serverTimestamp(),
        locale,
        created_at: serverTimestamp(),
      });
      // The new account stays signed in but unverified; login() will refuse
      // it until verification. Sign out now so no unverified session lingers.
      await signOut(auth);
      return { success: true, needsVerification: true };
    } catch (error) {
      if (error instanceof BackendNotConfiguredError) {
        return { success: false, error: MESSAGES.backend_not_configured[locale] };
      }
      const code = (error as { code?: string })?.code ?? '';
      return { success: false, error: messageFor(code, locale) };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setIsDemoMode(false);
  };

  const resetPassword = async (email: string, locale: Locale = 'id'): Promise<AuthResult> => {
    if (!auth || !isFirebaseConfigured) {
      return { success: false, error: MESSAGES.backend_not_configured[locale] };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      return { success: false, error: messageFor(code, locale) };
    }
  };

  const enableDemoMode = () => setIsDemoMode(true);
  const disableDemoMode = () => setIsDemoMode(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isDemoMode,
        isLoading,
        backendConfigured: isFirebaseConfigured,
        login,
        signup,
        logout,
        resetPassword,
              enableDemoMode,
        disableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
