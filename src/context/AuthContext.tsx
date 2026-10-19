import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'user' | 'moderator' | 'editor' | 'admin';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  nickname: string;
  role: UserRole;
  isEmailVerified: boolean;
  ageGatePassed: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'enthusiast';
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, birthDate: string, termsAccepted: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  sendWhatsAppOtp: (phoneNumber: string) => Promise<{ success: boolean; otp?: string; message: string }>;
  verifyWhatsAppOtp: (phoneNumber: string, code: string) => Promise<boolean>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('senstoria_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return !localStorage.getItem('senstoria_auth_user');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('senstoria_auth_user', JSON.stringify(user));
      setIsDemoMode(false);
    } else {
      localStorage.removeItem('senstoria_auth_user');
    }
  }, [user]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Admin account check or standard member
      const isAdminEmail = email.toLowerCase() === 'senstoria@gmail.com' || email.toLowerCase().includes('admin');
      const newUserId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const mockUser: UserProfile = {
        id: newUserId,
        uid: newUserId,
        email,
        nickname: email.split('@')[0],
        role: isAdminEmail ? 'admin' : 'user',
        isEmailVerified: true,
        ageGatePassed: true,
        experienceLevel: 'intermediate',
        createdAt: new Date().toISOString()
      };
      setUser(mockUser);
      setIsDemoMode(false);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string, 
    _password: string, 
    birthDate: string, 
    termsAccepted: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!termsAccepted) {
        return { success: false, error: 'Syarat & Kebijakan Privasi harus disetujui.' };
      }

      // Age Gate Validation (AUTH-02, AUTH-12: 18+ required)
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (age < 18) {
        return { 
          success: false, 
          error: 'Pendaftaran akun hanya diperuntukkan untuk usia 18 tahun ke atas. Kamu tetap dapat menjelajah katalog dan mencoba Scent Finder dalam mode tamu.' 
        };
      }

      const newUserId = 'usr_' + Math.random().toString(36).substring(2, 9);
      const newUser: UserProfile = {
        id: newUserId,
        uid: newUserId,
        email,
        nickname: email.split('@')[0],
        role: 'user',
        isEmailVerified: true, // Auto-verified in local prototype mode
        ageGatePassed: true,
        experienceLevel: 'beginner',
        createdAt: new Date().toISOString()
      };

      setUser(newUser);
      setIsDemoMode(false);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsDemoMode(true);
  };

  // WhatsApp OTP Adapter (AUTH-14, dev simulation)
  const sendWhatsAppOtp = async (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[WhatsApp Adapter Dev OTP] Sent code ${otp} to +${cleanNumber}`);
    return {
      success: true,
      otp,
      message: `Kode verifikasi dikirim ke +${cleanNumber}. (Untuk dev: kode Anda adalah ${otp})`
    };
  };

  const verifyWhatsAppOtp = async (_phoneNumber: string, code: string) => {
    if (code.length === 6) {
      const waUserId = 'usr_wa_' + Math.random().toString(36).substring(2, 7);
      setUser({
        id: waUserId,
        uid: waUserId,
        email: 'whatsapp_user@senstoria.id',
        nickname: 'Kolektor WhatsApp',
        role: 'user',
        isEmailVerified: true,
        ageGatePassed: true,
        experienceLevel: 'beginner',
        createdAt: new Date().toISOString()
      });
      setIsDemoMode(false);
      return true;
    }
    return false;
  };

  const enableDemoMode = () => {
    setUser(null);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isDemoMode,
        isLoading,
        login,
        signup,
        logout,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        enableDemoMode
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
