/**
 * Lead Capture
 * Automatically creates and updates leads from customer conversations
 */

import { PrismaClient, LeadStatus } from '../../../../generated/prisma';
import { Intent } from './intent-recognizer';

export class LeadCapture {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create lead for customer
   */
  async getOrCreateLead(
    tenantId: number,
    customerPhone: string,
    firstMessage?: string
  ): Promise<any> {
    try {
      // Normalize phone number
      const normalized = customerPhone.replace(/[^0-9]/g, '');

      // Try to find existing lead (not closed)
      let lead = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          customerPhone: normalized,
          status: {
            notIn: ['closed', 'lost']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Create new lead if doesn't exist
      if (!lead) {
        lead = await this.prisma.lead.create({
          data: {
            tenantId,
            customerPhone: normalized,
            status: 'new',
            source: 'wa',
            tags: [],
            notes: firstMessage ? `First message: ${firstMessage}` : undefined
          }
        });

        console.log(`Created new lead: ${lead.id} for ${normalized}`);
      }

      return lead;

    } catch (error) {
      console.error('Error in getOrCreateLead:', error);
      throw error;
    }
  }

  /**
   * Update lead status based on intent
   */
  async updateLeadStatus(leadId: number, intent: Intent): Promise<void> {
    try {
      let newStatus: LeadStatus | undefined;
      let tags: string[] = [];

      // Determine status based on intent
      switch (intent.type) {
        case 'inquiry':
          newStatus = 'warm';
          tags.push('inquiry');
          if (intent.entities.brand) tags.push(`brand:${intent.entities.brand}`);
          if (intent.entities.model) tags.push(`model:${intent.entities.model}`);
          break;

        case 'price':
          newStatus = 'hot';
          tags.push('price-query');
          break;

        case 'negotiation':
          newStatus = 'hot';
          tags.push('negotiation');
          break;

        case 'test_drive':
          newStatus = 'hot';
          tags.push('test-drive');
          break;

        case 'location':
          tags.push('location-query');
          break;

        case 'greeting':
          tags.push('greeting');
          break;
      }

      // Update lead
      const updateData: any = {
        updatedAt: new Date()
      };

      if (newStatus) {
        updateData.status = newStatus;
      }

      // Get existing lead to merge tags
      const existingLead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        select: { tags: true }
      });

      if (existingLead) {
        const existingTags = existingLead.tags || [];
        const mergedTags = Array.from(new Set([...existingTags, ...tags]));
        updateData.tags = mergedTags;
      }

      await this.prisma.lead.update({
        where: { id: leadId },
        data: updateData
      });

    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  }

  /**
   * Link lead to specific car
   */
  async linkLeadToCar(leadId: number, carId: number): Promise<void> {
    try {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          carId,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error linking lead to car:', error);
    }
  }

  /**
   * Add note to lead
   */
  async addLeadNote(leadId: number, note: string): Promise<void> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        select: { notes: true }
      });

      if (lead) {
        const existingNotes = lead.notes || '';
        const timestamp = new Date().toISOString();
        const newNotes = existingNotes
          ? `${existingNotes}\n\n[${timestamp}] ${note}`
          : `[${timestamp}] ${note}`;

        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            notes: newNotes,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error adding lead note:', error);
    }
  }

  /**
   * Mark lead as hot (ready for sales follow-up)
   */
  async markAsHot(leadId: number, reason: string): Promise<void> {
    try {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'hot',
          updatedAt: new Date()
        }
      });

      await this.addLeadNote(leadId, `Marked as HOT: ${reason}`);

    } catch (error) {
      console.error('Error marking lead as hot:', error);
    }
  }

  /**
   * Get lead statistics for tenant
   */
  async getLeadStats(tenantId: number): Promise<{
    total: number;
    new: number;
    hot: number;
    warm: number;
    cold: number;
    closed: number;
  }> {
    try {
      const [total, newLeads, hot, warm, cold, closed] = await Promise.all([
        this.prisma.lead.count({ where: { tenantId } }),
        this.prisma.lead.count({ where: { tenantId, status: 'new' } }),
        this.prisma.lead.count({ where: { tenantId, status: 'hot' } }),
        this.prisma.lead.count({ where: { tenantId, status: 'warm' } }),
        this.prisma.lead.count({ where: { tenantId, status: 'cold' } }),
        this.prisma.lead.count({ where: { tenantId, status: 'closed' } })
      ]);

      return {
        total,
        new: newLeads,
        hot,
        warm,
        cold,
        closed
      };

    } catch (error) {
      console.error('Error getting lead stats:', error);
      return { total: 0, new: 0, hot: 0, warm: 0, cold: 0, closed: 0 };
    }
  }

  /**
   * Assign lead to sales
   */
  async assignToSales(leadId: number, userId: number): Promise<void> {
    try {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          assignedToUserId: userId,
          updatedAt: new Date()
        }
      });

      await this.addLeadNote(leadId, `Assigned to user ${userId}`);

    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  }
}
