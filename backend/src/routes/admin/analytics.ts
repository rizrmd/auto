/**
 * Admin Analytics Routes
 *
 * Provides search demand analytics for tenant admins
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SearchAnalyticsService } from '../../services/search-analytics.service';
import { asyncHandler } from '../../middleware/error-handler';
import { authMiddleware, requireAdmin } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import type { ApiResponse } from '../../types/context';

const analytics = new Hono();

// Apply tenant and authentication middleware to all routes
analytics.use('*', tenantMiddleware);
analytics.use('*', authMiddleware);
analytics.use('*', requireAdmin);

// Validation schema for date range query
const dateRangeSchema = z.object({
  startDate: z.string().min(10).max(10), // YYYY-MM-DD format
  endDate: z.string().min(10).max(10),   // YYYY-MM-DD format
  source: z.enum(['all', 'website', 'whatsapp', 'compare']).optional().default('all'),
});

/**
 * GET /api/admin/analytics/demand-report
 * Get search demand analytics for date range
 */
analytics.get(
  '/demand-report',
  zValidator('query', dateRangeSchema),
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

    const { startDate, endDate, source } = c.req.valid('query');

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format. Use YYYY-MM-DD',
        },
      }, 400);
    }

    if (start > end) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_RANGE',
          message: 'Start date cannot be after end date',
        },
      }, 400);
    }

    // Limit range to 90 days for performance
    const maxDays = 90;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return c.json({
        success: false,
        error: {
          code: 'RANGE_TOO_LARGE',
          message: `Date range cannot exceed ${maxDays} days`,
        },
      }, 400);
    }

    try {
      const searchAnalytics = new SearchAnalyticsService();
      const report = await searchAnalytics.getDemandReport(tenantId, startDate, endDate, source);

      const response: ApiResponse = {
        success: true,
        data: report,
      };

      return c.json(response);
    } catch (error) {
      console.error('[ANALYTICS] Error generating demand report:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate analytics report',
        },
      };

      return c.json(errorResponse, 500);
    }
  })
);

/**
 * GET /api/admin/analytics/summary
 * Get quick analytics summary for last 30 days
 */
analytics.get(
  '/summary',
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
      const searchAnalytics = new SearchAnalyticsService();

      // Get last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const report = await searchAnalytics.getDemandReport(tenantId, startDateStr, endDateStr);

      // Simplified summary for dashboard
      const summary = {
        totalSearches: report.summary.totalSearches,
        topCar: report.topCars[0] || null,
        topKeyword: report.topKeywords[0] || null,
        uniqueCars: report.summary.uniqueCars,
        avgSearchesPerDay: Math.round(report.summary.totalSearches / report.summary.dateRange.days),
      };

      const response: ApiResponse = {
        success: true,
        data: summary,
      };

      return c.json(response);
    } catch (error) {
      console.error('[ANALYTICS] Error generating summary:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate analytics summary',
        },
      };

      return c.json(errorResponse, 500);
    }
  })
);

export default analytics;