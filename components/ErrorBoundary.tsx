/**
 * @fileoverview ErrorBoundary Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { logger } from '../lib/logging/logger';
import * as Sentry from '@sentry/react';
import { isSentryEnabled } from '../lib/environment';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary Service
 * 
 * Service class for handling errorboundary operations
 * 
 * @class ErrorBoundary
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });

    // Send React component errors to Sentry for monitoring.
    // The component stack is included to help identify which part of the component tree caused the failure.
    // This block is protected with a try/catch to ensure Sentry integration failures do not break the app.
    if (isSentryEnabled()) {
      try {
        // Use a scoped capture so we can enrich the event with component stack and boundary metadata.
        Sentry.withScope((scope) => {
          scope.setContext('errorInfo', { componentStack: errorInfo?.componentStack });
          scope.setContext('errorBoundary', { hasError: true, errorMessage: error?.message });
          scope.setTag('error_boundary', 'true');
          scope.setLevel('error');
          Sentry.captureException(error);
        });
      } catch (sentryErr) {
        // Don't allow Sentry failures to impact app flow
        logger.warn('Sentry capture failed inside ErrorBoundary:', sentryErr);
      }
    }
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private readonly handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">Bir Hata Oluştu</CardTitle>
              <p className="text-red-600 mt-2">Beklenmeyen bir hata ile karşılaştık</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Dön
                </Button>
              </div>

              {this.state.error && (
                <div className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded">
                  <strong>Hata:</strong> {this.state.error.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook based error boundary for functional components
/**
 * withErrorBoundary function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
 // HOC for error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;