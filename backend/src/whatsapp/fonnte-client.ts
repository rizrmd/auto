/**
 * Fonnte API Client
 * WhatsApp gateway integration via Fonnte
 */

interface SendMessageParams {
  target: string;      // Phone number (628xxx)
  message: string;     // Text message
  url?: string;        // Media URL (optional)
  filename?: string;   // Filename for media (optional)
}

interface FonnteSendResponse {
  status: boolean;
  message?: string;
  detail?: string;
  data?: any;
}

export class FonnteClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.fonnte.com';

  constructor() {
    this.apiKey = process.env.FONNTE_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ FONNTE_API_KEY not set. WhatsApp features will not work.');
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(params: SendMessageParams): Promise<FonnteSendResponse> {
    if (!this.apiKey) {
      throw new Error('Fonnte API key not configured');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('target', this.normalizePhoneNumber(params.target));
      formData.append('message', params.message);

      if (params.url) {
        formData.append('url', params.url);
      }

      if (params.filename) {
        formData.append('filename', params.filename);
      }

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Fonnte API error:', data);
        throw new Error(`Fonnte API error: ${data.message || response.status}`);
      }

      return data;

    } catch (error) {
      console.error('Error sending message via Fonnte:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message with image
   */
  async sendImage(target: string, imageUrl: string, caption?: string): Promise<FonnteSendResponse> {
    return await this.sendMessage({
      target,
      message: caption || '',
      url: imageUrl,
      filename: 'image.jpg'
    });
  }

  /**
   * Send WhatsApp message with document
   */
  async sendDocument(target: string, documentUrl: string, caption?: string, filename?: string): Promise<FonnteSendResponse> {
    return await this.sendMessage({
      target,
      message: caption || '',
      url: documentUrl,
      filename: filename || 'document.pdf'
    });
  }

  /**
   * Send bulk messages
   */
  async sendBulk(messages: SendMessageParams[]): Promise<FonnteSendResponse[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendMessage(msg))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Message ${index} failed:`, result.reason);
        return {
          status: false,
          message: 'Failed to send',
          detail: result.reason.message
        };
      }
    });
  }

  /**
   * Get device status
   */
  async getDeviceStatus(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Fonnte API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/get-devices`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Fonnte API error: ${data.message || response.status}`);
      }

      return data;

    } catch (error) {
      console.error('Error getting device status:', error);
      throw error;
    }
  }

  /**
   * Get message quota
   */
  async getQuota(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Fonnte API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/get-quota`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Fonnte API error: ${data.message || response.status}`);
      }

      return data;

    } catch (error) {
      console.error('Error getting quota:', error);
      throw error;
    }
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
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    // Indonesian numbers: 62 + 8-12 digits
    return /^628\d{8,11}$/.test(normalized);
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    const normalized = this.normalizePhoneNumber(phone);

    if (normalized.startsWith('62')) {
      // Convert 628123456789 to 0812-3456-789
      const local = '0' + normalized.slice(2);
      return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
    }

    return phone;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.getDeviceStatus();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send with retry logic
   */
  async sendWithRetry(
    params: SendMessageParams,
    maxRetries: number = 3
  ): Promise<FonnteSendResponse> {
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

    throw lastError || new Error('Max retries exceeded');
  }
}
