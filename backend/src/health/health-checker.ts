/**
 * Health Checker and Warmup System
 * Monitors service health and performs warmup operations
 */

import { serviceContainer } from '../services/service-container';
import { responseCache } from '../cache/response-cache';
import { deduplicators } from '../middleware/request-deduplicator';
import { circuitBreakers } from '../middleware/timeout-handler';
import { OptimizedQueries } from '../db/optimized-queries';
import { PerformanceMonitor } from '../middleware/timeout-handler';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    llm: ServiceHealth;
    whatsapp: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
  };
  metrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cacheStats: any;
    deduplicatorStats: any;
    circuitBreakerStats: any;
    performanceMetrics: any;
  };
  timestamp: Date;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}

/**
 * Comprehensive health checker with warmup capabilities
 */
export class HealthChecker {
  private startTime = Date.now();
  private healthStatus: HealthStatus | null = null;
  private isWarmingUp = false;
  private warmupPromises: Map<string, Promise<any>> = new Map();
  private healthCheckInterval: Timer | null = null;

  constructor() {
    this.startPeriodicHealthChecks();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const services = await this.checkAllServices();
      const metrics = await this.collectMetrics();
      
      // Determine overall status
      const overallStatus = this.determineOverallStatus(services);
      
      this.healthStatus = {
        status: overallStatus,
        services,
        metrics: {
          ...metrics,
          uptime: Date.now() - this.startTime
        },
        timestamp: new Date()
      };

      console.log(`[HEALTH] Health check completed in ${Date.now() - startTime}ms - Status: ${overallStatus}`);
      
      return this.healthStatus;
      
    } catch (error) {
      console.error('[HEALTH] Health check failed:', error);
      
      return {
        status: 'unhealthy',
        services: {
          database: { status: 'unknown', lastCheck: new Date() },
          llm: { status: 'unknown', lastCheck: new Date() },
          whatsapp: { status: 'unknown', lastCheck: new Date() },
          cache: { status: 'unknown', lastCheck: new Date() },
          memory: { status: 'unknown', lastCheck: new Date() }
        },
        metrics: {
          uptime: Date.now() - this.startTime,
          memoryUsage: process.memoryUsage(),
          cacheStats: responseCache.getStats(),
          deduplicatorStats: this.getDeduplicatorStats(),
          circuitBreakerStats: this.getCircuitBreakerStats(),
          performanceMetrics: PerformanceMonitor.getMetrics()
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check all services
   * @private
   */
  private async checkAllServices(): Promise<HealthStatus['services']> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkLLM(),
      this.checkWhatsApp(),
      this.checkCache(),
      this.checkMemory()
    ]);

    return {
      database: this.parseServiceCheck(checks[0]),
      llm: this.parseServiceCheck(checks[1]),
      whatsapp: this.parseServiceCheck(checks[2]),
      cache: this.parseServiceCheck(checks[3]),
      memory: this.parseServiceCheck(checks[4])
    };
  }

