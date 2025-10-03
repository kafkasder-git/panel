/**
 * Security Middleware for API calls and data protection
 */

import { PermissionManager, AuditLogger, type Permission } from './PermissionManager';
import { InputSanitizer, CSRFProtection, RateLimiter } from './InputSanitizer';

import { logger } from './logging/logger';
// API Security Wrapper
/**
 * SecureAPIClient Service
 *
 * Service class for handling secureapiclient operations
 *
 * @class SecureAPIClient
 */
export class SecureAPIClient {
  private static readonly baseURL =
    (import.meta?.env?.VITE_API_URL || process.env.VITE_API_URL) ?? '';
  private static readonly sessionId = crypto.getRandomValues(new Uint8Array(16)).join('');

  static async secureRequest(
    endpoint: string,
    options: RequestInit = {},
    requiredPermission?: Permission,
  ): Promise<Response> {
    // Permission check
    if (requiredPermission && !PermissionManager.hasPermission(requiredPermission)) {
      throw new Error(`Bu işlem için '${requiredPermission}' yetkisi gereklidir`);
    }

    // Rate limiting
    const identifier = this.getClientIdentifier();
    if (!RateLimiter.checkLimit(identifier, 100, 60000)) {
      // 100 requests per minute
      throw new Error('Çok fazla istek gönderiyorsunuz. Lütfen bekleyiniz.');
    }

    // CSRF protection for state-changing operations
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method ?? 'GET');
    let csrfToken = '';

    if (isStateChanging) {
      csrfToken = CSRFProtection.generateToken(this.sessionId);
    }

    // Sanitize request body
    if (options.body && typeof options.body === 'string') {
      try {
        const bodyData = JSON.parse(options.body);
        const sanitizedData = InputSanitizer.sanitizeFormData(bodyData);
        options.body = JSON.stringify(sanitizedData);
      } catch (error) {
        // If not JSON, sanitize as text
        options.body = InputSanitizer.sanitizeUserInput(options.body, 'text');
      }
    }

    // Add security headers
    const secureHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(isStateChanging && { 'X-CSRF-Token': csrfToken }),
      'X-Client-Version': '1.0.0',
      'X-Timestamp': Date.now().toString(),
      ...options.headers,
    };

    // Audit logging
    AuditLogger.log('api_request', endpoint, {
      method: options.method ?? 'GET',
      hasPermission: Boolean(requiredPermission),
      bodySize: options.body ? options.body.length : 0,
    });

    try {
      const response = await fetch(this.baseURL + endpoint, {
        ...options,
        headers: secureHeaders,
      });

      // Log response
      AuditLogger.log('api_response', endpoint, {
        status: response.status,
        success: response.ok,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      // Log error
      AuditLogger.log('api_error', endpoint, {
        error: error.message,
        method: options.method ?? 'GET',
      });

      throw error;
    }
  }

  private static getClientIdentifier(): string {
    // Create a client identifier for rate limiting
    return `${navigator.userAgent.slice(0, 50)}_${this.sessionId}`;
  }

  // Secure GET request
  static async get(endpoint: string, requiredPermission?: Permission): Promise<any> {
    const response = await this.secureRequest(endpoint, { method: 'GET' }, requiredPermission);
    return response.json();
  }

  // Secure POST request
  static async post(endpoint: string, data: any, requiredPermission?: Permission): Promise<any> {
    const response = await this.secureRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      requiredPermission,
    );
    return response.json();
  }

  // Secure PUT request
  static async put(endpoint: string, data: any, requiredPermission?: Permission): Promise<any> {
    const response = await this.secureRequest(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      requiredPermission,
    );
    return response.json();
  }

  // Secure DELETE request
  static async delete(endpoint: string, requiredPermission?: Permission): Promise<any> {
    const response = await this.secureRequest(endpoint, { method: 'DELETE' }, requiredPermission);
    return response.json();
  }
}

// Security Context Provider
/**
 * SecurityContext Service
 *
 * Service class for handling securitycontext operations
 *
 * @class SecurityContext
 */
export class SecurityContext {
  private static instance: SecurityContext | null = null;
  private securityConfig: SecurityConfig;

  private constructor(config: SecurityConfig) {
    this.securityConfig = config;
  }

