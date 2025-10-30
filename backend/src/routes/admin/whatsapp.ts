/**
 * WhatsApp Admin Routes
 * Manage WhatsApp Web API pairing and configuration
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { WhatsAppClient } from '../../whatsapp/whatsapp-client';
import { authMiddleware } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import type { ApiResponse } from '../../types/context';

const whatsappAdmin = new Hono();

// Apply tenant and authentication middleware to all routes
whatsappAdmin.use('*', tenantMiddleware);
whatsappAdmin.use('*', authMiddleware);

/**
 * GET /api/admin/whatsapp/status
 * Get WhatsApp connection status
 */
whatsappAdmin.get(
  '/status',
  asyncHandler(async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    
    if (!tenant) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      }, 400);
    }

    console.log(`[WHATSAPP ADMIN] Status check for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);
    
    // Use tenant-specific WhatsApp instance via proxy
    try {
      const baseUrl = process.env.APP_URL || 'https://auto.lumiku.com';
      const response = await fetch(`${baseUrl}/api/wa/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Host': tenant.subdomain, // This ensures proxy routes to correct tenant
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const health = await response.json();
      
      // Get version information
      const version = await whatsapp.getVersion();
      
      // Get webhook configuration
      const webhookUrl = `${process.env.APP_URL || 'https://auto.lumiku.com'}/webhook/whatsapp`;
      
      const response: ApiResponse = {
        success: true,
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            whatsappNumber: tenant.whatsappNumber,
            whatsappBotEnabled: tenant.whatsappBotEnabled,
            whatsappStatus: tenant.whatsappStatus,
            whatsappPort: tenant.whatsappPort,
          },
          health: health,
          webhook: {
            configured: !!webhookUrl,
            url: webhookUrl,
          },
          api: {
            url: `${process.env.APP_URL || 'https://auto.lumiku.com'}/api/wa`,
            pairing: `${process.env.APP_URL || 'https://auto.lumiku.com'}/api/wa/pair`,
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
    const tenant = c.get('tenant');
    const user = c.get('user');
    
    if (!tenant) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      }, 400);
    }

    console.log(`[WHATSAPP ADMIN] QR generation for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);
    
    try {
      // Use tenant-specific WhatsApp instance via proxy
      const baseUrl = process.env.APP_URL || 'https://auto.lumiku.com';
      const response = await fetch(`${baseUrl}/api/wa/pair`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Host': tenant.subdomain, // This ensures proxy routes to correct tenant
        },
      });

      if (!response.ok) {
        throw new Error(`QR generation failed: ${response.status}`);
      }

      if (format === 'image') {
        // Return image directly
        const imageBuffer = await response.arrayBuffer();
        
        return new Response(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } else {
        // Return JSON response
        const result = await response.json();
      
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
    const tenant = c.get('tenant');
    const user = c.get('user');

    if (!tenant) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      }, 400);
    }

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

    console.log(`[WHATSAPP ADMIN] Test message for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);
    console.log(`[WHATSAPP ADMIN] Sending test message to ${phone}: "${message}"`);
    
    try {
      // Use tenant-specific WhatsApp instance via proxy
      const baseUrl = process.env.APP_URL || 'https://auto.lumiku.com';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      const response = await fetch(`${baseUrl}/api/wa/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': tenant.subdomain, // This ensures proxy routes to correct tenant
        },
        body: JSON.stringify({
          number: cleanPhone,
          message: message
        })
      });

      const result = await response.json();

      const apiResponse: ApiResponse = {
        success: response.ok && result.success,
        data: response.ok && result.success ? {
          sent: true,
          tenant: tenant.slug,
          phone: cleanPhone,
          message: message,
        } : null,
        error: response.ok && result.success ? undefined : {
          code: 'TEST_SEND_ERROR',
          message: result?.error || 'Failed to send test message',
        },
      };

      return c.json(apiResponse, response.ok && result.success ? 200 : 400);
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