  /**
   * Check database health
   * @private
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      await PerformanceMonitor.measure(
        () => serviceContainer.prisma.$queryRaw`SELECT 1`,
        'database_health_check'
      );
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check LLM service health
   * @private
   */
  private async checkLLM(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const result = await PerformanceMonitor.measure(
        () => serviceContainer.zaiClient.healthCheck(),
        'llm_health_check'
      );
      
      return {
        status: result ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check WhatsApp service health
   * @private
   */
  private async checkWhatsApp(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const result = await PerformanceMonitor.measure(
        () => serviceContainer.whatsappClient.healthCheck(),
        'whatsapp_health_check'
      );
      
      return {
        status: result.success ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        error: result.success ? undefined : result.error,
        lastCheck: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check cache health
   * @private
   */
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Test cache operations
      const testKey = 'health_check_test';
      const testValue = { test: true, timestamp: Date.now() };
      
      responseCache.set(testKey, testValue, { ttl: 5000 });
      const retrieved = responseCache.get(testKey);
      
      responseCache.delete(testKey);
      
      const isHealthy = retrieved && retrieved.test === true;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Check memory health
   * @private
   */
  private async checkMemory(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryUsagePercent < 70) {
        status = 'healthy';
      } else if (memoryUsagePercent < 85) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        status,
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Parse service check result
   * @private
   */
  private parseServiceCheck(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  /**
   * Determine overall health status
   * @private
   */
  private determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(s => s.status);
    
    const unhealthyCount = statuses.filter(s => s === 'unhealthy').length;
    const degradedCount = statuses.filter(s => s === 'degraded').length;
    
    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Collect system metrics
   * @private
   */
  private async collectMetrics(): Promise<Omit<HealthStatus['metrics'], 'uptime'>> {
    return {
      memoryUsage: process.memoryUsage(),
      cacheStats: responseCache.getStats(),
      deduplicatorStats: this.getDeduplicatorStats(),
      circuitBreakerStats: this.getCircuitBreakerStats(),
      performanceMetrics: PerformanceMonitor.getMetrics()
    };
  }

  /**
   * Get deduplicator statistics
   * @private
   */
  private getDeduplicatorStats(): any {
    return {
      webhook: deduplicators.webhook.getStats(),
      llm: deduplicators.llm.getStats(),
      database: deduplicators.database.getStats(),
      upload: deduplicators.upload.getStats()
    };
  }

  /**
   * Get circuit breaker statistics
   * @private
   */
  private getCircuitBreakerStats(): any {
    return {
      llm: {
        state: circuitBreakers.llm.getState(),
        failures: circuitBreakers.llm.getFailures()
      },
      whatsapp: {
        state: circuitBreakers.whatsapp.getState(),
        failures: circuitBreakers.whatsapp.getFailures()
      },
      database: {
        state: circuitBreakers.database.getState(),
        failures: circuitBreakers.database.getFailures()
      }
    };
  }

  /**
   * Warm up all services
   */
  async warmUp(): Promise<void> {
    if (this.isWarmingUp) {
      console.log('[HEALTH] Warm up already in progress');
      return;
    }

    this.isWarmingUp = true;
    console.log('[HEALTH] Starting service warm up...');

    try {
      const warmupTasks = [
        this.warmUpDatabase(),
        this.warmUpLLM(),
        this.warmUpWhatsApp(),
        this.warmUpCache(),
        this.warmUpConnections()
      ];

      await Promise.allSettled(warmupTasks);
      
      console.log('[HEALTH] ✅ Service warm up completed');
      
    } catch (error) {
      console.error('[HEALTH] ❌ Warm up failed:', error);
    } finally {
      this.isWarmingUp = false;
    }
  }

  /**
   * Warm up database connections
   * @private
   */
  private async warmUpDatabase(): Promise<void> {
    try {
      await OptimizedQueries.getPerformanceMetrics();
      console.log('[HEALTH] Database warmed up');
    } catch (error) {
      console.warn('[HEALTH] Database warm up failed:', error);
    }
  }

  /**
   * Warm up LLM connections
   * @private
   */
  private async warmUpLLM(): Promise<void> {
    try {
      await serviceContainer.zaiClient.healthCheck();
      console.log('[HEALTH] LLM warmed up');
    } catch (error) {
      console.warn('[HEALTH] LLM warm up failed:', error);
    }
  }

  /**
   * Warm up WhatsApp connections
   * @private
   */
  private async warmUpWhatsApp(): Promise<void> {
    try {
      await serviceContainer.whatsappClient.healthCheck();
      console.log('[HEALTH] WhatsApp warmed up');
    } catch (error) {
      console.warn('[HEALTH] WhatsApp warm up failed:', error);
    }
  }

  /**
   * Warm up cache
   * @private
   */
  private async warmUpCache(): Promise<void> {
    try {
      await responseCache.warmUp();
      console.log('[HEALTH] Cache warmed up');
    } catch (error) {
      console.warn('[HEALTH] Cache warm up failed:', error);
    }
  }

  /**
   * Warm up all connections
   * @private
   */
  private async warmUpConnections(): Promise<void> {
    try {
      // This would establish connection pools
      console.log('[HEALTH] Connections warmed up');
    } catch (error) {
      console.warn('[HEALTH] Connection warm up failed:', error);
    }
  }

  /**
   * Start periodic health checks
   * @private
   */
  private startPeriodicHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('[HEALTH] Periodic health check failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthStatus | null {
    return this.healthStatus;
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    return this.healthStatus?.status === 'healthy';
  }

  /**
   * Get warm up status
   */
  getWarmUpStatus(): {
    isWarmingUp: boolean;
    warmupTasks: string[];
  } {
    return {
      isWarmingUp: this.isWarmingUp,
      warmupTasks: Array.from(this.warmupPromises.keys())
    };
  }

  /**
   * Reset circuit breakers
   */
  resetCircuitBreakers(): void {
    Object.values(circuitBreakers).forEach(cb => cb.reset());
    console.log('[HEALTH] Circuit breakers reset');
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    PerformanceMonitor.reset();
    console.log('[HEALTH] Performance metrics cleared');
  }

  /**
   * Destroy health checker
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.warmupPromises.clear();
    console.log('[HEALTH] Health checker destroyed');
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();