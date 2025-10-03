/**
 * @fileoverview NavigationManager Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useUserPreferences } from '../../hooks/useLocalStorage';
// import { useUXAnalytics } from '../../components/ux/hooks/useUXAnalytics';
import monitoringService from '../../services/monitoringService';
import { addSentryBreadcrumb } from '../../lib/sentryUtils';

/**
 * NavigationState Interface
 * 
 * @interface NavigationState
 */
export interface NavigationState {
  activeModule: string;
  currentPage: string;
  currentSubPage: string;
  loading: boolean;
  selectedBeneficiaryId: string | null;
}

/**
 * NavigationActions Interface
 * 
 * @interface NavigationActions
 */
export interface NavigationActions {
  setActiveModule: (moduleId: string) => void;
  setCurrentPage: (page: string) => void;
  setCurrentSubPage: (subPage: string) => void;
  setLoading: (isLoading: boolean) => void;
  setSelectedBeneficiaryId: (id: string | null) => void;
  navigateToBeneficiaryDetail: (beneficiaryId: string | number) => void;
  backToBeneficiariesList: () => void;
  subPageChange: (href: string) => void;
  moduleChange: (moduleId: string) => void;
  navigateToProfile: () => void;
  navigateToSettings: () => void;
  backToMain: () => void;
  navigateToUserManagement: () => void;
  // Demo navigation functions removed
}

interface NavigationContextType extends NavigationState, NavigationActions { }

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * useNavigation function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

interface NavigationProviderProps {
  children: React.ReactNode;
  initialModule?: string;
  initialPage?: string;
  initialSubPage?: string;
}

/**
 * NavigationProvider function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function NavigationProvider({
  children,
  initialModule = 'genel',
  initialPage = 'list',
  initialSubPage = '',
}: NavigationProviderProps) {
  // const { trackNavigation } = useUXAnalytics();
  const { preferences, updatePreference } = useUserPreferences();

  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeModule: initialModule,
    currentPage: initialPage,
    currentSubPage: initialSubPage,
    loading: false,
    selectedBeneficiaryId: null,
  });

  // Initialize from preferences
  useEffect(() => {
    const savedModule = preferences.lastModule;
    if (savedModule && savedModule !== navigationState.activeModule) {
      setNavigationState((prev) => ({
        ...prev,
        activeModule: savedModule,
      }));
    }
  }, [preferences.lastModule, navigationState.activeModule]);

  // Navigation actions
  const setActiveModule = useCallback(
    (moduleId: string) => {
      // trackNavigation(navigationState.activeModule, moduleId, 'sidebar');
      setNavigationState((prev) => ({
        ...prev,
        activeModule: moduleId,
        currentPage: 'list',
        currentSubPage: '',
        loading: false,
        selectedBeneficiaryId: null, // Reset selected beneficiary on module change
      }));
      
      // Add navigation breadcrumb
      addSentryBreadcrumb('navigation', `Module changed: ${moduleId}`, {
        previousModule: navigationState.activeModule,
        newModule: moduleId,
        source: 'sidebar',
      });

      monitoringService.trackFeatureUsage('navigation', 'module_change', { moduleId });
      updatePreference('lastModule', moduleId);
    },
    [navigationState.activeModule, updatePreference],
  );

  const setCurrentPage = useCallback(
    (page: string) => {
      setNavigationState((prev) => ({
        ...prev,
        currentPage: page,
        loading: false,
      }));
    },
    [],
  );

  const setCurrentSubPage = useCallback(
    (subPage: string) => {
      setNavigationState((prev) => ({
        ...prev,
        currentSubPage: subPage,
        loading: false,
      }));

      // Add navigation breadcrumb for sub-page changes
      addSentryBreadcrumb('navigation', `Sub-page changed: ${subPage}`, {
        subPage,
        currentModule: navigationState.activeModule,
      });
    },
    [navigationState.activeModule],
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setNavigationState((prev) => ({ ...prev, loading: isLoading }));
  }, []);

  const setSelectedBeneficiaryId = useCallback((id: string | null) => {
    setNavigationState((prev) => ({ ...prev, selectedBeneficiaryId: id }));
  }, []);

  // Complex navigation actions
  const navigateToBeneficiaryDetail = useCallback(
    (beneficiaryId: string | number) => {
      const id = typeof beneficiaryId === 'number' ? beneficiaryId.toString() : beneficiaryId;
      setSelectedBeneficiaryId(id);
      setCurrentPage('detail');
    },
    [setSelectedBeneficiaryId, setCurrentPage],
  );

  const backToBeneficiariesList = useCallback(() => {
    setCurrentPage('list');
    setSelectedBeneficiaryId(null);
  }, [setCurrentPage, setSelectedBeneficiaryId]);

  const subPageChange = useCallback(
    (href: string) => {
      setCurrentSubPage(href);
    },
    [setCurrentSubPage],
  );

  const moduleChange = useCallback(
    (moduleId: string) => {
      setActiveModule(moduleId);
    },
    [setActiveModule],
  );

  const navigateToProfile = useCallback(() => {
    addSentryBreadcrumb('navigation', 'Navigated to profile', { target: 'profile' });
    setNavigationState({
      activeModule: 'profile',
      currentPage: 'profile',
      currentSubPage: '',
      loading: false,
      selectedBeneficiaryId: null,
    });
  }, []);

  const navigateToSettings = useCallback(() => {
    addSentryBreadcrumb('navigation', 'Navigated to settings', { target: 'settings' });
    setNavigationState({
      activeModule: 'settings',
      currentPage: 'settings',
      currentSubPage: '',
      loading: false,
      selectedBeneficiaryId: null,
    });
  }, []);

  const backToMain = useCallback(() => {
    setCurrentPage('list');
    setActiveModule('genel');
  }, [setCurrentPage, setActiveModule]);

  const navigateToUserManagement = useCallback(() => {
    setCurrentPage('user-management');
    setActiveModule('user-management');
  }, [setCurrentPage, setActiveModule]);

  // Demo navigation functions removed

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      // State
      ...navigationState,

      // Basic actions
      setActiveModule,
      setCurrentPage,
      setCurrentSubPage,
      setLoading,
      setSelectedBeneficiaryId,

      // Complex actions
      navigateToBeneficiaryDetail,
      backToBeneficiariesList,
      subPageChange,
      moduleChange,
      navigateToProfile,
      navigateToSettings,
      backToMain,
      navigateToUserManagement,
      // Demo navigation functions removed
    }),
    [
      navigationState,
      setActiveModule,
      setCurrentPage,
      setCurrentSubPage,
      setLoading,
      setSelectedBeneficiaryId,
      navigateToBeneficiaryDetail,
      backToBeneficiariesList,
      subPageChange,
      moduleChange,
      navigateToProfile,
      navigateToSettings,
      backToMain,
      navigateToUserManagement,
      // Demo navigation functions removed
    ],
  );

  return React.createElement(NavigationContext.Provider, { value: contextValue }, children);

}

export default NavigationProvider;
