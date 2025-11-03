/**
 * Security Logs Service
 *
 * Centralized service for logging security-related events.
 * Tracks user actions, system events, and security incidents.
 */

import { prisma } from '../db';
import type { SecurityLogSeverity, SecurityLogStatus } from '@prisma/client';

interface LogEntry {
  action: string;
  details: string;
  userId?: number;
  superAdminId?: number;
  userName: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  severity?: SecurityLogSeverity;
  status?: SecurityLogStatus;
  tenantId?: number;
  metadata?: any;
}

export class SecurityLogsService {
  private static instance: SecurityLogsService;

  public static getInstance(): SecurityLogsService {
    if (!SecurityLogsService.instance) {
      SecurityLogsService.instance = new SecurityLogsService();
    }
    return SecurityLogsService.instance;
  }

  /**
   * Log a security event
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          action: entry.action,
          details: entry.details,
          userId: entry.userId,
          superAdminId: entry.superAdminId,
          userName: entry.userName,
          userEmail: entry.userEmail,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          endpoint: entry.endpoint,
          method: entry.method,
          severity: entry.severity || 'MEDIUM',
          status: entry.status || 'SUCCESS',
          tenantId: entry.tenantId,
          metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null,
        },
      });

      // Also log to console for immediate visibility
      console.log(`[SECURITY_LOG] ${entry.severity || 'MEDIUM'} - ${entry.action}`, {
        userName: entry.userName,
        details: entry.details,
        ipAddress: entry.ipAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[SECURITY_LOG_ERROR] Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break the main application
    }
  }

  /**
   * Log user login success
   */
  async logLoginSuccess(
    userId: number,
    userName: string,
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    tenantId?: number
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_SUCCESS',
      details: `Successful login for ${userEmail}`,
      userId,
      userName,
      userEmail,
      ipAddress,
      userAgent,
      severity: 'LOW',
      status: 'SUCCESS',
      tenantId,
    });
  }

  /**
   * Log user login failure
   */
  async logLoginFailure(
    userName: string,
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      details: `Failed login attempt for ${userEmail}${reason ? ` - ${reason}` : ''}`,
      userName,
      userEmail,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      status: 'FAILED',
    });
  }

  /**
   * Log user creation
   */
  async logUserCreated(
    createdById: number,
    createdByName: string,
    createdByEmail: string,
    targetUserName: string,
    targetUserEmail: string,
    targetUserRole: string,
    ipAddress: string,
    tenantId?: number
  ): Promise<void> {
    await this.log({
      action: 'USER_CREATED',
      details: `Created new ${targetUserRole} user: ${targetUserEmail}`,
      userId: createdById,
      userName: createdByName,
      userEmail: createdByEmail,
      ipAddress,
      severity: 'MEDIUM',
      status: 'SUCCESS',
      tenantId,
      metadata: {
        targetUserName,
        targetUserEmail,
        targetUserRole,
      },
    });
  }

  /**
   * Log user deletion
   */
  async logUserDeleted(
    deletedById: number,
    deletedByName: string,
    deletedByEmail: string,
    targetUserName: string,
    targetUserEmail: string,
    isPermanent: boolean,
    ipAddress: string,
    tenantId?: number
  ): Promise<void> {
    await this.log({
      action: 'USER_DELETED',
      details: `${isPermanent ? 'Permanently deleted' : 'Deactivated'} user: ${targetUserEmail}`,
      userId: deletedById,
      userName: deletedByName,
      userEmail: deletedByEmail,
      ipAddress,
      severity: isPermanent ? 'HIGH' : 'MEDIUM',
      status: 'SUCCESS',
      tenantId,
      metadata: {
        targetUserName,
        targetUserEmail,
        isPermanent,
      },
    });
  }

  /**
   * Log session termination
   */
  async logSessionTerminated(
    terminatedById: number,
    terminatedByName: string,
    terminatedByEmail: string,
    targetUserName: string,
    targetUserEmail: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      action: 'SESSION_TERMINATED',
      details: `Terminated session for user: ${targetUserEmail}`,
      userId: terminatedById,
      userName: terminatedByName,
      userEmail: terminatedByEmail,
      ipAddress,
      severity: 'MEDIUM',
      status: 'SUCCESS',
      metadata: {
        targetUserName,
        targetUserEmail,
      },
    });
  }

  /**
   * Log super admin action
   */
  async logSuperAdminAction(
    superAdminId: number,
    superAdminName: string,
    superAdminEmail: string,
    action: string,
    details: string,
    ipAddress: string,
    userAgent?: string,
    severity?: SecurityLogSeverity,
    tenantId?: number
  ): Promise<void> {
    await this.log({
      action,
      details,
      superAdminId,
      userName: superAdminName,
      userEmail: superAdminEmail,
      ipAddress,
      userAgent,
      severity: severity || 'MEDIUM',
      status: 'SUCCESS',
      tenantId,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    action: string,
    details: string,
    ipAddress: string,
    userAgent?: string,
    severity?: SecurityLogSeverity
  ): Promise<void> {
    await this.log({
      action,
      details,
      userName: 'System',
      ipAddress,
      userAgent,
      severity: severity || 'HIGH',
      status: 'WARNING',
    });
  }

  /**
   * Get security logs with filtering and pagination
   */
  async getSecurityLogs(options: {
    page?: number;
    limit?: number;
    severity?: SecurityLogSeverity;
    action?: string;
    userId?: number;
    superAdminId?: number;
    tenantId?: number;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
  } = {}) {
    const {
      page = 1,
      limit = 50,
      severity,
      action,
      userId,
      superAdminId,
      tenantId,
      startDate,
      endDate,
      ipAddress,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (severity) where.severity = severity;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (superAdminId) where.superAdminId = superAdminId;
    if (tenantId) where.tenantId = tenantId;
    if (ipAddress) where.ipAddress = ipAddress;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.securityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeframe: '24h' | '7d' | '30d' = '24h') {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      totalLogs,
      criticalLogs,
      failedLogins,
      successfulLogins,
      userCreations,
      userDeletions,
      sessionTerminations,
    ] = await Promise.all([
      prisma.securityLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          severity: 'CRITICAL',
        },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          action: 'LOGIN_FAILED',
        },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          action: 'LOGIN_SUCCESS',
        },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          action: 'USER_CREATED',
        },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          action: 'USER_DELETED',
        },
      }),
      prisma.securityLog.count({
        where: {
          createdAt: { gte: startDate },
          action: 'SESSION_TERMINATED',
        },
      }),
    ]);

    return {
      timeframe,
      totalLogs,
      criticalLogs,
      failedLogins,
      successfulLogins,
      userCreations,
      userDeletions,
      sessionTerminations,
      successRate: successfulLogins + failedLogins > 0
        ? (successfulLogins / (successfulLogins + failedLogins)) * 100
        : 100,
    };
  }
}

// Export singleton instance
export const securityLogsService = SecurityLogsService.getInstance();