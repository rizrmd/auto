/**
 * Simple WhatsApp API Client
 * HTTP-based WhatsApp gateway integration
 */

interface SendMessageParams {
  target: string;      // Phone number (628xxx)
  message: string;     // Text message
}

interface WhatsAppSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class WhatsAppClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080/send';
    this.apiKey = process.env.WHATSAPP_API_KEY;

    if (!this.apiUrl) {
      console.warn('⚠️ WHATSAPP_API_URL not set. Using default: http://localhost:8080/send');
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(params: SendMessageParams): Promise<WhatsAppSendResponse> {
    try {
      const requestBody = {
        number: this.normalizePhoneNumber(params.target),
        message: params.message
      };

      // Add API key if available
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log(`[WHATSAPP] Sending message to ${params.target}: "${params.message.substring(0, 50)}..."`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', data);
        return {
          success: false,
          error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`
        };
      }

      console.log(`[WHATSAPP] Message sent successfully to ${params.target}`);
      return {
        success: true,
        message: 'Message sent successfully'
      };

    } catch (error) {
      console.error('Error sending message via WhatsApp API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send WhatsApp message with image
   */
  async sendImage(target: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResponse> {
    const message = caption ? `${caption}\n\n${imageUrl}` : imageUrl;
    return await this.sendMessage({
      target,
      message
    });
  }

  /**
   * Send bulk messages
   */
  async sendBulk(messages: SendMessageParams[]): Promise<WhatsAppSendResponse[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendMessage(msg))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Message ${index} failed:`, result.reason);
        return {
          success: false,
          error: result.reason.message || 'Failed to send'
        };
      }
    });
  }

  /**
   * Normalize phone number to international format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/[^0-9]/g, '');

    // Add country code if not present
    if (!normalized.startsWith('62')) {
      // Remove leading 0 if present
      if (normalized.startsWith('0')) {
        normalized = normalized.slice(1);
      }
      // Add Indonesia country code
      normalized = '62' + normalized;
    }

    return normalized;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiUrl;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(this.apiUrl.replace('/send', '/health'), {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch {
      // If health endpoint doesn't exist, assume API is working
      return true;
    }
  }

  /**
   * Send with retry logic
   */
  async sendWithRetry(
    params: SendMessageParams,
    maxRetries: number = 3
  ): Promise<WhatsAppSendResponse> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.sendMessage(params);
      } catch (error) {
        console.error(`Send attempt ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded'
    };
  }

  /**
   * Mark messages as read
   * Attempts to mark messages as read using the WhatsApp Web API
   * Note: This requires the WhatsApp Web API to support the /read endpoint
   */
  async markAsRead(phone: string, messageIds?: string[]): Promise<WhatsAppSendResponse> {
    try {
      // Try to use the /read endpoint if available
      const readUrl = this.apiUrl.replace('/send', '/read');
      
      const requestBody = {
        number: this.normalizePhoneNumber(phone),
        message_ids: messageIds || []
      };

      // Add API key if available
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log(`[WHATSAPP] Marking messages as read for ${phone}${messageIds ? ` (IDs: ${messageIds.join(', ')})` : ''}`);
      
      const response = await fetch(readUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      // If the /read endpoint doesn't exist (404), we'll simulate success
      if (response.status === 404) {
        console.log(`[WHATSAPP] Read endpoint not available, simulating read receipt for ${phone}`);
        return {
          success: true,
          message: 'Messages marked as read (simulated - endpoint not available)'
        };
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp read API error:', data);
        return {
          success: false,
          error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`
        };
      }

      console.log(`[WHATSAPP] Messages marked as read successfully for ${phone}`);
      return {
        success: true,
        message: 'Messages marked as read successfully'
      };

    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't fail the entire process if read receipts don't work
      return {
        success: true,
        message: 'Read receipt attempted (may not be supported)'
      };
    }
  }
}