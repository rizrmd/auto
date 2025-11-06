#!/usr/bin/env bun

/**
 * Check existing users for both tenants
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Check users for tenant 1 (autoleads-motors)
    const users1 = await prisma.user.findMany({
      where: { tenantId: 1 },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });

    console.log('Users for tenant 1 (autoleads-motors):');
    users1.forEach(u => {
      console.log(`- ${u.name} (${u.email}): ${u.role}, ${u.status}`);
    });

    // Check users for tenant 5 (autolumiku)
    const users5 = await prisma.user.findMany({
      where: { tenantId: 5 },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });

    console.log('\nUsers for tenant 5 (autolumiku):');
    users5.forEach(u => {
      console.log(`- ${u.name} (${u.email}): ${u.role}, ${u.status}`);
    });

    // Try to find admin@autolumiku.com user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@autolumiku.com' },
      include: { tenant: true }
    });

    console.log('\nAdmin user details:', adminUser);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();