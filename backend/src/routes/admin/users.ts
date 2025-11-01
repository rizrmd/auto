/**
 * Admin Users Routes
 *
 * Handles user management for tenant admin.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../db';
import { AuthService } from '../../services/auth.service';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { asyncHandler } from '../../middleware/error-handler';
import { authMiddleware, requireAdmin } from '../../middleware/auth';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse, AdminContext } from '../../types/context';

const adminUsers = new Hono();

// Apply tenant middleware and authentication
adminUsers.use('*', tenantMiddleware);
adminUsers.use('*', authMiddleware);
adminUsers.use('*', requireAdmin);

/**
 * GET /api/admin/users
 * Get all users for the current tenant
 */
adminUsers.get(
  '/',
  asyncHandler(async (c: AdminContext) => {
    const tenant = getTenant(c);
    const user = c.get('user');

    // Only allow admin/sales roles to view users
    if (!['admin', 'owner'].includes(user.role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      return c.json(response, HTTP_STATUS.FORBIDDEN);
    }

    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        users,
        total: users.length,
      },
    };

    return c.json(response);
  })
);

/**
 * POST /api/admin/users
 * Create a new user for the tenant
 */
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  role: z.enum(['admin', 'sales']),
  password: z.string().min(6),
});

adminUsers.post(
  '/',
  asyncHandler(async (c: AdminContext) => {
    const tenant = getTenant(c);
    const user = c.get('user');

    // Only allow admin/owner roles to create users
    if (!['admin', 'owner'].includes(user.role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      return c.json(response, HTTP_STATUS.FORBIDDEN);
    }

    const body = await c.req.json();
    const validatedData = CreateUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        },
      };
      return c.json(response, HTTP_STATUS.CONFLICT);
    }

    // Hash password
    const authService = new AuthService();
    const hashedPassword = await authService.hashPassword(validatedData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '+628123456789',
        whatsappNumber: validatedData.whatsappNumber || validatedData.phone || '+628123456789',
        passwordHash: hashedPassword,
        role: validatedData.role,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: newUser,
    };

    return c.json(response, HTTP_STATUS.CREATED);
  })
);

/**
 * PUT /api/admin/users/:id
 * Update an existing user
 */
const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  role: z.enum(['admin', 'sales']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

adminUsers.put(
  '/:id',
  asyncHandler(async (c: AdminContext) => {
    const tenant = getTenant(c);
    const user = c.get('user');
    const userId = parseInt(c.req.param('id'));

    // Only allow admin/owner roles to update users
    if (!['admin', 'owner'].includes(user.role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      return c.json(response, HTTP_STATUS.FORBIDDEN);
    }

    const body = await c.req.json();
    const validatedData = UpdateUserSchema.parse(body);

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedUser,
    };

    return c.json(response);
  })
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user (soft delete by setting status to inactive)
 */
adminUsers.delete(
  '/:id',
  asyncHandler(async (c: AdminContext) => {
    const tenant = getTenant(c);
    const user = c.get('user');
    const userId = parseInt(c.req.param('id'));

    // Only allow admin/owner roles to delete users
    if (!['admin', 'owner'].includes(user.role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      return c.json(response, HTTP_STATUS.FORBIDDEN);
    }

    // Prevent self-deletion
    if (userId === user.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Soft delete by setting status to inactive
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'inactive' },
    });

    const response: ApiResponse = {
      success: true,
      data: { message: 'User deleted successfully' },
    };

    return c.json(response);
  })
);

export default adminUsers;