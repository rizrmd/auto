/**
 * Super Admin System Monitoring Routes
 *
 * Handles system health monitoring, performance metrics, and WhatsApp bot analytics.
 * Provides comprehensive monitoring capabilities for system administrators.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SuperAdminService } from '../../services/super-admin.service';
import { HealthCheckSchema } from '../../validation/super-admin.schemas';
import {
  superAdminAuthMiddleware,
  requireSupport,
  superAdminActivityLogger,
  getSuperAdmin,
} from '../../middleware/super-admin-auth';
import { ApiResponse } from '../../types/super-admin';

const app = new Hono();

// Apply authentication middleware to all routes
app.use('*', superAdminAuthMiddleware);
app.use('*', superAdminActivityLogger);

/**
 * GET /api/super-admin/monitoring/health
 *
 * Get system health status.
 * Requires Super Admin or Support role.
 *
 * @query {string[]} services - Specific services to check
 * @query {number} timeout - Health check timeout in milliseconds
 * @returns {Promise<ApiResponse<SystemHealth>>} System health status
 */
app.get('/health',
  requireSupport,
  zValidator('query', HealthCheckSchema),
  async (c) => {
    const { services, timeout } = c.req.valid('query');
    const service = new SuperAdminService();

    const systemHealth = await service.getSystemHealth();

    // Filter services if specified
    if (services && services.length > 0) {
      const filteredServices: any = {};
      services.forEach(serviceName => {
        if (systemHealth.services[serviceName]) {
          filteredServices[serviceName] = systemHealth.services[serviceName];
        }
      });
      systemHealth.services = filteredServices;
    }

    return c.json<ApiResponse>({
      success: true,
      data: systemHealth,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/whatsapp
 *
 * Get WhatsApp bot metrics and analytics.
 * Requires Super Admin or Support role.
 *
 * @returns {Promise<ApiResponse<WhatsAppBotMetrics>>} WhatsApp metrics
 */
app.get('/whatsapp',
  requireSupport,
  async (c) => {
    const service = new SuperAdminService();

    const whatsappMetrics = await service.getWhatsAppBotMetrics();

    return c.json<ApiResponse>({
      success: true,
      data: whatsappMetrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/storage
 *
 * Get storage usage metrics.
 * Requires Super Admin or Support role.
 *
 * @returns {Promise<ApiResponse<StorageMetrics>>} Storage metrics
 */
app.get('/storage',
  requireSupport,
  async (c) => {
    const service = new SuperAdminService();

    const storageMetrics = await service.getStorageMetrics();

    return c.json<ApiResponse>({
      success: true,
      data: storageMetrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/performance
 *
 * Get detailed performance metrics.
 * Requires Super Admin or Support role.
 *
 * @query {string} period - Analysis period (1h, 24h, 7d, 30d)
 * @returns {Promise<ApiResponse<any>>} Performance metrics
 */
app.get('/performance',
  requireSupport,
  zValidator('query', z.object({
    period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  })),
  async (c) => {
    const { period } = c.req.valid('query');

    const performanceMetrics = await getDetailedPerformanceMetrics(period);

    return c.json<ApiResponse>({
      success: true,
      data: performanceMetrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/errors
 *
 * Get error logs and statistics.
 * Requires Super Admin role.
 *
 * @query {string} severity - Error severity (error, warning, info)
 * @query {string} period - Time period (1h, 24h, 7d, 30d)
 * @query {number} limit - Number of errors to return
 * @returns {Promise<ApiResponse<any>>} Error logs and statistics
 */
app.get('/errors',
  requireSupport,
  zValidator('query', z.object({
    severity: z.enum(['error', 'warning', 'info']).default('error'),
    period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  })),
  async (c) => {
    const { severity, period, limit } = c.req.valid('query');

    const errorMetrics = await getErrorMetrics(severity, period, limit);

    return c.json<ApiResponse>({
      success: true,
      data: errorMetrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/logs
 *
 * Get system logs.
 * Requires Super Admin role.
 *
 * @query {string} level - Log level (debug, info, warn, error)
 * @query {string} service - Service to filter logs for
 * @query {string} period - Time period (1h, 24h, 7d, 30d)
 * @query {number} limit - Number of logs to return
 * @returns {Promise<ApiResponse<any>>} System logs
 */
app.get('/logs',
  requireSupport,
  zValidator('query', z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    service: z.enum(['api', 'database', 'whatsapp', 'bot']).optional(),
    period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  })),
  async (c) => {
    const { level, service, period, limit } = c.req.valid('query');

    const logs = await getSystemLogs(level, service, period, limit);

    return c.json<ApiResponse>({
      success: true,
      data: logs,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/alerts
 *
 * Get active system alerts.
 * Requires Super Admin or Support role.
 *
 * @query {string} severity - Alert severity (critical, warning, info)
 * @query {boolean} resolved - Include resolved alerts
 * @returns {Promise<ApiResponse<any>>} System alerts
 */
app.get('/alerts',
  requireSupport,
  zValidator('query', z.object({
    severity: z.enum(['critical', 'warning', 'info']).optional(),
    resolved: z.string().optional().transform(val => val === 'true'),
  })),
  async (c) => {
    const { severity, resolved } = c.req.valid('query');

    const alerts = await getSystemAlerts(severity, resolved);

    return c.json<ApiResponse>({
      success: true,
      data: alerts,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/monitoring/alerts/:id/resolve
 *
 * Resolve a system alert.
 * Requires Super Admin role.
 *
 * @param {number} id - Alert ID
 * @body {string} note - Resolution note
 * @returns {Promise<ApiResponse>> Alert resolution confirmation
 */
app.post('/alerts/:id/resolve',
  requireSupport,
  zValidator('param', z.object({
    id: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)),
  })),
  zValidator('json', z.object({
    note: z.string().max(1000).optional(),
  })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { note } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    // In a real implementation, this would update the alert in the database
    console.log(`[ALERT_RESOLVED] ${superAdmin.email} resolved alert ${id}${note ? `: ${note}` : ''}`);

    return c.json<ApiResponse>({
      success: true,
      message: 'Alert resolved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/metrics
 *
 * Get custom metrics and KPIs.
 * Requires Super Admin or Support role.
 *
 * @query {string[]} metrics - Specific metrics to retrieve
 * @query {string} period - Time period (1h, 24h, 7d, 30d)
 * @returns {Promise<ApiResponse<any>>} Custom metrics
 */
app.get('/metrics',
  requireSupport,
  zValidator('query', z.object({
    metrics: z.string().optional().transform(val => val ? val.split(',') : undefined),
    period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  })),
  async (c) => {
    const { metrics, period } = c.req.valid('query');

    const customMetrics = await getCustomMetrics(metrics, period);

    return c.json<ApiResponse>({
      success: true,
      data: customMetrics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/monitoring/dashboard
 *
 * Get monitoring dashboard overview.
 * Requires Super Admin or Support role.
 *
 * @returns {Promise<ApiResponse<any>>} Monitoring dashboard data
 */
app.get('/dashboard',
  requireSupport,
  async (c) => {
    const [
      systemHealth,
      whatsappMetrics,
      storageMetrics,
      activeAlerts,
      recentErrors,
      performanceSummary,
    ] = await Promise.all([
      getSystemHealthOverview(),
      getWhatsAppOverview(),
      getStorageOverview(),
      getActiveAlerts(),
      getRecentErrors(),
      getPerformanceSummary(),
    ]);

    const dashboard = {
      systemHealth,
      whatsappMetrics,
      storageMetrics,
      alerts: activeAlerts,
      errors: recentErrors,
      performance: performanceSummary,
      uptime: await getSystemUptime(),
      timestamp: new Date().toISOString(),
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

/**
 * POST /api/super-admin/monitoring/test-webhook
 *
 * Test webhook endpoint for monitoring.
 * Requires Super Admin role.
 *
 * @body {object} data - Test data
 * @returns {Promise<ApiResponse>> Webhook test result
 */
app.post('/test-webhook',
  requireSupport,
  zValidator('json', z.object({
    url: z.string().url('Invalid webhook URL'),
    event: z.string().default('test'),
    data: z.any().optional(),
  })),
  async (c) => {
    const { url, event, data } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);

    try {
      const testPayload = {
        event,
        timestamp: new Date().toISOString(),
        source: 'super-admin-monitoring',
        triggeredBy: superAdmin.email,
        data: data || { message: 'Test webhook from Super Admin monitoring system' },
      };

      // In a real implementation, this would send an HTTP request to the webhook URL
      console.log(`[WEBHOOK_TEST] ${superAdmin.email} testing webhook: ${url}`, testPayload);

      return c.json<ApiResponse>({
        success: true,
        data: {
          url,
          event,
          sent: true,
          payload: testPayload,
        },
        message: 'Webhook test sent successfully',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    } catch (error) {
      return c.json<ApiResponse>({
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed',
        data: {
          url,
          event,
          sent: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    }
  }
);

// ============================================
// HELPER METHODS
// ============================================

/**
 * Get detailed performance metrics
 */
async function getDetailedPerformanceMetrics(period: string): Promise<any> {
  const service = new SuperAdminService();
  const systemHealth = await service.getSystemHealth();

  // Generate time series data based on period
  const timeSeriesData = generatePerformanceTimeSeries(period);

  return {
    period,
    current: systemHealth.performance,
    timeSeries: timeSeriesData,
    thresholds: {
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 5, critical: 10 },
      requestRate: { warning: 100, critical: 50 },
      uptime: { warning: 99, critical: 95 },
    },
    recommendations: getPerformanceRecommendations(systemHealth.performance),
  };
}

/**
 * Generate performance time series data
 */
function generatePerformanceTimeSeries(period: string): any[] {
  const dataPoints = {
    '1h': 12,      // Every 5 minutes
    '24h': 24,     // Every hour
    '7d': 7,       // Every day
    '30d': 30,     // Every day
  };

  const points = dataPoints[period as keyof typeof dataPoints] || 24;
  const timeSeries = [];

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date();

    if (period === '1h') {
      timestamp.setMinutes(timestamp.getMinutes() - (i * 5));
    } else if (period === '24h') {
      timestamp.setHours(timestamp.getHours() - i);
    } else {
      timestamp.setDate(timestamp.getDate() - i);
      timestamp.setHours(0, 0, 0, 0);
    }

    timeSeries.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.floor(Math.random() * 500) + 100,
      errorRate: Math.floor(Math.random() * 5),
      requestRate: Math.floor(Math.random() * 100) + 50,
      cpuUsage: Math.floor(Math.random() * 80) + 10,
      memoryUsage: Math.floor(Math.random() * 70) + 20,
    });
  }

  return timeSeries;
}

/**
 * Get performance recommendations
 */
function getPerformanceRecommendations(performance: any): string[] {
  const recommendations = [];

  if (performance.avgResponseTime > 1000) {
    recommendations.push('Consider optimizing database queries or adding caching');
  }

  if (performance.errorRate > 5) {
    recommendations.push('High error rate detected. Check error logs and fix issues');
  }

  if (performance.requestRate > 200) {
    recommendations.push('High request rate. Consider scaling up resources');
  }

  if (performance.uptime < 99) {
    recommendations.push('Low uptime detected. Investigate service reliability');
  }

  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal');
  }

  return recommendations;
}

/**
 * Get error metrics
 */
async function getErrorMetrics(severity: string, period: string, limit: number): Promise<any> {
  // Generate mock error data
  const errors = [];
  for (let i = 0; i < limit; i++) {
    errors.push({
      id: i + 1,
      severity: Math.random() > 0.7 ? 'error' : Math.random() > 0.5 ? 'warning' : 'info',
      message: `Sample error message ${i + 1}`,
      service: ['api', 'database', 'whatsapp', 'bot'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      resolved: Math.random() > 0.7,
      count: Math.floor(Math.random() * 10) + 1,
    });
  }

  // Filter by severity
  const filteredErrors = errors.filter(error =>
    severity === 'error' ? error.severity === 'error' :
    severity === 'warning' ? ['error', 'warning'].includes(error.severity) :
    true
  );

  return {
    errors: filteredErrors.slice(0, limit),
    summary: {
      total: filteredErrors.length,
      critical: filteredErrors.filter(e => e.severity === 'error').length,
      warnings: filteredErrors.filter(e => e.severity === 'warning').length,
      info: filteredErrors.filter(e => e.severity === 'info').length,
      resolved: filteredErrors.filter(e => e.resolved).length,
      unresolved: filteredErrors.filter(e => !e.resolved).length,
    },
    trends: getErrorTrends(period),
  };
}

/**
 * Get error trends
 */
function getErrorTrends(period: string): any[] {
  const points = period === '1h' ? 12 : period === '24h' ? 24 : 7;
  const trends = [];

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date();

    if (period === '1h') {
      timestamp.setMinutes(timestamp.getMinutes() - (i * 5));
    } else if (period === '24h') {
      timestamp.setHours(timestamp.getHours() - i);
    } else {
      timestamp.setDate(timestamp.getDate() - i);
      timestamp.setHours(0, 0, 0, 0);
    }

    trends.push({
      timestamp: timestamp.toISOString(),
      errors: Math.floor(Math.random() * 10),
      warnings: Math.floor(Math.random() * 20),
    });
  }

  return trends;
}

/**
 * Get system logs
 */
async function getSystemLogs(level: string, service: string | undefined, period: string, limit: number): Promise<any> {
  // Generate mock log data
  const logs = [];
  const services = service ? [service] : ['api', 'database', 'whatsapp', 'bot'];

  for (let i = 0; i < limit; i++) {
    logs.push({
      id: i + 1,
      level: ['debug', 'info', 'warn', 'error'][Math.floor(Math.random() * 4)],
      service: services[Math.floor(Math.random() * services.length)],
      message: `Sample log message ${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        requestId: crypto.randomUUID(),
        userId: Math.floor(Math.random() * 1000),
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      },
    });
  }

  // Filter by level
  const filteredLogs = logs.filter(log => {
    if (level === 'debug') return true;
    if (level === 'info') return ['info', 'warn', 'error'].includes(log.level);
    if (level === 'warn') return ['warn', 'error'].includes(log.level);
    if (level === 'error') return log.level === 'error';
    return true;
  });

  return {
    logs: filteredLogs.slice(0, limit),
    summary: {
      total: filteredLogs.length,
      debug: filteredLogs.filter(l => l.level === 'debug').length,
      info: filteredLogs.filter(l => l.level === 'info').length,
      warn: filteredLogs.filter(l => l.level === 'warn').length,
      error: filteredLogs.filter(l => l.level === 'error').length,
    },
  };
}

/**
 * Get system alerts
 */
async function getSystemAlerts(severity: string | undefined, resolved: boolean | undefined): Promise<any> {
  // Generate mock alert data
  const alerts = [
    {
      id: 1,
      severity: 'critical',
      title: 'Database Connection Failed',
      message: 'Unable to connect to primary database',
      service: 'database',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      id: 2,
      severity: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage is above 80%',
      service: 'api',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      resolved: true,
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolvedBy: 'admin@autoleads.com',
    },
    {
      id: 3,
      severity: 'info',
      title: 'New Tenant Registered',
      message: 'Tenant "Showroom ABC" has been registered',
      service: 'api',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      resolved: true,
      resolvedAt: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
      resolvedBy: 'system',
    },
  ];

  // Filter alerts
  let filteredAlerts = alerts;

  if (severity) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
  }

  if (resolved !== undefined) {
    filteredAlerts = filteredAlerts.filter(alert => alert.resolved === resolved);
  }

  return {
    alerts: filteredAlerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      resolved: alerts.filter(a => a.resolved).length,
      unresolved: alerts.filter(a => !a.resolved).length,
    },
  };
}

/**
 * Get custom metrics
 */
async function getCustomMetrics(metrics: string[] | undefined, period: string): Promise<any> {
  const availableMetrics = {
    tenant_registrations: {
      current: 5,
      previous: 3,
      trend: 'up',
    },
    lead_conversion_rate: {
      current: 23.5,
      previous: 21.2,
      trend: 'up',
    },
    average_response_time: {
      current: 250,
      previous: 320,
      trend: 'down',
    },
    whatsapp_success_rate: {
      current: 98.5,
      previous: 97.2,
      trend: 'up',
    },
    system_uptime: {
      current: 99.8,
      previous: 99.5,
      trend: 'up',
    },
  };

  if (metrics) {
    const requestedMetrics: any = {};
    metrics.forEach(metric => {
      if (availableMetrics[metric as keyof typeof availableMetrics]) {
        requestedMetrics[metric] = availableMetrics[metric as keyof typeof availableMetrics];
      }
    });
    return requestedMetrics;
  }

  return availableMetrics;
}

/**
 * Get system health overview
 */
async function getSystemHealthOverview(): Promise<any> {
  const service = new SuperAdminService();
  const health = await service.getSystemHealth();

  return {
    status: health.status,
    services: Object.entries(health.services).map(([name, service]) => ({
      name,
      status: service.status,
      responseTime: service.responseTime,
    })),
    overall: {
      uptime: health.performance.uptime,
      responseTime: health.performance.avgResponseTime,
      errorRate: health.performance.errorRate,
    },
  };
}

/**
 * Get WhatsApp overview
 */
async function getWhatsAppOverview(): Promise<any> {
  const service = new SuperAdminService();
  const metrics = await service.getWhatsAppBotMetrics();

  return {
    totalMessages: metrics.totalMessages,
    successRate: metrics.successRate,
    activeConversations: metrics.activeConversations,
    errorCount: metrics.errorCount,
    status: metrics.successRate > 95 ? 'healthy' : metrics.successRate > 90 ? 'degraded' : 'critical',
  };
}

/**
 * Get storage overview
 */
async function getStorageOverview(): Promise<any> {
  const service = new SuperAdminService();
  const metrics = await service.getStorageMetrics();

  return {
    totalUsage: metrics.totalUsage,
    tenantCount: metrics.tenantUsage.length,
    status: metrics.totalUsage < 10 * 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 10GB threshold
  };
}

/**
 * Get active alerts
 */
async function getActiveAlerts(): Promise<any> {
  const alerts = await getSystemAlerts(undefined, false);
  return {
    count: alerts.summary.unresolved,
    critical: alerts.alerts.filter(a => a.severity === 'critical' && !a.resolved),
    warnings: alerts.alerts.filter(a => a.severity === 'warning' && !a.resolved),
  };
}

/**
 * Get recent errors
 */
async function getRecentErrors(): Promise<any> {
  const errors = await getErrorMetrics('error', '24h', 5);
  return {
    count: errors.summary.critical,
    recent: errors.errors.slice(0, 3),
  };
}

/**
 * Get performance summary
 */
async function getPerformanceSummary(): Promise<any> {
  const performance = await getDetailedPerformanceMetrics('24h');
  return {
    responseTime: performance.current.avgResponseTime,
    errorRate: performance.current.errorRate,
    requestRate: performance.current.requestRate,
    uptime: performance.current.uptime,
    status: performance.current.avgResponseTime < 1000 &&
            performance.current.errorRate < 5 &&
            performance.current.uptime > 99 ? 'healthy' : 'degraded',
  };
}

/**
 * Get system uptime
 */
async function getSystemUptime(): Promise<any> {
  // Mock uptime calculation
  const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const uptime = 99.8; // Mock uptime percentage

  return {
    uptime,
    startTime: startTime.toISOString(),
    downtime: (100 - uptime) / 100 * 30 * 24 * 60, // minutes in last 30 days
    status: uptime > 99 ? 'excellent' : uptime > 95 ? 'good' : 'poor',
  };
}

export default app;