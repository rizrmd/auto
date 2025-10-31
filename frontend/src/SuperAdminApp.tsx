/**
 * Super Admin App - Simple Working Version
 * Direct dashboard rendering without complex routing
 */

import React from 'react';
import DashboardPage from '@/pages/super-admin/DashboardPage';

export function SuperAdminApp() {
  console.log('🚀 SuperAdminApp mounting...');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a'
    }}>
      <DashboardPage />
    </div>
  );
}