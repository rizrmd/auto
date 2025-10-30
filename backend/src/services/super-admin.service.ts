/**
 * Super Admin Service
 *
 * Core business logic for Super Admin operations.
 * Handles tenant management, analytics, monitoring, and system administration.
 */

import { prisma, checkDatabaseHealth } from '../db';
import {
  TenantCreateData,
  TenantUpdateData,
  ThemeUpdateData,
  TenantProfile,
  GlobalAnalytics,
  TenantAnalytics,
  SystemHealth,
  WhatsAppBotMetrics,
  StorageMetrics,
  ActivityLogEntry,
  ApiResponse,
  ListResponse,
  TenantFilter,
  AnalyticsDateRange,
  ActivityLogFilter,
  PaginationMeta
} from '../types/super-admin';
import { generateSlug } from '../utils/slug-generator';
import { withTransaction } from '../db';
import { NotFoundError, BadRequestError } from '../middleware/error-handler';

/**
 * Super Admin Service Class
 */
export class SuperAdminService {
  // ============================================
  // TENANT MANAGEMENT
  // ============================================

  /**
   * Create a new tenant with admin user
   */
  async createTenant(data: TenantCreateData): Promise<TenantProfile> {
    return await withTransaction(async (tx) => {
      // Check if subdomain already exists
      const existingSubdomain = await tx.tenant.findUnique({
        where: { subdomain: data.subdomain },
      });

      if (existingSubdomain) {
        throw new BadRequestError('Subdomain already exists');
      }

      // Check if custom domain already exists
      if (data.customDomain) {
        const existingDomain = await tx.tenant.findUnique({
          where: { customDomain: data.customDomain },
        });

        if (existingDomain) {
          throw new BadRequestError('Custom domain already exists');
        }
      }

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name.trim(),
          slug: generateSlug(data.name),
          subdomain: data.subdomain.toLowerCase(),
          customDomain: data.customDomain?.toLowerCase() || null,
          primaryColor: data.primaryColor || '#FF5722',
          secondaryColor: data.secondaryColor || '#000000',
          phone: data.phone,
          whatsappNumber: data.whatsappNumber,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          mapsUrl: data.mapsUrl || null,
          businessHours: data.businessHours || null,
          plan: data.plan || 'trial',
          planStartedAt: new Date(),
          trialEndsAt: data.plan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null, // 14 days trial
          status: data.plan === 'trial' ? 'trial' : 'active',
          settings: {},
        },
      });

