import { Hono } from 'hono';
import { logger } from 'hono/logger';

const app = new Hono();

/**
 * Proxy endpoint for WhatsApp pairing
 * Proxies requests to http://localhost:8080/pair
 */
app.get('/pair', logger(), async (c) => {
  try {
    const response = await fetch('http://localhost:8080/pair', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
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
        source: 'localhost:8080',
        target: '/api/wa/pair',
      },
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Error proxying to /pair:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'PROXY_ERROR',
        message: 'Failed to connect to WhatsApp API service',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503); // Service Unavailable
  }
});

/**
 * Health check for WhatsApp API service
 */
app.get('/health', async (c) => {
  try {
    const response = await fetch('http://localhost:8080/health', {
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

export default app;