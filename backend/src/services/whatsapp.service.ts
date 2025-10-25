/**
 * WhatsApp Web API Integration Service
 * 
 * This service provides integration with the WhatsApp Web API running on localhost:8080
 */

interface WhatsAppHealthResponse {
  success: boolean;
  message: string;
  data: {
    paired: boolean;
    connected: boolean;
    webhook_configured: boolean;
  };
}

interface WhatsAppSendRequest {
  number: string;
  message: string;
}

interface WhatsAppSendResponse {
  success: boolean;
  message: string;
  data?: WhatsAppSendRequest;
}

interface WhatsAppPairResponse {
  success: boolean;
  message: string;
  data: {
    qr_code: string;
    qr_image_url: string;
    expires_in: number;
  };
}

class WhatsAppService {
  private readonly baseUrl = 'http://localhost:8080';

  /**
   * Check WhatsApp API health status
   */
  async health(): Promise<WhatsAppHealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('[WHATSAPP] Health check failed:', error);
      throw new Error('WhatsApp API is not available');
    }
  }

  /**
   * Generate QR code for device pairing
   */
  async pair(): Promise<WhatsAppPairResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/pair`);
      return await response.json();
    } catch (error) {
      console.error('[WHATSAPP] Pair request failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Send WhatsApp message
   */
  async send(number: string, message: string): Promise<WhatsAppSendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number, message }),
      });
      return await response.json();
    } catch (error) {
      console.error('[WHATSAPP] Send request failed:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Check if WhatsApp is paired and ready
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.health();
      return health.success && health.data.paired && health.data.connected;
    } catch {
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
export type {
  WhatsAppHealthResponse,
  WhatsAppSendRequest,
  WhatsAppSendResponse,
  WhatsAppPairResponse,
};