  static getInstance(config?: SecurityConfig): SecurityContext {
    if (!this.instance && config) {
      this.instance = new SecurityContext(config);
    }
    return this.instance!;
  }

  getConfig(): SecurityConfig {
    return this.securityConfig;
  }

  updateConfig(updates: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...updates };
  }

  isFeatureEnabled(feature: keyof SecurityConfig): boolean {
    return this.securityConfig[feature] === true;
  }
}

/**
 * SecurityConfig Interface
 *
 * @interface SecurityConfig
 */
export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  enableInputSanitization: boolean;
  maxRequestsPerMinute: number;
  sessionTimeoutMinutes: number;
  requireHTTPS: boolean;
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  enableCSRFProtection: true,
  enableRateLimiting: true,
  enableAuditLogging: true,
  enableInputSanitization: true,
  maxRequestsPerMinute: 100,
  sessionTimeoutMinutes: 60,
  requireHTTPS:
    (typeof import.meta !== 'undefined' && import.meta.env?.PROD) ||
    process.env.NODE_ENV === 'production',
};

// Security monitoring
/**
 * SecurityMonitor Service
 *
 * Service class for handling securitymonitor operations
 *
 * @class SecurityMonitor
 */
export class SecurityMonitor {
  private static threats: SecurityThreat[] = [];

  static reportThreat(threat: SecurityThreat): void {
    this.threats.push({
      ...threat,
      timestamp: new Date().toISOString(),
      id: crypto.getRandomValues(new Uint8Array(16)).join(''),
    });

    // Alert if critical
    if (threat.severity === 'critical') {
      logger.error('CRITICAL SECURITY THREAT:', threat);

      // In production, send to security service
      if (
        (typeof import.meta !== 'undefined' && import.meta.env?.PROD) ||
        process.env.NODE_ENV === 'production'
      ) {
        this.sendThreatAlert(threat);
      }
    }

    // Keep only last 1000 threats
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
  }

  private static async sendThreatAlert(threat: SecurityThreat): Promise<void> {
    try {
      await fetch('/api/security/threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threat),
      });
    } catch (error) {
      logger.error('Failed to send threat alert:', error);
    }
  }

  static getThreats(): SecurityThreat[] {
    return [...this.threats];
  }

  static getThreatsByType(type: string): SecurityThreat[] {
    return this.threats.filter((threat) => threat.type === type);
  }

  static clearThreats(): void {
    this.threats = [];
  }
}

/**
 * SecurityThreat Interface
 *
 * @interface SecurityThreat
 */
export interface SecurityThreat {
  id?: string;
  type:
    | 'xss'
    | 'sql_injection'
    | 'csrf'
    | 'rate_limit'
    | 'unauthorized_access'
    | 'suspicious_input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  details?: Record<string, any>;
}

// Security hooks for React components
export const useSecurityValidation = (initialData: Record<string, any> = {}) => {
  const [data, setData] = React.useState(initialData);
  const [securityErrors, setSecurityErrors] = React.useState<Record<string, string[]>>({});

  const validateAndSet = React.useCallback(
    (
      field: string,
      value: any,
      type: 'text' | 'html' | 'url' | 'email' | 'phone' | 'tcKimlik' | 'iban' = 'text',
    ) => {
      // Sanitize input
      const sanitizedValue = InputSanitizer.sanitizeUserInput(value, type);

      // Check for security threats
      const originalValue = String(value ?? '');
      if (originalValue !== sanitizedValue) {
        SecurityMonitor.reportThreat({
          type: 'suspicious_input',
          severity: 'medium',
          message: `Suspicious input detected in field: ${field}`,
          source: 'form_input',
          details: { field, originalValue, sanitizedValue },
        });

        setSecurityErrors((prev) => ({
          ...prev,
          [field]: ['Güvenlik nedeniyle input temizlendi'],
        }));
      } else {
        setSecurityErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      setData((prev) => ({ ...prev, [field]: sanitizedValue }));
    },
    [],
  );

  const validateAll = React.useCallback(() => {
    const sanitizedData = InputSanitizer.sanitizeFormData(data);
    setData(sanitizedData);
    return sanitizedData;
  }, [data]);

  return {
    data,
    securityErrors,
    validateAndSet,
    validateAll,
    hasSecurityErrors: Object.keys(securityErrors).length > 0,
  };
};
