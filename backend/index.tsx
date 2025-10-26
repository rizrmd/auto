/**
 * AutoLeads Backend Server
 *
 * Multi-tenant car dealership management system with WhatsApp integration.
 * Built with Bun, Hono, and Prisma.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from 'bun';
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';
import { errorHandler } from './src/middleware/error-handler';
import { CORS_CONFIG } from './src/config/constants';
import { env, isDevelopment } from './src/config/env';

// Import routes
import healthRoutes from './src/routes/health';
import publicCarsRoutes from './src/routes/public/cars';
import fontteWebhookRoutes from './src/routes/webhook/fonnte';
import whatsappWebhookRoutes from './src/routes/webhook/whatsapp';
import adminAuthRoutes from './src/routes/admin/auth';
import adminCarsRoutes from './src/routes/admin/cars';
import adminLeadsRoutes from './src/routes/admin/leads';
import adminWhatsappRoutes from './src/routes/admin/whatsapp';
import tenantRoutes from './src/routes/tenant';

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
    credentials: CORS_CONFIG.CREDENTIALS,
    maxAge: CORS_CONFIG.MAX_AGE,
  })
);

// ========================================
// SECURITY HEADERS
// ========================================

/**
 * Content Security Policy Configuration
 *
 * Production: Strict CSP to prevent XSS attacks
 * Development: More permissive to allow HMR and hot reload
 */
const cspConfig = env.NODE_ENV === 'production' ? {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],  // No unsafe-inline in production
  styleSrc: ["'self'"],   // No unsafe-inline in production
  imgSrc: ["'self'", 'https://auto.lumiku.com', 'data:'],
  connectSrc: ["'self'", 'https://auto.lumiku.com'],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  upgradeInsecureRequests: [],
} : {
  // Development CSP (more permissive for hot reload)
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],  // Required for Vite HMR
  styleSrc: ["'self'", "'unsafe-inline'"],   // Required for Tailwind JIT
  imgSrc: ["'self'", 'data:', 'http:', 'https:'],
  connectSrc: ["'self'", 'ws:', 'wss:'],  // Required for WebSocket (HMR)
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};

/**
 * Apply comprehensive security headers
 *
 * Headers include:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - Referrer-Policy: Protects sensitive URL parameters
 * - Strict-Transport-Security: Forces HTTPS (production only)
 */
app.use('*', secureHeaders({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false, // Needed for image loading from different origins
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: env.NODE_ENV === 'production'
    ? 'max-age=31536000; includeSubDomains; preload'  // 1 year in production
    : false,  // Disabled in development (no HTTPS locally)
}));

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

// CSP Violation Reporting
app.post('/api/csp-report', async (c) => {
  try {
    const report = await c.req.json();
    console.error('[CSP VIOLATION]', {
      timestamp: new Date().toISOString(),
      'blocked-uri': report['csp-report']?.['blocked-uri'],
      'violated-directive': report['csp-report']?.['violated-directive'],
      'document-uri': report['csp-report']?.['document-uri'],
      'source-file': report['csp-report']?.['source-file'],
      'line-number': report['csp-report']?.['line-number'],
      fullReport: report,
    });
    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
    return c.json({ received: true });
  } catch (error) {
    console.error('[CSP REPORT ERROR]', error);
    return c.json({ error: 'Failed to process CSP report' }, 400);
  }
});

// Public API routes
app.route('/api/cars', publicCarsRoutes);

// Tenant routes (public)
app.route('/api/tenant', tenantRoutes);

// Webhook routes
app.route('/webhook/fonnte', fontteWebhookRoutes);
app.route('/webhook/whatsapp', whatsappWebhookRoutes);

// Admin API routes
app.route('/api/admin/auth', adminAuthRoutes);
app.route('/api/admin/cars', adminCarsRoutes);
app.route('/api/admin/leads', adminLeadsRoutes);
app.route('/api/admin/whatsapp', adminWhatsappRoutes);

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
        whatsapp: '/api/admin/whatsapp',
        pairingPage: '/pairing.html',
      },
      webhooks: {
        fonnte: '/webhook/fonnte',
        whatsapp: '/webhook/whatsapp',
      },
    },
  });
});

// ========================================
// WHATSAPP PAIRING PAGE
// ========================================
/**
 * Serve WhatsApp pairing page
 * This page provides an automatic QR code generation interface for WhatsApp pairing
 * CSP is relaxed for this page to allow inline scripts
 */
app.get('/pairing.html', async (c) => {
  try {
    const html = await readFile('/app/public/pairing.html', 'utf-8');

    // Override CSP for this specific route to allow inline scripts
    // This is necessary for the auto-login and QR generation functionality
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        // Relaxed CSP for pairing page only (allows inline scripts)
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://auto.lumiku.com data:",
          "connect-src 'self' https://auto.lumiku.com",
          "font-src 'self'",
          "object-src 'none'",
          "media-src 'self'",
          "frame-src 'none'",
        ].join('; '),
      },
    });
  } catch (error) {
    console.error('[PAIRING] Error serving pairing page:', error);
    return c.text('Pairing page not found. Please contact administrator.', 404);
  }
});

