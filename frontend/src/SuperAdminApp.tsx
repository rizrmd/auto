/**
 * Super Admin App - Phase 1.1 with Layout
 * Uses SuperAdminLayout for sidebar navigation and dashboard
 */

import React from 'react';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import DashboardPage from '@/pages/super-admin/DashboardPage';

export function SuperAdminApp() {
  console.log('🚀 SuperAdminApp mounting with layout...');

  return <SuperAdminLayout />;
}