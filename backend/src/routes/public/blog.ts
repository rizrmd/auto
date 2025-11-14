/**
 * Public Blog Routes
 *
 * Public endpoints for blog posts (no authentication required).
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { BlogService } from '../../services/blog.service';
import { BlogListQuerySchema, BlogSlugParamSchema } from '../../validation/blog-schemas';
import { tenantMiddleware } from '../../middleware/tenant';
import { NotFoundError } from '../../middleware/error-handler';

const app = new Hono();
const blogService = new BlogService();

// Apply tenant middleware to all routes
app.use('*', tenantMiddleware);

/**
 * GET / - List published blog posts
 */
app.get('/', zValidator('query', BlogListQuerySchema), async (c) => {
  const tenantId = c.get('tenantId');
  const query = c.req.valid('query');

  // Calculate pagination
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  // Force status to published for public access
  const result = await blogService.list(tenantId, {
    ...query,
    page,
    limit,
    offset,
    status: 'published',
  });

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /list - List published blog posts with categories and popular tags
 * (Explicit endpoint for frontend compatibility)
 */
app.get('/list', zValidator('query', BlogListQuerySchema), async (c) => {
  const tenantId = c.get('tenantId');
  const query = c.req.valid('query');

  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const result = await blogService.list(tenantId, {
    ...query,
    page,
    limit,
    offset,
    status: 'published',
  });

  // Get categories and popular tags
  const categories = await blogService.getCategories(tenantId);
  const popularTags = await blogService.getPopularTags(tenantId);

  return c.json({
    success: true,
    data: {
      posts: result.posts,
      categories,
      popularTags,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

/**
 * GET /:slug/related - Get related posts by category and tags
 */
app.get('/:slug/related', zValidator('param', BlogSlugParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { slug } = c.req.valid('param');
  const limit = parseInt(c.req.query('limit') || '4');

  const post = await blogService.getBySlug(tenantId, slug);

  if (!post || post.status !== 'published') {
    throw new NotFoundError('Blog post');
  }

  const relatedPosts = await blogService.getRelatedPosts(
    tenantId,
    post.id,
    post.category,
    post.tags,
    limit
  );

  return c.json({
    success: true,
    data: {
      posts: relatedPosts,
    },
  });
});

/**
 * POST /:slug/view - Increment view count
 */
app.post('/:slug/view', zValidator('param', BlogSlugParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { slug } = c.req.valid('param');

  const post = await blogService.getBySlug(tenantId, slug);

  if (post && post.status === 'published') {
    await blogService.incrementViewCount(tenantId, post.id);
  }

  return c.json({
    success: true,
  });
});

/**
 * GET /:slug - Get blog post by slug and increment view count
 */
app.get('/:slug', zValidator('param', BlogSlugParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { slug } = c.req.valid('param');

  const post = await blogService.getBySlug(tenantId, slug);

  if (!post || post.status !== 'published') {
    throw new NotFoundError('Blog post');
  }

  // Increment view count asynchronously
  blogService.incrementViewCount(tenantId, post.id).catch((err) => {
    console.error('[BLOG] Failed to increment view count:', err);
  });

  return c.json({
    success: true,
    data: post,
  });
});

export default app;
