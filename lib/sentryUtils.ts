/**
 * -----------------------------------------------------------------------------
 * Sentry Utilities - User Context and Tag Management
 * -----------------------------------------------------------------------------
 * Provides utilities for setting user context, custom tags, and additional
 * context in Sentry events. All functions are safe to call regardless of the
 * Sentry configuration status; any Sentry SDK errors are caught and logged so
 * they never disrupt application execution.
 * -----------------------------------------------------------------------------
 */

import * as Sentry from '@sentry/react';
import type { User } from '../types/auth';
import environment, { isSentryEnabled } from './environment';
import { logger } from './logging/logger';

/**
 * Safely converts an optional Date to its ISO string representation.
 *
 * @param date - Date instance to convert.
 * @returns ISO string when conversion succeeds, otherwise undefined.
 */
const toIsoString = (date?: Date): string | undefined => {
  if (!date) return undefined;

  try {
    return date.toISOString();
  } catch {
    return undefined;
  }
};

/**
 * Sets or clears the active user in Sentry.
 *
 * Safe to call even when Sentry is disabled; the call becomes a no-op.
 *
 * @param user - Authenticated user information, or null to clear the current user.
 *
 * @example
 * setSentryUser(currentUser);
 * setSentryUser(null);
 */
export const setSentryUser = (user: User | null): void => {
  if (!isSentryEnabled()) return;

  try {
    if (!user) {
      Sentry.setUser(null);
      Sentry.setContext('user', null);
      Sentry.setTag('user_role', 'anonymous');

      if (environment.app.debug) {
        logger.debug('Sentry user context cleared');
      }

      return;
    }

    const lastLoginIso = toIsoString(user.lastLogin);

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      data: {
        role: user.role,
        permissions: Array.isArray(user.permissions) ? user.permissions.length : 0,
        isActive: user.isActive,
        lastLogin: lastLoginIso,
      },
    });

    Sentry.setContext('user', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissionsCount: Array.isArray(user.permissions) ? user.permissions.length : 0,
      isActive: user.isActive,
      lastLogin: lastLoginIso ?? null,
    });

    Sentry.setTag('user_role', user.role);

    if (environment.app.debug) {
      logger.debug('Sentry user context set', {
        userId: user.id,
        role: user.role,
      });
    }
  } catch (error) {
    logger.warn('Failed to synchronize Sentry user context', error);
  }
};

/**
 * Adds structured context data to all subsequent Sentry events.
 *
 * @param contextName - Unique name for the context block.
 * @param contextData - Serializable context payload.
 *
 * @example
 * setSentryContext('featureFlags', { betaDashboard: true });
 */
export const setSentryContext = (contextName: string, contextData: Record<string, unknown>): void => {
  if (!isSentryEnabled()) return;

  if (!contextName) {
    logger.warn('Sentry context name must be provided');
    return;
  }

  try {
    Sentry.setContext(contextName, contextData);
  } catch (error) {
    logger.warn(`Failed to set Sentry context "${contextName}"`, error);
  }
};

/**
 * Applies a single Sentry tag for subsequent events.
 *
 * @param key - Tag key.
 * @param value - Tag value.
 *
 * @example
 * setSentryTag('feature_branch', 'release/v1.2.0');
 */
export const setSentryTag = (key: string, value: string): void => {
  if (!isSentryEnabled()) return;

  if (!key) {
    logger.warn('Sentry tag key must be provided');
    return;
  }

  try {
    Sentry.setTag(key, value);
  } catch (error) {
    logger.warn(`Failed to set Sentry tag "${key}"`, error);
  }
};

/**
 * Applies multiple Sentry tags in a single call.
 *
 * @param tags - Record of tag key-value pairs.
 *
 * @example
 * setSentryTags({ build: '2024-03-04', feature: 'reports' });
 */
export const setSentryTags = (tags: Record<string, string>): void => {
  if (!isSentryEnabled()) return;

  if (!tags || Object.keys(tags).length === 0) {
    logger.warn('Sentry tags object must contain at least one entry');
    return;
  }

  try {
    Sentry.setTags(tags);
  } catch (error) {
    logger.warn('Failed to set Sentry tags', error);
  }
};

/**
 * Clears all user-related Sentry state, returning the application to an
 * anonymous context.
 *
 * @example
 * clearSentryContext();
 */
export const clearSentryContext = (): void => {
  if (!isSentryEnabled()) return;

  try {
    Sentry.setUser(null);
    Sentry.setContext('user', null);
    Sentry.setTag('user_role', 'anonymous');

    if (environment.app.debug) {
      logger.debug('Sentry context reset to anonymous');
    }
  } catch (error) {
    logger.warn('Failed to clear Sentry context', error);
  }
};

/**
 * Starts a new Sentry transaction for performance monitoring.
 *
 * @param name - Transaction name (e.g., "load-dashboard", "api-call").
 * @param op - Transaction operation type (e.g., "navigation", "http.request").
 * @returns Sentry transaction or null if Sentry is disabled.
 *
 * @example
 * const transaction = startSentryTransaction('load-dashboard', 'navigation');
 * if (transaction) {
 *   // ... operations
 *   transaction.finish();
 * }
 */
export const startSentryTransaction = (name: string, op: string): Sentry.Transaction | null => {
  if (!isSentryEnabled()) return null;

  try {
    const transaction = Sentry.startTransaction({
      name,
      op,
      trimEnd: true,
    });

    if (environment.app.debug) {
      logger.debug(`Sentry transaction started: ${name} (${op})`);
    }

    return transaction;
  } catch (error) {
    logger.warn(`Failed to start Sentry transaction "${name}"`, error);
    return null;
  }
};

/**
 * Adds a breadcrumb to track user actions and system events.
 *
 * @param category - Breadcrumb category (e.g., "navigation", "user-action", "api").
 * @param message - Brief description of the event.
 * @param data - Additional structured data for context.
 * @param level - Severity level (default: "info").
 *
 * @example
 * addSentryBreadcrumb('navigation', 'User navigated to dashboard', { module: 'genel' });
 * addSentryBreadcrumb('user-action', 'Button clicked', { buttonId: 'save-form' });
 */
export const addSentryBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info',
): void => {
  if (!isSentryEnabled()) return;

  try {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data: data ?? {},
      timestamp: Date.now() / 1000,
    });

    if (environment.app.debug) {
      logger.debug(`Breadcrumb: [${category}] ${message}`, data);
    }
  } catch (error) {
    logger.warn(`Failed to add Sentry breadcrumb: ${message}`, error);
  }
};

/**
 * Measures the performance of an async operation and reports it to Sentry.
 *
 * @param name - Name of the operation being measured.
 * @param operation - The async function to execute and measure.
 * @param op - Transaction operation type (default: "function").
 * @returns The result of the operation.
 *
 * @example
 * const data = await measureSentryPerformance('fetch-users', async () => {
 *   return await api.getUsers();
 * });
 */
export const measureSentryPerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
  op = 'function',
): Promise<T> => {
  if (!isSentryEnabled()) {
    return await operation();
  }

  const transaction = startSentryTransaction(name, op);

  try {
    const result = await operation();

    if (transaction) {
      transaction.setStatus('ok');
      transaction.finish();
    }

    return result;
  } catch (error) {
    if (transaction) {
      transaction.setStatus('unknown_error');
      transaction.finish();
    }

    throw error;
  }
};