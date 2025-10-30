/**
 * Super Admin Tenant Management Routes
 *
 * Handles tenant CRUD operations, theme management, and status updates.
 * Provides comprehensive tenant administration capabilities.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SuperAdminService } from '../../services/super-admin.service';
import {
  TenantCreateSchema,
  TenantUpdateSchema,
  ThemeUpdateSchema,
  TenantStatusUpdateSchema,
  TenantFilterSchema,
  IdParamSchema,
} from '../../validation/super-admin.schemas';
import {
  superAdminAuthMiddleware,
  requireSuperAdmin,
  superAdminActivityLogger,
  getSuperAdmin,
} from '../../middleware/super-admin-auth';
import { ApiResponse, ListResponse } from '../../types/super-admin';
import { BadRequestError } from '../../middleware/error-handler';
import { prisma } from '../../db';

const app = new Hono();

// Apply authentication middleware to all routes
app.use('*', superAdminAuthMiddleware);
app.use('*', superAdminActivityLogger);

/**
 * GET /api/super-admin/tenants
 *
 * List all tenants with filtering and pagination.
 * Requires Super Admin role.
 *
 * @query {string} search - Search term for tenant name, subdomain, or email
 * @query {string} status - Filter by tenant status
 * @query {string} plan - Filter by tenant plan
 * @query {string} sortBy - Sort field (name, createdAt, lastActivity, carsCount, leadsCount)
 * @query {string} sortOrder - Sort order (asc, desc)
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 * @returns {Promise<ListResponse<TenantProfile>>} List of tenants
 */
