/**
 * @fileoverview SupabaseAuthContext Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

import { logger } from '../lib/logging/logger';

// Type guard to safely extract error message from unknown errors
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

// Supabase Auth Context Types
export interface SupabaseAuthContextType {
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

export const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

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

  const isAuthenticated = !!user && !!session;

  // Initialize auth state - with proper cleanup to avoid multiple instances
  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

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
          setUser(session ? session.user : null);
        }

        // Setup auth state listener only after initial session check
        // This ensures we don't set up multiple listeners in StrictMode
        if (mounted && !authSubscription) {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            logger.info('Auth state change:', event, session?.user?.email);

            if (mounted) {
              setSession(session);
              setUser(session ? session.user : null);
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
          case 'INITIAL_SESSION':
          case 'PASSWORD_RECOVERY':
          case 'MFA_CHALLENGE_VERIFIED':
            // Handle other auth events
            logger.info('Auth event:', event);
            break;
        }
            }
          });
          authSubscription = subscription;
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

    initializeAuth();

    return () => {
      mounted = false;
      // Cleanup: Unsubscribe from auth state changes
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      // DEMO CREDENTIALS FOR DEVELOPMENT ONLY - NOT FOR PRODUCTION OR SECRETS
      // These are intentionally non-secret and only for local demo mode
      logger.info('Using mock authentication - Supabase not configured');

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login with demo credentials
      const demoEmail = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@example.com';
      const demoPassword = import.meta.env.VITE_DEMO_PASSWORD ?? 'demo123';
      if (email === demoEmail && password === demoPassword) {
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
      setError(`Demo için: ${demoEmail} / ${demoPassword} kullanın`);
      setIsLoading(false);
      toast.error(`Demo için: ${demoEmail} / ${demoPassword} kullanın`);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Success is handled by onAuthStateChange
    } catch (error: unknown) {
      let errorMessage = 'Giriş yapılamadı';
      if (isErrorWithMessage(error)) {
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
            errorMessage = error.message;
        }
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
      const { error } = await supabase.auth.signUp({
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
    } catch (error: unknown) {
      let errorMessage = 'Kayıt olunamadı';
      if (isErrorWithMessage(error)) {
        switch (error.message) {
          case 'User already registered':
            errorMessage = 'Bu email adresi zaten kayıtlı';
            break;
          case 'Password should be at least 6 characters':
            errorMessage = 'Şifre en az 6 karakter olmalı';
            break;
          default:
            errorMessage = error.message;
        }
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
      // Try to sign out from Supabase with local scope
      // Using 'local' scope to only clear local storage, not all sessions
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        // Log the error but don't block logout
        logger.warn('Supabase signOut API error (non-blocking):', error);
      }

      // Always clear local state regardless of API response
      // This ensures users can log out even if Supabase API fails
      setUser(null);
      setSession(null);

      toast.success('Çıkış yapıldı', { duration: 2000 });
    } catch (error: unknown) {
      // Even if Supabase API fails completely, clear local state
      logger.error('SignOut error (clearing local state anyway):', error);
      setUser(null);
      setSession(null);
      toast.success('Çıkış yapıldı', { duration: 2000 });
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
    } catch (error: unknown) {
      let errorMessage = 'Şifre sıfırlama başarısız';
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      }
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


