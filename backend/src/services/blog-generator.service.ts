/**
 * Blog Generator Service
 *
 * AI-powered blog content generation using z.ai.
 * Generates complete blog posts with SEO optimization.
 */

import { ZaiClient } from '../llm/zai';
import {
  buildBlogPrompt,
  buildSEOPrompt,
  buildCarDetectionPrompt,
  buildExcerptPrompt,
  parseAIResponse,
} from '../llm/blog-prompt-builder';
import type {
  BlogCategory,
  AITone,
  GeneratedBlogContent,
  GenerateBlogContentRequest,
} from '../types/blog';
import { prisma } from '../db';
import { BadRequestError } from '../middleware/error-handler';

/**
 * Car info for AI context
 */
interface CarInfo {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: string;
  displayCode: string;
  keyFeatures: string[];
}

/**
 * AI response structure
 */
interface AIBlogResponse {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  tags: string[];
  suggestedCarIds?: number[];
}

/**
 * Blog Generator Service Class
 */
export class BlogGeneratorService {
  private zaiClient: ZaiClient;

  constructor() {
    this.zaiClient = new ZaiClient();
  }

  /**
   * Generate complete blog post with AI
   */
  async generateBlogPost(
    tenantId: number,
    params: GenerateBlogContentRequest
  ): Promise<GeneratedBlogContent> {
    const { prompt, category, carIds, keywords, tone, customToneInstructions } = params;

    console.log('[BLOG GENERATOR] Starting generation...', {
      tenantId,
      tenantIdType: typeof tenantId,
      tenantIdValue: JSON.stringify(tenantId),
      category,
      tone,
      carIds: carIds?.length || 0,
      keywords: keywords?.length || 0,
    });

    // Get tenant info
    console.log('[BLOG GENERATOR] About to query tenant with ID:', tenantId, 'type:', typeof tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    console.log('[BLOG GENERATOR] Tenant query result:', tenant);

    if (!tenant) {
      throw new BadRequestError('Tenant not found');
    }

    // Get car information if carIds provided
    let availableCars: CarInfo[] = [];
    if (carIds && carIds.length > 0) {
      const cars = await prisma.car.findMany({
        where: {
          id: { in: carIds },
          tenantId,
          status: 'available',
        },
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          displayCode: true,
          keyFeatures: true,
        },
      });

      availableCars = cars.map((car) => ({
        ...car,
        price: this.formatPrice(car.price),
      }));
    }

    // Build prompt context
    const promptContext = {
      tenantName: tenant.name,
      userPrompt: prompt,
      category,
      availableCars,
      keywords,
      tone: tone || 'balanced',
      customToneInstructions,
    };

    // Generate blog content with AI
    const blogPrompt = buildBlogPrompt(promptContext);

    try {
      // Set higher max tokens for blog generation (blogs are longer)
      this.zaiClient.setMaxTokens(4096);
      this.zaiClient.setTemperature(0.7);

      const aiResponse = await this.zaiClient.generateResponse(blogPrompt);

      console.log('[BLOG GENERATOR] AI response received, parsing...');

      // Parse AI response
      const parsed = parseAIResponse<AIBlogResponse>(aiResponse);

      // Validate required fields
      if (!parsed.title || !parsed.content) {
        throw new Error('AI response missing required fields (title or content)');
      }

      // Generate excerpt if not provided
      let excerpt = parsed.excerpt || '';
      if (!excerpt || excerpt.length < 50) {
        console.log('[BLOG GENERATOR] Generating excerpt...');
        excerpt = await this.generateExcerpt(parsed.title, parsed.content);
      }

      // Generate SEO fields if not provided
      let metaTitle = parsed.metaTitle || '';
      let metaDescription = parsed.metaDescription || '';
      let metaKeywords = parsed.metaKeywords || [];

      if (!metaTitle || !metaDescription || metaKeywords.length === 0) {
        console.log('[BLOG GENERATOR] Generating SEO fields...');
        const seoFields = await this.generateSEOFields(parsed.title, parsed.content);
        metaTitle = metaTitle || seoFields.metaTitle;
        metaDescription = metaDescription || seoFields.metaDescription;
        metaKeywords = metaKeywords.length > 0 ? metaKeywords : seoFields.metaKeywords;
      }

      // Detect car mentions if not provided
      let suggestedCarIds = parsed.suggestedCarIds || [];
      if (suggestedCarIds.length === 0 && availableCars.length > 0) {
        console.log('[BLOG GENERATOR] Detecting car mentions...');
        suggestedCarIds = await this.detectCarMentions(parsed.content, availableCars);
      }

      const result: GeneratedBlogContent = {
        title: parsed.title.trim(),
        content: parsed.content.trim(),
        excerpt: excerpt.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords.map((k) => k.trim()),
        tags: parsed.tags ? parsed.tags.map((t) => t.trim()) : [],
        suggestedCarIds,
      };

      console.log('[BLOG GENERATOR] Generation complete!', {
        titleLength: result.title.length,
        contentLength: result.content.length,
        excerptLength: result.excerpt.length,
        tagsCount: result.tags.length,
        carReferences: result.suggestedCarIds.length,
      });

      return result;
    } catch (error) {
      console.error('[BLOG GENERATOR] Error:', error);

      if (error instanceof Error) {
        throw new BadRequestError(`AI generation failed: ${error.message}`);
      }

      throw new BadRequestError('Failed to generate blog content');
    } finally {
      // Reset to defaults
      this.zaiClient.setMaxTokens(1024);
    }
  }