app.get('/',
  requireSuperAdmin,
  zValidator('query', TenantFilterSchema),
  async (c) => {
    const filter = c.req.valid('query');
    const service = new SuperAdminService();

    const result = await service.listTenants(filter);

    return c.json<ApiResponse<ListResponse>>({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/tenants/:id
 *
 * Get tenant profile by ID.
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @returns {Promise<ApiResponse<TenantProfile>>} Tenant profile
 */
app.get('/:id',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const service = new SuperAdminService();

    const tenant = await service.getTenantProfile(id);

    return c.json<ApiResponse>({
      success: true,
      data: tenant,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/tenants
 *
 * Create a new tenant with default admin user.
 * Requires Super Admin role.
 *
 * @body {TenantCreateData} data - Tenant creation data
 * @returns {Promise<ApiResponse<TenantProfile>>} Created tenant profile
 */
app.post('/',
  requireSuperAdmin,
  zValidator('json', TenantCreateSchema),
  async (c) => {
    const data = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    const tenant = await service.createTenant(data);

    // Log tenant creation
    console.log(`[TENANT_CREATED_BY_ADMIN] ${superAdmin.email} created tenant: ${tenant.name}`);

    return c.json<ApiResponse>({
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/tenants/:id
 *
 * Update tenant information.
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @body {TenantUpdateData} data - Tenant update data
 * @returns {Promise<ApiResponse<TenantProfile>>} Updated tenant profile
 */
app.put('/:id',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('json', TenantUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    const tenant = await service.updateTenant(id, data);

    // Log tenant update
    console.log(`[TENANT_UPDATED_BY_ADMIN] ${superAdmin.email} updated tenant: ${tenant.name}`);

    return c.json<ApiResponse>({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/tenants/:id/theme
 *
 * Update tenant theme (colors and logo).
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @body {ThemeUpdateData} data - Theme update data
 * @returns {Promise<ApiResponse<TenantProfile>>} Updated tenant profile
 */
app.put('/:id/theme',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('json', ThemeUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    const tenant = await service.updateTenantTheme(id, data);

    // Log theme update
    console.log(`[TENANT_THEME_UPDATED_BY_ADMIN] ${superAdmin.email} updated theme for: ${tenant.name}`);

    return c.json<ApiResponse>({
      success: true,
      data: tenant,
      message: 'Tenant theme updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/tenants/:id/status
 *
 * Update tenant status (suspend/activate).
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @body {TenantStatusUpdateData} data - Status update data
 * @returns {Promise<ApiResponse<TenantProfile>>} Updated tenant profile
 */
app.put('/:id/status',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('json', TenantStatusUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { status, reason } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    const tenant = await service.updateTenantStatus(id, status, reason);

    // Log status change
    console.log(`[TENANT_STATUS_CHANGED_BY_ADMIN] ${superAdmin.email} changed ${tenant.name} status to ${status}${reason ? ` (${reason})` : ''}`);

    return c.json<ApiResponse>({
      success: true,
      data: tenant,
      message: `Tenant ${status === 'active' ? 'activated' : 'suspended'} successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * DELETE /api/super-admin/tenants/:id
 *
 * Delete tenant (soft delete).
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @returns {Promise<ApiResponse>> Deletion confirmation
 */
app.delete('/:id',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    // Get tenant name for logging
    const tenant = await service.getTenantProfile(id);

    await service.deleteTenant(id);

    // Log tenant deletion
    console.log(`[TENANT_DELETED_BY_ADMIN] ${superAdmin.email} deleted tenant: ${tenant.name}`);

    return c.json<ApiResponse>({
      success: true,
      message: 'Tenant deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/tenants/:id/health-score
 *
 * Get tenant health score calculation.
 * Requires Super Admin or Support role.
 *
 * @param {number} id - Tenant ID
 * @returns {Promise<ApiResponse<{score: number, breakdown: any}>>} Health score details
 */
app.get('/:id/health-score',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const service = new SuperAdminService();

    const tenant = await service.getTenantProfile(id);

    // Return health score with breakdown (simplified version)
    const breakdown = {
      activity: {
        score: tenant._count.activeLeads > 0 ? 20 : 0,
        weight: 40,
        description: 'Active leads and cars',
      },
      recentActivity: {
        score: tenant.lastActivity ? 20 : 0,
        weight: 20,
        description: 'Recent customer activity',
      },
      plan: {
        score: this.getPlanScore(tenant.plan),
        weight: 20,
        description: 'Subscription plan tier',
      },
      status: {
        score: tenant.status === 'active' ? 20 : tenant.status === 'trial' ? 15 : 0,
        weight: 20,
        description: 'Account status',
      },
    };

    return c.json<ApiResponse>({
      success: true,
      data: {
        score: tenant.healthScore,
        breakdown,
        recommendation: this.getHealthScoreRecommendation(tenant.healthScore),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/tenants/:id/reset-password
 *
 * Reset tenant admin password.
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @body {string} newPassword - New password for tenant admin
 * @returns {Promise<ApiResponse>> Password reset confirmation
 */
app.post('/:id/reset-password',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('json', z.object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long'),
  })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { newPassword } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    // Get tenant admin user
    const tenantAdmin = await prisma.user.findFirst({
      where: {
        tenantId: id,
        role: 'tenant_admin',
      },
    });

    if (!tenantAdmin) {
      throw new BadRequestError('Tenant admin not found');
    }

    // Hash new password
    const passwordHash = await Bun.password.hash(newPassword, {
      algorithm: 'bcrypt',
      cost: 10,
    });

    // Update password
    await prisma.user.update({
      where: { id: tenantAdmin.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Get tenant name for logging
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { name: true },
    });

    // Log password reset
    console.log(`[TENANT_PASSWORD_RESET_BY_ADMIN] ${superAdmin.email} reset password for admin of: ${tenant?.name}`);

    return c.json<ApiResponse>({
      success: true,
      message: 'Tenant admin password reset successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/tenants/:id/export
 *
 * Export tenant data (cars, leads, users).
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @query {string} format - Export format (json, csv)
 * @returns {Promise<ApiResponse<any>>} Exported tenant data
 */
app.get('/:id/export',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('query', z.object({
    format: z.enum(['json', 'csv']).default('json'),
  })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { format } = c.req.valid('query');
    const superAdmin = getSuperAdmin(c);

    const service = new SuperAdminService();
    const tenant = await service.getTenantProfile(id);

    // Get tenant data
    const [cars, leads, users] = await Promise.all([
      prisma.car.findMany({
        where: { tenantId: id, status: { not: 'deleted' } },
        include: {
          leads: {
            select: {
              id: true,
              customerName: true,
              status: true,
            },
          },
        },
      }),
      prisma.lead.findMany({
        where: { tenantId: id },
        include: {
          car: {
            select: {
              id: true,
              publicName: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { tenantId: id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
    ]);

    const exportData = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        email: tenant.email,
        phone: tenant.phone,
        plan: tenant.plan,
        status: tenant.status,
        createdAt: tenant.createdAt,
      },
      cars,
      leads,
      users,
      exportedAt: new Date().toISOString(),
      exportedBy: superAdmin.email,
    };

    // Log export
    console.log(`[TENANT_DATA_EXPORTED] ${superAdmin.email} exported data for: ${tenant.name} (${format})`);

    if (format === 'csv') {
      // Convert to CSV (simplified version)
      const csvData = this.convertToCSV(exportData);

      return c.body(csvData, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tenant-${tenant.subdomain}-export.csv"`,
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
 * POST /api/super-admin/tenants/:id/duplicate
 *
 * Duplicate tenant configuration (for creating similar tenants).
 * Requires Super Admin role.
 *
 * @param {number} id - Tenant ID
 * @body {object} data - Duplication options
 * @returns {Promise<ApiResponse<TenantProfile>>} New tenant profile
 */
app.post('/:id/duplicate',
  requireSuperAdmin,
  zValidator('param', IdParamSchema),
  zValidator('json', z.object({
    name: z.string().min(2, 'New tenant name required'),
    subdomain: z.string().min(3, 'New subdomain required'),
    copySettings: z.boolean().default(true),
    copyTheme: z.boolean().default(true),
    copyAdminUser: z.boolean().default(false),
  })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { name, subdomain, copySettings, copyTheme, copyAdminUser } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    // Get source tenant
    const sourceTenant = await service.getTenantProfile(id);

    // Prepare new tenant data
    const newTenantData: any = {
      name: name.trim(),
      subdomain: subdomain.toLowerCase(),
      phone: sourceTenant.phone,
      whatsappNumber: sourceTenant.whatsappNumber,
      plan: sourceTenant.plan,
    };

    if (copyTheme) {
      newTenantData.primaryColor = sourceTenant.primaryColor;
      newTenantData.secondaryColor = sourceTenant.secondaryColor;
      newTenantData.logoUrl = sourceTenant.logoUrl;
    }

    if (copySettings) {
      newTenantData.settings = sourceTenant.settings;
      newTenantData.businessHours = sourceTenant.businessHours;
    }

    // Create admin user for new tenant
    newTenantData.adminUser = {
      name: `Admin ${name}`,
      email: `admin@${subdomain}.autoleads.com`,
      password: 'TempPassword123!', // Would be changed later
    };

    const newTenant = await service.createTenant(newTenantData);

    // Log duplication
    console.log(`[TENANT_DUPLICATED_BY_ADMIN] ${superAdmin.email} duplicated ${sourceTenant.name} as ${newTenant.name}`);

    return c.json<ApiResponse>({
      success: true,
      data: newTenant,
      message: 'Tenant duplicated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * Get health score recommendation based on score
 */
function getHealthScoreRecommendation(score: number): string {
  if (score >= 80) return 'Excellent performance - tenant is very active and healthy';
  if (score >= 60) return 'Good performance - tenant is active but could improve';
  if (score >= 40) return 'Fair performance - tenant needs attention and support';
  if (score >= 20) return 'Poor performance - tenant needs immediate attention';
  return 'Critical - tenant is inactive or experiencing issues';
}

/**
 * Get plan score based on subscription plan
 */
function getPlanScore(plan: string): number {
  const planScores: Record<string, number> = {
    trial: 5,
    free: 10,
    starter: 15,
    growth: 18,
    pro: 20,
    basic: 12,
    enterprise: 20,
  };
  return planScores[plan] || 0;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any): string {
  // Simplified CSV conversion
  const headers = ['Type', 'ID', 'Name', 'Status', 'Created At'];
  const rows = [headers.join(',')];

  // Add tenant info
  rows.push(`Tenant,${data.tenant.id},"${data.tenant.name}",${data.tenant.status},${data.tenant.createdAt}`);

  // Add cars
  data.cars.forEach((car: any) => {
    rows.push(`Car,${car.id},"${car.publicName}",${car.status},${car.createdAt}`);
  });

  // Add leads
  data.leads.forEach((lead: any) => {
    rows.push(`Lead,${lead.id},"${lead.customerName || 'Unknown'}",${lead.status},${lead.createdAt}`);
  });

  // Add users
  data.users.forEach((user: any) => {
    rows.push(`User,${user.id},"${user.name}",${user.status},${user.createdAt}`);
  });

  return rows.join('\n');
}

export default app;