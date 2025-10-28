/**
 * Enhanced Response Cache
 * Multi-layer caching for WhatsApp bot responses
 * - LLM responses
 * - Database query results  
 * - Common bot responses
 * - Tenant-specific data
 */

import { prisma } from '../db';
import { env } from '../config/env';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  tags: string[];
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

/**
 * Multi-layer cache with TTL, tags, and intelligent eviction
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  // Configuration
  private readonly DEFAULT_TTL = 3600000; // 1 hour
  private readonly MAX_SIZE = 10000;
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private readonly MEMORY_THRESHOLD = 50 * 1024 * 1024; // 50MB

  private cleanupTimer: Timer | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get cached data
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Set cache entry with options
   */
  set<T = any>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): void {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const tags = options.tags || [];

    // Check memory usage
    if (this.getMemoryUsage() > this.MEMORY_THRESHOLD) {
      this.evictLowPriority();
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      tags
    };

    this.cache.set(key, entry);

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Enforce size limit
    if (this.cache.size > this.MAX_SIZE) {
      this.evictByLRU();
    }
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Remove from tag index
    entry.tags.forEach(tag => {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    this.cache.delete(key);
    return true;
  }

  /**
   * Invalidate by tags
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Invalidate multiple tags
   */
  invalidateByTags(tags: string[]): number {
    let total = 0;
    tags.forEach(tag => {
      total += this.invalidateByTag(tag);
    });
    return total;
  }

  /**
   * Generate cache key with context
   */
  generateKey(
    namespace: string,
    identifier: string,
    context?: Record<string, any>
  ): string {
    const parts = [namespace, identifier];
    
    if (context) {
      const contextStr = JSON.stringify(context, Object.keys(context).sort());
      parts.push(Buffer.from(contextStr).toString('base64').substring(0, 16));
    }
    
    return parts.join(':');
  }

  /**
   * Cache LLM response
   */
  cacheLLMResponse(
    tenantId: number,
    prompt: string,
    response: string,
    context?: any
  ): void {
    const key = this.generateKey('llm', `${tenantId}:${this.hashPrompt(prompt)}`, context);
    
    this.set(key, response, {
      ttl: 1800000, // 30 minutes for LLM responses
      tags: ['llm', `tenant:${tenantId}`, 'response'],
      priority: 'medium'
    });
  }

  /**
   * Get cached LLM response
   */
  getCachedLLMResponse(
    tenantId: number,
    prompt: string,
    context?: any
  ): string | null {
    const key = this.generateKey('llm', `${tenantId}:${this.hashPrompt(prompt)}`, context);
    return this.get<string>(key);
  }

  /**
   * Cache database query result
   */
  cacheQueryResult<T = any>(
    query: string,
    params: any[],
    result: T,
    ttl: number = 300000 // 5 minutes
  ): void {
    const key = this.generateKey('query', this.hashQuery(query, params));
    
    this.set(key, result, {
      ttl,
      tags: ['database', 'query'],
      priority: 'low'
    });
  }

  /**
   * Get cached query result
   */
  getCachedQueryResult<T = any>(query: string, params: any[]): T | null {
    const key = this.generateKey('query', this.hashQuery(query, params));
    return this.get<T>(key);
  }

  /**
   * Cache tenant data
   */
  cacheTenantData(tenantId: number, data: any): void {
    const key = this.generateKey('tenant', tenantId.toString());
    
    this.set(key, data, {
      ttl: 600000, // 10 minutes
      tags: ['tenant', `tenant:${tenantId}`],
      priority: 'high'
    });
  }

  /**
   * Get cached tenant data
   */
  getCachedTenantData(tenantId: number): any | null {
    const key = this.generateKey('tenant', tenantId.toString());
    return this.get(key);
  }

  /**
   * Cache car search results
   */
  cacheCarSearch(
    tenantId: number,
    searchParams: any,
    results: any[]
  ): void {
    const key = this.generateKey('cars', `${tenantId}:search`, searchParams);
    
    this.set(key, results, {
      ttl: 600000, // 10 minutes
      tags: ['cars', `tenant:${tenantId}`, 'search'],
      priority: 'medium'
    });
  }

  /**
   * Get cached car search results
   */
  getCachedCarSearch(tenantId: number, searchParams: any): any[] | null {
    const key = this.generateKey('cars', `${tenantId}:search`, searchParams);
    return this.get(key);
  }

  /**
   * Hash prompt for caching
   * @private
   */
  private hashPrompt(prompt: string): string {
    // Simple hash for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash query for caching
   * @private
   */
  private hashQuery(query: string, params: any[]): string {
    const queryData = { query, params };
    const str = JSON.stringify(queryData);
    return this.hashPrompt(str);
  }

  /**
   * Get memory usage estimate
   * @private
   */
  private getMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String size
      size += JSON.stringify(entry.data).length * 2; // Data size
      size += 100; // Entry metadata
    }
    return size;
  }

  /**
   * Evict low priority entries
   * @private
   */
  private evictLowPriority(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by priority and hits
    entries.sort((a, b) => {
      const aPriority = this.getPriorityScore(a[1]);
      const bPriority = this.getPriorityScore(b[1]);
      return aPriority - bPriority;
    });

    // Remove bottom 25%
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Evict by LRU (Least Recently Used)
   * @private
   */
  private evictByLRU(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last access (timestamp + hits)
    entries.sort((a, b) => {
      const aScore = a[1].timestamp + (a[1].hits * 1000);
      const bScore = b[1].timestamp + (b[1].hits * 1000);
      return aScore - bScore;
    });

    // Remove oldest entries
    const toRemove = entries.length - this.MAX_SIZE;
    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Get priority score for entry
   * @private
   */
  private getPriorityScore(entry: CacheEntry): number {
    const baseScore = entry.hits;
    const ageMultiplier = Math.max(1, (Date.now() - entry.timestamp) / 60000); // Age in minutes
    
    return baseScore / ageMultiplier;
  }

  /**
   * Start cleanup timer
   * @private
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Cleanup expired entries
   * @private
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CACHE] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(): Promise<void> {
    console.log('[CACHE] Starting warm up...');
    
    try {
      // Cache active tenants
      const tenants = await prisma.tenant.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          phone: true,
          whatsappNumber: true,
          address: true,
          mapsUrl: true,
          businessHours: true
        }
      });

      tenants.forEach(tenant => {
        this.cacheTenantData(tenant.id, tenant);
      });

      console.log(`[CACHE] Warmed up ${tenants.length} tenants`);
    } catch (error) {
      console.error('[CACHE] Warm up failed:', error);
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
  }
}

// Global cache instance
export const responseCache = new ResponseCache();