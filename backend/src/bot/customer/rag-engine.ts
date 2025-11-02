/**
 * RAG Engine (Retrieval-Augmented Generation)
 * Queries database for relevant cars and uses LLM to generate contextual responses
 */

import { PrismaClient } from '../../../../generated/prisma';
import { ZaiClient } from '../../llm/zai';
import { PromptBuilder } from '../../llm/prompt-builder';
import { Intent } from './intent-recognizer';
import { SearchAnalyticsService } from '../../../services/search-analytics.service';

export class RAGEngine {
  private prisma: PrismaClient;
  private zai: ZaiClient;
  private promptBuilder: PromptBuilder;
  private searchAnalytics: SearchAnalyticsService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.zai = new ZaiClient();
    this.promptBuilder = new PromptBuilder();
    this.searchAnalytics = new SearchAnalyticsService();
  }

  /**
   * Generate response using RAG pattern with caching
   */
  async generateResponse(
    tenant: any,
    message: string,
    entities: Intent['entities'],
    queryType: 'general' | 'price' = 'general',
    customerPhone?: string
  ): Promise<string> {
    try {
      // Check cache first for common queries
      const cacheKey = this.generateCacheKey(tenant.id, message, entities, queryType);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log('[RAG ENGINE] Cache hit for:', cacheKey);
        return cachedResponse;
      }

      // 1. Retrieval: Query database for relevant cars (with caching)
      const cars = await this.retrieveCarsWithCache(tenant.id, entities);

      // Log search analytics for WhatsApp conversations
      if (customerPhone) {
        try {
          // Extract search keyword from message
          const keyword = this.extractSearchKeyword(message, entities);
          await this.searchAnalytics.logSearch(tenant.id, keyword, cars, 'whatsapp', customerPhone);
        } catch (error) {
          console.error('[RAG ENGINE] Failed to log search analytics:', error);
          // Don't let analytics errors break the main flow
        }
      }

      // 2. Get conversation history (with caching)
      const history = await this.getRecentHistoryWithCache(tenant.id, message);

      // 3. Augmentation: Build prompt with context
      const prompt = this.promptBuilder.buildCustomerPrompt({
        tenant,
        cars,
        message,
        history,
        queryType
      });

      // 4. Generation: Call LLM with timeout
      const response = await Promise.race([
        this.zai.generateResponse(prompt),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('LLM timeout')), 25000)
        )
      ]) as string;

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;

    } catch (error) {
      console.error('Error in RAG engine:', error);
      
      // Return fallback response based on query type
      return this.getFallbackResponse(tenant, message, queryType);
    }
  }

  /**
   * Generate cache key for response
   * @private
   */
  private generateCacheKey(
    tenantId: number,
    message: string,
    entities: Intent['entities'],
    queryType: string
  ): string {
    const normalizedMessage = message.toLowerCase().trim();
    const entityHash = JSON.stringify(entities, Object.keys(entities).sort());
    return `rag:${tenantId}:${queryType}:${normalizedMessage}:${entityHash}`;
  }

  /**
   * Get cached response
   * @private
   */
  private getCachedResponse(cacheKey: string): string | null {
    // This would integrate with the response cache
    // For now, implement simple in-memory cache
    return null; // Placeholder
  }

  /**
   * Cache response
   * @private
   */
  private cacheResponse(cacheKey: string, response: string): void {
    // This would integrate with the response cache
    // For now, no caching
  }

  /**
   * Retrieve cars with caching
   * @private
   */
  private async retrieveCarsWithCache(
    tenantId: number,
    entities: Intent['entities']
  ): Promise<any[]> {
    // Check cache first
    const cacheKey = `cars:${tenantId}:${JSON.stringify(entities)}`;
    
    // For now, call original method
    // TODO: Integrate with responseCache
    return await this.retrieveCars(tenantId, entities);
  }

  /**
   * Get recent history with caching
   * @private
   */
  private async getRecentHistoryWithCache(
    tenantId: number,
    currentMessage: string
  ): Promise<Array<{ sender: string; message: string }>> {
    // Check cache first
    const cacheKey = `history:${tenantId}:${currentMessage.substring(0, 50)}`;
    
    // For now, call original method
    // TODO: Integrate with responseCache
    return await this.getRecentHistory(tenantId, currentMessage);
  }

  /**
   * Get fallback response for errors
   * @private
   */
  private getFallbackResponse(
    tenant: any,
    message: string,
    queryType: string
  ): string {
    const normalizedMessage = message.toLowerCase().trim();

    // Common fallbacks
    if (normalizedMessage.includes('lokasi') || normalizedMessage.includes('alamat')) {
      return `📍 *Lokasi ${tenant.name}*\n\n` +
        `Alamat: ${tenant.address || 'Tidak tersedia'}\n` +
        `${tenant.mapsUrl ? `Google Maps: ${tenant.mapsUrl}\n` : ''}` +
        `\n📞 ${tenant.phone}`;
    }

    if (normalizedMessage.includes('jam buka') || normalizedMessage.includes('buka')) {
      if (tenant.businessHours) {
        let response = `⏰ *Jam Operasional ${tenant.name}*\n\n`;
        const days = {
          mon: 'Senin', tue: 'Selasa', wed: 'Rabu',
          thu: 'Kamis', fri: 'Jumat', sat: 'Sabtu', sun: 'Minggu'
        };
        
        for (const [key, label] of Object.entries(days)) {
          if (tenant.businessHours[key]) {
            const time = tenant.businessHours[key] === 'closed' ? 'Tutup' : tenant.businessHours[key];
            response += `${label}: ${time}\n`;
          }
        }
        return response;
      }
    }

    if (normalizedMessage.includes('kontak') || normalizedMessage.includes('telepon')) {
      return `📞 *Kontak ${tenant.name}*\n\n` +
        `Telepon: ${tenant.phone}\n` +
        `WhatsApp: ${tenant.whatsappNumber}\n` +
        `${tenant.email ? `Email: ${tenant.email}\n` : ''}`;
    }

    // Generic fallback
    return `Maaf, ada kendala teknis. Bisa hubungi kami langsung di ${tenant.whatsappNumber} ya 😊`;
  }

  /**
   * Retrieve relevant cars from database
   */
  private async retrieveCars(
    tenantId: number,
    entities: Intent['entities']
  ): Promise<any[]> {
    const where: any = {
      tenantId,
      status: 'available'
    };

    // Filter by display code if provided
    if (entities.displayCode) {
      where.displayCode = entities.displayCode;
    }

    // Filter by brand
    if (entities.brand) {
      where.brand = {
        contains: entities.brand,
        mode: 'insensitive'
      };
    }

    // Filter by model
    if (entities.model) {
      where.model = {
        contains: entities.model,
        mode: 'insensitive'
      };
    }

    // Filter by year
    if (entities.year) {
      where.year = entities.year;
    }

    // Filter by color
    if (entities.color) {
      where.color = {
        contains: entities.color,
        mode: 'insensitive'
      };
    }

    // Filter by transmission
    if (entities.transmission) {
      where.transmission = entities.transmission;
    }

    // Filter by price range
    if (entities.priceRange) {
      where.price = {};
      if (entities.priceRange.min) {
        where.price.gte = BigInt(entities.priceRange.min);
      }
      if (entities.priceRange.max) {
        where.price.lte = BigInt(entities.priceRange.max);
      }
    }

    try {
      // Get top 3 matching cars
      const cars = await this.prisma.car.findMany({
        where,
        take: 3,
        orderBy: [
          { createdAt: 'desc' }
        ],
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
          slug: true
        }
      });

      return cars;

    } catch (error) {
      console.error('Error retrieving cars:', error);
      return [];
    }
  }

  /**
   * Get recent conversation history
   */
  private async getRecentHistory(
    tenantId: number,
    currentMessage: string
  ): Promise<Array<{ sender: string; message: string }>> {
    try {
      // Get recent messages (last 5)
      const messages = await this.prisma.message.findMany({
        where: {
          tenantId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          sender: true,
          message: true
        }
      });

      return messages.reverse(); // Oldest first

    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Search cars by text (full-text search simulation)
   */
  async searchCars(
    tenantId: number,
    searchTerm: string,
    limit: number = 3
  ): Promise<any[]> {
    try {
      const normalized = searchTerm.toLowerCase();

      const cars = await this.prisma.car.findMany({
        where: {
          tenantId,
          status: 'available',
          OR: [
            { brand: { contains: normalized, mode: 'insensitive' } },
            { model: { contains: normalized, mode: 'insensitive' } },
            { publicName: { contains: normalized, mode: 'insensitive' } },
            { displayCode: { contains: normalized, mode: 'insensitive' } },
            { color: { contains: normalized, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
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
          keyFeatures: true,
          slug: true
        }
      });

      return cars;

    } catch (error) {
      console.error('Error searching cars:', error);
      return [];
    }
  }

  /**
   * Get car by display code
   */
  async getCarByCode(tenantId: number, displayCode: string): Promise<any | null> {
    try {
      const car = await this.prisma.car.findFirst({
        where: {
          tenantId,
          displayCode: displayCode.toUpperCase(),
          status: 'available'
        },
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
          slug: true
        }
      });

      return car;

    } catch (error) {
      console.error('Error getting car by code:', error);
      return null;
    }
  }

  /**
   * Extract search keyword from message and entities
   * @private
   */
  private extractSearchKeyword(message: string, entities: Intent['entities']): string {
    // If we have structured entities, build keyword from them
    if (entities.brand || entities.model || entities.displayCode) {
      const parts: string[] = [];
      if (entities.brand) parts.push(entities.brand);
      if (entities.model) parts.push(entities.model);
      if (entities.year) parts.push(entities.year.toString());
      if (entities.color) parts.push(entities.color);
      if (entities.displayCode) parts.push(entities.displayCode);
      return parts.join(' ');
    }

    // Otherwise, clean and use the original message
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim()
      .substring(0, 100);       // Limit length
  }
}
