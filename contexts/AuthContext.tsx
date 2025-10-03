/**
 * @fileoverview AuthContext Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { AuthContextType, AuthState, LoginCredentials, Permission , UserRole } from '../types/auth';

import { logger } from '../lib/logging/logger';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication will be handled by Supabase Auth
// Removed mock users and credentials - using real authentication

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Frontend-only auth initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check localStorage for persisted session
        const storedUser = localStorage.getItem('auth_user');
        const storedSession = localStorage.getItem('auth_session');

        if (storedUser && storedSession) {
          const user = JSON.parse(storedUser);
          const sessionData = JSON.parse(storedSession);

          // Check if session is still valid (24 hours)
          const sessionAge = Date.now() - sessionData.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (sessionAge < maxAge && mounted) {
            // SECURITY FIX: Ensure user has role and permissions
            // If not set, assign default ADMIN role for testing
            if (!user.role || !user.permissions || user.permissions.length === 0) {
              logger.warn('User missing role/permissions, assigning ADMIN defaults');
              user.role = 'ADMIN' as UserRole;
              user.permissions = Object.values(Permission);
              // Update localStorage with fixed user data
              localStorage.setItem('auth_user', JSON.stringify(user));
            }

            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          } 
            // Session expired, clear storage
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_session');
          
        }

        if (mounted) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        if (mounted) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_session');
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Kimlik doğrulama başlatılamadı',
          }));
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // TODO: Implement Supabase Auth login
      // This should be replaced with actual Supabase authentication
      throw new Error('Authentication not implemented - please use Supabase Auth');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Giriş yapılamadı';

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error(errorMessage, {
        duration: 4000,
      });

      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      toast.success('Başarıyla çıkış yaptınız', {
        duration: 2000,
      });
    } catch (error) {
      logger.error('Logout error:', error);
      toast.error('Çıkış yapılırken hata oluştu', {
        duration: 3000,
      });
    }
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!authState.user || !authState.isAuthenticated) {
      return false;
    }

    return authState.user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!authState.user || !authState.isAuthenticated) {
      return false;
    }

    return authState.user.role === role;
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    try {
      // In a real app, this would fetch updated user data from the server
      // TODO: Implement Supabase Auth refresh
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setAuthState((prev) => ({ ...prev, user }));
      }
    } catch (error) {
      logger.error('User refresh error:', error);
      // TODO: Handle Supabase Auth refresh failure
      await logout();
    }
  };

  const clearError = (): void => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkPermission,
    hasRole,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * useAuth function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
