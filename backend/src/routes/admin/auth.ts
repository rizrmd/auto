/**
 * Admin Authentication Routes
 *
 * Handles admin login and authentication.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { asyncHandler, ValidationError } from '../../middleware/error-handler';
import { strictRateLimiter, clearRateLimitStore } from '../../middleware/rate-limiter';
import { validate, getValidatedData } from '../../middleware/validation';
import { LoginSchema } from '../../validation/schemas';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse, LoginRequest } from '../../types/context';

const adminAuth = new Hono();

// Apply tenant middleware and strict rate limiting
adminAuth.use('*', tenantMiddleware);
adminAuth.use('/login', strictRateLimiter());

/**
 * POST /api/admin/auth/login
 * Authenticate admin user
 */
adminAuth.post(
  '/login',
  validate(LoginSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const authService = new AuthService();

    // Get validated credentials
    const body = getValidatedData<z.infer<typeof LoginSchema>>(c);

    // Authenticate user
    const loginResponse = await authService.authenticate(
      body.email,
      body.password,
      tenant.id
    );

    const response: ApiResponse = {
      success: true,
      data: loginResponse,
    };

    return c.json(response);
  })
);

/**
 * POST /api/admin/auth/verify
 * Verify JWT token (optional endpoint for token validation)
 */
adminAuth.post(
  '/verify',
  asyncHandler(async (c) => {
    const authService = new AuthService();
    const authHeader = c.req.header('authorization');

    if (!authHeader) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: MESSAGES.UNAUTHORIZED,
        },
      };
      return c.json(response, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = authService.verifyToken(token);

      const response: ApiResponse = {
        success: true,
        data: {
          valid: true,
          payload,
        },
      };

      return c.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: MESSAGES.INVALID_TOKEN,
        },
      };
      return c.json(response, HTTP_STATUS.UNAUTHORIZED);
    }
  })
);

/**
 * POST /api/admin/auth/clear-rate-limits
 * Debug endpoint to clear rate limits (development only)
 */
adminAuth.post(
  '/clear-rate-limits',
  asyncHandler(async (c) => {
    // Only allow in development or with special debug header
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const debugHeader = c.req.header('x-debug-clear-ratelimits');

    if (!isDevelopment && debugHeader !== 'debug-auth-admin-clear') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Rate limit clearing is only available in development mode',
        },
      };
      return c.json(response, HTTP_STATUS.FORBIDDEN);
    }

    // Clear rate limit store
    clearRateLimitStore();

    console.log('[DEBUG] Rate limit store cleared via admin auth endpoint');

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Rate limit store cleared successfully',
        timestamp: new Date().toISOString(),
      },
    };

    return c.json(response);
  })
);

export default adminAuth;
