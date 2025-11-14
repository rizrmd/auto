/**
 * Blog Validation Schemas
 *
 * Zod schemas for validating blog-related API requests.
 */

import { z } from 'zod';

/**
 * Blog status enum
 */
export const BlogStatusEnum = z.enum(['draft', 'published', 'archived']);

/**
 * Blog category enum
 */
export const BlogCategoryEnum = z.enum([
  'tips_mobil',
  'berita_otomotif',
  'panduan_beli',
  'perawatan',
  'review_mobil',
  'promo',
]);

/**
 * AI tone enum
 */
export const AIToneEnum = z.enum(['professional', 'casual', 'balanced', 'custom']);

/**
 * Create blog post schema
 */
export const CreateBlogPostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters'),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content must not exceed 50,000 characters'),
  excerpt: z
    .string()
    .max(500, 'Excerpt must not exceed 500 characters')
    .optional(),
  category: BlogCategoryEnum,
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  status: BlogStatusEnum.optional().default('draft'),
  metaTitle: z
    .string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional(),
  metaKeywords: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 meta keywords allowed')
    .optional(),
  carIds: z
    .array(z.number().int().positive())
    .max(20, 'Maximum 20 car references allowed')
    .optional(),
});

/**
 * Update blog post schema
 */
export const UpdateBlogPostSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content must not exceed 50,000 characters')
    .optional(),
  excerpt: z
    .string()
    .max(500, 'Excerpt must not exceed 500 characters')
    .optional(),
  category: BlogCategoryEnum.optional(),
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  status: BlogStatusEnum.optional(),
  metaTitle: z
    .string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional(),
  metaKeywords: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 meta keywords allowed')
    .optional(),
  carIds: z
    .array(z.number().int().positive())
    .max(20, 'Maximum 20 car references allowed')
    .optional(),
});

/**
 * Generate blog content schema
 */
export const GenerateBlogContentSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must not exceed 1000 characters'),
  category: BlogCategoryEnum,
  carIds: z
    .array(z.number().int().positive())
    .max(20, 'Maximum 20 car references allowed')
    .optional(),
  keywords: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 keywords allowed')
    .optional(),
  tone: AIToneEnum.optional().default('balanced'),
  customToneInstructions: z
    .string()
    .max(500, 'Custom tone instructions must not exceed 500 characters')
    .optional(),
});

/**
 * Blog list query params schema
 */
export const BlogListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  status: BlogStatusEnum.optional(),
  category: BlogCategoryEnum.optional(),
  search: z
    .string()
    .max(200, 'Search query must not exceed 200 characters')
    .optional(),
  carId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
});

/**
 * Blog ID param schema
 */
export const BlogIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Blog ID must be a positive integer'),
});

/**
 * Blog slug param schema
 */
export const BlogSlugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug must not exceed 200 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
});

/**
 * Type exports for TypeScript
 */
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentSchema>;
export type BlogListQuery = z.infer<typeof BlogListQuerySchema>;
export type BlogIdParam = z.infer<typeof BlogIdParamSchema>;
export type BlogSlugParam = z.infer<typeof BlogSlugParamSchema>;
