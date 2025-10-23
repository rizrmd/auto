/**
 * Fonnte Webhook Route
 *
 * Handles incoming WhatsApp messages from Fonnte.
 */

import { Hono } from 'hono';
import { LeadService } from '../../services/lead.service';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import type { FontteWebhookPayload, ApiResponse } from '../../types/context';

const fontteWebhook = new Hono();

/**
 * POST /webhook/fonnte
 * Handle incoming WhatsApp messages
 */
fontteWebhook.post(
  '/',
  asyncHandler(async (c) => {
    const payload: FontteWebhookPayload = await c.req.json();

    console.log('Fonnte webhook received:', {
      sender: payload.sender,
      message: payload.message,
      type: payload.type,
    });

    // Extract phone number (remove @s.whatsapp.net suffix if present)
    const customerPhone = payload.sender.replace('@s.whatsapp.net', '');
    const customerName = payload.pushname || payload.member?.name;

    // Determine tenant based on device/number
    // For now, we'll need to identify tenant from the device number
    // This requires a mapping table or configuration
    // For simplicity, we'll use the first tenant or a default tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        status: 'active',
        whatsappBotEnabled: true,
      },
    });

    if (!tenant) {
      console.warn('No active tenant found for webhook');
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NO_TENANT',
          message: 'No active tenant configured',
        },
      };
      return c.json(response, 400);
    }

    const leadService = new LeadService();

    // Find or create lead
    const lead = await leadService.findOrCreateByPhone(tenant.id, customerPhone, {
      customerName,
      source: 'wa',
      status: 'new',
    });

    // Save message to database
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        sender: 'customer',
        message: payload.message,
        metadata: {
          type: payload.type,
          file: payload.file,
          url: payload.url,
          timestamp: payload.timestamp,
        },
      },
    });

    // Here you would implement bot logic or AI responses
    // For now, we'll just acknowledge receipt

    const response: ApiResponse = {
      success: true,
      data: {
        leadId: lead.id,
        status: 'processed',
      },
    };

    return c.json(response);
  })
);

export default fontteWebhook;
