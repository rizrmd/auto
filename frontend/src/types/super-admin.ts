/**
 * Super Admin Type Definitions (Frontend)
 *
 * TypeScript interfaces and types for the Super Admin system.
 * These are frontend-safe versions of the backend types.
 */

// ============================================
// TENANT TYPES
// ============================================

/**
 * Tenant Profile (frontend-safe)
 */
export interface TenantProfile {
  id: number;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
  adminEmail: string;
  adminName: string;
  phone?: string;
  address?: string;
  settings: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
    features: {
      whatsapp: boolean;
      analytics: boolean;
      customDomain: boolean;
    };
  };
  stats: {
    totalCars: number;
    totalLeads: number;
    totalUsers: number;
    storageUsed: number;
  };
}

/**
 * Tenant Filter Options
 */
export interface TenantFilter {
  status?: TenantProfile['status'];
  plan?: TenantProfile['plan'];
  sortBy?: 'name' | 'createdAt' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Tenant Creation Data
 */
export interface TenantCreateData {
  name: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  phone?: string;
  address?: string;
  plan?: TenantProfile['plan'];
  settings?: {
    theme?: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
}

/**
 * Tenant Update Data
 */
export interface TenantUpdateData {
  name?: string;
  domain?: string;
  phone?: string;
  address?: string;
  plan?: TenantProfile['plan'];
  status?: TenantProfile['status'];
  settings?: {
    theme?: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
    features?: {
      whatsapp?: boolean;
      analytics?: boolean;
      customDomain?: boolean;
    };
  };
}

/**
 * Theme Update Data
 */
export interface ThemeUpdateData {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  preset?: string;
}

/**
 * Tenant Health Score
 */
export interface TenantHealthScore {
  overall: number;
  factors: {
    activity: number;
    performance: number;
    engagement: number;
    storage: number;
  };
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    recommendation: string;
  }>;
  lastCalculated: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Global Analytics Data
 */
export interface GlobalAnalytics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalRevenue: number;
    monthlyGrowth: number;
  };
  metrics: {
    tenantGrowth: Array<{
      date: string;
      count: number;
    }>;
    revenueData: Array<{
      month: string;
      revenue: number;
    }>;
    planDistribution: Array<{
      plan: string;
      count: number;
      percentage: number;
    }>;
  };
  topPerformers: Array<{
    tenantId: number;
    tenantName: string;
    score: number;
    cars: number;
    leads: number;
  }>;
}

/**
 * Tenant Analytics Data
 */
export interface TenantAnalytics {
  profile: TenantProfile;
  metrics: {
    carViews: number;
    leadConversions: number;
    responseTime: number;
    customerSatisfaction: number;
  };
  performance: Array<{
    date: string;
    views: number;
    leads: number;
    conversions: number;
  }>;
  trends: {
    growth: number;
    engagement: number;
    efficiency: number;
  };
}

// ============================================
// MONITORING TYPES
// ============================================

/**
 * System Health Metrics
 */
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    whatsapp: ServiceStatus;
    storage: ServiceStatus;
  };
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * Service Status
 */
export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

/**
 * WhatsApp Metrics
 */
export interface WhatsAppMetrics {
  activeConnections: number;
  messagesToday: number;
  messagesThisMonth: number;
  responseRate: number;
  failedMessages: number;
  queueSize: number;
  uptime: number;
}

/**
 * WhatsApp Bot Metrics (alias for compatibility)
 */
export interface WhatsAppBotMetrics extends WhatsAppMetrics {}

/**
 * Storage Metrics
 */
export interface StorageMetrics {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usagePercentage: number;
  tenantUsage: Array<{
    tenantId: number;
    tenantName: string;
    usage: number;
    files: number;
  }>;
}

// ============================================
// SETTINGS TYPES
// ============================================

/**
 * System Settings
 */
export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    maxLoginAttempts: number;
  };
  whatsapp: {
    maxConnections: number;
    messageQueueSize: number;
    retryAttempts: number;
    timeoutDuration: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    lowDiskThreshold: number;
    highCpuThreshold: number;
  };
  features: {
    betaFeatures: boolean;
    analyticsEnabled: boolean;
    monitoringEnabled: boolean;
    autoBackup: boolean;
  };
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

/**
 * Super Admin Login Response
 */
export interface SuperAdminLoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  superAdmin: SuperAdminProfile;
}

/**
 * Super Admin Profile
 */
export interface SuperAdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * List Response for paginated data
 */
export interface ListResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}