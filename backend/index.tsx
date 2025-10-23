/**
 * AutoLeads Backend Server
 *
 * Multi-tenant car dealership management system with WhatsApp integration.
 * Built with Bun, Hono, and Prisma.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from 'bun';
import index from '../frontend/index.html';
import { errorHandler } from './src/middleware/error-handler';
import { CORS_CONFIG } from './src/config/constants';
import { env, isDevelopment } from './src/config/env';

// Import routes
import healthRoutes from './src/routes/health';
import publicCarsRoutes from './src/routes/public/cars';
import fontteWebhookRoutes from './src/routes/webhook/fonnte';
import adminAuthRoutes from './src/routes/admin/auth';
import adminCarsRoutes from './src/routes/admin/cars';
import adminLeadsRoutes from './src/routes/admin/leads';

/**
 * Create Hono application
 */
const app = new Hono();

/**
 * Global Middleware
 */

// CORS configuration
app.use(
  '*',
  cors({
    origin: CORS_CONFIG.ALLOWED_ORIGINS,
    allowMethods: CORS_CONFIG.ALLOWED_METHODS,
    allowHeaders: CORS_CONFIG.ALLOWED_HEADERS,
    exposeHeaders: CORS_CONFIG.EXPOSED_HEADERS,
    credentials: true,
  })
);

// Request logging (only in development)
if (isDevelopment) {
  app.use('*', logger());
}

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  await next();
});

/**
 * API Routes
 */

// Health check
app.route('/health', healthRoutes);

// Public API routes
app.route('/api/cars', publicCarsRoutes);

// Webhook routes
app.route('/webhook/fonnte', fontteWebhookRoutes);

// Admin API routes
app.route('/api/admin/auth', adminAuthRoutes);
app.route('/api/admin/cars', adminCarsRoutes);
app.route('/api/admin/leads', adminLeadsRoutes);

/**
 * Root route - API info
 */
app.get('/api', (c) => {
  return c.json({
    name: 'AutoLeads API',
    version: '1.0.0',
    status: 'active',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      public: {
        cars: '/api/cars',
      },
      admin: {
        auth: '/api/admin/auth/login',
        cars: '/api/admin/cars',
        leads: '/api/admin/leads',
      },
      webhooks: {
        fonnte: '/webhook/fonnte',
      },
    },
  });
});

/**
 * Frontend routes - Serve index.html for all unmatched routes
 * This enables client-side routing for the React app
 */
app.get('*', (c) => {
  return c.html(index);
});

/**
 * Global Error Handler
 */
app.onError((err, c) => {
  return errorHandler(err, c);
});

/**
 * 404 Handler for API routes
 */
app.notFound((c) => {
  if (c.req.url.includes('/api/')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API endpoint not found',
          path: c.req.path,
        },
      },
      404
    );
  }

  // For non-API routes, serve the frontend
  return c.html(index);
});

/**
 * Start Server
 */
const server = serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  development: isDevelopment
    ? {
        // Enable hot module reloading in development
        hmr: true,
        console: true,
      }
    : undefined,
});

/**
 * Server startup message
 */
console.log('='.repeat(60));
console.log('AutoLeads Backend Server');
console.log('='.repeat(60));
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`Server running at: ${server.url}`);
console.log(`Database: ${env.DATABASE_URL.split('@')[1] || 'Connected'}`);
console.log('='.repeat(60));
console.log('API Endpoints:');
console.log(`  Health Check:    ${server.url}health`);
console.log(`  Public Cars:     ${server.url}api/cars`);
console.log(`  Admin Login:     ${server.url}api/admin/auth/login`);
console.log(`  Admin Cars:      ${server.url}api/admin/cars`);
console.log(`  Admin Leads:     ${server.url}api/admin/leads`);
console.log(`  Fonnte Webhook:  ${server.url}webhook/fonnte`);
console.log('='.repeat(60));

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

/**
 * Unhandled rejection handler
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to an error tracking service
});

/**
 * Uncaught exception handler
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log this and restart the process
  if (!isDevelopment) {
    process.exit(1);
  }
});

export default app;
