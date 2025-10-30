/**
 * Super Admin Validation Schemas using Zod
 *
 * Comprehensive input validation for all Super Admin API endpoints.
 * Protects against:
 * - SQL injection
 * - XSS attacks
 * - Type confusion bugs
 * - Invalid data submissions
 * - Authorization bypass attempts
 */

import { z } from 'zod';

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

/**
 * Super Admin Login Schema
 */
export const SuperAdminLoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

/**
 * Refresh Token Schema
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(10, 'Invalid refresh token')
    .max(1000, 'Invalid refresh token'),
});

/**
 * Password Change Schema
 */
export const PasswordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(100, 'Current password too long'),

  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Super Admin Creation Schema (for initial setup)
 */
export const SuperAdminCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name too long')
    .trim(),

  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase(),

  password: z
    .string()
    .min(12, 'Super Admin password must be at least 12 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  role: z
    .enum(['super_admin', 'support'], {
      errorMap: () => ({ message: 'Invalid role' }),
    })
    .default('super_admin'),
});

// ============================================
// TENANT MANAGEMENT SCHEMAS
// ============================================

/**
 * Tenant Creation Schema
 */
export const TenantCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tenant name must be at least 2 characters')
    .max(200, 'Tenant name too long')
    .trim(),

  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with hyphen.')
    .transform(val => val.toLowerCase()),

  customDomain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]?)*$/, 'Invalid domain format')
    .optional(),

  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
    .default('#FF5722'),

  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color')
    .default('#000000'),

  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number'),

  whatsappNumber: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian WhatsApp number'),

  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional(),

  address: z
    .string()
    .max(1000, 'Address too long')
    .optional(),

  city: z
    .string()
    .max(100, 'City name too long')
    .optional(),

  mapsUrl: z
    .string()
    .url('Invalid Google Maps URL')
    .optional(),

  businessHours: z
    .record(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM-HH:MM'))
    .optional(),

  plan: z
    .enum(['trial', 'free', 'starter', 'growth', 'pro'], {
      errorMap: () => ({ message: 'Invalid plan type' }),
    })
    .default('trial'),

  // Create default admin user for tenant
  adminUser: z.object({
    name: z
      .string()
      .min(2, 'Admin name must be at least 2 characters')
      .max(200, 'Admin name too long'),

    email: z
      .string()
      .email('Invalid admin email format')
      .max(255, 'Admin email too long'),

    password: z
      .string()
      .min(8, 'Admin password must be at least 8 characters')
      .max(100, 'Admin password too long'),

    phone: z
      .string()
      .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid admin phone number')
      .optional(),
  }),
});

/**
 * Tenant Update Schema
 */
export const TenantUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tenant name must be at least 2 characters')
    .max(200, 'Tenant name too long')
    .trim()
    .optional(),

  customDomain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]?)*$/, 'Invalid domain format')
    .nullable()
    .optional(),

  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
    .optional(),

  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color')
    .optional(),

  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number')
    .optional(),

  whatsappNumber: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian WhatsApp number')
    .optional(),

  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .nullable()
    .optional(),

  address: z
    .string()
    .max(1000, 'Address too long')
    .nullable()
    .optional(),

  city: z
    .string()
    .max(100, 'City name too long')
    .nullable()
    .optional(),

  mapsUrl: z
    .string()
    .url('Invalid Google Maps URL')
    .nullable()
    .optional(),

  businessHours: z
    .record(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM-HH:MM'))
    .nullable()
    .optional(),

  plan: z
    .enum(['trial', 'free', 'starter', 'growth', 'pro'], {
      errorMap: () => ({ message: 'Invalid plan type' }),
    })
    .optional(),

  status: z
    .enum(['active', 'suspended', 'trial', 'expired'], {
      errorMap: () => ({ message: 'Invalid tenant status' }),
    })
    .optional(),

  settings: z
    .record(z.any())
    .optional(),
});

/**
 * Theme Update Schema
 */
export const ThemeUpdateSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
    .optional(),

  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color')
    .optional(),

  logoUrl: z
    .string()
    .url('Invalid logo URL')
    .nullable()
    .optional(),
});

/**
 * Tenant Status Update Schema
 */
