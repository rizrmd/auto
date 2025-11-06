#!/usr/bin/env bun

/**
 * Fix tenant domain mapping
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function fixTenant() {
  try {
    // Update tenant to have customDomain pointing to auto.lumiku.com
    const tenant = await prisma.tenant.updateMany({
      where: { slug: 'autolumiku' },
      data: {
        customDomain: 'auto.lumiku.com',
        customDomainVerified: true,
      }
    });

    console.log('Updated tenant:', tenant.count);

    // Verify the update
    const updated = await prisma.tenant.findFirst({
      where: { slug: 'autolumiku' }
    });

    console.log('Tenant details:', {
      id: updated?.id,
      name: updated?.name,
      slug: updated?.slug,
      subdomain: updated?.subdomain,
      customDomain: updated?.customDomain,
      customDomainVerified: updated?.customDomainVerified,
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTenant();