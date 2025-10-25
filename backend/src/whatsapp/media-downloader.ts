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

  /**
   * Download and save media file
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

      // Download file
      const response = await fetch(url);

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