      // Hash admin password
      const passwordHash = await Bun.password.hash(data.adminUser.password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      // Create admin user for tenant
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.adminUser.name.trim(),
          email: data.adminUser.email.toLowerCase().trim(),
          phone: data.adminUser.phone || null,
          whatsappNumber: data.adminUser.phone || null,
          passwordHash,
          role: 'tenant_admin',
          status: 'active',
        },
      });

      // Log tenant creation
      console.log(`[TENANT_CREATED] ${tenant.name} (${tenant.subdomain})`);

      return await this.getTenantProfile(tenant.id);
    });
  }

  /**
   * Get tenant by ID with profile information
   */
  async getTenantProfile(tenantId: number): Promise<TenantProfile> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            cars: true,
            leads: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Get additional counts
    const [activeLeads, soldCars, lastActivity] = await Promise.all([
      prisma.lead.count({
        where: {
          tenantId,
          status: { in: ['new', 'hot', 'warm', 'cold'] },
        },
      }),
      prisma.car.count({
        where: {
          tenantId,
          status: 'sold',
        },
      }),
      prisma.lead.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Calculate health score
    const healthScore = this.calculateTenantHealthScore({
      totalCars: tenant._count.cars,
      totalLeads: tenant._count.leads,
      activeLeads,
      soldCars,
      lastActivity: lastActivity?.createdAt || null,
      plan: tenant.plan,
      status: tenant.status,
    });

    return {
      ...tenant,
      _count: {
        ...tenant._count,
        activeLeads,
        soldCars,
      },
      healthScore,
      lastActivity: lastActivity?.createdAt || null,
    };
  }

  /**
   * Update tenant information
   */
  async updateTenant(tenantId: number, data: TenantUpdateData): Promise<TenantProfile> {
    return await withTransaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Check custom domain uniqueness if provided
      if (data.customDomain && data.customDomain !== tenant.customDomain) {
        const existingDomain = await tx.tenant.findUnique({
          where: { customDomain: data.customDomain },
        });

        if (existingDomain) {
          throw new BadRequestError('Custom domain already exists');
        }
      }

      // Update tenant
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return await this.getTenantProfile(tenantId);
    });
  }

  /**
   * Update tenant theme
   */
  async updateTenantTheme(tenantId: number, data: ThemeUpdateData): Promise<TenantProfile> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return await this.getTenantProfile(tenantId);
  }

  /**
   * Suspend or activate tenant
   */
  async updateTenantStatus(tenantId: number, status: 'active' | 'suspended', reason?: string): Promise<TenantProfile> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status,
        updatedAt: new Date(),
        // Store reason in settings for audit
        settings: {
          ...tenant.settings,
          statusChangeReason: reason,
          statusChangedAt: new Date().toISOString(),
        },
      },
    });

    // Log status change
    console.log(`[TENANT_STATUS_CHANGED] ${tenant.name} -> ${status}${reason ? ` (${reason})` : ''}`);

    return await this.getTenantProfile(tenantId);
  }

  /**
   * Delete tenant (soft delete by marking as deleted)
   */
  async deleteTenant(tenantId: number): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    await withTransaction(async (tx) => {
      // Soft delete all related data
      await Promise.all([
        tx.car.updateMany({
          where: { tenantId },
          data: { status: 'deleted', deletedAt: new Date() },
        }),
        tx.lead.updateMany({
          where: { tenantId },
          data: { status: 'lost', closedAt: new Date() },
        }),
      ]);

      // Mark tenant as suspended
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'expired',
          updatedAt: new Date(),
          settings: {
            ...tenant.settings,
            deletedAt: new Date().toISOString(),
            deletedBy: 'super_admin',
          },
        },
      });
    });

    // Log deletion
    console.log(`[TENANT_DELETED] ${tenant.name} (${tenant.subdomain})`);
  }

  /**
   * List tenants with filtering and pagination
   */
  async listTenants(filter: TenantFilter): Promise<ListResponse<TenantProfile>> {
    const {
      search,
      status,
      plan,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filter;

    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (plan) {
      where.plan = plan;
    }

    // Get total count
    const total = await prisma.tenant.count({ where });

    // Get tenants
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            cars: true,
            leads: true,
            users: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with additional data
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant) => {
        const [activeLeads, soldCars, lastActivity] = await Promise.all([
          prisma.lead.count({
            where: {
              tenantId: tenant.id,
              status: { in: ['new', 'hot', 'warm', 'cold'] },
            },
          }),
          prisma.car.count({
            where: {
              tenantId: tenant.id,
              status: 'sold',
            },
          }),
          prisma.lead.findFirst({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        const healthScore = this.calculateTenantHealthScore({
          totalCars: tenant._count.cars,
          totalLeads: tenant._count.leads,
          activeLeads,
          soldCars,
          lastActivity: lastActivity?.createdAt || null,
          plan: tenant.plan,
          status: tenant.status,
        });

        return {
          ...tenant,
          _count: {
            ...tenant._count,
            activeLeads,
            soldCars,
          },
          healthScore,
          lastActivity: lastActivity?.createdAt || null,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items: enrichedTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get global analytics overview
   */
  async getGlobalAnalytics(dateRange?: AnalyticsDateRange): Promise<GlobalAnalytics> {
    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : {};

    // Get overview data
    const [
      totalTenants,
      activeTenants,
      totalCars,
      availableCars,
      soldCars,
      totalLeads,
      activeLeads,
      closedLeads,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.car.count({ where: { status: { not: 'deleted' } } }),
      prisma.car.count({ where: { status: 'available' } }),
      prisma.car.count({ where: { status: 'sold' } }),
      prisma.lead.count({ where: dateFilter }),
      prisma.lead.count({
        where: {
          ...dateFilter,
          status: { in: ['new', 'hot', 'warm', 'cold'] },
        },
      }),
      prisma.lead.count({
        where: {
          ...dateFilter,
          status: { in: ['closed', 'lost'] },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
    ]);

    // Calculate growth metrics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      newTenantsThisMonth,
      newTenantsThisYear,
      newLeadsThisMonth,
      newLeadsThisYear,
      carsSoldThisMonth,
      carsSoldThisYear,
    ] = await Promise.all([
      prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfYear } } }),
      prisma.lead.count({ where: { ...dateFilter, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { ...dateFilter, createdAt: { gte: startOfYear } } }),
      prisma.car.count({ where: { status: 'sold', soldAt: { gte: startOfMonth } } }),
      prisma.car.count({ where: { status: 'sold', soldAt: { gte: startOfYear } } }),
    ]);

    const previousMonthTenants = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: startOfMonth,
        },
      },
    });

    const previousMonthLeads = await prisma.lead.count({
      where: {
        ...dateFilter,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: startOfMonth,
        },
      },
    });

    const previousMonthSales = await prisma.car.count({
      where: {
        status: 'sold',
        soldAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: startOfMonth,
        },
      },
    });

    // Calculate performance metrics
    const avgLeadsPerTenant = activeTenants > 0 ? Math.round(totalLeads / activeTenants) : 0;
    const avgCarsPerTenant = activeTenants > 0 ? Math.round(totalCars / activeTenants) : 0;
    const leadConversionRate = totalLeads > 0 ? Math.round((soldCars / totalLeads) * 100) : 0;

    // Get top performing tenants
    const topPerformingTenants = await this.getTopPerformingTenants(5, dateRange);

    // Get trends data
    const trends = await this.getAnalyticsTrends(dateRange);

    return {
      overview: {
        totalTenants,
        activeTenants,
        totalCars,
        availableCars,
        soldCars,
        totalLeads,
        activeLeads,
        closedLeads,
        totalUsers,
        activeUsers,
      },
      growth: {
        newTenantsThisMonth,
        newTenantsThisYear,
        tenantGrowthRate: previousMonthTenants > 0
          ? Math.round(((newTenantsThisMonth - previousMonthTenants) / previousMonthTenants) * 100)
          : 0,
        newLeadsThisMonth,
        newLeadsThisYear,
        leadGrowthRate: previousMonthLeads > 0
          ? Math.round(((newLeadsThisMonth - previousMonthLeads) / previousMonthLeads) * 100)
          : 0,
        carsSoldThisMonth,
        carsSoldThisYear,
        salesGrowthRate: previousMonthSales > 0
          ? Math.round(((carsSoldThisMonth - previousMonthSales) / previousMonthSales) * 100)
          : 0,
      },
      performance: {
        averageLeadsPerTenant: avgLeadsPerTenant,
        averageCarsPerTenant: avgCarsPerTenant,
        leadConversionRate,
        averageTimeToClose: await this.calculateAverageTimeToClose(dateRange),
        topPerformingTenants,
      },
      trends,
    };
  }

  /**
   * Get tenant-specific analytics
   */
  async getTenantAnalytics(tenantId: number, dateRange?: AnalyticsDateRange): Promise<TenantAnalytics> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : {};

    // Get overview data
    const [
      totalCars,
      availableCars,
      soldCars,
      totalLeads,
      activeLeads,
    ] = await Promise.all([
      prisma.car.count({ where: { tenantId, status: { not: 'deleted' } } }),
      prisma.car.count({ where: { tenantId, status: 'available' } }),
      prisma.car.count({ where: { tenantId, status: 'sold' } }),
      prisma.lead.count({ where: { tenantId, ...dateFilter } }),
      prisma.lead.count({
        where: {
          tenantId,
          ...dateFilter,
          status: { in: ['new', 'hot', 'warm', 'cold'] },
        },
      }),
    ]);

    const leadConversionRate = totalLeads > 0 ? Math.round((soldCars / totalLeads) * 100) : 0;

    // Get lead sources distribution
    const leadSources = await prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId, ...dateFilter },
      _count: { source: true },
    });

    const leadSourcesDistribution = leadSources.map(source => ({
      source: source.source,
      count: source._count.source,
      percentage: totalLeads > 0 ? Math.round((source._count.source / totalLeads) * 100) : 0,
    }));

    // Get lead status distribution
    const leadStatuses = await prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId, ...dateFilter },
      _count: { status: true },
    });

    const leadStatusesDistribution = leadStatuses.map(status => ({
      status: status.status,
      count: status._count.status,
      percentage: totalLeads > 0 ? Math.round((status._count.status / totalLeads) * 100) : 0,
    }));

    // Get popular cars
    const popularCars = await this.getPopularCars(tenantId, 5);

    // Get recent activity
    const recentActivity = await this.getTenantRecentActivity(tenantId, 10);

    // Get performance metrics
    const performance = await this.getTenantPerformanceMetrics(tenantId, dateRange);

    return {
      overview: {
        totalCars,
        availableCars,
        soldCars,
        totalLeads,
        activeLeads,
        leadConversionRate,
        averageResponseTime: performance.averageResponseTime,
      },
      leadSources: leadSourcesDistribution,
      leadStatuses: leadStatusesDistribution,
      popularCars,
      recentActivity,
      performance,
    };
  }

  // ============================================
  // MONITORING
  // ============================================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [
      dbHealth,
      apiHealth,
      whatsappHealth,
      storageHealth,
      cacheHealth,
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkApiHealth(),
      this.checkWhatsAppHealth(),
      this.checkStorageHealth(),
      this.checkCacheHealth(),
    ]);

    const services = {
      database: dbHealth,
      api: apiHealth,
      whatsapp: whatsappHealth,
      storage: storageHealth,
      cache: cacheHealth,
    };

    // Determine overall status
    const downServices = Object.values(services).filter(s => s.status === 'down').length;
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'critical';
    if (downServices > 0) {
      status = 'critical';
    } else if (degradedServices > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Get performance metrics
    const performance = await this.getPerformanceMetrics();

    // Get resource usage
    const resources = await this.getResourceMetrics();

    return {
      status,
      timestamp: new Date(),
      services,
      performance,
      resources,
    };
  }

  /**
   * Get WhatsApp bot metrics
   */
  async getWhatsAppBotMetrics(): Promise<WhatsAppBotMetrics> {
    // Get message statistics
    const [
      totalMessages,
      inboundMessages,
      outboundMessages,
      errorCount,
    ] = await Promise.all([
      prisma.message.count(),
      prisma.message.count({ where: { sender: { in: ['customer', 'admin'] } } }),
      prisma.message.count({ where: { sender: 'bot' } }),
      prisma.message.count({ where: { message: { contains: 'error', mode: 'insensitive' } } }),
    ]);

    const successRate = totalMessages > 0 ? Math.round(((totalMessages - errorCount) / totalMessages) * 100) : 100;

    // Get active conversations
    const activeConversations = await prisma.conversationState.count({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats = await this.getWhatsAppDailyStats(sevenDaysAgo);

    // Get top commands (placeholder - would need to parse messages for commands)
    const topCommands = await this.getTopCommands();

    return {
      totalMessages,
      inboundMessages,
      outboundMessages,
      successRate,
      averageResponseTime: await this.calculateAverageResponseTime(),
      activeConversations,
      errorCount,
      topCommands,
      dailyStats,
    };
  }

  /**
   * Get storage usage metrics
   */
  async getStorageMetrics(): Promise<StorageMetrics> {
    // Get tenant usage
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        cars: {
          select: {
            photos: true,
          },
        },
      },
    });

    const tenantUsage = tenants.map(tenant => {
      const usage = tenant.cars.reduce((total, car) => {
        return total + (car.photos?.length || 0) * 1024 * 1024; // Estimate 1MB per photo
      }, 0);

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        usage,
        fileCount: tenant.cars.reduce((total, car) => total + (car.photos?.length || 0), 0),
      };
    });

    const totalUsage = tenantUsage.reduce((total, tenant) => total + tenant.usage, 0);

    // Get file type distribution (placeholder)
    const fileTypes = [
      { type: 'image/jpeg', count: totalUsage / (1024 * 1024), size: totalUsage },
    ];

    // Get growth trend (placeholder)
    const growthTrend = await this.getStorageGrowthTrend();

    return {
      totalUsage,
      tenantUsage,
      fileTypes,
      growthTrend,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Calculate tenant health score
   */
  private calculateTenantHealthScore(data: {
    totalCars: number;
    totalLeads: number;
    activeLeads: number;
    soldCars: number;
    lastActivity: Date | null;
    plan: string;
    status: string;
  }): number {
    let score = 0;

    // Activity score (40%)
    if (data.activeLeads > 0) score += 20;
    if (data.totalCars > 0) score += 10;
    if (data.soldCars > 0) score += 10;

    // Recent activity (20%)
    if (data.lastActivity) {
      const daysSinceActivity = Math.floor((Date.now() - data.lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity <= 7) score += 20;
      else if (daysSinceActivity <= 30) score += 15;
      else if (daysSinceActivity <= 90) score += 10;
      else if (daysSinceActivity <= 180) score += 5;
    }

    // Plan tier (20%)
    const planScores = { trial: 5, free: 10, starter: 15, growth: 18, pro: 20 };
    score += planScores[data.plan as keyof typeof planScores] || 0;

    // Status (20%)
    if (data.status === 'active') score += 20;
    else if (data.status === 'trial') score += 15;
    else score += 0;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get top performing tenants
   */
  private async getTopPerformingTenants(limit: number, dateRange?: AnalyticsDateRange): Promise<any[]> {
    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : {};

    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      include: {
        _count: {
          select: {
            cars: true,
            leads: true,
          },
        },
        cars: {
          where: { status: 'sold' },
          select: { id: true },
        },
      },
    });

    return tenants
      .map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        score: this.calculateTenantHealthScore({
          totalCars: tenant._count.cars,
          totalLeads: tenant._count.leads,
          activeLeads: tenant._count.leads, // Simplified
          soldCars: tenant.cars.length,
          lastActivity: null, // Would need to calculate
          plan: tenant.plan,
          status: tenant.status,
        }),
        leadsCount: tenant._count.leads,
        conversionRate: tenant._count.leads > 0
          ? Math.round((tenant.cars.length / tenant._count.leads) * 100)
          : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get analytics trends
   */
  private async getAnalyticsTrends(dateRange?: AnalyticsDateRange): Promise<any[]> {
    // Placeholder implementation
    const days = (dateRange?.endDate && dateRange?.startDate)
      ? Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trends.push({
        period: date.toISOString().split('T')[0],
        tenants: Math.floor(Math.random() * 5) + 1,
        leads: Math.floor(Math.random() * 20) + 5,
        sales: Math.floor(Math.random() * 3),
        revenue: (Math.floor(Math.random() * 50) + 10) * 1000000, // In IDR
      });
    }

    return trends;
  }

  /**
   * Calculate average time to close leads
   */
  private async calculateAverageTimeToClose(dateRange?: AnalyticsDateRange): Promise<number> {
    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : {};

    const closedLeads = await prisma.lead.findMany({
      where: {
        status: 'closed',
        closedAt: { not: null },
        ...dateFilter,
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    if (closedLeads.length === 0) return 0;

    const totalDays = closedLeads.reduce((total, lead) => {
      if (lead.closedAt) {
        return total + (lead.closedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      }
      return total;
    }, 0);

    return Math.round(totalDays / closedLeads.length);
  }

  /**
   * Get popular cars for a tenant
   */
  private async getPopularCars(tenantId: number, limit: number): Promise<any[]> {
    const cars = await prisma.car.groupBy({
      by: ['brand', 'model'],
      where: { tenantId },
      _count: { brand: true },
      _avg: { price: true },
      orderBy: { _count: { brand: 'desc' } },
      take: limit,
    });

    return cars.map(car => ({
      brand: car.brand,
      model: car.model,
      count: car._count.brand,
      avgPrice: car._avg.price?.toString() || '0',
    }));
  }

  /**
   * Get recent tenant activity
   */
  private async getTenantRecentActivity(tenantId: number, limit: number): Promise<any[]> {
    const recentLeads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        customerName: true,
        createdAt: true,
        status: true,
        car: {
          select: {
            publicName: true,
          },
        },
      },
    });

    const recentCars = await prisma.car.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2),
      select: {
        id: true,
        publicName: true,
        createdAt: true,
        status: true,
      },
    });

    const activities = [
      ...recentLeads.map(lead => ({
        type: 'lead' as const,
        description: `New lead from ${lead.customerName || 'Unknown'} for ${lead.car?.publicName || 'Unknown car'}`,
        timestamp: lead.createdAt,
      })),
      ...recentCars.map(car => ({
        type: 'car_added' as const,
        description: `Added new car: ${car.publicName}`,
        timestamp: car.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get tenant performance metrics
   */
  private async getTenantPerformanceMetrics(tenantId: number, dateRange?: AnalyticsDateRange): Promise<any> {
    const dateFilter = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : {};

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      leadsLast30Days,
      totalLeads,
      soldCarsCount,
      totalLeadsCount,
    ] = await Promise.all([
      prisma.lead.count({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.lead.count({ where: { tenantId, ...dateFilter } }),
      prisma.car.count({
        where: { tenantId, status: 'sold', ...(dateRange && { soldAt: dateFilter }) },
      }),
      prisma.lead.count({ where: { tenantId, ...dateFilter } }),
    ]);

    return {
      leadsPerDay: Math.round(leadsLast30Days / 30),
      responseTime: await this.calculateAverageResponseTime(tenantId),
      bookingRate: totalLeads > 0 ? Math.round((soldCarsCount / totalLeads) * 100) : 0,
      closingRate: totalLeadsCount > 0 ? Math.round((soldCarsCount / totalLeadsCount) * 100) : 0,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<any> {
    try {
      const result = await checkDatabaseHealth();
      return {
        status: result.connected ? 'healthy' : 'down',
        responseTime: result.responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check API health
   */
  private async checkApiHealth(): Promise<any> {
    try {
      const startTime = Date.now();
      // Simple database query to test API
      await prisma.tenant.count();
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check WhatsApp health
   */
  private async checkWhatsAppHealth(): Promise<any> {
    try {
      // Check if there are recent messages
      const recentMessages = await prisma.message.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const isHealthy = recentMessages &&
        (Date.now() - recentMessages.createdAt.getTime()) < 24 * 60 * 60 * 1000; // 24 hours

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check storage health
   */
  private async checkStorageHealth(): Promise<any> {
    try {
      // Simple check - can we access tenant data
      await prisma.tenant.findFirst();

      return {
        status: 'healthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<any> {
    // Placeholder for cache health check
    return {
      status: 'healthy',
      lastCheck: new Date(),
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<any> {
    // Placeholder implementation
    return {
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      errorRate: Math.floor(Math.random() * 5),
      requestRate: Math.floor(Math.random() * 100) + 50,
      uptime: 99.9,
    };
  }

  /**
   * Get resource metrics
   */
  private async getResourceMetrics(): Promise<any> {
    // Placeholder implementation
    return {
      cpuUsage: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 20,
      diskUsage: Math.floor(Math.random() * 60) + 30,
      networkIO: Math.floor(Math.random() * 1000) + 100,
    };
  }

  /**
   * Get WhatsApp daily stats
   */
  private async getWhatsAppDailyStats(since: Date): Promise<any[]> {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [messages, errors] = await Promise.all([
        prisma.message.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        prisma.message.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
            message: { contains: 'error', mode: 'insensitive' },
          },
        }),
      ]);

      stats.push({
        date: date.toISOString().split('T')[0],
        messages,
        errors,
        successRate: messages > 0 ? Math.round(((messages - errors) / messages) * 100) : 100,
      });
    }

    return stats;
  }

  /**
   * Get top commands
   */
  private async getTopCommands(): Promise<any[]> {
    // Placeholder implementation
    return [
      { command: '/upload', count: 45 },
      { command: '/list', count: 32 },
      { command: '/status', count: 28 },
      { command: '/delete', count: 15 },
    ];
  }

  /**
   * Calculate average response time
   */
  private async calculateAverageResponseTime(tenantId?: number): Promise<number> {
    // Placeholder implementation
    return Math.floor(Math.random() * 10) + 2; // 2-12 minutes
  }

  /**
   * Get storage growth trend
   */
  private async getStorageGrowthTrend(): Promise<any[]> {
    // Placeholder implementation
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 1000000) + 500000, // 500MB - 1.5GB
      });
    }

    return trends;
  }
}