export const TenantStatusUpdateSchema = z.object({
  status: z
    .enum(['active', 'suspended'], {
      errorMap: () => ({ message: 'Status must be active or suspended' }),
    }),

  reason: z
    .string()
    .max(500, 'Reason too long')
    .optional(),
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

/**
 * Analytics Date Range Schema
 */
export const AnalyticsDateRangeSchema = z.object({
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .transform(val => new Date(val)),

  endDate: z
    .string()
    .datetime('Invalid end date format')
    .transform(val => new Date(val)),

  groupBy: z
    .enum(['day', 'week', 'month'], {
      errorMap: () => ({ message: 'Group by must be day, week, or month' }),
    })
    .default('day'),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

/**
 * Tenant Analytics Request Schema
 */
export const TenantAnalyticsRequestSchema = z.object({
  tenantId: z
    .number()
    .int('Tenant ID must be integer')
    .positive('Tenant ID must be positive'),

  dateRange: AnalyticsDateRangeSchema.optional(),
});

// ============================================
// MONITORING SCHEMAS
// ============================================

/**
 * System Health Check Schema
 */
export const HealthCheckSchema = z.object({
  services: z
    .array(z.enum(['database', 'api', 'whatsapp', 'storage', 'cache']))
    .optional(),

  timeout: z
    .number()
    .int('Timeout must be integer')
    .min(1000, 'Timeout must be at least 1000ms')
    .max(30000, 'Timeout cannot exceed 30 seconds')
    .default(5000),
});

// ============================================
// SETTINGS SCHEMAS
// ============================================

/**
 * System Settings Update Schema
 */
export const SystemSettingsUpdateSchema = z.object({
  general: z.object({
    systemName: z
      .string()
      .min(1, 'System name required')
      .max(100, 'System name too long')
      .optional(),

    adminEmail: z
      .string()
      .email('Invalid admin email format')
      .optional(),

    supportEmail: z
      .string()
      .email('Invalid support email format')
      .optional(),

    maintenanceMode: z
      .boolean()
      .optional(),

    maintenanceMessage: z
      .string()
      .max(1000, 'Maintenance message too long')
      .optional(),

    registrationEnabled: z
      .boolean()
      .optional(),

    defaultTenantPlan: z
      .enum(['trial', 'free', 'starter', 'growth', 'pro'])
      .optional(),
  }).optional(),

  security: z.object({
    sessionTimeout: z
      .number()
      .int('Session timeout must be integer')
      .min(300, 'Session timeout must be at least 5 minutes')
      .max(86400, 'Session timeout cannot exceed 24 hours')
      .optional(),

    maxLoginAttempts: z
      .number()
      .int('Max login attempts must be integer')
      .min(3, 'Max login attempts must be at least 3')
      .max(10, 'Max login attempts cannot exceed 10')
      .optional(),

    lockoutDuration: z
      .number()
      .int('Lockout duration must be integer')
      .min(60, 'Lockout duration must be at least 1 minute')
      .max(3600, 'Lockout duration cannot exceed 1 hour')
      .optional(),

    passwordMinLength: z
      .number()
      .int('Password min length must be integer')
      .min(8, 'Password min length must be at least 8')
      .max(50, 'Password min length cannot exceed 50')
      .optional(),

    requireStrongPassword: z
      .boolean()
      .optional(),

    enableTwoFactor: z
      .boolean()
      .optional(),

    allowedIpRanges: z
      .array(z.string().regex(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/, 'Invalid IP address format'))
      .optional(),
  }).optional(),

  whatsapp: z.object({
    maxMessagesPerDay: z
      .number()
      .int('Max messages per day must be integer')
      .min(100, 'Must allow at least 100 messages per day')
      .max(10000, 'Cannot exceed 10000 messages per day')
      .optional(),

    maxFileSize: z
      .number()
      .int('Max file size must be integer')
      .min(1024, 'Min file size is 1KB')
      .max(10485760, 'Max file size is 10MB')
      .optional(),

    supportedFileTypes: z
      .array(z.string().regex(/^[a-z0-9]+\/[a-z0-9\-+.]+$/))
      .optional(),

    autoReplyEnabled: z
      .boolean()
      .optional(),

    businessHours: z
      .record(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
      .optional(),
  }).optional(),

  notifications: z.object({
    emailNotifications: z
      .boolean()
      .optional(),

    smsNotifications: z
      .boolean()
      .optional(),

    alertThresholds: z.object({
      errorRate: z
        .number()
        .min(0, 'Error rate must be at least 0')
        .max(100, 'Error rate cannot exceed 100')
        .optional(),

      responseTime: z
        .number()
        .min(100, 'Response time must be at least 100ms')
        .max(10000, 'Response time cannot exceed 10 seconds')
        .optional(),

      diskUsage: z
        .number()
        .min(0, 'Disk usage must be at least 0')
        .max(100, 'Disk usage cannot exceed 100')
        .optional(),
    }).optional(),
  }).optional(),

  features: z.object({
    enableAnalytics: z
      .boolean()
      .optional(),

    enableMonitoring: z
      .boolean()
      .optional(),

    enableCustomDomains: z
      .boolean()
      .optional(),

    enableApiAccess: z
      .boolean()
      .optional(),

    enableWebhooks: z
      .boolean()
      .optional(),
  }).optional(),
});

// ============================================
// ACTIVITY LOG SCHEMAS
// ============================================

/**
 * Activity Log Filter Schema
 */
export const ActivityLogFilterSchema = z.object({
  superAdminId: z
    .number()
    .int('Super Admin ID must be integer')
    .positive('Super Admin ID must be positive')
    .optional(),

  action: z
    .string()
    .max(100, 'Action too long')
    .optional(),

  resource: z
    .string()
    .max(100, 'Resource too long')
    .optional(),

  startDate: z
    .string()
    .datetime('Invalid start date format')
    .transform(val => new Date(val))
    .optional(),

  endDate: z
    .string()
    .datetime('Invalid end date format')
    .transform(val => new Date(val))
    .optional(),
});

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

/**
 * Tenant Filter Schema
 */
export const TenantFilterSchema = z.object({
  search: z
    .string()
    .min(2, 'Search query too short')
    .max(200, 'Search query too long')
    .optional(),

  status: z
    .enum(['active', 'suspended', 'trial', 'expired'])
    .optional(),

  plan: z
    .enum(['trial', 'free', 'starter', 'growth', 'pro'])
    .optional(),

  sortBy: z
    .enum(['name', 'createdAt', 'lastActivity', 'carsCount', 'leadsCount'], {
      errorMap: () => ({ message: 'Invalid sort field' }),
    })
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Invalid sort order' }),
    })
    .default('desc'),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be at least 1'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

/**
 * ID Parameter Schema
 */
export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID must be positive'),
});

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be at least 1'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});