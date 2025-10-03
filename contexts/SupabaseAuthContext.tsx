/**
 * @fileoverview SupabaseAuthContext Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

import { logger } from '../lib/logging/logger';
// Supabase Auth Context Types
interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

/**
 * SupabaseAuthProvider function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user) && Boolean(session);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error getting session:', error);
          setError(error.message);
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        if (mounted) {
          setError('Kimlik doğrulama başlatılamadı');
        }
      } finally {
        if (mounted) {
          // Set loading to false immediately without delay
          setTimeout(() => {
            setIsLoading(false);
          }, 10);
        }
      }
    };

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state change:', event, session?.user?.email);

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            // Removed welcome toast notification
            logger.info('User signed in:', session?.user?.email);
            break;
          case 'SIGNED_OUT':
            toast.success('Başarıyla çıkış yaptınız');
            break;
          case 'TOKEN_REFRESHED':
            logger.info('Token refreshed');
            break;
          case 'USER_UPDATED':
            logger.info('User updated');
            break;
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      // Mock authentication for development
      logger.info('Using mock authentication - Supabase not configured');

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login with demo credentials
      if (email === 'demo@example.com' && password === 'demo123') {
        const mockUser = {
          id: 'mock-user-id',
          email,
          user_metadata: { name: 'Demo User' },
          app_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: undefined,
          confirmation_sent_at: undefined,
          recovery_sent_at: undefined,
          email_change_sent_at: undefined,
          new_email: undefined,
          invited_at: undefined,
          action_link: undefined,
          phone: undefined,
          last_sign_in_at: new Date().toISOString(),
        } as User;

        setUser(mockUser);
        setSession({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: mockUser,
        } as Session);

        setIsLoading(false);
        toast.success('Demo modunda giriş yapıldı');
        return;
      }
      setError('Demo için: demo@example.com / demo123 kullanın');
      setIsLoading(false);
      toast.error('Demo için: demo@example.com / demo123 kullanın');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Success is handled by onAuthStateChange
    } catch (error: any) {
      let errorMessage = 'Giriş yapılamadı';

      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = 'Geçersiz email veya şifre';
          break;
        case 'Email not confirmed':
          errorMessage = 'Email adresinizi doğrulayın';
          break;
        case 'Too many requests':
          errorMessage = 'Çok fazla deneme. Lütfen bekleyin';
          break;
        default:
          errorMessage = error.message ?? 'Giriş yapılamadı';
      }

      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Check if we're in mock mode
    if (!isSupabaseConfigured()) {
      // Mock sign up
      setError('Demo modunda kayıt yapılamaz. Giriş için demo@example.com / demo123 kullanın.');
      setIsLoading(false);
      toast.error('Demo modunda kayıt yapılamaz');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Kayıt başarılı! Email adresinizi kontrol edin.', { duration: 5000 });
    } catch (error: any) {
      let errorMessage = 'Kayıt olunamadı';

      switch (error.message) {
        case 'User already registered':
          errorMessage = 'Bu email adresi zaten kayıtlı';
          break;
        case 'Password should be at least 6 characters':
          errorMessage = 'Şifre en az 6 karakter olmalı';
          break;
        default:
          errorMessage = error.message ?? 'Kayıt olunamadı';
      }

      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Check if we're in mock mode
    if (!isSupabaseConfigured()) {
      // Mock sign out
      setUser(null);
      setSession(null);
      setIsLoading(false);
      toast.success('Çıkış yapıldı');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Success is handled by onAuthStateChange
    } catch (error: any) {
      const errorMessage = error.message ?? 'Çıkış yapılırken hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Check if we're in mock mode
    if (!isSupabaseConfigured()) {
      // Mock password reset
      setIsLoading(false);
      toast.success('Demo modunda şifre sıfırlama yapılamaz');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Şifre sıfırlama bağlantısı email adresinize gönderildi', { duration: 5000 });
    } catch (error: any) {
      const errorMessage = error.message ?? 'Şifre sıfırlama başarısız';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: SupabaseAuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return (
    <SupabaseAuthContext.Provider value={contextValue}>{children}</SupabaseAuthContext.Provider>
  );
}

/**
 * useSupabaseAuth function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function useSupabaseAuth(): SupabaseAuthContextType {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
