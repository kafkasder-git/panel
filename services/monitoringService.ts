/**
 * @fileoverview monitoringService Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import * as Sentry from '@sentry/react';
import { logger } from '../lib/logging/logger';
import { startSentryTransaction, addSentryBreadcrumb } from '../lib/sentryUtils';
import { isSentryEnabled } from '../lib/environment';

// Monitoring service with required methods and performance instrumentation
export const monitoring = {
  /**
   * Track generic events with optional data
   */
  trackEvent: (event: string | Record<string, unknown>, data?: Record<string, unknown>) => {
    if (typeof event === 'string') {
      logger.info('Event tracked:', event, data);
      addSentryBreadcrumb('user-action', event, data);
    } else {
      logger.info('Event tracked:', event);
      addSentryBreadcrumb('user-action', 'Event tracked', event);
    }
  },

  /**
   * Track errors with context
   */
  trackError: (error: string, data?: Record<string, unknown>) => {
    logger.error('Error tracked:', error, data);
    addSentryBreadcrumb('error', error, data, 'error');
  },

  /**
   * Track API calls with performance metrics
   */
  trackApiCall: (endpoint: string, method: string, duration: number, status: number, data?: Record<string, unknown>) => {
    logger.info('API call tracked:', { endpoint, method, duration, status, data });
    
    // Add breadcrumb for API calls
    addSentryBreadcrumb('api', `${method} ${endpoint}`, {
      method,
      endpoint,
      duration,
      status,
      ...data,
    });

    // Create a span for the API call if within an active transaction
    if (isSentryEnabled()) {
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
      if (transaction) {
        const span = transaction.startChild({
          op: 'http.client',
          description: `${method} ${endpoint}`,
          data: {
            method,
            endpoint,
            status,
            duration,
            ...data,
          },
        });
        
        span.setStatus(status >= 200 && status < 300 ? 'ok' : 'unknown_error');
        span.finish();
      }
    }
  },

  /**
   * Track feature usage for analytics
   */
  trackFeatureUsage: (feature: string, action: string, data?: Record<string, unknown>) => {
    logger.info('Feature usage tracked:', { feature, action, data });
    addSentryBreadcrumb('feature', `${feature}:${action}`, data);
  },

  /**
   * Start a new performance transaction
   */
  startTransaction: (name: string, op: string): Sentry.Transaction | null => {
    const transaction = startSentryTransaction(name, op);
    logger.debug(`Transaction started: ${name} (${op})`);
    return transaction;
  },

  /**
   * Finish a transaction with optional data
   */
  finishTransaction: (transaction: Sentry.Transaction | null, data?: Record<string, unknown>): void => {
    if (!transaction) return;

    try {
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          transaction.setData(key, value);
        });
      }

      transaction.setStatus('ok');
      transaction.finish();
      logger.debug(`Transaction finished: ${transaction.name}`);
    } catch (error) {
      logger.warn('Failed to finish transaction', error);
    }
  },

  /**
   * Measure the performance of an async operation
   */
  measurePerformance: async <T>(
    name: string,
    operation: () => Promise<T>,
    op = 'function',
  ): Promise<T> => {
    const transaction = monitoring.startTransaction(name, op);
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      if (transaction) {
        transaction.setData('duration', duration);
        transaction.setStatus('ok');
        transaction.finish();
      }

      logger.debug(`Performance: ${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (transaction) {
        transaction.setData('duration', duration);
        transaction.setStatus('unknown_error');
        transaction.finish();
      }

      logger.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  /**
   * Create a custom span within the current transaction
   */
  startSpan: (description: string, op: string): Sentry.Span | null => {
    if (!isSentryEnabled()) return null;

    try {
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
      if (!transaction) {
        logger.debug('No active transaction for span:', description);
        return null;
      }

      const span = transaction.startChild({
        op,
        description,
      });

      logger.debug(`Span started: ${description} (${op})`);
      return span;
    } catch (error) {
      logger.warn('Failed to start span', error);
      return null;
    }
  },

  /**
   * Finish a span with optional data
   */
  finishSpan: (span: Sentry.Span | null, data?: Record<string, unknown>): void => {
    if (!span) return;

    try {
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          span.setData(key, value);
        });
      }

      span.setStatus('ok');
      span.finish();
      logger.debug(`Span finished: ${span.description}`);
    } catch (error) {
      logger.warn('Failed to finish span', error);
    }
  },
};

const monitoringService = {
  trackEvent: monitoring.trackEvent,
  trackError: monitoring.trackError,
  trackApiCall: monitoring.trackApiCall,
  trackFeatureUsage: monitoring.trackFeatureUsage,
  startTransaction: monitoring.startTransaction,
  finishTransaction: monitoring.finishTransaction,
  measurePerformance: monitoring.measurePerformance,
  startSpan: monitoring.startSpan,
  finishSpan: monitoring.finishSpan,
};

export default monitoringService;
