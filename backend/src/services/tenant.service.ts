/**
 * Tenant Service
 *
 * Handles tenant lookup, validation, and caching.
 */

import { prisma } from '../db';
import type { Tenant } from '../../../generated/prisma';
import { CACHE_KEYS, TENANT_ACTIVE_STATUSES } from '../config/constants';
import { env } from '../config/env';

/**
 * Simple in-memory cache for tenant lookups
 */
class TenantCache {
  private cache = new Map<string, { tenant: Tenant; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = env.CACHE_TTL_SECONDS) {
    this.ttl = ttlSeconds * 1000; // Convert to milliseconds
  }

  get(key: string): Tenant | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.tenant;
  }

  set(key: string, tenant: Tenant): void {
    this.cache.set(key, {
      tenant,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  invalidateTenant(tenantId: number): void {
    // Remove all cache entries for this tenant
    for (const [key, value] of this.cache.entries()) {
      if (value.tenant.id === tenantId) {
        this.cache.delete(key);
      }
    }
  }
}

const tenantCache = new TenantCache();

/**
 * Tenant Service Class
 */
export class TenantService {
  /**
   * Find tenant by domain (subdomain or custom domain)
   */
  async findByDomain(
    domain: string,
    type: 'subdomain' | 'customDomain' = 'subdomain'
  ): Promise<Tenant | null> {
    const cacheKey = CACHE_KEYS.TENANT_BY_DOMAIN(domain);

    // Check cache first
    const cached = tenantCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const tenant = await prisma.tenant.findFirst({
      where:
        type === 'subdomain'
          ? { subdomain: domain }
          : { customDomain: domain, customDomainVerified: true },
    });

    // Cache result if found
    if (tenant) {
      tenantCache.set(cacheKey, tenant);
    }

    return tenant;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: number): Promise<Tenant | null> {
    const cacheKey = CACHE_KEYS.TENANT_BY_ID(id);

    // Check cache first
    const cached = tenantCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    // Cache result if found
    if (tenant) {
      tenantCache.set(cacheKey, tenant);
    }

    return tenant;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Check if tenant is active
   */
  isActive(tenant: Tenant): boolean {
    return TENANT_ACTIVE_STATUSES.includes(tenant.status as any);
  }

  /**
   * Check if tenant trial has expired
   */
  isTrialExpired(tenant: Tenant): boolean {
    if (tenant.status !== 'trial' || !tenant.trialEndsAt) {
      return false;
    }

    return new Date(tenant.trialEndsAt) < new Date();
  }

  /**
   * Check if tenant subscription has expired
   */
  isSubscriptionExpired(tenant: Tenant): boolean {
    if (!tenant.planExpiresAt) {
      return false;
    }

    return new Date(tenant.planExpiresAt) < new Date();
  }

  /**
   * Get tenant with active status validation
   */
  async getActiveTenant(id: number): Promise<Tenant | null> {
    const tenant = await this.findById(id);

    if (!tenant || !this.isActive(tenant)) {
      return null;
    }

    return tenant;
  }

  /**
   * Invalidate cache for a tenant
   */
  invalidateCache(tenant: Tenant): void {
    tenantCache.invalidateTenant(tenant.id);
  }

  /**
   * Clear all tenant cache
   */
  clearCache(): void {
    tenantCache.invalidateAll();
  }

  /**
   * Get tenant settings with defaults
   */
  getTenantSettings(tenant: Tenant): Record<string, any> {
    const settings = (tenant.settings as Record<string, any>) || {};

    return {
      whatsappBotEnabled: tenant.whatsappBotEnabled,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      ...settings,
    };
  }

  /**
   * Update tenant settings
   */
  async updateSettings(
    tenantId: number,
    settings: Record<string, any>
  ): Promise<Tenant> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    });

    // Invalidate cache
    this.invalidateCache(tenant);

    return tenant;
  }

  /**
   * Get tenant statistics
   */
  async getStats(tenantId: number): Promise<{
    totalCars: number;
    availableCars: number;
    soldCars: number;
    totalLeads: number;
    newLeads: number;
    hotLeads: number;
  }> {
    const [
      totalCars,
      availableCars,
      soldCars,
      totalLeads,
      newLeads,
      hotLeads,
    ] = await Promise.all([
      prisma.car.count({ where: { tenantId } }),
      prisma.car.count({ where: { tenantId, status: 'available' } }),
      prisma.car.count({ where: { tenantId, status: 'sold' } }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, status: 'new' } }),
      prisma.lead.count({ where: { tenantId, status: 'hot' } }),
    ]);

    return {
      totalCars,
      availableCars,
      soldCars,
      totalLeads,
      newLeads,
      hotLeads,
    };
  }
}
