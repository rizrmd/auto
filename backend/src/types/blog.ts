/**
 * Blog Type Definitions
 *
 * TypeScript interfaces for blog posts, AI generation, and API contracts.
 */

/**
 * Blog post status enum
 */
export type BlogStatus = 'draft' | 'published' | 'archived';

/**
 * Blog post category - now accepts any string for flexibility
 */
export type BlogCategory = string;

/**
 * AI generation tone
 */
export type AITone = 'professional' | 'casual' | 'balanced' | 'custom';

/**
 * Blog post database model (matches Prisma schema)
 */
export interface BlogPost {
  id: number;
  tenantId: number;

  // Content
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;

  // Metadata
  category: string;
  tags: string[];
  status: BlogStatus;

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];

  // Relations
  carIds: number[];

  // Engagement
  viewCount: number;

  // Publishing
  publishedAt: Date | null;
  authorId: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Create blog post request
 */
export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  status?: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  carIds?: number[];
}

/**
 * Update blog post request
 */
export interface UpdateBlogPostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status?: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  carIds?: number[];
}

/**
 * AI blog generation request
 */
export interface GenerateBlogContentRequest {
  prompt: string;
  category?: string;
  carIds?: number[];
  keywords?: string[];
  tone?: AITone;
  customToneInstructions?: string;
}

/**
 * AI blog generation response
 */
export interface GeneratedBlogContent {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  tags: string[];
  suggestedCarIds: number[];
}

/**
 * Blog list filters
 */
export interface BlogFilterParams {
  page: number;
  limit: number;
  offset: number;
  status?: BlogStatus;
  category?: string;
  search?: string;
  carId?: number;
  tags?: string[];
}

/**
 * Blog list response
 */
export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Blog post with relations
 */
export interface BlogPostWithRelations extends BlogPost {
  author: {
    id: number;
    name: string;
    email: string;
  };
  cars: Array<{
    id: number;
    brand: string;
    model: string;
    year: number;
    displayCode: string;
    slug: string;
  }>;
}

/**
 * SEO metadata
 */
export interface BlogSEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  canonicalUrl: string;
}

/**
 * Sitemap entry
 */
export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}
