/**
 * Super Admin App Component - AUTHENTICATION BYPASS VERSION
 *
 * This version bypasses authentication and lazy loading to isolate the loading issue.
 * TEMPORARY FIX FOR DEBUGGING ONLY.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/super-admin/DashboardPage';

export function SuperAdminApp() {
  console.log('🚀 SUPER ADMIN APP MOUNTING - AUTH BYPASS VERSION');

  return (
    <Router>
      <Routes>
        {/* Direct route to dashboard without authentication */}
        <Route path="/super-admin/*" element={<DashboardPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}