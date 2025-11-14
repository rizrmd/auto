/**
 * Blog WhatsApp Service
 * Handles blog post creation from WhatsApp with database persistence
 */

import { prisma } from '../db';
import { BlogGeneratorService } from './blog-generator.service';
import type { BlogCategory, AITone } from '../types/blog';

export interface GenerateBlogPostOptions {
  prompt: string;
  tenantId: number;
  authorId: number;
  tone?: AITone;
  carIds?: number[];
  keywords?: string[];
  category?: BlogCategory;
}

export interface GeneratedBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  editUrl: string;
}

export class BlogWhatsAppService {
  private blogGenerator: BlogGeneratorService;

  constructor() {
    this.blogGenerator = new BlogGeneratorService();
  }

  /**
   * Generate blog post from WhatsApp and save to database
   */
  async generateBlogPost(options: GenerateBlogPostOptions): Promise<GeneratedBlogPost> {
    const {
      prompt,
      tenantId,
      authorId,
      tone = 'balanced',
      carIds = [],
      keywords = [],
      category = 'tips_mobil',
    } = options;

    console.log('[BlogWhatsAppService] Generating blog post...', {
      tenantId,
      authorId,
      category,
      tone,
    });

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        subdomain: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Generate content using AI
    const generatedContent = await this.blogGenerator.generateBlogPost(tenantId, {
      prompt,
      category,
      carIds,
      keywords,
      tone,
    });

    console.log('[BlogWhatsAppService] Content generated, creating blog post...');

    // Create slug from title
    const slug = await this.generateSlug(generatedContent.title, tenantId);

    // Create blog post in database
    const blogPost = await prisma.blogPost.create({
      data: {
        tenantId,
        authorId,
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        metaTitle: generatedContent.metaTitle,
        metaDescription: generatedContent.metaDescription,
        metaKeywords: generatedContent.metaKeywords,
        category,
        tags: generatedContent.tags,
        status: 'draft',
        isAiGenerated: true,
        aiPrompt: prompt,
        aiTone: tone,
      },
    });

    console.log('[BlogWhatsAppService] Blog post created:', blogPost.id);

    // Link featured cars if provided
    if (carIds.length > 0) {
      await prisma.blogPostCar.createMany({
        data: carIds.map((carId, index) => ({
          blogPostId: blogPost.id,
          carId,
          position: index,
          showAsCard: true,
        })),
      });

      console.log('[BlogWhatsAppService] Linked', carIds.length, 'cars to blog post');
    }

    // Generate edit URL
    const baseUrl = tenant.customDomain || `${tenant.subdomain}.primamobil.id`;
    const editUrl = `https://${baseUrl}/admin/blog/${blogPost.id}/edit`;

    return {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      category: blogPost.category as BlogCategory,
      editUrl,
    };
  }

  /**
   * Generate unique slug
   */
  private async generateSlug(title: string, tenantId: number): Promise<string> {
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .substring(0, 200);

    // Check uniqueness
    let counter = 1;
    let finalSlug = slug;

    while (true) {
      const exists = await prisma.blogPost.findUnique({
        where: {
          tenantId_slug: {
            tenantId,
            slug: finalSlug,
          },
        },
      });

      if (!exists) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }
}
