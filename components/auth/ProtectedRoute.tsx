/**
 * @fileoverview ProtectedRoute Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import type { ReactNode } from 'react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { UserRole, type Permission } from '../../types/auth';
import { UnauthorizedPage } from './UnauthorizedPage';
import { LoadingSpinner } from '../LoadingSpinner';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  // Temporary: Basic auth check only for now
  const checkPermission = () => isAuthenticated;
  const hasRole = () => isAuthenticated;

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-600 animate-pulse">Kimlik doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return fallback || <LoginPage />;
  }

  // Check role requirement
  if (requiredRole && !hasRole()) {
    return <UnauthorizedPage requiredRole={requiredRole} />;
  }

  // Check permission requirement
  if (requiredPermission && !checkPermission()) {
    return <UnauthorizedPage requiredPermission={requiredPermission} />;
  }

  return <>{children}</>;
}

// Convenience components for common protection patterns
/**
 * AdminRoute function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>;
}

/**
 * ManagerRoute function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function ManagerRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRole={UserRole.MANAGER}>{children}</ProtectedRoute>;
}

/**
 * PermissionGuard function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function PermissionGuard({
  children,
  permission: _permission,
  fallback,
}: {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}) {
  const { isAuthenticated } = useSupabaseAuth();

  if (!isAuthenticated) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
