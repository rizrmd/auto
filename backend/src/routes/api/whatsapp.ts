import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prisma } from '../../db';

const app = new Hono();

/**
 * Proxy endpoint for WhatsApp pairing
 * Returns QR code image for tenant-specific WhatsApp instance
 */
app.get('/pair', logger(), async (c) => {
  try {
    // Get tenant from domain/subdomain
    const host = c.req.header('host') || '';
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: host },
          { customDomain: host }
        ],
        whatsappBotEnabled: true
      }
    });

    if (!tenant || !tenant.whatsappPort) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found or WhatsApp not configured',
        },
      }, 404);
    }

    console.log(`[WHATSAPP PAIR] Pairing for tenant: ${tenant.name} (${tenant.slug}) on port ${tenant.whatsappPort}`);

    const response = await fetch(`http://localhost:${tenant.whatsappPort}/pair`, {
      method: 'GET',
      headers: {
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API responded with status: ${response.status}`);
    }

    // Check if response is PNG image (new version) or JSON (old version)
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('image/png')) {
      // New version: Direct PNG response
      const imageBuffer = await response.arrayBuffer();
      
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Proxy-By': 'AutoLeads-WhatsApp-Proxy',
          'X-API-Version': 'v1.3.0-direct-png',
        },
      });
    } else {
      // Old version: JSON response with qr_image_url
      const data = await response.json();
      
      if (!data.success || !data.data?.qr_image_url) {
        throw new Error('Invalid response from WhatsApp API');
      }

      // Fetch the QR code image from the provided URL
      const imageResponse = await fetch(data.data.qr_image_url);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch QR image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Proxy-By': 'AutoLeads-WhatsApp-Proxy',
          'X-API-Version': 'v1.3.0-json-fallback',
        },
      });
    }
  } catch (error) {
    console.error('[WHATSAPP PROXY] Error proxying to /pair:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'PROXY_ERROR',
        message: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503); // Service Unavailable
  }
});

/**
 * Health check for WhatsApp API service
 */
app.get('/health', logger(), async (c) => {
  try {
    // Get tenant from domain/subdomain
    const host = c.req.header('host') || '';
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: host },
          { customDomain: host }
        ],
        whatsappBotEnabled: true
      }
    });

    if (!tenant || !tenant.whatsappPort) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found or WhatsApp not configured',
        },
      }, 404);
    }

    const response = await fetch(`http://localhost:${tenant.whatsappPort}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API health check failed: ${response.status}`);
    }

    const data = await response.json();
    
    return c.json({
      success: true,
      data: data,
      proxy: {
        timestamp: new Date().toISOString(),
        status: 'connected',
      },
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Health check failed:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'WhatsApp API service is not responding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503);
  }
});

/**
 * Send message with attachments (images, documents, audio, video)
 */
app.post('/send', logger(), async (c) => {
  try {
    const body = await c.req.json();
    
    // Get tenant from domain/subdomain
    const host = c.req.header('host') || '';
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: host },
          { customDomain: host }
        ],
        whatsappBotEnabled: true
      }
    });

    if (!tenant || !tenant.whatsappPort) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found or WhatsApp not configured',
        },
      }, 404);
    }

    console.log(`[WHATSAPP SEND] Sending via tenant: ${tenant.name} (${tenant.slug}) on port ${tenant.whatsappPort}`);

    const response = await fetch(`http://localhost:${tenant.whatsappPort}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return c.json({
      success: true,
      data: data,
      proxy: {
        timestamp: new Date().toISOString(),
        status: 'connected',
      },
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Error sending message:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'SEND_ERROR',
        message: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503);
  }
});

/**
 * Version check for WhatsApp API service
 */
app.get('/version', async (c) => {
  try {
    // Try to get version from WhatsApp API
    const response = await fetch('http://localhost:8080/', {
      method: 'GET',
      headers: {
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API version check failed: ${response.status}`);
    }

    const text = await response.text();
    
    return c.json({
      success: true,
      data: {
        version: 'Unknown (check manually)',
        response_preview: text.substring(0, 200),
      },
      proxy: {
        timestamp: new Date().toISOString(),
        note: 'WhatsApp API does not expose version endpoint',
      },
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Version check failed:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'VERSION_CHECK_FAILED',
        message: 'Failed to check WhatsApp API version',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503);
  }
});

/**
 * Debug endpoint to check webhook configuration
 */
app.get('/debug', async (c) => {
  try {
    // Try to get debug info from WhatsApp API
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API debug failed: ${response.status}`);
    }

    const data = await response.json();
    
    return c.json({
      success: true,
      data: data,
      proxy: {
        timestamp: new Date().toISOString(),
        configured_webhook_url: process.env.APP_URL ? `${process.env.APP_URL}/webhook/whatsapp` : 'NOT_SET',
        app_url: process.env.APP_URL || 'NOT_SET',
      },
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Debug check failed:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'DEBUG_CHECK_FAILED',
        message: 'Failed to get WhatsApp API debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503);
  }
});

export default app;