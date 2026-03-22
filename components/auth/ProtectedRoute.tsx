"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasAnyRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

/**
 * Wrap pages that require authentication
 * Optionally specify required roles for role-based access control
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRoles={["admin"]}>
 *   <AdminPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Check roles if required
    if (requiredRoles && requiredRoles.length > 0) {
      const token = localStorage.getItem("jwt");
      if (!token || !hasAnyRole(token, requiredRoles)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [isAuthenticated, isLoading, requiredRoles, router, fallbackPath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }

  // Check roles
  if (requiredRoles && requiredRoles.length > 0) {
    const token = localStorage.getItem("jwt");
    if (!token || !hasAnyRole(token, requiredRoles)) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * Hook for programmatic route protection
 * Returns auth state and redirect function
 */
export function useProtectedRoute(requiredRoles?: string[]) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const checkAccess = (): boolean => {
    if (!isAuthenticated) return false;

    if (requiredRoles && requiredRoles.length > 0) {
      const token = localStorage.getItem("jwt");
      if (!token || !hasAnyRole(token, requiredRoles)) {
        return false;
      }
    }

    return true;
  };

  const redirectToLogin = () => {
    router.push("/login");
  };

  const redirectToUnauthorized = () => {
    router.push("/unauthorized");
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    hasAccess: checkAccess(),
    redirectToLogin,
    redirectToUnauthorized,
  };
}
