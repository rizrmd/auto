/**
 * Admin Leads Routes
 *
 * Lead management and tracking.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { LeadService } from '../../services/lead.service';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { authMiddleware, requireSales } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error-handler';
import { validate, getValidatedData } from '../../middleware/validation';
import { LeadUpdateSchema, LeadAssignSchema, LeadStatusSchema } from '../../validation/schemas';
import { PAGINATION, HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse, UpdateLeadRequest } from '../../types/context';

const adminLeads = new Hono();

// Apply tenant and auth middleware to all routes
adminLeads.use('*', tenantMiddleware);
adminLeads.use('*', authMiddleware);
adminLeads.use('*', requireSales);

/**
 * GET /api/admin/leads
 * List all leads with filters
 */
adminLeads.get(
  '/',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();

    // Parse query parameters
    const page = parseInt(c.req.query('page') || String(PAGINATION.DEFAULT_PAGE));
    const limit = Math.min(
      parseInt(c.req.query('limit') || String(PAGINATION.DEFAULT_LIMIT)),
      PAGINATION.MAX_LIMIT
    );

    const filters = {
      page,
      limit,
      offset: (page - 1) * limit,
      status: c.req.query('status'),
      source: c.req.query('source'),
      carId: c.req.query('carId') ? parseInt(c.req.query('carId')!) : undefined,
      assignedToUserId: c.req.query('assignedTo') ? parseInt(c.req.query('assignedTo')!) : undefined,
      search: c.req.query('search'),
      startDate: c.req.query('startDate') ? new Date(c.req.query('startDate')!) : undefined,
      endDate: c.req.query('endDate') ? new Date(c.req.query('endDate')!) : undefined,
    };

    // Get leads
    const result = await leadService.list(tenant.id, filters);

    // Format response
    const formattedLeads = result.leads.map((lead: any) => ({
      id: lead.id,
      customerPhone: lead.customerPhone,
      customerName: lead.customerName,
      car: lead.car
        ? {
            id: lead.car.id,
            displayCode: lead.car.displayCode,
            publicName: lead.car.publicName,
            slug: lead.car.slug,
            brand: lead.car.brand,
            model: lead.car.model,
            year: lead.car.year,
          }
        : null,
      status: lead.status,
      source: lead.source,
      assignedTo: lead.assignedTo
        ? {
            id: lead.assignedTo.id,
            name: lead.assignedTo.name,
            email: lead.assignedTo.email,
            role: lead.assignedTo.role,
          }
        : null,
      notes: lead.notes,
      tags: lead.tags,
      messageCount: lead._count?.messages || 0,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      closedAt: lead.closedAt,
    }));

    const response: ApiResponse = {
      success: true,
      data: formattedLeads,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };

    return c.json(response);
  })
);

/**
 * GET /api/admin/leads/:id
 * Get lead details with message history
 */
adminLeads.get(
  '/:id',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();
    const leadId = parseInt(c.req.param('id'));

    const lead = await leadService.findById(tenant.id, leadId);

    if (!lead) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: MESSAGES.LEAD_NOT_FOUND,
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Format response
    const formattedLead = {
      id: lead.id,
      customerPhone: lead.customerPhone,
      customerName: lead.customerName,
      car: (lead as any).car
        ? {
            id: (lead as any).car.id,
            displayCode: (lead as any).car.displayCode,
            publicName: (lead as any).car.publicName,
            slug: (lead as any).car.slug,
            brand: (lead as any).car.brand,
            model: (lead as any).car.model,
            year: (lead as any).car.year,
            price: (lead as any).car.price.toString(),
          }
        : null,
      status: lead.status,
      source: lead.source,
      assignedTo: (lead as any).assignedTo
        ? {
            id: (lead as any).assignedTo.id,
            name: (lead as any).assignedTo.name,
            email: (lead as any).assignedTo.email,
            role: (lead as any).assignedTo.role,
          }
        : null,
      notes: lead.notes,
      tags: lead.tags,
      messages: (lead as any).messages || [],
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      closedAt: lead.closedAt,
    };

    const response: ApiResponse = {
      success: true,
      data: formattedLead,
    };

    return c.json(response);
  })
);

/**
 * PUT /api/admin/leads/:id
 * Update lead
 */
adminLeads.put(
  '/:id',
  validate(LeadUpdateSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();
    const leadId = parseInt(c.req.param('id'));

    const body = getValidatedData<z.infer<typeof LeadUpdateSchema>>(c);

    // Update lead
    const lead = await leadService.update(tenant.id, leadId, body);

    const response: ApiResponse = {
      success: true,
      data: {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt,
      },
    };

    return c.json(response);
  })
);

/**
 * PUT /api/admin/leads/:id/assign
 * Assign lead to user
 */
adminLeads.put(
  '/:id/assign',
  validate(LeadAssignSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();
    const leadId = parseInt(c.req.param('id'));

    const body = getValidatedData<z.infer<typeof LeadAssignSchema>>(c);
    const userId = body.userId;

    // Assign lead
    const lead = await leadService.assign(tenant.id, leadId, userId);

    const response: ApiResponse = {
      success: true,
      data: {
        id: lead.id,
        assignedTo: (lead as any).assignedTo
          ? {
              id: (lead as any).assignedTo.id,
              name: (lead as any).assignedTo.name,
            }
          : null,
      },
    };

    return c.json(response);
  })
);

/**
 * PUT /api/admin/leads/:id/status
 * Update lead status
 */
adminLeads.put(
  '/:id/status',
  validate(LeadStatusSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();
    const leadId = parseInt(c.req.param('id'));

    const body = getValidatedData<z.infer<typeof LeadStatusSchema>>(c);
    const status = body.status;

    // Update status
    const lead = await leadService.updateStatus(tenant.id, leadId, status);

    const response: ApiResponse = {
      success: true,
      data: {
        id: lead.id,
        status: lead.status,
        closedAt: lead.closedAt,
      },
    };

    return c.json(response);
  })
);

/**
 * GET /api/admin/leads/stats
 * Get lead statistics
 */
adminLeads.get(
  '/stats',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();

    const stats = await leadService.getStats(tenant.id);

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    return c.json(response);
  })
);

export default adminLeads;
