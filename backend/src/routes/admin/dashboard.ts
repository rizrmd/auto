/**
 * Admin Dashboard Routes
 * Provides dashboard data and statistics
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { authMiddleware, requireAdmin } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import type { ApiResponse } from '../../types/context';

const dashboard = new Hono();

// Apply tenant and authentication middleware to all routes
dashboard.use('*', tenantMiddleware);
dashboard.use('*', authMiddleware);
dashboard.use('*', requireAdmin);

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics and overview data
 */
dashboard.get(
  '/',
  asyncHandler(async (c) => {
    const tenantId = c.get('tenant')?.id;

    if (!tenantId) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      }, 400);
    }

    try {
      // Get user statistics
      const totalUsers = await prisma.user.count({
        where: { tenantId }
      });

      const activeUsers = await prisma.user.count({
        where: {
          tenantId,
          status: 'active'
        }
      });

      // Get lead statistics
      const totalLeads = await prisma.lead.count({
        where: { tenantId }
      });

      const newLeadsThisMonth = await prisma.lead.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      // Get car/catalog statistics
      const totalCars = await prisma.car.count({
        where: { tenantId }
      });

      const activeCars = await prisma.car.count({
        where: {
          tenantId,
          status: 'available'
        }
      });

      // Get WhatsApp status (simplified version)
      let whatsappStatus = 'disconnected';
      try {
        // Simple check - in real implementation this could check actual WhatsApp service status
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { whatsappBotEnabled: true, whatsappStatus: true }
        });
        whatsappStatus = tenant?.whatsappBotEnabled ?
          (tenant?.whatsappStatus || 'connected') : 'disabled';
      } catch (error) {
        console.warn('WhatsApp status check failed:', error);
        whatsappStatus = 'unknown';
      }

      const response: ApiResponse = {
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
          },
          leads: {
            total: totalLeads,
            thisMonth: newLeadsThisMonth,
          },
          cars: {
            total: totalCars,
            active: activeCars,
            sold: totalCars - activeCars,
          },
          whatsapp: {
            status: whatsappStatus,
          },
          overview: {
            totalUsers,
            activeUsers,
            totalLeads,
            newLeadsThisMonth,
            totalCars,
            activeCars,
            whatsappStatus,
          }
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[DASHBOARD] Error fetching dashboard data:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        },
      };

      return c.json(errorResponse, 500);
    }
  })
);

export default dashboard;