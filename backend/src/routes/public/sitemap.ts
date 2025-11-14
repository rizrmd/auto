/**
 * Sitemap Routes
 *
 * Generate XML sitemap for SEO with blog posts and cars.
 */

import { Hono } from 'hono';
import { prisma } from '../../db';
import { tenantMiddleware } from '../../middleware/tenant';

const app = new Hono();

// Apply tenant middleware
app.use('*', tenantMiddleware);

/**
 * Cache configuration
 */
const SITEMAP_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map<number, { xml: string; timestamp: number }>();

/**
 * GET /sitemap.xml - Generate XML sitemap
 */
app.get('/sitemap.xml', async (c) => {
  const tenantId = c.get('tenantId');

  // Check cache
  const cached = cache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < SITEMAP_CACHE_TTL) {
    return c.body(cached.xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    });
  }

  try {
    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subdomain: true,
        customDomain: true,
      },
    });

    if (!tenant) {
      return c.text('Tenant not found', 404);
    }

    // Determine base URL
    const baseUrl = tenant.customDomain
      ? `https://${tenant.customDomain}`
      : `https://${tenant.subdomain}`;

    // Get published blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        tenantId,
        status: 'published',
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Get available cars
    const cars = await prisma.car.findMany({
      where: {
        tenantId,
        status: 'available',
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Build sitemap XML
    const urls: string[] = [];

    // Homepage
    urls.push(buildUrlEntry(baseUrl, new Date(), 'daily', 1.0));

    // Cars page
    urls.push(buildUrlEntry(`${baseUrl}/cars`, new Date(), 'daily', 0.9));

    // Individual cars
    cars.forEach((car) => {
      urls.push(buildUrlEntry(`${baseUrl}/cars/${car.slug}`, car.updatedAt, 'weekly', 0.8));
    });

    // Blog homepage
    if (blogPosts.length > 0) {
      urls.push(buildUrlEntry(`${baseUrl}/blog`, new Date(), 'daily', 0.9));
    }

    // Individual blog posts
    blogPosts.forEach((post) => {
      const lastMod = post.updatedAt || post.publishedAt || new Date();
      urls.push(buildUrlEntry(`${baseUrl}/blog/${post.slug}`, lastMod, 'weekly', 0.7));
    });

    // About and contact pages (if they exist)
    urls.push(buildUrlEntry(`${baseUrl}/about`, new Date(), 'monthly', 0.6));
    urls.push(buildUrlEntry(`${baseUrl}/contact`, new Date(), 'monthly', 0.6));

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    // Update cache
    cache.set(tenantId, {
      xml,
      timestamp: Date.now(),
    });

    return c.body(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    });
  } catch (error) {
    console.error('[SITEMAP] Error generating sitemap:', error);
    return c.text('Internal Server Error', 500);
  }
});

/**
 * Build URL entry for sitemap
 */
function buildUrlEntry(
  url: string,
  lastMod: Date,
  changeFreq: string,
  priority: number
): string {
  const lastModDate = lastMod.toISOString().split('T')[0];

  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export default app;
