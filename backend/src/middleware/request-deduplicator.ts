/**
 * Request Deduplicator
 * Prevents duplicate processing of identical requests
 * Useful for webhook retries and concurrent identical messages
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

interface DeduplicationConfig {
  windowMs: number;
  maxPendingRequests: number;
  cleanupIntervalMs: number;
}

/**
 * Request deduplicator with configurable window
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private config: DeduplicationConfig;
  private cleanupTimer: Timer | null = null;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = {
      windowMs: 30000,        // 30 seconds
      maxPendingRequests: 1000, // Max concurrent unique requests
      cleanupIntervalMs: 60000,  // 1 minute cleanup
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * Execute request with deduplication
   */
  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<T> {
    // Check if identical request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`[DEDUPLICATOR] Request deduplication - waiting for existing: ${key}`);
      return existing.promise as Promise<T>;
    }

    // Check if we're at capacity
    if (this.pendingRequests.size >= this.config.maxPendingRequests) {
      this.evictOldestRequests();
    }

    // Create new pending request
    const promise = new Promise<T>((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        promise: Promise.resolve(),
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.pendingRequests.set(key, pendingRequest);

      // Execute the operation
      operation()
        .then(result => {
          // Resolve all waiting requests
          const requests = Array.from(this.pendingRequests.entries())
            .filter(([k]) => k === key);
          
          requests.forEach(([_, req]) => {
            req.resolve(result);
          });
          
          // Clean up
          this.pendingRequests.delete(key);
        })
        .catch(error => {
          // Reject all waiting requests
          const requests = Array.from(this.pendingRequests.entries())
            .filter(([k]) => k === key);
          
          requests.forEach(([_, req]) => {
            req.reject(error);
          });
          
          // Clean up
          this.pendingRequests.delete(key);
        });
    });

    // Update the promise reference
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.promise = promise;
    }

    return promise;
  }

  /**
   * Generate deduplication key for webhook messages
   */
  generateWebhookKey(payload: {
    sender?: string;
    message?: string;
    messageId?: string;
    timestamp?: string;
  }): string {
    // Use messageId if available (most reliable)
    if (payload.messageId) {
      return `webhook:message:${payload.messageId}`;
    }

    // Fall back to content-based key
    const content = [
      payload.sender || '',
      payload.message || '',
      payload.timestamp || ''
    ].join('|');

    return `webhook:content:${this.hashContent(content)}`;
  }

  /**
   * Generate deduplication key for LLM requests
   */
  generateLLMKey(
    tenantId: number,
    prompt: string,
    context?: any
  ): string {
    const content = [
      tenantId.toString(),
      prompt.substring(0, 200), // First 200 chars
      JSON.stringify(context || {})
    ].join('|');

    return `llm:${this.hashContent(content)}`;
  }

  /**
   * Generate deduplication key for database queries
   */
  generateQueryKey(
    query: string,
    params: any[] = []
  ): string {
    const content = [
      query,
      JSON.stringify(params)
    ].join('|');

    return `query:${this.hashContent(content)}`;
  }

  /**
   * Generate deduplication key for file uploads
   */
  generateUploadKey(
    tenantId: number,
    userPhone: string,
    fileName: string,
    fileSize: number
  ): string {
    const content = [
      tenantId.toString(),
      userPhone,
      fileName,
      fileSize.toString()
    ].join('|');

    return `upload:${this.hashContent(content)}`;
  }

  /**
   * Check if request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get pending requests by pattern
   */
  getPendingByPattern(pattern: string): Array<{ key: string; age: number }> {
    const regex = new RegExp(pattern);
    const now = Date.now();

    return Array.from(this.pendingRequests.entries())
      .filter(([key]) => regex.test(key))
      .map(([key, req]) => ({
        key,
        age: now - req.timestamp
      }));
  }

  /**
   * Cancel pending request
   */
  cancel(key: string, reason?: string): boolean {
    const pending = this.pendingRequests.get(key);
    if (!pending) {
      return false;
    }

    pending.reject(new Error(reason || 'Request cancelled'));
    this.pendingRequests.delete(key);
    
    console.log(`[DEDUPLICATOR] Cancelled request: ${key} - ${reason}`);
    return true;
  }

  /**
   * Cancel requests by pattern
   */
  cancelByPattern(pattern: string, reason?: string): number {
    const regex = new RegExp(pattern);
    let cancelled = 0;

    for (const [key] of this.pendingRequests.entries()) {
      if (regex.test(key)) {
        if (this.cancel(key, reason)) {
          cancelled++;
        }
      }
    }

    return cancelled;
  }

  /**
   * Evict oldest requests
   * @private
   */
  private evictOldestRequests(): void {
    const entries = Array.from(this.pendingRequests.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25%
    const toRemove = Math.floor(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.cancel(key, 'Evicted due to capacity limit');
    }
  }

  /**
   * Hash content for key generation
   * @private
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Start cleanup timer
   * @private
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Clean up expired requests
   * @private
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.config.windowMs) {
        this.cancel(key, 'Request expired');
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[DEDUPLICATOR] Cleaned up ${cleaned} expired requests`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    pending: number;
    oldestRequest: number;
    averageAge: number;
  } {
    const now = Date.now();
    const ages = Array.from(this.pendingRequests.values())
      .map(req => now - req.timestamp);

    return {
      pending: this.pendingRequests.size,
      oldestRequest: ages.length > 0 ? Math.max(...ages) : 0,
      averageAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0
    };
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    for (const [key] of this.pendingRequests.entries()) {
      this.cancel(key, 'Clear all requests');
    }
  }

  /**
   * Destroy deduplicator
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
  }
}

/**
 * Global deduplicator instances for different use cases
 */
export const deduplicators = {
  webhook: new RequestDeduplicator({
    windowMs: 30000,      // 30 seconds for webhooks
    maxPendingRequests: 500
  }),
  
  llm: new RequestDeduplicator({
    windowMs: 60000,       // 1 minute for LLM requests
    maxPendingRequests: 100
  }),
  
  database: new RequestDeduplicator({
    windowMs: 5000,        // 5 seconds for database queries
    maxPendingRequests: 200
  }),
  
  upload: new RequestDeduplicator({
    windowMs: 300000,      // 5 minutes for uploads
    maxPendingRequests: 50
  })
};

/**
 * Hono middleware for webhook deduplication
 */
export function webhookDeduplicator() {
  return async (c: Context, next: Next) => {
    const payload = await c.req.json();
    
    // Generate deduplication key
    const key = deduplicators.webhook.generateWebhookKey(payload);
    
    // Check if already processing
    if (deduplicators.webhook.isPending(key)) {
      console.log(`[WEBHOOK] Duplicate request detected: ${key}`);
      return c.json({
        success: true,
        message: 'Request already being processed',
        duplicate: true
      }, 200);
    }

    // Execute with deduplication
    try {
      await deduplicators.webhook.execute(key, async () => {
        await next();
      });
    } catch (error) {
      console.error('[WEBHOOK] Deduplicated request failed:', error);
      throw error;
    }

    return c.body; // Response already set by next()
  };
}