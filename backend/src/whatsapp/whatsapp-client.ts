/**
 * WhatsApp Web API Client v1.1.0
 * HTTP-based WhatsApp Web API integration with QR pairing, messaging, and read receipts
 */

interface SendMessageParams {
  target: string;      // Phone number (628xxx)
  message: string;     // Text message
  url?: string;        // Media URL (optional)
  filename?: string;   // Filename for media (optional)
}

interface WhatsAppSendResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface PairResponse {
  success: boolean;
  message?: string;
  data?: {
    qr_code?: string;
    qr_image_url?: string;
    expires_in?: number;
  };
  error?: string;
}

interface HealthResponse {
  success: boolean;
  message?: string;
  data?: {
    paired?: boolean;
    connected?: boolean;
    webhook_configured?: boolean;
  };
}

interface SendImageResult {
  success: boolean;
  imageUrl: string;
  error?: string;
}

export class WhatsAppClient {
  private apiUrl: string;
  private apiKey?: string;
  private baseUrl: string;
  private readonly BASE_DOMAIN = 'https://auto.lumiku.com';

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080/send';
    this.apiKey = process.env.WHATSAPP_API_KEY;

    // Extract base URL for constructing full URLs
    this.baseUrl = this.apiUrl.replace(/\/send.*$/, '');

    if (!this.apiUrl) {
      console.warn('⚠️ WHATSAPP_API_URL not set. Using default: http://localhost:8080/send');
    }

