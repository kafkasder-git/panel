/**
 * @fileoverview Main Application Component
 *
 * This is the root component of the Dernek Yönetim Sistemi (Association Management System).
 * It provides the main application structure with authentication, navigation, and core functionality.
 *
 * Key Features:
 * - Supabase authentication integration
 * - Performance optimizations with React.memo and useMemo
 * - Global keyboard shortcuts
 * - UX analytics tracking
 * - Responsive design with mobile support
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useCallback, useEffect, useState, memo, useMemo } from 'react';

// Sentry utilities and environment metadata
import { setSentryTags, setSentryContext, addSentryBreadcrumb } from './lib/sentryUtils';
import { environment } from './lib/environment';

// Core System Imports
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

// App Management Components
import NavigationProvider, { useNavigation } from './components/app/NavigationManager';
import PageRenderer from './components/app/PageRenderer';

// Layout Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// UX Components
// import { useUXAnalytics } from './components/ux/hooks/useUXAnalytics';

// Performance Hooks
import { useGlobalShortcuts } from './hooks/useKeyboard';
import { useUserPreferences } from './hooks/useLocalStorage';

/**
 * Main Application Content Component
 *
 * This is the core application component that renders the main UI structure.
 * It handles authentication state, navigation, theme management, and user interactions.
 *
 * @component
 * @returns {JSX.Element} The main application content with sidebar, header, and page renderer
 *
 * @example
 * ```tsx
 * <AppContent />
 * ```
 */
const AppContent = memo(() => {
  // AI system removed
  // const { trackFeatureUse } = useUXAnalytics();
  const navigation = useNavigation();
  const { isLoading } = useSupabaseAuth();

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // User preferences for theme management
  const { preferences } = useUserPreferences();

  // Memoized theme configuration
  const themeConfig = useMemo(
    () => ({
      isDark: preferences.theme === 'dark',
      theme: preferences.theme || 'light',
    }),
    [preferences.theme],
  );

  // Dark mode initialization
  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeConfig.isDark);
  }, [themeConfig.isDark]);

  // Keyboard shortcut handlers
  const handleGlobalSearch = useCallback(() => {
    const searchInput = document.querySelector(
      'input[placeholder*="⌘K"], input[placeholder*="Ctrl+K"], input[placeholder*="Ara"]',
    );
    if (searchInput) {
      (searchInput as HTMLInputElement).focus();
      (searchInput as HTMLInputElement).select();
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (navigation.loading) return;
    navigation.setLoading(true);
    setTimeout(() => {
      navigation.setLoading(false);
    }, 150);
  }, [navigation]);

  const handleNewItem = useCallback(() => {
    const addButton = document.querySelector(
      'button[aria-label*="Ekle"], button[title*="Ekle"], button[class*="add"], button[class*="new"]',
    );

    if (
      addButton?.textContent &&
      (addButton.textContent.includes('Ekle') ||
        addButton.textContent.includes('Yeni') ||
        addButton.querySelector('svg'))
    ) {
      (addButton as HTMLElement).click();
    }
  }, []);

  // Quick action handler
  const handleQuickAction = useCallback(
    (actionId: string) => {
      // trackFeatureUse('quick-action', actionId, {
      //   source: 'header-actions',
      // });
      // AI tracking removed

      const actionMap = {
        'new-beneficiary': {
          module: 'yardim',
          subPage: '/yardim/ihtiyac-sahipleri',
        },
        'new-aid-application': {
          module: 'yardim',
          subPage: '/yardim/basvurular',
        },
        'new-donation': {
          module: 'bagis',
          subPage: '/bagis/liste',
        },
        'new-member': { module: 'uye', subPage: '/uye/yeni' },
        'record-donation': {
          module: 'bagis',
          subPage: '/bagis/liste',
        },
        'expense-entry': {
          module: 'fon',
          subPage: '/fon/gelir-gider',
        },
      };

      const action = actionMap[actionId as keyof typeof actionMap];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (action) {
        // Add breadcrumb for quick action
        addSentryBreadcrumb(
          'user-action',
          `Quick action: ${actionId}`,
          { 
            actionId, 
            module: action.module, 
            subPage: action.subPage 
          }
        );

        navigation.setActiveModule(action.module);
        navigation.setCurrentSubPage(action.subPage);
      }
    },
    [navigation],
  );

  // Initialize keyboard shortcuts
  useGlobalShortcuts({
    onSearch: handleGlobalSearch,
    onRefresh: handleRefresh,
    onNewItem: handleNewItem,
  });

  // Use the authentication state for conditional rendering
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        {/* Header */}
        <div className="relative z-40 shadow-lg" data-testid="header" data-onboarding="header">
          <Header
            onNavigateToProfile={navigation.navigateToProfile}
            onNavigateToSettings={navigation.navigateToSettings}
            onNavigateToUserManagement={navigation.navigateToUserManagement}
            onNavigate={navigation.moduleChange}
            onQuickAction={handleQuickAction}
            currentModule={navigation.activeModule}
            onMobileMenuToggle={() => {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            }}
          />
        </div>

        {/* Main Layout */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="relative z-30 shadow-lg" data-testid="sidebar" data-onboarding="sidebar">
            <Sidebar
              activeModule={navigation.activeModule}
              onModuleChange={navigation.moduleChange}
              onSubPageChange={navigation.subPageChange}
              onNavigateToProfile={navigation.navigateToProfile}
              onNavigateToSettings={navigation.navigateToSettings}
              onNavigateToUserManagement={navigation.navigateToUserManagement}
              isMobileOpen={isMobileSidebarOpen}
              onMobileToggle={() => {
                setIsMobileSidebarOpen(!isMobileSidebarOpen);
              }}
            />
          </div>

          {/* Main Content */}
          <main
            className="relative flex-1 bg-white/50 backdrop-blur-sm"
            data-onboarding="main-content"
          >
            <div className="scrollbar-thin h-full overflow-auto">
              <div
                className="relative z-10 p-6"
                data-testid="dashboard"
                data-onboarding="dashboard"
              >
                <PageRenderer onQuickAction={handleQuickAction} />
              </div>
            </div>
          </main>
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-amber-500 px-3 py-2 text-sm text-white">
            📱 Çevrimdışı Modu
          </div>
        )}

        {/* Notification Center */}
        {/* NotificationCenter removed - using SmartNotificationCenter in Header */}
      </div>
    </ProtectedRoute>
  );
});

