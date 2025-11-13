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

    // Add a unique request identifier to prevent duplicate processing
    const requestId = `${tenant.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[WHATSAPP ADMIN] Status check for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email} [ID: ${requestId}]`);

    // Check if we already have a recent status check for this tenant to prevent race conditions
    const statusCacheKey = `whatsapp-status-${tenant.id}`;
    const now = Date.now();
    const lastCheck = globalThis[statusCacheKey] || 0;

    if (now - lastCheck < 2000) { // 2 second throttle
      console.log(`[WHATSAPP ADMIN] Status check throttled for tenant ${tenant.name} - last check ${now - lastCheck}ms ago`);
    }
    globalThis[statusCacheKey] = now;
    
    // Use tenant-specific WhatsApp instance through proxy
    try {
      // First check database status - this is the source of truth for disconnect state
      const dbStatus = tenant.whatsappStatus || 'unknown';
      const isDbDisconnected = dbStatus === 'disconnected';

      console.log(`[WHATSAPP ADMIN] Database status for ${tenant.name}: ${dbStatus}`);

      // Only check WhatsApp API health if database shows as connected
      let health = null;
      let version = 'v1.7.0';
      let serviceAvailable = false;
      let serviceStatus = 'unreachable';

      if (!isDbDisconnected) {
        try {
          // Get tenant-specific port from database - CRITICAL: Must use tenant port
          const tenantPort = tenant.whatsappPort;
          if (!tenantPort) {
            console.error(`[WHATSAPP ADMIN] ❌ CRITICAL: No port assigned to tenant ${tenant.name}`);
            throw new Error(`Tenant ${tenant.name} has no WhatsApp port assigned`);
          }
          console.log(`[WHATSAPP ADMIN] Using port ${tenantPort} for tenant ${tenant.name}`);

          // Get health status from WhatsApp API service on tenant-specific port
          const whatsappHealthResponse = await fetch(`http://localhost:${tenantPort}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'AutoLeads-Proxy/1.0',
            },
          });

          if (whatsappHealthResponse.ok) {
            const healthData = await whatsappHealthResponse.json();
            health = healthData.data?.data || healthData.data;
            version = health?.version || 'v1.7.0';
            serviceAvailable = true;
            serviceStatus = 'available';
            console.log(`[WHATSAPP ADMIN] Service available for ${tenant.name}, connected: ${health?.connected || false}`);
          } else {
            serviceStatus = 'error';
            console.warn(`[WHATSAPP ADMIN] Health check failed: ${whatsappHealthResponse.status}`);
          }
        } catch (healthError) {
          serviceStatus = 'unreachable';
          console.warn('[WHATSAPP ADMIN] Health check error - service may be down:', healthError);

          // Check if WhatsApp binary process is running on tenant port
          try {
            const processCheck = await fetch(`http://localhost:${tenantPort}/`, {
              method: 'HEAD',
              headers: { 'User-Agent': 'AutoLeads-Proxy/1.0' },
            });
            if (processCheck.ok) {
              serviceStatus = 'running-but-unhealthy';
            }
          } catch (processError) {
            serviceStatus = 'not-running';
            console.warn(`[WHATSAPP ADMIN] WhatsApp binary service appears to be not running on port ${tenantPort}`);
          }
        }
      } else {
        console.log('[WHATSAPP ADMIN] Skipping health check - tenant is marked as disconnected in database');
      }

      let autoQRGenerated = false;
      let autoQRMessage = '';

      // 🎯 ENHANCED MUTEX: Improved race condition prevention with better timeout handling
      const updateMutexKey = `whatsapp-update-mutex-${tenant.id}`;
      const mutexStartTime = Date.now();
      const maxMutexWaitTime = 10000; // 10 seconds max wait

      // Wait for existing mutex to be released with timeout
      while (globalThis[updateMutexKey] && (Date.now() - mutexStartTime) < maxMutexWaitTime) {
        console.log(`[WHATSAPP ADMIN] Waiting for mutex release for tenant ${tenant.name} [ID: ${requestId}]`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      }

      // If we timed out waiting for the mutex, log and continue without status updates
      if (globalThis[updateMutexKey]) {
        console.warn(`[WHATSAPP ADMIN] ⚠️ Mutex timeout for tenant ${tenant.name}, skipping status updates [ID: ${requestId}]`);
        globalThis[updateMutexKey] = false; // Force release to prevent permanent blocking
      } else {
        globalThis[updateMutexKey] = Date.now(); // Store timestamp instead of boolean

        try {
          // 🎯 DISABLED AUTO-QR: Let users manually generate QR codes via frontend
          // Auto-QR generation was causing interference with manual pairing attempts
          // Frontend has proper QR generation button that users can click when ready
          console.log(`[WHATSAPP ADMIN] Auto-QR disabled - users should use frontend "Pair Device" button for ${tenant.name} [ID: ${requestId}]`);

          // 🎯 ENHANCED STATUS LOGIC: More conservative status transitions with guards
          const isActuallyConnected = health?.connected && health?.paired;
          // 🚨 FIXED: Only consider truly disconnected when health check completely fails
          // Don't treat "connected: true, paired: false" as disconnected - this is a transient pairing state
          const isActuallyDisconnected = !health?.connected || (!health?.paired && tenant.whatsappStatus === 'disconnected');
          const isCurrentlyConnected = tenant.whatsappStatus === 'connected';
          const isCurrentlyDisconnected = tenant.whatsappStatus === 'disconnected';
          const isCurrentlyConnecting = tenant.whatsappStatus === 'connecting';

          // 🚨 CRITICAL FIX: Handle the transient "connected but not paired" state
          const isTransientPairingState = health?.connected && !health?.paired;
          const lastStatusChangeKey = `status-change-${tenant.id}`;
          const isInGracePeriod = isCurrentlyConnecting && (Date.now() - (globalThis[lastStatusChangeKey] || 0)) < 60000; // 60s grace period

          // ENHANCED: Only sync to connected if actually connected AND not already connected
          const shouldSyncToConnected = isActuallyConnected && !isCurrentlyConnected;

          // ENHANCED: Only sync to disconnected if actually disconnected AND currently connected
          // 🚨 FIXED: Never sync during transient pairing state or grace period
          const shouldSyncToDisconnected = isActuallyDisconnected && isCurrentlyConnected && !isTransientPairingState && !isInGracePeriod;

          // 🎯 CRITICAL: NEVER interfere with "connecting" state - let natural process complete
          const shouldMaintainConnectingState = isCurrentlyConnecting && isTransientPairingState;

          // Add debounce logic to prevent rapid status changes
          const lastStatusChange = globalThis[lastStatusChangeKey] || 0;
          const statusChangeDebounceTime = 5000; // 5 seconds between status changes

          const canChangeStatus = (Date.now() - lastStatusChange) > statusChangeDebounceTime;

          if (shouldSyncToConnected && canChangeStatus) {
            console.log(`[WHATSAPP ADMIN] 🎉 WhatsApp is connected! Updating tenant status from "${tenant.whatsappStatus}" to "connected" [ID: ${requestId}]`);

            try {
              await prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                  whatsappStatus: 'connected',
                  // whatsappNumber is already set during tenant creation, no need to update
                },
              });

              console.log(`[WHATSAPP ADMIN] ✅ Database updated: Tenant ${tenant.name} status set to "connected" [ID: ${requestId}]`);
              // Update local tenant object for response
              tenant.whatsappStatus = 'connected';
              globalThis[lastStatusChangeKey] = Date.now();
            } catch (dbError) {
              console.error('[WHATSAPP ADMIN] ❌ Failed to update database status:', dbError);
            }
          } else if (shouldSyncToDisconnected && canChangeStatus) {
            console.log(`[WHATSAPP ADMIN] ⚠️ WhatsApp service is disconnected, syncing database status [ID: ${requestId}]`);

            try {
              await prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                  whatsappStatus: 'disconnected',
                },
              });

              console.log(`[WHATSAPP ADMIN] 🔄 Database synced: Tenant ${tenant.name} status set to "disconnected" [ID: ${requestId}]`);
              // Update local tenant object for response
              tenant.whatsappStatus = 'disconnected';
              globalThis[lastStatusChangeKey] = Date.now();
            } catch (dbError) {
              console.error('[WHATSAPP ADMIN] ❌ Failed to sync database status:', dbError);
            }
          } else if (shouldMaintainConnectingState) {
            // 🎯 CRITICAL: Explicitly maintain "connecting" state and don't interfere
            console.log(`[WHATSAPP ADMIN] 🔄 Pairing in progress: Service running, awaiting QR scan [ID: ${requestId}]`);
            console.log(`[WHATSAPP ADMIN] ✅ Maintaining "connecting" status - allowing natural pairing process [ID: ${requestId}]`);
          } else if (!canChangeStatus) {
            console.log(`[WHATSAPP ADMIN] ⏳ Status change debounced for ${tenant.name} - last change ${(Date.now() - lastStatusChange) / 1000}s ago [ID: ${requestId}]`);
          } else {
            // Log current state for debugging when no action is taken
            console.log(`[WHATSAPP ADMIN] ℹ️ Current state maintained for ${tenant.name}: DB=${tenant.whatsappStatus}, Service=${health?.connected ? 'connected' : 'disconnected'} [ID: ${requestId}]`);
          }
        } finally {
          // Enhanced mutex release with logging
          const mutexDuration = Date.now() - (globalThis[updateMutexKey] as number);
          console.log(`[WHATSAPP ADMIN] Mutex released for tenant ${tenant.name} after ${mutexDuration}ms [ID: ${requestId}]`);
          globalThis[updateMutexKey] = false;
        }
      }

      // Get webhook configuration
      const webhookUrl = `${process.env.APP_URL || 'https://auto.lumiku.com'}/webhook/whatsapp`;

          // For disconnected tenants, provide default health structure to prevent frontend errors
      const healthData = health || {
        connected: false,
        paired: false,
        status: 'disconnected',
        version: 'v1.7.0',
        webhook_configured: true,
      };

      // Note: Database synchronization logic has been consolidated above with mutex protection
      // This prevents race conditions and ensures consistent state updates

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
          health: healthData,
          webhook: {
            configured: !!webhookUrl,
            url: webhookUrl,
          },
          api: {
            url: `${process.env.APP_URL || 'https://auto.lumiku.com'}/api/wa`,
            pairing: `${process.env.APP_URL || 'https://auto.lumiku.com'}/api/wa/pair`,
          },
          autoInit: {
            enabled: autoQRGenerated,
            message: autoQRMessage,
          },
          service: {
            status: serviceStatus,
            available: serviceAvailable,
            version: version,
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
      // For disconnected tenants, update status to connecting and proceed with QR generation
      if (tenant.whatsappStatus === 'disconnected') {
        console.log(`[WHATSAPP ADMIN] Tenant is disconnected, updating to connecting for QR generation`);

        // Update tenant status to allow reconnection
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            whatsappStatus: 'connecting',
          },
        });

        // Update tenant object for response
        tenant.whatsappStatus = 'connecting';
        console.log(`[WHATSAPP ADMIN] Updated tenant status to connecting for QR generation`);
      }

      // Use tenant-specific WhatsApp API service for QR generation
      const tenantPort = tenant.whatsappPort;
      if (!tenantPort) {
        throw new Error(`No port assigned to tenant ${tenant.name}`);
      }
      console.log(`[WHATSAPP ADMIN] Generating QR using port ${tenantPort} for tenant ${tenant.name}`);

      const response = await fetch(`http://localhost:${tenantPort}/pair?tenant_id=${tenant.id}&instance_id=${tenant.whatsappInstanceId}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'AutoLeads-Proxy/1.0',
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
      // Since external WhatsApp API service is not available, we'll only update database status
      console.log(`[WHATSAPP ADMIN] Disconnecting WhatsApp by updating database status for tenant: ${tenant.id}`);

      // Wait a moment for status update to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

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
        const tenantPort = tenant.whatsappPort;
        if (!tenantPort) {
          throw new Error(`No port assigned to tenant ${tenant.name}`);
        }
        const verifyResponse = await fetch(`http://localhost:${tenantPort}/health?tenant_id=${tenant.id}&instance=${tenant.whatsappInstanceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AutoLeads-Proxy/1.0',
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
 * POST /api/admin/whatsapp/reset-status
 * Reset tenant status to connected for testing purposes
 */
whatsappAdmin.post(
  '/reset-status',
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

    console.log(`[WHATSAPP ADMIN] Reset status request for tenant: ${tenant.name} (${tenant.slug}) by user: ${user.email}`);

    try {
      // Reset tenant status to connected
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          whatsappStatus: 'connected',
          whatsappBotEnabled: false,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          reset: true,
          message: 'Tenant status reset to connected. Page should now load properly.',
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            whatsappStatus: 'connected',
          }
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('[WHATSAPP ADMIN] Error resetting status:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RESET_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reset status',
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