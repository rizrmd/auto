#!/usr/bin/env bun

/**
 * Create admin user for tenant 1 (autoleads-motors)
 */

import { PrismaClient } from './generated/prisma';
import { AuthService } from './backend/src/services/auth.service';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const authService = new AuthService();

    // Create admin user for tenant 1
    const hashedPassword = await authService.hashPassword('admin123456');

    const adminUser = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: 3,
          email: 'admin@autolumiku.com'
        }
      },
      update: {},
      create: {
        tenantId: 3,
        name: 'Admin AutoLeads',
        email: 'admin@autolumiku.com',
        passwordHash: hashedPassword,
        phone: '+628123456789',
        whatsappNumber: '+628123456789',
        role: 'admin',
        status: 'active',
      }
    });

    console.log('✅ Admin user created for tenant 3:', adminUser.email);

    // Test authentication
    const loginResult = await authService.authenticate(
      'admin@autolumiku.com',
      'admin123456',
      3
    );

    console.log('✅ Authentication test successful');
    console.log('Token:', loginResult.token.substring(0, 50) + '...');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();