import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prisma } from '../../db';
import WhatsAppServiceManager from '../../services/whatsapp-service-manager';

const app = new Hono();

/**
 * Enhanced status endpoint with service state management
 */
app.get('/status', logger(), async (c) => {
  try {
    // Get tenant from domain/subdomain
    const host = c.req.header('host') || '';

    // Special handling for PrimaMobil - use hardcoded tenant ID
    let tenant;
    if (host.includes('primamobil')) {
      tenant = await prisma.tenant.findFirst({
        where: { id: 4 }
      });
    } else {
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { subdomain: host },
            { customDomain: host }
          ],
          whatsappBotEnabled: true
        }
      });
    }

    if (!tenant) {
      return c.json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found or WhatsApp not configured',
        },
      }, 404);
    }

    // Get service manager state
    const whatsappManager = WhatsAppServiceManager.getInstance();
    const serviceState = whatsappManager.getState();

    // Check WhatsApp API health
    const apiResponse = await fetch(`http://localhost:8080/health?tenant_id=${tenant.id}&instance=${tenant.whatsappInstanceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AutoLeads-Proxy/1.0',
      },
    });

    let apiHealth = { connected: false, paired: false };
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      apiHealth = data.data || apiHealth;
    }

    return c.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          whatsappNumber: tenant.whatsappNumber,
          whatsappBotEnabled: tenant.whatsappBotEnabled,
        },
        service: {
          manager: serviceState,
          api: apiHealth,
          canPair: whatsappManager.canStartNewPairing(),
          isActive: whatsappManager.isActive(),
        },
        system: {
          timestamp: new Date().toISOString(),
          version: 'v1.4.0-enhanced',
        },
      },
    });
  } catch (error) {
    console.error('[WHATSAPP STATUS] Error checking status:', error);

    return c.json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Failed to check WhatsApp status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 503);
  }
});

/**
 * Reset pairing state endpoint (for cleanup)
 */
app.post('/reset', logger(), async (c) => {
  try {
    const whatsappManager = WhatsAppServiceManager.getInstance();
    await whatsappManager.disconnectPairing('Manual reset requested');

    return c.json({
      success: true,
      message: 'WhatsApp service state reset successfully',
      data: {
        state: whatsappManager.getState(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[WHATSAPP RESET] Error resetting state:', error);

    return c.json({
      success: false,
      error: {
        code: 'RESET_FAILED',
        message: 'Failed to reset WhatsApp service state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

export default app;