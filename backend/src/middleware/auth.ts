/**
 * Authentication Middleware
 *
 * JWT-based authentication for admin routes.
 */

import type { Context, Next } from 'hono';
import { UnauthorizedError, ForbiddenError } from './error-handler';
import { AuthService } from '../services/auth.service';
import { MESSAGES } from '../config/constants';
import type { User } from '../../../generated/prisma';
import { prisma } from '../db';

/**
 * Extract JWT token from Authorization header
 */
function extractToken(c: Context): string | null {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');

  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * JWT Authentication Middleware
 *
 * Verifies JWT token and attaches user to context.
 * Requires tenant to be set in context.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authService = new AuthService();

  // Extract token
  const token = extractToken(c);

  if (!token) {
    throw new UnauthorizedError(MESSAGES.UNAUTHORIZED);
  }

  try {
    // Verify token
    const payload = authService.verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is inactive');
    }

    // Verify tenant matches (if tenant is in context)
    const tenant = c.get('tenant');
    if (tenant && user.tenantId !== tenant.id) {
      throw new ForbiddenError('User does not belong to this tenant');
    }

    // Attach user to context
    c.set('user', user);

    // Add user info to response headers
    c.header('X-User-Id', user.id.toString());
    c.header('X-User-Role', user.role);

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }

    // Handle JWT errors
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError(MESSAGES.INVALID_TOKEN);
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError(MESSAGES.TOKEN_EXPIRED);
      }
    }

    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Role-based authorization middleware
 *
 * Checks if authenticated user has required role.
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User | undefined;

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    await next();
  };
}

/**
 * Owner role middleware
 */
export const requireOwner = requireRole('owner');

/**
 * Admin role middleware (owner or admin)
 */
export const requireAdmin = requireRole('owner', 'admin');

/**
 * Sales role middleware (any authenticated user)
 */
export const requireSales = requireRole('owner', 'admin', 'sales');

/**
 * Helper to get authenticated user from context
 */
export function getUser(c: Context): User {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not found in context. Did you forget to use authMiddleware?');
  }
  return user;
}

/**
 * Helper to get optional user from context
 */
export function getOptionalUser(c: Context): User | undefined {
  return c.get('user');
}

/**
 * Check if user owns a resource
 */
export function checkOwnership(userId: number, resourceUserId: number): void {
  if (userId !== resourceUserId) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
}

/**
 * Check if user can access tenant resource
 */
export function checkTenantAccess(user: User, tenantId: number): void {
  if (user.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to access this tenant');
  }
}

/**
 * API Key Authentication Middleware (for webhooks)
 */
export function apiKeyAuth(validApiKeys: string[]) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('x-api-key') || c.req.query('api_key');

    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedError('Invalid API key');
    }

    await next();
  };
}
