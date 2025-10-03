/**
 * @fileoverview supabase Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { environment } from './environment';

import { logger } from './logging/logger';
// Shared table name constants for hooks/services
export const TABLES = {
  DONATIONS: 'donations',
  MEMBERS: 'members',
  BENEFICIARIES: 'beneficiaries',
  AID_REQUESTS: 'aid_requests',
  CAMPAIGNS: 'campaigns',
} as const;

// Supabase configuration using centralized environment management
const supabaseUrl = environment.supabase.url;
const supabaseAnonKey = environment.supabase.anonKey;

// Debug environment variables
logger.info('Supabase Configuration Debug:', {
  supabaseUrl,
  hasAnonKey: Boolean(supabaseAnonKey),
  anonKeyLength: supabaseAnonKey?.length ?? 0,
  supabaseUrlValid: supabaseUrl && supabaseUrl.startsWith('http'),
  importMetaEnv: {
    VITE_SUPABASE_URL: import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      import.meta?.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
        ? 'SET'
        : 'NOT_SET',
  },
  environment: {
    url: environment.supabase.url,
    anonKey: environment.supabase.anonKey ? 'SET' : 'NOT_SET',
  },
  allImportMetaEnv:
    typeof import.meta !== 'undefined' && import.meta.env
      ? Object.keys(import.meta.env as Record<string, any>).filter((key) => key.startsWith('VITE_'))
      : [],
  rawImportMetaEnv: {
    VITE_SUPABASE_URL: import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      import.meta?.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
});

// Validate Supabase configuration
if (!supabaseUrl?.startsWith('http')) {
  logger.warn('Invalid or missing VITE_SUPABASE_URL. Supabase features will be disabled.');
}

if (!supabaseAnonKey) {
  logger.warn('Missing VITE_SUPABASE_ANON_KEY. Supabase features will be disabled.');
}

// Create a safe Supabase client - use dummy values if environment is not configured
const normalizedUrl = (supabaseUrl || '').trim();
const normalizedKey = (supabaseAnonKey || '').trim();
const safeSupabaseUrl = normalizedUrl.startsWith('http')
  ? normalizedUrl
  : 'https://placeholder.supabase.co';
const safeSupabaseKey = normalizedKey ? normalizedKey : 'placeholder-key';

// Supabase client instance oluştur
export const supabase = createClient(safeSupabaseUrl, safeSupabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Admin client (service role key ile) - RLS bypass için
export const supabaseAdmin = createClient(
  safeSupabaseUrl,
  (environment.supabase.serviceRoleKey || '').trim() || safeSupabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Type definitions for TypeScript
/**
 * Database Interface
 *
 * @interface Database
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Typed supabase client
export type SupabaseClient = typeof supabase;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseUrl.startsWith('http') &&
      supabaseAnonKey &&
      supabaseAnonKey !== 'placeholder-key',
  );
};

// Helper function to get Supabase configuration status
export const getSupabaseStatus = () => {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl,
    hasKey: Boolean(supabaseAnonKey),
    isPlaceholder: safeSupabaseUrl === 'https://placeholder.supabase.co',
  };
};

export default supabase;
