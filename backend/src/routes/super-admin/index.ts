/**
 * Super Admin Routes Index
 *
 * Main entry point for all Super Admin API routes.
 * Consolidates authentication, tenant management, analytics, monitoring, and settings endpoints.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimiter } from '../../middleware/rate-limiter';

// Import route modules
import authRoutes from './auth';
import tenantRoutes from './tenants';
import analyticsRoutes from './analytics';
import monitoringRoutes from './monitoring';
import settingsRoutes from './settings';

// Import caching service
import { superAdminCache, cacheMiddleware, invalidateCache } from '../../services/super-admin-cache.service';

// Create main Super Admin router
const app = new Hono();

// Apply CORS middleware
app.use('*', cors({
  origin: ['https://auto.lumiku.com', 'https://admin.autoleads.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Apply logging middleware
app.use('*', logger());

// Apply rate limiting (more restrictive for Super Admin)
app.use('*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    error: 'Too many requests from Super Admin, please try again later.',
  },
}));

// Health check endpoint (doesn't require authentication)
app.get('/health', async (c) => {
  return c.json({
    status: 'healthy',
    service: 'super-admin-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    cache: superAdminCache.getStats(),
  });
});

// API documentation endpoint
app.get('/docs', async (c) => {
  const docs = {
    title: 'AutoLeads Super Admin API',
    version: '1.0.0',
    description: 'Complete API documentation for Super Admin operations',
    baseUrl: '/api/super-admin',
    endpoints: {
      auth: {
        'POST /login': 'Super Admin login',
        'POST /refresh': 'Refresh JWT tokens',
        'POST /logout': 'Logout Super Admin',
        'GET /me': 'Get current Super Admin profile',
        'PUT /change-password': 'Change password',
        'GET /verify-token': 'Verify JWT token',
        'POST /setup': 'Initial system setup',
        'GET /setup-status': 'Check setup status',
      },
      tenants: {
        'GET /': 'List all tenants',
        'GET /:id': 'Get tenant profile',
        'POST /': 'Create new tenant',
        'PUT /:id': 'Update tenant',
        'PUT /:id/theme': 'Update tenant theme',
        'PUT /:id/status': 'Update tenant status',
        'DELETE /:id': 'Delete tenant',
        'GET /:id/health-score': 'Get tenant health score',
        'POST /:id/reset-password': 'Reset tenant admin password',
        'GET /:id/export': 'Export tenant data',
        'POST /:id/duplicate': 'Duplicate tenant configuration',
      },
      analytics: {
        'GET /global': 'Get global analytics',
        'GET /tenants/:id': 'Get tenant analytics',
        'GET /tenants/:id/performance': 'Get tenant performance metrics',
        'GET /leaderboard': 'Get tenant leaderboard',
        'GET /revenue': 'Get revenue analytics',
        'GET /growth': 'Get growth analytics',
        'GET /churn': 'Get churn analytics',
        'GET /export': 'Export analytics data',
        'GET /dashboard': 'Get dashboard overview',
      },
      monitoring: {
        'GET /health': 'Get system health',
        'GET /whatsapp': 'Get WhatsApp metrics',
        'GET /storage': 'Get storage metrics',
        'GET /performance': 'Get performance metrics',
        'GET /errors': 'Get error logs',
        'GET /logs': 'Get system logs',
        'GET /alerts': 'Get system alerts',
        'POST /alerts/:id/resolve': 'Resolve alert',
        'GET /metrics': 'Get custom metrics',
        'GET /dashboard': 'Get monitoring dashboard',
        'POST /test-webhook': 'Test webhook endpoint',
      },
      settings: {
        'GET /': 'Get system settings',
        'PUT /': 'Update system settings',
        'GET /general': 'Get general settings',
        'PUT /general': 'Update general settings',
        'GET /security': 'Get security settings',
        'PUT /security': 'Update security settings',
        'GET /whatsapp': 'Get WhatsApp settings',
        'PUT /whatsapp': 'Update WhatsApp settings',
        'GET /notifications': 'Get notification settings',
        'PUT /notifications': 'Update notification settings',
        'GET /features': 'Get feature flags',
        'PUT /features': 'Update feature flags',
        'POST /reset': 'Reset settings to defaults',
        'POST /export': 'Export settings',
        'POST /import': 'Import settings',
        'GET /activity-log': 'Get settings activity log',
        'POST /backup': 'Create settings backup',
        'POST /restore': 'Restore from backup',
      },
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
    },
    rateLimiting: {
      window: '15 minutes',
      maxRequests: 1000,
    },
    caching: {
      enabled: true,
      ttl: {
        tenantList: '5 minutes',
        analytics: '15 minutes',
        monitoring: '2 minutes',
      },
    },
  };

  return c.json(docs);
});

// Cache management endpoint
app.get('/cache/stats', async (c) => {
  return c.json({
    success: true,
    data: superAdminCache.getStats(),
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

// Cache cleanup endpoint
app.post('/cache/cleanup', async (c) => {
  const deleted = superAdminCache.clean();

  return c.json({
    success: true,
    data: { deleted },
    message: `Cleaned up ${deleted} expired cache items`,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

// Cache invalidation endpoint
app.post('/cache/invalidate', async (c) => {
  const { pattern } = await c.req.json().catch(() => ({ pattern: '' }));

  const deleted = pattern
    ? superAdminCache.clearPattern(pattern)
    : (() => {
        const size = superAdminCache.getStats().size;
        superAdminCache.clear();
        return size;
      })();

  return c.json({
    success: true,
    data: { deleted },
    message: `Invalidated ${deleted} cache items`,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

// Mount route modules with caching
app.route('/auth', authRoutes);
app.route('/tenants', tenantRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/monitoring', monitoringRoutes);
app.route('/settings', settingsRoutes);

// Apply cache invalidation for write operations
app.use('/tenants/*', invalidateCache('tenant_'));
app.use('/analytics/*', invalidateCache('analytics_'));
app.use('/monitoring/*', invalidateCache('monitoring_'));
app.use('/settings/*', invalidateCache('settings_'));

// Error handling middleware
app.onError((err, c) => {
  console.error('[SUPER_ADMIN_API_ERROR]', err);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  return c.json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || crypto.randomUUID(),
    },
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  }, 404);
});

// Request ID middleware
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// Response headers middleware
app.use('*', async (c, next) => {
  await next();

  // Add standard response headers
  c.header('X-API-Version', '1.0.0');
  c.header('X-Response-Time', `${Date.now() - parseInt(c.get('startTime') || Date.now())}ms`);
});

// Request timing middleware
app.use('*', async (c, next) => {
  c.set('startTime', Date.now().toString());
  await next();
});

// Initialize cache auto-cleanup
if (process.env.NODE_ENV !== 'test') {
  superAdminCache.startAutoCleanup(5 * 60 * 1000); // 5 minutes
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('[SUPER_ADMIN_API] SIGTERM received, shutting down gracefully');

  // Export cache before shutdown
  const cacheData = superAdminCache.export();
  console.log(`[SUPER_ADMIN_API] Exported ${cacheData.items.length} cache items`);

  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SUPER_ADMIN_API] SIGINT received, shutting down gracefully');

  // Export cache before shutdown
  const cacheData = superAdminCache.export();
  console.log(`[SUPER_ADMIN_API] Exported ${cacheData.items.length} cache items`);

  process.exit(0);
});

export default app;