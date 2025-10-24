import { Hono } from 'hono';
import { asyncHandler } from '../middleware/error-handler';
import { prisma } from '../db';
import { NotFoundError } from '../middleware/error-handler';

const tenantRoutes = new Hono();

// GET /api/tenant - Get tenant by domain
tenantRoutes.get('/', asyncHandler(async (c) => {
  const hostname = c.req.header('host') || '';
  const domain = hostname.split(':')[0]; // Remove port if present

  console.log('[TENANT] Looking up tenant for domain:', domain);

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: { equals: domain, mode: 'insensitive' } },
        { customDomain: { equals: domain, mode: 'insensitive' } },
      ],
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      businessHours: true,
    },
  });

  if (!tenant) {
    console.error('[TENANT] Tenant not found for domain:', domain);
    throw new NotFoundError(`Tenant not found for domain: ${domain}`);
  }

  console.log('[TENANT] Found tenant:', tenant.slug);

  return c.json({
    success: true,
    data: tenant,
  });
}));

// GET /api/tenant/:id - Get tenant by ID (for admin)
tenantRoutes.get('/:id', asyncHandler(async (c) => {
  const id = parseInt(c.req.param('id'));

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      businessHours: true,
      status: true,
      plan: true,
    },
  });

  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  return c.json({
    success: true,
    data: tenant,
  });
}));

export default tenantRoutes;
