/**
 * Super Admin Settings Management Routes
 *
 * Handles system settings, configuration management, and administrative preferences.
 * Provides comprehensive settings management for system administrators.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SystemSettingsUpdateSchema } from '../../validation/super-admin.schemas';
import {
  superAdminAuthMiddleware,
  requireSuperAdmin,
  superAdminActivityLogger,
  getSuperAdmin,
} from '../../middleware/super-admin-auth';
import { ApiResponse } from '../../types/super-admin';
import { prisma } from '../../db';

const app = new Hono();

// Apply authentication middleware to all routes
app.use('*', superAdminAuthMiddleware);
app.use('*', superAdminActivityLogger);

/**
 * GET /api/super-admin/settings
 *
 * Get current system settings.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<SystemSettings>>} Current system settings
 */
app.get('/',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings
 *
 * Update system settings.
 * Requires Super Admin role.
 *
 * @body {SystemSettingsUpdateSchema} settings - Settings to update
 * @returns {Promise<ApiResponse<SystemSettings>>} Updated system settings
 */
app.put('/',
  requireSuperAdmin,
  zValidator('json', SystemSettingsUpdateSchema),
  async (c) => {
    const settingsUpdate = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateSystemSettings(settingsUpdate);

    // Log settings update
    console.log(`[SYSTEM_SETTINGS_UPDATED] ${superAdmin.email} updated system settings`, {
      updatedCategories: Object.keys(settingsUpdate),
    });

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'System settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/general
 *
 * Get general system settings.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} General settings
 */
app.get('/general',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings.general,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings/general
 *
 * Update general system settings.
 * Requires Super Admin role.
 *
 * @body {object} settings - General settings to update
 * @returns {Promise<ApiResponse<any>>} Updated general settings
 */
app.put('/general',
  requireSuperAdmin,
  zValidator('json', z.object({
    systemName: z.string().min(1).max(100).optional(),
    adminEmail: z.string().email().optional(),
    supportEmail: z.string().email().optional(),
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().max(1000).optional(),
    registrationEnabled: z.boolean().optional(),
    defaultTenantPlan: z.enum(['trial', 'free', 'starter', 'growth', 'pro']).optional(),
  })),
  async (c) => {
    const generalSettings = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateGeneralSettings(generalSettings);

    console.log(`[GENERAL_SETTINGS_UPDATED] ${superAdmin.email} updated general settings`, generalSettings);

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'General settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/security
 *
 * Get security settings.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} Security settings
 */
app.get('/security',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings.security,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings/security
 *
 * Update security settings.
 * Requires Super Admin role.
 *
 * @body {object} settings - Security settings to update
 * @returns {Promise<ApiResponse<any>>} Updated security settings
 */
app.put('/security',
  requireSuperAdmin,
  zValidator('json', z.object({
    sessionTimeout: z.number().int().min(300).max(86400).optional(),
    maxLoginAttempts: z.number().int().min(3).max(10).optional(),
    lockoutDuration: z.number().int().min(60).max(3600).optional(),
    passwordMinLength: z.number().int().min(8).max(50).optional(),
    requireStrongPassword: z.boolean().optional(),
    enableTwoFactor: z.boolean().optional(),
    allowedIpRanges: z.array(z.string().ip({ version: 'v4' })).optional(),
  })),
  async (c) => {
    const securitySettings = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateSecuritySettings(securitySettings);

    console.log(`[SECURITY_SETTINGS_UPDATED] ${superAdmin.email} updated security settings`);

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'Security settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/whatsapp
 *
 * Get WhatsApp settings.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} WhatsApp settings
 */
app.get('/whatsapp',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings.whatsapp,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings/whatsapp
 *
 * Update WhatsApp settings.
 * Requires Super Admin role.
 *
 * @body {object} settings - WhatsApp settings to update
 * @returns {Promise<ApiResponse<any>>} Updated WhatsApp settings
 */
app.put('/whatsapp',
  requireSuperAdmin,
  zValidator('json', z.object({
    maxMessagesPerDay: z.number().int().min(100).max(10000).optional(),
    maxFileSize: z.number().int().min(1024).max(10485760).optional(),
    supportedFileTypes: z.array(z.string().regex(/^[a-z0-9]+\/[a-z0-9\-+.]+$/)).optional(),
    autoReplyEnabled: z.boolean().optional(),
    businessHours: z.record(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
  })),
  async (c) => {
    const whatsappSettings = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateWhatsAppSettings(whatsappSettings);

    console.log(`[WHATSAPP_SETTINGS_UPDATED] ${superAdmin.email} updated WhatsApp settings`);

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'WhatsApp settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/notifications
 *
 * Get notification settings.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} Notification settings
 */
app.get('/notifications',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings.notifications,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings/notifications
 *
 * Update notification settings.
 * Requires Super Admin role.
 *
 * @body {object} settings - Notification settings to update
 * @returns {Promise<ApiResponse<any>>} Updated notification settings
 */
app.put('/notifications',
  requireSuperAdmin,
  zValidator('json', z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    alertThresholds: z.object({
      errorRate: z.number().min(0).max(100).optional(),
      responseTime: z.number().min(100).max(10000).optional(),
      diskUsage: z.number().min(0).max(100).optional(),
    }).optional(),
  })),
  async (c) => {
    const notificationSettings = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateNotificationSettings(notificationSettings);

    console.log(`[NOTIFICATION_SETTINGS_UPDATED] ${superAdmin.email} updated notification settings`);

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'Notification settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/features
 *
 * Get feature flags.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} Feature flags
 */
app.get('/features',
  requireSuperAdmin,
  async (c) => {
    const settings = await getSystemSettings();

    return c.json<ApiResponse>({
      success: true,
      data: settings.features,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/settings/features
 *
 * Update feature flags.
 * Requires Super Admin role.
 *
 * @body {object} features - Feature flags to update
 * @returns {Promise<ApiResponse<any>>} Updated feature flags
 */
app.put('/features',
  requireSuperAdmin,
  zValidator('json', z.object({
    enableAnalytics: z.boolean().optional(),
    enableMonitoring: z.boolean().optional(),
    enableCustomDomains: z.boolean().optional(),
    enableApiAccess: z.boolean().optional(),
    enableWebhooks: z.boolean().optional(),
  })),
  async (c) => {
    const featureSettings = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const updatedSettings = await updateFeatureSettings(featureSettings);

    console.log(`[FEATURE_SETTINGS_UPDATED] ${superAdmin.email} updated feature settings`, featureSettings);

    return c.json<ApiResponse>({
      success: true,
      data: updatedSettings,
      message: 'Feature settings updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/settings/reset
 *
 * Reset settings to default values.
 * Requires Super Admin role.
 *
 * @body {object} data - Reset options
 * @returns {Promise<ApiResponse<SystemSettings>>} Reset system settings
 */
app.post('/reset',
  requireSuperAdmin,
  zValidator('json', z.object({
    category: z.enum(['general', 'security', 'whatsapp', 'notifications', 'features', 'all']),
    confirm: z.boolean().refine(val => val === true, 'You must confirm the reset'),
  })),
  async (c) => {
    const { category } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const resetSettings = await resetSettings(category);

    console.log(`[SETTINGS_RESET] ${superAdmin.email} reset ${category} settings`);

    return c.json<ApiResponse>({
      success: true,
      data: resetSettings,
      message: `${category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)} settings reset to defaults`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/settings/export
 *
 * Export system settings.
 * Requires Super Admin role.
 *
 * @body {object} data - Export options
 * @returns {Promise<any>>} Exported settings file
 */
app.post('/export',
  requireSuperAdmin,
  zValidator('json', z.object({
    format: z.enum(['json', 'yaml']).default('json'),
    category: z.enum(['general', 'security', 'whatsapp', 'notifications', 'features', 'all']).default('all'),
  })),
  async (c) => {
    const { format, category } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const settings = await getSystemSettings();
    const exportData = category === 'all' ? settings : { [category]: settings[category as keyof typeof settings] };

    console.log(`[SETTINGS_EXPORTED] ${superAdmin.email} exported ${category} settings (${format})`);

    if (format === 'yaml') {
      // Convert to YAML (simplified)
      const yamlData = convertToYaml(exportData);

      return c.body(yamlData, 200, {
        'Content-Type': 'text/yaml',
        'Content-Disposition': `attachment; filename="system-settings-${category}-${new Date().toISOString().split('T')[0]}.yaml"`,
      });
    }

    return c.json<ApiResponse>({
      success: true,
      data: exportData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/settings/import
 *
 * Import system settings.
 * Requires Super Admin role.
 *
 * @body {object} data - Import data and options
 * @returns {Promise<ApiResponse<SystemSettings>>} Imported system settings
 */
app.post('/import',
  requireSuperAdmin,
  zValidator('json', z.object({
    settings: z.any(),
    category: z.enum(['general', 'security', 'whatsapp', 'notifications', 'features', 'all']).default('all'),
    merge: z.boolean().default(true),
  })),
  async (c) => {
    const { settings, category, merge } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const importedSettings = await importSettings(settings, category, merge);

    console.log(`[SETTINGS_IMPORTED] ${superAdmin.email} imported ${category} settings (merge: ${merge})`);

    return c.json<ApiResponse>({
      success: true,
      data: importedSettings,
      message: `Settings imported successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/activity-log
 *
 * Get settings activity log.
 * Requires Super Admin role.
 *
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 * @returns {Promise<ApiResponse<any>>} Settings activity log
 */
app.get('/activity-log',
  requireSuperAdmin,
  zValidator('query', z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  })),
  async (c) => {
    const { page, limit } = c.req.valid('query');

    const activityLog = await getSettingsActivityLog(page, limit);

    return c.json<ApiResponse>({
      success: true,
      data: activityLog,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/settings/backup
 *
 * Create system settings backup.
 * Requires Super Admin role.
 *
 * @returns {Promise<ApiResponse<any>>} Backup information
 */
app.post('/backup',
  requireSuperAdmin,
  async (c) => {
    const superAdmin = getSuperAdmin(c);

    const backup = await createSettingsBackup();

    console.log(`[SETTINGS_BACKUP_CREATED] ${superAdmin.email} created settings backup`);

    return c.json<ApiResponse>({
      success: true,
      data: backup,
      message: 'Settings backup created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/settings/restore
 *
 * Restore system settings from backup.
 * Requires Super Admin role.
 *
 * @body {object} data - Restore options
 * @returns {Promise<ApiResponse<SystemSettings>>} Restored system settings
 */
app.post('/restore',
  requireSuperAdmin,
  zValidator('json', z.object({
    backupId: z.string(),
    confirm: z.boolean().refine(val => val === true, 'You must confirm the restore'),
  })),
  async (c) => {
    const { backupId } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    const restoredSettings = await restoreSettingsBackup(backupId);

    console.log(`[SETTINGS_RESTORED] ${superAdmin.email} restored settings from backup ${backupId}`);

    return c.json<ApiResponse>({
      success: true,
      data: restoredSettings,
      message: 'Settings restored successfully from backup',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get system settings from database or environment
 */
async function getSystemSettings(): Promise<any> {
  // In a real implementation, this would fetch from database
  // For now, return default settings
  return {
    general: {
      systemName: 'AutoLeads Super Admin',
      adminEmail: 'admin@autoleads.com',
      supportEmail: 'support@autoleads.com',
      maintenanceMode: false,
      maintenanceMessage: '',
      registrationEnabled: true,
      defaultTenantPlan: 'trial',
    },
    security: {
      sessionTimeout: 86400, // 24 hours
      maxLoginAttempts: 5,
      lockoutDuration: 900, // 15 minutes
      passwordMinLength: 8,
      requireStrongPassword: true,
      enableTwoFactor: false,
      allowedIpRanges: [],
    },
    whatsapp: {
      maxMessagesPerDay: 1000,
      maxFileSize: 5242880, // 5MB
      supportedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      autoReplyEnabled: true,
      businessHours: {
        monday: '09:00-18:00',
        tuesday: '09:00-18:00',
        wednesday: '09:00-18:00',
        thursday: '09:00-18:00',
        friday: '09:00-18:00',
        saturday: '09:00-15:00',
        sunday: 'closed',
      },
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      alertThresholds: {
        errorRate: 5,
        responseTime: 2000,
        diskUsage: 80,
      },
    },
    features: {
      enableAnalytics: true,
      enableMonitoring: true,
      enableCustomDomains: true,
      enableApiAccess: true,
      enableWebhooks: true,
    },
  };
}

/**
 * Update system settings
 */
async function updateSystemSettings(updates: any): Promise<any> {
  const currentSettings = await getSystemSettings();

  // Merge updates with current settings
  const updatedSettings = {
    ...currentSettings,
    ...updates,
  };

  // In a real implementation, this would save to database
  // For now, just return the merged settings
  return updatedSettings;
}

/**
 * Update general settings
 */
async function updateGeneralSettings(settings: any): Promise<any> {
  const currentSettings = await getSystemSettings();
  const updatedSettings = {
    ...currentSettings,
    general: {
      ...currentSettings.general,
      ...settings,
    },
  };

  return updatedSettings.general;
}

/**
 * Update security settings
 */
async function updateSecuritySettings(settings: any): Promise<any> {
  const currentSettings = await getSystemSettings();
  const updatedSettings = {
    ...currentSettings,
    security: {
      ...currentSettings.security,
      ...settings,
    },
  };

  return updatedSettings.security;
}

/**
 * Update WhatsApp settings
 */
async function updateWhatsAppSettings(settings: any): Promise<any> {
  const currentSettings = await getSystemSettings();
  const updatedSettings = {
    ...currentSettings,
    whatsapp: {
      ...currentSettings.whatsapp,
      ...settings,
    },
  };

  return updatedSettings.whatsapp;
}

/**
 * Update notification settings
 */
async function updateNotificationSettings(settings: any): Promise<any> {
  const currentSettings = await getSystemSettings();
  const updatedSettings = {
    ...currentSettings,
    notifications: {
      ...currentSettings.notifications,
      ...settings,
    },
  };

  return updatedSettings.notifications;
}

/**
 * Update feature settings
 */
async function updateFeatureSettings(settings: any): Promise<any> {
  const currentSettings = await getSystemSettings();
  const updatedSettings = {
    ...currentSettings,
    features: {
      ...currentSettings.features,
      ...settings,
    },
  };

  return updatedSettings.features;
}

/**
 * Reset settings to defaults
 */
async function resetSettings(category: string): Promise<any> {
  const defaultSettings = await getSystemSettings();

  if (category === 'all') {
    return defaultSettings;
  }

  return { [category]: defaultSettings[category as keyof typeof defaultSettings] };
}

/**
 * Convert settings to YAML format
 */
function convertToYaml(data: any): string {
  // Simplified YAML conversion
  const yamlLines: string[] = [];

  const convertToYaml = (obj: any, indent = 0): void => {
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yamlLines.push(`${spaces}${key}:`);
        convertToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yamlLines.push(`${spaces}${key}:`);
        value.forEach(item => {
          yamlLines.push(`${spaces}  - ${item}`);
        });
      } else {
        yamlLines.push(`${spaces}${key}: ${value}`);
      }
    }
  };

  convertToYaml(data);
  return yamlLines.join('\n');
}

/**
 * Import settings
 */
async function importSettings(settings: any, category: string, merge: boolean): Promise<any> {
  const currentSettings = merge ? await getSystemSettings() : await resetSettings('all');

  if (category === 'all') {
    return merge ? { ...currentSettings, ...settings } : settings;
  }

  return {
    ...currentSettings,
    [category]: merge ? { ...currentSettings[category as keyof typeof currentSettings], ...settings } : settings,
  };
}

/**
 * Get settings activity log
 */
async function getSettingsActivityLog(page: number, limit: number): Promise<any> {
  // Generate mock activity log
  const activities = [];
  for (let i = 0; i < limit; i++) {
    activities.push({
      id: i + 1,
      action: ['updated', 'reset', 'exported', 'imported'][Math.floor(Math.random() * 4)],
      category: ['general', 'security', 'whatsapp', 'notifications', 'features'][Math.floor(Math.random() * 5)],
      description: `Sample settings activity ${i + 1}`,
      user: 'admin@autoleads.com',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    });
  }

  return {
    activities: activities.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: 100, // Mock total
      totalPages: Math.ceil(100 / limit),
    },
  };
}

/**
 * Create settings backup
 */
async function createSettingsBackup(): Promise<any> {
  const settings = await getSystemSettings();
  const backupId = crypto.randomUUID();

  return {
    id: backupId,
    timestamp: new Date().toISOString(),
    settings,
    version: '1.0',
    size: JSON.stringify(settings).length,
  };
}

/**
 * Restore settings from backup
 */
async function restoreSettingsBackup(backupId: string): Promise<any> {
  // In a real implementation, this would fetch backup from storage
  // For now, just return current settings
  return await getSystemSettings();
}

export default app;