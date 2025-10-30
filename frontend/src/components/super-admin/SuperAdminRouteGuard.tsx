/**
 * Super Admin Route Guard Component
 *
 * Protects Super Admin routes by checking authentication status.
 * Redirects to login page if not authenticated.
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useSuperAdminAuth } from '@/context/SuperAdminAuthContext';

interface SuperAdminRouteGuardProps {
  children: React.ReactNode;
}

export function SuperAdminRouteGuard({ children }: SuperAdminRouteGuardProps) {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}

// Loading screen component for Super Admin routes
export function SuperAdminLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/25">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-lg font-medium">Loading Super Admin...</p>
        <p className="text-slate-500 text-sm mt-2">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );
}

// Error boundary for Super Admin routes
export class SuperAdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Super Admin Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              We encountered an error while loading the Super Admin dashboard. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full px-6 py-3 text-slate-300 hover:text-white transition-colors"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-slate-500 text-sm cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-4 bg-slate-800 rounded-lg text-red-400 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}