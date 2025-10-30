/**
 * Super Admin Authentication Middleware
 *
 * JWT-based authentication for Super Admin routes.
 * Provides role-based access control for global system administration.
 */

import type { Context, Next } from 'hono';
import { UnauthorizedError, ForbiddenError } from './error-handler';
import { SuperAdminAuthService } from '../../services/super-admin-auth.service';
import { MESSAGES } from '../../config/constants';
import type { SuperAdmin } from '../../../generated/prisma';
import { prisma } from '../../db';

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
 * Super Admin Authentication Middleware
 *
 * Verifies JWT token and attaches Super Admin to context.
 * Uses separate authentication from tenant admins.
 */
export async function superAdminAuthMiddleware(c: Context, next: Next) {
  const authService = new SuperAdminAuthService();

  // Extract token
  const token = extractToken(c);

  if (!token) {
    throw new UnauthorizedError(MESSAGES.UNAUTHORIZED);
  }

  try {
    // Verify token
    const payload = authService.verifyToken(token);

    // Get Super Admin from database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: {
        id: payload.superAdminId,
      },
    });

    if (!superAdmin) {
      throw new UnauthorizedError('Super Admin not found');
    }

    // Check if Super Admin is active
    if (superAdmin.status !== 'active') {
      throw new UnauthorizedError('Super Admin account is inactive');
    }

    // Attach Super Admin to context
    c.set('superAdmin', superAdmin);

    // Add Super Admin info to response headers
    c.header('X-Super-Admin-Id', superAdmin.id.toString());
    c.header('X-Super-Admin-Role', superAdmin.role);

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

    throw new UnauthorizedError('Super Admin authentication failed');
  }
}

/**
 * Super Admin role-based authorization middleware
 *
 * Checks if authenticated Super Admin has required role.
 */
export function requireSuperAdminRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const superAdmin = c.get('superAdmin') as SuperAdmin | undefined;

    if (!superAdmin) {
      throw new UnauthorizedError('Super Admin authentication required');
    }

    if (!allowedRoles.includes(superAdmin.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    await next();
  };
}

/**
 * Super Admin only middleware
 */
export const requireSuperAdmin = requireSuperAdminRole('super_admin');

/**
 * Support role middleware (Super Admin or Support)
 */
export const requireSupport = requireSuperAdminRole('super_admin', 'support');

/**
 * Helper to get authenticated Super Admin from context
 */
export function getSuperAdmin(c: Context): SuperAdmin {
  const superAdmin = c.get('superAdmin');
  if (!superAdmin) {
    throw new Error('Super Admin not found in context. Did you forget to use superAdminAuthMiddleware?');
  }
  return superAdmin;
}

/**
 * Helper to get optional Super Admin from context
 */
export function getOptionalSuperAdmin(c: Context): SuperAdmin | undefined {
  return c.get('superAdmin');
}

/**
 * Activity logging middleware for Super Admin actions
 *
 * Logs all Super Admin actions for audit trail.
 */
export async function superAdminActivityLogger(c: Context, next: Next) {
  const superAdmin = getOptionalSuperAdmin(c);
  const startTime = Date.now();

  // Get request details
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('user-agent') || 'Unknown';
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'Unknown';

  // Log the action
  console.log(`[SUPER_ADMIN_ACTIVITY] ${superAdmin?.email || 'Anonymous'} ${method} ${path}`, {
    superAdminId: superAdmin?.id,
    email: superAdmin?.email,
    role: superAdmin?.role,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  await next();

  // Log completion
  const duration = Date.now() - startTime;
  const status = c.res.status;

  console.log(`[SUPER_ADMIN_ACTIVITY] ${method} ${path} - ${status} (${duration}ms)`, {
    superAdminId: superAdmin?.id,
    duration,
    status,
  });
}

/**
 * Security headers middleware for Super Admin routes
 *
 * Adds security headers for admin panel protection.
 */
export async function superAdminSecurityHeaders(c: Context, next: Next) {
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'");

  // Admin specific headers
  c.header('X-Super-Admin-Panel', 'true');

  await next();
}