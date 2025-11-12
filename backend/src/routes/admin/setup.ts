/**
 * Admin Setup Routes
 * Quick setup endpoint for creating admin users
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../db';
import { AuthService } from '../../services/auth.service';
import { asyncHandler } from '../../middleware/error-handler';
import type { ApiResponse } from '../../types/context';

const setupAdmin = new Hono();

// Schema for creating admin user
const CreateAdminSchema = z.object({
  tenantName: z.string().min(1),
  tenantSlug: z.string().min(1),
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
  adminPassword: z.string().min(6),
});

/**
 * POST /api/admin/setup
 * Quick setup endpoint to create tenant and admin user
 */
setupAdmin.post(
  '/setup',
  asyncHandler(async (c) => {
    try {
      const body = CreateAdminSchema.parse(await c.req.json());

      // Create tenant if not exists
      let tenant = await prisma.tenant.findUnique({
        where: { slug: body.tenantSlug }
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: body.tenantName,
            slug: body.tenantSlug,
            subdomain: body.tenantSlug,
            phone: body.tenantPhone || '+628123456789', // Use provided phone or default
            whatsappNumber: null, // Will be set when WhatsApp is paired - allow any number
            whatsappBotEnabled: true,
            primaryColor: '#FF5722',
            secondaryColor: '#000000',
            status: 'active',
            plan: 'pro',
          }
        });
      }

      // Check if admin user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.adminEmail,
          tenantId: tenant.id
        }
      });

      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'Admin user already exists for this tenant',
          }
        };
        return c.json(response, 409);
      }

      // Create admin user
      const authService = new AuthService();
      const hashedPassword = await authService.hashPassword(body.adminPassword);

      const adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: body.adminName,
          email: body.adminEmail,
          passwordHash: hashedPassword,
          phone: body.adminPhone || '+628123456789', // Use provided admin phone or default
          whatsappNumber: body.adminPhone || '+628123456789', // Use provided admin phone or default
          role: 'admin',
          status: 'active',
        }
      });

      // Create login response
      const loginResponse = await authService.authenticate(
        adminUser.email,
        body.adminPassword,
        tenant.id
      );

      const response: ApiResponse = {
        success: true,
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            subdomain: tenant.subdomain,
          },
          user: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            status: adminUser.status,
          },
          loginResponse,
        },
      };

      return c.json(response);

    } catch (error) {
      console.error('Setup error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SETUP_ERROR',
          message: 'Failed to setup admin account',
        }
      };
      return c.json(response, 500);
    }
  })
);

/**
 * GET /api/admin/setup/status
 * Check if admin setup is needed
 */
setupAdmin.get(
  '/setup/status',
  asyncHandler(async (c) => {
    try {
      const adminUsersCount = await prisma.user.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          needsSetup: adminUsersCount === 0,
          adminUsersCount,
        }
      };

      return c.json(response);

    } catch (error) {
      console.error('Setup status error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SETUP_STATUS_ERROR',
          message: 'Failed to check setup status',
        }
      };
      return c.json(response, 500);
    }
  })
);

export default setupAdmin;