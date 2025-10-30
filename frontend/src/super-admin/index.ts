/**
 * Super Admin Module Index
 *
 * Central export point for all Super Admin components and utilities.
 */

// Authentication
export { useSuperAdminAuth, useSuperAdminApi, SuperAdminAuthProvider } from '../context/SuperAdminAuthContext';

// Layout Components
export { SuperAdminSidebar, SuperAdminMobileMenuButton } from '../components/super-admin/SuperAdminSidebar';
export { SuperAdminHeader } from '../components/super-admin/SuperAdminHeader';
export { SuperAdminLayout, SuperAdminPageWrapper } from '../components/super-admin/SuperAdminLayout';

// UI Components
export { StatsCard } from '../components/super-admin/StatsCard';
export { TenantCard } from '../components/super-admin/TenantCard';
export { ThemeEditor } from '../components/super-admin/ThemeEditor';
export { TenantForm } from '../components/super-admin/TenantForm';
export { Modal, ConfirmModal } from '../components/super-admin/Modal';

// Chart Components
export {
  AnalyticsChart,
  TenantGrowthChart,
  RevenueChart,
  LeadSourcesChart,
  PerformanceMetricsChart
} from '../components/super-admin/AnalyticsChart';

// Route Protection
export {
  SuperAdminRouteGuard,
  SuperAdminLoadingScreen,
  SuperAdminErrorBoundary
} from '../components/super-admin/SuperAdminRouteGuard';

// Pages
export { SuperAdminLoginPage } from '../pages/super-admin/SuperAdminLoginPage';
export { DashboardPage } from '../pages/super-admin/DashboardPage';
export { TenantsPage } from '../pages/super-admin/TenantsPage';
export { AnalyticsPage } from '../pages/super-admin/AnalyticsPage';
export { MonitoringPage } from '../pages/super-admin/MonitoringPage';
export { SettingsPage } from '../pages/super-admin/SettingsPage';

// Main App
export { SuperAdminApp } from '../SuperAdminApp';

// Types
export type {
  SuperAdminProfile,
  TenantProfile,
  GlobalAnalytics,
  TenantAnalytics,
  SystemHealth,
  WhatsAppBotMetrics,
  StorageMetrics,
  SystemSettings,
  ApiResponse,
  ListResponse,
  TenantFilter,
  TenantCreateData,
  TenantUpdateData,
  ThemeUpdateData
} from '../types/super-admin';