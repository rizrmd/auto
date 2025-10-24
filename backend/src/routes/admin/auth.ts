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
import { strictRateLimiter } from '../../middleware/rate-limiter';
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

export default adminAuth;
