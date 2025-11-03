/**
 * Super Admin Security Logs Routes
 *
 * Handles security logs viewing and management for super admins.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { securityLogsService } from '../../services/security-logs.service';
import { superAdminAuthMiddleware, requireSuperAdmin } from '../../middleware/super-admin-auth';
import { asyncHandler } from '../../middleware/error-handler';
import { HTTP_STATUS } from '../../config/constants';
import type { ApiResponse, SuperAdminContext } from '../../types/super-admin';

const securityLogs = new Hono();

// Apply super admin authentication
securityLogs.use('*', superAdminAuthMiddleware);
securityLogs.use('*', requireSuperAdmin);

// Query schema for filtering logs
const LogsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(50)),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  action: z.string().optional(),
  userId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  superAdminId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  tenantId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

/**
 * GET /api/super-admin/security-logs
 * Get security logs with filtering and pagination
 */
securityLogs.get(
  '/',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');
    const query = c.req.query();

    try {
      const validatedQuery = LogsQuerySchema.parse(query);

      const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined;
      const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined;

      const result = await securityLogsService.getSecurityLogs({
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        severity: validatedQuery.severity,
        action: validatedQuery.action,
        userId: validatedQuery.userId,
        superAdminId: validatedQuery.superAdminId,
        tenantId: validatedQuery.tenantId,
        startDate,
        endDate,
        ipAddress: validatedQuery.ipAddress,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          logs: result.logs.map(log => ({
            id: log.id,
            userId: log.userId,
            userName: log.userName,
            userEmail: log.userEmail,
            action: log.action,
            details: log.details,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            endpoint: log.endpoint,
            method: log.method,
            severity: log.severity,
            status: log.status,
            timestamp: log.createdAt.toISOString(),
            user: log.user ? {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
              role: log.user.role,
            } : null,
            superAdmin: log.superAdmin ? {
              id: log.superAdmin.id,
              name: log.superAdmin.name,
              email: log.superAdmin.email,
              role: log.superAdmin.role,
            } : null,
            tenant: log.tenant ? {
              id: log.tenant.id,
              name: log.tenant.name,
              slug: log.tenant.slug,
            } : null,
            metadata: log.metadata,
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[SECURITY_LOGS_API_ERROR]', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }
  })
);

/**
 * GET /api/super-admin/security-logs/stats
 * Get security statistics
 */
securityLogs.get(
  '/stats',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');
    const timeframe = c.req.query('timeframe') as '24h' | '7d' | '30d' || '24h';

    if (!['24h', '7d', '30d'].includes(timeframe)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_TIMEFRAME',
          message: 'Timeframe must be one of: 24h, 7d, 30d',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }

    const stats = await securityLogsService.getSecurityStats(timeframe);

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    return c.json(response);
  })
);

/**
 * GET /api/super-admin/security-logs/summary
 * Get security logs summary with recent critical events
 */
securityLogs.get(
  '/summary',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');

    // Get recent critical and high severity logs
    const recentCriticalLogs = await securityLogsService.getSecurityLogs({
      limit: 10,
      severity: 'CRITICAL',
    });

    const recentHighSeverityLogs = await securityLogsService.getSecurityLogs({
      limit: 10,
      severity: 'HIGH',
    });

    // Get recent failed logins
    const recentFailedLogins = await securityLogsService.getSecurityLogs({
      limit: 20,
      action: 'LOGIN_FAILED',
    });

    // Get statistics
    const stats24h = await securityLogsService.getSecurityStats('24h');
    const stats7d = await securityLogsService.getSecurityStats('7d');

    const response: ApiResponse = {
      success: true,
      data: {
        criticalAlerts: recentCriticalLogs.logs,
        highSeverityEvents: recentHighSeverityLogs.logs,
        recentFailedLogins: recentFailedLogins.logs,
        stats: {
          last24h: stats24h,
          last7d: stats7d,
        },
        summary: {
          totalCritical24h: stats24h.criticalLogs,
          totalFailedLogins24h: stats24h.failedLogins,
          needsAttention: stats24h.criticalLogs > 0 || stats24h.failedLogins > 5,
        },
      },
    };

    return c.json(response);
  })
);

/**
 * POST /api/super-admin/security-logs
 * Create a custom security log entry
 */
securityLogs.post(
  '/',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');
    const body = await c.req.json();

    const CreateLogSchema = z.object({
      action: z.string().min(1),
      details: z.string().min(1),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
      userName: z.string().optional(),
      userEmail: z.string().optional(),
      tenantId: z.number().optional(),
      metadata: z.any().optional(),
    });

    try {
      const validatedData = CreateLogSchema.parse(body);

      // Get request context
      const ipAddress = c.req.header('x-forwarded-for') ||
                      c.req.header('x-real-ip') ||
                      c.req.header('cf-connecting-ip') ||
                      '127.0.0.1';
      const userAgent = c.req.header('user-agent');
      const endpoint = c.req.path;
      const method = c.req.method;

      await securityLogsService.log({
        action: validatedData.action,
        details: validatedData.details,
        superAdminId: superAdmin.id,
        userName: validatedData.userName || superAdmin.name,
        userEmail: validatedData.userEmail || superAdmin.email,
        ipAddress,
        userAgent,
        endpoint,
        method,
        severity: validatedData.severity,
        status: 'SUCCESS',
        tenantId: validatedData.tenantId,
        metadata: validatedData.metadata,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Security log entry created successfully',
          logEntry: {
            action: validatedData.action,
            details: validatedData.details,
            severity: validatedData.severity,
            timestamp: new Date().toISOString(),
            createdBy: superAdmin.email,
          },
        },
      };

      return c.json(response, HTTP_STATUS.CREATED);
    } catch (error) {
      console.error('[SECURITY_LOGS_CREATE_ERROR]', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid log data provided',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }
  })
);

/**
 * GET /api/super-admin/security-logs/export
 * Export security logs as CSV
 */
securityLogs.get(
  '/export',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');
    const query = c.req.query();

    try {
      const validatedQuery = LogsQuerySchema.parse({
        ...query,
        limit: 10000, // Limit for export
      });

      const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined;
      const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined;

      const result = await securityLogsService.getSecurityLogs({
        page: 1,
        limit: validatedQuery.limit,
        severity: validatedQuery.severity,
        action: validatedQuery.action,
        userId: validatedQuery.userId,
        superAdminId: validatedQuery.superAdminId,
        tenantId: validatedQuery.tenantId,
        startDate,
        endDate,
        ipAddress: validatedQuery.ipAddress,
      });

      // Generate CSV
      const headers = [
        'Timestamp',
        'Severity',
        'Action',
        'Details',
        'User Name',
        'User Email',
        'IP Address',
        'User Agent',
        'Endpoint',
        'Method',
        'Status',
        'Tenant',
      ];

      const csvRows = result.logs.map(log => [
        log.createdAt.toISOString(),
        log.severity,
        log.action,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in CSV
        log.userName,
        log.userEmail || '',
        log.ipAddress,
        log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : '',
        log.endpoint || '',
        log.method || '',
        log.status,
        log.tenant?.name || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(',')),
      ].join('\n');

      // Set appropriate headers for CSV download
      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`);

      return c.body(csvContent);
    } catch (error) {
      console.error('[SECURITY_LOGS_EXPORT_ERROR]', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export security logs',
        },
      };
      return c.json(response, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  })
);

export default securityLogs;