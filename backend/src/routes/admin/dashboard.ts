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
      // Get WhatsApp status (priority - connection info)
      let whatsappStatus = 'disconnected';
      let whatsappPhone = 'Not configured';
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            whatsappBotEnabled: true,
            whatsappStatus: true,
            whatsappNumber: true
          }
        });
        whatsappStatus = tenant?.whatsappBotEnabled ?
          (tenant?.whatsappStatus || 'disconnected') : 'disabled';
        whatsappPhone = tenant?.whatsappNumber || 'Not configured';
      } catch (error) {
        console.warn('WhatsApp status check failed:', error);
      }

      // Get lead statistics with classification
      const totalLeads = await prisma.lead.count({
        where: { tenantId }
      });

      const hotLeads = await prisma.lead.count({
        where: {
          tenantId,
          status: 'hot'
        }
      });

      const warmLeads = await prisma.lead.count({
        where: {
          tenantId,
          status: 'warm'
        }
      });

      const newLeads = await prisma.lead.count({
        where: {
          tenantId,
          status: 'new'
        }
      });

      // Get monthly breakdown
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const leadsThisMonth = await prisma.lead.count({
        where: {
          tenantId,
          createdAt: {
            gte: firstDayOfMonth
          }
        }
      });

      const leadsLastMonth = await prisma.lead.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
            lt: firstDayOfMonth
          }
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          whatsapp: {
            status: whatsappStatus,
            phone: whatsappPhone,
            connected: whatsappStatus === 'connected'
          },
          leads: {
            total: totalLeads,
            thisMonth: leadsThisMonth,
            lastMonth: leadsLastMonth,
            growth: leadsLastMonth > 0 ?
              Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100) : 0
          },
          classification: {
            hot: hotLeads,
            warm: warmLeads,
            new: newLeads,
            percentages: totalLeads > 0 ? {
              hot: Math.round((hotLeads / totalLeads) * 100),
              warm: Math.round((warmLeads / totalLeads) * 100),
              new: Math.round((newLeads / totalLeads) * 100)
            } : { hot: 0, warm: 0, new: 0 }
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