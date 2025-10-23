/**
 * LLM Response Cache
 * Caches common responses to reduce LLM API calls and costs
 */

interface CacheEntry {
  response: string;
  timestamp: number;
  hits: number;
}

export class LLMCache {
  private cache: Map<string, CacheEntry>;
  private readonly DEFAULT_TTL = 3600000; // 1 hour in ms
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached response
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;

    return entry.response;
  }

  /**
   * Set cache entry
   */
  set(key: string, response: string): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Generate cache key from context
   */
  generateKey(tenantId: number, message: string, context?: any): string {
    // Normalize message
    const normalized = message.toLowerCase().trim();

    // For common queries, use simple key
    if (this.isCommonQuery(normalized)) {
      return `${tenantId}:common:${normalized}`;
    }

    // For specific queries, include context
    if (context) {
      const contextStr = JSON.stringify(context);
      return `${tenantId}:${normalized}:${contextStr}`;
    }

    return `${tenantId}:${normalized}`;
  }

  /**
   * Check if query is common (should be cached)
   */
  isCommonQuery(message: string): boolean {
    const commonPatterns = [
      'lokasi',
      'alamat',
      'dimana',
      'jam buka',
      'buka jam berapa',
      'telepon',
      'nomor telepon',
      'whatsapp',
      'contact',
      'kontak',
      'cara ke showroom',
      'halo',
      'hai',
      'hi',
      'hello'
    ];

    return commonPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Clean up old and low-hit entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.DEFAULT_TTL) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove low-hit entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sorted = entries
        .filter(([_, entry]) => now - entry.timestamp <= this.DEFAULT_TTL)
        .sort((a, b) => a[1].hits - b[1].hits);

      // Remove bottom 20%
      const toRemove = Math.floor(sorted.length * 0.2);
      sorted.slice(0, toRemove).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalHits: number;
    avgHits: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);

    return {
      size: this.cache.size,
      totalHits,
      avgHits: entries.length > 0 ? totalHits / entries.length : 0
    };
  }

  /**
   * Warm up cache with common responses
   */
  warmUp(tenantId: number, tenant: any): void {
    // Location
    const locationKey = this.generateKey(tenantId, 'lokasi');
    const locationResponse = `📍 *Lokasi ${tenant.name}*\n\n` +
      `Alamat: ${tenant.address || 'Tidak tersedia'}\n` +
      `${tenant.mapsUrl ? `Google Maps: ${tenant.mapsUrl}\n` : ''}` +
      `\n📞 ${tenant.phone}`;

    this.set(locationKey, locationResponse);

    // Business hours
    if (tenant.businessHours) {
      const hoursKey = this.generateKey(tenantId, 'jam buka');
      let hoursResponse = `⏰ *Jam Operasional ${tenant.name}*\n\n`;

      const days = {
        mon: 'Senin',
        tue: 'Selasa',
        wed: 'Rabu',
        thu: 'Kamis',
        fri: 'Jumat',
        sat: 'Sabtu',
        sun: 'Minggu'
      };

      for (const [key, label] of Object.entries(days)) {
        if (tenant.businessHours[key]) {
          const time = tenant.businessHours[key] === 'closed' ? 'Tutup' : tenant.businessHours[key];
          hoursResponse += `${label}: ${time}\n`;
        }
      }

      this.set(hoursKey, hoursResponse);
    }

    // Contact
    const contactKey = this.generateKey(tenantId, 'kontak');
    const contactResponse = `📞 *Kontak ${tenant.name}*\n\n` +
      `Telepon: ${tenant.phone}\n` +
      `WhatsApp: ${tenant.whatsappNumber}\n` +
      `${tenant.email ? `Email: ${tenant.email}\n` : ''}`;

    this.set(contactKey, contactResponse);
  }

  /**
   * Get most popular cached queries
   */
  getTopQueries(limit: number = 10): Array<{ key: string; hits: number }> {
    const entries = Array.from(this.cache.entries());

    return entries
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }
}

// Global cache instance
export const llmCache = new LLMCache();
