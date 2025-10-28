/**
 * Media Downloader
 * Downloads media from WhatsApp and saves to storage
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class MediaDownloader {
  // UPDATED: Changed from ./uploads to ./data for persistent storage in Coolify
  // /data directory will be mounted as persistent volume
  private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './data';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:8080';

  /**
   * Resolve URL - convert relative URLs to absolute URLs
   * v1.6.0 sends relative URLs like /images/ABC123.jpg
   */
  private resolveUrl(url: string): string {
    // If URL is relative (starts with /), prepend WhatsApp API base URL
    if (url.startsWith('/')) {
      const baseUrl = this.WHATSAPP_API_URL.replace(/\/send.*$/, ''); // Remove /send if present
      return `${baseUrl}${url}`;
    }
    // Return full URL as-is
    return url;
  }

  /**
   * Fetch with retry logic
   * v1.6.0 race condition: Webhook sent before WhatsApp API finishes downloading
   * Solution: Retry with exponential backoff
   */
  private async fetchWithRetry(
    url: string,
    maxRetries: number = 3,
    delayMs: number = 2000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        // If successful (200) or permanent error (403, 410, etc), return immediately
        if (response.ok || response.status >= 400 && response.status < 500 && response.status !== 404) {
          return response;
        }

        // If 404, it might be a race condition - retry
        if (response.status === 404) {
          console.log(`[MEDIA] Attempt ${attempt}/${maxRetries} - 404 (file not ready yet)`);

          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const waitTime = delayMs * Math.pow(1.5, attempt - 1);
            console.log(`[MEDIA] Waiting ${Math.round(waitTime)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`[MEDIA] Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          const waitTime = delayMs * Math.pow(1.5, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Failed to fetch after retries');
  }

  /**
   * Download and save media file
   * v1.6.0: Includes retry logic for race condition (webhook sent before download completes)
   */
  async downloadAndSave(
    url: string,
    tenantId: number,
    filename: string
  ): Promise<string> {
    try {
      // Create tenant directory if doesn't exist
      const tenantDir = join(this.UPLOAD_DIR, `tenant-${tenantId}`);
      await mkdir(tenantDir, { recursive: true });

      // Resolve URL (handle v1.6.0 relative URLs)
      const fullUrl = this.resolveUrl(url);
      console.log(`[MEDIA] Downloading from: ${fullUrl}`);

      // Download file with retry logic for v1.6.0 race condition
      const response = await this.fetchWithRetry(fullUrl, 3, 2000);

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      // Check file size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      // Get file buffer
      const buffer = await response.arrayBuffer();

      // Save to disk
      const filepath = join(tenantDir, filename);
      await writeFile(filepath, Buffer.from(buffer));

      // Return relative URL (keep /uploads in URL for backward compatibility)
      // Note: /uploads URLs are served from /data directory in backend/index.tsx
      return `/uploads/tenant-${tenantId}/${filename}`;

    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }

  /**
   * Download image from WhatsApp
   */
  async downloadImage(url: string, tenantId: number): Promise<string> {
    const filename = `car-${Date.now()}.jpg`;
    return await this.downloadAndSave(url, tenantId, filename);
  }

  /**
   * Download multiple images
   */
  async downloadImages(urls: string[], tenantId: number): Promise<string[]> {
    const results = await Promise.allSettled(
      urls.map((url, index) => {
        const filename = `car-${Date.now()}-${index}.jpg`;
        return this.downloadAndSave(url, tenantId, filename);
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Download video
   */
  async downloadVideo(url: string, tenantId: number): Promise<string> {
    const filename = `video-${Date.now()}.mp4`;
    return await this.downloadAndSave(url, tenantId, filename);
  }

  /**
   * Download document
   */
  async downloadDocument(url: string, tenantId: number, originalFilename?: string): Promise<string> {
    const filename = originalFilename || `document-${Date.now()}.pdf`;
    return await this.downloadAndSave(url, tenantId, filename);
  }

  /**
   * Validate image URL
   */
  isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Validate video URL
   */
  isValidVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Get file extension from URL
   */
  getFileExtension(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  /**
   * Generate unique filename
   */
  generateFilename(prefix: string = 'file', extension: string = 'jpg'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}.${extension}`;
  }

  /**
   * Clean up old files (call periodically)
   */
  async cleanupOldFiles(tenantId: number, daysOld: number = 30): Promise<void> {
    // TODO: Implement cleanup logic
    // For now, just log
    console.log(`Cleanup called for tenant ${tenantId}, files older than ${daysOld} days`);
  }

  /**
   * Get storage stats
   */
  async getStorageStats(tenantId: number): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    // TODO: Implement storage stats
    // For now, return dummy data
    return {
      totalFiles: 0,
      totalSize: 0
    };
  }
}
