/**
 * WhatsApp Admin Routes
 * 
 * Admin endpoints for managing WhatsApp Web API integration
 */

import { Hono } from 'hono';
import { whatsappService } from '../../services/whatsapp.service';

const whatsappRoutes = new Hono();

/**
 * Get WhatsApp service status
 */
whatsappRoutes.get('/status', async (c) => {
  try {
    const status = await whatsappService.health();
    return c.json({
      success: true,
      data: {
        service: 'whatsapp-web-api',
        ...status.data,
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Generate QR code for pairing
 */
whatsappRoutes.get('/pair', async (c) => {
  try {
    const pairData = await whatsappService.pair();
    return c.json({
      success: true,
      data: pairData.data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate QR code',
    }, 500);
  }
});

/**
 * Send test message
 */
whatsappRoutes.post('/send-test', async (c) => {
  try {
    const { number, message } = await c.req.json();
    
    if (!number || !message) {
      return c.json({
        success: false,
        error: 'Number and message are required',
      }, 400);
    }

    const result = await whatsappService.send(number, message);
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }, 500);
  }
});

export default whatsappRoutes;