  /**
   * Generate SEO meta fields
   */
  async generateSEOFields(
    title: string,
    content: string
  ): Promise<{
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    tags: string[];
  }> {
    try {
      const prompt = buildSEOPrompt(title, content);

      this.zaiClient.setMaxTokens(512);
      const response = await this.zaiClient.generateResponse(prompt);

      const parsed = parseAIResponse<{
        metaTitle: string;
        metaDescription: string;
        metaKeywords: string[];
        tags: string[];
      }>(response);

      return {
        metaTitle: parsed.metaTitle || title.substring(0, 60),
        metaDescription: parsed.metaDescription || content.substring(0, 160),
        metaKeywords: parsed.metaKeywords || [],
        tags: parsed.tags || [],
      };
    } catch (error) {
      console.error('[BLOG GENERATOR] SEO generation failed:', error);

      // Fallback to simple extraction
      return {
        metaTitle: title.substring(0, 60),
        metaDescription: content.substring(0, 160).trim() + '...',
        metaKeywords: this.extractKeywords(content),
        tags: [],
      };
    }
  }

  /**
   * Detect car mentions in content
   */
  async detectCarMentions(content: string, availableCars: CarInfo[]): Promise<number[]> {
    if (availableCars.length === 0) {
      return [];
    }

    try {
      const prompt = buildCarDetectionPrompt(content, availableCars);

      this.zaiClient.setMaxTokens(256);
      const response = await this.zaiClient.generateResponse(prompt);

      const parsed = parseAIResponse<{
        detectedCarIds: number[];
        reasoning: string;
      }>(response);

      console.log('[BLOG GENERATOR] Car detection:', {
        detectedCount: parsed.detectedCarIds.length,
        reasoning: parsed.reasoning,
      });

      return parsed.detectedCarIds || [];
    } catch (error) {
      console.error('[BLOG GENERATOR] Car detection failed:', error);

      // Fallback: simple text matching
      const detectedIds: number[] = [];
      availableCars.forEach((car) => {
        const searchTerms = [
          car.brand.toLowerCase(),
          car.model.toLowerCase(),
          car.displayCode.toLowerCase(),
          `${car.brand} ${car.model}`.toLowerCase(),
        ];

        const contentLower = content.toLowerCase();
        if (searchTerms.some((term) => contentLower.includes(term))) {
          detectedIds.push(car.id);
        }
      });

      return detectedIds;
    }
  }

  /**
   * Generate excerpt from content
   */
  async generateExcerpt(title: string, content: string): Promise<string> {
    try {
      const prompt = buildExcerptPrompt(title, content);

      this.zaiClient.setMaxTokens(256);
      const response = await this.zaiClient.generateResponse(prompt);

      return response.trim();
    } catch (error) {
      console.error('[BLOG GENERATOR] Excerpt generation failed:', error);

      // Fallback: extract first 150 words
      const words = content.replace(/[#*_]/g, '').split(/\s+/);
      return words.slice(0, 150).join(' ') + '...';
    }
  }

  /**
   * Format price to Indonesian Rupiah
   */
  private formatPrice(price: bigint): string {
    const priceNum = Number(price);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceNum);
  }

  /**
   * Simple keyword extraction from content
   */
  private extractKeywords(content: string, limit: number = 10): string[] {
    // Remove markdown and special characters
    const cleaned = content
      .replace(/[#*_\[\]()]/g, '')
      .toLowerCase();

    // Split into words
    const words = cleaned.split(/\s+/);

    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      if (word.length > 4 && !this.isStopWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Sort by frequency and take top N
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Check if word is a stop word (common words to ignore)
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'yang',
      'dan',
      'untuk',
      'dengan',
      'dari',
      'pada',
      'adalah',
      'akan',
      'atau',
      'ini',
      'itu',
      'tersebut',
      'juga',
      'dapat',
      'tidak',
      'bisa',
      'lebih',
      'seperti',
      'namun',
      'karena',
      'jika',
      'saat',
      'maka',
      'saja',
      'ada',
      'bila',
      'oleh',
    ];

    return stopWords.includes(word);
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.zaiClient.healthCheck();
    } catch {
      return false;
    }
  }
}
