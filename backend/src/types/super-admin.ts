/**
 * Super Admin Type Definitions
 *
 * TypeScript interfaces and types for the Super Admin system.
 */

// Local type definitions to avoid import issues with generated prisma
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'expired';

export interface SuperAdmin {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Import other types from generated prisma if needed
import type { Tenant, User, Car, Lead } from '../../../generated/prisma';

// ============================================
// AUTHENTICATION TYPES
// ============================================

/**
 * Super Admin JWT Payload
 */
export interface SuperAdminJwtPayload {
  superAdminId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  sub?: string;
}

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
 * Super Admin Profile (safe to expose)
 */
export interface SuperAdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

// ============================================
// TENANT MANAGEMENT TYPES
// ============================================

/**
 * Tenant Creation Data
 */
export interface TenantCreateData {
  name: string;
  subdomain: string;
  customDomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  address?: string;
  city?: string;
  mapsUrl?: string;
  businessHours?: Record<string, string>;
  plan?: 'trial' | 'free' | 'starter' | 'growth' | 'pro';
}

/**
 * Tenant Update Data
 */
export interface TenantUpdateData {
  name?: string;
  customDomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  mapsUrl?: string;
  businessHours?: Record<string, string>;
  plan?: 'trial' | 'free' | 'starter' | 'growth' | 'pro';
  status?: 'active' | 'suspended' | 'trial' | 'expired';
  settings?: Record<string, any>;
}

/**
 * Theme Update Data
 */
export interface ThemeUpdateData {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

/**
 * Tenant Profile (with additional computed fields)
 */
export interface TenantProfile extends Omit<Tenant, 'cars' | 'leads' | 'messages' | 'users' | 'conversationStates'> {
  _count: {
    cars: number;
    leads: number;
    users: number;
    activeLeads: number;
    soldCars: number;
  };
  healthScore: number;
  lastActivity: Date | null;
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Global Analytics Overview
 */
export interface GlobalAnalytics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalCars: number;
    availableCars: number;
    soldCars: number;
    totalLeads: number;
    activeLeads: number;
    closedLeads: number;
    totalUsers: number;
    activeUsers: number;
  };
  growth: {
    newTenantsThisMonth: number;
    newTenantsThisYear: number;
    tenantGrowthRate: number;
    newLeadsThisMonth: number;
    newLeadsThisYear: number;
    leadGrowthRate: number;
    carsSoldThisMonth: number;
    carsSoldThisYear: number;
    salesGrowthRate: number;
  };
  performance: {
    averageLeadsPerTenant: number;
    averageCarsPerTenant: number;
    leadConversionRate: number;
    averageTimeToClose: number; // in days
    topPerformingTenants: Array<{
      id: number;
      name: string;
      score: number;
      leadsCount: number;
      conversionRate: number;
    }>;
  };
  trends: Array<{
    period: string;
    tenants: number;
    leads: number;
    sales: number;
    revenue: string;
  }>;
}

/**
 * Tenant Analytics
 */
export interface TenantAnalytics {
  overview: {
    totalCars: number;
    availableCars: number;
    soldCars: number;
    totalLeads: number;
    activeLeads: number;
    conversionRate: number;
    averageResponseTime: number; // in minutes
  };
  leadSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  leadStatuses: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  popularCars: Array<{
    brand: string;
    model: string;
    count: number;
    avgPrice: string;
  }>;
  recentActivity: Array<{
    type: 'lead' | 'sale' | 'car_added';
    description: string;
    timestamp: Date;
  }>;
  performance: {
    leadsPerDay: number;
    responseTime: number;
    bookingRate: number;
    closingRate: number;
  };
}

// ============================================
// MONITORING TYPES
// ============================================

/**
 * System Health Status
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    api: ServiceHealth;
    whatsapp: ServiceHealth;
    storage: ServiceHealth;
    cache: ServiceHealth;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    requestRate: number;
    uptime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
}

/**
 * Individual Service Health
 */
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

/**
 * WhatsApp Bot Metrics
 */
export interface WhatsAppBotMetrics {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  successRate: number;
  averageResponseTime: number;
  activeConversations: number;
  errorCount: number;
  topCommands: Array<{
    command: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    messages: number;
    errors: number;
    successRate: number;
  }>;
}

/**
 * Storage Usage Metrics
 */
export interface StorageMetrics {
  totalUsage: number;
  tenantUsage: Array<{
    tenantId: number;
    tenantName: string;
    usage: number;
    fileCount: number;
  }>;
  fileTypes: Array<{
    type: string;
    count: number;
    size: number;
  }>;
  growthTrend: Array<{
    date: string;
    usage: number;
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
    systemName: string;
    adminEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    registrationEnabled: boolean;
    defaultTenantPlan: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    enableTwoFactor: boolean;
    allowedIpRanges: string[];
  };
  whatsapp: {
    maxMessagesPerDay: number;
    maxFileSize: number;
    supportedFileTypes: string[];
    autoReplyEnabled: boolean;
    businessHours: Record<string, string>;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      diskUsage: number;
    };
  };
  features: {
    enableAnalytics: boolean;
    enableMonitoring: boolean;
    enableCustomDomains: boolean;
    enableApiAccess: boolean;
    enableWebhooks: boolean;
  };
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  id: number;
  superAdminId: number;
  superAdminName: string;
  action: string;
  resource: string;
  resourceId?: number;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

/**
 * Pagination Meta
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * List Response
 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================
// FILTER AND QUERY TYPES
// ============================================

/**
 * Tenant Filter Options
 */
export interface TenantFilter {
  search?: string;
  status?: string;
  plan?: string;
  sortBy?: 'name' | 'createdAt' | 'lastActivity' | 'carsCount' | 'leadsCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Analytics Date Range
 */
export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Activity Log Filter
 */
export interface ActivityLogFilter {
  superAdminId?: number;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}