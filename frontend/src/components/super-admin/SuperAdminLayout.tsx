/**
 * Super Admin Layout Component
 *
 * Main layout wrapper for Super Admin pages including sidebar, header,
 * and content area. Responsive design with mobile support.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar, SuperAdminMobileMenuButton } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';
import { useSuperAdminAuth } from '@/context/SuperAdminAuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SuperAdminLayoutProps {
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  title?: string;
}

export function SuperAdminLayout({ breadcrumbs, title }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading, isAuthenticated } = useSuperAdminAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Super Admin...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by the auth wrapper
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900">
        {/* Mobile menu button */}
        <SuperAdminMobileMenuButton onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Sidebar */}
        <SuperAdminSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content area */}
        <div className="lg:pl-64">
          {/* Header */}
          <SuperAdminHeader breadcrumbs={breadcrumbs} title={title} />

          {/* Page content */}
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Wrapper component for pages to provide breadcrumbs and title
export function SuperAdminPageWrapper({
  breadcrumbs,
  title,
  children
}: {
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <SuperAdminLayout breadcrumbs={breadcrumbs} title={title}>
      {children}
    </SuperAdminLayout>
  );
}