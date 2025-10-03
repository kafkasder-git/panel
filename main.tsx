import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/globals.css';

import * as Sentry from '@sentry/react';
import { environment, isSentryEnabled } from './lib/environment';
import { sanitizeText } from './lib/security/sanitization';

// Initialize Sentry early so it can capture errors during bootstrap
if (isSentryEnabled()) {
  try {
    Sentry.init({
      dsn: environment.sentry.dsn,
      environment: environment.sentry.environment,
      release: environment.sentry.release || undefined,
      tracesSampleRate: environment.sentry.tracesSampleRate,
      debug: environment.sentry.debug,
      
      // Performance monitoring and session replay integrations
      integrations: [
        new Sentry.BrowserTracing({
          // Trace navigation and routing
          tracingOrigins: ['localhost', /^\//],
          // Enable automatic instrumentation
          traceFetch: true,
          traceXHR: true,
          // Track page load and navigation performance
          enableLongTask: true,
          enableInp: true,
        }),
        new Sentry.Replay({
          // Mask all text content for privacy
          maskAllText: true,
          // Block all media elements (images, video, audio)
          blockAllMedia: true,
          // Network request/response capture
          networkDetailAllowUrls: [window.location.origin],
          networkCaptureBodies: false,
          // Performance optimizations
          useCompression: true,
        }),
      ],
      
      // Session replay sample rates
      replaysSessionSampleRate: environment.sentry.replaysSessionSampleRate,
      replaysOnErrorSampleRate: environment.sentry.replaysOnErrorSampleRate,
      
      beforeSend: (event) => {
        // Filter out events during local development when debug logging is enabled
        // This reduces noise while developing. In later phases, this behavior can be refined.
        if (environment.app.debug && environment.app.mode === 'development') {
          return null;
        }
        return event;
      },
      ignoreErrors: [
        // Common benign errors to ignore
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection',
        'Script error.',
        'NetworkError when attempting to fetch resource.',
      ],
    });

    if (environment.app.debug) {
      // Informative log for developers when Sentry is active
      // Shows which Sentry environment is being used (development/staging/production)
      // For privacy/security, do not log the DSN.
      // eslint-disable-next-line no-console
      console.log(`✅ Sentry initialized for environment: ${environment.sentry.environment}`);
    }
  } catch (initError) {
    // If Sentry initialization fails, don't block app startup. Log the error.
    // eslint-disable-next-line no-console
    console.error('Sentry initialization failed:', initError);
  }
}

// Global error handlers for production
// Note: When Sentry is initialized, it will automatically capture many of these global errors
// through its own global handlers integration. We also explicitly capture these errors here
// to add custom context and tags that help identify the source (e.g., unhandled promise rejections,
// global JS errors, chunk loading issues, and React render failures). This complements Sentry's
// automatic capturing with application-specific metadata to improve filtering and debugging.
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Also send to Sentry with additional context/tags
    if (isSentryEnabled()) {
      try {
        let err: Error;
        if (event.reason instanceof Error) {
          err = event.reason;
        } else if (typeof event.reason === 'string') {
          err = new Error(event.reason);
        } else {
          try {
            err = new Error(JSON.stringify(event.reason));
          } catch (_jsonErr) {
            err = new Error(String(event.reason));
          }
        }

        Sentry.withScope((scope) => {
          scope.setContext('promiseRejection', { reason: event.reason, promise: 'unhandled' });
          scope.setTag('error_type', 'unhandled_rejection');
          scope.setTag('global_handler', 'true');
          scope.setLevel('error');
          Sentry.captureException(err);
        });
      } catch (sentryErr) {
        // Don't allow Sentry failures to interfere with app behavior
        // eslint-disable-next-line no-console
        console.warn('Sentry capture failed for unhandledrejection:', sentryErr);
      }
    }

    // Show user-friendly error message
    const errorContainer = document.getElementById('global-error-container');
    if (!errorContainer) {
      const div = document.createElement('div');
      div.id = 'global-error-container';
      div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #fee;
        border: 1px solid #fcc;
        color: #800;
        padding: 10px;
        text-align: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      // SECURITY FIX: Use textContent instead of innerHTML to prevent XSS
      div.textContent = '⚠️ Bir bağlantı hatası oluştu. Sayfa yenileniyor...';
      document.body.appendChild(div);
      
      // Auto refresh after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    
    // Prevent the default browser error handling
    event.preventDefault();
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Also send to Sentry with additional context/tags
    if (isSentryEnabled()) {
      try {
        const err = event.error ?? new Error(event.message ?? 'Unknown error');
        Sentry.withScope((scope) => {
          scope.setContext('errorEvent', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
          scope.setTag('error_type', 'global_error');
          scope.setTag('global_handler', 'true');
          if (event.filename && typeof event.filename === 'string' && event.filename.includes('chunk')) {
            scope.setTag('chunk_error', 'true');
          }
          scope.setLevel('error');
          Sentry.captureException(err);
        });
      } catch (sentryErr) {
        // eslint-disable-next-line no-console
        console.warn('Sentry capture failed for global error:', sentryErr);
      }
    }
    
    // Don't reload on script loading errors
    if (event.filename && event.filename.includes('chunk')) {
      console.warn('Chunk loading error detected, attempting reload...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });
}

try {
  // Initialize React App
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to initialize app:', error);

  // Capture React render/init errors in Sentry with high severity/fatal
  if (isSentryEnabled()) {
    try {
      const err = error instanceof Error ? error : new Error(String(error));
      Sentry.withScope((scope) => {
        scope.setContext('reactRender', { phase: 'initialization', root: 'main' });
        scope.setTag('error_type', 'react_render');
        scope.setTag('global_handler', 'true');
        scope.setLevel('fatal');
        Sentry.captureException(err);
      });
    } catch (sentryErr) {
      // eslint-disable-next-line no-console
      console.warn('Sentry capture failed for react render error:', sentryErr);
    }
  }
  
  // Fallback UI for critical errors
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 500px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h1 style="color: #1f2937; margin-bottom: 16px; font-size: 24px; font-weight: 600;">
            Uygulama Başlatılamadı
          </h1>
          <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.6;">
            Teknik bir sorun nedeniyle uygulama şu anda başlatılamıyor. 
            Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          <button
            onclick="window.location.reload()"
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              margin: 8px;
            "
          >
            🔄 Sayfayı Yenile
          </button>
          <details style="margin-top: 20px; text-align: left; font-size: 14px;">
            <summary style="cursor: pointer;">Teknik Detaylar</summary>
            <pre style="
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              overflow: auto;
              margin-top: 8px;
              font-size: 12px;
            ">${/* deepcode ignore DOMXSS: Error message is sanitized with sanitizeText() */sanitizeText(error instanceof Error ? error.message : String(error))}</pre>
          </details>
        </div>
      </div>
    `;
  }
}