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
