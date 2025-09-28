/**
 * @fileoverview environment Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

// 🌍 ENVIRONMENT CONFIGURATION MANAGER
// Centralized environment variable management

import { generateTestSecret } from './security/testSecrets';

import { logger } from './logging/logger';
interface EnvironmentConfig {
  // Application
  app: {
    name: string;
    version: string;
    mode: 'development' | 'production' | 'test';
    debug: boolean;
  };

  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // Feature Flags
  features: {
    pwa: boolean;
    analytics: boolean;
    monitoring: boolean;
    mockData: boolean;
    offlineMode: boolean;
    security?: {
      virusScan: boolean;
      contentModeration: boolean;
      watermarking: boolean;
      encryption: boolean;
    };
  };

  // Performance
  performance: {
    serviceWorker: boolean;
    cacheStrategy: 'networkFirst' | 'cacheFirst';
    bundleAnalyzer: boolean;
    sourcemaps: boolean;
  };

  // Security
  security: {
    csp: boolean;
    hsts: boolean;
    xssProtection: boolean;
    contentTypeOptions: boolean;
  };

  // Development
  development: {
    port: number;
    host: string;
    open: boolean;
    cors: boolean;
  };

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    console: boolean;
    errorTracking: boolean;
    performanceLogging: boolean;
  };

  // External error tracking removed
}

// Environment variable getter with type safety
function getEnvVar(key: string, defaultValue?: string): string {
  // Check if we're in a browser environment (Vite)
  const isBrowser = typeof window !== 'undefined' && typeof import.meta !== 'undefined';
  const isNode = typeof process !== 'undefined';

  let value: string | undefined;

  if (isBrowser) {
    value = import.meta.env[key as keyof ImportMetaEnv] as string;
  } else if (isNode) {
    // eslint-disable-next-line security/detect-object-injection
    value = process.env[key];
  }

  // If no environment variable is set, use default value
  if (!value || value === '') {
    if (defaultValue === undefined) {
      logger.warn(`Environment variable ${key} is not defined and no default provided`);
      return '';
    }
    return defaultValue;
  }

  return value;
}

function getEnvBool(key: string, defaultValue = false): boolean {
  const value = getEnvVar(key);
  if (value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function getEnvNumber(key: string, defaultValue = 0): number {
  const value = getEnvVar(key);
  if (value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validates an individual environment variable against type-specific rules
 * @param name The name of the environment variable
 * @param value The value to validate
 * @param type The expected type/format of the variable
 * @returns Validation result object with success status and optional error message
 */
