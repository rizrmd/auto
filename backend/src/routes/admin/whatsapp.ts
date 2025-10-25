/**
 * WhatsApp Admin Routes
 * Manage WhatsApp Web API pairing and configuration
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { WhatsAppClient } from '../../whatsapp/whatsapp-client';
import { authMiddleware } from '../../middleware/auth';
import type { ApiResponse } from '../../types/context';

const whatsappAdmin = new Hono();

// Apply authentication middleware to all routes
whatsappAdmin.use('*', authMiddleware);

/**
 * GET /api/admin/whatsapp/status
 * Get WhatsApp connection status
 */
whatsappAdmin.get(
  '/status',
  asyncHandler(async (c) => {
    const whatsapp = new WhatsAppClient();
    
    try {
      // Get detailed health status
      const health = await whatsapp.healthCheck();
      
      // Get version information
      const version = await whatsapp.getVersion();
      
      // Get webhook configuration
      const webhookUrl = process.env.WA_WEBHOOK_URL;
      
      const response: ApiResponse = {
        success: true,
        data: {
          configured: whatsapp.isConfigured(),
          health: health,
          version: version,
          webhook: {
            configured: !!webhookUrl,
            url: webhookUrl || null,
          },
          api: {
            url: process.env.WHATSAPP_API_URL || 'http://localhost:8080/send',
            swagger: whatsapp.getSwaggerUrl(),
          }
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error getting status:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get WhatsApp status',
        },
      };

      return c.json(response, 500);
    }
  })
);

/**
 * GET /api/admin/whatsapp/qr
 * Generate QR code for WhatsApp pairing
 */
whatsappAdmin.get(
  '/qr',
  asyncHandler(async (c) => {
    const format = c.req.query('format') as 'json' | 'image' || 'json';
    
    const whatsapp = new WhatsAppClient();
    
    try {
      const result = await whatsapp.generateQR(format);
      
      const response: ApiResponse = {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? undefined : {
          code: 'QR_ERROR',
          message: result.error || 'Failed to generate QR code',
        },
      };

      return c.json(response, result.success ? 200 : 400);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error generating QR:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'QR_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate QR code',
        },
      };

      return c.json(response, 500);
    }
  })
);

/**
 * POST /api/admin/whatsapp/test
 * Send a test message
 */
whatsappAdmin.post(
  '/test',
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Phone and message are required',
        },
      };
      return c.json(response, 400);
    }

    const whatsapp = new WhatsAppClient();
    
    try {
      const result = await whatsapp.sendMessage({
        target: phone,
        message: message,
      });

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? undefined : {
          code: 'SEND_ERROR',
          message: result.error || 'Failed to send test message',
        },
      };

      return c.json(response, result.success ? 200 : 400);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error sending test message:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TEST_SEND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send test message',
        },
      };

      return c.json(response, 500);
    }
  })
);

/**
 * GET /api/admin/whatsapp/logs
 * Get recent WhatsApp activity logs
 */
whatsappAdmin.get(
  '/logs',
  asyncHandler(async (c) => {
    const limit = parseInt(c.req.query('limit') || '50');
    const tenantId = c.get('tenantId');

    try {
      // Get recent messages from database
      const messages = await prisma.message.findMany({
        where: {
          tenantId: tenantId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          leadId: true,
          sender: true,
          message: true,
          metadata: true,
          createdAt: true,
          lead: {
            select: {
              customerPhone: true,
              customerName: true,
            },
          },
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          messages: messages,
          total: messages.length,
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error fetching logs:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'LOGS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp logs',
        },
      };

      return c.json(response, 500);
    }
  })
);

/**
 * POST /api/admin/whatsapp/mark-read
 * Mark messages as read (test endpoint)
 */
whatsappAdmin.post(
  '/mark-read',
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const { phone, messageIds } = body;

    if (!phone) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Phone number is required',
        },
      };
      return c.json(response, 400);
    }

    const whatsapp = new WhatsAppClient();
    
    try {
      const result = await whatsapp.markAsRead(phone, messageIds);

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? undefined : {
          code: 'MARK_READ_ERROR',
          message: result.error || 'Failed to mark messages as read',
        },
      };

      return c.json(response, result.success ? 200 : 400);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error marking messages as read:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MARK_READ_ERROR',
          message: error instanceof Error ? error.message : 'Failed to mark messages as read',
        },
      };

      return c.json(response, 500);
    }
  })
);

export default whatsappAdmin;