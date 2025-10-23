/**
 * Tenant API Routes
 */

import type { Context } from 'hono';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/tenant - Get current tenant info
 * This would typically get the tenant based on the domain/subdomain
 * For now, we'll return the first tenant
 */
export async function getTenant(c: Context) {
  try {
    // In production, you would get tenant by subdomain from request hostname
    // const hostname = c.req.header('host');
    // const subdomain = hostname?.split('.')[0];

    // For now, get the first tenant
    const tenant = await prisma.tenant.findFirst({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        phone: true,
        whatsappNumber: true,
        email: true,
        address: true,
        city: true,
        mapsUrl: true,
        businessHours: true,
      },
    });

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    return c.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return c.json({ error: 'Failed to fetch tenant information' }, 500);
  }
}

/**
 * GET /api/tenant/:id - Get tenant by ID
 */
export async function getTenantById(c: Context) {
  try {
    const id = parseInt(c.req.param('id'));

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        phone: true,
        whatsappNumber: true,
        email: true,
        address: true,
        city: true,
        mapsUrl: true,
        businessHours: true,
      },
    });

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    return c.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return c.json({ error: 'Failed to fetch tenant information' }, 500);
  }
}