function validateEnvironmentVariable(
  name: string,
  value: string,
  type: 'url' | 'jwt' | 'secret' | 'boolean' | 'number' | 'text' = 'text'
): { isValid: boolean; error?: string } {
  if (!value || value === '') {
    return { isValid: false, error: `${name} is required` };
  }

  // Check if the value is a placeholder from .env.example
  if (value.includes('your_') || value.includes('YOUR_')) {
    return { isValid: false, error: `${name} contains a placeholder value` };
  }

  switch (type) {
    case 'url':
      try {
        const url = new URL(value);
        if (!url.protocol.startsWith('http')) {
          return { isValid: false, error: `${name} must have HTTP/HTTPS protocol` };
        }
        if (name === 'VITE_SUPABASE_URL' && !url.hostname.endsWith('supabase.co')) {
          return { isValid: false, error: `${name} must be a valid Supabase URL (ending with supabase.co)` };
        }
        return { isValid: true };
      } catch (e) {
        return { isValid: false, error: `${name} is not a valid URL` };
      }

    case 'jwt':
      // Basic JWT structure validation (3 parts separated by dots)
      const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
      if (!jwtRegex.test(value)) {
        return { isValid: false, error: `${name} is not a valid JWT token format` };
      }
      return { isValid: true };

    case 'secret':
      // Check minimum length and complexity for secrets
      if (value.length < 32) {
        return { isValid: false, error: `${name} must be at least 32 characters long` };
      }
      // Check for sufficient complexity (at least one number, uppercase, lowercase)
      const hasNumber = /\d/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      if (!(hasNumber && (hasUpper || hasLower))) {
        return { isValid: false, error: `${name} has insufficient complexity` };
      }
      return { isValid: true };

    case 'boolean':
      if (!['true', 'false', '0', '1'].includes(value.toLowerCase())) {
        return { isValid: false, error: `${name} must be a boolean value (true/false/0/1)` };
      }
      return { isValid: true };

    case 'number':
      if (isNaN(Number(value))) {
        return { isValid: false, error: `${name} must be a valid number` };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
}

// Environment validation
function validateEnvironment(): void {
  const mode = getEnvVar('VITE_APP_MODE', 'development');

  // In test mode, use default values for missing environment variables
  if (mode === 'test') {
    // Set default test values for required variables if not provided
    if (typeof process !== 'undefined') {
      process.env.VITE_SUPABASE_URL ??= 'https://test.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';
      process.env.VITE_CSRF_SECRET ??= generateTestSecret('csrf');
    }
    logger.info('🧪 Test mode: Using default environment values');
    return;
  }

  // Define required variables with their expected types
  const requiredVars = [
    { name: 'VITE_SUPABASE_URL', type: 'url' as const },
    { name: 'VITE_SUPABASE_ANON_KEY', type: 'jwt' as const },
    { name: 'VITE_CSRF_SECRET', type: 'secret' as const }
  ];

  const missingVars: string[] = [];
  const invalidVars: {name: string, error: string}[] = [];

  // Validate each required variable
  for (const { name, type } of requiredVars) {
    const value = getEnvVar(name, '');
    
    if (!value || value === '') {
      missingVars.push(name);
      continue;
    }
    
    const validation = validateEnvironmentVariable(name, value, type);
    if (!validation.isValid) {
      invalidVars.push({ name, error: validation.error || 'Invalid format' });
    }
  }

  // Format error messages
  let errorMessages: string[] = [];
  
  if (missingVars.length > 0) {
    errorMessages.push(`🚨 Eksik Environment Variables:
${missingVars.map((v) => `  - ${v}`).join('\n')}`);
  }
  
  if (invalidVars.length > 0) {
    errorMessages.push(`⚠️ Geçersiz Environment Variables:
${invalidVars.map((v) => `  - ${v.name}: ${v.error}`).join('\n')}`);
  }
  
  if (errorMessages.length > 0) {
    // Production'da daha yumuşak hata handling
    const errorMessage = `
🚨 KRİTİK GÜVENLİK UYARISI!

${errorMessages.join('\n\n')}

Lütfen .env dosyanızı oluşturun ve gerekli değişkenleri doğru formatta ekleyin:

# .env dosyası oluşturun:
cp .env.example .env

# Gerekli değişkenleri ekleyin:
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CSRF_SECRET=$(openssl rand -hex 32)

Bu eksiklikler giderilmezse uygulama çalışmayacaktır!
        `;

    // Production'da console.error kullan, throw etme
    if (typeof window !== 'undefined') {
      console.error(errorMessage);
      // Show a user-friendly error message
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="padding: 20px; background: #fee; border: 1px solid #fcc; color: #800; font-family: monospace;">
          <h3>🚨 Konfigürasyon Hatası</h3>
          <p>Uygulama environment variable'ları eksik veya geçersiz. Lütfen administrator ile iletişime geçin.</p>
          <details>
            <summary>Teknik Detaylar</summary>
            <pre>${errorMessage}</pre>
          </details>
        </div>
      `;
      document.body.appendChild(errorDiv);
      return; // Don't throw in production
    } else {
      // Only throw in build/server environments
      throw new Error(errorMessage);
    }
  }

  // Security check - hardcoded credentials kontrolü (test ortamında disable)
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  // Test ortamında hardcoded credentials check'ini disable et
  if (mode !== 'test') {
    // Check for placeholder or example values
    if (
      supabaseUrl.includes('YOUR_PROJECT_ID') ||
      supabaseUrl.includes('your-project') ||
      supabaseUrl.includes('your_project') ||
      supabaseKey.includes('your_supabase_anon_key') ||
      supabaseKey.includes('your-supabase-anon-key') ||
      // Check for the specific hardcoded values from the previous .env.example
      supabaseUrl.includes('gyburnfaszhxcxdnwogj') ||
      supabaseKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    ) {
      throw new Error(`
🚨 KRİTİK GÜVENLİK AÇIĞI TESPİT EDİLDİ!

Environment variable'larda hardcoded credentials tespit edildi:

VITE_SUPABASE_URL: ${supabaseUrl}
VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...

Bu çok tehlikelidir! Lütfen:
1. Bu credentials'ları derhal değiştirin
2. Environment variable'ları .env dosyasından alın
3. Git history'den bu bilgileri temizleyin

            `);
    }
  }

  logger.info('✅ Environment validation başarılı');
}

// Lazy environment validation - only validate when explicitly requested
let environmentValidated = false;

/**
 * validateEnvironmentIfNeeded function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function validateEnvironmentIfNeeded(): void {
  if (environmentValidated) return;

  const appMode = getEnvVar('VITE_APP_MODE', 'development');
  const forceValidation = getEnvVar('VITE_FORCE_ENV_VALIDATION', 'false');
  const shouldValidate = appMode !== 'test' || forceValidation === 'true';
  logger.info('🔧 Environment validation check:', {
    mode: appMode,
    shouldValidate,
    forceValidation,
  });

  if (shouldValidate) {
    validateEnvironment();
  } else {
    logger.info('🧪 Skipping environment validation in test mode');
  }

  environmentValidated = true;
}

// Environment validation is now lazy-loaded
// Call validateEnvironmentIfNeeded() when needed

// Main environment configuration
export const environment: EnvironmentConfig = {
  app: {
    name: getEnvVar('VITE_APP_NAME', 'Dernek Yönetim Sistemi'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    mode: ['development', 'production', 'test'].includes(getEnvVar('VITE_APP_MODE', 'development'))
      ? (getEnvVar('VITE_APP_MODE', 'development') as 'development' | 'production' | 'test')
      : 'development',
    debug: getEnvBool('VITE_APP_DEBUG', true),
  },

  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', ''),
  },

  features: {
    pwa: getEnvBool('VITE_ENABLE_PWA', true),
    analytics: getEnvBool('VITE_ENABLE_ANALYTICS', false),
    monitoring: getEnvBool('VITE_ENABLE_MONITORING', true),
    mockData: getEnvBool('VITE_ENABLE_MOCK_DATA', true),
    offlineMode: getEnvBool('VITE_ENABLE_OFFLINE_MODE', true),
  },

  performance: {
    serviceWorker: getEnvBool('VITE_ENABLE_SERVICE_WORKER', true),
    cacheStrategy: ['networkFirst', 'cacheFirst'].includes(
      getEnvVar('VITE_CACHE_STRATEGY', 'networkFirst'),
    )
      ? (getEnvVar('VITE_CACHE_STRATEGY', 'networkFirst') as 'networkFirst' | 'cacheFirst')
      : 'networkFirst',
    bundleAnalyzer: getEnvBool('VITE_BUNDLE_ANALYZER', false),
    sourcemaps: getEnvBool('VITE_SOURCEMAPS', false),
  },

  security: {
    csp: getEnvBool('VITE_ENABLE_CSP', true),
    hsts: getEnvBool('VITE_ENABLE_HSTS', true),
    xssProtection: getEnvBool('VITE_ENABLE_XSS_PROTECTION', true),
    contentTypeOptions: getEnvBool('VITE_ENABLE_CONTENT_TYPE_OPTIONS', true),
  },

  development: {
    port: getEnvNumber('VITE_DEV_PORT', 5173),
    host: getEnvVar('VITE_DEV_HOST', 'localhost'),
    open: getEnvBool('VITE_DEV_OPEN', true),
    cors: getEnvBool('VITE_DEV_CORS', true),
  },

  logging: {
    level: ['debug', 'info', 'warn', 'error'].includes(getEnvVar('VITE_LOG_LEVEL', 'info'))
      ? (getEnvVar('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error')
      : 'info',
    console: getEnvBool('VITE_ENABLE_CONSOLE_LOGS', true),
    errorTracking: getEnvBool('VITE_ENABLE_ERROR_TRACKING', true),
    performanceLogging: getEnvBool('VITE_ENABLE_PERFORMANCE_LOGGING', true),
  },

  // External error tracking configuration removed
};

// Environment info for debugging
/**
 * getEnvironmentInfo function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function getEnvironmentInfo() {
  return {
    config: environment,
    runtime: {
      nodeEnv: getEnvVar('VITE_APP_MODE', 'development'),
      isDevelopment: getEnvVar('VITE_APP_MODE', 'development') === 'development',
      isProduction: getEnvVar('VITE_APP_MODE', 'development') === 'production',
      baseUrl: getEnvVar('VITE_BASE_URL', '/'),
    },
    build: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: 'unknown', // Deprecated navigator.platform replaced with safer fallback
      language: navigator.language,
    },
  };
}

// Feature flag helpers
export const isFeatureEnabled = (
  feature: keyof Omit<EnvironmentConfig['features'], 'security'>,
): boolean => {
  // eslint-disable-next-line security/detect-object-injection
  const featureValue = environment.features[feature];
  return typeof featureValue === 'boolean' ? featureValue : false;
};

export const isProduction = (): boolean => {
  return environment.app.mode === 'production';
};

export const isDevelopment = (): boolean => {
  return environment.app.mode === 'development';
};

// Logging helper
export const log = {
  debug: (...args: unknown[]) => {
    if (environment.logging.console && environment.logging.level === 'debug') {
      logger.debug('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (environment.logging.console && ['debug', 'info'].includes(environment.logging.level)) {
      logger.info('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (
      environment.logging.console &&
      ['debug', 'info', 'warn'].includes(environment.logging.level)
    ) {
      logger.warn('[WARN]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (environment.logging.console) {
      logger.error('[ERROR]', ...args);
    }

    if (environment.logging.errorTracking) {
      // Send to error tracking service
    }
  },
};

// Performance logging
export const performanceLog = (metric: string, value: number, context?: unknown) => {
  if (environment.logging.performanceLogging) {
    log.info(`[PERFORMANCE] ${metric}: ${value.toString()}ms`, context);
  }
};

// Export environment for global access
export default environment;
