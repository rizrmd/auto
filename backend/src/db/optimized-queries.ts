/**
 * Optimized Database Queries
 * Batch operations, proper indexing, and query optimization
 */

import { prisma } from './index';
import { responseCache } from '../cache/response-cache';

/**
 * Optimized query builder with caching and batching
 */
export class OptimizedQueries {
  
  /**
   * Batch tenant lookup with caching
   */
  static async getTenantsByIds(tenantIds: number[]): Promise<Map<number, any>> {
    // Check cache first
    const cached = new Map<number, any>();
    const uncachedIds: number[] = [];

    for (const id of tenantIds) {
      const cachedTenant = responseCache.getCachedTenantData(id);
      if (cachedTenant) {
        cached.set(id, cachedTenant);
      } else {
        uncachedIds.push(id);
      }
    }

    // Batch fetch uncached tenants
    if (uncachedIds.length > 0) {
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: uncachedIds } },
        select: {
          id: true,
          name: true,
          phone: true,
          whatsappNumber: true,
          address: true,
          mapsUrl: true,
          businessHours: true,
          whatsappBotEnabled: true,
          customDomain: true,
          customDomainVerified: true,
          subdomain: true,
          status: true
        }
      });

      // Cache results
      tenants.forEach(tenant => {
        responseCache.cacheTenantData(tenant.id, tenant);
        cached.set(tenant.id, tenant);
      });
    }

    return cached;
  }

  /**
   * Optimized user lookup with phone number indexing
   */
  static async findUserByPhone(
    tenantId: number, 
    phone: string
  ): Promise<any | null> {
    const normalizedPhone = phone.slice(-10); // Last 10 digits
    
    // Check cache first
    const cacheKey = `user:${tenantId}:${normalizedPhone}`;
    const cached = responseCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Optimized query with proper index usage
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { phone: { contains: normalizedPhone } },
          { whatsappNumber: { contains: normalizedPhone } }
        ],
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        whatsappNumber: true,
        status: true
      }
    });

    // Cache result (even if null)
    responseCache.set(cacheKey, user, {
      ttl: 300000, // 5 minutes
      tags: ['user', `tenant:${tenantId}`]
    });

    return user;
  }

  /**
   * Batch lead operations
   */
  static async findOrCreateLeads(
    tenantId: number,
    phoneNumbers: string[]
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Normalize phone numbers
    const normalizedPhones = phoneNumbers.map(phone => ({
      original: phone,
      normalized: phone.replace(/[^0-9]/g, '')
    }));

    // Check cache first
    const uncachedPhones: string[] = [];
    
    for (const { original, normalized } of normalizedPhones) {
      const cacheKey = `lead:${tenantId}:${normalized}`;
      const cached = responseCache.get(cacheKey);
      if (cached) {
        results.set(original, cached);
      } else {
        uncachedPhones.push(normalized);
      }
    }

    // Batch fetch uncached leads
    if (uncachedPhones.length > 0) {
      const leads = await prisma.lead.findMany({
        where: {
          tenantId,
          customerPhone: { in: uncachedPhones }
        },
        select: {
          id: true,
          customerPhone: true,
          customerName: true,
          status: true,
          source: true,
          createdAt: true
        }
      });

      // Cache and map results
      leads.forEach(lead => {
        const cacheKey = `lead:${tenantId}:${lead.customerPhone}`;
        responseCache.set(cacheKey, lead, {
          ttl: 600000, // 10 minutes
          tags: ['lead', `tenant:${tenantId}`]
        });

        // Find original phone number
        const original = normalizedPhones.find(
          p => p.normalized === lead.customerPhone
        )?.original;
        if (original) {
          results.set(original, lead);
        }
      });
    }

    return results;
  }

  /**
   * Optimized car search with proper indexing
   */
  static async searchCars(
    tenantId: number,
    filters: {
      brand?: string;
      model?: string;
      year?: number;
      minPrice?: number;
      maxPrice?: number;
      transmission?: string;
      color?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ cars: any[]; total: number }> {
    // Generate cache key
    const cacheKey = `car_search:${tenantId}:${JSON.stringify(filters)}`;
    
    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build optimized where clause
    const where: any = { tenantId };

    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }
    
    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }
    
    if (filters.year) {
      where.year = filters.year;
    }
    
    if (filters.transmission) {
      where.transmission = filters.transmission;
    }
    
    if (filters.color) {
      where.color = { contains: filters.color, mode: 'insensitive' };
    }
    
    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = 'available'; // Default filter
    }
    
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = BigInt(filters.minPrice);
      }
      if (filters.maxPrice) {
        where.price.lte = BigInt(filters.maxPrice);
      }
    }

    // Execute parallel queries for data and count
    const [cars, totalResult] = await Promise.all([
      prisma.car.findMany({
        where,
        select: {
          id: true,
          displayCode: true,
          publicName: true,
          brand: true,
          model: true,
          year: true,
          color: true,
          transmission: true,
          km: true,
          price: true,
          fuelType: true,
          keyFeatures: true,
          conditionNotes: true,
          photos: true,
          slug: true,
          status: true,
          createdAt: true
        },
        orderBy: [
          { createdAt: 'desc' },
          { displayCode: 'asc' }
        ],
        take: filters.limit || 20,
        skip: filters.offset || 0
      }),
      
      prisma.car.count({ where })
    ]);

    const result = {
      cars,
      total: totalResult
    };

    // Cache result
    responseCache.set(cacheKey, result, {
      ttl: 300000, // 5 minutes
      tags: ['cars', `tenant:${tenantId}`, 'search']
    });

    return result;
  }

  /**
   * Batch message creation with optimized inserts
   */
  static async createMessages(messages: Array<{
    tenantId: number;
    leadId: number;
    sender: string;
    message: string;
    metadata?: any;
  }>): Promise<void> {
    if (messages.length === 0) return;

    // Use createMany for better performance
    await prisma.message.createMany({
      data: messages.map(msg => ({
        tenantId: msg.tenantId,
        leadId: msg.leadId,
        sender: msg.sender,
        message: msg.message,
        metadata: msg.metadata || {},
        createdAt: new Date()
      })),
      skipDuplicates: true
    });

    // Invalidate relevant cache entries
    const tenantIds = [...new Set(messages.map(m => m.tenantId))];
    tenantIds.forEach(tenantId => {
      responseCache.invalidateByTag(`tenant:${tenantId}`);
    });
  }

  /**
   * Optimized conversation history retrieval
   */
  static async getConversationHistory(
    tenantId: number,
    leadId: number,
    limit: number = 10
  ): Promise<Array<{ sender: string; message: string; createdAt: Date }>> {
    const cacheKey = `history:${tenantId}:${leadId}:${limit}`;
    
    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const messages = await prisma.message.findMany({
      where: {
        tenantId,
        leadId
      },
      select: {
        sender: true,
        message: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Cache for shorter time due to frequency
    responseCache.set(cacheKey, messages, {
      ttl: 60000, // 1 minute
      tags: ['history', `tenant:${tenantId}`, `lead:${leadId}`]
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Get popular cars with caching
   */
  static async getPopularCars(
    tenantId: number,
    limit: number = 5
  ): Promise<any[]> {
    const cacheKey = `popular_cars:${tenantId}:${limit}`;
    
    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // This would typically use view counts or leads data
    // For now, return recent available cars
    const cars = await prisma.car.findMany({
      where: {
        tenantId,
        status: 'available'
      },
      select: {
        id: true,
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
        price: true,
        photos: true,
        slug: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Cache for longer period
    responseCache.set(cacheKey, cars, {
      ttl: 1800000, // 30 minutes
      tags: ['cars', `tenant:${tenantId}`, 'popular']
    });

    return cars;
  }

  /**
   * Invalidate tenant-specific cache
   */
  static invalidateTenantCache(tenantId: number): void {
    responseCache.invalidateByTag(`tenant:${tenantId}`);
  }

  /**
   * Get database performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    connectionPool: any;
    cacheStats: any;
    queryStats: any;
  }> {
    try {
      // Get connection pool info (PostgreSQL specific)
      const poolInfo = await prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      return {
        connectionPool: poolInfo[0],
        cacheStats: responseCache.getStats(),
        queryStats: {
          // Add query performance tracking here
        }
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        connectionPool: null,
        cacheStats: responseCache.getStats(),
        queryStats: null
      };
    }
  }
}