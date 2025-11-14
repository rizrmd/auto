/**
 * Admin Blog Routes
 *
 * Admin endpoints for blog management (authentication required).
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { BlogService } from '../../services/blog.service';
import { BlogGeneratorService } from '../../services/blog-generator.service';
import {
  CreateBlogPostSchema,
  UpdateBlogPostSchema,
  GenerateBlogContentSchema,
  BlogListQuerySchema,
  BlogIdParamSchema,
} from '../../validation/blog-schemas';
import { tenantMiddleware } from '../../middleware/tenant';
import { authMiddleware } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/role';

const app = new Hono();
const blogService = new BlogService();
const blogGenerator = new BlogGeneratorService();

// Apply middleware to all routes
app.use('*', tenantMiddleware);
app.use('*', authMiddleware);
app.use('*', requireAdmin); // Only admin and owner can manage blog

/**
 * GET / - List all blog posts (including drafts)
 */
app.get('/', zValidator('query', BlogListQuerySchema), async (c) => {
  const tenantId = c.get('tenantId');
  const query = c.req.valid('query');

  // Calculate pagination
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const result = await blogService.list(tenantId, {
    ...query,
    page,
    limit,
    offset,
  });

  return c.json({
    success: true,
    data: result,
  });
});

/**
 * GET /:id - Get single blog post
 */
app.get('/:id', zValidator('param', BlogIdParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { id } = c.req.valid('param');

  const post = await blogService.getById(tenantId, id);

  if (!post) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Blog post not found',
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: post,
  });
});

/**
 * POST / - Create new blog post
 */
app.post('/', zValidator('json', CreateBlogPostSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const post = await blogService.create(tenantId, userId, data);

  return c.json(
    {
      success: true,
      data: post,
      message: 'Blog post created successfully',
    },
    201
  );
});

/**
 * PUT /:id - Update blog post
 */
app.put('/:id', zValidator('param', BlogIdParamSchema), zValidator('json', UpdateBlogPostSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  const post = await blogService.update(tenantId, id, data);

  return c.json({
    success: true,
    data: post,
    message: 'Blog post updated successfully',
  });
});

/**
 * DELETE /:id - Soft delete blog post
 */
app.delete('/:id', zValidator('param', BlogIdParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { id } = c.req.valid('param');

  await blogService.delete(tenantId, id);

  return c.json({
    success: true,
    message: 'Blog post deleted successfully',
  });
});

/**
 * POST /generate-content - AI blog content generation
 */
app.post('/generate-content', zValidator('json', GenerateBlogContentSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const data = c.req.valid('json');

  console.log('[ADMIN BLOG] Generating blog content...', {
    tenantId,
    category: data.category,
    tone: data.tone,
  });

  const generatedContent = await blogGenerator.generateBlogPost(tenantId, data);

  return c.json({
    success: true,
    data: generatedContent,
    message: 'Blog content generated successfully',
  });
});

/**
 * POST /:id/publish - Publish blog post
 */
app.post('/:id/publish', zValidator('param', BlogIdParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { id } = c.req.valid('param');

  const post = await blogService.publish(tenantId, id);

  return c.json({
    success: true,
    data: post,
    message: 'Blog post published successfully',
  });
});

/**
 * POST /:id/unpublish - Unpublish blog post
 */
app.post('/:id/unpublish', zValidator('param', BlogIdParamSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const { id } = c.req.valid('param');

  const post = await blogService.unpublish(tenantId, id);

  return c.json({
    success: true,
    data: post,
    message: 'Blog post unpublished successfully',
  });
});

export default app;
