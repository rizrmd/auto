/**
 * Timeout Handler Middleware
 * Adds timeout configurations and proper error handling for all operations
 */

import type { Context, Next } from 'hono';
import { TimeoutError } from './error-handler';

interface TimeoutConfig {
  database: number;
  llm: number;
  whatsapp: number;
  webhook: number;
  upload: number;
}

/**
 * Default timeout configurations (in milliseconds)
 */
const DEFAULT_TIMEOUTS: TimeoutConfig = {
  database: 10000,      // 10 seconds
  llm: 30000,          // 30 seconds  
  whatsapp: 15000,      // 15 seconds
  webhook: 60000,       // 60 seconds (total webhook processing)
  upload: 120000        // 2 minutes (for photo uploads)
};

/**
 * Timeout wrapper for async operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation "${operation}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Database timeout wrapper
 */
export function withDatabaseTimeout<T>(promise: Promise<T>): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.database, 'database operation');
}

/**
 * LLM timeout wrapper
 */
export function withLLMTimeout<T>(promise: Promise<T>): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.llm, 'LLM API call');
}

/**
 * WhatsApp timeout wrapper
 */
export function withWhatsAppTimeout<T>(promise: Promise<T>): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.whatsapp, 'WhatsApp API call');
}

/**
 * Upload timeout wrapper
 */
export function withUploadTimeout<T>(promise: Promise<T>): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.upload, 'file upload');
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly monitoringPeriod: number;

  constructor(options: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    monitoringPeriod?: number;
  } = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 300000; // 5 minutes
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`[CIRCUIT BREAKER] ${operationName} - Moving to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        console.log(`[CIRCUIT BREAKER] ${operationName} - Circuit CLOSED`);
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error(`[CIRCUIT BREAKER] ${operationName} - Circuit OPEN (${this.failures} failures)`);
      }
      
      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Global circuit breakers for different services
 */
export const circuitBreakers = {
  llm: new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 30000
  }),
  whatsapp: new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60000
  }),
  database: new CircuitBreaker({
    failureThreshold: 10,
    recoveryTimeout: 10000
  })
};

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    operationName = 'operation'
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        console.error(`[RETRY] ${operationName} failed after ${maxRetries + 1} attempts:`, lastError);
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      console.warn(`[RETRY] ${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Timeout middleware for Hono routes
 */
export function timeoutMiddleware(timeoutMs: number = DEFAULT_TIMEOUTS.webhook) {
  return async (c: Context, next: Next) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Webhook processing timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      await Promise.race([
        next(),
        timeoutPromise
      ]);
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error('[TIMEOUT] Webhook processing timeout:', error.message);
        return c.json({
          success: false,
          error: 'Processing timeout',
          code: 'TIMEOUT'
        }, 408);
      }
      throw error;
    }
  };
}

/**
 * Enhanced error handler with timeout awareness
 */
export function handleTimeoutError(error: any, context: string): {
  shouldRetry: boolean;
  userMessage: string;
  logLevel: 'error' | 'warn' | 'info';
} {
  if (error instanceof TimeoutError) {
    return {
      shouldRetry: true,
      userMessage: 'Maaf, permintaan Anda memakan waktu terlalu lama. Silakan coba lagi.',
      logLevel: 'warn'
    };
  }

  if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
    return {
      shouldRetry: true,
      userMessage: 'Maaf, terjadi kendala teknis. Silakan coba lagi dalam beberapa saat.',
      logLevel: 'warn'
    };
  }

  // Circuit breaker errors
  if (error.message?.includes('Circuit breaker OPEN')) {
    return {
      shouldRetry: false,
      userMessage: 'Maaf, layanan sedang sibuk. Silakan coba lagi beberapa saat lagi.',
      logLevel: 'error'
    };
  }

  // Database connection errors
  if (error.message?.includes('database') || error.code?.startsWith('23')) {
    return {
      shouldRetry: true,
      userMessage: 'Maaf, ada kendala dengan database. Silakan coba lagi.',
      logLevel: 'error'
    };
  }

  // Network errors
  if (error.message?.includes('ECONNRESET') || error.message?.includes('ENOTFOUND')) {
    return {
      shouldRetry: true,
      userMessage: 'Maaf, ada masalah koneksi. Silakan coba lagi.',
      logLevel: 'warn'
    };
  }

  // Default error handling
  return {
    shouldRetry: false,
    userMessage: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi admin.',
    logLevel: 'error'
  };
}

/**
 * Timeout Handler class for managing timeouts across operations
 */
export class TimeoutHandler {
  private timeouts: TimeoutConfig;

  constructor(customTimeouts?: Partial<TimeoutConfig>) {
    this.timeouts = { ...DEFAULT_TIMEOUTS, ...customTimeouts };
  }

  async withTimeout<T>(
    operation: string,
    fn: () => Promise<T>,
    customTimeout?: number
  ): Promise<T> {
    const timeoutMs = customTimeout || this.getTimeoutForOperation(operation);
    
    return withTimeout(fn(), timeoutMs, operation);
  }

  private getTimeoutForOperation(operation: string): number {
    switch (operation) {
      case 'database':
        return this.timeouts.database;
      case 'llm':
        return this.timeouts.llm;
      case 'whatsapp':
      case 'whatsapp-fallback':
        return this.timeouts.whatsapp;
      case 'webhook':
        return this.timeouts.webhook;
      case 'upload':
        return this.timeouts.upload;
      default:
        return 30000; // Default 30 seconds
    }
  }

  setTimeouts(newTimeouts: Partial<TimeoutConfig>): void {
    this.timeouts = { ...this.timeouts, ...newTimeouts };
  }

  getTimeouts(): TimeoutConfig {
    return { ...this.timeouts };
  }
}

/**
 * Performance monitoring for operations
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    timeouts: number;
  }>();

  static async measure<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      this.recordMetric(operationName, Date.now() - startTime, false, false);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error instanceof TimeoutError || error.message?.includes('timeout');
      
      this.recordMetric(operationName, duration, true, isTimeout);
      throw error;
    }
  }

  private static recordMetric(
    operation: string,
    duration: number,
    isError: boolean,
    isTimeout: boolean
  ): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        errors: 0,
        timeouts: 0
      });
    }

    const metric = this.metrics.get(operation)!;
    metric.count++;
    metric.totalTime += duration;
    
    if (isError) metric.errors++;
    if (isTimeout) metric.timeouts++;
  }

  static getMetrics(): Record<string, {
    avgTime: number;
    errorRate: number;
    timeoutRate: number;
    count: number;
  }> {
    const result: Record<string, any> = {};
    
    for (const [operation, metric] of this.metrics.entries()) {
      result[operation] = {
        avgTime: metric.totalTime / metric.count,
        errorRate: metric.errors / metric.count,
        timeoutRate: metric.timeouts / metric.count,
        count: metric.count
      };
    }
    
    return result;
  }

  static reset(): void {
    this.metrics.clear();
  }
}