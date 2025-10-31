/**
 * Super Admin App Component
 *
 * Main Super Admin application with routing, authentication,
 * and layout management.
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminAuthProvider } from '@/context/SuperAdminAuthContext';
import { SuperAdminRouteGuard, SuperAdminLoadingScreen, SuperAdminErrorBoundary } from '@/components/super-admin/SuperAdminRouteGuard';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';

// Lazy load pages for better performance
const SuperAdminLoginPage = React.lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/super-admin/DashboardPage'));
const TenantsPage = React.lazy(() => import('@/pages/super-admin/TenantsPage'));
const AnalyticsPage = React.lazy(() => import('@/pages/super-admin/AnalyticsPage'));
const MonitoringPage = React.lazy(() => import('@/pages/super-admin/MonitoringPage'));
const SettingsPage = React.lazy(() => import('@/pages/super-admin/SettingsPage'));

export function SuperAdminApp() {
  return (
    <SuperAdminErrorBoundary>
      <SuperAdminAuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/super-admin/login"
              element={
                <Suspense fallback={<SuperAdminLoadingScreen />}>
                  <SuperAdminLoginPage />
                </Suspense>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/super-admin/*"
              element={
                <SuperAdminRouteGuard>
                  <SuperAdminErrorBoundary>
                    <Suspense fallback={<SuperAdminLoadingScreen />}>
                      <SuperAdminLayout>
                        <Routes>
                          {/* Dashboard */}
                          <Route path="dashboard" element={<DashboardPage />} />

                          {/* Tenants Management */}
                          <Route path="tenants" element={<TenantsPage />} />
                          <Route path="tenants/create" element={<TenantsPage />} />
                          <Route path="tenants/:id/edit" element={<TenantsPage />} />
                          <Route path="tenants/:id/theme" element={<TenantsPage />} />
                          <Route path="tenants/:id/analytics" element={<TenantsPage />} />

                          {/* Analytics */}
                          <Route path="analytics" element={<AnalyticsPage />} />
                          <Route path="analytics/performance" element={<AnalyticsPage />} />
                          <Route path="analytics/revenue" element={<AnalyticsPage />} />
                          <Route path="analytics/tenants/:id" element={<AnalyticsPage />} />

                          {/* Monitoring */}
                          <Route path="monitoring" element={<MonitoringPage />} />
                          <Route path="monitoring/whatsapp" element={<MonitoringPage />} />
                          <Route path="monitoring/performance" element={<MonitoringPage />} />

                          {/* Settings */}
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="settings/general" element={<SettingsPage />} />
                          <Route path="settings/security" element={<SettingsPage />} />
                          <Route path="settings/whatsapp" element={<SettingsPage />} />
                          <Route path="settings/notifications" element={<SettingsPage />} />
                          <Route path="settings/features" element={<SettingsPage />} />

                          {/* Default redirect */}
                          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                          <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
                        </Routes>
                      </SuperAdminLayout>
                    </Suspense>
                  </SuperAdminErrorBoundary>
                </SuperAdminRouteGuard>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
          </Routes>
        </Router>
      </SuperAdminAuthProvider>
    </SuperAdminErrorBoundary>
  );
}