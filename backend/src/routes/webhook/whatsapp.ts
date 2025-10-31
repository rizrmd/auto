/**
 * WhatsApp Web API Webhook Route
 * Handles incoming WhatsApp messages from WhatsApp Web API v1.7.0
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
    console.log(`[WEBHOOK] 📨 WhatsApp Web API v1.6.0 Payload:`, JSON.stringify(payload, null, 2));
    console.log(`[WEBHOOK] 🕐 Timestamp: ${new Date().toISOString()}`);
    console.log(`[WEBHOOK] 🌐 Request headers:`, JSON.stringify(c.req.header(), null, 2));

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

    // Find tenant by domain from webhook headers or request context
    const host = c.req.header('host') || '';
    console.log(`[WEBHOOK] Looking up tenant for domain: ${host}`);
    
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: host },
          { customDomain: host }
        ],
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

    // Save message to database with tenant context
    try {
      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          leadId: lead?.id,
          sender: 'customer',
          message: message,
          metadata: {
            type: payload.attachment?.type || 'text',
            chat: payload.chat,
            time: payload.time,
            messageId: messageId,
            webhookFormat: 'whatsapp-web-api-v1.6.0',
            attachment: payload.attachment || undefined,
            tenant: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              domain: host,
            },
          },
        },
      });
      
      console.log(`[WEBHOOK] Message saved for tenant: ${tenant.name} (${tenant.slug})`);
    } catch (error) {
      console.error('[WEBHOOK] Error saving message:', error);
    }

    // Identify user type
    const userType = await identifyUserType(tenant.id, customerPhone);
    console.log(`[WEBHOOK] User type: ${userType}`);

    // Generate simple response based on user type and message
    let responseMessage = '';
    
    if (userType === 'admin' || userType === 'sales') {
      responseMessage = `👋 Perintah admin diterima: "${message}". Gunakan /help untuk daftar perintah yang tersedia.`;
    } else {
      // Simple customer responses
      if (message.toLowerCase().includes('harga') || message.toLowerCase().includes('price')) {
        responseMessage = '📝 Untuk informasi harga, silahkan hubungi tim sales kami di ' + tenant.whatsappNumber;
      } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('halo')) {
        responseMessage = '👋 Halo! Selamat datang di ' + tenant.name + '. Ada yang bisa saya bantu hari ini?';
      } else {
        responseMessage = '🤖 Terima kasih atas pesan Anda. Tim kami akan segera menghubungi Anda kembali! 📞 ' + tenant.whatsappNumber;
      }
    }

    console.log(`[WEBHOOK] Response: "${responseMessage}"`);

    // Send response via WhatsApp using tenant-specific proxy API
    let whatsappSendResult = null;
    try {
      console.log(`[WEBHOOK] Sending WhatsApp response to ${customerPhone} for tenant: ${tenant.name} (${tenant.slug})`);
      
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      console.log(`[WEBHOOK] Cleaned phone: ${cleanPhone}, Message: "${responseMessage}"`);
      
      // Use tenant-specific proxy API
      const baseUrl = process.env.APP_URL || 'https://auto.lumiku.com';
      const proxyHost = tenant.customDomain || tenant.subdomain;
      console.log(`[WEBHOOK] Using proxy host: ${proxyHost} for tenant: ${tenant.name}`);

      const sendResponse = await fetch(`${baseUrl}/api/wa/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': proxyHost, // Use customDomain if available, fallback to subdomain
        },
        body: JSON.stringify({
          number: cleanPhone,
          message: responseMessage
        })
      });

      const sendData = await sendResponse.json();
      console.log(`[WEBHOOK] Proxy response (${sendResponse.status}):`, JSON.stringify(sendData));
      
      if (sendResponse.ok && sendData.success) {
        whatsappSendResult = { success: true, message: 'Message sent via proxy' };
        console.log(`[WEBHOOK] ✅ WhatsApp message sent successfully to ${customerPhone}`);
      } else {
        whatsappSendResult = { success: false, error: sendData.message || 'Send failed' };
        console.error(`[WEBHOOK] ❌ Failed to send WhatsApp:`, sendData);
      }
      
    } catch (error) {
      whatsappSendResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      console.error(`[WEBHOOK] ❌ Error sending WhatsApp:`, error);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: host,
        },
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