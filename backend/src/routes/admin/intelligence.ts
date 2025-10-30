/**
 * Admin Intelligence Routes
 *
 * Business intelligence and analytics for admin dashboard.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { authMiddleware, requireAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error-handler';
import { validate } from '../../middleware/validation';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse } from '../../types/context';

const adminIntelligence = new Hono();

// Apply tenant and auth middleware to all routes
adminIntelligence.use('*', tenantMiddleware);
adminIntelligence.use('*', authMiddleware);
adminIntelligence.use('*', requireAdmin);

/**
 * GET /api/admin/intelligence/overview
 * Get dashboard overview statistics
 */
adminIntelligence.get(
  '/overview',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);

    // Mock data - replace with actual service calls
    const overview = {
      totalLeads: 156,
      activeLeads: 42,
      conversionRate: 0.28,
      totalRevenue: 2450000,
      monthlyGrowth: 0.15,
      topPerformingCars: [
        { id: 1, name: 'Toyota Avanza', leads: 28, conversion: 0.35 },
        { id: 2, name: 'Honda Civic', leads: 22, conversion: 0.31 },
        { id: 3, name: 'Suzuki Swift', leads: 19, conversion: 0.26 }
      ],
      recentActivity: [
        { type: 'lead', message: 'New lead from WhatsApp', time: '2 minutes ago' },
        { type: 'sale', message: 'Car sold: Toyota Avanza', time: '1 hour ago' },
        { type: 'inquiry', message: 'Price inquiry for Honda Civic', time: '3 hours ago' }
      ]
    };

    const response: ApiResponse = {
      success: true,
      data: overview,
      message: 'Overview data retrieved successfully'
    };

    return c.json(response, HTTP_STATUS.OK);
  })
);

/**
 * GET /api/admin/intelligence/leads/analytics
 * Get leads analytics and trends
 */
adminIntelligence.get(
  '/leads/analytics',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    
    // Parse query parameters
    const period = c.req.query('period') || '30d'; // 7d, 30d, 90d
    
    // Mock data - replace with actual service calls
    const analytics = {
      period,
      totalLeads: 156,
      conversionRate: 0.28,
      averageResponseTime: 45, // minutes
      leadSources: [
        { source: 'WhatsApp', count: 89, percentage: 0.57 },
        { source: 'Website', count: 45, percentage: 0.29 },
        { source: 'Phone', count: 22, percentage: 0.14 }
      ],
      dailyTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        leads: Math.floor(Math.random() * 10) + 2,
        conversions: Math.floor(Math.random() * 3) + 1
      })),
      statusBreakdown: [
        { status: 'new', count: 42, percentage: 0.27 },
        { status: 'contacted', count: 38, percentage: 0.24 },
        { status: 'qualified', count: 31, percentage: 0.20 },
        { status: 'converted', count: 45, percentage: 0.29 }
      ]
    };

    const response: ApiResponse = {
      success: true,
      data: analytics,
      message: 'Leads analytics retrieved successfully'
    };

    return c.json(response, HTTP_STATUS.OK);
  })
);

/**
 * GET /api/admin/intelligence/sales/performance
 * Get sales performance metrics
 */
adminIntelligence.get(
  '/sales/performance',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    
    // Mock data - replace with actual service calls
    const performance = {
      totalRevenue: 2450000,
      carsSold: 45,
      averageSalePrice: 54444,
      topSalespeople: [
        { name: 'John Doe', sales: 12, revenue: 650000 },
        { name: 'Jane Smith', sales: 10, revenue: 520000 },
        { name: 'Mike Johnson', sales: 8, revenue: 410000 }
      ],
      monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2025, i, 1).toLocaleDateString('en', { month: 'short' }),
        revenue: Math.floor(Math.random() * 300000) + 150000,
        sales: Math.floor(Math.random() * 8) + 2
      })),
      conversionFunnel: {
        leads: 156,
        qualified: 89,
        proposals: 67,
        closed: 45
      }
    };

    const response: ApiResponse = {
      success: true,
      data: performance,
      message: 'Sales performance retrieved successfully'
    };

    return c.json(response, HTTP_STATUS.OK);
  })
);

export default adminIntelligence;