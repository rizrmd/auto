/**
 * WhatsApp Web API Webhook Route
 * Handles incoming WhatsApp messages from WhatsApp Web API v1.6.0
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import type { ApiResponse } from '../../types/context';
import { WhatsAppClient } from '../../whatsapp/whatsapp-client';

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

    // Send response via WhatsApp using internal proxy API
    let whatsappSendResult = null;
    try {
      console.log(`[WEBHOOK] Sending WhatsApp response to ${customerPhone} via proxy`);
      
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      console.log(`[WEBHOOK] Cleaned phone number: ${cleanPhone}`);
      console.log(`[WEBHOOK] Message to send: "${responseMessage}"`);
      
      // Use internal service directly, fallback to proxy if needed
      let sendResponse;
      let connectionMethod = 'unknown';
      
      try {
        // Try direct internal service first
        console.log(`[WEBHOOK] Trying direct connection to localhost:8080...`);
        sendResponse = await fetch('http://localhost:8080/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: cleanPhone,
            message: responseMessage
          })
        });
        connectionMethod = 'direct';
        console.log(`[WEBHOOK] Direct response status: ${sendResponse.status}`);
      } catch (directError) {
        console.warn(`[WEBHOOK] Direct service failed, trying proxy:`, directError);
        // Fallback to proxy endpoint
        console.log(`[WEBHOOK] Trying proxy connection to /api/wa/send...`);
        sendResponse = await fetch('/api/wa/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: cleanPhone,
            message: responseMessage
          })
        });
        connectionMethod = 'proxy';
        console.log(`[WEBHOOK] Proxy response status: ${sendResponse.status}`);
      }

      const sendData = await sendResponse.json();
      console.log(`[WEBHOOK] Send response data:`, JSON.stringify(sendData, null, 2));
      
      if (sendResponse.ok && sendData.success) {
        whatsappSendResult = { 
          success: true, 
          message: `Message sent via ${connectionMethod}`,
          method: connectionMethod,
          phone: cleanPhone,
          response: sendData
        };
        console.log(`[WEBHOOK] WhatsApp message sent successfully to ${customerPhone} via ${connectionMethod}`);
      } else {
        whatsappSendResult = { 
          success: false, 
          error: sendData.message || 'Failed to send',
          method: connectionMethod,
          phone: cleanPhone,
          status: sendResponse.status,
          response: sendData
        };
        console.error(`[WEBHOOK] Failed to send WhatsApp message:`, sendData);
      }
      
    } catch (error) {
      whatsappSendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      console.error(`[WEBHOOK] Error sending WhatsApp message:`, error);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        leadId: lead?.id,
        status: 'processed',
        message: 'WhatsApp Web API webhook processed successfully',
        response: responseMessage,
        userType: userType,
        whatsappSent: whatsappSendResult?.success || false,
        whatsappError: whatsappSendResult?.error || null,
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