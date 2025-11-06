#!/usr/bin/env bun

/**
 * Check all tenants
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        customDomainVerified: true,
        status: true,
      }
    });

    console.log('All tenants:');
    tenants.forEach(t => {
      console.log(`- ${t.name} (${t.slug}): subdomain=${t.subdomain}, customDomain=${t.customDomain}, verified=${t.customDomainVerified}`);
    });

    // Also check our autolumiku tenant specifically
    const autolumiku = await prisma.tenant.findFirst({
      where: { slug: 'autolumiku' }
    });

    console.log('\nAutolumiku tenant:', autolumiku);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants();