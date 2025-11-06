#!/usr/bin/env bun

/**
 * Check tenant IDs
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkTenantIds() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        customDomain: true,
      }
    });

    console.log('All tenants with IDs:');
    tenants.forEach(t => {
      console.log(`ID: ${t.id} - ${t.name} (${t.slug}) - subdomain: ${t.subdomain} - customDomain: ${t.customDomain}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantIds();