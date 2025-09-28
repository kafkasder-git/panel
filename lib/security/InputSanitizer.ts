/**
 * Comprehensive Input Sanitization and Security System
 * Protects against XSS, SQL Injection, and other security threats
 */


// Optimized HTML escape map using a Map for O(1) lookup
const HTML_ESCAPE_MAP = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#x27;'],
  ['/', '&#x2F;'],
]);

// Safe dangerous patterns using simple RegExp
const DANGEROUS_PATTERNS = new RegExp([
  '<script[^>]*>[^<]*(?:</script>)?',
  '<iframe[^>]*>[^<]*(?:</iframe>)?',
  '<object[^>]*>[^<]*(?:</object>)?',
  '<embed[^>]*>[^<]*(?:</embed>)?',
  '<link[^>]*>[^<]*(?:</link>)?',
  '<meta[^>]*>[^<]*(?:</meta>)?',
  'javascript:',
  'vbscript:',
  'data:text/html',
  'on\\w+\\s*=',
].join('|'), 'gi');

// Optimized SQL injection patterns using a single RegExp
const SQL_INJECTION_PATTERNS = new RegExp([
  '\\bUNION\\b|\\bSELECT\\b|\\bINSERT\\b|\\bUPDATE\\b|\\bDELETE\\b|\\bDROP\\b|\\bCREATE\\b|\\bALTER\\b',
  "['\"\\\\]",
  '--',
  '/\\*|\\*/',
].join('|'), 'gi');

// XSS Protection
/**
 * XSSProtection Service
 * 
 * Service class for handling xssprotection operations
 * 
 * @class XSSProtection
 */
export class XSSProtection {
  private static readonly ALLOWED_TAGS = new Set([
    'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span', 'div'
  ]);

  static sanitizeHTML(input: string): string {
    if (!input) return '';

    // Remove dangerous patterns first
    let sanitized = input.replace(DANGEROUS_PATTERNS, '');
    
    // Remove script tags and content
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<script[^>]*>/gi, '');
    
    // Remove iframe tags and content
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Encode remaining HTML tags and special characters (avoid double encoding)
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    sanitized = sanitized.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    sanitized = sanitized.replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  static sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static sanitizeURL(input: string): string {
    if (!input) return '';
    const dangerous = ['javascript:', 'vbscript:', 'data:text/html'];
    for (const pattern of dangerous) {
      if (input.toLowerCase().includes(pattern)) {
        return '';
      }
    }
    return input;
  }

  static escapeHTML(input: string): string {
    return input.replace(/[&<>"'/]/g, char => HTML_ESCAPE_MAP.get(char) || char);
  }

  static hasDangerousContent(input: string): boolean {
    return DANGEROUS_PATTERNS.test(input);
  }
}

// SQL Injection Protection
/**
 * SQLInjectionProtection Service
 * 
 * Service class for handling sqlinjectionprotection operations
 * 
 * @class SQLInjectionProtection
 */
export class SQLInjectionProtection {
  static validate(input: string): boolean {
    if (!input) return true;
    // More aggressive validation - reject any input with SQL keywords
    const hasSQLKeywords = /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i.test(input);
    const hasSQLOperators = /(\bOR\b|\bAND\b).*\d+\s*=\s*\d+/i.test(input);
    const hasSQLComments = /(--|\/\*|\*\/)/.test(input);
    const hasSQLQuotes = /['";\\]/.test(input);
    
    // Return false if any SQL-related suspicious pattern is present
    return !(hasSQLKeywords || hasSQLOperators || hasSQLComments || hasSQLQuotes);
  }

  static sanitize(input: string): string {
    if (typeof input !== 'string') return '';
    // More aggressive sanitization - remove all dangerous patterns
    return input
      .replace(/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/gi, '')
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*|\*\//g, '')
      .replace(/OR\s+\d+\s*=\s*\d+/gi, '')
      .replace(/AND\s+\d+\s*=\s*\d+/gi, '')
      .replace(/=\s*\d+/g, '')
      .trim();
  }
}

// CSRF Protection
/**
 * CSRFProtection Service
 * 
 * Service class for handling csrfprotection operations
 * 
 * @class CSRFProtection
 */
export class CSRFProtection {
  private static readonly tokens = new Map<string, { token: string; expires: number }>();
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

  static generateToken(sessionId?: string): string {
    const token = Array.from({ length: this.TOKEN_LENGTH }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
    
    const expires = Date.now() + this.TOKEN_EXPIRY;
    this.tokens.set(token, { token, expires });
    
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const tokenData = this.tokens.get(token);
    if (!tokenData) return false;
    
    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      return false;
    }
    
    return true;
  }

  static cleanExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(token);
      }
    }
  }
}

// Rate Limiter
/**
 * RateLimiter Service
 * 
 * Service class for handling ratelimiter operations
 * 
 * @class RateLimiter
 */
export class RateLimiter {
  private static readonly attempts = new Map<string, { count: number; resetTime: number }>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  static isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.WINDOW_MS });
      return true;
    }
    
    if (attempt.count >= this.MAX_ATTEMPTS) {
      return false;
    }
    
    attempt.count++;
    return true;
  }

  static checkLimit(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }

  static getRemainingTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return 0;
    
    return Math.max(0, attempt.resetTime - Date.now());
  }

  static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Input Sanitizer
/**
 * InputSanitizer Service
 * 
 * Service class for handling inputsanitizer operations
 * 
 * @class InputSanitizer
 */
export class InputSanitizer {
  static sanitize(input: unknown, type: 'text' | 'html' | 'sql' | 'email' | 'phone' | 'url' | 'filepath' = 'text'): string {
    if (input === null || input === undefined) return '';
    
    const stringInput = typeof input === 'string' ? input : String(input);
    
    switch (type) {
      case 'html':
        return XSSProtection.sanitizeHTML(stringInput);
      case 'sql':
        return SQLInjectionProtection.sanitize(stringInput);
      case 'email':
        return this.sanitizeEmail(stringInput);
      case 'phone':
        return this.sanitizePhone(stringInput);
      case 'url':
        return this.sanitizeURL(stringInput);
      case 'filepath':
        return this.sanitizeFilePath(stringInput);
      default:
        return this.sanitizeText(stringInput);
    }
  }

  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>"'&]/g, char => HTML_ESCAPE_MAP.get(char) || char)
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  }

  static sanitizeEmail(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.@_-]/g, '');
  }

  static sanitizePhone(input: string): string {
    return input
      .replace(/[^\d+]/g, '')
      .slice(0, 15); // Maximum length for international numbers
  }

  static sanitizeURL(input: string): string {
    try {
      const url = new URL(input.trim());
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  }

  static sanitizeFilePath(input: string): string {
    return input
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^[./\\]+|[./\\]+$/g, '') // Remove leading/trailing dots and slashes
      .trim();
  }

  static sanitizeUserInput(input: string, type = 'text'): string {
    switch (type) {
      case 'email':
        return this.sanitizeEmail(input);
      case 'phone':
        return this.sanitizePhone(input);
      case 'tcKimlik':
        return input.replace(/[^\d]/g, '').slice(0, 11);
      case 'iban':
        return input.replace(/[^\dA-Z]/gi, '').toUpperCase();
      case 'address':
        return XSSProtection.sanitizeHTML(input).trim();
      case 'name':
        // For Turkish names with special characters but no HTML
        return this.sanitizeText(input).replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s.-]/g, '');
      case 'numeric':
        return input.replace(/[^\d.-]/g, '');
      case 'alphanumeric':
        return input.replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s]/g, '');
      case 'date':
        // Format: YYYY-MM-DD
        const dateMatch = input.match(/^\d{4}-\d{2}-\d{2}$/);
        return dateMatch ? dateMatch[0] : '';
      default:
        return this.sanitizeText(input);
    }
  }

  static sanitizeFormData(formData: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(formData)) {
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'string') {
        // Determine field type based on key name
        if (key.toLowerCase().includes('email')) {
          result[key] = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          result[key] = this.sanitizePhone(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('website')) {
          result[key] = this.sanitizeURL(value);
        } else if (key.toLowerCase().includes('address')) {
          result[key] = XSSProtection.sanitizeHTML(value);
        } else if (key.toLowerCase().includes('tc') || 
                  key.toLowerCase().includes('kimlik') || 
                  key.toLowerCase().includes('tckn')) {
          result[key] = value.replace(/[^\d]/g, '').slice(0, 11);
        } else if (key.toLowerCase().includes('iban')) {
          result[key] = value.replace(/[^\dA-Z]/gi, '').toUpperCase();
        } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('tarih')) {
          // Try to maintain valid date format
          const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
          result[key] = dateMatch ? dateMatch[0] : this.sanitizeText(value);
        } else {
          result[key] = this.sanitizeText(value);
        }
      } else {
        result[key] = String(value);
      }
    }

    return result;
  }
  
  // Specific methods for form integration
  static sanitizeFormField(value: string | number | null | undefined, fieldType: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    return this.sanitizeUserInput(stringValue, fieldType as any);
  }
  
  static validateAndSanitizeForm<T extends Record<string, unknown>>(
    form: T,
    fieldTypes: Record<keyof T, string>
  ): T {
    const sanitized = { ...form };
    
    for (const [key, type] of Object.entries(fieldTypes)) {
      if (key in form) {
        const value = form[key as keyof T];
        if (typeof value === 'string') {
          sanitized[key as keyof T] = this.sanitizeUserInput(value, type) as any;
        } else if (value !== null && value !== undefined) {
          sanitized[key as keyof T] = this.sanitizeUserInput(String(value), type) as any;
        }
      }
    }
    
    return sanitized;
  }
}

// Security validation rules
export const SecurityValidationRules = {
  noScriptTags: {
    validate: (input: string) => ({
      isValid: !XSSProtection.hasDangerousContent(input),
      message: 'Script etiketleri izin verilmez',
      severity: 'error' as const,
    }),
  },

  noSQLInjection: {
    validate: (input: string) => ({
      isValid: SQLInjectionProtection.validate(input),
      message: 'Geçersiz karakterler tespit edildi',
      severity: 'error' as const,
    }),
  },

  maxLength: (max: number) => ({
    validate: (input: string) => ({
      isValid: input.length <= max,
      message: `Maksimum ${max} karakter olmalıdır`,
      severity: 'error' as const,
    }),
  }),

  noSpecialChars: {
    validate: (input: string) => ({
      isValid: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s._-]*$/.test(input),
      message: 'Özel karakterler izin verilmez',
      severity: 'warning' as const,
    }),
  },
};

// Security headers helper
export const SecurityHeaders = {
  getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  },

  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.getCSPHeader(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  },
};