    console.log(`[WHATSAPP] Initialized with API URL: ${this.baseUrl}`);
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(params: SendMessageParams): Promise<WhatsAppSendResponse> {
    try {
      const requestBody: any = {
        number: this.normalizePhoneNumber(params.target),
        message: params.message
      };

      // Add media URL if provided
      if (params.url) {
        requestBody.url = params.url;
      }

      // Add filename if provided
      if (params.filename) {
        requestBody.filename = params.filename;
      }

      // Add API key if available
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const logMessage = params.url
        ? `message with media to ${params.target}`
        : `message to ${params.target}: "${params.message.substring(0, 50)}..."`;

      console.log(`[WHATSAPP] Sending ${logMessage}`);

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
        message: 'Message sent successfully',
        data
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
   * Supports both local paths and full URLs
   * @param target - Phone number
   * @param imageUrl - Full URL or local path (e.g., "uploads/tenant-1/cars/ABC123/1.webp")
   * @param caption - Optional caption for the image
   */
  async sendImage(target: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResponse> {
    try {
      // Normalize image URL
      const fullImageUrl = this.normalizeImageUrl(imageUrl);

      console.log(`[WHATSAPP] Sending image to ${target}: ${fullImageUrl}`);

      // Try sending as media attachment first
      const result = await this.sendImageWithRetry(target, fullImageUrl, caption);

      if (result.success) {
        return result;
      }

      // Fallback: Send image URL as text message
      console.warn(`[WHATSAPP] Media send failed, falling back to text URL`);
      const message = caption ? `${caption}\n\n${fullImageUrl}` : fullImageUrl;
      return await this.sendMessage({
        target,
        message
      });

    } catch (error) {
      console.error('Error in sendImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send image with retry logic
   * @private
   */
  private async sendImageWithRetry(
    target: string,
    imageUrl: string,
    caption?: string,
    maxRetries: number = 3
  ): Promise<WhatsAppSendResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Try different API endpoints
        const result = await this.trySendImageViaAPI(target, imageUrl, caption);

        if (result.success) {
          console.log(`[WHATSAPP] Image sent successfully to ${target} (attempt ${attempt + 1})`);
          return result;
        }

        lastError = new Error(result.error || 'Failed to send image');

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 500;
          console.log(`[WHATSAPP] Retry attempt ${attempt + 1} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[WHATSAPP] Image send attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded'
    };
  }

  /**
   * Try sending image via different API methods
   * @private
   */
  private async trySendImageViaAPI(
     target: string,
     imageUrl: string,
     caption?: string
   ): Promise<WhatsAppSendResponse> {
     // Use v1.4.0 API format with attachments array
     try {
       const response = await this.sendToEndpoint(this.baseUrl + '/send', {
         number: this.normalizePhoneNumber(target),
         message: caption || '',
         attachments: [{
           type: 'image',
           url: imageUrl
         }]
       });

       if (response.success) {
         return response;
       }
     } catch (error) {
       console.error('[WHATSAPP] Failed to send image via v1.4.0 API:', error);
     }

     // Fallback: Send image URL as text message
     console.warn(`[WHATSAPP] Media send failed, falling back to text URL`);
     const message = caption ? `${caption}\n\n${imageUrl}` : imageUrl;
     return await this.sendMessage({
       target,
       message
     });
   }

  /**
   * Send to specific endpoint
   * @private
   */
  private async sendToEndpoint(
    endpoint: string,
    body: any
  ): Promise<WhatsAppSendResponse> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${data.message || 'Unknown error'}`
      };
    }

    return {
      success: true,
      message: 'Image sent successfully',
      data
    };
  }

  /**
   * Normalize image URL - convert local path to full URL
   * @private
   */
  private normalizeImageUrl(imageUrl: string): string {
    // Already a full URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Local path - convert to full URL
    // Remove leading slash if present
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    return `${this.BASE_DOMAIN}/${cleanPath}`;
  }

  /**
   * Extract filename from URL
   * @private
   */
  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

      // If filename has no extension, assume it's an image
      if (!filename.includes('.')) {
        return 'image.jpg';
      }

      return filename;
    } catch {
      // Not a valid URL, try extracting from path
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename || 'image.jpg';
    }
  }

  /**
   * Send multiple images in sequence
   * @param target - Phone number
   * @param imageUrls - Array of image URLs or local paths
   * @param caption - Optional caption (only for first image)
   */
  async sendMultipleImages(
    target: string,
    imageUrls: string[],
    caption?: string
  ): Promise<SendImageResult[]> {
    const results: SendImageResult[] = [];

    console.log(`[WHATSAPP] Sending ${imageUrls.length} images to ${target}`);

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const imageCaption = i === 0 ? caption : undefined;

      try {
        const result = await this.sendImage(target, imageUrl, imageCaption);

        results.push({
          success: result.success,
          imageUrl,
          error: result.error
        });

        if (result.success) {
          console.log(`[WHATSAPP] Image ${i + 1}/${imageUrls.length} sent successfully`);
        } else {
          console.error(`[WHATSAPP] Image ${i + 1}/${imageUrls.length} failed:`, result.error);
        }

        // Add delay between sends to avoid rate limiting (500ms)
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[WHATSAPP] Error sending image ${i + 1}/${imageUrls.length}:`, error);

        results.push({
          success: false,
          imageUrl,
          error: errorMessage
        });

        // Continue sending remaining images even if one fails
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[WHATSAPP] Multiple images send complete: ${successCount}/${imageUrls.length} successful`);

    return results;
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
   * Health check with detailed status
   */
  async healthCheck(): Promise<HealthResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WhatsApp API not configured'
      };
    }

    try {
      const healthUrl = this.baseUrl + '/health';
      const response = await fetch(healthUrl, {
        method: 'GET'
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${data.message || 'Health check failed'}`
        };
      }

      console.log(`[WHATSAPP] Health check successful:`, data);
      return data;

    } catch (error) {
      console.error('[WHATSAPP] Health check failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  /**
   * Check if API is configured and running (simplified version)
   */
  async isHealthy(): Promise<boolean> {
    const health = await this.healthCheck();
    return health.success;
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
   * Generate QR code for pairing
   * Supports both JSON and PNG image formats
   */
  async generateQR(format: 'json' | 'image' = 'json'): Promise<PairResponse> {
    try {
      const pairUrl = format === 'image' 
        ? `${this.baseUrl}/pair?format=image`
        : `${this.baseUrl}/pair`;

      console.log(`[WHATSAPP] Generating QR code (${format} format)`);

      const response = await fetch(pairUrl, {
        method: 'GET'
      });

      if (format === 'image') {
        // For image format, return the image URL
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to generate QR image`);
        }

        const imageUrl = `data:image/png;base64,${await response.text()}`;
        
        return {
          success: true,
          message: 'QR code image generated successfully',
          data: {
            qr_image_url: imageUrl,
            expires_in: 60
          }
        };
      } else {
        // For JSON format, parse the response
        const data = await response.json();

        if (!response.ok) {
          console.error('WhatsApp QR API error:', data);
          return {
            success: false,
            error: `HTTP ${response.status}: ${data.message || 'Failed to generate QR code'}`
          };
        }

        console.log(`[WHATSAPP] QR code generated successfully`);
        return data;
      }

    } catch (error) {
      console.error('Error generating QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate QR code'
      };
    }
  }

  /**
   * Mark messages as read (v1.1.0 enhanced)
   * Uses the built-in read receipt functionality from WhatsApp Web API
   */
  async markAsRead(phone: string, messageIds?: string[]): Promise<WhatsAppSendResponse> {
    try {
      // Use the /read endpoint from v1.1.0
      const readUrl = this.baseUrl + '/read';
      
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

      const data = await response.json();

      if (!response.ok) {
        // If read endpoint doesn't exist, it might be an older version
        if (response.status === 404) {
          console.log(`[WHATSAPP] Read endpoint not available - may be using older API version`);
          return {
            success: true,
            message: 'Read receipts not supported in this version'
          };
        }

        console.error('WhatsApp read API error:', data);
        return {
          success: false,
          error: `HTTP ${response.status}: ${data.message || 'Failed to mark messages as read'}`
        };
      }

      console.log(`[WHATSAPP] Messages marked as read successfully for ${phone}`);
      return {
        success: true,
        message: 'Messages marked as read successfully',
        data
      };

    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark messages as read'
      };
    }
  }

  /**
   * Get API documentation URL
   */
  getSwaggerUrl(): string {
    return `${this.baseUrl}/swagger`;
  }

  /**
   * Get API version information
   */
  async getVersion(): Promise<{ version: string; features: string[] }> {
    try {
      const health = await this.healthCheck();
      
      // Based on the health response, determine available features
      const features = ['send_message'];
      
      if (health.success && health.data?.paired !== undefined) {
        features.push('qr_pairing', 'health_check');
      }
      
      // Try to detect v1.1.0 features
      try {
        const response = await fetch(this.baseUrl + '/read', { method: 'POST', body: '{}' });
        if (response.status !== 404) {
          features.push('read_receipts');
        }
      } catch {
        // Read endpoint not available
      }

      try {
        const response = await fetch(this.baseUrl + '/pair?format=image');
        if (response.ok) {
          features.push('qr_images');
        }
      } catch {
        // QR image endpoint not available
      }

      return {
        version: features.includes('read_receipts') ? '1.1.0' : '1.0.0',
        features
      };
    } catch {
      return {
        version: 'unknown',
        features: []
      };
    }
  }
}