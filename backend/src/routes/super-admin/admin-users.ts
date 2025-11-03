/**
 * Super Admin Admin Users Management Routes
 *
 * Handles global admin user management across all tenants for super admins.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { superAdminAuthMiddleware, requireSuperAdmin } from '../../middleware/super-admin-auth';
import { HTTP_STATUS, MESSAGES } from '../../config/constants';
import type { ApiResponse, SuperAdminContext } from '../../types/super-admin';

const adminUsers = new Hono();

// Apply super admin authentication
adminUsers.use('*', superAdminAuthMiddleware);
adminUsers.use('*', requireSuperAdmin);

/**
 * GET /api/super-admin/admin-users
 * Get all admin users across all tenants
 */
adminUsers.get(
  '/',
  asyncHandler(async (c: SuperAdminContext) => {
    const superAdmin = c.get('superAdmin');

    // Get all admin users across all tenants
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['owner', 'admin', 'sales']
        }
      },
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
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
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
 * GET /api/super-admin/admin-users/:id
 * Get a specific admin user
 */
adminUsers.get(
  '/:id',
  asyncHandler(async (c: SuperAdminContext) => {
    const userId = parseInt(c.req.param('id'));

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: {
          in: ['owner', 'admin', 'sales']
        }
      },
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
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Admin user not found',
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    return c.json(response);
  })
);

/**
 * POST /api/super-admin/admin-users
 * Create a new admin user (for any tenant)
 */
const CreateAdminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  role: z.enum(['owner', 'admin', 'sales']),
  password: z.string().min(6),
  tenantId: z.number(),
  status: z.enum(['active', 'inactive']).default('active'),
});

adminUsers.post(
  '/',
  asyncHandler(async (c: SuperAdminContext) => {
    const body = await c.req.json();
    const validatedData = CreateAdminUserSchema.parse(body);

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Check if user already exists in the tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        tenantId: validatedData.tenantId,
      },
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists in this tenant',
        },
      };
      return c.json(response, HTTP_STATUS.CONFLICT);
    }

    // Hash password
    const { AuthService } = await import('../../services/auth.service');
    const authService = new AuthService();
    const hashedPassword = await authService.hashPassword(validatedData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        tenantId: validatedData.tenantId,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '+628123456789',
        whatsappNumber: validatedData.whatsappNumber || validatedData.phone || '+628123456789',
        passwordHash: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
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
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
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
 * PUT /api/super-admin/admin-users/:id
 * Update an admin user
 */
const UpdateAdminUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  role: z.enum(['owner', 'admin', 'sales']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

adminUsers.put(
  '/:id',
  asyncHandler(async (c: SuperAdminContext) => {
    const userId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const validatedData = UpdateAdminUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: {
          in: ['owner', 'admin', 'sales']
        }
      },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Admin user not found',
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
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
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
 * DELETE /api/super-admin/admin-users/:id
 * Delete an admin user (soft delete by default, permanent delete with ?permanent=true)
 */
adminUsers.delete(
  '/:id',
  asyncHandler(async (c: SuperAdminContext) => {
    const userId = parseInt(c.req.param('id'));
    const superAdmin = c.get('superAdmin');
    const permanent = c.req.query('permanent') === 'true';

    // Prevent self-deletion
    if (userId === superAdmin.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        },
      };
      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: {
          in: ['owner', 'admin', 'sales']
        }
      },
    });

    if (!existingUser) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Admin user not found',
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    if (permanent) {
      // Check for associated data before permanent delete
      const associatedLeads = await prisma.lead.count({
        where: { assignedToUserId: userId }
      });

      if (associatedLeads > 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'HAS_ASSOCIATED_DATA',
            message: `Cannot permanently delete user with ${associatedLeads} associated leads. Reassign leads first or use soft delete.`,
          },
        };
        return c.json(response, HTTP_STATUS.CONFLICT);
      }

      // Permanent delete
      await prisma.user.delete({
        where: { id: userId },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Admin user permanently deleted',
          type: 'permanent'
        },
      };

      return c.json(response);
    } else {
      // Soft delete by setting status to inactive
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'inactive' },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Admin user deactivated successfully',
          type: 'soft'
        },
      };

      return c.json(response);
    }
  })
);

export default adminUsers;