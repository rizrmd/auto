/**
 * Rate Limiting Middleware
 *
 * Implements in-memory rate limiting to prevent API abuse.
 */

import type { Context, Next } from 'hono';
import { env } from '../config/env';
import { RateLimitError } from './error-handler';
import type { RateLimitInfo } from '../types/context';

/**
 * Rate limit store entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: Timer | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Get or create rate limit entry for a key
   */
  get(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      const newEntry: RateLimitEntry = {
        count: 0,
        resetTime: now + windowMs,
      };
      this.store.set(key, newEntry);
      return newEntry;
    }

    return entry;
  }

  /**
   * Increment counter for a key
   */
  increment(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.count++;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Destroy the store and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Global rate limit store
 */
const rateLimitStore = new RateLimitStore();

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (c: Context, info: RateLimitInfo) => void;
}

/**
 * Default key generator (uses IP address)
 */
function defaultKeyGenerator(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ratelimit:${ip}`;
}

/**
 * Rate limiting middleware factory
 */
export function rateLimiter(config: RateLimiterConfig = {}) {
  const {
    maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const entry = rateLimitStore.get(key, windowMs);

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const resetInSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000);

      const info: RateLimitInfo = {
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };

      // Call custom handler if provided
      if (onLimitReached) {
        onLimitReached(c, info);
      }

      // Set rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', entry.resetTime.toString());
      c.header('Retry-After', resetInSeconds.toString());

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
      );
    }

    // Increment counter before request
    if (!skipSuccessfulRequests && !skipFailedRequests) {
      rateLimitStore.increment(key);
    }

    // Process request
    await next();

    // Increment counter based on response status
    const status = c.res.status;
    if (skipSuccessfulRequests && status >= 200 && status < 300) {
      // Don't count successful requests
    } else if (skipFailedRequests && status >= 400) {
      // Don't count failed requests
    } else if (skipSuccessfulRequests || skipFailedRequests) {
      rateLimitStore.increment(key);
    }

    // Update rate limit headers
    const updatedEntry = rateLimitStore.get(key, windowMs);
    const remaining = Math.max(0, maxRequests - updatedEntry.count);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', updatedEntry.resetTime.toString());
  };
}

/**
 * Stricter rate limiter for sensitive endpoints (e.g., login)
 */
export function strictRateLimiter() {
  return rateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
}

/**
 * Rate limiter for public API endpoints
 */
export function publicRateLimiter() {
  return rateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  });
}

/**
 * Rate limiter per tenant
 */
export function tenantRateLimiter(maxRequests = 1000, windowMs = 60000) {
  return rateLimiter({
    maxRequests,
    windowMs,
    keyGenerator: (c) => {
      const tenant = c.get('tenant');
      return tenant ? `ratelimit:tenant:${tenant.id}` : defaultKeyGenerator(c);
    },
  });
}

/**
 * Clear rate limit store (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Destroy rate limit store
 */
export function destroyRateLimitStore(): void {
  rateLimitStore.destroy();
}
