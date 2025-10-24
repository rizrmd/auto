/**
 * Lead Service
 *
 * Handles lead management with tenant scoping.
 */

import { prisma } from '../db';
import type { Lead } from '../../../generated/prisma';
import type { LeadFilterParams, CreateLeadRequest, UpdateLeadRequest } from '../types/context';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { MESSAGES, PHONE_REGEX } from '../config/constants';

/**
 * Lead Service Class
 */
export class LeadService {
  /**
   * Create a new lead
   */
  async create(tenantId: number, data: CreateLeadRequest): Promise<Lead> {
    // Validate phone number
    this.validatePhoneNumber(data.customerPhone);

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(data.customerPhone);

    // Check if lead already exists for this customer and car
    if (data.carId) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          tenantId,
          customerPhone: normalizedPhone,
          carId: data.carId,
          status: {
            notIn: ['closed', 'lost'],
          },
        },
      });

      if (existingLead) {
        // Return existing lead instead of creating duplicate
        return existingLead;
      }
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        customerPhone: normalizedPhone,
        customerName: data.customerName,
        carId: data.carId,
        status: data.status || 'new',
        source: data.source || 'wa',
        notes: data.notes,
        tags: data.tags || [],
      },
      include: {
        car: true,
        assignedTo: true,
      },
    });

    return lead;
  }

  /**
   * Update a lead
   */
  async update(
    tenantId: number,
    leadId: number,
    data: UpdateLeadRequest
  ): Promise<Lead> {
    // Get existing lead
    const existingLead = await this.findById(tenantId, leadId);

    if (!existingLead) {
      throw new NotFoundError('Lead');
    }

    // Validate phone number if provided
    if (data.customerPhone) {
      this.validatePhoneNumber(data.customerPhone);
      data.customerPhone = this.normalizePhoneNumber(data.customerPhone);
    }

    // Set closedAt timestamp if status changed to closed or lost
    const updateData: any = { ...data };
    if (
      (data.status === 'closed' || data.status === 'lost') &&
      existingLead.status !== 'closed' &&
      existingLead.status !== 'lost'
    ) {
      updateData.closedAt = new Date();
    }

    // Update lead
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        car: true,
        assignedTo: true,
      },
    });

    return lead;
  }

  /**
   * Delete a lead
   */
  async delete(tenantId: number, leadId: number): Promise<void> {
    const lead = await this.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });
  }

  /**
   * Find lead by ID
   */
  async findById(tenantId: number, leadId: number): Promise<Lead | null> {
    return await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
      },
      include: {
        car: true,
        assignedTo: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Find or create lead by customer phone
   */
  async findOrCreateByPhone(
    tenantId: number,
    customerPhone: string,
    data?: Partial<CreateLeadRequest>
  ): Promise<Lead> {
    // Validate and normalize phone
    this.validatePhoneNumber(customerPhone);
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Try to find existing active lead
    let lead = await prisma.lead.findFirst({
      where: {
        tenantId,
        customerPhone: normalizedPhone,
        status: {
          notIn: ['closed', 'lost'],
        },
      },
      include: {
        car: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Create new lead if not found
    if (!lead) {
      lead = await this.create(tenantId, {
        customerPhone: normalizedPhone,
        customerName: data?.customerName,
        carId: data?.carId,
        status: data?.status || 'new',
        source: data?.source || 'wa',
        notes: data?.notes,
        tags: data?.tags,
      });
    }

    return lead;
  }

  /**
   * List leads with filters and pagination
   */
  async list(tenantId: number, filters: LeadFilterParams): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page,
      limit,
      offset,
      status,
      source,
      carId,
      assignedToUserId,
      search,
      startDate,
      endDate,
    } = filters;

    // Build where clause
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (carId) {
      where.carId = carId;
    }

    if (assignedToUserId) {
      where.assignedToUserId = assignedToUserId;
    }

    if (search) {
      where.OR = [
        { customerPhone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get total count
    const total = await prisma.lead.count({ where });

    // Get leads
    const leads = await prisma.lead.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { status: 'asc' }, // New/Hot first
        { createdAt: 'desc' },
      ],
      include: {
        car: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      leads,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Assign lead to user
   */
  async assign(tenantId: number, leadId: number, userId: number): Promise<Lead> {
    const lead = await this.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new ValidationError('User not found or does not belong to this tenant');
    }

    return await prisma.lead.update({
      where: { id: leadId },
      data: { assignedToUserId: userId },
      include: {
        car: true,
        assignedTo: true,
      },
    });
  }

  /**
   * Update lead status
   */
  async updateStatus(
    tenantId: number,
    leadId: number,
    status: string
  ): Promise<Lead> {
    return await this.update(tenantId, leadId, { status });
  }

  /**
   * Add tags to lead
   */
  async addTags(tenantId: number, leadId: number, tags: string[]): Promise<Lead> {
    const lead = await this.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const existingTags = lead.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];

    return await prisma.lead.update({
      where: { id: leadId },
      data: { tags: newTags },
      include: {
        car: true,
        assignedTo: true,
      },
    });
  }

  /**
   * Remove tags from lead
   */
  async removeTags(tenantId: number, leadId: number, tags: string[]): Promise<Lead> {
    const lead = await this.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const existingTags = lead.tags || [];
    const newTags = existingTags.filter((tag) => !tags.includes(tag));

    return await prisma.lead.update({
      where: { id: leadId },
      data: { tags: newTags },
      include: {
        car: true,
        assignedTo: true,
      },
    });
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): void {
    if (!PHONE_REGEX.test(phone)) {
      throw new ValidationError(MESSAGES.INVALID_PHONE, { phone });
    }
  }

  /**
   * Normalize phone number to consistent format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Convert to international format with +62
    if (normalized.startsWith('0')) {
      normalized = '+62' + normalized.substring(1);
    } else if (normalized.startsWith('62')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+62' + normalized;
    }

    return normalized;
  }

  /**
   * Get lead statistics
   */
  async getStats(tenantId: number): Promise<{
    total: number;
    new: number;
    hot: number;
    warm: number;
    cold: number;
    closed: number;
    lost: number;
  }> {
    const [total, newLeads, hot, warm, cold, closed, lost] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, status: 'new' } }),
      prisma.lead.count({ where: { tenantId, status: 'hot' } }),
      prisma.lead.count({ where: { tenantId, status: 'warm' } }),
      prisma.lead.count({ where: { tenantId, status: 'cold' } }),
      prisma.lead.count({ where: { tenantId, status: 'closed' } }),
      prisma.lead.count({ where: { tenantId, status: 'lost' } }),
    ]);

    return {
      total,
      new: newLeads,
      hot,
      warm,
      cold,
      closed,
      lost,
    };
  }
}
