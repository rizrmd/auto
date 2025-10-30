/**
 * Super Admin Cache Service
 *
 * Provides caching functionality for Super Admin operations.
 * Improves performance by caching frequently accessed data like analytics,
 * tenant lists, and system health information.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

/**
 * In-memory cache service for Super Admin operations
 */
export class SuperAdminCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  // Cache TTL values in milliseconds
  private readonly TTL = {
    TENANT_LIST: 5 * 60 * 1000,        // 5 minutes
    TENANT_PROFILE: 10 * 60 * 1000,     // 10 minutes
    GLOBAL_ANALYTICS: 15 * 60 * 1000,   // 15 minutes
    TENANT_ANALYTICS: 20 * 60 * 1000,   // 20 minutes
    SYSTEM_HEALTH: 2 * 60 * 1000,       // 2 minutes
    WHATSAPP_METRICS: 5 * 60 * 1000,    // 5 minutes
    STORAGE_METRICS: 10 * 60 * 1000,    // 10 minutes
    SYSTEM_SETTINGS: 30 * 60 * 1000,    // 30 minutes
    PERFORMANCE_METRICS: 3 * 60 * 1000, // 3 minutes
    ERROR_LOGS: 1 * 60 * 1000,          // 1 minute
    ACTIVITY_LOG: 5 * 60 * 1000,        // 5 minutes
  };

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.getDefaultTTL(key),
      key,
    };

    this.cache.set(key, item);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
  }

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);

    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    this.stats.deletes += deleted;
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Clean expired items
   */
  clean(): number {
    let deleted = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        deleted++;
      }
    }

    this.stats.deletes += deleted;
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Get default TTL based on key pattern
   */
  private getDefaultTTL(key: string): number {
    if (key.includes('tenant_list')) return this.TTL.TENANT_LIST;
    if (key.includes('tenant_profile')) return this.TTL.TENANT_PROFILE;
    if (key.includes('global_analytics')) return this.TTL.GLOBAL_ANALYTICS;
    if (key.includes('tenant_analytics')) return this.TTL.TENANT_ANALYTICS;
    if (key.includes('system_health')) return this.TTL.SYSTEM_HEALTH;
    if (key.includes('whatsapp_metrics')) return this.TTL.WHATSAPP_METRICS;
    if (key.includes('storage_metrics')) return this.TTL.STORAGE_METRICS;
    if (key.includes('system_settings')) return this.TTL.SYSTEM_SETTINGS;
    if (key.includes('performance_metrics')) return this.TTL.PERFORMANCE_METRICS;
    if (key.includes('error_logs')) return this.TTL.ERROR_LOGS;
    if (key.includes('activity_log')) return this.TTL.ACTIVITY_LOG;

    return 5 * 60 * 1000; // Default 5 minutes
  }

  /**
   * Get or set with cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Invalidate cache by tenant
   */
  invalidateTenant(tenantId: number): void {
    this.clearPattern(`tenant_${tenantId}_`);
    this.clearPattern('tenant_list_');
  }

  /**
   * Invalidate analytics cache
   */
  invalidateAnalytics(): void {
    this.clearPattern('global_analytics');
    this.clearPattern('tenant_analytics');
    this.clearPattern('leaderboard');
    this.clearPattern('revenue_analytics');
    this.clearPattern('growth_analytics');
  }

  /**
   * Invalidate monitoring cache
   */
  invalidateMonitoring(): void {
    this.clearPattern('system_health');
    this.clearPattern('whatsapp_metrics');
    this.clearPattern('storage_metrics');
    this.clearPattern('performance_metrics');
    this.clearPattern('error_logs');
  }

  /**
   * Invalidate settings cache
   */
  invalidateSettings(): void {
    this.clearPattern('system_settings');
  }

  /**
   * Get cache keys by pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys());

    if (!pattern) {
      return keys;
    }

    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  /**
   * Get cache item info
   */
  getItemInfo(key: string): { exists: boolean; age: number; ttl: number; size: number } | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const age = Date.now() - item.timestamp;
    const size = JSON.stringify(item.data).length;

    return {
      exists: true,
      age,
      ttl: item.ttl,
      size,
    };
  }

  /**
   * Preload common data
   */
  async preloadCommonData(): Promise<void> {
    // This would be called during application startup
    // to warm up the cache with frequently accessed data

    console.log('[SUPER_ADMIN_CACHE] Preloading common data...');

    // Preload tenant list
    try {
      const tenantListKey = 'tenant_list_default';
      // In real implementation, this would fetch actual data
      // this.set(tenantListKey, await fetchTenantList(), this.TTL.TENANT_LIST);
    } catch (error) {
      console.error('[SUPER_ADMIN_CACHE] Failed to preload tenant list:', error);
    }

    // Preload system health
    try {
      const healthKey = 'system_health_default';
      // this.set(healthKey, await fetchSystemHealth(), this.TTL.SYSTEM_HEALTH);
    } catch (error) {
      console.error('[SUPER_ADMIN_CACHE] Failed to preload system health:', error);
    }

    console.log('[SUPER_ADMIN_CACHE] Preload completed');
  }

  /**
   * Cache warming for specific tenant
   */
  async warmTenantCache(tenantId: number): Promise<void> {
    console.log(`[SUPER_ADMIN_CACHE] Warming cache for tenant ${tenantId}...`);

    try {
      // Warm tenant profile
      const profileKey = `tenant_profile_${tenantId}`;
      // this.set(profileKey, await fetchTenantProfile(tenantId), this.TTL.TENANT_PROFILE);

      // Warm tenant analytics
      const analyticsKey = `tenant_analytics_${tenantId}_default`;
      // this.set(analyticsKey, await fetchTenantAnalytics(tenantId), this.TTL.TENANT_ANALYTICS);

      console.log(`[SUPER_ADMIN_CACHE] Cache warming completed for tenant ${tenantId}`);
    } catch (error) {
      console.error(`[SUPER_ADMIN_CACHE] Failed to warm cache for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Export cache for backup/migration
   */
  export(): { items: Array<{ key: string; data: any; ttl: number }>; stats: CacheStats } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      data: item.data,
      ttl: item.ttl,
    }));

    return {
      items,
      stats: { ...this.stats },
    };
  }

  /**
   * Import cache from backup
   */
  import(exportedData: { items: Array<{ key: string; data: any; ttl: number }> }): void {
    this.clear();

    for (const { key, data, ttl } of exportedData.items) {
      this.set(key, data, ttl);
    }

    console.log(`[SUPER_ADMIN_CACHE] Imported ${exportedData.items.length} cache items`);
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(intervalMs: number = 60 * 1000): void {
    setInterval(() => {
      const deleted = this.clean();
      if (deleted > 0) {
        console.log(`[SUPER_ADMIN_CACHE] Auto cleanup removed ${deleted} expired items`);
      }
    }, intervalMs);

    console.log(`[SUPER_ADMIN_CACHE] Auto cleanup started (interval: ${intervalMs}ms)`);
  }
}

/**
 * Global cache instance
 */
export const superAdminCache = new SuperAdminCacheService();

/**
 * Cache middleware for Hono routes
 */
export function cacheMiddleware(key: string, ttl?: number) {
  return async (c: any, next: any) => {
    const cacheKey = `${key}:${c.req.method}:${c.req.url}`;

    // Try to get from cache
    const cached = superAdminCache.get(cacheKey);
    if (cached) {
      c.header('X-Cache', 'HIT');
      return c.json(cached);
    }

    // Execute the route handler
    await next();

    // Cache the response if successful
    if (c.res.status === 200) {
      const responseData = await c.res.json();
      superAdminCache.set(cacheKey, responseData, ttl);
      c.header('X-Cache', 'MISS');
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(pattern: string) {
  return async (c: any, next: any) => {
    await next();

    // Invalidate cache after successful operation
    if (c.res.status < 300) {
      const deleted = superAdminCache.clearPattern(pattern);
      if (deleted > 0) {
        c.header('X-Cache-Invalidated', deleted.toString());
      }
    }
  };
}