/**
 * App with Navigation Provider
 */
const AppWithNavigation = memo(() => {
  // Navigation handler removed

  return (
    <NavigationProvider initialModule="genel" initialPage="dashboard" initialSubPage="">
      <AppContent />
      <ToastProvider />
    </NavigationProvider>
  );
});

/**
 * Application with Error Handling Wrapper
 *
 * This component wraps the main application with error boundary and context providers.
 * It provides a centralized error handling mechanism and manages the application's
 * core context providers including authentication, notifications, and AI services.
 *
 * @component
 * @returns {JSX.Element} The application wrapped with error handling and context providers
 */
function AppWithErrorHandling() {
  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <AppWithNavigation />
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}

/**
 * Main Application Component
 *
 * This is the root component that initializes the entire application.
 * It serves as the entry point for the Dernek Yönetim Sistemi.
 *
 * @component
 * @returns {JSX.Element} The complete application with all providers and error handling
 *
 * @example
 * ```tsx
 * import App from './App';
 *
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 */
function App() {
  /**
   * Application-level Sentry context and tags
   *
   * Set application-wide tags and structured context in Sentry once on app initialization.
   * These tags and context entries will be included with all subsequent Sentry events and
   * help filter and analyze errors by application name, version, environment mode, and
   * feature flags (e.g. PWA, offline mode).
   */
  useEffect(() => {
    try {
      setSentryTags({
        app_name: environment.app.name,
        app_version: environment.app.version,
        app_mode: environment.app.mode,
        pwa_enabled: String(environment.features.pwa),
        offline_mode: String(environment.features.offlineMode),
      });

      setSentryContext('application', {
        name: environment.app.name,
        version: environment.app.version,
        mode: environment.app.mode,
        features: {
          pwa: environment.features.pwa,
          analytics: environment.features.analytics,
          monitoring: environment.features.monitoring,
          offlineMode: environment.features.offlineMode,
        },
        timestamp: new Date().toISOString(),
      });

      // Add performance monitoring context
      setSentryContext('performance', {
        tracingSampleRate: environment.sentry.tracesSampleRate,
        replaysSessionSampleRate: environment.sentry.replaysSessionSampleRate,
        replaysOnErrorSampleRate: environment.sentry.replaysOnErrorSampleRate,
        navigationTracking: true,
        replayEnabled: environment.sentry.replaysSessionSampleRate > 0 || environment.sentry.replaysOnErrorSampleRate > 0,
      });

      // Add initial breadcrumb for app start
      addSentryBreadcrumb('lifecycle', 'Application initialized', {
        mode: environment.app.mode,
        version: environment.app.version,
      });
    } catch {
      // Defensive: sentryUtils already logs internally; swallow any unexpected errors here
      // to ensure initialization does not break the app startup.
      // No further action required.
    }
  }, []);

  return <AppWithErrorHandling />;
}

export default App;