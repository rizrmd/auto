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
    const startTime = Date.now();
    const requestId = c.get('requestId');

    // Log request details
    console.log('='.repeat(50));
    console.log(`[WEBHOOK] Fonnte webhook received - Request ID: ${requestId}`);
    console.log(`[WEBHOOK] Timestamp: ${new Date().toISOString()}`);
    console.log(`[WEBHOOK] Method: ${c.req.method}`);
    console.log(`[WEBHOOK] URL: ${c.req.url}`);
    console.log(`[WEBHOOK] User-Agent: ${c.req.header('user-agent') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Type: ${c.req.header('content-type') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Length: ${c.req.header('content-length') || 'Unknown'}`);

    const payload: FontteWebhookPayload = await c.req.json();

    console.log(`[WEBHOOK] Payload Details:`);
    console.log(`[WEBHOOK]   - Sender: ${payload.sender}`);
    console.log(`[WEBHOOK]   - Message: ${payload.message}`);
    console.log(`[WEBHOOK]   - Type: ${payload.type}`);
    console.log(`[WEBHOOK]   - Push Name: ${payload.pushname || 'Not provided'}`);
    console.log(`[WEBHOOK]   - Member Name: ${payload.member?.name || 'Not provided'}`);
    console.log(`[WEBHOOK]   - Device ID: ${payload.device || 'Not provided'}`);
    console.log(`[WEBHOOK]   - Timestamp: ${payload.timestamp || 'Not provided'}`);
    console.log(`[WEBHOOK]   - File: ${payload.file || 'No file'}`);
    console.log(`[WEBHOOK]   - URL: ${payload.url || 'No URL'}`);
    console.log(`[WEBHOOK]   - Location: ${payload.location || 'No location'}`);

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
