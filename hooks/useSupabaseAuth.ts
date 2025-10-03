/**
 * @fileoverview useSupabaseAuth Hook - Custom hook for Supabase authentication
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useContext } from 'react';
import { SupabaseAuthContext, type SupabaseAuthContextType } from '../contexts/SupabaseAuthContext';

/**
 * useSupabaseAuth hook - Access Supabase authentication context
 *
 * @returns {SupabaseAuthContextType} Authentication context
 * @throws {Error} When used outside of SupabaseAuthProvider
 */
export function useSupabaseAuth(): SupabaseAuthContextType {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}