/**
 * @fileoverview security Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../lib/supabase';
import { rateLimit } from './rateLimit';
import { validateCSRF } from './csrf';
import { InputSanitizer } from '../lib/security/InputSanitizer';

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
    // Use existing supabaseAdmin instance to avoid Multiple GoTrueClient warning
    this.supabase = supabaseAdmin;
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
    const url = new URL(request.url);

    // Sanitize query parameters
    const sanitizedSearchParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      sanitizedSearchParams.set(key, InputSanitizer.sanitize(value, 'text'));
    }

    // Create new URL with sanitized params
    const sanitizedUrl = new URL(url.pathname, url.origin);
    sanitizedUrl.search = sanitizedSearchParams.toString();

    // Sanitize request body if present
    let sanitizedBody: unknown = null;
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        sanitizedBody = this.sanitizeObject(body);
      } catch {
        // If body is not JSON, leave it as is
        sanitizedBody = request.body;
      }
    }

    // Create new request with sanitized data
    return new NextRequest(sanitizedUrl, {
      method: request.method,
      headers: request.headers,
      body: sanitizedBody !== null ? JSON.stringify(sanitizedBody) : request.body,
    });
  }

  // Recursively sanitize object properties
  private sanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return InputSanitizer.sanitize(obj, 'text');
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[InputSanitizer.sanitize(key, 'text')] = this.sanitizeObject(value);
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
    const { method } = request;

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
          (permission) => user.role === permission || user.permissions.includes(permission),
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
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();
