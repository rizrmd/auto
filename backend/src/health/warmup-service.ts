/**
 * Warmup Service
 * Pre-warms critical services and data to prevent cold starts
 */

import { serviceContainer } from '../services/service-container';
import { responseCache } from '../cache/response-cache';
import { healthChecker } from './health-checker';
import { OptimizedQueries } from '../db/optimized-queries';

interface WarmupConfig {
  enableDatabaseWarmup: boolean;
  enableLLMWarmup: boolean;
  enableWhatsAppWarmup: boolean;
  enableCacheWarmup: boolean;
  enableConnectionWarmup: boolean;
  warmupTimeout: number;
}

/**
 * Service warmup manager
 */
export class WarmupService {
  private config: WarmupConfig;
  private isWarmedUp = false;
  private warmupStartTime = 0;

  constructor(config: Partial<WarmupConfig> = {}) {
    this.config = {
      enableDatabaseWarmup: true,
      enableLLMWarmup: true,
      enableWhatsAppWarmup: true,
      enableCacheWarmup: true,
      enableConnectionWarmup: true,
      warmupTimeout: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Perform complete warmup sequence
   */
  async warmUp(): Promise<{
    success: boolean;
    duration: number;
    results: Record<string, any>;
  }> {
    if (this.isWarmedUp) {
      console.log('[WARMUP] Services already warmed up');
      return {
        success: true,
        duration: 0,
        results: { alreadyWarmed: true }
      };
    }

    this.warmupStartTime = Date.now();
    console.log('[WARMUP] Starting service warmup...');

    const results: Record<string, any> = {};
    let success = true;

    try {
      // Initialize service container first
      await this.initializeServiceContainer();

      // Warm up services in parallel with dependency order
      const warmupTasks = [];

      if (this.config.enableDatabaseWarmup) {
        warmupTasks.push(this.warmUpDatabase());
      }

      if (this.config.enableCacheWarmup) {
        warmupTasks.push(this.warmUpCache());
      }

      if (this.config.enableLLMWarmup) {
        warmupTasks.push(this.warmUpLLM());
      }

      if (this.config.enableWhatsAppWarmup) {
        warmupTasks.push(this.warmUpWhatsApp());
      }

      if (this.config.enableConnectionWarmup) {
        warmupTasks.push(this.warmUpConnections());
      }

      // Execute warmup tasks with timeout
      const warmupResults = await Promise.race([
        Promise.allSettled(warmupTasks),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Warmup timeout')), this.config.warmupTimeout)
        )
      ]);

      // Process results
      if (Array.isArray(warmupResults)) {
        const taskNames = ['database', 'cache', 'llm', 'whatsapp', 'connections'];
        
        warmupResults.forEach((result, index) => {
          const taskName = taskNames[index];
          if (result.status === 'fulfilled') {
            results[taskName] = { success: true, data: result.value };
          } else {
            results[taskName] = { success: false, error: result.reason };
            success = false;
          }
        });
      }

      // Final health check
      const healthStatus = await healthChecker.checkHealth();
      results.healthCheck = healthStatus;

      this.isWarmedUp = success && healthStatus.status === 'healthy';
      
      const duration = Date.now() - this.warmupStartTime;
      
      console.log(`[WARMUP] Warmup completed in ${duration}ms - Success: ${this.isWarmedUp}`);
      
      return {
        success: this.isWarmedUp,
        duration,
        results
      };

    } catch (error) {
      console.error('[WARMUP] Warmup failed:', error);
      
      return {
        success: false,
        duration: Date.now() - this.warmupStartTime,
        results: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Initialize service container
   * @private
   */
  private async initializeServiceContainer(): Promise<void> {
    try {
      await serviceContainer.initialize();
      console.log('[WARMUP] Service container initialized');
    } catch (error) {
      console.error('[WARMUP] Service container initialization failed:', error);
      throw error;
    }
  }

  /**
   * Warm up database connections and queries
   * @private
   */
  private async warmUpDatabase(): Promise<any> {
    console.log('[WARMUP] Warming up database...');
    
    try {
      // Test basic connection
      await serviceContainer.prisma.$queryRaw`SELECT 1`;
      
      // Warm up common queries
      await Promise.allSettled([
        // Get active tenants
        serviceContainer.prisma.tenant.findMany({
          where: { status: 'active' },
          take: 5,
          select: { id: true, name: true, status: true }
        }),
        
        // Get recent cars
        serviceContainer.prisma.car.findMany({
          where: { status: 'available' },
          take: 5,
          select: { id: true, displayCode: true, brand: true }
        }),
        
        // Get performance metrics
        OptimizedQueries.getPerformanceMetrics()
      ]);
      
      console.log('[WARMUP] Database warmed up');
      return { success: true };
      
    } catch (error) {
      console.error('[WARMUP] Database warmup failed:', error);
      throw error;
    }
  }

  /**
   * Warm up cache with common data
   * @private
   */
  private async warmUpCache(): Promise<any> {
    console.log('[WARMUP] Warming up cache...');
    
    try {
      await responseCache.warmUp();
      
      // Pre-cache common responses
      const commonResponses = [
        { key: 'greeting', value: 'Halo! Ada yang bisa saya bantu?' },
        { key: 'location', value: 'Silakan kunjungi showroom kami.' },
        { key: 'contact', value: 'Hubungi kami di nomor berikut.' }
      ];
      
      commonResponses.forEach(response => {
        responseCache.set(`common:${response.key}`, response.value, {
          ttl: 3600000, // 1 hour
          tags: ['common', 'response']
        });
      });
      
      console.log('[WARMUP] Cache warmed up');
      return { success: true, cachedItems: commonResponses.length };
      
    } catch (error) {
      console.error('[WARMUP] Cache warmup failed:', error);
      throw error;
    }
  }

  /**
   * Warm up LLM connections
   * @private
   */
  private async warmUpLLM(): Promise<any> {
    console.log('[WARMUP] Warming up LLM...');
    
    try {
      const isHealthy = await serviceContainer.zaiClient.healthCheck();
      
      if (isHealthy) {
        // Make a lightweight test call
        await serviceContainer.zaiClient.generateResponse('Hi');
        console.log('[WARMUP] LLM warmed up');
        return { success: true };
      } else {
        throw new Error('LLM health check failed');
      }
      
    } catch (error) {
      console.error('[WARMUP] LLM warmup failed:', error);
      throw error;
    }
  }

  /**
   * Warm up WhatsApp connections
   * @private
   */
  private async warmUpWhatsApp(): Promise<any> {
    console.log('[WARMUP] Warming up WhatsApp...');
    
    try {
      const healthResult = await serviceContainer.whatsappClient.healthCheck();
      
      if (healthResult.success) {
        console.log('[WARMUP] WhatsApp warmed up');
        return { success: true, configured: healthResult.configured };
      } else {
        console.warn('[WARMUP] WhatsApp not configured:', healthResult.error);
        return { success: false, notConfigured: true };
      }
      
    } catch (error) {
      console.error('[WARMUP] WhatsApp warmup failed:', error);
      throw error;
    }
  }

  /**
   * Warm up all connections
   * @private
   */
  private async warmUpConnections(): Promise<any> {
    console.log('[WARMUP] Warming up connections...');
    
    try {
      // This would establish connection pools
      // For now, just verify services are accessible
      
      const connectionTests = await Promise.allSettled([
        serviceContainer.stateManager.healthCheck?.(),
        serviceContainer.botOrchestrator.healthCheck(),
      ]);
      
      const successCount = connectionTests.filter(r => r.status === 'fulfilled').length;
      
      console.log(`[WARMUP] Connections warmed up (${successCount}/${connectionTests.length})`);
      return { success: true, connections: successCount };
      
    } catch (error) {
      console.error('[WARMUP] Connection warmup failed:', error);
      throw error;
    }
  }

  /**
   * Check if services are warmed up
   */
  isReady(): boolean {
    return this.isWarmedUp;
  }

  /**
   * Get warmup status
   */
  getStatus(): {
    isWarmedUp: boolean;
    warmupDuration: number;
    config: WarmupConfig;
  } {
    return {
      isWarmedUp: this.isWarmedUp,
      warmupDuration: this.warmupStartTime > 0 ? Date.now() - this.warmupStartTime : 0,
      config: this.config
    };
  }

  /**
   * Reset warmup status
   */
  reset(): void {
    this.isWarmedUp = false;
    this.warmupStartTime = 0;
    console.log('[WARMUP] Warmup status reset');
  }

  /**
   * Force re-warmup
   */
  async reWarmUp(): Promise<any> {
    this.reset();
    return await this.warmUp();
  }
}

// Global warmup service instance
export const warmupService = new WarmupService();