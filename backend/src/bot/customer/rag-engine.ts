/**
 * RAG Engine (Retrieval-Augmented Generation)
 * Queries database for relevant cars and uses LLM to generate contextual responses
 */

import { PrismaClient } from '../../../../generated/prisma';
import { ZaiClient } from '../../llm/zai';
import { PromptBuilder } from '../../llm/prompt-builder';
import { Intent } from './intent-recognizer';

export class RAGEngine {
  private prisma: PrismaClient;
  private zai: ZaiClient;
  private promptBuilder: PromptBuilder;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.zai = new ZaiClient();
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Generate response using RAG pattern
   */
  async generateResponse(
    tenant: any,
    message: string,
    entities: Intent['entities'],
    queryType: 'general' | 'price' = 'general'
  ): Promise<string> {
    try {
      // 1. Retrieval: Query database for relevant cars
      const cars = await this.retrieveCars(tenant.id, entities);

      // 2. Get conversation history
      const history = await this.getRecentHistory(tenant.id, message);

      // 3. Augmentation: Build prompt with context
      const prompt = this.promptBuilder.buildCustomerPrompt({
        tenant,
        cars,
        message,
        history,
        queryType
      });

      // 4. Generation: Call LLM
      const response = await this.zai.generateResponse(prompt);

      return response;

    } catch (error) {
      console.error('Error in RAG engine:', error);
      return `Maaf, ada kendala teknis. Bisa hubungi kami langsung di ${tenant.whatsappNumber} ya 😊`;
    }
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
}
