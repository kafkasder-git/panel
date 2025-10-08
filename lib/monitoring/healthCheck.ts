/**
 * @fileoverview Health Check System
 * @description Monitor application and service health
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import { environment } from '../environment';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: HealthCheck;
    authentication: HealthCheck;
    storage: HealthCheck;
    environment: HealthCheck;
  };
  metrics?: {
    uptime: number;
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
  details?: any;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface PerformanceMetrics {
  loadTime: number;
  domReady: number;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!isSupabaseConfigured()) {
      return {
        status: 'fail',
        message: 'Supabase not configured',
        responseTime: Date.now() - startTime,
      };
    }

    // Simple query to test connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (acceptable)
      return {
        status: 'fail',
        message: `Database error: ${error.message}`,
        responseTime,
        details: { code: error.code },
      };
    }

    if (responseTime > 1000) {
      return {
        status: 'warn',
        message: 'Database response slow',
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Database connected',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check authentication service
 */
async function checkAuthentication(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!isSupabaseConfigured()) {
      return {
        status: 'fail',
        message: 'Authentication not configured',
        responseTime: Date.now() - startTime,
      };
    }

    // Check if we can get session
    const { data, error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'fail',
        message: `Auth error: ${error.message}`,
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Authentication service available',
      responseTime,
      details: { hasSession: !!data.session },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Auth check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check storage service
 */
async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!isSupabaseConfigured()) {
      return {
        status: 'fail',
        message: 'Storage not configured',
        responseTime: Date.now() - startTime,
      };
    }

    // List buckets to test storage
    const { data, error } = await supabase.storage.listBuckets();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'warn',
        message: `Storage warning: ${error.message}`,
        responseTime,
      };
    }

    return {
      status: 'pass',
      message: 'Storage service available',
      responseTime,
      details: { buckets: data?.length || 0 },
    };
  } catch (error) {
    return {
      status: 'warn',
      message: `Storage check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheck {
  const issues: string[] = [];

  if (!environment.supabase.url) {
    issues.push('Supabase URL not set');
  }

  if (!environment.supabase.anonKey) {
    issues.push('Supabase anon key not set');
  }

  if (environment.mode === 'production' && !environment.sentry?.dsn) {
    issues.push('Sentry not configured for production');
  }

  if (issues.length > 0) {
    return {
      status: 'warn',
      message: 'Environment configuration issues',
      details: { issues },
    };
  }

  return {
    status: 'pass',
    message: 'Environment properly configured',
    details: {
      mode: environment.mode,
      version: environment.app.version,
    },
  };
}

/**
 * Get memory metrics
 */
function getMemoryMetrics(): MemoryMetrics | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null;
  }

  const {memory} = (performance as any);
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

/**
 * Get performance metrics
 */
function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  return {
    loadTime: navigation.loadEventEnd - navigation.fetchStart,
    domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
  };
}

/**
 * Get system uptime
 */
function getUptime(): number {
  if (typeof window === 'undefined' || !window.performance) {
    return 0;
  }

  return Math.floor(performance.now() / 1000);
}

/**
 * Perform complete health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const [database, authentication, storage] = await Promise.all([
    checkDatabase(),
    checkAuthentication(),
    checkStorage(),
  ]);

  const environment = checkEnvironment();

  // Determine overall status
  const checks = { database, authentication, storage, environment };
  const hasFailure = Object.values(checks).some(check => check.status === 'fail');
  const hasWarning = Object.values(checks).some(check => check.status === 'warn');

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: environment.details?.version || '1.0.0',
    checks,
    metrics: {
      uptime: getUptime(),
      memory: getMemoryMetrics() || { used: 0, total: 0, percentage: 0 },
      performance: getPerformanceMetrics() || { loadTime: 0, domReady: 0 },
    },
  };
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(interval = 60000) {
  let intervalId: NodeJS.Timeout;

  const check = async () => {
    const health = await performHealthCheck();
    
    // Log health status
    if (health.status === 'unhealthy') {
      console.error('🔴 System unhealthy:', health);
    } else if (health.status === 'degraded') {
      console.warn('🟡 System degraded:', health);
    } else {
      console.log('🟢 System healthy');
    }

    // Store in localStorage for status page
    try {
      localStorage.setItem('health-status', JSON.stringify(health));
    } catch (error) {
      console.error('Failed to store health status:', error);
    }
  };

  // Initial check
  check();

  // Periodic checks
  intervalId = setInterval(check, interval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Get cached health status
 */
export function getCachedHealthStatus(): HealthStatus | null {
  try {
    const cached = localStorage.getItem('health-status');
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

export default {
  performHealthCheck,
  startHealthMonitoring,
  getCachedHealthStatus,
};
