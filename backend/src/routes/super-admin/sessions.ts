/**
 * Super Admin Session Management Routes
 *
 * Handles active session management and monitoring for super admins.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { superAdminAuthMiddleware, requireSuperAdmin } from '../../middleware/super-admin-auth';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse, SuperAdminContext } from '../../types/super-admin';

const sessions = new Hono();

// Apply super admin authentication
sessions.use('*', superAdminAuthMiddleware);
sessions.use('*', requireSuperAdmin);

// In-memory session storage for demonstration
// In production, this should use Redis or database
const activeSessions = new Map<string, {
  id: string;
  userId: number;
  userName: string;
  email: string;
  ipAddress: string;
  device: string;
  location?: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  userAgent: string;
}>();

/**
 * GET /api/super-admin/sessions
 * Get all active sessions across the system
 */
sessions.get(
  '/',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');

    // Get active admin users from database
    const activeUsers = await prisma.user.findMany({
      where: {
        status: 'active',
        role: {
          in: ['owner', 'admin', 'sales']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLoginAt: true,
        tenant: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { lastLoginAt: 'desc' },
    });

    // Transform users into session format
    const userSessions = activeUsers.map(user => ({
      id: `session_${user.id}_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      email: user.email,
      ipAddress: '192.168.1.100', // Mock IP - in production get from request logs
      device: 'Web Browser', // Mock device - in production parse user agent
      location: 'Jakarta, Indonesia', // Mock location - in production use IP geolocation
      loginTime: user.lastLoginAt || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      tenant: user.tenant?.name || 'Unknown',
    }));

    // Add some mock super admin sessions
    const mockSuperAdminSessions = [
      {
        id: 'sa_session_1',
        userId: 1,
        userName: 'Super Admin',
        email: 'admin@autoleads.com',
        ipAddress: '182.6.84.31',
        device: 'Chrome on Windows',
        location: 'Jakarta, Indonesia',
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        lastActivity: new Date().toISOString(),
        isActive: true,
        tenant: 'Super Admin',
      }
    ];

    const allSessions = [...mockSuperAdminSessions, ...userSessions];

    const response: ApiResponse = {
      success: true,
      data: {
        sessions: allSessions,
        total: allSessions.length,
        active: allSessions.filter(s => s.isActive).length,
      },
    };

    return c.json(response);
  })
);

/**
 * DELETE /api/super-admin/sessions/:id
 * Terminate a specific session
 */
sessions.delete(
  '/:id',
  asyncHandler(async (c: SuperAdminContext) => {
    const sessionId = c.req.param('id');
    const superAdmin = c.get('superAdmin');

    // Prevent self-session termination
    if (sessionId.includes('sa_session_1') && superAdmin.id === 1) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Cannot terminate your own session',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }

    // In a real implementation, you would:
    // 1. Invalidate the JWT token (add to blacklist)
    // 2. Remove session from Redis/database
    // 3. Notify the user if needed

    // For now, we'll simulate session termination
    console.log(`[SESSION_TERMINATION] Session ${sessionId} terminated by Super Admin ${superAdmin.email}`);

    // Mock session termination - in production, implement actual session invalidation
    const isTerminated = Math.random() > 0.1; // 90% success rate for demo

    if (!isTerminated) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TERMINATION_FAILED',
          message: 'Failed to terminate session. Session may have already expired.',
        },
      };
      return c.json(response, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Session terminated successfully',
        sessionId,
        terminatedAt: new Date().toISOString(),
        terminatedBy: superAdmin.email,
      },
    };

    return c.json(response);
  })
);

/**
 * POST /api/super-admin/sessions/:id/extend
 * Extend a session expiration time
 */
sessions.post(
  '/:id/extend',
  asyncHandler(async (c: SuperAdminContext) => {
    const sessionId = c.req.param('id');
    const superAdmin = c.get('superAdmin');

    // In a real implementation, you would:
    // 1. Update the session expiration in Redis/database
    // 2. Issue a new JWT token with extended expiration
    // 3. Update the session last activity time

    console.log(`[SESSION_EXTENSION] Session ${sessionId} extended by Super Admin ${superAdmin.email}`);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Session extended successfully',
        sessionId,
        extendedAt: new Date().toISOString(),
        extendedBy: superAdmin.email,
        newExpiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
      },
    };

    return c.json(response);
  })
);

/**
 * GET /api/super-admin/sessions/summary
 * Get session statistics and summary
 */
sessions.get(
  '/summary',
  asyncHandler(async (c: SuperAdminContext) => {
    // Get user statistics
    const totalUsers = await prisma.user.count({
      where: {
        role: {
          in: ['owner', 'admin', 'sales']
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        role: {
          in: ['owner', 'admin', 'sales']
        },
        status: 'active',
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Mock session statistics
    const summary = {
      totalSessions: totalUsers + 1, // +1 for super admin
      activeSessions: activeUsers + 1,
      sessionsLast24h: activeUsers + 1,
      sessionsLast7d: totalUsers,
      uniqueIPs: Math.floor(totalUsers * 0.8), // Mock calculation
      topDevices: [
        { device: 'Chrome on Windows', count: Math.floor(totalUsers * 0.4) },
        { device: 'Safari on Mac', count: Math.floor(totalUsers * 0.2) },
        { device: 'Chrome on Android', count: Math.floor(totalUsers * 0.25) },
        { device: 'Other', count: Math.floor(totalUsers * 0.15) },
      ],
      topLocations: [
        { location: 'Jakarta, Indonesia', count: Math.floor(totalUsers * 0.6) },
        { location: 'Surabaya, Indonesia', count: Math.floor(totalUsers * 0.2) },
        { location: 'Bandung, Indonesia', count: Math.floor(totalUsers * 0.15) },
        { location: 'Other', count: Math.floor(totalUsers * 0.05) },
      ]
    };

    const response: ApiResponse = {
      success: true,
      data: summary,
    };

    return c.json(response);
  })
);

export default sessions;