// ========================================
// IMAGE SERVING - Must be BEFORE wildcard
// ========================================
// Serve files from /app/data directory (persistent storage)
app.get('/uploads/*', async (c) => {
  const requestPath = c.req.path.replace(/^\/uploads\//, '');
  const filepath = `/app/data/${requestPath}`;

  // Security: Prevent path traversal attacks
  const normalizedPath = path.normalize(filepath);
  if (!normalizedPath.startsWith('/app/data/')) {
    console.error('[SECURITY] Path traversal attempt blocked:', requestPath);
    return c.text('Forbidden', 403);
  }

  try {
    // Check if file exists
    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      console.error('[IMAGE] File not found:', filepath, '| URL:', c.req.path);
      return c.notFound();
    }

    // Log successful file access in development
    if (isDevelopment) {
      console.log('[IMAGE] Serving:', filepath);
    }

    // Read file content using Node.js fs
    const fileContent = await readFile(filepath);
    
    // Simple MIME type detection
    const ext = filepath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };

    // Check if it's actually SVG content
    let contentType = mimeTypes[ext] || 'application/octet-stream';
    const contentPreview = fileContent.slice(0, 100).toString();
    if (contentPreview.includes('<svg')) {
      contentType = 'image/svg+xml';
    }

    // Return image with proper headers
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[IMAGE] Error serving file:', error);
    return c.text('Internal Server Error', 500);
  }
});

/**
 * Frontend routes - Serve bundled static files and index.html
 * This enables client-side routing for the React app
 */
app.get('*', async (c) => {
  const requestPath = new URL(c.req.url).pathname;

  // Try to serve from dist directory first (bundled files)
  const distFilePath = `./frontend/dist${requestPath}`;
  const distFile = Bun.file(distFilePath);

  if (await distFile.exists()) {
    // Determine MIME type based on file extension
    let contentType = 'application/octet-stream';

    if (requestPath.endsWith('.js') || requestPath.endsWith('.tsx') || requestPath.endsWith('.jsx') || requestPath.endsWith('.ts')) {
      contentType = 'application/javascript; charset=utf-8';
    } else if (requestPath.endsWith('.css')) {
      contentType = 'text/css; charset=utf-8';
    } else if (requestPath.endsWith('.html')) {
      contentType = 'text/html; charset=utf-8';
    } else if (requestPath.endsWith('.map')) {
      contentType = 'application/json';
    } else if (requestPath.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (requestPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (requestPath.endsWith('.jpg') || requestPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (requestPath.endsWith('.json')) {
      contentType = 'application/json';
    }

    // FIX: Read file content explicitly to avoid empty response
    const fileContent = await distFile.arrayBuffer();

    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': requestPath.match(/\.[a-f0-9]{8}\.(js|css)$/)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      },
    });
  }

  // Fallback: try to serve from frontend directory (static assets like logo.svg)
  const frontendFilePath = `./frontend${requestPath}`;
  const frontendFile = Bun.file(frontendFilePath);

  if (await frontendFile.exists()) {
    let contentType = 'application/octet-stream';

    if (requestPath.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (requestPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (requestPath.endsWith('.jpg') || requestPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    }

    // FIX: Read file content explicitly
    const fileContent = await frontendFile.arrayBuffer();

    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
      },
    });
  }

  // For all other routes, serve index.html (SPA routing)
  const indexFile = Bun.file('./frontend/dist/index.html');
  const indexContent = await indexFile.arrayBuffer();
  return new Response(indexContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
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
app.notFound(async (c) => {
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

  // For non-API routes, serve the frontend (SPA fallback)
  const indexFile = Bun.file('./frontend/dist/index.html');
  const indexContent = await indexFile.arrayBuffer();
  return new Response(indexContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
});

/**
 * Server startup message (will be shown when Bun serves the app)
 */
console.log('='.repeat(60));
console.log('AutoLeads Backend Server');
console.log('='.repeat(60));
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`Database: ${env.DATABASE_URL.split('@')[1] || 'Connected'}`);
console.log(`Storage: /uploads/* URLs served from /app/data/ directory`);
console.log('='.repeat(60));
console.log('API Endpoints:');
console.log(`  Health Check:    /health`);
console.log(`  Public Cars:     /api/cars`);
console.log(`  Admin Login:     /api/admin/auth/login`);
console.log(`  Admin Cars:      /api/admin/cars`);
console.log(`  Admin Leads:     /api/admin/leads`);
console.log(`  Admin WhatsApp:  /api/admin/whatsapp`);
console.log(`  Fonnte Webhook:  /webhook/fonnte`);
console.log(`  WhatsApp Webhook: /webhook/whatsapp`);
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
  // Let Bun handle the error - don't manually exit
});

export default app;
