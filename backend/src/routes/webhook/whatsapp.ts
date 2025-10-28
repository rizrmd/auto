/**
 * WhatsApp Web API Webhook Route
 * Handles incoming WhatsApp messages from WhatsApp Web API v1.6.0
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import type { ApiResponse } from '../../types/context';

const whatsappWebhook = new Hono();

interface WhatsAppWebhookPayload {
  event: string;
  message?: string;
  sender?: string;
  chat?: string;
  time?: string;
  id?: string;
  attachment?: {
    type?: string;
    url?: string;
    caption?: string;
    mimetype?: string;
    file_length?: number;
  };
}

/**
 * Identify if sender is customer, admin, or sales
 */
async function identifyUserType(tenantId: number, senderPhone: string): Promise<string> {
  // Check if sender is a registered user (admin/sales)
  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      OR: [
        { phone: { contains: senderPhone.slice(-10) } },
        { whatsappNumber: { contains: senderPhone.slice(-10) } }
      ],
      status: 'active'
    }
  });

  if (user) {
    return user.role === 'owner' || user.role === 'admin' ? 'admin' : 'sales';
  }

  // Default to customer
  return 'customer';
}

/**
 * POST /webhook/whatsapp
 * Handle incoming WhatsApp messages from WhatsApp Web API
 */
whatsappWebhook.post('/', async (c) => {
  try {
    const payload: WhatsAppWebhookPayload = await c.req.json();
    console.log(`[WEBHOOK] WhatsApp Web API v1.6.0 Payload:`, payload);

    // Validate required fields
    if (!payload.event || payload.event !== 'message') {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_EVENT',
          message: 'Only message events are supported',
        },
      }, 400);
    }

    if (!payload.sender) {
      return c.json({
        success: false,
        error: {
          code: 'MISSING_SENDER',
          message: 'Sender field is required',
        },
      }, 400);
    }

    // Extract phone from JID format
    const customerPhone = payload.sender.split('@')[0];
    const message = payload.message || payload.attachment?.caption || '';
    const messageId = payload.id;

    console.log(`[WEBHOOK] Message from ${customerPhone}: "${message}"`);

    // Find active tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        status: 'active',
        whatsappBotEnabled: true,
      },
    });

    if (!tenant) {
      console.warn('[WEBHOOK] No active tenant found');
      return c.json({
        success: false,
        error: {
          code: 'NO_TENANT',
          message: 'No active tenant configured',
        },
      }, 400);
    }

    // Simple lead creation without complex service dependencies
    let lead;
    try {
      lead = await prisma.lead.findFirst({
        where: {
          tenantId: tenant.id,
          customerPhone: customerPhone,
          status: {
            notIn: ['closed', 'lost'],
          },
        },
      });

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            tenantId: tenant.id,
            customerPhone: customerPhone,
            status: 'new',
            source: 'wa',
          },
        });
      }
    } catch (error) {
      console.error('[WEBHOOK] Error finding/creating lead:', error);
      // Continue anyway
    }

    // Save message to database
    try {
      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          leadId: lead?.id || 1,
          sender: 'customer',
          message: message,
          metadata: {
            type: payload.attachment?.type || 'text',
            chat: payload.chat,
            time: payload.time,
            messageId: messageId,
            webhookFormat: 'whatsapp-web-api-v1.6.0',
            attachment: payload.attachment || undefined,
          },
        },
      });
    } catch (error) {
      console.error('[WEBHOOK] Error saving message:', error);
    }

    // Identify user type
    const userType = await identifyUserType(tenant.id, customerPhone);
    console.log(`[WEBHOOK] User type: ${userType}`);

    // Generate simple response based on user type and message
    let responseMessage = '';
    
    if (userType === 'admin' || userType === 'sales') {
      responseMessage = `👋 Admin command received: "${message}". Use /help for available commands.`;
    } else {
      // Simple customer responses
      if (message.toLowerCase().includes('harga') || message.toLowerCase().includes('price')) {
        responseMessage = '📝 For pricing information, please contact our sales team at ' + tenant.whatsappNumber;
      } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('halo')) {
        responseMessage = '👋 Hello! Welcome to ' + tenant.name + '. How can I help you today?';
      } else {
        responseMessage = '🤖 Thank you for your message. Our team will get back to you soon! 📞 ' + tenant.whatsappNumber;
      }
    }

    console.log(`[WEBHOOK] Response: "${responseMessage}"`);

    const response: ApiResponse = {
      success: true,
      data: {
        leadId: lead?.id,
        status: 'processed',
        message: 'WhatsApp Web API webhook processed successfully',
        response: responseMessage,
        userType: userType,
      },
    };

    return c.json(response);

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return c.json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error.message || 'Internal server error',
      },
    }, 500);
  }
});

/**
 * GET /webhook/whatsapp/health
 * Health check endpoint
 */
whatsappWebhook.get('/health', async (c) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      service: 'WhatsApp Webhook',
      version: '1.6.0',
      timestamp: new Date().toISOString(),
    },
  };

  return c.json(response);
});

export default whatsappWebhook;