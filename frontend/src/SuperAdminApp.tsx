/**
 * Super Admin App - Phase 1.1 with Layout and Authentication
 * Uses SuperAdminLayout for sidebar navigation and dashboard
 * Wrapped with SuperAdminAuthProvider for authentication management
 */

import React from 'react';
import { SuperAdminAuthProvider } from './context/SuperAdminAuthContext';
import { SuperAdminLayout } from './components/super-admin/SuperAdminLayout';
import DashboardPage from './pages/super-admin/DashboardPage';

export function SuperAdminApp() {
  console.log('🚀 SuperAdminApp mounting with layout and authentication...');

  return (
    <SuperAdminAuthProvider>
      <SuperAdminLayout />
    </SuperAdminAuthProvider>
  );
}