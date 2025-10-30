/**
 * Super Admin Authentication Routes
 *
 * Handles authentication endpoints for Super Admin users.
 * Provides login, logout, token refresh, and password management.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SuperAdminAuthService } from '../../services/super-admin-auth.service';
import {
  SuperAdminLoginSchema,
  RefreshTokenSchema,
  PasswordChangeSchema,
  SuperAdminCreateSchema,
} from '../../validation/super-admin.schemas';
import { superAdminAuthMiddleware, getSuperAdmin } from '../../middleware/super-admin-auth';
import { superAdminActivityLogger, superAdminSecurityHeaders } from '../../middleware/super-admin-auth';
import { ApiResponse } from '../../types/super-admin';
import { BadRequestError, UnauthorizedError } from '../../middleware/error-handler';
import { prisma } from '../../db';

const app = new Hono();

/**
 * POST /api/super-admin/auth/login
 *
 * Authenticate Super Admin with email and password.
 * Returns JWT tokens and user profile.
 *
 * @param {string} email - Super Admin email
 * @param {string} password - Super Admin password
 * @returns {Promise<SuperAdminLoginResponse>} JWT tokens and profile
 */
app.post('/login',
  zValidator('json', SuperAdminLoginSchema),
  superAdminSecurityHeaders,
  async (c) => {
    const { email, password } = c.req.valid('json');
    const authService = new SuperAdminAuthService();

    try {
      const result = await authService.authenticate(email, password);

      // Log successful login
      console.log(`[SUPER_ADMIN_LOGIN_SUCCESS] ${email} from ${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'Unknown'}`);

      // Set HTTP-only cookie for refresh token (optional)
      c.header('Set-Cookie', `refresh_token=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/super-admin/auth/refresh; Max-Age=604800`);

      return c.json<ApiResponse>({
        success: true,
        data: result,
        message: 'Login successful',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    } catch (error) {
      // Log failed login attempt
      console.log(`[SUPER_ADMIN_LOGIN_FAILED] ${email} from ${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'Unknown'}`);
      throw error;
    }
  }
);

/**
 * POST /api/super-admin/auth/refresh
 *
 * Refresh JWT tokens using refresh token.
 * Can use refresh token from request body or HTTP-only cookie.
 *
 * @param {string} refreshToken - Refresh token (optional, can use cookie)
 * @returns {Promise<SuperAdminLoginResponse>} New JWT tokens and profile
 */
app.post('/refresh',
  zValidator('json', RefreshTokenSchema).optional(),
  superAdminSecurityHeaders,
  async (c) => {
    // Try to get refresh token from body first, then from cookie
    const body = c.req.valid('json') || {};
    let refreshToken = body.refreshToken;

    if (!refreshToken) {
      // Try to get from cookie
      const cookieHeader = c.req.header('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        refreshToken = cookies.refresh_token;
      }
    }

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    const authService = new SuperAdminAuthService();
    const result = await authService.refreshTokens(refreshToken);

    // Update HTTP-only cookie
    c.header('Set-Cookie', `refresh_token=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/super-admin/auth/refresh; Max-Age=604800`);

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: 'Tokens refreshed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * POST /api/super-admin/auth/logout
 *
 * Logout Super Admin by invalidating tokens.
 * Requires authentication.
 *
 * @returns {Promise<ApiResponse>} Logout confirmation
 */
app.post('/logout',
  superAdminSecurityHeaders,
  superAdminAuthMiddleware,
  superAdminActivityLogger,
  async (c) => {
    // Clear refresh token cookie
    c.header('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/super-admin/auth/refresh; Max-Age=0');

    return c.json<ApiResponse>({
      success: true,
      message: 'Logout successful',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/auth/me
 *
 * Get current Super Admin profile.
 * Requires authentication.
 *
 * @returns {Promise<ApiResponse<SuperAdminProfile>>} Current Super Admin profile
 */
app.get('/me',
  superAdminSecurityHeaders,
  superAdminAuthMiddleware,
  async (c) => {
    const superAdmin = getSuperAdmin(c);

    return c.json<ApiResponse>({
      success: true,
      data: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        lastLoginAt: superAdmin.lastLoginAt,
        createdAt: superAdmin.createdAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * PUT /api/super-admin/auth/change-password
 *
 * Change Super Admin password.
 * Requires authentication and current password verification.
 *
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<ApiResponse>} Password change confirmation
 */
app.put('/change-password',
  superAdminSecurityHeaders,
  superAdminAuthMiddleware,
  superAdminActivityLogger,
  zValidator('json', PasswordChangeSchema),
  async (c) => {
    const { currentPassword, newPassword } = c.req.valid('json');
    const superAdmin = getSuperAdmin(c);
    const authService = new SuperAdminAuthService();

    await authService.updatePassword(superAdmin.id, currentPassword, newPassword);

    // Log password change
    console.log(`[SUPER_ADMIN_PASSWORD_CHANGED] ${superAdmin.email} from ${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'Unknown'}`);

    return c.json<ApiResponse>({
      success: true,
      message: 'Password changed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/auth/verify-token
 *
 * Verify JWT token validity.
 * Does not require authentication (used for client-side token validation).
 *
 * @param {string} token - JWT token to verify
 * @returns {Promise<ApiResponse<{valid: boolean, payload?: any}>>} Token verification result
 */
app.get('/verify-token',
  superAdminSecurityHeaders,
  async (c) => {
    const token = c.req.query('token') || c.req.header('authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Token is required',
        data: { valid: false },
      });
    }

    const authService = new SuperAdminAuthService();

    try {
      const payload = authService.verifyToken(token);
      return c.json<ApiResponse>({
        success: true,
        data: { valid: true, payload },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    } catch (error) {
      return c.json<ApiResponse>({
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
        data: { valid: false },
      });
    }
  }
);

/**
 * POST /api/super-admin/auth/setup
 *
 * Create initial Super Admin (for system setup).
 * Only works when no Super Admin exists.
 *
 * @param {string} name - Super Admin name
 * @param {string} email - Super Admin email
 * @param {string} password - Super Admin password
 * @param {string} role - Super Admin role (super_admin or support)
 * @returns {Promise<ApiResponse<SuperAdmin>>} Created Super Admin
 */
app.post('/setup',
  superAdminSecurityHeaders,
  zValidator('json', SuperAdminCreateSchema),
  async (c) => {
    const { name, email, password, role } = c.req.valid('json');
    const authService = new SuperAdminAuthService();

    // Check if any Super Admin already exists
    const existingAdminCount = await prisma.superAdmin.count();
    if (existingAdminCount > 0) {
      throw new UnauthorizedError('System already initialized. Contact existing Super Admin.');
    }

    const superAdmin = await authService.createSuperAdmin({
      name,
      email,
      password,
      role,
    });

    console.log(`[SUPER_ADMIN_SETUP_COMPLETED] ${email} (${role})`);

    return c.json<ApiResponse>({
      success: true,
      data: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
        createdAt: superAdmin.createdAt,
      },
      message: 'Super Admin created successfully. System is now ready.',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

/**
 * GET /api/super-admin/auth/setup-status
 *
 * Check if system has been initialized.
 *
 * @returns {Promise<ApiResponse<{initialized: boolean, adminCount: number}>>} Setup status
 */
app.get('/setup-status',
  superAdminSecurityHeaders,
  async (c) => {
    const adminCount = await prisma.superAdmin.count();

    return c.json<ApiResponse>({
      success: true,
      data: {
        initialized: adminCount > 0,
        adminCount,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  }
);

export default app;