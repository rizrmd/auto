/**
 * Service Container - Singleton Pattern
 * Centralizes all service instances to eliminate repeated instantiation
 * Provides dependency injection and connection pooling
 */

import { prisma } from '../db';
import { StateManager } from '../bot/state-manager';
import { AdminBotHandler } from '../bot/admin/handler';
import { CustomerBotHandler } from '../bot/customer/handler';
import { BotOrchestrator } from '../bot/index';
import { RAGEngine } from '../bot/customer/rag-engine';
import { IntentRecognizer } from '../bot/customer/intent-recognizer';
import { ZaiClient } from '../llm/zai';
import { WhatsAppClient } from '../whatsapp/whatsapp-client';
import { LeadService } from './lead.service';
import { TenantService } from './tenant.service';
import { CarService } from './car.service';
import { ToolExecutor } from '../llm/tool-executor';
import { HealthChecker } from '../health/health-checker';
import { WarmupService } from '../health/warmup-service';
import { OptimizedQueries } from '../db/optimized-queries';
import { llmCache } from '../llm/cache';
import { env } from '../config/env';

/**
 * Service Container Singleton
 * Manages lifecycle of all service instances
 */
class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private initialized = false;

  // Core services
  private _prisma = prisma;
  private _stateManager: StateManager | null = null;
  private _adminBotHandler: AdminBotHandler | null = null;
  private _customerBotHandler: CustomerBotHandler | null = null;
  private _botOrchestrator: BotOrchestrator | null = null;

  // LLM and AI services
  private _zaiClient: ZaiClient | null = null;
  private _ragEngine: RAGEngine | null = null;
  private _intentRecognizer: IntentRecognizer | null = null;

  // External services
  private _whatsappClient: WhatsAppClient | null = null;

  // Business services
  private _leadService: LeadService | null = null;
  private _tenantService: TenantService | null = null;
  private _carService: CarService | null = null;

  // Optimization services
  private _healthChecker: HealthChecker | null = null;
  private _warmupService: WarmupService | null = null;
  private _optimizedQueries: OptimizedQueries | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize all services (call once on startup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[SERVICE CONTAINER] Already initialized');
      return;
    }

    console.log('[SERVICE CONTAINER] Initializing services...');

    try {
      // Initialize core services
      this._stateManager = new StateManager(this._prisma);
      this._adminBotHandler = new AdminBotHandler(this._prisma, this._stateManager);
      this._customerBotHandler = new CustomerBotHandler(this._prisma, this._stateManager);
      this._botOrchestrator = new BotOrchestrator(this._prisma);

      // Initialize LLM services with connection pooling
      this._zaiClient = new ZaiClient();
      this._ragEngine = new RAGEngine(this._prisma);
      this._intentRecognizer = new IntentRecognizer();

      // Initialize external services
      this._whatsappClient = new WhatsAppClient();

    // Initialize business services
    this._leadService = new LeadService();
    this._tenantService = new TenantService();
    this._carService = new CarService();

    // Initialize optimization services
    this._healthChecker = new HealthChecker();
    this._warmupService = new WarmupService();
    this._optimizedQueries = new OptimizedQueries();

      // Warm up connections and cache
      await this.warmUpServices();

      this.initialized = true;
      console.log('[SERVICE CONTAINER] ✅ All services initialized successfully');

    } catch (error) {
      console.error('[SERVICE CONTAINER] ❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Warm up services to prevent cold starts
   */
  private async warmUpServices(): Promise<void> {
    console.log('[SERVICE CONTAINER] Warming up services...');

    const warmupPromises: Promise<void>[] = [];

    // Warm up database connection
    warmupPromises.push(this.warmUpDatabase());

    // Warm up LLM connection
    warmupPromises.push(this.warmUpLLM());

    // Warm up WhatsApp connection
    warmupPromises.push(this.warmUpWhatsApp());

    // Warm up cache with common data
    warmupPromises.push(this.warmUpCache());

    await Promise.allSettled(warmupPromises);
    console.log('[SERVICE CONTAINER] ✅ Warm up completed');
  }

  /**
   * Warm up database connection
   */
  private async warmUpDatabase(): Promise<void> {
    try {
      await this._prisma.$queryRaw`SELECT 1`;
      console.log('[SERVICE CONTAINER] Database connection warmed up');
    } catch (error) {
      console.warn('[SERVICE CONTAINER] Database warm up failed:', error);
    }
  }

  /**
   * Warm up LLM connection
   */
  private async warmUpLLM(): Promise<void> {
    try {
      if (this._zaiClient) {
        await this._zaiClient.healthCheck();
        console.log('[SERVICE CONTAINER] LLM connection warmed up');
      }
    } catch (error) {
      console.warn('[SERVICE CONTAINER] LLM warm up failed:', error);
    }
  }

  /**
   * Warm up WhatsApp connection
   */
  private async warmUpWhatsApp(): Promise<void> {
    try {
      if (this._whatsappClient) {
        await this._whatsappClient.healthCheck();
        console.log('[SERVICE CONTAINER] WhatsApp connection warmed up');
      }
    } catch (error) {
      console.warn('[SERVICE CONTAINER] WhatsApp warm up failed:', error);
    }
  }

  /**
   * Warm up cache with common data
   */
  private async warmUpCache(): Promise<void> {
    try {
      // Get active tenants and warm up their cache
      const tenants = await this._prisma.tenant.findMany({
        where: { status: 'active' },
        take: 10 // Limit to prevent excessive warm up
      });

      for (const tenant of tenants) {
        llmCache.warmUp(tenant.id, tenant);
      }

      console.log(`[SERVICE CONTAINER] Cache warmed up for ${tenants.length} tenants`);
    } catch (error) {
      console.warn('[SERVICE CONTAINER] Cache warm up failed:', error);
    }
  }

  /**
   * Getters for services
   */
  get prisma() {
    return this._prisma;
  }

  get stateManager(): StateManager {
    if (!this._stateManager) {
      throw new Error('StateManager not initialized');
    }
    return this._stateManager;
  }

  get adminBotHandler(): AdminBotHandler {
    if (!this._adminBotHandler) {
      throw new Error('AdminBotHandler not initialized');
    }
    return this._adminBotHandler;
  }

  get customerBotHandler(): CustomerBotHandler {
    if (!this._customerBotHandler) {
      throw new Error('CustomerBotHandler not initialized');
    }
    return this._customerBotHandler;
  }

  get botOrchestrator(): BotOrchestrator {
    if (!this._botOrchestrator) {
      throw new Error('BotOrchestrator not initialized');
    }
    return this._botOrchestrator;
  }

  get zaiClient(): ZaiClient {
    if (!this._zaiClient) {
      throw new Error('ZaiClient not initialized');
    }
    return this._zaiClient;
  }

  get ragEngine(): RAGEngine {
    if (!this._ragEngine) {
      throw new Error('RAGEngine not initialized');
    }
    return this._ragEngine;
  }

  get intentRecognizer(): IntentRecognizer {
    if (!this._intentRecognizer) {
      throw new Error('IntentRecognizer not initialized');
    }
    return this._intentRecognizer;
  }

  get whatsappClient(): WhatsAppClient {
    if (!this._whatsappClient) {
      throw new Error('WhatsAppClient not initialized');
    }
    return this._whatsappClient;
  }

  get leadService(): LeadService {
    if (!this._leadService) {
      throw new Error('LeadService not initialized');
    }
    return this._leadService;
  }

  get tenantService(): TenantService {
    if (!this._tenantService) {
      throw new Error('TenantService not initialized');
    }
    return this._tenantService;
  }

  get carService(): CarService {
    if (!this._carService) {
      throw new Error('CarService not initialized');
    }
    return this._carService;
  }

  get healthChecker(): HealthChecker {
    if (!this._healthChecker) {
      throw new Error('HealthChecker not initialized');
    }
    return this._healthChecker;
  }

  get warmupService(): WarmupService {
    if (!this._warmupService) {
      throw new Error('WarmupService not initialized');
    }
    return this._warmupService;
  }

  get optimizedQueries(): OptimizedQueries {
    if (!this._optimizedQueries) {
      throw new Error('OptimizedQueries not initialized');
    }
    return this._optimizedQueries;
  }

  getToolExecutor(options: {
    tenantId: number;
    leadId: number;
    customerPhone: string;
    prisma: any;
    whatsapp: WhatsAppClient;
  }): ToolExecutor {
    return new ToolExecutor(options);
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    database: boolean;
    llm: boolean;
    whatsapp: boolean;
    cache: boolean;
    initialized: boolean;
  }> {
    const results = {
      database: false,
      llm: false,
      whatsapp: false,
      cache: true, // Cache is always available
      initialized: this.initialized
    };

    if (!this.initialized) {
      return results;
    }

    const checks = await Promise.allSettled([
      this._prisma.$queryRaw`SELECT 1`,
      this._zaiClient?.healthCheck(),
      this._whatsappClient?.healthCheck()
    ]);

    results.database = checks[0].status === 'fulfilled';
    results.llm = checks[1]?.status === 'fulfilled' || false;
    results.whatsapp = checks[2]?.status === 'fulfilled' || false;

    return results;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[SERVICE CONTAINER] Shutting down services...');

    try {
      // Disconnect database
      await this._prisma.$disconnect();
      console.log('[SERVICE CONTAINER] Database disconnected');

      // Clear cache
      llmCache.clear();
      console.log('[SERVICE CONTAINER] Cache cleared');

      this.initialized = false;
      console.log('[SERVICE CONTAINER] ✅ Shutdown completed');

    } catch (error) {
      console.error('[SERVICE CONTAINER] ❌ Shutdown error:', error);
    }
  }

  /**
   * Reset service container (for testing)
   */
  static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance = null;
    }
  }
}

// Export the class and singleton instance
export { ServiceContainer };
export const serviceContainer = ServiceContainer.getInstance();

// Export types for dependency injection
export type ServiceContainerType = InstanceType<typeof ServiceContainer>;