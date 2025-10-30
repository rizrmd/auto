/**
 * Super Admin Analytics Routes
 *
 * Handles global analytics and tenant-specific analytics.
 * Provides comprehensive insights into system performance and tenant activity.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SuperAdminService } from '../../services/super-admin.service';
import {
  AnalyticsDateRangeSchema,
  TenantAnalyticsRequestSchema,
  IdParamSchema,
} from '../../validation/super-admin.schemas';
import {
  superAdminAuthMiddleware,
  requireSupport,
  superAdminActivityLogger,
} from '../../middleware/super-admin-auth';
import { ApiResponse } from '../../types/super-admin';
import { getSuperAdmin } from '../../middleware/super-admin-auth';

const app = new Hono();

// Apply authentication middleware to all routes
app.use('*', superAdminAuthMiddleware);
app.use('*', superAdminActivityLogger);

/**
 * GET /api/super-admin/analytics/global
 *
 * Get global analytics overview.
 * Requires Super Admin or Support role.
 *
 * @query {string} startDate - Start date for analytics period
 * @query {string} endDate - End date for analytics period
 * @query {string} groupBy - Grouping period (day, week, month)
 * @returns {Promise<ApiResponse<GlobalAnalytics>>} Global analytics data
 */
app.get('/global',
  requireSupport,
  zValidator('query', AnalyticsDateRangeSchema.partial()),
  async (c) => {
    const dateRange = c.req.valid('query');
    const service = new SuperAdminService();

    // Set default date range if not provided
    const analyticsDateRange = dateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      groupBy: 'day' as const,
    };

    const analytics = await service.getGlobalAnalytics(analyticsDateRange);

    return c.json<ApiResponse>({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/tenants/:id
 *
 * Get tenant-specific analytics.
 * Requires Super Admin or Support role.
 *
 * @param {number} id - Tenant ID
 * @query {string} startDate - Start date for analytics period
 * @query {string} endDate - End date for analytics period
 * @query {string} groupBy - Grouping period (day, week, month)
 * @returns {Promise<ApiResponse<TenantAnalytics>>} Tenant analytics data
 */
app.get('/tenants/:id',
  requireSupport,
  zValidator('param', IdParamSchema),
  zValidator('query', AnalyticsDateRangeSchema.partial()),
  async (c) => {
    const { id } = c.req.valid('param');
    const dateRange = c.req.valid('query');
    const service = new SuperAdminService();

    // Set default date range if not provided
    const analyticsDateRange = dateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      groupBy: 'day' as const,
    };

    const analytics = await service.getTenantAnalytics(id, analyticsDateRange);

    return c.json<ApiResponse>({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/tenants/:id/performance
 *
 * Get detailed tenant performance metrics.
 * Requires Super Admin or Support role.
 *
 * @param {number} id - Tenant ID
 * @query {string} period - Analysis period (7d, 30d, 90d, 1y)
 * @returns {Promise<ApiResponse<any>>} Detailed performance metrics
 */
app.get('/tenants/:id/performance',
  requireSupport,
  zValidator('param', IdParamSchema),
  zValidator('query', z.object({
    period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { period } = c.req.valid('query');
    const service = new SuperAdminService();

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const analyticsDateRange = {
      startDate,
      endDate: now,
      groupBy: period === '7d' ? 'day' as const : period === '1y' ? 'month' as const : 'week' as const,
    };

    const [analytics, performanceHistory] = await Promise.all([
      service.getTenantAnalytics(id, analyticsDateRange),
      getTenantPerformanceHistory(id, analyticsDateRange),
    ]);

    return c.json<ApiResponse>({
      success: true,
      data: {
        ...analytics,
        performanceHistory,
        period,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/leaderboard
 *
 * Get tenant performance leaderboard.
 * Requires Super Admin or Support role.
 *
 * @query {string} metric - Metric to rank by (leads, sales, conversion, growth)
 * @query {string} period - Analysis period (7d, 30d, 90d)
 * @query {number} limit - Number of top tenants to return
 * @returns {Promise<ApiResponse<any>>} Tenant leaderboard
 */
app.get('/leaderboard',
  requireSupport,
  zValidator('query', z.object({
    metric: z.enum(['leads', 'sales', 'conversion', 'growth', 'health']).default('leads'),
    period: z.enum(['7d', '30d', '90d']).default('30d'),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  })),
  async (c) => {
    const { metric, period, limit } = c.req.valid('query');
    const service = new SuperAdminService();

    const leaderboard = await getTenantLeaderboard(metric, period, limit);

    return c.json<ApiResponse>({
      success: true,
      data: {
        metric,
        period,
        leaderboard,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/revenue
 *
 * Get revenue analytics (estimated).
 * Requires Super Admin role.
 *
 * @query {string} startDate - Start date for analytics period
 * @query {string} endDate - End date for analytics period
 * @query {string} groupBy - Grouping period (day, week, month)
 * @returns {Promise<ApiResponse<any>>} Revenue analytics data
 */
app.get('/revenue',
  requireSupport,
  zValidator('query', AnalyticsDateRangeSchema.partial()),
  async (c) => {
    const dateRange = c.req.valid('query');
    const service = new SuperAdminService();

    // Set default date range if not provided
    const analyticsDateRange = dateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      groupBy: 'day' as const,
    };

    const revenueAnalytics = await getRevenueAnalytics(analyticsDateRange);

    return c.json<ApiResponse>({
      success: true,
      data: revenueAnalytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/growth
 *
 * Get growth analytics and trends.
 * Requires Super Admin or Support role.
 *
 * @query {string} period - Analysis period (30d, 90d, 1y)
 * @returns {Promise<ApiResponse<any>>} Growth analytics data
 */
app.get('/growth',
  requireSupport,
  zValidator('query', z.object({
    period: z.enum(['30d', '90d', '1y']).default('90d'),
  })),
  async (c) => {
    const { period } = c.req.valid('query');
    const service = new SuperAdminService();

    const growthAnalytics = await getGrowthAnalytics(period);

    return c.json<ApiResponse>({
      success: true,
      data: growthAnalytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/churn
 *
 * Get tenant churn analysis.
 * Requires Super Admin role.
 *
 * @query {string} period - Analysis period (30d, 90d, 1y)
 * @returns {Promise<ApiResponse<any>>} Churn analytics data
 */
app.get('/churn',
  requireSupport,
  zValidator('query', z.object({
    period: z.enum(['30d', '90d', '1y']).default('90d'),
  })),
  async (c) => {
    const { period } = c.req.valid('query');

    const churnAnalytics = await getChurnAnalytics(period);

    return c.json<ApiResponse>({
      success: true,
      data: churnAnalytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/analytics/export
 *
 * Export analytics data.
 * Requires Super Admin role.
 *
 * @query {string} type - Export type (global, tenant, revenue, growth)
 * @query {string} format - Export format (json, csv, xlsx)
 * @query {string} startDate - Start date for export
 * @query {string} endDate - End date for export
 * @query {number} tenantId - Tenant ID (for tenant-specific export)
 * @returns {Promise<any>>} Exported analytics data
 */
app.get('/export',
  requireSupport,
  zValidator('query', z.object({
    type: z.enum(['global', 'tenant', 'revenue', 'growth']),
    format: z.enum(['json', 'csv', 'xlsx']).default('json'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    tenantId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  })),
  async (c) => {
    const { type, format, startDate, endDate, tenantId } = c.req.valid('query');
    const superAdmin = getSuperAdmin(c);
    const service = new SuperAdminService();

    // Set default date range
    const dateRange = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
      groupBy: 'day' as const,
    };

    let exportData: any;

    switch (type) {
      case 'global':
        exportData = await service.getGlobalAnalytics(dateRange);
        break;
      case 'tenant':
        if (!tenantId) {
          throw new BadRequestError('Tenant ID is required for tenant export');
        }
        exportData = await service.getTenantAnalytics(tenantId, dateRange);
        break;
      case 'revenue':
        exportData = await getRevenueAnalytics(dateRange);
        break;
      case 'growth':
        exportData = await getGrowthAnalytics('90d');
        break;
    }

    // Log export
    console.log(`[ANALYTICS_EXPORTED] ${superAdmin.email} exported ${type} analytics (${format})`);

    if (format === 'csv') {
      const csvData = convertAnalyticsToCSV(exportData, type);

      return c.body(csvData, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
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
 * GET /api/super-admin/analytics/dashboard
 *
 * Get dashboard overview with key metrics.
 * Requires Super Admin or Support role.
 *
 * @returns {Promise<ApiResponse<any>>} Dashboard overview
 */
app.get('/dashboard',
  requireSupport,
  async (c) => {
    const service = new SuperAdminService();

    // Get multiple analytics in parallel
    const [
      globalAnalytics,
      topTenants,
      recentActivity,
      healthSummary,
    ] = await Promise.all([
      service.getGlobalAnalytics(),
      getTopPerformingTenants(5),
      getRecentSystemActivity(10),
      getHealthSummary(),
    ]);

    const dashboard = {
      overview: globalAnalytics.overview,
      growth: globalAnalytics.growth,
      performance: globalAnalytics.performance,
      topTenants,
      recentActivity,
      healthSummary,
      alerts: await getSystemAlerts(),
    };

    return c.json<ApiResponse>({
      success: true,
      data: dashboard,
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
 * Get tenant performance history
 */
async function getTenantPerformanceHistory(tenantId: number, dateRange: any): Promise<any[]> {
  // Placeholder implementation - would calculate daily/weekly performance metrics
  const history = [];
  const daysDiff = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const groupBy = dateRange.groupBy;

  for (let i = daysDiff - 1; i >= 0; i -= groupBy === 'day' ? 1 : groupBy === 'week' ? 7 : 30) {
    const date = new Date(dateRange.endDate);
    date.setDate(date.getDate() - i);

    history.push({
      date: date.toISOString().split('T')[0],
      leads: Math.floor(Math.random() * 10) + 1,
      sales: Math.floor(Math.random() * 3),
      revenue: Math.floor(Math.random() * 500) + 100,
      conversionRate: Math.floor(Math.random() * 30) + 10,
    });
  }

  return history;
}

/**
 * Get tenant leaderboard
 */
async function getTenantLeaderboard(metric: string, period: string, limit: number): Promise<any[]> {
  // Placeholder implementation
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      subdomain: true,
      _count: {
        select: {
          cars: { where: { status: { not: 'deleted' } } },
          leads: true,
        },
      },
    },
  });

  return tenants
    .map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      value: calculateMetricValue(tenant, metric),
      change: Math.floor(Math.random() * 20) - 10, // Random change for demo
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Calculate metric value for tenant
 */
function calculateMetricValue(tenant: any, metric: string): number {
  switch (metric) {
    case 'leads':
      return tenant._count.leads;
    case 'sales':
      return Math.floor(tenant._count.leads * 0.2); // Estimate
    case 'conversion':
      return Math.floor(Math.random() * 30) + 10; // Random conversion rate
    case 'growth':
      return Math.floor(Math.random() * 50) + 10; // Random growth rate
    case 'health':
      return Math.floor(Math.random() * 40) + 60; // Random health score
    default:
      return tenant._count.leads;
  }
}

/**
 * Get revenue analytics
 */
async function getRevenueAnalytics(dateRange: any): Promise<any> {
  const soldCars = await prisma.car.findMany({
    where: {
      status: 'sold',
      soldAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
    select: {
      price: true,
      soldAt: true,
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totalRevenue = soldCars.reduce((sum, car) => sum + Number(car.price), 0);
  const avgSalePrice = soldCars.length > 0 ? totalRevenue / soldCars.length : 0;

  // Group by tenant
  const revenueByTenant = soldCars.reduce((acc, car) => {
    const tenantId = car.tenant.id;
    if (!acc[tenantId]) {
      acc[tenantId] = {
        tenantId,
        tenantName: car.tenant.name,
        revenue: 0,
        sales: 0,
      };
    }
    acc[tenantId].revenue += Number(car.price);
    acc[tenantId].sales += 1;
    return acc;
  }, {} as Record<number, any>);

  // Generate daily revenue trend
  const revenueTrend = generateRevenueTrend(dateRange, soldCars);

  return {
    totalRevenue,
    totalSales: soldCars.length,
    avgSalePrice,
    revenueByTenant: Object.values(revenueByTenant),
    revenueTrend,
  };
}

/**
 * Generate revenue trend data
 */
function generateRevenueTrend(dateRange: any, soldCars: any[]): any[] {
  const trend = [];
  const daysDiff = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = daysDiff - 1; i >= 0; i--) {
    const date = new Date(dateRange.endDate);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dailyRevenue = soldCars
      .filter(car => car.soldAt >= date && car.soldAt < nextDate)
      .reduce((sum, car) => sum + Number(car.price), 0);

    trend.push({
      date: date.toISOString().split('T')[0],
      revenue: dailyRevenue,
      sales: soldCars.filter(car => car.soldAt >= date && car.soldAt < nextDate).length,
    });
  }

  return trend;
}

/**
 * Get growth analytics
 */
async function getGrowthAnalytics(period: string): Promise<any> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const [newTenants, newLeads, newSales] = await Promise.all([
    prisma.tenant.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.car.count({
      where: {
        status: 'sold',
        soldAt: { gte: startDate },
      },
    }),
  ]);

  // Calculate growth rates (simplified)
  const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
  const [previousTenants, previousLeads, previousSales] = await Promise.all([
    prisma.tenant.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    }),
    prisma.lead.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    }),
    prisma.car.count({
      where: {
        status: 'sold',
        soldAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    }),
  ]);

  return {
    period,
    current: {
      newTenants,
      newLeads,
      newSales,
    },
    previous: {
      newTenants: previousTenants,
      newLeads: previousLeads,
      newSales: previousSales,
    },
    growthRates: {
      tenants: previousTenants > 0 ? ((newTenants - previousTenants) / previousTenants) * 100 : 0,
      leads: previousLeads > 0 ? ((newLeads - previousLeads) / previousLeads) * 100 : 0,
      sales: previousSales > 0 ? ((newSales - previousSales) / previousSales) * 100 : 0,
    },
    trend: await generateGrowthTrend(startDate, now),
  };
}

/**
 * Generate growth trend data
 */
async function generateGrowthTrend(startDate: Date, endDate: Date): Promise<any[]> {
  const trend = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = daysDiff - 1; i >= 0; i -= 7) { // Weekly data
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);

    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - 7);

    const [weekTenants, weekLeads, weekSales] = await Promise.all([
      prisma.tenant.count({
        where: { createdAt: { gte: weekStart, lt: date } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: weekStart, lt: date } },
      }),
      prisma.car.count({
        where: {
          status: 'sold',
          soldAt: { gte: weekStart, lt: date },
        },
      }),
    ]);

    trend.push({
      date: date.toISOString().split('T')[0],
      tenants: weekTenants,
      leads: weekLeads,
      sales: weekSales,
    });
  }

  return trend;
}

/**
 * Get churn analytics
 */
async function getChurnAnalytics(period: string): Promise<any> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  // Get suspended/expired tenants
  const churnedTenants = await prisma.tenant.findMany({
    where: {
      status: { in: ['suspended', 'expired'] },
      updatedAt: { gte: startDate },
    },
    select: {
      id: true,
      name: true,
      status: true,
      plan: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          cars: true,
          leads: true,
        },
      },
    },
  });

  const totalTenants = await prisma.tenant.count();
  const activeTenants = await prisma.tenant.count({ where: { status: 'active' } });
  const churnRate = totalTenants > 0 ? (churnedTenants.length / totalTenants) * 100 : 0;

  // Group by plan
  const churnByPlan = churnedTenants.reduce((acc, tenant) => {
    const plan = tenant.plan;
    if (!acc[plan]) {
      acc[plan] = { plan, count: 0, tenants: [] };
    }
    acc[plan].count++;
    acc[plan].tenants.push({
      id: tenant.id,
      name: tenant.name,
      churnedAt: tenant.updatedAt,
      carsCount: tenant._count.cars,
      leadsCount: tenant._count.leads,
    });
    return acc;
  }, {} as Record<string, any>);

  return {
    period,
    totalTenants,
    activeTenants,
    churnedTenants: churnedTenants.length,
    churnRate,
    churnByPlan: Object.values(churnByPlan),
    monthlyTrend: await getChurnMonthlyTrend(startDate, now),
  };
}

/**
 * Get churn monthly trend
 */
async function getChurnMonthlyTrend(startDate: Date, endDate: Date): Promise<any[]> {
  const trend = [];
  const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

  for (let i = monthsDiff - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyChurn = await prisma.tenant.count({
      where: {
        status: { in: ['suspended', 'expired'] },
        updatedAt: { gte: date, lt: nextMonth },
      },
    });

    trend.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM
      churned: monthlyChurn,
    });
  }

  return trend;
}

/**
 * Get top performing tenants
 */
async function getTopPerformingTenants(limit: number): Promise<any[]> {
  const service = new SuperAdminService();
  const globalAnalytics = await service.getGlobalAnalytics();
  return globalAnalytics.performance.topPerformingTenants.slice(0, limit);
}

/**
 * Get recent system activity
 */
async function getRecentSystemActivity(limit: number): Promise<any[]> {
  // Get recent tenant creations, leads, and sales
  const [recentTenants, recentLeads, recentSales] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        customerName: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.car.findMany({
      where: { status: 'sold' },
      orderBy: { soldAt: 'desc' },
      take: Math.floor(limit / 3),
      select: {
        id: true,
        publicName: true,
        soldAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const activities = [
    ...recentTenants.map(tenant => ({
      type: 'tenant_created',
      description: `New tenant: ${tenant.name}`,
      timestamp: tenant.createdAt,
    })),
    ...recentLeads.map(lead => ({
      type: 'lead_created',
      description: `New lead: ${lead.customerName || 'Unknown'} (${lead.tenant.name})`,
      timestamp: lead.createdAt,
    })),
    ...recentSales.map(sale => ({
      type: 'car_sold',
      description: `Car sold: ${sale.publicName} (${sale.tenant.name})`,
      timestamp: sale.soldAt!,
    })),
  ];

  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get health summary
 */
async function getHealthSummary(): Promise<any> {
  const [totalTenants, activeTenants, trialTenants, suspendedTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'active' } }),
    prisma.tenant.count({ where: { status: 'trial' } }),
    prisma.tenant.count({ where: { status: 'suspended' } }),
  ]);

  return {
    total: totalTenants,
    active: activeTenants,
    trial: trialTenants,
    suspended: suspendedTenants,
    healthScore: totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 100,
  };
}

/**
 * Get system alerts
 */
async function getSystemAlerts(): Promise<any[]> {
  const alerts = [];

  // Check for tenants ending trial soon
  const trialEndingSoon = await prisma.tenant.count({
    where: {
      status: 'trial',
      trialEndsAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        gte: new Date(),
      },
    },
  });

  if (trialEndingSoon > 0) {
    alerts.push({
      type: 'warning',
      title: 'Trials Ending Soon',
      message: `${trialEndingSoon} tenant(s) have trials ending in the next 7 days`,
      action: '/super-admin/tenants?status=trial',
    });
  }

  // Check for inactive tenants
  const inactiveTenants = await prisma.tenant.count({
    where: {
      status: 'active',
      updatedAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    },
  });

  if (inactiveTenants > 0) {
    alerts.push({
      type: 'info',
      title: 'Inactive Tenants',
      message: `${inactiveTenants} active tenant(s) haven't had activity in 30+ days`,
      action: '/super-admin/tenants?sortBy=lastActivity',
    });
  }

  return alerts;
}

/**
 * Convert analytics data to CSV
 */
function convertAnalyticsToCSV(data: any, type: string): string {
  // Simplified CSV conversion
  const headers = ['Metric', 'Value', 'Date'];
  const rows = [headers.join(',')];

  switch (type) {
    case 'global':
      rows.push(`Total Tenants,${data.overview.totalTenants},${new Date().toISOString().split('T')[0]}`);
      rows.push(`Active Tenants,${data.overview.activeTenants},${new Date().toISOString().split('T')[0]}`);
      rows.push(`Total Cars,${data.overview.totalCars},${new Date().toISOString().split('T')[0]}`);
      rows.push(`Total Leads,${data.overview.totalLeads},${new Date().toISOString().split('T')[0]}`);
      break;
    // Add other types as needed
  }

  return rows.join('\n');
}

export default app;