/**
 * @fileoverview error-report Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import type { ErrorInfo } from 'react';

import { logger } from '../../lib/logging/logger';
import * as Sentry from '@sentry/react';
import { isSentryEnabled } from '../../lib/environment';
/**
 * StorageLike Interface
 * 
 * @interface StorageLike
 */
export interface StorageLike {
  getItem: (key: string) => string | null;
}

/**
 * EnvironmentSource Interface
 * 
 * @interface EnvironmentSource
 */
export interface EnvironmentSource {
  navigator?: Pick<Navigator, 'userAgent'> | { userAgent?: string };
  location?: Pick<Location, 'href'> | { href?: string };
  storage?: StorageLike;
  dateFactory?: () => Date;
}

/**
 * ErrorEnvironment Interface
 * 
 * @interface ErrorEnvironment
 */
export interface ErrorEnvironment {
  userAgent: string;
  url: string;
  userId: string;
}

/**
 * ErrorReport Interface
 * 
 * @interface ErrorReport
 */
export interface ErrorReport {
  errorId?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  environment: ErrorEnvironment;
}

const DEFAULT_ENVIRONMENT_SOURCE: Required<Pick<EnvironmentSource, 'dateFactory'>> &
  EnvironmentSource = {
  navigator: typeof navigator !== 'undefined' ? navigator : undefined,
  location: typeof window !== 'undefined' ? window.location : undefined,
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  dateFactory: () => new Date(),
};

const mergeEnvironmentSource = (
  source?: EnvironmentSource,
): Required<Pick<EnvironmentSource, 'dateFactory'>> & EnvironmentSource => ({
  navigator: source?.navigator ?? DEFAULT_ENVIRONMENT_SOURCE.navigator,
  location: source?.location ?? DEFAULT_ENVIRONMENT_SOURCE.location,
  storage: source?.storage ?? DEFAULT_ENVIRONMENT_SOURCE.storage,
  dateFactory: source?.dateFactory ?? DEFAULT_ENVIRONMENT_SOURCE.dateFactory,
});

export const getEnvironmentInfo = (source?: EnvironmentSource): ErrorEnvironment => {
  const merged = mergeEnvironmentSource(source);

  const userAgent =
    typeof merged.navigator?.userAgent === 'string' && merged.navigator.userAgent.trim().length > 0
      ? merged.navigator.userAgent
      : 'unknown';

  const url =
    typeof merged.location?.href === 'string' && merged.location.href.trim().length > 0
      ? merged.location.href
      : 'unknown';

  let userId = 'anonymous';
  const {storage} = merged;

  if (storage?.getItem) {
    try {
      const storedId = storage.getItem('user_id');
      if (storedId && storedId.trim().length > 0) {
        userId = storedId;
      }
    } catch (error) {
      logger.warn('[EnhancedErrorBoundary] Unable to access user_id from storage:', error);
    }
  }

  return {
    userAgent,
    url,
    userId,
  };
};

interface CreateErrorReportParams {
  errorId?: string;
  error: Error;
  errorInfo: Pick<ErrorInfo, 'componentStack'>;
  environmentSource?: EnvironmentSource;
}

export const createErrorReport = ({
  errorId,
  error,
  errorInfo,
  environmentSource,
}: CreateErrorReportParams): ErrorReport => {
  const mergedSource = mergeEnvironmentSource(environmentSource);
  const environment = getEnvironmentInfo(mergedSource);
  const { dateFactory } = mergedSource;

  // After creating the report you can optionally call sendErrorReportToSentry(report, error)
  // to send this structured report to Sentry if Sentry is configured and enabled.
  return {
    errorId,
    message: error.message,
    stack: typeof error.stack === 'string' ? error.stack : undefined,
    componentStack: errorInfo.componentStack,
    timestamp: dateFactory().toISOString(),
    environment,
  };
};

/**
 * sendErrorReportToSentry
 *
 * Sends a structured error report to Sentry with additional context and tags.
 *
 * This function is safe to call even if Sentry is not configured or enabled.
 * It will return early when Sentry is disabled. Any errors during the attempt
 * to send to Sentry are caught and logged via the application's logger to avoid
 * causing additional failures.
 *
 * @param {ErrorReport} report - The structured error report created by createErrorReport()
 * @param {Error} error - The original Error instance to capture in Sentry
 *
 * Usage example:
 * const report = createErrorReport({ errorId: '123', error, errorInfo, environmentSource });
 * sendErrorReportToSentry(report, error);
 */
export const sendErrorReportToSentry = (report: ErrorReport, error: Error): void => {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.withScope((scope) => {
      try {
        scope.setContext('errorReport', {
          errorId: report.errorId,
          message: report.message,
          timestamp: report.timestamp,
        });

        scope.setContext('environment', report.environment);

        scope.setTag('error_report', 'true');

        if (report.environment && report.environment.userId) {
          scope.setTag('user_id', report.environment.userId);
        }

        if (report.errorId) {
          scope.setTag('error_id', String(report.errorId));
        }

        if (report.componentStack) {
          scope.setContext('react', { componentStack: report.componentStack });
        }

        // Default level for error reports
        scope.setLevel('error');

        Sentry.captureException(error);
      } catch (inner) {
        // If something goes wrong while setting scope data, log and still attempt capture
        logger.warn('[sendErrorReportToSentry] Error while preparing Sentry scope:', inner);
        try {
          Sentry.captureException(error);
        } catch (captureErr) {
          logger.warn('[sendErrorReportToSentry] Failed to capture exception after scope failure:', captureErr);
        }
      }
    });
  } catch (sentryError) {
    logger.warn('[sendErrorReportToSentry] Failed to send error report to Sentry:', sentryError);
  }
};