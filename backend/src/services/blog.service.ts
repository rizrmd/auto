/**
 * Blog Service
 *
 * Handles blog CRUD operations with tenant scoping and multi-tenant filtering.
 */

import { prisma } from '../db';
import type {
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogFilterParams,
  BlogListResponse,
} from '../types/blog';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/error-handler';
import { generateUniqueSlug } from '../utils/slug-generator';

/**
 * Blog Service Class
 */
export class BlogService {
  /**
   * Create a new blog post
   */
  async create(tenantId: number, authorId: number, data: CreateBlogPostRequest): Promise<any> {
    // Generate slug from title
    const baseSlug = this.createSlug(data.title);
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.blogPost.findUnique({
        where: { tenantId_slug: { tenantId, slug: s } },
      });
      return existing !== null;
    });

    // Create blog post
    const post = await prisma.blogPost.create({
      data: {
        tenantId,
        authorId,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || this.generateExcerptFromContent(data.content),
        category: data.category,
        tags: data.tags || [],
        status: data.status || 'draft',
        metaTitle: data.metaTitle || data.title.substring(0, 60),
        metaDescription: data.metaDescription || data.excerpt?.substring(0, 160) || '',
        metaKeywords: data.metaKeywords || [],
        carIds: data.carIds || [],
        viewCount: 0,
        readingTimeMinutes: this.calculateReadingTime(data.content),
        publishedAt: data.status === 'published' ? new Date() : null,
      },
    });

    return post;
  }

  /**
   * Update a blog post
   */
  async update(
    tenantId: number,
    postId: number,
    data: UpdateBlogPostRequest
  ): Promise<any> {
    // Verify post exists and belongs to tenant
    const existing = await this.getById(tenantId, postId);
    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      const baseSlug = this.createSlug(data.title);
      slug = await generateUniqueSlug(baseSlug, async (s) => {
        if (s === existing.slug) return false;
        const exists = await prisma.blogPost.findUnique({
          where: { tenantId_slug: { tenantId, slug: s } },
        });
        return exists !== null;
      });
    }

    // Build update data
    const updateData: any = {
      ...data,
      slug,
    };

    // Calculate reading time if content is being updated
    if (data.content) {
      updateData.readingTimeMinutes = this.calculateReadingTime(data.content);
    }

    // Set publishedAt if status changed to published
    if (data.status === 'published' && existing.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });

    return post;
  }

  /**
   * Soft delete a blog post
   */
  async delete(tenantId: number, postId: number): Promise<void> {
    // Verify post exists and belongs to tenant
    const existing = await this.getById(tenantId, postId);
    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get blog post by ID
   */
  async getById(tenantId: number, postId: number): Promise<any | null> {
    return await prisma.blogPost.findFirst({
      where: {
        id: postId,
        tenantId,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get blog post by slug (for public access)
   */
  async getBySlug(tenantId: number, slug: string): Promise<any | null> {
    const post = await prisma.blogPost.findUnique({
      where: {
        tenantId_slug: { tenantId, slug },
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        featuredCars: {
          include: {
            car: {
              select: {
                id: true,
                slug: true,
                brand: true,
                model: true,
                year: true,
                price: true,
                displayCode: true,
                photos: true,
                publicName: true,
              },
            },
          },
        },
      },
    });

    if (!post) return null;

    // Map car references to frontend format
    const carReferences = post.featuredCars.map(fc => ({
      carId: fc.car.id,
      slug: fc.car.slug,
      name: fc.car.publicName || `${fc.car.brand} ${fc.car.model}`,
      brand: fc.car.brand,
      model: fc.car.model,
      year: fc.car.year,
      price: fc.car.price.toString(),
      primaryPhoto: fc.car.photos && fc.car.photos.length > 0 ? fc.car.photos[0] : null,
      displayCode: fc.car.displayCode,
    }));

    // Remove featuredCars and add carReferences
    const { featuredCars, ...postData } = post;

    return {
      ...postData,
      carReferences,
      readingTimeMinutes: this.calculateReadingTime(post.content),
    };
  }

  /**
   * List blog posts with filters and pagination
   */
  async list(tenantId: number, filters: BlogFilterParams): Promise<BlogListResponse> {
    const {
      page,
      limit,
      offset,
      status,
      category,
      search,
      carId,
      tags,
    } = filters;

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (carId) {
      where.carIds = {
        has: carId,
      };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Get total count
    const total = await prisma.blogPost.count({ where });

    // Get posts
    const posts = await prisma.blogPost.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      posts: posts as any[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Publish a blog post
   */
  async publish(tenantId: number, postId: number): Promise<any> {
    // Verify post exists and belongs to tenant
    const existing = await this.getById(tenantId, postId);
    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return post;
  }

  /**
   * Unpublish a blog post (set back to draft)
   */
  async unpublish(tenantId: number, postId: number): Promise<any> {
    // Verify post exists and belongs to tenant
    const existing = await this.getById(tenantId, postId);
    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: 'draft',
      },
    });

    return post;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(tenantId: number, postId: number): Promise<void> {
    await prisma.blogPost.update({
      where: {
        id: postId,
        tenantId,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Create slug from title
   */
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);
  }

  /**
   * Generate excerpt from content (fallback)
   */
  private generateExcerptFromContent(content: string): string {
    // Remove markdown formatting
    const plainText = content
      .replace(/[#*_\[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Take first 150 words
    const words = plainText.split(/\s+/);
    const excerpt = words.slice(0, 150).join(' ');

    return excerpt.length < plainText.length ? excerpt + '...' : excerpt;
  }

  /**
   * Get all categories with post counts
   */
  async getCategories(tenantId: number): Promise<Array<{ name: string; count: number }>> {
    const posts = await prisma.blogPost.findMany({
      where: {
        tenantId,
        status: 'published',
        deletedAt: null,
      },
      select: {
        category: true,
      },
    });

    const categoryCounts: Record<string, number> = {};
    posts.forEach(post => {
      if (post.category) {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get popular tags with post counts
   */
  async getPopularTags(tenantId: number, limit: number = 20): Promise<Array<{ name: string; count: number }>> {
    const posts = await prisma.blogPost.findMany({
      where: {
        tenantId,
        status: 'published',
        deletedAt: null,
      },
      select: {
        tags: true,
      },
    });

    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get related posts based on category and tags
   */
  async getRelatedPosts(
    tenantId: number,
    excludePostId: number,
    category: string,
    tags: string[],
    limit: number = 4
  ): Promise<any[]> {
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        tenantId,
        id: { not: excludePostId },
        status: 'published',
        deletedAt: null,
        OR: [
          { category },
          { tags: { hasSome: tags } },
        ],
      },
      take: limit,
      orderBy: [
        { publishedAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return relatedPosts;
  }

  /**
   * Calculate reading time in minutes
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Average reading speed
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }
}
