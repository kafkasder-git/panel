/**
 * @fileoverview security Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from './rateLimit';
import { validateCSRF } from './csrf';
import { sanitizeInput } from '../utils/sanitization';

import { logger } from '../lib/logging/logger';
// Security middleware for API routes
/**
 * SecurityMiddleware Service
 * 
 * Service class for handling securitymiddleware operations
 * 
 * @class SecurityMiddleware
 */
export class SecurityMiddleware {
  private readonly supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  // Main security middleware
  async handle(
    request: NextRequest,
    handler: (request: NextRequest, user: unknown) => Promise<NextResponse>,
  ) {
    try {
      // 1. Rate limiting
      const rateLimitResult = await rateLimit(request);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
          { status: 429 },
        );
      }

      // 2. CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfValid = await validateCSRF(request);
        if (!csrfValid) {
          return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
        }
      }

      // 3. Authentication check
      const authResult = await this.validateAuthentication(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
      }

      // 4. Input sanitization
      const sanitizedRequest = await this.sanitizeRequest(request);

      // 5. Authorization check
      const authzResult = await this.checkAuthorization(sanitizedRequest, authResult.user);
      if (!authzResult.success) {
        return NextResponse.json({ error: authzResult.error }, { status: 403 });
      }

      // 6. Execute the actual handler
      const response = await handler(sanitizedRequest, authResult.user);

      // 7. Add security headers
      return this.addSecurityHeaders(response);
    } catch (error) {
      logger.error('Security middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Validate JWT token and user session
  private async validateAuthentication(request: NextRequest) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
        status: 401,
      };
    }

    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return {
          success: false,
          error: 'Invalid or expired token',
          status: 401,
        };
      }

      // Check if user is active
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('status, role, permissions')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        return {
          success: false,
          error: 'User profile not found',
          status: 401,
        };
      }

      if (userProfile.status !== 'active') {
        return {
          success: false,
          error: 'User account is not active',
          status: 403,
        };
      }

      return {
        success: true,
        user: {
          ...user,
          role: userProfile.role,
          permissions: userProfile.permissions || [],
        },
      };
    } catch (error) {
      logger.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        status: 401,
      };
    }
  }

  // Sanitize request body and query parameters
  private async sanitizeRequest(request: NextRequest) {
    // Import the more comprehensive InputSanitizer
    const { XSSProtection, InputSanitizer } = await import('../lib/security/InputSanitizer');
    
    const url = new URL(request.url);

    // Validate Content-Type header to prevent content-type confusion attacks
    const contentType = request.headers.get('content-type') || '';
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
        contentType.includes('application/json') && 
        !contentType.startsWith('application/json')) {
      throw new Error('Invalid Content-Type header');
    }

    // Sanitize query parameters
    const sanitizedSearchParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      // Use improved sanitizer for different parameter types
      let sanitizedValue = value;
      if (key.includes('email')) {
        sanitizedValue = InputSanitizer.sanitizeEmail(value);
      } else if (key.includes('url') || key.includes('link')) {
        sanitizedValue = XSSProtection.sanitizeURL(value);
      } else {
        sanitizedValue = XSSProtection.sanitizeText(value);
      }
      sanitizedSearchParams.set(key, sanitizedValue);
    }

    // Create new URL with sanitized params
    const sanitizedUrl = new URL(url.pathname, url.origin);
    sanitizedUrl.search = sanitizedSearchParams.toString();

    // Implement request size limits to prevent DoS attacks
    const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10 MB
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_REQUEST_SIZE) {
      throw new Error('Request body too large');
    }

    // Sanitize request body if present
    let sanitizedBody: any = null;
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        // Use improved sanitization function that leverages InputSanitizer
        sanitizedBody = await this.sanitizeComplexObject(body);
      } catch (error) {
        // If body is not JSON, leave it as is
        sanitizedBody = request.body;
      }
    }

    // Create new request with sanitized data
    return new NextRequest(sanitizedUrl, {
      method: request.method,
      headers: request.headers,
      body: sanitizedBody ? JSON.stringify(sanitizedBody) : request.body,
    });
  }

  // Recursively sanitize object properties with more comprehensive protection
  private async sanitizeComplexObject(obj: unknown): Promise<unknown> {
    // Import the more comprehensive InputSanitizer
    const { XSSProtection, InputSanitizer } = await import('../lib/security/InputSanitizer');
    
    if (typeof obj === 'string') {
      // Apply deep sanitization for strings
      return XSSProtection.sanitizeHTML(obj);
    }

    if (Array.isArray(obj)) {
      // Process arrays recursively
      return Promise.all(obj.map(item => this.sanitizeComplexObject(item)));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      
      // For each key-value pair, apply appropriate sanitization based on key name
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key itself
        const sanitizedKey = XSSProtection.sanitizeText(key);
        
        // Apply context-aware sanitization based on field name
        if (typeof value === 'string') {
          if (key.includes('email')) {
            sanitized[sanitizedKey] = InputSanitizer.sanitizeEmail(value);
          } else if (key.includes('url') || key.includes('link')) {
            sanitized[sanitizedKey] = XSSProtection.sanitizeURL(value);
          } else if (key.includes('html') || key.includes('content')) {
            sanitized[sanitizedKey] = XSSProtection.sanitizeHTML(value);
          } else if (key.includes('phone')) {
            sanitized[sanitizedKey] = InputSanitizer.sanitizePhone ? InputSanitizer.sanitizePhone(value) : XSSProtection.sanitizeText(value);
          } else if (key.includes('name')) {
            sanitized[sanitizedKey] = XSSProtection.sanitizeText(value);
          } else {
            // Default sanitization
            sanitized[sanitizedKey] = XSSProtection.sanitizeText(value);
          }
        } else {
          // Recursively sanitize nested objects
          sanitized[sanitizedKey] = await this.sanitizeComplexObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  // Check user authorization for the requested resource
  private async checkAuthorization(
    request: NextRequest,
    user: {
      id: string;
      role: string;
      permissions: string[];
    },
  ) {
    const url = new URL(request.url);
    const path = url.pathname;
    const {method} = request;

    // Define permission requirements for different endpoints
    const permissionMap: Record<string, { methods: string[]; permissions: string[] }> = {
      '/api/admin': {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        permissions: ['admin'],
      },
      '/api/members': {
        methods: ['GET'],
        permissions: ['view_members', 'admin', 'manager'],
      },
      '/api/members/create': {
        methods: ['POST'],
        permissions: ['create_members', 'admin', 'manager'],
      },
      '/api/donations': {
        methods: ['GET'],
        permissions: ['view_donations', 'admin', 'manager', 'operator'],
      },
      '/api/donations/create': {
        methods: ['POST'],
        permissions: ['create_donations', 'admin', 'manager', 'operator'],
      },
      '/api/finance': {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        permissions: ['manage_finance', 'admin', 'manager'],
      },
    };

    // Check if path requires specific permissions
    for (const [pattern, config] of Object.entries(permissionMap)) {
      if (path.startsWith(pattern) && config.methods.includes(method)) {
        const hasPermission = config.permissions.some(
          (permission) => user.role === permission ?? user.permissions.includes(permission),
        );

        if (!hasPermission) {
          return {
            success: false,
            error: 'Insufficient permissions',
          };
        }
      }
    }

    return { success: true };
  }

  // Add security headers to response
  private addSecurityHeaders(response: NextResponse) {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
    
    // Additional security headers
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Content Security Policy - aligned with vercel.json for consistency
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();
