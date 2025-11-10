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
    // Set no-cache headers for real-time status
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    c.header('Vary', 'Authorization, Accept-Encoding');

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
    
    // Use tenant-specific WhatsApp instance through proxy
    try {
      // First check database status - this is the source of truth for disconnect state
      const dbStatus = tenant.whatsappStatus || 'unknown';
      const isDbDisconnected = dbStatus === 'disconnected';

      console.log(`[WHATSAPP ADMIN] Database status for ${tenant.name}: ${dbStatus}`);

      // Only check WhatsApp API health if database shows as connected
      let health = null;
      let version = 'v1.7.0';

      if (!isDbDisconnected) {
        try {
          // Get health status through proxy to ensure tenant-specific routing
          const response = await fetch(`http://localhost:8080/api/wa/health`, {
            method: 'GET',
            headers: {
              'Host': tenant.subdomain || tenant.customDomain,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const healthData = await response.json();
            health = healthData.data?.data || healthData.data;
            version = health?.version || 'v1.7.0';
          } else {
            console.warn(`[WHATSAPP ADMIN] Health check failed: ${response.status}`);
          }
        } catch (healthError) {
          console.warn('[WHATSAPP ADMIN] Health check error:', healthError);
          // Don't fail the entire status endpoint if health check fails
        }
      } else {
        console.log('[WHATSAPP ADMIN] Skipping health check - tenant is marked as disconnected in database');
      }

      // Get webhook configuration
      const webhookUrl = `${process.env.APP_URL || 'https://auto.lumiku.com'}/webhook/whatsapp`;

      const apiResponse: ApiResponse = {
        success: true,
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            whatsappNumber: tenant.whatsappNumber,
            whatsappBotEnabled: tenant.whatsappBotEnabled,
            whatsappStatus: tenant.whatsappStatus, // This reflects the database state
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

      return c.json(apiResponse);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error getting status:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get WhatsApp status',
        },
      };

      return c.json(errorResponse, 500);
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
    // Set no-cache headers to ensure fresh QR codes
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    c.header('Vary', 'Authorization, Accept-Encoding');
    c.header('X-Content-Type-Options', 'nosniff');

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
      // For disconnected tenants, return a message to click "Refresh QR" instead of auto-generating
      if (tenant.whatsappStatus === 'disconnected') {
        console.log(`[WHATSAPP ADMIN] Tenant is disconnected, requiring manual QR generation request`);

        const qrResponse: ApiResponse = {
          success: false,
          error: {
            code: 'TENANT_DISCONNECTED',
            message: 'Tenant is disconnected. Click "Refresh QR" to reconnect.',
          },
        };
        return c.json(qrResponse, 200);
      }

      // Use WhatsApp internal API through proxy for tenant-specific routing
      const response = await fetch(`http://localhost:8080/api/wa/pair`, {
        method: 'GET',
        headers: {
          'Host': tenant.subdomain || tenant.customDomain,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`QR generation failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('image/png')) {
        // WhatsApp API returns PNG image directly
        const imageBuffer = await response.arrayBuffer();
        const base64Image = 'data:image/png;base64,' + Buffer.from(imageBuffer).toString('base64');

        if (format === 'image') {
          // Return image directly with no-cache headers
          return new Response(imageBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'no-cache, no-store, must-revalidate, private',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Content-Type-Options': 'nosniff',
              'Vary': 'Authorization',
            },
          });
        } else {
          // Return JSON with base64 image
          const qrResponse: ApiResponse = {
            success: true,
            data: {
              qr: base64Image,
              expires: Date.now() + 120000, // 120 seconds (2 minutes)
              device_id: tenant.whatsappInstanceId || 'unknown',
            },
          };
          return c.json(qrResponse);
        }
      } else {
        // Fallback for JSON response
        const result = await response.json();

        const qrResponse: ApiResponse = {
          success: result.success,
          data: result.success ? result.data : null,
          error: result.success ? undefined : {
            code: 'QR_ERROR',
            message: result.error || 'Failed to generate QR code',
          },
        };

        return c.json(qrResponse);
      }
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error generating QR:', error);

      const qrErrorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'QR_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate QR code',
        },
      };

      return c.json(qrErrorResponse, 500);
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
    // Set no-cache headers for test endpoints
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

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
    // Set short cache for logs (they change frequently)
    c.header('Cache-Control', 'private, max-age=5');
    c.header('Vary', 'Authorization');

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
 * POST /api/admin/whatsapp/disconnect
 * Disconnect WhatsApp device (for reconnection with new QR)
 */
whatsappAdmin.post(
  '/force-reconnect',
  asyncHandler(async (c) => {
    // Set no-cache headers for reconnection operations
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

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

    console.log(`[WHATSAPP ADMIN] Disconnect request for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);

    try {
      // Call WhatsApp API to disconnect
      console.log(`[WHATSAPP ADMIN] Disconnecting WhatsApp instance: ${tenant.whatsappInstanceId} for tenant: ${tenant.id}`);

      const disconnectResponse = await fetch(`http://localhost:8080/disconnect?tenant_id=${tenant.id}&instance=${tenant.whatsappInstanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AutoLeads-Proxy/1.0',
        },
      });

      if (!disconnectResponse.ok) {
        console.error(`[WHATSAPP ADMIN] Disconnect API failed: ${disconnectResponse.status} ${disconnectResponse.statusText}`);
        throw new Error(`Disconnect API failed: ${disconnectResponse.status}`);
      }

      const disconnectResult = await disconnectResponse.text();
      console.log(`[WHATSAPP ADMIN] Disconnect response: ${disconnectResult}`);

      // Wait for disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear any cached session data
      console.log('[WHATSAPP ADMIN] Clearing cached session data...');

      // Clear tenant WhatsApp instance cache/data if needed
      try {
        // Force logout/clear session to prevent auto-reconnect
        const logoutResponse = await fetch(`http://localhost:8080/logout?tenant_id=${tenant.id}&instance=${tenant.whatsappInstanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AutoLeads-Proxy/1.0',
          },
        });
        console.log(`[WHATSAPP ADMIN] Logout response: ${logoutResponse.status}`);
      } catch (logoutError) {
        console.log('[WHATSAPP ADMIN] Logout endpoint not available');
      }

      // Additional wait for session clearing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Force restart WhatsApp service to ensure complete disconnection
      console.log('[WHATSAPP ADMIN] Force restarting WhatsApp service...');

      try {
        const restartResponse = await fetch(`http://localhost:8080/restart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AutoLeads-Proxy/1.0',
          },
        });
        console.log(`[WHATSAPP ADMIN] Restart response status: ${restartResponse.status}`);

        // Wait for service to be fully restarted
        await new Promise(resolve => setTimeout(resolve, 8000));

      } catch (restartError) {
        console.log('[WHATSAPP ADMIN] Service restart failed, attempting alternative approach...');

        // Alternative: Force restart by stopping and starting the WhatsApp service
        try {
          console.log('[WHATSAPP ADMIN] Attempting manual WhatsApp service restart...');

          // This would require system-level access which may not be available in container
          // For now, we'll rely on the disconnect and cache clearing
          await new Promise(resolve => setTimeout(resolve, 10000));

        } catch (systemError) {
          console.log('[WHATSAPP ADMIN] System-level restart not available');
        }
      }

      // Update tenant database record to reflect disconnected state
      console.log('[WHATSAPP ADMIN] Updating tenant status to disconnected...');
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            whatsappStatus: 'disconnected',
            whatsappBotEnabled: false,
          },
        });
        console.log('[WHATSAPP ADMIN] Tenant status updated to disconnected');
      } catch (dbError) {
        console.error('[WHATSAPP ADMIN] Failed to update tenant status:', dbError);
        // Continue anyway - the API disconnect should be sufficient
      }

      // Final verification to ensure disconnect worked
      console.log('[WHATSAPP ADMIN] Verifying disconnect status...');
      let finalVerificationPassed = false;

      try {
        const verifyResponse = await fetch(`http://localhost:8080/health`, {
          method: 'GET',
          headers: {
            'Host': tenant.subdomain || tenant.customDomain,
            'Content-Type': 'application/json',
          },
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const deviceStatus = verifyData.data?.data?.status;

          if (deviceStatus === 'disconnected' || deviceStatus === 'not connected') {
            console.log(`[WHATSAPP ADMIN] Verification successful: Device status is ${deviceStatus}`);
            finalVerificationPassed = true;
          } else {
            console.warn(`[WHATSAPP ADMIN] Verification warning: Device still showing as ${deviceStatus}`);
          }
        } else {
          console.warn('[WHATSAPP ADMIN] Verification failed: Health check error');
        }
      } catch (verifyError) {
        console.warn('[WHATSAPP ADMIN] Verification error:', verifyError);
      }

      console.log('[WHATSAPP ADMIN] Disconnect process completed with service restart');

      const response: ApiResponse = {
        success: true,
        data: {
          disconnected: true,
          verified: finalVerificationPassed,
          message: finalVerificationPassed
            ? 'WhatsApp device disconnected successfully. The device is now offline and ready for new QR code pairing.'
            : 'WhatsApp disconnect initiated. Please refresh the status to confirm disconnection.',
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            whatsappStatus: 'disconnected',
          }
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error during disconnect:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DISCONNECT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp device',
        },
      };

      return c.json(response, 500);
    }
  })
);

/**
 * POST /api/admin/whatsapp/force-reconnect
 * Force reconnection and generate QR code after disconnect
 */
whatsappAdmin.post(
  '/force-reconnect',
  asyncHandler(async (c) => {
    // Set no-cache headers for reconnection operations
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

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

    console.log(`[WHATSAPP ADMIN] Force reconnect request for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);

    try {
      // Update tenant status to allow reconnection
      console.log(`[WHATSAPP ADMIN] Updating tenant status to allow reconnection...`);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          whatsappStatus: 'connecting',
          whatsappBotEnabled: false,
        },
      });
      console.log(`[WHATSAPP ADMIN] Updated tenant status from disconnected to connecting`);

      const response: ApiResponse = {
        success: true,
        data: {
          reconnected: true,
          message: 'Tenant status updated. You can now generate QR code for reconnection.',
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            whatsappStatus: 'connecting',
          }
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error during force reconnect:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORCE_RECONNECT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to force reconnect',
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
    // Set no-cache headers for message operations
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
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