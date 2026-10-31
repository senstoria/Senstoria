import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, BackendNotConfiguredError } from '../lib/firebase.ts';
import { translations } from '../lib/i18n.ts';

/**
 * Sprint 1 — REAL Firebase Authentication. Everything the previous version
 * faked is gone: no localStorage user, no ignored passwords, no auto-verify,
 * no role from an email substring, no client-side OTP.
 *
 * - Signup: email + password + consent only. There is NO age gate and NO
 *   birth-date handling anywhere (founder decision 30 Oct 2026 removed the
 *   18+ rule; it overrides PRD correction C1 and plan §5.1).
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
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

type Locale = 'id' | 'en';


function messageFor(code: string, locale: Locale): string {
  const key: keyof (typeof translations)['id']['authErrors'] =
    code === 'auth/email-already-in-use' ? 'email_in_use'
    : code === 'auth/weak-password' ? 'weak_password'
    : code === 'auth/invalid-email' ? 'invalid_email'
    : code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'invalid_credential'
    : code === 'auth/user-not-found' ? 'user_not_found'
    : code === 'auth/too-many-requests' ? 'too_many_requests'
    : 'generic';
  return translations[locale].authErrors[key];
}

interface AuthContextType {
  user: UserProfile | null;
  /** Explicit, labelled sample-data viewing. Never the default. */
  isDemoMode: boolean;
  isLoading: boolean;
  backendConfigured: boolean;
  login: (email: string, password: string, locale?: Locale) => Promise<AuthResult>;
  signup: (email: string, password: string, termsAccepted: boolean, locale?: Locale) => Promise<AuthResult>;
  /** Federated sign-in (Google / Apple) via Firebase popup. */
  signInWithProvider: (provider: 'google' | 'apple', consentGiven: boolean, locale?: Locale) => Promise<AuthResult>;
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
      return { success: false, error: translations[locale].authErrors.backend_not_configured };
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
        return { success: false, error: translations[locale].authErrors.unverified };
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
    termsAccepted: boolean,
    locale: Locale = 'id'
  ): Promise<AuthResult> => {
    if (!termsAccepted) {
      return { success: false, error: translations[locale].authErrors.terms_required };
    }
    if (!auth || !db || !isFirebaseConfigured) {
      return { success: false, error: translations[locale].authErrors.backend_not_configured };
    }
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      await sendEmailVerification(firebaseUser);
      // User document: email + consent record only. No birth date, no age
      // field anywhere (the 18+ gate was removed by founder decision,
      // 30 Oct 2026). The legacy `birthdate_verified_18plus` value on the
      // one existing live document is server data, untouched by this code.
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        display_name: email.split('@')[0] ?? '',
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
        return { success: false, error: translations[locale].authErrors.backend_not_configured };
      }
      const code = (error as { code?: string })?.code ?? '';
      return { success: false, error: messageFor(code, locale) };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Federated sign-in (founder decision 31 Oct 2026, auth split page).
   * Real Firebase Auth, not a decorative button: GoogleAuthProvider and
   * OAuthProvider('apple.com') via signInWithPopup, the same popup
   * pattern a web SPA uses to stay on the auth page.
   *
   * Honest limits, stated here so no one reads this as "fully working":
   * - The code cannot enable a provider by itself. Until the founder
   *   enables Google and/or Apple in the Firebase console (Authentication
   *   > Sign-in method), Firebase rejects the attempt with
   *   auth/operation-not-allowed, which is surfaced as
   *   authErrors.provider_not_enabled — never as a fake success.
   * - Apple additionally needs an Apple Developer Service ID + key
   *   uploaded in the Firebase console; Google needs only the console
   *   toggle (+ the app's authorized domain, which email auth already
   *   relies on).
   * - The email-verification gate used by password login is NOT applied
   *   here on purpose: a federated provider has already verified the
   *   address on its side, and Apple's private-relay addresses would
   *   otherwise be wrongly rejected.
   * - A user document is created only when none exists, with the same
   *   shape as email signup. Consent fields are recorded ONLY when the
   *   caller passes consentGiven (the sign-up tab's checkbox); a
   *   sign-in-tab provider login records no consent it did not ask for.
   */
  const signInWithProvider = async (
    provider: 'google' | 'apple',
    consentGiven: boolean,
    locale: Locale = 'id'
  ): Promise<AuthResult> => {
    if (!auth || !isFirebaseConfigured) {
      return { success: false, error: translations[locale].authErrors.backend_not_configured };
    }
    setIsLoading(true);
    try {
      const authProvider =
        provider === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com');
      const credential = await signInWithPopup(auth, authProvider);
      const firebaseUser = credential.user;
      if (db) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const email = firebaseUser.email ?? '';
            await setDoc(userRef, {
              email,
              display_name: firebaseUser.displayName ?? email.split('@')[0] ?? '',
              ...(consentGiven
                ? { consent_version: CONSENT_VERSION, consent_at: serverTimestamp() }
                : {}),
              locale,
              created_at: serverTimestamp(),
            });
          }
        } catch {
          // Profile document is optional for sign-in; never block auth on it.
        }
      }
      setUser(await buildProfile(firebaseUser));
      return { success: true };
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      const key: keyof (typeof translations)['id']['authErrors'] =
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? 'popup_closed'
          : code === 'auth/popup-blocked'
            ? 'popup_blocked'
            : code === 'auth/operation-not-allowed'
              ? 'provider_not_enabled'
              : code === 'auth/account-exists-with-different-credential'
                ? 'account_exists_different'
                : 'generic';
      return { success: false, error: translations[locale].authErrors[key] };
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
      return { success: false, error: translations[locale].authErrors.backend_not_configured };
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
        signInWithProvider,
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
